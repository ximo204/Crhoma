// Resumen poblacional para el panel de analítica de CODEAPA.
//
// Se calcula en el servidor sobre los mismos pacientes que muestra la tabla
// (ver obtenerPagina en listaPacientes.ts), así el análisis y la tabla siempre
// responden a los mismos filtros. Este archivo no importa nada de servidor:
// el panel (componente de cliente) usa de aquí las bandas y los tipos.

export const BANDAS_HBA1C = [
  { etiqueta: "<7%", test: (v: number) => v < 7 },
  { etiqueta: "7–8%", test: (v: number) => v >= 7 && v < 8 },
  { etiqueta: "8–9%", test: (v: number) => v >= 8 && v < 9 },
  { etiqueta: ">9%", test: (v: number) => v >= 9 },
];

export interface DatosEstadisticosPaciente {
  tipoDiabetes: string | null;
  /** HbA1c con valor, la más reciente primero; `periodo` o, si falta, el año. */
  glicadas: { periodo: string; hba1c: number }[];
}

export interface ResumenEstadisticas {
  totalPacientes: number;
  /** HbA1c media de cada período, en orden cronológico. */
  tendencia: { periodo: string; media: number }[];
  /** Pacientes en cada banda de BANDAS_HBA1C según su última HbA1c. */
  bandas: number[];
  /** Pacientes por valor de tipoDiabetes ("" = sin especificar). */
  tipos: Record<string, number>;
}

export function resumirEstadisticas(pacientes: DatosEstadisticosPaciente[]): ResumenEstadisticas {
  const porPeriodo = new Map<string, { suma: number; n: number }>();
  const bandas = BANDAS_HBA1C.map(() => 0);
  const tipos: Record<string, number> = {};

  for (const p of pacientes) {
    for (const g of p.glicadas) {
      const actual = porPeriodo.get(g.periodo) ?? { suma: 0, n: 0 };
      actual.suma += g.hba1c;
      actual.n += 1;
      porPeriodo.set(g.periodo, actual);
    }

    const ultima = p.glicadas[0];
    if (ultima?.hba1c) {
      const idx = BANDAS_HBA1C.findIndex((b) => b.test(ultima.hba1c));
      if (idx >= 0) bandas[idx]++;
    }

    const tipo = p.tipoDiabetes ?? "";
    tipos[tipo] = (tipos[tipo] ?? 0) + 1;
  }

  return {
    totalPacientes: pacientes.length,
    tendencia: Array.from(porPeriodo.keys())
      .sort()
      .map((periodo) => {
        const { suma, n } = porPeriodo.get(periodo)!;
        return { periodo, media: Math.round((suma / n) * 10) / 10 };
      }),
    bandas,
    tipos,
  };
}

"use client";

import { useMemo } from "react";
import { ChartCard, SinDatosGrafico } from "@/components/charts/ChartCard";
import { TrendLineChart, type SerieLinea } from "@/components/charts/TrendLineChart";
import { BarChart, type CategoriaBarras } from "@/components/charts/BarChart";
import { DonutChart, type SegmentoDonut } from "@/components/charts/DonutChart";
import { CATEGORICO, SERIE_UNICA } from "@/lib/charts/colores";
import { TIPO_HERIDA_OPTS } from "@/lib/heridas/catalogo";
import type { PacienteHeridasSummary } from "@/lib/heridas/actions";

const ETIQUETAS_ETIOLOGIA = Object.fromEntries(TIPO_HERIDA_OPTS.map((o) => [o.v, o.label]));

const ESTADOS_HERIDA = ["ACTIVA", "CICATRIZADA", "ESTABLE", "DERIVADA"];
const ETIQUETAS_ESTADO: Record<string, string> = {
  ACTIVA: "Activa",
  CICATRIZADA: "Cicatrizada",
  ESTABLE: "Estable",
  DERIVADA: "Derivada",
};

/**
 * Panel de analítica de heridas — el mismo patrón que `PanelEstadisticas.tsx`
 * del lado de Diabetes. No filtra por su cuenta: recibe los pacientes que
 * dejan pasar los filtros de la barra superior (búsqueda, clave médica,
 * enfermería y centro), los mismos que se ven en la lista para elegir.
 */
export function PanelEstadisticasHeridas({ pacientes }: { pacientes: PacienteHeridasSummary[] }) {
  const pacientesConHeridas = useMemo(() => pacientes.filter((p) => p.heridas.length > 0).length, [pacientes]);
  const heridasAmbito = useMemo(() => pacientes.flatMap((p) => p.heridas), [pacientes]);

  // --- 1. Línea de tendencia: RESVECH medio por mes, de todas las valoraciones en el ámbito ---
  const serieTendencia: SerieLinea[] = useMemo(() => {
    const porMes = new Map<string, { suma: number; n: number }>();
    for (const h of heridasAmbito) {
      for (const v of h.historial) {
        if (v.resvechTotal == null) continue;
        const mes = v.fecha.slice(0, 7); // "YYYY-MM"
        const actual = porMes.get(mes) ?? { suma: 0, n: 0 };
        actual.suma += v.resvechTotal;
        actual.n += 1;
        porMes.set(mes, actual);
      }
    }
    const meses = Array.from(porMes.keys()).sort();
    return [
      {
        nombre: "RESVECH medio",
        color: SERIE_UNICA,
        unidad: " pts",
        puntos: meses.map((mes) => {
          const { suma, n } = porMes.get(mes)!;
          const [anio, mesNum] = mes.split("-");
          const etiqueta = new Date(Number(anio), Number(mesNum) - 1, 1).toLocaleDateString("es-ES", {
            month: "short",
            year: "2-digit",
          });
          return { x: etiqueta, y: Math.round((suma / n) * 10) / 10 };
        }),
      },
    ];
  }, [heridasAmbito]);

  // --- 2. Barras: nº de heridas por etiología (solo las presentes, de más a menos) ---
  const categoriasEtiologia: CategoriaBarras[] = useMemo(() => {
    const conteos = new Map<string, number>();
    for (const h of heridasAmbito) {
      conteos.set(h.etiologia, (conteos.get(h.etiologia) ?? 0) + 1);
    }
    return Array.from(conteos.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([etiologia, n]) => ({
        etiqueta: ETIQUETAS_ETIOLOGIA[etiologia] ?? etiologia,
        grupos: [{ nombre: etiologia, valor: n, color: CATEGORICO[0] }],
      }));
  }, [heridasAmbito]);

  // --- 3. Donut: reparto de heridas por estado ---
  const segmentosEstado: SegmentoDonut[] = useMemo(() => {
    const conteos = new Map<string, number>();
    for (const h of heridasAmbito) {
      conteos.set(h.estado, (conteos.get(h.estado) ?? 0) + 1);
    }
    return ESTADOS_HERIDA.map((estado, i) => ({
      etiqueta: ETIQUETAS_ESTADO[estado],
      valor: conteos.get(estado) ?? 0,
      color: CATEGORICO[i],
    }));
  }, [heridasAmbito]);

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Analítica de heridas
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            {heridasAmbito.length} {heridasAmbito.length === 1 ? "herida" : "heridas"} en{" "}
            {pacientesConHeridas} {pacientesConHeridas === 1 ? "paciente" : "pacientes"}
          </h2>
        </div>

        <span className="text-[11px] text-slate-500">Según los filtros de arriba</span>
      </div>

      {heridasAmbito.length === 0 ? (
        <SinDatosGrafico texto="No hay heridas registradas en los pacientes filtrados." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard
            titulo="RESVECH medio por mes"
            subtitulo="De todas las valoraciones del grupo"
            tabla={
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                {serieTendencia[0].puntos.map((p, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium text-slate-700">{p.x}</span>
                    <strong className="text-slate-900">{p.y != null ? `${p.y} pts` : "—"}</strong>
                  </li>
                ))}
              </ul>
            }
          >
            {serieTendencia[0].puntos.length === 0 ? (
              <SinDatosGrafico texto="Sin valoraciones RESVECH registradas en este grupo." />
            ) : (
              <TrendLineChart series={serieTendencia} />
            )}
          </ChartCard>

          <ChartCard
            titulo="Heridas por etiología"
            subtitulo="Recuento por tipo"
            tabla={
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                {categoriasEtiologia.map((c) => (
                  <li key={c.etiqueta} className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium text-slate-700">{c.etiqueta}</span>
                    <strong className="text-slate-900">{c.grupos[0].valor}</strong>
                  </li>
                ))}
              </ul>
            }
          >
            <BarChart categorias={categoriasEtiologia} />
          </ChartCard>

          <ChartCard
            titulo="Heridas por estado"
            tabla={
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                {segmentosEstado
                  .filter((s) => s.valor > 0)
                  .map((s) => (
                    <li key={s.etiqueta} className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-slate-700">{s.etiqueta}</span>
                      <strong className="text-slate-900">{s.valor}</strong>
                    </li>
                  ))}
              </ul>
            }
          >
            <DonutChart
              segmentos={segmentosEstado}
              centroTitulo={String(heridasAmbito.length)}
              centroSubtitulo="heridas"
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

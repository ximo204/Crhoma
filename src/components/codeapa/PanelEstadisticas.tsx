"use client";

import { useMemo } from "react";
import { ChartCard, SinDatosGrafico } from "@/components/charts/ChartCard";
import { TrendLineChart, type SerieLinea } from "@/components/charts/TrendLineChart";
import { BarChart, type CategoriaBarras } from "@/components/charts/BarChart";
import { DonutChart, type SegmentoDonut } from "@/components/charts/DonutChart";
import { CATEGORICO, CATEGORICO_OTROS, ORDINAL_4, SERIE_UNICA } from "@/lib/charts/colores";
import { BANDAS_HBA1C, type ResumenEstadisticas } from "@/lib/codeapa/estadisticas";

const ETIQUETAS_TIPO: Record<string, string> = {
  TIPO_1: "DM tipo 1",
  TIPO_2: "DM tipo 2",
  GESTACIONAL: "Gestacional",
  LADA: "LADA",
  SECUNDARIA_FARMACOS: "Secundaria a fármacos",
  OTRA: "Otra",
};
const ORDEN_TIPOS = ["TIPO_1", "TIPO_2", "GESTACIONAL", "LADA", "SECUNDARIA_FARMACOS", "OTRA"];

/**
 * Panel de analítica de los pacientes filtrados.
 *
 * No filtra por su cuenta: recibe el resumen que calcula el servidor con los
 * mismos filtros que la tabla (clave médica, enfermería, centro, búsqueda y
 * filtros clínicos), así análisis y tabla siempre hablan de los mismos
 * pacientes. Ver resumirEstadisticas en lib/codeapa/estadisticas.ts.
 */
export function PanelEstadisticas({ resumen }: { resumen: ResumenEstadisticas }) {
  const total = resumen.totalPacientes;

  // --- 1. Línea de tendencia: HbA1c medio por período ---
  const serieTendencia: SerieLinea[] = useMemo(
    () => [
      {
        nombre: "HbA1c media",
        color: SERIE_UNICA,
        unidad: "%",
        puntos: resumen.tendencia.map((t) => ({ x: t.periodo, y: t.media })),
      },
    ],
    [resumen]
  );

  // --- 2. Barras: distribución por banda de HbA1c (última lectura de cada paciente) ---
  const categoriasBandas: CategoriaBarras[] = useMemo(
    () =>
      BANDAS_HBA1C.map((b, i) => ({
        etiqueta: b.etiqueta,
        grupos: [{ nombre: b.etiqueta, valor: resumen.bandas[i] ?? 0, color: ORDINAL_4[i] }],
      })),
    [resumen]
  );
  const hayDatosBandas = categoriasBandas.some((c) => c.grupos[0].valor > 0);

  // --- 3. Donut: distribución por tipo de diabetes ---
  const segmentosTipo: SegmentoDonut[] = useMemo(() => {
    let sinEspecificar = 0;
    for (const [tipo, n] of Object.entries(resumen.tipos)) {
      if (!ORDEN_TIPOS.includes(tipo)) sinEspecificar += n;
    }
    const segmentos: SegmentoDonut[] = ORDEN_TIPOS.map((tipo, i) => ({
      etiqueta: ETIQUETAS_TIPO[tipo],
      valor: resumen.tipos[tipo] ?? 0,
      color: CATEGORICO[i],
    }));
    if (sinEspecificar > 0) {
      segmentos.push({ etiqueta: "Sin especificar", valor: sinEspecificar, color: CATEGORICO_OTROS });
    }
    return segmentos;
  }, [resumen]);

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Analítica poblacional
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            Evolución de {total} {total === 1 ? "paciente" : "pacientes"}
          </h2>
        </div>

        <span className="text-[11px] text-slate-500">Según los filtros de arriba</span>
      </div>

      {total === 0 ? (
        <SinDatosGrafico texto="Ningún paciente cumple los filtros elegidos." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard
            titulo="HbA1c media por período"
            subtitulo="Línea de tendencia del grupo"
            tabla={
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                {serieTendencia[0].puntos.map((p) => (
                  <li key={p.x} className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium text-slate-700">{p.x}</span>
                    <strong className="text-slate-900">{p.y != null ? `${p.y}%` : "—"}</strong>
                  </li>
                ))}
              </ul>
            }
          >
            {serieTendencia[0].puntos.length === 0 ? (
              <SinDatosGrafico texto="Sin analíticas de HbA1c registradas en este grupo." />
            ) : (
              <TrendLineChart series={serieTendencia} objetivo={{ valor: 7, etiqueta: "Objetivo <7%" }} />
            )}
          </ChartCard>

          <ChartCard
            titulo="Pacientes por banda de HbA1c"
            subtitulo="Según su última analítica (más oscuro = peor control)"
            tabla={
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                {categoriasBandas.map((c) => (
                  <li key={c.etiqueta} className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium text-slate-700">{c.etiqueta}</span>
                    <strong className="text-slate-900">{c.grupos[0].valor}</strong>
                  </li>
                ))}
              </ul>
            }
          >
            {hayDatosBandas ? (
              <BarChart categorias={categoriasBandas} />
            ) : (
              <SinDatosGrafico texto="Sin analíticas de HbA1c registradas en este grupo." />
            )}
          </ChartCard>

          <ChartCard
            titulo="Pacientes por tipo de diabetes"
            tabla={
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                {segmentosTipo
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
            <DonutChart segmentos={segmentosTipo} centroTitulo={String(total)} centroSubtitulo="pacientes" />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

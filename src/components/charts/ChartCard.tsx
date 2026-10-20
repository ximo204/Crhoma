"use client";

import { useState, type ReactNode } from "react";

/**
 * Envoltorio común de cualquier gráfico del sistema.
 *
 * Cada gráfico lleva su "gemela" de accesibilidad: una tabla con los mismos
 * datos, alcanzable sin pasar el ratón por encima de nada. El botón alterna
 * entre el dibujo y la tabla; nunca se muestran los dos a la vez.
 */
export function ChartCard({
  titulo,
  subtitulo,
  tabla,
  children,
  accionExtra,
}: {
  titulo: string;
  subtitulo?: string;
  /** Vista de tabla equivalente — la gemela de accesibilidad del gráfico. */
  tabla: ReactNode;
  children: ReactNode;
  /** Hueco opcional para un control adicional (p.ej. un selector de cupo). */
  accionExtra?: ReactNode;
}) {
  const [mostrarTabla, setMostrarTabla] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
          {subtitulo && <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>}
        </div>
        <div className="flex items-center gap-2">
          {accionExtra}
          <button
            type="button"
            onClick={() => setMostrarTabla((v) => !v)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
            aria-pressed={mostrarTabla}
          >
            {mostrarTabla ? "Ver gráfico" : "Ver tabla"}
          </button>
        </div>
      </div>

      {mostrarTabla ? tabla : children}
    </div>
  );
}

/** Mensaje consistente para cuando no hay datos suficientes que representar. */
export function SinDatosGrafico({ texto }: { texto?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
      <span className="text-xl">—</span>
      <p className="max-w-xs text-xs text-slate-400">
        {texto ?? "Todavía no hay datos suficientes para dibujar este gráfico."}
      </p>
    </div>
  );
}

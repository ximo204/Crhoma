"use client";

import { useState } from "react";

export interface SegmentoDonut {
  etiqueta: string;
  valor: number;
  color: string;
}

const TAMANO = 200;
const CENTRO = TAMANO / 2;
const RADIO_EXTERIOR = 82;
const RADIO_INTERIOR = 50;
/** Separación angular equivalente a ~2px de hueco en el perímetro exterior. */
const HUECO_RAD = 2 / RADIO_EXTERIOR;

function puntoEnCirculo(radio: number, anguloRad: number) {
  return {
    x: CENTRO + radio * Math.cos(anguloRad),
    y: CENTRO + radio * Math.sin(anguloRad),
  };
}

/** Path de un sector de anillo (donut slice) entre dos ángulos, en radianes. */
function pathSector(anguloInicio: number, anguloFin: number): string {
  const granArco = anguloFin - anguloInicio > Math.PI ? 1 : 0;
  const pExtInicio = puntoEnCirculo(RADIO_EXTERIOR, anguloInicio);
  const pExtFin = puntoEnCirculo(RADIO_EXTERIOR, anguloFin);
  const pIntFin = puntoEnCirculo(RADIO_INTERIOR, anguloFin);
  const pIntInicio = puntoEnCirculo(RADIO_INTERIOR, anguloInicio);

  return [
    `M ${pExtInicio.x} ${pExtInicio.y}`,
    `A ${RADIO_EXTERIOR} ${RADIO_EXTERIOR} 0 ${granArco} 1 ${pExtFin.x} ${pExtFin.y}`,
    `L ${pIntFin.x} ${pIntFin.y}`,
    `A ${RADIO_INTERIOR} ${RADIO_INTERIOR} 0 ${granArco} 0 ${pIntInicio.x} ${pIntInicio.y}`,
    "Z",
  ].join(" ");
}

/**
 * Reparto en anillo — pensado para 2 a 6 categorías reales. Nunca se usa
 * para dos únicas rebanadas (eso es un valor + un estado, no un gráfico):
 * el componente que llama a este decide esa regla antes de montarlo.
 */
export function DonutChart({
  segmentos,
  centroTitulo,
  centroSubtitulo,
}: {
  segmentos: SegmentoDonut[];
  /** Texto grande en el centro del anillo (p.ej. el total). */
  centroTitulo?: string;
  centroSubtitulo?: string;
}) {
  const [activo, setActivo] = useState<number | null>(null);

  const conValor = segmentos.filter((s) => s.valor > 0);
  const total = conValor.reduce((acc, s) => acc + s.valor, 0);

  if (total === 0) {
    return <p className="flex h-40 items-center justify-center text-xs text-slate-400">Sin registros.</p>;
  }

  let acumulado = 0;
  const arcos = conValor.map((s, i) => {
    const anguloInicio = -Math.PI / 2 + (acumulado / total) * 2 * Math.PI;
    acumulado += s.valor;
    const anguloFin = -Math.PI / 2 + (acumulado / total) * 2 * Math.PI;
    const span = anguloFin - anguloInicio;
    // El hueco se recorta por ambos lados, salvo que el segmento sea tan
    // pequeño que el hueco se comería el propio segmento.
    const huecoAplicado = Math.min(HUECO_RAD, span * 0.3);
    return {
      ...s,
      i,
      anguloInicio: anguloInicio + huecoAplicado / 2,
      anguloFin: anguloFin - huecoAplicado / 2,
      anguloMedio: (anguloInicio + anguloFin) / 2,
      porcentaje: (s.valor / total) * 100,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative w-full max-w-[220px] flex-shrink-0">
        <svg viewBox={`0 0 ${TAMANO} ${TAMANO}`} className="w-full" role="img" aria-label="Gráfico de donut">
          {arcos.map((arco) => (
            <path
              key={arco.etiqueta}
              d={pathSector(arco.anguloInicio, arco.anguloFin)}
              fill={arco.color}
              opacity={activo === null || activo === arco.i ? 1 : 0.35}
              onPointerEnter={() => setActivo(arco.i)}
              onPointerLeave={() => setActivo(null)}
              className="cursor-pointer transition-opacity"
            />
          ))}

          {/* Etiquetas directas: solo en segmentos con sitio suficiente (>= 8%) */}
          {arcos
            .filter((a) => a.porcentaje >= 8)
            .map((arco) => {
              const radioEtiqueta = (RADIO_EXTERIOR + RADIO_INTERIOR) / 2;
              const p = puntoEnCirculo(radioEtiqueta, arco.anguloMedio);
              return (
                <text
                  key={arco.etiqueta}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#ffffff"
                  className="pointer-events-none"
                >
                  {Math.round(arco.porcentaje)}%
                </text>
              );
            })}
        </svg>

        {centroTitulo && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-slate-900">{centroTitulo}</span>
            {centroSubtitulo && <span className="text-[10px] font-semibold uppercase text-slate-400">{centroSubtitulo}</span>}
          </div>
        )}

        {activo !== null && (
          <div className="pointer-events-none absolute -bottom-2 left-1/2 w-max max-w-[180px] -translate-x-1/2 translate-y-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs shadow-md">
            <div className="font-semibold text-slate-500">{arcos[activo].etiqueta}</div>
            <strong className="text-slate-900">
              {arcos[activo].valor} ({Math.round(arcos[activo].porcentaje)}%)
            </strong>
          </div>
        )}
      </div>

      {/* Leyenda: siempre presente, es el canal de identidad fiable */}
      <ul className="flex flex-1 flex-col gap-1.5">
        {arcos.map((arco) => (
          <li
            key={arco.etiqueta}
            onPointerEnter={() => setActivo(arco.i)}
            onPointerLeave={() => setActivo(null)}
            className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-xs transition-colors ${
              activo === arco.i ? "bg-slate-50" : ""
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: arco.color }} />
              {arco.etiqueta}
            </span>
            <span className="flex-shrink-0 font-bold text-slate-900">
              {arco.valor} <span className="font-normal text-slate-400">({Math.round(arco.porcentaje)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

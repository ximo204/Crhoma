"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CHROME } from "@/lib/charts/colores";

export interface PuntoSerie {
  /** Etiqueta del eje X (p.ej. una fecha corta o un período). */
  x: string;
  y: number | null;
}

export interface SerieLinea {
  nombre: string;
  color: string;
  unidad?: string;
  puntos: PuntoSerie[];
}

const ANCHO = 600;
const ALTO = 220;
const PAD = { arriba: 16, derecha: 56, abajo: 28, izquierda: 12 };

function ticksLimpios(min: number, max: number, cuenta = 4): number[] {
  if (min === max) return [min];
  const paso = (max - min) / (cuenta - 1);
  const magnitud = Math.pow(10, Math.floor(Math.log10(paso || 1)));
  const pasoLimpio = Math.ceil(paso / magnitud) * magnitud;
  // Nº de pasos fijo desde el inicio, en vez de sumar y comparar contra
  // `max` con un margen de tolerancia — ese margen podía recortar la
  // última marca cuando el paso redondeado la dejaba justo por encima.
  const inicio = Math.floor(min / pasoLimpio) * pasoLimpio;
  const numPasos = Math.ceil((max - inicio) / pasoLimpio);
  const ticks = Array.from({ length: numPasos + 1 }, (_, i) =>
    Math.round((inicio + i * pasoLimpio) * 100) / 100
  );
  // Red de seguridad: nunca devolver marcas repetidas (claves de React).
  return Array.from(new Set(ticks));
}

/**
 * Línea de tendencia — una o dos series sobre un único eje (nunca doble eje:
 * dos magnitudes de escala distinta van en dos gráficos separados).
 *
 * Pensada para pocos puntos (visitas clínicas, no telemetría continua), así
 * que el "crosshair" simplemente ancla al punto más cercano al puntero.
 */
export function TrendLineChart({
  series,
  objetivo,
}: {
  series: SerieLinea[];
  /** Línea de referencia opcional (p.ej. objetivo clínico de HbA1c). */
  objetivo?: { valor: number; etiqueta: string };
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);

  const etiquetasX = series[0]?.puntos.map((p) => p.x) ?? [];
  const n = etiquetasX.length;

  const todosLosValores = series.flatMap((s) => s.puntos.map((p) => p.y)).filter((v): v is number => v != null);
  if (todosLosValores.length === 0 || n === 0) {
    return <p className="flex h-40 items-center justify-center text-xs text-slate-400">Sin registros.</p>;
  }

  let minY = Math.min(...todosLosValores);
  let maxY = Math.max(...todosLosValores);
  if (objetivo) {
    minY = Math.min(minY, objetivo.valor);
    maxY = Math.max(maxY, objetivo.valor);
  }
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  // Un 10% de aire arriba y abajo para que los puntos extremos no toquen el borde.
  const margen = (maxY - minY) * 0.12;
  minY -= margen;
  maxY += margen;

  const anchoPlot = ANCHO - PAD.izquierda - PAD.derecha;
  const altoPlot = ALTO - PAD.arriba - PAD.abajo;

  const xDe = (i: number) => PAD.izquierda + (n === 1 ? anchoPlot / 2 : (i / (n - 1)) * anchoPlot);
  const yDe = (v: number) => PAD.arriba + altoPlot - ((v - minY) / (maxY - minY)) * altoPlot;

  const ticksY = ticksLimpios(minY, maxY);

  function manejarPuntero(e: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const punto = svg.createSVGPoint();
    punto.x = e.clientX;
    punto.y = e.clientY;
    const local = punto.matrixTransform(ctm.inverse());
    let masCercano = 0;
    let distMin = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(xDe(i) - local.x);
      if (d < distMin) {
        distMin = d;
        masCercano = i;
      }
    }
    setIndiceActivo(masCercano);
  }

  const multiSerie = series.length > 1;
  const activo = indiceActivo;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full touch-none"
        role="img"
        aria-label={series.map((s) => s.nombre).join(", ")}
        onPointerMove={manejarPuntero}
        onPointerLeave={() => setIndiceActivo(null)}
      >
        {/* Rejilla horizontal — hairline, sólida, recesiva */}
        {ticksY.map((t) => (
          <g key={t}>
            <line
              x1={PAD.izquierda}
              x2={ANCHO - PAD.derecha}
              y1={yDe(t)}
              y2={yDe(t)}
              stroke={CHROME.rejilla}
              strokeWidth={1}
            />
            <text
              x={ANCHO - PAD.derecha + 8}
              y={yDe(t)}
              dominantBaseline="middle"
              fontSize={10}
              fill={CHROME.tintaMuda}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Línea de objetivo/referencia */}
        {objetivo && (
          <g>
            <line
              x1={PAD.izquierda}
              x2={ANCHO - PAD.derecha}
              y1={yDe(objetivo.valor)}
              y2={yDe(objetivo.valor)}
              stroke={CHROME.tintaMuda}
              strokeWidth={1}
            />
            <text x={PAD.izquierda} y={yDe(objetivo.valor) - 4} fontSize={9.5} fill={CHROME.tintaMuda}>
              {objetivo.etiqueta}
            </text>
          </g>
        )}

        {/* Crosshair vertical en el punto activo */}
        {activo !== null && (
          <line
            x1={xDe(activo)}
            x2={xDe(activo)}
            y1={PAD.arriba}
            y2={ALTO - PAD.abajo}
            stroke={CHROME.eje}
            strokeWidth={1}
          />
        )}

        {/* Series */}
        {series.map((serie) => {
          const puntosValidos = serie.puntos
            .map((p, i) => ({ ...p, i }))
            .filter((p) => p.y != null) as { x: string; y: number; i: number }[];
          if (puntosValidos.length === 0) return null;

          const d = puntosValidos
            .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xDe(p.i)} ${yDe(p.y)}`)
            .join(" ");

          const ultimo = puntosValidos[puntosValidos.length - 1];

          return (
            <g key={serie.nombre}>
              <path d={d} fill="none" stroke={serie.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {puntosValidos.map((p) => (
                <circle
                  key={p.i}
                  cx={xDe(p.i)}
                  cy={yDe(p.y)}
                  r={p.i === activo ? 5 : 4}
                  fill={serie.color}
                  stroke={CHROME.superficie}
                  strokeWidth={2}
                />
              ))}
              {/* Etiqueta directa: solo el último valor de la serie */}
              <text
                x={xDe(ultimo.i) + 7}
                y={yDe(ultimo.y)}
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={700}
                fill={CHROME.tintaPrimaria}
              >
                {ultimo.y}
                {serie.unidad ?? ""}
              </text>
            </g>
          );
        })}

        {/* Eje X */}
        {etiquetasX.map((etq, i) => {
          // Si hay muchos puntos, no se repite una etiqueta por cada uno.
          const salto = Math.ceil(n / 7);
          if (n > 7 && i % salto !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              x={xDe(i)}
              y={ALTO - PAD.abajo + 16}
              textAnchor="middle"
              fontSize={9.5}
              fill={CHROME.tintaMuda}
            >
              {etq}
            </text>
          );
        })}
      </svg>

      {multiSerie && (
        <div className="mt-1 flex flex-wrap gap-3 px-1">
          {series.map((s) => (
            <span key={s.nombre} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              {s.nombre}
            </span>
          ))}
        </div>
      )}

      {activo !== null && (
        <div
          className="pointer-events-none absolute top-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(xDe(activo) / ANCHO) * 100}%`,
            transform: xDe(activo) > ANCHO * 0.7 ? "translateX(-100%)" : undefined,
          }}
        >
          <div className="mb-0.5 font-semibold text-slate-500">{etiquetasX[activo]}</div>
          {series.map((s) => {
            const v = s.puntos[activo]?.y;
            if (v == null) return null;
            return (
              <div key={s.nombre} className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <strong className="text-slate-900">
                  {v}
                  {s.unidad ?? ""}
                </strong>
                {multiSerie && <span className="text-slate-400">{s.nombre}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

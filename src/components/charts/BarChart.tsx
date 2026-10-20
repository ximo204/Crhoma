"use client";

import { useState } from "react";
import { CHROME } from "@/lib/charts/colores";

export interface SubBarra {
  nombre: string;
  valor: number;
  color: string;
}

export interface CategoriaBarras {
  etiqueta: string;
  grupos: SubBarra[];
}

const ANCHO = 600;
const ALTO = 220;
const PAD = { arriba: 20, derecha: 10, abajo: 28, izquierda: 12 };
const GROSOR_MAX = 24;
const HUECO = 2;

/**
 * Rectángulo con las esquinas superiores redondeadas y la base cuadrada
 * (crece desde la línea base, como pide la especificación de barras).
 */
function pathBarraRedondeadaArriba(x: number, y: number, ancho: number, alto: number, radio: number): string {
  const r = Math.max(0, Math.min(radio, ancho / 2, alto / 2));
  if (alto <= 0) return "";
  return [
    `M ${x} ${y + alto}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + ancho - r} ${y}`,
    `Q ${x + ancho} ${y} ${x + ancho} ${y + r}`,
    `L ${x + ancho} ${y + alto}`,
    "Z",
  ].join(" ");
}

function ticksLimpios(max: number, cuenta = 4): number[] {
  if (max <= 0) return [0];
  const paso = max / cuenta;
  const magnitud = Math.pow(10, Math.floor(Math.log10(paso || 1)));
  // Los valores de este gráfico son siempre recuentos de pacientes (enteros),
  // así que el paso nunca baja de 1 — si no, dos marcas distintas podían
  // redondear al mismo entero y generar una clave de React duplicada.
  const pasoLimpio = Math.max(1, Math.ceil(paso / magnitud) * magnitud);
  // Se generan exactamente `cuenta` pasos desde 0 (en vez de ir sumando y
  // comparando contra `max` con un margen de tolerancia): así la última
  // marca es siempre cuenta×pasoLimpio, que por construcción nunca queda
  // por debajo de `max` — antes, el margen de tolerancia podía recortar esa
  // última marca y dejar la escala más baja que el dato real, cortando por
  // arriba las barras más altas.
  const ticks = Array.from({ length: cuenta + 1 }, (_, i) => Math.round(i * pasoLimpio));
  // Red de seguridad: nunca devolver marcas repetidas.
  return Array.from(new Set(ticks));
}

/**
 * Barras verticales — una por categoría, o varias agrupadas por categoría
 * (como PAS/PAD de una misma visita). El color puede ser fijo (una serie
 * nominal) o variar por categoría (una rampa ordinal: más oscuro = peor).
 */
export function BarChart({
  categorias,
  unidad,
  mostrarLeyenda = false,
}: {
  categorias: CategoriaBarras[];
  unidad?: string;
  mostrarLeyenda?: boolean;
}) {
  const [activo, setActivo] = useState<{ cat: number; sub: number } | null>(null);

  const todosLosValores = categorias.flatMap((c) => c.grupos.map((g) => g.valor));
  if (todosLosValores.length === 0) {
    return <p className="flex h-40 items-center justify-center text-xs text-slate-400">Sin registros.</p>;
  }

  const maxY = Math.max(...todosLosValores, 0);
  const ticksY = ticksLimpios(maxY || 1);
  const techoEscala = ticksY[ticksY.length - 1] || 1;

  const anchoPlot = ANCHO - PAD.izquierda - PAD.derecha;
  const altoPlot = ALTO - PAD.arriba - PAD.abajo;
  const anchoCategoria = anchoPlot / categorias.length;

  const yDe = (v: number) => PAD.arriba + altoPlot - (v / techoEscala) * altoPlot;

  const nombresLeyenda = mostrarLeyenda
    ? Array.from(new Set(categorias.flatMap((c) => c.grupos.map((g) => g.nombre))))
    : [];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img" aria-label="Gráfico de barras">
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
          </g>
        ))}
        {/* Línea base */}
        <line
          x1={PAD.izquierda}
          x2={ANCHO - PAD.derecha}
          y1={yDe(0)}
          y2={yDe(0)}
          stroke={CHROME.eje}
          strokeWidth={1}
        />

        {categorias.map((cat, ci) => {
          const nSub = cat.grupos.length;
          const anchoDisponible = anchoCategoria - HUECO * 2;
          const grosor = Math.min(GROSOR_MAX, (anchoDisponible - HUECO * (nSub - 1)) / nSub);
          const anchoGrupo = grosor * nSub + HUECO * (nSub - 1);
          const xInicioGrupo = ci * anchoCategoria + anchoCategoria / 2 - anchoGrupo / 2;

          return (
            <g key={cat.etiqueta}>
              {cat.grupos.map((sub, si) => {
                const x = xInicioGrupo + si * (grosor + HUECO);
                const y = yDe(sub.valor);
                const h = yDe(0) - y;
                const esActivo = activo?.cat === ci && activo?.sub === si;
                return (
                  <g
                    key={sub.nombre}
                    onPointerEnter={() => setActivo({ cat: ci, sub: si })}
                    onPointerLeave={() => setActivo(null)}
                    className="cursor-pointer"
                  >
                    {/* Área de impacto, más generosa que la barra pintada */}
                    <rect x={x - 2} y={PAD.arriba} width={grosor + 4} height={altoPlot} fill="transparent" />
                    <path
                      d={pathBarraRedondeadaArriba(x, y, grosor, Math.max(h, 0), 4)}
                      fill={sub.color}
                      opacity={esActivo ? 0.85 : 1}
                    />
                    {/* Valor en la punta */}
                    <text
                      x={x + grosor / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize={10.5}
                      fontWeight={700}
                      fill={CHROME.tintaPrimaria}
                    >
                      {sub.valor}
                      {unidad ?? ""}
                    </text>
                  </g>
                );
              })}

              <text
                x={ci * anchoCategoria + anchoCategoria / 2}
                y={ALTO - PAD.abajo + 16}
                textAnchor="middle"
                fontSize={9.5}
                fill={CHROME.tintaMuda}
              >
                {cat.etiqueta}
              </text>
            </g>
          );
        })}
      </svg>

      {mostrarLeyenda && nombresLeyenda.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-3 px-1">
          {nombresLeyenda.map((nombre) => {
            const color = categorias.flatMap((c) => c.grupos).find((g) => g.nombre === nombre)?.color;
            return (
              <span key={nombre} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                {nombre}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

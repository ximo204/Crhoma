import React from "react";

export type TipoOndaDoppler =
  | "CALCIFICACION"
  | "TRIFASICA"
  | "TRIFASICA_BIFASICA"
  | "BIFASICA"
  | "MONOFASICA"
  | "MONOFASICA_GRAVE";

export function OndaDopplerSVG({
  tipo,
  width = 140,
  height = 60,
  className = "",
}: {
  tipo: TipoOndaDoppler;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-block overflow-hidden rounded border border-slate-700 bg-black shadow-inner ${className}`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 140 60"
        width="100%"
        height="100%"
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo de rejilla Doppler / ecografía */}
        <defs>
          <pattern id="dopplerGrid" width="14" height="10" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 10" fill="none" stroke="#222" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="140" height="60" fill="#050505" />
        <rect width="140" height="60" fill="url(#dopplerGrid)" />

        {/* Línea base Doppler (eje cero) */}
        <line x1="0" y1="42" x2="140" y2="42" stroke="#555" strokeWidth="0.8" strokeDasharray="2,2" />

        {/* 1. ONDA VARIABLE / CALCIFICACIÓN (> 1.30) */}
        {tipo === "CALCIFICACION" && (
          <g>
            {/* Espectro Doppler difuso */}
            <path
              d="M 10 42 L 25 10 L 35 38 L 45 15 L 55 42 L 70 8 L 80 40 L 92 12 L 105 42 L 118 10 L 130 42"
              fill="rgba(234, 179, 8, 0.18)"
            />
            {/* Trazas Doppler de alta velocidad irregular */}
            <path
              d="M 5 42 L 25 8 L 35 42 L 45 12 L 55 42 L 70 6 L 80 42 L 92 10 L 105 42 L 118 8 L 130 42"
              fill="none"
              stroke="#eab308"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M 15 42 L 25 12 L 32 35 L 42 16 L 50 42 L 68 10 L 76 36 L 90 14 L 100 42"
              fill="none"
              stroke="#fef08a"
              strokeWidth="1"
              opacity="0.8"
            />
          </g>
        )}

        {/* 2. TRIFÁSICA (1.00 - 1.30) */}
        {tipo === "TRIFASICA" && (
          <g>
            {/* Espectro sombreado */}
            <path
              d="M 10 42 Q 22 42 26 8 Q 30 8 34 42 Q 38 54 44 42 Q 48 35 52 42 L 65 42 Q 77 42 81 8 Q 85 8 89 42 Q 93 54 99 42 Q 103 35 107 42 L 130 42"
              fill="rgba(234, 179, 8, 0.15)"
            />
            {/* Trazo trifásico: Pico sistólico agudo + Inversión diastólica + Onda anterógrada tardía */}
            <path
              d="M 10 42 L 22 42 L 26 6 L 34 42 L 39 55 L 44 42 L 48 34 L 52 42 L 65 42 L 77 42 L 81 6 L 89 42 L 94 55 L 99 42 L 103 34 L 107 42 L 130 42"
              fill="none"
              stroke="#eab308"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 23 42 L 26 9 L 32 42 M 78 42 L 81 9 L 87 42"
              fill="none"
              stroke="#fef08a"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* 3. TRIFÁSICA O BIFÁSICA (0.91 - 0.99) */}
        {tipo === "TRIFASICA_BIFASICA" && (
          <g>
            {/* Onda 1 Trifásica + Onda 2 Bifásica transicional */}
            <path
              d="M 10 42 L 24 42 L 28 8 L 36 42 L 40 52 L 44 42 L 48 36 L 52 42 L 70 42 L 84 42 L 88 12 L 96 42 L 101 48 L 105 42 L 128 42"
              fill="none"
              stroke="#eab308"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 10 42 Q 24 42 28 10 Q 34 10 36 42 L 44 42 Q 48 36 52 42 L 70 42 Q 84 42 88 14 Q 94 14 96 42 L 128 42"
              fill="rgba(234, 179, 8, 0.15)"
            />
          </g>
        )}

        {/* 4. BIFÁSICA (0.80 - 0.90) */}
        {tipo === "BIFASICA" && (
          <g>
            {/* Trazo bifásico: Pico sistólico + Pequeña onda anterógrada, sin inversión clara */}
            <path
              d="M 12 42 L 28 42 L 33 14 L 41 42 Q 47 36 53 42 L 72 42 L 88 42 L 93 14 L 101 42 Q 107 36 113 42 L 130 42"
              fill="none"
              stroke="#eab308"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 28 42 Q 31 16 33 16 Q 38 16 41 42 Q 47 36 53 42 L 88 42 Q 91 16 93 16 Q 98 16 101 42 Q 107 36 113 42 Z"
              fill="rgba(234, 179, 8, 0.18)"
            />
          </g>
        )}

        {/* 5. MONOFÁSICA (0.60 - 0.79) */}
        {tipo === "MONOFASICA" && (
          <g>
            {/* Trazo monofásico: Subida lenta, pico redondeado ancho, sin flujo reverso */}
            <path
              d="M 10 42 Q 22 42 34 22 Q 42 20 54 42 L 72 42 Q 84 42 96 22 Q 104 20 116 42 L 130 42"
              fill="rgba(234, 179, 8, 0.2)"
            />
            <path
              d="M 10 42 C 22 42 26 24 36 22 C 44 20 48 36 56 42 L 70 42 C 82 42 86 24 96 22 C 104 20 108 36 116 42 L 130 42"
              fill="none"
              stroke="#eab308"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 6. MONOFÁSICA GRAVE (< 0.60) */}
        {tipo === "MONOFASICA_GRAVE" && (
          <g>
            {/* Trazo monofásico grave: Aplanada, muy baja velocidad, flujo continuo amortiguado */}
            <path
              d="M 8 42 C 22 42 26 32 38 32 C 50 32 54 42 68 42 C 82 42 86 32 98 32 C 110 32 114 42 130 42"
              fill="rgba(239, 68, 68, 0.25)"
            />
            <path
              d="M 8 42 C 22 42 26 32 38 32 C 50 32 54 42 68 42 C 82 42 86 32 98 32 C 110 32 114 42 130 42"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

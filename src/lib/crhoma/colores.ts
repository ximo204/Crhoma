import type { EstadoSemaforo } from "./types";

/**
 * Colores del semáforo CRHOMA.
 *
 * Criterio de diseño clínico: un valor normal no debería "gritar" tanto
 * como uno alterado. Los valores normales se ven neutros (blanco/gris);
 * solo bajo/alto/muy-alto llevan color, para que el ojo vaya directo a lo
 * que necesita atención, no a todo por igual.
 *
 * Los strings de Tailwind están completos (no construidos dinámicamente)
 * para que el escaneo de clases los detecte — ver tailwind.config.ts
 * (content incluye src/lib para que este archivo se escanee).
 */
export const COLORES_ESTADO: Record<
  EstadoSemaforo,
  {
    fondo: string;
    borde: string;
    bordeIzquierdo: string;
    texto: string;
    punto: string;
    etiqueta: string;
  }
> = {
  bajo: {
    fondo: "bg-white hover:bg-sky-50/60",
    borde: "border-slate-200",
    bordeIzquierdo: "border-l-sky-500",
    texto: "text-sky-700",
    punto: "bg-sky-500",
    etiqueta: "Bajo",
  },
  normal: {
    fondo: "bg-white hover:bg-slate-50",
    borde: "border-slate-200",
    bordeIzquierdo: "border-l-slate-200",
    texto: "text-slate-900",
    punto: "bg-emerald-500",
    etiqueta: "Normal",
  },
  alto: {
    fondo: "bg-amber-50 hover:bg-amber-100/70",
    borde: "border-amber-200",
    bordeIzquierdo: "border-l-amber-500",
    texto: "text-amber-800",
    punto: "bg-amber-500",
    etiqueta: "Alto",
  },
  "muy-alto": {
    fondo: "bg-red-50 hover:bg-red-100/70",
    borde: "border-red-200",
    bordeIzquierdo: "border-l-red-500",
    texto: "text-red-800",
    punto: "bg-red-500",
    etiqueta: "Muy alto",
  },
  "sin-datos": {
    fondo: "bg-slate-50/60 hover:bg-slate-100",
    borde: "border-slate-200 border-dashed",
    bordeIzquierdo: "border-l-slate-300",
    texto: "text-slate-400",
    punto: "bg-slate-300",
    etiqueta: "Sin datos",
  },
};

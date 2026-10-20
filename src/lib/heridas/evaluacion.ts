import {
  evaluarTerapiaCompresiva,
  evaluarECQ,
} from "@/lib/crhoma/formulas";
import type { TipoOndaDoppler } from "@/components/codeapa/OndaDopplerSVG";

/* ============================================================
   RESVECH 2.0 (Escala de valoración y cicatrización)
   ============================================================ */

export const RESVECH_SUPERFICIE = [
  { v: 0, pts: 0, label: "0 cm² (completamente epitelizada o cerrada)" },
  { v: 1, pts: 1, label: "< 4 cm²" },
  { v: 2, pts: 2, label: "4 a 16 cm²" },
  { v: 3, pts: 3, label: "17 a 36 cm²" },
  { v: 4, pts: 4, label: "37 a 64 cm²" },
  { v: 5, pts: 5, label: "65 a 100 cm²" },
  { v: 6, pts: 6, label: "> 100 cm²" },
];

export const RESVECH_PROFUNDIDAD = [
  { v: 0, pts: 0, label: "0 · Cicatrizada o epitelizada" },
  { v: 1, pts: 1, label: "1 · Afectación de dermis / tejido celular subcutáneo" },
  { v: 2, pts: 2, label: "2 · Afectación fascias, tendones o hueso visible/palpable" },
  { v: 3, pts: 3, label: "3 · Afectación ósea/articular con fístula o cavitación" },
];

export const RESVECH_BORDES = [
  { v: 0, pts: 0, label: "0 · Borde integrado con el lecho (indistinguible, epitelizando)" },
  { v: 1, pts: 1, label: "1 · Borde definido no socavado ni engrosado" },
  { v: 2, pts: 2, label: "2 · Borde socavado, enrollado o hiperqueratósico" },
];

export const RESVECH_TEJIDO = [
  { v: 0, pts: 0, label: "0 · Epitelización completa", tag: "epitelizacion" },
  { v: 1, pts: 1, label: "1 · Más del 75% de tejido de granulación", tag: "granulacion" },
  { v: 2, pts: 2, label: "2 · 25% a 75% de tejido de granulación", tag: "granulacion" },
  { v: 3, pts: 3, label: "3 · < 25% granulación o predominio de esfácelos", tag: "esfacelo" },
  { v: 4, pts: 4, label: "4 · Tejido necrótico negro/placa dura o escara seca", tag: "necrotico" },
];

export const RESVECH_EXUDADO = [
  { v: 0, pts: 0, label: "0 · Ninguno (lecho seco o herida cerrada)", nivel: "ninguno" },
  { v: 1, pts: 1, label: "1 · Leve (apósito manchado mínimamente)", nivel: "bajo" },
  { v: 2, pts: 2, label: "2 · Moderado (apósito saturado a las 48-72h)", nivel: "moderado" },
  { v: 3, pts: 3, label: "3 · Abundante (fuga de exudado / saturado < 24h)", nivel: "alto" },
];

export const RESVECH_INFECCION_ITEMS = [
  "Eritema perilesional > 2 cm",
  "Calor local aumentado respecto a piel sana",
  "Edema e induración perilesional",
  "Dolor aumentado o de nueva aparición",
  "Exudado purulento o de aspecto espeso",
  "Mal olor persistente tras la limpieza",
  "Tejido de granulación friable que sangra con facilidad",
  "Detención inexplicable de la cicatrización (> 2 semanas)",
  "Presencia de biofilm visible / esfacelos recurrentes",
  "Puentes epiteliales o fístulas perilesionales",
  "Crepitación subcutánea",
  "Aumento súbito del tamaño de la herida",
];

export function calcularResvechTotal({
  superficieIdx,
  profundidadIdx,
  bordesIdx,
  tejidoIdx,
  exudadoIdx,
  infeccionItems,
  infeccionConfirmada,
}: {
  superficieIdx: number;
  profundidadIdx: number;
  bordesIdx: number;
  tejidoIdx: number;
  exudadoIdx: number;
  infeccionItems: boolean[];
  infeccionConfirmada: boolean;
}): { total: number; gravedad: string; color: string; interpretacion: string } {
  let total =
    (RESVECH_SUPERFICIE[superficieIdx]?.pts || 0) +
    (RESVECH_PROFUNDIDAD[profundidadIdx]?.pts || 0) +
    (RESVECH_BORDES[bordesIdx]?.pts || 0) +
    (RESVECH_TEJIDO[tejidoIdx]?.pts || 0) +
    (RESVECH_EXUDADO[exudadoIdx]?.pts || 0);

  const numSignos = infeccionItems.filter(Boolean).length;
  if (infeccionConfirmada) total += 5;
  else if (numSignos >= 3) total += 4;
  else if (numSignos >= 1) total += 2;

  let gravedad: string;
  let color: string;
  let interpretacion: string;

  if (total === 0) {
    gravedad = "Cicatrizada";
    color = "bg-emerald-100 text-emerald-800 ring-emerald-300";
    interpretacion = "Herida cerrada y epitelizada. No requiere tratamiento activo.";
  } else if (total <= 8) {
    gravedad = "Evolución Favorable";
    color = "bg-emerald-50 text-emerald-700 ring-emerald-200";
    interpretacion = "Evolución satisfactoria hacia la cicatrización. Mantener pauta de cuidados.";
  } else if (total <= 17) {
    gravedad = "Evolución Intermedia";
    color = "bg-amber-50 text-amber-800 ring-amber-200";
    interpretacion = "Evolución estacionaria con factores a vigilar. Ajustar apósito según exudado.";
  } else if (total <= 26) {
    gravedad = "Deterioro / Riesgo Alto";
    color = "bg-orange-50 text-orange-800 ring-orange-200";
    interpretacion = "Deterioro significativo. Descartar infección o isquemia arterial.";
  } else {
    gravedad = "Herida Muy Grave";
    color = "bg-red-50 text-red-800 ring-red-200";
    interpretacion = "Puntuación muy elevada. Revaloración urgente y valorar derivación a Cirugía/Vascular.";
  }

  return { total, gravedad, color, interpretacion };
}

/* ============================================================
   EXPLORACIÓN VASCULAR & ITB CON MOTOR CRHOMA
   ============================================================ */

export function calcularITB(
  pasBrazoMayor: number | null,
  pasTobilloMayor: number | null
): { itb: number | null; semaforo: ReturnType<typeof evaluarITBClinico> } {
  if (!pasBrazoMayor || !pasTobilloMayor || pasBrazoMayor <= 0) {
    return { itb: null, semaforo: null };
  }
  const itb = Math.round((pasTobilloMayor / pasBrazoMayor) * 100) / 100;
  return { itb, semaforo: evaluarITBClinico(itb) };
}

export function evaluarITBClinico(itb: number | null) {
  if (itb == null) return null;
  if (itb > 1.3) {
    return {
      estado: "muy-alto",
      etiqueta: "No compresible (>1.30)",
      color: "bg-purple-100 text-purple-900 border-purple-300",
      detalle: "Sugiere calcificación de la media arterial (Monckeberg). ITB no fiable: evaluar Doppler.",
    };
  }
  if (itb >= 0.91) {
    return {
      estado: "normal",
      etiqueta: "Normal (0.91 - 1.30)",
      color: "bg-emerald-100 text-emerald-900 border-emerald-300",
      detalle: "Circulación arterial normal. Compatible con terapia compresiva completa si hay edema/úlcera venosa.",
    };
  }
  if (itb >= 0.8) {
    return {
      estado: "alto",
      etiqueta: "EAP Leve (0.80 - 0.90)",
      color: "bg-lime-100 text-lime-900 border-lime-300",
      detalle: "Enfermedad arterial leve. Compresión fuerte con vigilancia clínica estrecha.",
    };
  }
  if (itb >= 0.6) {
    return {
      estado: "alto",
      etiqueta: "EAP Moderada (0.60 - 0.79)",
      color: "bg-amber-100 text-amber-900 border-amber-300",
      detalle: "Compresión reducida (20-30 mmHg) bajo supervisión especializada.",
    };
  }
  return {
    estado: "muy-alto",
    etiqueta: "EAP Grave (< 0.60)",
    color: "bg-red-100 text-red-900 border-red-300",
    detalle: "Riesgo de isquemia crítica. CONTRAINDICADA la terapia compresiva. Derivación urgente a Vascular.",
  };
}

export function obtenerRecomendacionCompresionCRHOMA(
  itb: number | null,
  doppler: TipoOndaDoppler | null
) {
  // Conexión directa con la fórmula oficial de CRHOMA
  return evaluarTerapiaCompresiva(itb, (doppler as Parameters<typeof evaluarTerapiaCompresiva>[1]) || null);
}

export function obtenerClaudicacionCRHOMA(
  q1: boolean,
  q2: boolean,
  q3: boolean,
  q4: boolean,
  q5: boolean,
  q6: "PANTORRILLA" | "MUSLO_GLUTEO" | "OTRA" | null
) {
  return evaluarECQ({
    q1DolorAlCaminar: q1,
    q2ApareceEnReposo: q2,
    q3ApareceAlSubirCuesta: q3,
    q4ApareceEnLlano: q4,
    q5DesaparaceEnReposo: q5,
    q6Localizacion: q6,
  });
}

/* ============================================================
   TEST DE BUERGER & FONTAINE
   ============================================================ */

export function evaluarTestBuerger(angulo: string, rubor: string, llenadoVenoso: string) {
  if (!angulo && !rubor && !llenadoVenoso) return null;
  const esGrave = angulo === "severo" || rubor === "severo" || llenadoVenoso === "alterado";
  const esModerado = angulo === "moderado" || rubor === "moderado";

  if (esGrave) {
    return {
      resultado: "Test Postural Positivo (Isquemia Grave)",
      color: "bg-red-100 text-red-900 border-red-300",
      conducta: "Signos de hipoperfusión tisular severa. Correlacionar con pulsos e ITB y valorar derivación.",
    };
  }
  if (esModerado) {
    return {
      resultado: "Test Postural Dudoso / Isquemia Moderada",
      color: "bg-amber-100 text-amber-900 border-amber-300",
      conducta: "Palidez precoz y retraso en el llenado capilar. Vigilar perfusión distal.",
    };
  }
  return {
    resultado: "Test Postural Negativo (Normal)",
    color: "bg-emerald-100 text-emerald-900 border-emerald-300",
    conducta: "Coloración rosada mantenida a 90° y tiempo de rubor dependiente normal (<10s).",
  };
}

export const FONTAINE_ESTADIOS: Record<string, { label: string; tono: string }> = {
  I: { label: "Estadio I · Asintomático / sin dolor al caminar", tono: "normal" },
  IIa: { label: "Estadio IIa · Claudicación no invalidante (> 200 metros)", tono: "alto" },
  IIb: { label: "Estadio IIb · Claudicación invalidante (< 200 metros)", tono: "alto" },
  III: { label: "Estadio III · Dolor en reposo / dolor nocturno", tono: "muy-alto" },
  IV: { label: "Estadio IV · Lesiones tróficas, úlcera arterial o gangrena", tono: "muy-alto" },
};

import type { ResultadoCampo } from "@/lib/crhoma/types";
import { buscarCampo, type SeccionFicha } from "./ficha";

export interface ColumnaTabla {
  id: string;
  etiqueta: string;
  grupo: string;
  seccionId: string;
  campoId: string;
}

/**
 * Columnas de la tabla completa de CODEAPA, organizadas exactamente
 * según la estructura solicitada para el seguimiento de enfermería.
 */
export const COLUMNAS_TABLA: ColumnaTabla[] = [
  // FILIACIÓN
  { id: "periodo", etiqueta: "PERIODO", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "periodo" },
  { id: "nuhsa", etiqueta: "NUHSA", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "nuhsa" },
  { id: "sexo", etiqueta: "SEXO", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "sexo" },
  { id: "edad", etiqueta: "EDAD", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "edad" },
  { id: "claveMedica", etiqueta: "CLAVE_MÉDICA", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "claveMedica" },
  { id: "claveEnfermeria", etiqueta: "CLAVE_ENFERMERÍA", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "claveEnfermeria" },
  { id: "claveEquipo", etiqueta: "CLAVE_EQUIPO", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "claveEquipo" },
  { id: "centroSalud", etiqueta: "CENTRO", grupo: "FILIACIÓN", seccionId: "filiacion", campoId: "centroSalud" },

  // DIABETES
  { id: "tipoDiabetes", etiqueta: "TIPO DIAB", grupo: "DIABETES", seccionId: "diabetes", campoId: "tipoDiabetes" },
  { id: "tratamiento", etiqueta: "TRATAMIENTO", grupo: "DIABETES", seccionId: "diabetes", campoId: "tratamiento" },
  { id: "mcgEstado", etiqueta: "MCG", grupo: "DIABETES", seccionId: "diabetes", campoId: "mcgEstado" },
  { id: "embarazo", etiqueta: "EMBARAZO", grupo: "DIABETES", seccionId: "diabetes", campoId: "embarazo" },

  // DATOS ANTROPOMÉTRICOS
  { id: "peso", etiqueta: "PESO", grupo: "DATOS ANTROPOMÉTRICOS", seccionId: "antropometricos", campoId: "peso" },
  { id: "talla", etiqueta: "TALLA", grupo: "DATOS ANTROPOMÉTRICOS", seccionId: "antropometricos", campoId: "talla" },
  { id: "imc", etiqueta: "IMC", grupo: "DATOS ANTROPOMÉTRICOS", seccionId: "antropometricos", campoId: "imc" },
  { id: "perimetroCintura", etiqueta: "PER.CINTURA", grupo: "DATOS ANTROPOMÉTRICOS", seccionId: "antropometricos", campoId: "perimetroCintura" },
  { id: "ica", etiqueta: "I. CINTURA/ALT", grupo: "DATOS ANTROPOMÉTRICOS", seccionId: "antropometricos", campoId: "ica" },

  // ANTECEDENTES
  { id: "tiempoEvolucion", etiqueta: "TIEMPO EVOL.", grupo: "ANTECEDENTES", seccionId: "antecedentes", campoId: "tiempoEvolucion" },
  { id: "antFamiliares", etiqueta: "ANT FAM", grupo: "ANTECEDENTES", seccionId: "antecedentes", campoId: "antFamiliares" },
  { id: "diabetesGestacional", etiqueta: "DIABETES GEST.", grupo: "ANTECEDENTES", seccionId: "antecedentes", campoId: "diabetesGestacional" },

  // OBJETIVOS DE CONTROL GLUCÉMICO
  { id: "glucemiaBasal", etiqueta: "GB", grupo: "OBJETIVOS DE CONTROL GLUCÉMICO", seccionId: "objetivosGlucemicos", campoId: "glucemiaBasal" },
  { id: "perfilControlGlucemico", etiqueta: "FRAGILIDAD / PERFIL", grupo: "OBJETIVOS DE CONTROL GLUCÉMICO", seccionId: "objetivosGlucemicos", campoId: "perfilControlGlucemico" },
  { id: "objetivoHbA1c", etiqueta: "CIFRA OBJETIVO", grupo: "OBJETIVOS DE CONTROL GLUCÉMICO", seccionId: "objetivosGlucemicos", campoId: "objetivoHbA1c" },
  { id: "fechaGB", etiqueta: "FECHA GB", grupo: "OBJETIVOS DE CONTROL GLUCÉMICO", seccionId: "objetivosGlucemicos", campoId: "fechaGB" },

  // T.A.
  { id: "cifraTA", etiqueta: "CIFRA", grupo: "T.A.", seccionId: "ta", campoId: "cifraTA" },
  { id: "fechaTA", etiqueta: "FECHA", grupo: "T.A.", seccionId: "ta", campoId: "fechaTA" },

  // PIE DIABÉTICO
  { id: "pieRealizado", etiqueta: "REALIZADO S/N", grupo: "PIE DIABÉTICO", seccionId: "pie", campoId: "pieRealizado" },
  { id: "pieFecha", etiqueta: "FECHA", grupo: "PIE DIABÉTICO", seccionId: "pie", campoId: "pieFecha" },
  { id: "riesgoPie", etiqueta: "RIESGO PIE", grupo: "PIE DIABÉTICO", seccionId: "pie", campoId: "riesgoPie" },
  { id: "pieProxControl", etiqueta: "PROX. CONTROL", grupo: "PIE DIABÉTICO", seccionId: "pie", campoId: "pieProxControl" },
  { id: "itb", etiqueta: "ITB", grupo: "PIE DIABÉTICO", seccionId: "pie", campoId: "itb" },

  // RETINOGRAFÍA
  { id: "retinoRealizada", etiqueta: "REALIZADA S/N", grupo: "RETINOGRAFÍA", seccionId: "retinografia", campoId: "retinoRealizada" },
  { id: "retinografiaResultado", etiqueta: "RESULTADO", grupo: "RETINOGRAFÍA", seccionId: "retinografia", campoId: "retinografiaResultado" },
  { id: "retinoFecha", etiqueta: "FECHA", grupo: "RETINOGRAFÍA", seccionId: "retinografia", campoId: "retinoFecha" },
  { id: "retinoProxControl", etiqueta: "PROX. CONTROL", grupo: "RETINOGRAFÍA", seccionId: "retinografia", campoId: "retinoProxControl" },

  // GLICADA
  { id: "hba1c", etiqueta: "CIFRA (HbA1c)", grupo: "GLICADA", seccionId: "glicada", campoId: "hba1c" },
  { id: "fechaGlicada", etiqueta: "FECHA", grupo: "GLICADA", seccionId: "glicada", campoId: "fechaGlicada" },
  { id: "glicadaProxControl", etiqueta: "PROX. CONTROL", grupo: "GLICADA", seccionId: "glicada", campoId: "glicadaProxControl" },
];

export interface GrupoColumnas {
  grupo: string;
  columnas: ColumnaTabla[];
}

/** Agrupa las columnas consecutivas del mismo grupo, para la cabecera de dos filas. */
export function agruparColumnas(columnas: ColumnaTabla[]): GrupoColumnas[] {
  const grupos: GrupoColumnas[] = [];
  for (const columna of columnas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.grupo === columna.grupo) {
      ultimo.columnas.push(columna);
    } else {
      grupos.push({ grupo: columna.grupo, columnas: [columna] });
    }
  }
  return grupos;
}

export function extraerFila(secciones: SeccionFicha[]): Record<string, ResultadoCampo | undefined> {
  const fila: Record<string, ResultadoCampo | undefined> = {};
  for (const columna of COLUMNAS_TABLA) {
    fila[columna.id] = buscarCampo(secciones, columna.seccionId, columna.campoId);
  }
  return fila;
}

/** Cuenta cuántas complicaciones están activas y genera resumen interpretado. */
export function contarComplicaciones(secciones: SeccionFicha[]): ResultadoCampo {
  const seccion = secciones.find((s) => s.id === "complicaciones");
  if (!seccion) {
    return { id: "complicacionesActivas", etiqueta: "Complicaciones", valor: null, estado: "sin-datos" };
  }
  const activas = seccion.campos.filter((c) => c.valor === "Sí").length;
  const listaNombres = seccion.campos.filter((c) => c.valor === "Sí").map((c) => c.etiqueta).join(", ");

  return {
    id: "complicacionesActivas",
    etiqueta: "Complicaciones",
    valor: activas,
    estado: activas === 0 ? "normal" : activas <= 2 ? "alto" : "muy-alto",
    interpretacion: activas === 0 ? "Sin complicaciones registradas" : `${activas} activa(s): ${listaNombres}`,
  };
}

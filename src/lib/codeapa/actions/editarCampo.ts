"use server";

import { revalidatePath } from "next/cache";
import { invalidarListaPacientes } from "../listaPacientes";
import { prisma } from "@/lib/prisma";
import type { TablaEditable, TipoEdicion } from "@/lib/crhoma/types";
import { normalizarNUHSA } from "@/lib/importer/parser";

/**
 * Campos de filiación que no pueden quedarse vacíos: son la identidad del
 * paciente. Se pueden corregir, pero no borrar.
 */
const CAMPOS_OBLIGATORIOS = new Set(["nuhsa", "sexo"]);

/** Longitud máxima de un texto largo (notas), para no guardar pegados enormes. */
const MAX_TEXTO_LARGO = 5000;

const CAMPOS_PERMITIDOS: Record<TablaEditable, string[]> = {
  paciente: [
    "nombre",
    "nuhsa",
    "sexo",
    "fechaNacimiento",
    "centroSalud",
    "claveMedica",
    "claveEnfermeria",
    "claveEquipo",
    "tipoDiabetes",
    "tratamientoDiabetes",
    "mcgEstado",
    "mcgIntegracionSAS",
    "mcgRevisionesTrim",
    "embarazo",
    "tiempoEvolucionDiabetes",
    "controlEvolucion",
    "antecedentesFamiliaresDiabetes",
    "diabetesGestacionalPrevia",
    "perfilControlGlucemico",
    "antecedentesFamiliaresECVPrecoz",
    "inmovilizado",
    "viveEnResidencia",
    "notas",
  ],
  medicion: ["pesoKg", "tallaM", "perimetroCinturaCm", "perimetroCaderaCm"],
  controlTA: ["pas", "pad"],
  controlGlicada: ["hba1c"],
  controlRenal: ["fge", "cac", "creatinina", "potasio", "bicarbonato", "pth", "vitaminaD"],
  controlHepatico: [
    "alt",
    "ast",
    "plaquetas",
    "ggt",
    "lsmKpa",
    "capDbM",
    "bilirrubinaTotal",
    "albuminaSerica",
    "inr",
    "serologiasPositivas",
  ],
  exploracionPie: [
    "realizado",
    "monofilamentoNormal",
    "diapasonNormal",
    "deformidad",
    "enfermedadArterialPeriferica",
    "antecedenteUlceraOAmputacion",
    "itb",
    "morfologiaDoppler",
  ],
  retinografia: ["realizada", "resultado"],
  complicaciones: [
    "retinopatiaDiabetica",
    "nefropatiaDiabetica",
    "neuropatiaPeriferica",
    "cardiopatiaIsquemica",
    "enfermedadCerebrovascular",
    "arteriopatiaPeriferica",
    "ulceraPieDiabetico",
    "amputacion",
    "deformidadPieCharcot",
    "insuficienciaCardiaca",
    "enfermedadHepaticaMetabolica",
    "gastroparesiaDiabetica",
    "deterioroCognitivo",
    "manualOverride",
  ],
  controlCardiovascular: [
    "frecuenciaCardiaca",
    "colesterolTotal",
    "cLDL",
    "cHDL",
    "trigliceridos",
    "ntProBnp",
    "lpA",
    "riesgoScorePrevent",
  ],
  cribadoClaudicacion: [
    "q1DolorAlCaminar",
    "q2ApareceEnReposo",
    "q3ApareceAlSubirCuesta",
    "q4ApareceEnLlano",
    "q5DesaparaceEnReposo",
    "q6Localizacion",
  ],
  controlMetabolico: ["glucemiaBasal", "tsh", "sogGlucemia2h"],
  controlAnemia: ["hb", "vcm", "hcm", "chcm", "ferritina", "ist", "vitaminaB12", "acidoFolico", "reticulocitos", "pcr"],
  cribadoObesidad: ["eossEstadio", "stopBangPuntuacion", "sospechaTCA"],
};

export interface PeticionEdicion {
  tabla: TablaEditable;
  registroId: string | null;
  campo: string;
  tipo: TipoEdicion;
  valor: string;
  pacienteId: string;
}

export async function guardarCampo(
  peticion: PeticionEdicion
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { tabla, registroId, campo, tipo, valor, pacienteId } = peticion;

  if (!CAMPOS_PERMITIDOS[tabla]?.includes(campo)) {
    return { ok: false, error: "Ese campo no se puede editar" };
  }

  if (CAMPOS_OBLIGATORIOS.has(campo) && valor.trim() === "") {
    return {
      ok: false,
      error: campo === "nuhsa" ? "El NUHSA no puede quedar vacío" : "El sexo no puede quedar vacío",
    };
  }

  let valorConvertido: string | number | boolean | Date | null;
  if (tipo === "booleano") {
    if (valor !== "si" && valor !== "no" && valor !== "true" && valor !== "false") return { ok: false, error: "Elige Sí o No" };
    valorConvertido = valor === "si" || valor === "true";
  } else if (tipo === "booleanoTriEstado") {
    valorConvertido = valor === "si" || valor === "true" ? true : valor === "no" || valor === "false" ? false : null;
  } else if (tipo === "textoLargo") {
    const texto = valor.trim();
    if (texto.length > MAX_TEXTO_LARGO) {
      return { ok: false, error: `El texto es demasiado largo (máximo ${MAX_TEXTO_LARGO} caracteres)` };
    }
    valorConvertido = texto === "" ? null : texto;
  } else if (valor === "") {
    valorConvertido = null;
  } else if (tipo === "numero") {
    const n = Number(valor.replace(",", "."));
    if (!Number.isFinite(n)) return { ok: false, error: "Valor numérico no válido" };
    valorConvertido = n;
  } else if (tipo === "fecha") {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Fecha no válida" };
    valorConvertido = d;
  } else if (campo === "nuhsa") {
    valorConvertido = normalizarNUHSA(valor);
  } else if (campo === "sexo") {
    const s = valor.trim().toUpperCase();
    if (s !== "H" && s !== "M") return { ok: false, error: "El sexo debe ser H (hombre) o M (mujer)" };
    valorConvertido = s;
  } else {
    valorConvertido = valor;
  }

  const data = { [campo]: valorConvertido };

  try {
    if (tabla === "paciente") {
      await prisma.paciente.update({ where: { id: registroId! }, data });
    } else if (tabla === "complicaciones") {
      await prisma.complicaciones.upsert({
        where: { pacienteId },
        create: { pacienteId, ...data, manualOverride: true },
        update: { ...data, manualOverride: true },
      });
    } else if (registroId) {
      switch (tabla) {
        case "medicion":
          await prisma.medicion.update({ where: { id: registroId }, data });
          break;
        case "controlTA":
          await prisma.controlTA.update({ where: { id: registroId }, data });
          break;
        case "controlGlicada":
          await prisma.controlGlicada.update({ where: { id: registroId }, data });
          break;
        case "controlRenal":
          await prisma.controlRenal.update({ where: { id: registroId }, data });
          break;
        case "controlHepatico":
          await prisma.controlHepatico.update({ where: { id: registroId }, data });
          break;
        case "exploracionPie":
          await prisma.exploracionPie.update({ where: { id: registroId }, data });
          break;
        case "retinografia":
          await prisma.retinografia.update({ where: { id: registroId }, data });
          break;
        case "controlCardiovascular":
          await prisma.controlCardiovascular.update({ where: { id: registroId }, data });
          break;
        case "cribadoClaudicacion":
          await prisma.cribadoClaudicacion.update({ where: { id: registroId }, data });
          break;
        case "controlMetabolico":
          await prisma.controlMetabolico.update({ where: { id: registroId }, data });
          break;
        case "controlAnemia":
          await prisma.controlAnemia.update({ where: { id: registroId }, data });
          break;
        case "cribadoObesidad":
          await prisma.cribadoObesidad.update({ where: { id: registroId }, data });
          break;
      }
    } else {
      switch (tabla) {
        case "medicion":
          await prisma.medicion.create({ data: { pacienteId, ...data } });
          break;
        case "controlTA":
          await prisma.controlTA.create({ data: { pacienteId, ...data } });
          break;
        case "controlGlicada":
          await prisma.controlGlicada.create({ data: { pacienteId, ...data } });
          break;
        case "controlRenal":
          await prisma.controlRenal.create({ data: { pacienteId, ...data } });
          break;
        case "controlHepatico":
          await prisma.controlHepatico.create({ data: { pacienteId, ...data } });
          break;
        case "exploracionPie":
          await prisma.exploracionPie.create({ data: { pacienteId, ...data } });
          break;
        case "retinografia":
          await prisma.retinografia.create({ data: { pacienteId, ...data } });
          break;
        case "controlCardiovascular":
          await prisma.controlCardiovascular.create({ data: { pacienteId, ...data } });
          break;
        case "cribadoClaudicacion":
          await prisma.cribadoClaudicacion.create({ data: { pacienteId, ...data } });
          break;
        case "controlMetabolico":
          await prisma.controlMetabolico.create({ data: { pacienteId, ...data } });
          break;
        case "controlAnemia":
          await prisma.controlAnemia.create({ data: { pacienteId, ...data } });
          break;
        case "cribadoObesidad":
          await prisma.cribadoObesidad.create({ data: { pacienteId, ...data } });
          break;
      }
    }
  } catch (err: unknown) {
    // P2002 = violación de índice único. El único campo único del paciente es
    // el NUHSA, así que el mensaje puede ser concreto.
    const codigo = (err as { code?: string })?.code;
    if (codigo === "P2002") {
      return {
        ok: false,
        error: `Ya existe otro paciente con el NUHSA ${valorConvertido}. Revisa si es un duplicado.`,
      };
    }
    return { ok: false, error: "No se ha podido guardar" };
  }

  invalidarListaPacientes(pacienteId);
  revalidatePath(`/pacientes/${pacienteId}`);
  revalidatePath("/pacientes");
  revalidatePath("/heridas");
  return { ok: true };
}

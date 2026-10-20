"use server";

import { revalidatePath } from "next/cache";
import { invalidarListaPacientes } from "../listaPacientes";
import { prisma } from "@/lib/prisma";
import { normalizarNUHSA } from "@/lib/importer/parser";

export interface DatosFiliacion {
  nombre: string;
  nuhsa: string;
  sexo: string;
  fechaNacimiento: string;
  centroSalud: string;
  claveMedica: string;
  claveEnfermeria: string;
  claveEquipo: string;
}

export type ResultadoFiliacion =
  | { ok: true; nuhsaGuardado: string }
  | { ok: false; error: string; campo?: keyof DatosFiliacion };

/**
 * Corrige los datos de filiación de un paciente que ya existe.
 *
 * Existe aparte de `guardarCampo` porque estos campos van juntos: el NUHSA es
 * único y el sexo es obligatorio, así que conviene validarlos y guardarlos en
 * una sola operación en vez de campo a campo.
 */
export async function guardarFiliacion(
  pacienteId: string,
  datos: DatosFiliacion
): Promise<ResultadoFiliacion> {
  const nuhsa = normalizarNUHSA(datos.nuhsa.trim());
  if (!nuhsa) {
    return { ok: false, error: "El NUHSA es obligatorio", campo: "nuhsa" };
  }

  const sexo = datos.sexo.trim().toUpperCase();
  if (sexo !== "H" && sexo !== "M") {
    return { ok: false, error: "Indica el sexo (hombre o mujer)", campo: "sexo" };
  }

  let fechaNacimiento: Date | null = null;
  if (datos.fechaNacimiento.trim() !== "") {
    const d = new Date(datos.fechaNacimiento);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: "La fecha de nacimiento no es válida", campo: "fechaNacimiento" };
    }
    if (d.getTime() > Date.now()) {
      return {
        ok: false,
        error: "La fecha de nacimiento no puede ser futura",
        campo: "fechaNacimiento",
      };
    }
    fechaNacimiento = d;
  }

  const limpiar = (v: string) => {
    const t = v.trim();
    return t === "" ? null : t;
  };

  try {
    await prisma.paciente.update({
      where: { id: pacienteId },
      data: {
        nombre: limpiar(datos.nombre),
        nuhsa,
        sexo,
        fechaNacimiento,
        centroSalud: limpiar(datos.centroSalud),
        claveMedica: limpiar(datos.claveMedica),
        claveEnfermeria: limpiar(datos.claveEnfermeria),
        claveEquipo: limpiar(datos.claveEquipo),
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002") {
      return {
        ok: false,
        error: `Ya hay otro paciente con el NUHSA ${nuhsa}. Comprueba si es un duplicado.`,
        campo: "nuhsa",
      };
    }
    return { ok: false, error: "No se han podido guardar los cambios" };
  }

  // La filiación se ve en los dos módulos, así que se refrescan ambos.
  invalidarListaPacientes(pacienteId);
  revalidatePath(`/pacientes/${pacienteId}`);
  revalidatePath("/pacientes");
  revalidatePath("/heridas");
  return { ok: true, nuhsaGuardado: nuhsa };
}

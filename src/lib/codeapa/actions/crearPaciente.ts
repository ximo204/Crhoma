"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { invalidarListaPacientes } from "../listaPacientes";
import { prisma } from "@/lib/prisma";
import { fecha, texto } from "./formData";

export async function crearPaciente(formData: FormData) {
  const nuhsa = texto(formData, "nuhsa");
  const sexo = texto(formData, "sexo");

  if (!nuhsa || (sexo !== "H" && sexo !== "M")) {
    redirect(`/pacientes/nuevo?error=${encodeURIComponent("NUHSA y sexo son obligatorios")}`);
  }

  // Recoger tratamientos seleccionados
  const tratamientos = formData.getAll("tratamientos").map(String).filter(Boolean);
  const tratamientosStr = tratamientos.length > 0 ? JSON.stringify(tratamientos) : texto(formData, "tratamientoDiabetes");
  const embarazo = formData.get("embarazo") === "true" || formData.get("embarazo") === "si";

  let pacienteId: string;
  try {
    const paciente = await prisma.paciente.create({
      data: {
        nuhsa,
        sexo,
        nombre: texto(formData, "nombre"),
        fechaNacimiento: fecha(formData, "fechaNacimiento"),
        centroSalud: texto(formData, "centroSalud"),
        claveMedica: texto(formData, "claveMedica"),
        claveEnfermeria: texto(formData, "claveEnfermeria"),
        claveEquipo: texto(formData, "claveEquipo"),
        tipoDiabetes: texto(formData, "tipoDiabetes"),
        tratamientoDiabetes: tratamientosStr,
        mcgEstado: texto(formData, "mcgEstado"),
        embarazo,
        tiempoEvolucionDiabetes: texto(formData, "tiempoEvolucionDiabetes"),
        controlEvolucion: texto(formData, "controlEvolucion"),
        antecedentesFamiliaresDiabetes: texto(formData, "antecedentesFamiliaresDiabetes"),
        diabetesGestacionalPrevia: texto(formData, "diabetesGestacionalPrevia"),
        perfilControlGlucemico: texto(formData, "perfilControlGlucemico") ?? "GENERAL",
      },
    });
    pacienteId = paciente.id;

    // Crear la primera visita/periodo para el año actual
    const anioActual = new Date().getFullYear().toString();
    await prisma.visitaPeriodo.create({
      data: {
        pacienteId,
        periodo: anioActual,
        notas: "Visita de alta / registro inicial",
      },
    });
  } catch (error: unknown) {
    const esNuhsaDuplicado =
      typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
    const mensaje = esNuhsaDuplicado ? "Ya existe un paciente con ese NUHSA" : "No se ha podido crear el paciente";
    redirect(`/pacientes/nuevo?error=${encodeURIComponent(mensaje)}`);
  }

  invalidarListaPacientes(pacienteId);
  revalidatePath("/pacientes");
  redirect(`/pacientes/${pacienteId}`);
}

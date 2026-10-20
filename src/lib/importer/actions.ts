"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type { FilaProcesada } from "./parser";
import { revalidatePath } from "next/cache";
import { invalidarListaPacientes } from "@/lib/codeapa/listaPacientes";

export interface ResultadoGuardado {
  pacientesCreados: number;
  pacientesActualizados: number;
  registrosClinicosCreados: number;
  errores: string[];
}

type FilaImportable = Omit<FilaProcesada, "raw">;

/** Guarda una fila (paciente + sus controles) dentro de la transacción dada. */
async function guardarFila(
  tx: Prisma.TransactionClient,
  fila: FilaImportable
): Promise<{ creado: boolean; registros: number }> {
  let creado = false;
  let registros = 0;
  const { nuhsa, datosPaciente, periodo, clinico } = fila;

  // 1. Buscar si el paciente ya existe
  let paciente = await tx.paciente.findUnique({
    where: { nuhsa },
    include: { complicaciones: true },
  });

  if (!paciente) {
    // Crear nuevo paciente
    paciente = await tx.paciente.create({
      data: {
        nuhsa,
        sexo: datosPaciente.sexo || "H",
        fechaNacimiento: datosPaciente.fechaNacimiento,
        centroSalud: datosPaciente.centroSalud,
        claveMedica: datosPaciente.claveMedica,
        claveEnfermeria: datosPaciente.claveEnfermeria,
        claveEquipo: datosPaciente.claveEquipo,
        tipoDiabetes: datosPaciente.tipoDiabetes || "TIPO_2",
        tratamientoDiabetes: datosPaciente.tratamientoDiabetes,
        inmovilizado: datosPaciente.inmovilizado,
        viveEnResidencia: datosPaciente.viveEnResidencia,
      },
      include: { complicaciones: true },
    });
    creado = true;
  } else {
    // Actualizar datos faltantes si vienen informados
    const updateData: Record<string, string | boolean | undefined> = {};
    if (datosPaciente.centroSalud && !paciente.centroSalud) updateData.centroSalud = datosPaciente.centroSalud;
    if (datosPaciente.claveMedica && !paciente.claveMedica) updateData.claveMedica = datosPaciente.claveMedica;
    if (datosPaciente.claveEnfermeria && !paciente.claveEnfermeria) updateData.claveEnfermeria = datosPaciente.claveEnfermeria;
    if (datosPaciente.claveEquipo && !paciente.claveEquipo) updateData.claveEquipo = datosPaciente.claveEquipo;
    if (datosPaciente.tratamientoDiabetes) {
      updateData.tratamientoDiabetes = paciente.tratamientoDiabetes
        ? `${paciente.tratamientoDiabetes}; ${datosPaciente.tratamientoDiabetes}`
        : datosPaciente.tratamientoDiabetes;
    }
    // Situación funcional: a diferencia de los campos anteriores, sí se
    // actualiza aunque el paciente ya tuviera un valor, porque viene de
    // un volcado poblacional que refleja la situación actual (puede
    // cambiar: un paciente se puede inmovilizar o ingresar en residencia).
    if (datosPaciente.inmovilizado !== undefined) updateData.inmovilizado = datosPaciente.inmovilizado;
    if (datosPaciente.viveEnResidencia !== undefined) updateData.viveEnResidencia = datosPaciente.viveEnResidencia;

    if (Object.keys(updateData).length > 0) {
      paciente = await tx.paciente.update({
        where: { id: paciente.id },
        data: updateData,
        include: { complicaciones: true },
      });
    }
    creado = false;
  }

  const pacienteId = paciente.id;
  const periodoActivo = periodo || new Date().getFullYear().toString();

  // 2. Visita de Período
  const existeVisita = await tx.visitaPeriodo.findFirst({
    where: { pacienteId, periodo: periodoActivo },
  });
  if (!existeVisita) {
    await tx.visitaPeriodo.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        fecha: new Date(),
        notas: "Importado automáticamente desde volcado oficial SAS",
      },
    });
  }

  // 3. Control Renal (Creatinina, FGE, CAC, Potasio)
  if (
    clinico.creatinina !== undefined ||
    clinico.fge !== undefined ||
    clinico.cac !== undefined ||
    clinico.potasio !== undefined
  ) {
    await tx.controlRenal.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        creatinina: clinico.creatinina,
        fge: clinico.fge,
        cac: clinico.cac,
        potasio: clinico.potasio,
      },
    });
    registros++;
  }

  // 4. Control Glicada (HbA1c)
  if (clinico.hba1c !== undefined) {
    await tx.controlGlicada.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        hba1c: clinico.hba1c,
      },
    });
    registros++;
  }

  // 5. Control Metabólico (Glucemia Basal, TSH)
  if (clinico.glucemiaBasal !== undefined || clinico.tsh !== undefined) {
    await tx.controlMetabolico.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        glucemiaBasal: clinico.glucemiaBasal,
        tsh: clinico.tsh,
      },
    });
    registros++;
  }

  // 6. Control Cardiovascular (Colesterol, LDL, HDL, Triglicéridos, NT-proBNP, Lp(a))
  if (
    clinico.colesterolTotal !== undefined ||
    clinico.cLDL !== undefined ||
    clinico.cHDL !== undefined ||
    clinico.trigliceridos !== undefined ||
    clinico.ntProBnp !== undefined ||
    clinico.lpA !== undefined
  ) {
    await tx.controlCardiovascular.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        colesterolTotal: clinico.colesterolTotal,
        cLDL: clinico.cLDL,
        cHDL: clinico.cHDL,
        trigliceridos: clinico.trigliceridos,
        ntProBnp: clinico.ntProBnp,
        lpA: clinico.lpA,
      },
    });
    registros++;
  }

  // 7. Control Anemia / Hematología (Hb, VCM, HCM, CHCM, Ferritina, IST, B12, Fólico, PCR)
  if (
    clinico.hb !== undefined ||
    clinico.vcm !== undefined ||
    clinico.hcm !== undefined ||
    clinico.chcm !== undefined ||
    clinico.ferritina !== undefined ||
    clinico.ist !== undefined ||
    clinico.vitaminaB12 !== undefined ||
    clinico.acidoFolico !== undefined ||
    clinico.pcr !== undefined
  ) {
    await tx.controlAnemia.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        hb: clinico.hb,
        vcm: clinico.vcm,
        hcm: clinico.hcm,
        chcm: clinico.chcm,
        ferritina: clinico.ferritina,
        ist: clinico.ist,
        vitaminaB12: clinico.vitaminaB12,
        acidoFolico: clinico.acidoFolico,
        pcr: clinico.pcr,
      },
    });
    registros++;
  }

  // 8. Control Hepático (Plaquetas)
  if (clinico.plaquetas !== undefined) {
    await tx.controlHepatico.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        plaquetas: clinico.plaquetas,
      },
    });
    registros++;
  }

  // 9. Exploración Pie Diabético (Infoweb)
  if (clinico.riesgoPieDiabetico) {
    await tx.exploracionPie.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        realizado: true,
        deformidad: clinico.riesgoPieDiabetico === "ALTO",
        enfermedadArterialPeriferica: clinico.riesgoPieDiabetico === "ALTO",
        antecedenteUlceraOAmputacion: clinico.riesgoPieDiabetico === "ALTO",
      },
    });
    registros++;
  }

  // 10. Retinografía
  if (clinico.retino3Anos !== undefined) {
    await tx.retinografia.create({
      data: {
        pacienteId,
        periodo: periodoActivo,
        realizada: clinico.retino3Anos,
        resultado: clinico.retino3Anos ? "NORMAL" : "NO_REALIZADA",
      },
    });
    registros++;
  }

  // 11. Complicaciones
  if (clinico.amputado || clinico.pieDiabetico) {
    await tx.complicaciones.upsert({
      where: { pacienteId },
      create: {
        pacienteId,
        amputacion: !!clinico.amputado,
        ulceraPieDiabetico: !!clinico.pieDiabetico,
      },
      update: {
        amputacion: clinico.amputado ? true : undefined,
        ulceraPieDiabetico: clinico.pieDiabetico ? true : undefined,
      },
    });
    registros++;
  }

  return { creado, registros };
}

// La fila original (`raw`) solo sirve para la previsualización: el cliente no
// la envía, para no duplicar el tamaño de cada lote.
export async function importarFilasABaseDeDatos(
  filas: FilaImportable[]
): Promise<ResultadoGuardado> {
  let pacientesCreados = 0;
  let pacientesActualizados = 0;
  let registrosClinicosCreados = 0;
  const errores: string[] = [];

  const sumar = (r: { creado: boolean; registros: number }) => {
    if (r.creado) pacientesCreados++;
    else pacientesActualizados++;
    registrosClinicosCreados += r.registros;
  };

  // Todo el lote en una sola transacción: en SQLite cada confirmación espera
  // a que el disco sincronice (decenas de ms), mientras que las consultas en
  // sí cuestan menos de 1 ms. Confirmar una vez por lote en vez de una vez
  // por escritura hace la importación decenas de veces más rápida.
  try {
    const resultados = await prisma.$transaction(
      async (tx) => {
        const out = [];
        for (const fila of filas) out.push(await guardarFila(tx, fila));
        return out;
      },
      { timeout: 120_000 }
    );
    resultados.forEach(sumar);
  } catch {
    // Alguna fila ha fallado y el lote entero se ha deshecho: se repite fila a
    // fila para guardar las correctas e informar solo de las que fallan.
    for (const fila of filas) {
      try {
        sumar(await prisma.$transaction((tx) => guardarFila(tx, fila)));
      } catch (err: unknown) {
        errores.push(`Error en fila con NUHSA ${fila.nuhsa}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  invalidarListaPacientes();
  revalidatePath("/pacientes");
  return {
    pacientesCreados,
    pacientesActualizados,
    registrosClinicosCreados,
    errores,
  };
}

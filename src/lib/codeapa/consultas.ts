import { Prisma } from "@/generated/prisma";
import type { DatosParaFicha } from "./ficha";

export const INCLUDE_ULTIMOS_CONTROLES = {
  visitas: { orderBy: { fecha: "desc" } },
  mediciones: { orderBy: { fecha: "desc" } },
  controlesTA: { orderBy: { fecha: "desc" } },
  controlesGlicada: { orderBy: { fecha: "desc" } },
  exploracionesPie: { orderBy: { fecha: "desc" } },
  retinografias: { orderBy: { fecha: "desc" } },
  controlesRenales: { orderBy: { fecha: "desc" } },
  controlesHepaticos: { orderBy: { fecha: "desc" } },
  controlesCardiovasculares: { orderBy: { fecha: "desc" } },
  cribadosClaudicacion: { orderBy: { fecha: "desc" } },
  controlesMetabolicos: { orderBy: { fecha: "desc" } },
  controlesAnemia: { orderBy: { fecha: "desc" } },
  cribadosObesidad: { orderBy: { fecha: "desc" } },
  complicaciones: true,
} satisfies Prisma.PacienteInclude;

export type PacienteConUltimosControles = Prisma.PacienteGetPayload<{
  include: typeof INCLUDE_ULTIMOS_CONTROLES;
}>;

/** Aplana los arrays de registros al formato que espera construirFichaPaciente. */
export function datosParaFichaDesdePaciente(
  paciente: PacienteConUltimosControles,
  periodoSeleccionado?: string
): DatosParaFicha {
  // Si se pide un período concreto, se filtran los registros de ese período
  const filtrarPorPeriodo = <T extends { periodo?: string | null; fecha: Date }>(lista: T[]): T | null => {
    if (!lista || lista.length === 0) return null;
    if (periodoSeleccionado) {
      const encontrado = lista.find(
        (item) => item.periodo === periodoSeleccionado || item.fecha.getFullYear().toString() === periodoSeleccionado
      );
      if (encontrado) return encontrado;
    }
    return lista[0] ?? null;
  };

  return {
    paciente,
    periodoSeleccionado: periodoSeleccionado || (paciente.visitas[0]?.periodo ?? new Date().getFullYear().toString()),
    todasLasVisitas: paciente.visitas,
    ultimaMedicion: filtrarPorPeriodo(paciente.mediciones),
    ultimoControlTA: filtrarPorPeriodo(paciente.controlesTA),
    ultimoControlGlicada: filtrarPorPeriodo(paciente.controlesGlicada),
    ultimaExploracionPie: filtrarPorPeriodo(paciente.exploracionesPie),
    ultimaRetinografia: filtrarPorPeriodo(paciente.retinografias),
    ultimoControlRenal: filtrarPorPeriodo(paciente.controlesRenales),
    ultimoControlHepatico: filtrarPorPeriodo(paciente.controlesHepaticos),
    ultimoControlCardiovascular: filtrarPorPeriodo(paciente.controlesCardiovasculares),
    ultimoCribadoClaudicacion: filtrarPorPeriodo(paciente.cribadosClaudicacion),
    ultimoControlMetabolico: filtrarPorPeriodo(paciente.controlesMetabolicos),
    ultimoControlAnemia: filtrarPorPeriodo(paciente.controlesAnemia),
    ultimoCribadoObesidad: filtrarPorPeriodo(paciente.cribadosObesidad),
    complicaciones: paciente.complicaciones,
    
    // Arrays completos para el histórico y evolución
    historialMediciones: paciente.mediciones,
    historialTA: paciente.controlesTA,
    historialGlicada: paciente.controlesGlicada,
    historialPie: paciente.exploracionesPie,
    historialRetinografia: paciente.retinografias,
    historialRenal: paciente.controlesRenales,
    historialHepatico: paciente.controlesHepaticos,
  };
}

"use server";

import { obtenerPagina, type FiltrosPacientes, type PaginaPacientes } from "../listaPacientes";

/** Página de la tabla de pacientes con los filtros dados (ver listaPacientes.ts). */
export async function buscarPacientes(filtros: FiltrosPacientes, pagina: number): Promise<PaginaPacientes> {
  return obtenerPagina(filtros, pagina);
}

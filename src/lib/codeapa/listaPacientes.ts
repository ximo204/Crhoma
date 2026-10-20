import { prisma } from "@/lib/prisma";
import type { EstadoSemaforo } from "@/lib/crhoma/types";
import { construirFichaPaciente } from "./ficha";
import { datosParaFichaDesdePaciente, type PacienteConUltimosControles } from "./consultas";
import { contarComplicaciones, extraerFila } from "./resumenTabla";
import { evaluarComplicaciones, type ComplicacionEvaluada } from "./complicaciones";
import { resumirEstadisticas, type DatosEstadisticosPaciente, type ResumenEstadisticas } from "./estadisticas";

// ---------------------------------------------------------------------------
// Lista de pacientes de CODEAPA, calculada una vez y guardada en memoria.
//
// Calcular la fila de la tabla exige la ficha CRHOMA completa de cada paciente
// (13 tablas clínicas + fórmulas). Con ~10.000 pacientes eso son varios
// segundos, y mandarlo todo al navegador eran cientos de MB. Por eso:
//   - se calcula una sola vez y se guarda aquí (en el proceso del servidor);
//   - al editar un paciente solo se recalcula ese paciente;
//   - el navegador recibe solo la página que está viendo (ver obtenerPagina).
// ---------------------------------------------------------------------------

/** Lo que la tabla necesita de cada casilla (la ficha completa trae mucho más). */
export interface CampoResumen {
  valor: number | string | null;
  unidad?: string;
  estado: EstadoSemaforo;
  /** Texto de ayuda al pasar el ratón (interpretación u observaciones). */
  interpretacion?: string;
}

export interface FilaPacienteUI {
  paciente: {
    id: string;
    nuhsa: string;
    nombre: string | null;
    sexo: string;
    fechaNacimiento: string | null;
    tipoDiabetes: string | null;
    tratamientoDiabetes: string | null;
    mcgEstado: string | null;
    notas: string | null;
  };
  fila: Record<string, CampoResumen | undefined>;
  complicacionesActivas: number;
  complicacionesDetalle: ComplicacionEvaluada[];
}

export interface FiltrosPacientes {
  busqueda: string;
  // Cupo: el valor exacto de cada campo del paciente, o "TODOS".
  claveMedica: string;
  claveEnfermeria: string;
  centro: string;
  tipoDiab: string;
  mcg: string;
  riesgoPie: string;
  retino: string;
  complicaciones: string;
  embarazo: string;
  periodo: string;
}

export const FILTROS_VACIOS: FiltrosPacientes = {
  busqueda: "",
  claveMedica: "TODOS",
  claveEnfermeria: "TODOS",
  centro: "TODOS",
  tipoDiab: "TODOS",
  mcg: "TODOS",
  riesgoPie: "TODOS",
  retino: "TODOS",
  complicaciones: "TODOS",
  embarazo: "TODOS",
  periodo: "TODOS",
};

export const FILAS_POR_PAGINA = 50;

interface Entrada {
  fila: FilaPacienteUI;
  estadisticas: DatosEstadisticosPaciente;
  cupo: { claveMedica: string | null; claveEnfermeria: string | null; centro: string | null };
}

interface Cache {
  entradas: Map<string, Entrada>;
  /** Ids ordenados por nombre (el orden de la tabla). */
  orden: string[];
}

// En globalThis y no en una variable del módulo: Next puede cargar este
// archivo dos veces (una para las páginas y otra para las server actions), y
// ambas copias tienen que ver la misma caché.
const g = globalThis as unknown as {
  codeapaLista?: {
    cache: Cache | null;
    cargando: Promise<Cache> | null;
    /** Sube con cada invalidación total: descarta cálculos ya en marcha. */
    version: number;
    /** Pacientes modificados que hay que recalcular antes de responder. */
    pendientes: Set<string>;
  };
};
const estado = (g.codeapaLista ??= { cache: null, cargando: null, version: 0, pendientes: new Set() });

/**
 * Marca la lista como desactualizada. Con `pacienteId` solo se recalcula ese
 * paciente la próxima vez; sin él, se recalculan todos (p. ej. tras importar).
 */
export function invalidarListaPacientes(pacienteId?: string) {
  if (!pacienteId) {
    estado.version++;
    estado.cache = null;
    estado.pendientes = new Set();
    return;
  }
  // Se apunta aunque el primer cálculo esté en marcha: lo leído puede ser
  // anterior a la edición, y se corrige en cuanto termine.
  estado.pendientes.add(pacienteId);
}

/**
 * Carga pacientes con todos sus controles. Equivale a
 * `findMany({ include: INCLUDE_ULTIMOS_CONTROLES })`, pero lanzando una
 * consulta por tabla en paralelo: con miles de pacientes es ~4 veces más
 * rápido que el `include`, que Prisma resuelve tabla a tabla.
 */
async function cargarPacientes(ids?: string[]): Promise<PacienteConUltimosControles[]> {
  const whereHijos = ids ? { pacienteId: { in: ids } } : {};
  const desc = { fecha: "desc" } as const;
  const [
    pacientes,
    visitas,
    mediciones,
    controlesTA,
    controlesGlicada,
    exploracionesPie,
    retinografias,
    controlesRenales,
    controlesHepaticos,
    controlesCardiovasculares,
    cribadosClaudicacion,
    controlesMetabolicos,
    controlesAnemia,
    cribadosObesidad,
    complicaciones,
  ] = await Promise.all([
    prisma.paciente.findMany({ where: ids ? { id: { in: ids } } : {} }),
    prisma.visitaPeriodo.findMany({ where: whereHijos, orderBy: desc }),
    prisma.medicion.findMany({ where: whereHijos, orderBy: desc }),
    prisma.controlTA.findMany({ where: whereHijos, orderBy: desc }),
    prisma.controlGlicada.findMany({ where: whereHijos, orderBy: desc }),
    prisma.exploracionPie.findMany({ where: whereHijos, orderBy: desc }),
    prisma.retinografia.findMany({ where: whereHijos, orderBy: desc }),
    prisma.controlRenal.findMany({ where: whereHijos, orderBy: desc }),
    prisma.controlHepatico.findMany({ where: whereHijos, orderBy: desc }),
    prisma.controlCardiovascular.findMany({ where: whereHijos, orderBy: desc }),
    prisma.cribadoClaudicacion.findMany({ where: whereHijos, orderBy: desc }),
    prisma.controlMetabolico.findMany({ where: whereHijos, orderBy: desc }),
    prisma.controlAnemia.findMany({ where: whereHijos, orderBy: desc }),
    prisma.cribadoObesidad.findMany({ where: whereHijos, orderBy: desc }),
    prisma.complicaciones.findMany({ where: whereHijos }),
  ]);

  // Reparte cada tabla por paciente conservando el orden (más reciente primero).
  const agrupar = <T extends { pacienteId: string }>(filas: T[]) => {
    const m = new Map<string, T[]>();
    for (const f of filas) {
      const lista = m.get(f.pacienteId);
      if (lista) lista.push(f);
      else m.set(f.pacienteId, [f]);
    }
    return (id: string) => m.get(id) ?? [];
  };
  const de = {
    visitas: agrupar(visitas),
    mediciones: agrupar(mediciones),
    controlesTA: agrupar(controlesTA),
    controlesGlicada: agrupar(controlesGlicada),
    exploracionesPie: agrupar(exploracionesPie),
    retinografias: agrupar(retinografias),
    controlesRenales: agrupar(controlesRenales),
    controlesHepaticos: agrupar(controlesHepaticos),
    controlesCardiovasculares: agrupar(controlesCardiovasculares),
    cribadosClaudicacion: agrupar(cribadosClaudicacion),
    controlesMetabolicos: agrupar(controlesMetabolicos),
    controlesAnemia: agrupar(controlesAnemia),
    cribadosObesidad: agrupar(cribadosObesidad),
  };
  const complicacionesPorPaciente = new Map(complicaciones.map((c) => [c.pacienteId, c]));

  return pacientes.map((p) => ({
    ...p,
    visitas: de.visitas(p.id),
    mediciones: de.mediciones(p.id),
    controlesTA: de.controlesTA(p.id),
    controlesGlicada: de.controlesGlicada(p.id),
    exploracionesPie: de.exploracionesPie(p.id),
    retinografias: de.retinografias(p.id),
    controlesRenales: de.controlesRenales(p.id),
    controlesHepaticos: de.controlesHepaticos(p.id),
    controlesCardiovasculares: de.controlesCardiovasculares(p.id),
    cribadosClaudicacion: de.cribadosClaudicacion(p.id),
    controlesMetabolicos: de.controlesMetabolicos(p.id),
    controlesAnemia: de.controlesAnemia(p.id),
    cribadosObesidad: de.cribadosObesidad(p.id),
    complicaciones: complicacionesPorPaciente.get(p.id) ?? null,
  }));
}

function calcularEntrada(paciente: PacienteConUltimosControles): Entrada {
  const datosFicha = datosParaFichaDesdePaciente(paciente);
  const secciones = construirFichaPaciente(datosFicha);
  const complicacionesDetalle = evaluarComplicaciones({
    ultimaRetinografia: datosFicha.ultimaRetinografia,
    ultimoControlRenal: datosFicha.ultimoControlRenal,
    ultimaExploracionPie: datosFicha.ultimaExploracionPie,
    ultimoControlCardiovascular: datosFicha.ultimoControlCardiovascular,
    ultimoControlHepatico: datosFicha.ultimoControlHepatico,
    ultimoCribadoClaudicacion: datosFicha.ultimoCribadoClaudicacion,
    complicacionesGuardadas: paciente.complicaciones,
  });

  const fila: FilaPacienteUI["fila"] = {};
  for (const [id, c] of Object.entries(extraerFila(secciones))) {
    if (!c) continue;
    fila[id] = {
      valor: c.valor,
      unidad: c.unidad,
      estado: c.estado,
      interpretacion: c.interpretacion || c.observaciones,
    };
  }

  return {
    fila: {
      paciente: {
        id: paciente.id,
        nuhsa: paciente.nuhsa,
        nombre: paciente.nombre,
        sexo: paciente.sexo,
        fechaNacimiento: paciente.fechaNacimiento
          ? paciente.fechaNacimiento.toLocaleDateString("es-ES")
          : null,
        tipoDiabetes: paciente.tipoDiabetes,
        tratamientoDiabetes: paciente.tratamientoDiabetes,
        mcgEstado: paciente.mcgEstado,
        notas: paciente.notas,
      },
      fila,
      complicacionesActivas: Number(contarComplicaciones(secciones).valor) || 0,
      complicacionesDetalle,
    },
    cupo: {
      claveMedica: paciente.claveMedica,
      claveEnfermeria: paciente.claveEnfermeria,
      centro: paciente.centroSalud,
    },
    estadisticas: {
      tipoDiabetes: paciente.tipoDiabetes,
      glicadas: paciente.controlesGlicada.flatMap((gl) =>
        gl.hba1c == null
          ? []
          : [{ periodo: gl.periodo || gl.fecha.getFullYear().toString(), hba1c: gl.hba1c }]
      ),
    },
  };
}

const collator = new Intl.Collator("es");
// Por nombre y, a igualdad (o sin nombre, que es lo habitual en los volcados
// del SAS), por NUHSA, que es único. Sin ese desempate el orden dependía de la
// posición en la caché, y un paciente recién editado saltaba a la última
// página: parecía que lo guardado no aparecía.
const compararNombre = (a: Entrada, b: Entrada) =>
  collator.compare(a.fila.paciente.nombre ?? "", b.fila.paciente.nombre ?? "") ||
  collator.compare(a.fila.paciente.nuhsa, b.fila.paciente.nuhsa);

function ordenar(entradas: Map<string, Entrada>): string[] {
  return Array.from(entradas.values())
    .sort(compararNombre)
    .map((e) => e.fila.paciente.id);
}

async function calcularTodo(): Promise<Cache> {
  const pacientes = await cargarPacientes();
  const entradas = new Map<string, Entrada>();
  for (const p of pacientes) entradas.set(p.id, calcularEntrada(p));
  return { entradas, orden: ordenar(entradas) };
}

/** Devuelve la lista al día, recalculando solo lo necesario. */
async function obtenerCache(): Promise<Cache> {
  while (!estado.cache) {
    const version = estado.version;
    // Si ya hay un cálculo en marcha (p. ej. el precalentado), se espera a ese.
    estado.cargando ??= calcularTodo().finally(() => {
      estado.cargando = null;
    });
    const cache = await estado.cargando;
    // Si se invalidó todo mientras se calculaba, el resultado ya no vale.
    if (estado.version === version) estado.cache ??= cache;
  }
  const cache = estado.cache;

  if (estado.pendientes.size > 0) {
    const ids = Array.from(estado.pendientes);
    estado.pendientes = new Set();
    const actualizados = await cargarPacientes(ids);
    // Los que ya no existen (borrados) desaparecen de la lista.
    const encontrados = new Set(actualizados.map((p) => p.id));
    for (const id of ids) if (!encontrados.has(id)) cache.entradas.delete(id);
    for (const p of actualizados) cache.entradas.set(p.id, calcularEntrada(p));
    cache.orden = ordenar(cache.entradas);
  }
  return cache;
}

/** Empieza a calcular la lista en segundo plano, sin esperar al resultado. */
export function precalentarListaPacientes() {
  obtenerCache().catch((err) => console.error("[lista pacientes] precalentado fallido:", err));
}

function cumpleFiltros({ fila: filaUI, cupo }: Entrada, f: FiltrosPacientes, q: string) {
  const { paciente, fila, complicacionesDetalle } = filaUI;
  if (f.claveMedica !== "TODOS" && cupo.claveMedica !== f.claveMedica) return false;
  if (f.claveEnfermeria !== "TODOS" && cupo.claveEnfermeria !== f.claveEnfermeria) return false;
  if (f.centro !== "TODOS" && cupo.centro !== f.centro) return false;

  if (f.periodo !== "TODOS" && !String(fila.periodo?.valor ?? "").includes(f.periodo)) return false;

  if (f.tipoDiab !== "TODOS") {
    const tipoP = paciente.tipoDiabetes ?? "";
    if (f.tipoDiab === "TIPO_1" && !tipoP.includes("TIPO_1") && !tipoP.includes("Tipo 1")) return false;
    if (f.tipoDiab === "TIPO_2" && !tipoP.includes("TIPO_2") && !tipoP.includes("Tipo 2")) return false;
    if (f.tipoDiab === "GESTACIONAL" && !tipoP.includes("GESTACIONAL") && !tipoP.includes("Gestacional")) return false;
    if (f.tipoDiab === "LADA" && !tipoP.includes("LADA")) return false;
    if (f.tipoDiab === "SECUNDARIA" && !tipoP.includes("SECUNDARIA")) return false;
  }

  if (f.mcg !== "TODOS" && paciente.mcgEstado !== f.mcg) return false;

  if (f.riesgoPie !== "TODOS") {
    const riesgoVal = String(fila.riesgoPie?.valor ?? "").toLowerCase();
    if (!riesgoVal.includes(f.riesgoPie.toLowerCase())) return false;
  }

  if (f.retino !== "TODOS") {
    const retinoVal = String(fila.retinografiaResultado?.valor ?? "").toUpperCase();
    if (f.retino === "NORMAL" && !retinoVal.includes("NORMAL")) return false;
    if (f.retino === "PATOLOGICA" && !retinoVal.includes("PATOL")) return false;
    if (f.retino === "NO_REALIZADA" && !retinoVal.includes("NO")) return false;
  }

  if (f.complicaciones !== "TODOS") {
    const tiene = complicacionesDetalle.some((c) => c.presente);
    if (f.complicaciones === "CON" && !tiene) return false;
    if (f.complicaciones === "SIN" && tiene) return false;
  }

  if (f.embarazo !== "TODOS") {
    const enGestacion = String(fila.embarazo?.valor ?? "").toLowerCase() === "sí";
    if (f.embarazo === "SI" && !enGestacion) return false;
    if (f.embarazo === "NO" && enGestacion) return false;
  }

  // Búsqueda de texto: NUHSA, nombre, fecha de nacimiento o centro.
  if (q) {
    const coincide =
      paciente.nuhsa.toLowerCase().includes(q) ||
      (paciente.nombre ?? "").toLowerCase().includes(q) ||
      (paciente.fechaNacimiento ?? "").toLowerCase().includes(q) ||
      String(fila.centroSalud?.valor ?? "").toLowerCase().includes(q);
    if (!coincide) return false;
  }

  return true;
}

export interface PaginaPacientes {
  filas: FilaPacienteUI[];
  /** Pacientes que cumplen los filtros. */
  totalFiltrados: number;
  /** Pacientes en la base. */
  total: number;
  pagina: number;
  totalPaginas: number;
  filasPorPagina: number;
  /** Analítica de todos los pacientes filtrados (no solo los de esta página). */
  estadisticas: ResumenEstadisticas;
}

export async function obtenerPagina(filtros: FiltrosPacientes, pagina: number): Promise<PaginaPacientes> {
  const cache = await obtenerCache();
  const q = filtros.busqueda.trim().toLowerCase();
  const coincidentes: FilaPacienteUI[] = [];
  const paraEstadisticas: DatosEstadisticosPaciente[] = [];
  for (const id of cache.orden) {
    const e = cache.entradas.get(id);
    if (e && cumpleFiltros(e, filtros, q)) {
      coincidentes.push(e.fila);
      paraEstadisticas.push(e.estadisticas);
    }
  }
  const totalPaginas = Math.max(1, Math.ceil(coincidentes.length / FILAS_POR_PAGINA));
  const p = Math.min(Math.max(0, Math.floor(pagina) || 0), totalPaginas - 1);
  return {
    filas: coincidentes.slice(p * FILAS_POR_PAGINA, (p + 1) * FILAS_POR_PAGINA),
    totalFiltrados: coincidentes.length,
    total: cache.entradas.size,
    pagina: p,
    totalPaginas,
    filasPorPagina: FILAS_POR_PAGINA,
    estadisticas: resumirEstadisticas(paraEstadisticas),
  };
}

export interface OpcionesCupo {
  clavesMedicas: string[];
  clavesEnfermeria: string[];
  centros: string[];
}

/** Valores distintos de cada campo de cupo, para los desplegables de filtro. */
export async function obtenerOpcionesCupo(): Promise<OpcionesCupo> {
  const cache = await obtenerCache();
  const medicas = new Set<string>();
  const enfermeria = new Set<string>();
  const centros = new Set<string>();
  for (const { cupo } of Array.from(cache.entradas.values())) {
    if (cupo.claveMedica) medicas.add(cupo.claveMedica);
    if (cupo.claveEnfermeria) enfermeria.add(cupo.claveEnfermeria);
    if (cupo.centro) centros.add(cupo.centro);
  }
  const ordenados = (s: Set<string>) => Array.from(s).sort((a, b) => collator.compare(a, b));
  return { clavesMedicas: ordenados(medicas), clavesEnfermeria: ordenados(enfermeria), centros: ordenados(centros) };
}

/** Períodos con alguna visita registrada, del más reciente al más antiguo. */
export async function obtenerPeriodosDisponibles(): Promise<string[]> {
  const filas = await prisma.visitaPeriodo.findMany({ distinct: ["periodo"], select: { periodo: true } });
  return filas
    .map((f) => f.periodo)
    .filter(Boolean)
    .sort()
    .reverse();
}

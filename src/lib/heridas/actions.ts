"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { invalidarListaPacientes } from "@/lib/codeapa/listaPacientes";

export interface PacienteHeridasSummary {
  id: string;
  nuhsa: string;
  nombre: string | null;
  sexo: string;
  edad: number | null;
  centroSalud: string | null;
  claveMedica: string | null;
  claveEnfermeria: string | null;
  tipoDiabetes: string | null;
  tratamientoDiabetes: string | null;
  heridasActivasCount: number;
  heridas: {
    id: string;
    codigo: string;
    etiologia: string;
    localizacion: string;
    estado: string;
    fechaInicio: string | null;
    ultimaSuperficie: number | null;
    ultimoResvech: number | null;
    ultimaFechaValoracion: string | null;
    // Campos de la última valoración para pre-poblar el formulario
    ultimoLargoCm: number | null;
    ultimoAnchoCm: number | null;
    ultimoProfundidadCm: number | null;
    ultimoSuperficieIdx: number | null;
    ultimoProfundidadIdx: number | null;
    ultimoBordesIdx: number | null;
    ultimoTejidoIdx: number | null;
    ultimoExudadoIdx: number | null;
    ultimoInfeccionItems: boolean[] | null;
    ultimoInfeccionConfirmada: boolean | null;
    ultimoPasBrazoD: number | null;
    ultimoPasBrazoI: number | null;
    ultimoPasPedioD: number | null;
    ultimoPasTibialD: number | null;
    ultimoPasPedioI: number | null;
    ultimoPasTibialI: number | null;
    ultimoDopplerDerecho: string | null;
    ultimoDopplerIzquierdo: string | null;
    ultimoBuergerAngulo: string | null;
    ultimoBuergerRubor: string | null;
    ultimoFontaine: string | null;
    ultimoApositoPrincipal: string | null;
    ultimoApositoSecundario: string | null;
    ultimoTerapiaCompresiva: string | null;
    ultimoFrecuenciaCuras: string | null;
    // Historial completo (no solo la última), para los gráficos de evolución.
    historial: { fecha: string; resvechTotal: number | null; superficieCm2: number | null }[];
    fotos: { id: string; fecha: string; comentario: string | null }[];
  }[];
  ultimoITB: number | null;
  ultimoDoppler: string | null;
  ultimoFGe: number | null;
  ultimaHbA1c: number | null;
  // Antropometría real del paciente en CRHOMA, para el cálculo del PAI de
  // riesgo vascular (IMC y perímetro de cintura).
  ultimoPesoKg: number | null;
  ultimaTallaM: number | null;
  ultimaCinturaCm: number | null;
  ulceraPieDiabeticoComplicacion: boolean;
  // Factores de riesgo de úlceras por presión, de la historia CRHOMA.
  inmovilizado: boolean | null;
  viveEnResidencia: boolean | null;
}

export async function obtenerPacientesYHeridas(query?: string): Promise<PacienteHeridasSummary[]> {
  const whereClause = query && query.trim() !== ""
    ? {
        OR: [
          { nuhsa: { contains: query.trim() } },
          { nombre: { contains: query.trim() } },
          { centroSalud: { contains: query.trim() } },
        ],
      }
    : {};

  const pacientes = await prisma.paciente.findMany({
    where: whereClause,
    orderBy: { nombre: "asc" },
    include: {
      heridas: {
        orderBy: { updatedAt: "desc" },
        include: {
          // Historial completo (no solo la última) para poder graficar la
          // evolución; h.valoraciones[0] sigue siendo "la más reciente".
          valoraciones: {
            orderBy: { fecha: "desc" },
          },
          // Solo metadatos de las fotos aquí — el blob pesado se sirve
          // aparte, bajo demanda, por /api/fotos-heridas/[id].
          fotos: {
            orderBy: { fecha: "desc" },
            select: { id: true, fecha: true, comentario: true },
          },
        },
      },
      complicaciones: { select: { ulceraPieDiabetico: true } },
    },
  });

  // Último ITB, FGe, HbA1c y antropometría de cada paciente. Con un `take: 1`
  // dentro del include, Prisma lee igualmente todo el historial de todos los
  // pacientes y recorta después; así se lanza una consulta ligera por tabla,
  // en paralelo, y se queda con la primera de cada paciente.
  const whereHijos = query && query.trim() !== "" ? { pacienteId: { in: pacientes.map((p) => p.id) } } : {};
  const desc = { fecha: "desc" } as const;
  const [exploraciones, renales, glicadas, mediciones] = await Promise.all([
    prisma.exploracionPie.findMany({
      where: whereHijos,
      orderBy: desc,
      select: { pacienteId: true, itb: true, morfologiaDoppler: true },
    }),
    prisma.controlRenal.findMany({ where: whereHijos, orderBy: desc, select: { pacienteId: true, fge: true } }),
    prisma.controlGlicada.findMany({ where: whereHijos, orderBy: desc, select: { pacienteId: true, hba1c: true } }),
    prisma.medicion.findMany({
      where: whereHijos,
      orderBy: desc,
      select: { pacienteId: true, pesoKg: true, tallaM: true, perimetroCinturaCm: true },
    }),
  ]);
  const ultimoDe = <T extends { pacienteId: string }>(filas: T[]) => {
    const m = new Map<string, T>();
    for (const f of filas) if (!m.has(f.pacienteId)) m.set(f.pacienteId, f);
    return m;
  };
  const ultimaExploracionDe = ultimoDe(exploraciones);
  const ultimoRenalDe = ultimoDe(renales);
  const ultimaGlicadaDe = ultimoDe(glicadas);
  const ultimaMedicionDe = ultimoDe(mediciones);

  const anioActual = new Date().getFullYear();

  return pacientes.map((p) => {
    let edad: number | null = null;
    if (p.fechaNacimiento) {
      edad = anioActual - new Date(p.fechaNacimiento).getFullYear();
    }

    const ultimaExploracion = ultimaExploracionDe.get(p.id);
    const ultimoRenal = ultimoRenalDe.get(p.id);
    const ultimaGlicada = ultimaGlicadaDe.get(p.id);
    const ultimaMedicion = ultimaMedicionDe.get(p.id);

    const heridasFormateadas = p.heridas.map((h) => {
      const uv = h.valoraciones[0];
      let infeccionItemsParsed: boolean[] | null = null;
      if (uv?.infeccionItems) {
        try { infeccionItemsParsed = JSON.parse(uv.infeccionItems); } catch { infeccionItemsParsed = null; }
      }
      return {
        id: h.id,
        codigo: h.codigo,
        etiologia: h.etiologia,
        localizacion: h.localizacion,
        estado: h.estado,
        fechaInicio: h.fechaInicio ? h.fechaInicio.toISOString().slice(0, 10) : null,
        ultimaSuperficie: uv?.superficieCm2 ?? null,
        ultimoResvech: uv?.resvechTotal ?? null,
        ultimaFechaValoracion: uv?.fecha ? uv.fecha.toISOString().slice(0, 10) : null,
        // Campos de la última valoración para pre-poblar el formulario
        ultimoLargoCm: uv?.largoCm ?? null,
        ultimoAnchoCm: uv?.anchoCm ?? null,
        ultimoProfundidadCm: uv?.profundidadCm ?? null,
        ultimoSuperficieIdx: uv?.superficieIdx ?? null,
        ultimoProfundidadIdx: uv?.profundidadIdx ?? null,
        ultimoBordesIdx: uv?.bordesIdx ?? null,
        ultimoTejidoIdx: uv?.tejidoIdx ?? null,
        ultimoExudadoIdx: uv?.exudadoIdx ?? null,
        ultimoInfeccionItems: infeccionItemsParsed,
        ultimoInfeccionConfirmada: uv?.infeccionConfirmada ?? null,
        ultimoPasBrazoD: uv?.pasBrazoD ?? null,
        ultimoPasBrazoI: uv?.pasBrazoI ?? null,
        ultimoPasPedioD: uv?.pasPedioD ?? null,
        ultimoPasTibialD: uv?.pasTibialD ?? null,
        ultimoPasPedioI: uv?.pasPedioI ?? null,
        ultimoPasTibialI: uv?.pasTibialI ?? null,
        ultimoDopplerDerecho: uv?.dopplerDerecho ?? null,
        ultimoDopplerIzquierdo: uv?.dopplerIzquierdo ?? null,
        ultimoBuergerAngulo: uv?.buergerAngulo ?? null,
        ultimoBuergerRubor: uv?.buergerRubor ?? null,
        ultimoFontaine: uv?.fontaineEstadio ?? null,
        ultimoApositoPrincipal: uv?.apositoPrincipal ?? null,
        ultimoApositoSecundario: uv?.apositoSecundario ?? null,
        ultimoTerapiaCompresiva: uv?.terapiaCompresivaPautada ?? null,
        ultimoFrecuenciaCuras: uv?.frecuenciaCuras ?? null,
        historial: [...h.valoraciones].reverse().map((v) => ({
          fecha: v.fecha.toISOString().slice(0, 10),
          resvechTotal: v.resvechTotal,
          superficieCm2: v.superficieCm2,
        })),
        fotos: h.fotos.map((f) => ({
          id: f.id,
          fecha: f.fecha.toISOString(),
          comentario: f.comentario,
        })),
      };
    });

    const heridasActivasCount = p.heridas.filter((h) => h.estado === "ACTIVA").length;

    return {
      id: p.id,
      nuhsa: p.nuhsa,
      nombre: p.nombre,
      sexo: p.sexo,
      edad,
      centroSalud: p.centroSalud,
      claveMedica: p.claveMedica,
      claveEnfermeria: p.claveEnfermeria,
      tipoDiabetes: p.tipoDiabetes,
      tratamientoDiabetes: p.tratamientoDiabetes,
      heridasActivasCount,
      heridas: heridasFormateadas,
      ultimoITB: ultimaExploracion?.itb ?? null,
      ultimoDoppler: ultimaExploracion?.morfologiaDoppler ?? null,
      ultimoFGe: ultimoRenal?.fge ?? null,
      ultimaHbA1c: ultimaGlicada?.hba1c ?? null,
      ultimoPesoKg: ultimaMedicion?.pesoKg ?? null,
      ultimaTallaM: ultimaMedicion?.tallaM ?? null,
      ultimaCinturaCm: ultimaMedicion?.perimetroCinturaCm ?? null,
      ulceraPieDiabeticoComplicacion: p.complicaciones?.ulceraPieDiabetico ?? false,
      inmovilizado: p.inmovilizado,
      viveEnResidencia: p.viveEnResidencia,
    };
  });
}

export async function obtenerPacienteDetalleHeridas(pacienteId: string) {
  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    include: {
      heridas: {
        orderBy: { updatedAt: "desc" },
        include: {
          valoraciones: {
            orderBy: { fecha: "desc" },
          },
        },
      },
      exploracionesPie: {
        orderBy: { fecha: "desc" },
        take: 3,
      },
      controlesRenales: {
        orderBy: { fecha: "desc" },
        take: 1,
      },
      controlesGlicada: {
        orderBy: { fecha: "desc" },
        take: 1,
      },
      complicaciones: true,
    },
  });

  return paciente;
}

export async function crearHeridaAction(datos: {
  pacienteId: string;
  codigo: string;
  etiologia: string;
  localizacion: string;
  fechaInicio?: string;
  notas?: string;
}) {
  const { pacienteId, codigo, etiologia, localizacion, fechaInicio, notas } = datos;

  const nuevaHerida = await prisma.herida.create({
    data: {
      pacienteId,
      codigo: codigo.trim() || `HER-${Date.now().toString().slice(-4)}`,
      etiologia,
      localizacion: localizacion.trim(),
      fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
      estado: "ACTIVA",
      notas: notas?.trim() || null,
    },
  });

  // Si es úlcera de pie diabético, sincronizar automáticamente con las complicaciones de CRHOMA
  if (etiologia === "pie_diabetico") {
    await prisma.complicaciones.upsert({
      where: { pacienteId },
      create: {
        pacienteId,
        ulceraPieDiabetico: true,
      },
      update: {
        ulceraPieDiabetico: true,
      },
    });
  }

  // Puede haber cambiado complicaciones o la exploración del pie, que salen en
  // la tabla de pacientes de CODEAPA.
  invalidarListaPacientes(pacienteId);
  revalidatePath("/heridas");
  revalidatePath(`/pacientes/${pacienteId}`);
  return nuevaHerida;
}

export async function guardarValoracionHeridaAction(datos: {
  heridaId: string;
  pacienteId: string;
  fecha?: string;
  largoCm: number | null;
  anchoCm: number | null;
  profundidadCm: number | null;
  superficieCm2: number | null;
  superficieIdx: number;
  profundidadIdx: number;
  bordesIdx: number;
  tejidoIdx: number;
  exudadoIdx: number;
  infeccionItems: boolean[];
  infeccionConfirmada: boolean;
  resvechTotal: number;
  pasBrazoD: number | null;
  pasBrazoI: number | null;
  pasPedioD: number | null;
  pasTibialD: number | null;
  pasPedioI: number | null;
  pasTibialI: number | null;
  itbDerecho: number | null;
  itbIzquierdo: number | null;
  dopplerDerecho: string | null;
  dopplerIzquierdo: string | null;
  buergerAngulo?: string | null;
  buergerRubor?: string | null;
  fontaineEstadio?: string | null;
  recomendacionCompresion?: string | null;
  apositoPrincipal?: string | null;
  apositoSecundario?: string | null;
  terapiaCompresivaPautada?: string | null;
  frecuenciaCuras?: string | null;
  observacionesCura?: string | null;
}) {
  const {
    heridaId,
    pacienteId,
    fecha,
    largoCm,
    anchoCm,
    profundidadCm,
    superficieCm2,
    superficieIdx,
    profundidadIdx,
    bordesIdx,
    tejidoIdx,
    exudadoIdx,
    infeccionItems,
    infeccionConfirmada,
    resvechTotal,
    pasBrazoD,
    pasBrazoI,
    pasPedioD,
    pasTibialD,
    pasPedioI,
    pasTibialI,
    itbDerecho,
    itbIzquierdo,
    dopplerDerecho,
    dopplerIzquierdo,
    buergerAngulo,
    buergerRubor,
    fontaineEstadio,
    recomendacionCompresion,
    apositoPrincipal,
    apositoSecundario,
    terapiaCompresivaPautada,
    frecuenciaCuras,
    observacionesCura,
  } = datos;

  const fechaRegistro = fecha ? new Date(fecha) : new Date();

  const valoracion = await prisma.valoracionHerida.create({
    data: {
      heridaId,
      fecha: fechaRegistro,
      largoCm,
      anchoCm,
      profundidadCm,
      superficieCm2,
      superficieIdx,
      profundidadIdx,
      bordesIdx,
      tejidoIdx,
      exudadoIdx,
      infeccionItems: JSON.stringify(infeccionItems),
      infeccionConfirmada,
      resvechTotal,
      pasBrazoD,
      pasBrazoI,
      pasPedioD,
      pasTibialD,
      pasPedioI,
      pasTibialI,
      itbDerecho,
      itbIzquierdo,
      dopplerDerecho,
      dopplerIzquierdo,
      buergerAngulo,
      buergerRubor,
      fontaineEstadio,
      recomendacionCompresion,
      apositoPrincipal,
      apositoSecundario,
      terapiaCompresivaPautada,
      frecuenciaCuras,
      observacionesCura,
    },
  });

  // Actualizar fecha de modificación de la herida
  await prisma.herida.update({
    where: { id: heridaId },
    data: { updatedAt: new Date() },
  });

  // Sincronización bidireccional con CRHOMA:
  // Si se ha calculado ITB y Doppler, guardar también en la tabla ExploracionPie de CRHOMA
  const itbFinal = itbDerecho ?? itbIzquierdo;
  const dopplerFinal = dopplerDerecho ?? dopplerIzquierdo;
  if (itbFinal !== null && itbFinal !== undefined) {
    await prisma.exploracionPie.create({
      data: {
        pacienteId,
        fecha: fechaRegistro,
        periodo: fechaRegistro.getFullYear().toString(),
        realizado: true,
        itb: itbFinal,
        morfologiaDoppler: dopplerFinal || undefined,
        enfermedadArterialPeriferica: itbFinal < 0.9,
      },
    });
  }

  // Puede haber cambiado complicaciones o la exploración del pie, que salen en
  // la tabla de pacientes de CODEAPA.
  invalidarListaPacientes(pacienteId);
  revalidatePath("/heridas");
  revalidatePath(`/pacientes/${pacienteId}`);
  return valoracion;
}

export async function cambiarEstadoHeridaAction(heridaId: string, nuevoEstado: string, pacienteId?: string) {
  const heridaActualizada = await prisma.herida.update({
    where: { id: heridaId },
    data: { estado: nuevoEstado, updatedAt: new Date() },
  });

  revalidatePath("/heridas");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
  }
  return heridaActualizada;
}

const TIPOS_IMAGEN_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
/** Límite tras la compresión en el navegador — una foto normal ya comprimida pesa unos cientos de KB. */
const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024;

export type ResultadoSubirFoto = { ok: true } | { ok: false; error: string };

/**
 * Guarda una fotografía de una herida como blob en la propia base SQLite.
 * Se espera que el archivo llegue ya redimensionado desde el navegador — la
 * app no tiene (ni quiere tener) una librería de procesado de imágenes.
 */
export async function subirFotoHeridaAction(formData: FormData): Promise<ResultadoSubirFoto> {
  const heridaId = formData.get("heridaId");
  const pacienteId = formData.get("pacienteId");
  const comentario = formData.get("comentario");
  const archivo = formData.get("archivo");

  if (typeof heridaId !== "string" || !heridaId) {
    return { ok: false, error: "Falta indicar la herida" };
  }
  // Se comprueba contra Blob, no contra File: Node 18 (el runtime de este
  // proyecto) no expone `File` como global, solo `Blob` — y todo File es un
  // Blob, así que la comprobación sigue siendo válida en el navegador.
  if (!(archivo instanceof Blob) || archivo.size === 0) {
    return { ok: false, error: "No se ha seleccionado ninguna imagen" };
  }
  if (!TIPOS_IMAGEN_PERMITIDOS.has(archivo.type)) {
    return { ok: false, error: "Formato no admitido. Usa JPG, PNG o WEBP." };
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, error: "La imagen pesa demasiado, incluso comprimida." };
  }

  const datos = Buffer.from(await archivo.arrayBuffer());
  const comentarioLimpio = typeof comentario === "string" && comentario.trim() !== "" ? comentario.trim() : null;

  await prisma.fotoHerida.create({
    data: {
      heridaId,
      datos,
      tipoMime: archivo.type,
      comentario: comentarioLimpio,
    },
  });

  revalidatePath("/heridas");
  if (typeof pacienteId === "string" && pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
  }
  return { ok: true };
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { construirFichaPaciente } from "@/lib/codeapa/ficha";
import { datosParaFichaDesdePaciente, INCLUDE_ULTIMOS_CONTROLES } from "@/lib/codeapa/consultas";
import { SeccionFichaView } from "@/components/codeapa/SeccionFichaView";
import { evaluarComplicaciones } from "@/lib/codeapa/complicaciones";
import { FichaPacienteHeader } from "@/components/codeapa/FichaPacienteHeader";
import { TIPO_HERIDA_OPTS } from "@/lib/heridas/catalogo";
import { Bandage, ChevronLeft, FolderHeart, Stethoscope } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function FichaPacientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string; desde?: string }>;
}) {
  const { id } = await params;
  const { periodo, desde } = await searchParams;

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      ...INCLUDE_ULTIMOS_CONTROLES,
      heridas: {
        orderBy: { updatedAt: "desc" },
        include: { valoraciones: { orderBy: { fecha: "desc" }, take: 1 } },
      },
    },
  });
  if (!paciente) notFound();

  const datosFicha = datosParaFichaDesdePaciente(paciente, periodo);
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

  // Se vuelve al módulo desde el que se entró en la historia del paciente.
  const vueltaAHeridas = desde === "heridas";
  const heridasActivas = paciente.heridas.filter((h) => h.estado === "ACTIVA");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Volver al módulo de origen */}
      <Link
        href={vueltaAHeridas ? "/heridas" : "/pacientes"}
        className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft size={14} />
        <span>{vueltaAHeridas ? "Volver a Heridas" : "Volver al listado de Diabetes"}</span>
      </Link>

      {/* Identificación: esta pantalla es la historia completa (CRHOMA) */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-slate-800 px-5 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
            <FolderHeart size={19} />
          </span>
          <div className="leading-tight">
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">
              Historia completa · CRHOMA
            </span>
            <p className="text-[12.5px] font-semibold text-slate-100">
              Todo lo registrado de este paciente, de los dos módulos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-bold text-sky-100 ring-1 ring-sky-400/30">
            <Stethoscope size={13} />
            Diabetes
          </span>
          <Link
            href={`/heridas?pacienteId=${paciente.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100 ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-500/30"
          >
            <Bandage size={13} />
            Heridas
            {heridasActivas.length > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                {heridasActivas.length}
              </span>
            )}
            <span>→</span>
          </Link>
        </div>
      </div>

      <FichaPacienteHeader
        paciente={paciente}
        periodoActual={datosFicha.periodoSeleccionado}
        todasLasVisitas={paciente.visitas}
        complicaciones={complicacionesDetalle}
        historialGlicada={paciente.controlesGlicada}
        historialTA={paciente.controlesTA}
        historialMediciones={paciente.mediciones}
      />

      {/* Resumen de heridas: la parte de heridas de esta misma historia */}
      <section className="mb-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Bandage size={17} />
            </span>
            <div className="leading-tight">
              <h2 className="text-sm font-bold text-slate-900">Heridas crónicas</h2>
              <span className="text-[11px] text-slate-500">
                {paciente.heridas.length === 0
                  ? "Sin heridas registradas"
                  : `${paciente.heridas.length} registrada(s) · ${heridasActivas.length} activa(s)`}
              </span>
            </div>
          </div>

          <Link
            href={`/heridas?pacienteId=${paciente.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-800"
          >
            {paciente.heridas.length === 0 ? "Registrar una herida" : "Valorar y curar"}
            <span>→</span>
          </Link>
        </div>

        {paciente.heridas.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">
            Este paciente no tiene ninguna herida registrada.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {paciente.heridas.map((h) => {
              const ultima = h.valoraciones[0];
              return (
                <Link
                  key={h.id}
                  href={`/heridas?pacienteId=${paciente.id}&heridaId=${h.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {h.codigo}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase ${
                        h.estado === "ACTIVA"
                          ? "bg-rose-100 text-rose-800"
                          : h.estado === "CICATRIZADA"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {h.estado}
                    </span>
                  </div>
                  <p className="text-[11.5px] font-bold text-slate-900">
                    {TIPO_HERIDA_OPTS.find((o) => o.v === h.etiologia)?.label ?? h.etiologia}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{h.localizacion}</p>
                  {ultima && (
                    <p className="mt-2 border-t border-slate-200/70 pt-1.5 text-[10.5px] text-slate-500">
                      Última cura {new Date(ultima.fecha).toLocaleDateString("es-ES")}
                      {ultima.resvechTotal != null && (
                        <span className="font-bold text-emerald-800">
                          {" "}· RESVECH {ultima.resvechTotal}
                        </span>
                      )}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Datos de diabetes (CODEAPA) */}
      <div className="mb-3.5 flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <Stethoscope size={17} />
        </span>
        <div className="leading-tight">
          <h2 className="text-sm font-bold text-slate-900">Seguimiento de diabetes</h2>
          <span className="text-[11px] text-slate-500">
            Pulsa cualquier casilla para ver cómo se calcula o corregir el valor
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {secciones.map((seccion) => (
          <SeccionFichaView key={seccion.id} seccion={seccion} pacienteId={paciente.id} />
        ))}
      </div>
    </main>
  );
}

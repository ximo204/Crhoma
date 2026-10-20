import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { precalentarListaPacientes } from "@/lib/codeapa/listaPacientes";
import { FolderHeart, Upload } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Mientras se elige área, se va calculando la lista de pacientes en segundo
  // plano para que CODEAPA abra al momento (ver listaPacientes.ts).
  precalentarListaPacientes();

  const [totalPacientes, heridasActivas, pacientesConHeridas] = await Promise.all([
    prisma.paciente.count(),
    prisma.herida.count({ where: { estado: "ACTIVA" } }),
    prisma.paciente.count({ where: { heridas: { some: { estado: "ACTIVA" } } } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Presentación breve */}
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          ¿Con qué vas a trabajar hoy?
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
          Elige uno de los dos módulos. Dentro de cualquiera de ellos puedes
          pulsar sobre un paciente para abrir su historia completa.
        </p>
      </div>

      {/* Los dos módulos de trabajo */}
      <div className="mb-8 grid gap-5 md:grid-cols-2">
        <PuertaModulo
          href="/pacientes"
          logo="/logo_codeapa.svg"
          altLogo="CODEAPA — Control de Diabetes en Atención Primaria de Andalucía"
          descripcion="Tabla de seguimiento de todo tu cupo: HbA1c, tensión, pie diabético, retinografía, analíticas y complicaciones."
          dato={`${totalPacientes} ${totalPacientes === 1 ? "paciente" : "pacientes"}`}
          textoAccion="Abrir listado de diabetes"
          color="sky"
        />

        <PuertaModulo
          href="/heridas"
          logo="/logo_cuseapa.svg"
          altLogo="CUSEAPA — Cuidado y Seguimiento de Heridas en Atención Primaria de Andalucía"
          descripcion="Valoración RESVECH 2.0, medición de la lesión, exploración vascular con ITB y Doppler, y pauta de cura con el catálogo de apósitos."
          dato={
            heridasActivas === 0
              ? "Sin heridas activas"
              : `${heridasActivas} ${heridasActivas === 1 ? "herida activa" : "heridas activas"} en ${pacientesConHeridas} ${
                  pacientesConHeridas === 1 ? "paciente" : "pacientes"
                }`
          }
          textoAccion="Abrir seguimiento de heridas"
          color="emerald"
        />
      </div>

      {/* Cómo se llega a la historia completa (modelo CRHOMA) */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:flex">
            <FolderHeart size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              La historia completa del paciente está en CRHOMA
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              CRHOMA es la base única donde vive cada paciente. Los dos módulos
              de arriba son dos formas de mirar esa misma base, así que{" "}
              <strong className="font-semibold text-slate-800">
                un dato que corrijas en uno aparece corregido en el otro
              </strong>
              .
            </p>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
              <PasoFlujo numero="1" texto="Entra en Diabetes o en Heridas" />
              <FlechaPaso />
              <PasoFlujo numero="2" texto="Pulsa sobre el nombre del paciente" />
              <FlechaPaso />
              <PasoFlujo
                numero="3"
                texto="Se abre su historia CRHOMA completa"
                destacado
              />
            </div>
          </div>
        </div>
      </div>

      {/* Herramienta secundaria */}
      <Link
        href="/importar"
        className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors hover:border-purple-300 hover:bg-purple-50/40 sm:p-5"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <Upload size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 group-hover:text-purple-900">
            Importar datos del SAS
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            Volcados de Infoweb, Farmacia A10 y Laboratorio. Pega la tabla o
            carga un CSV y se reparte solo entre los pacientes.
          </p>
        </div>
        <span className="hidden flex-shrink-0 text-xs font-bold text-purple-700 sm:inline">
          Abrir →
        </span>
      </Link>

      <p className="mt-6 text-center text-[11px] text-slate-400">
        Todos los datos se guardan únicamente en este ordenador
        (<code className="font-mono">prisma/dev.db</code>). Sin internet ni servidores externos.
      </p>
    </main>
  );
}

const COLORES_PUERTA = {
  sky: {
    borde: "hover:border-sky-400",
    anillo: "group-hover:ring-sky-200",
    dato: "bg-sky-50 text-sky-900 border-sky-200",
    accion: "text-sky-700",
  },
  emerald: {
    borde: "hover:border-emerald-400",
    anillo: "group-hover:ring-emerald-200",
    dato: "bg-emerald-50 text-emerald-900 border-emerald-200",
    accion: "text-emerald-700",
  },
} as const;

function PuertaModulo({
  href,
  logo,
  altLogo,
  descripcion,
  dato,
  textoAccion,
  color,
}: {
  href: string;
  logo: string;
  altLogo: string;
  descripcion: string;
  dato: string;
  textoAccion: string;
  color: keyof typeof COLORES_PUERTA;
}) {
  const c = COLORES_PUERTA[color];

  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-xs ring-4 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${c.borde} ${c.anillo}`}
    >
      {/* Logo del módulo: hace de título de la tarjeta */}
      <Image
        src={logo}
        alt={altLogo}
        width={280}
        height={80}
        className="h-auto w-full max-w-[400px]"
        priority
      />

      <p className="mt-4 flex-1 text-xs leading-relaxed text-slate-600">{descripcion}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${c.dato}`}>
          {dato}
        </span>
        <span className={`text-xs font-bold ${c.accion}`}>{textoAccion} →</span>
      </div>
    </Link>
  );
}

function PasoFlujo({
  numero,
  texto,
  destacado = false,
}: {
  numero: string;
  texto: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
        destacado
          ? "border-slate-300 bg-slate-800 text-white"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
          destacado ? "bg-white text-slate-900" : "bg-slate-300 text-slate-700"
        }`}
      >
        {numero}
      </span>
      <span className="text-[11.5px] font-semibold leading-tight">{texto}</span>
    </div>
  );
}

function FlechaPaso() {
  return (
    <div className="flex items-center justify-center text-slate-300 sm:px-0.5">
      <span className="hidden sm:inline">→</span>
      <span className="sm:hidden">↓</span>
    </div>
  );
}

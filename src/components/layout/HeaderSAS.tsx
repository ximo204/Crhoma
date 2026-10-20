"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bandage, Stethoscope, Upload } from "@/components/ui/Icons";

/**
 * Encabezado único de la aplicación.
 *
 * Jerarquía que refleja: los dos módulos de trabajo diario son CODEAPA
 * (diabetes) y CUSEAPA (heridas). CRHOMA es la base común de pacientes y no
 * tiene entrada propia en el menú: se llega a la historia completa de un
 * paciente entrando *dentro* de él desde cualquiera de los dos módulos.
 */
export function HeaderSAS() {
  const pathname = usePathname();

  const enPortada = pathname === "/";
  const enFichaPaciente = /^\/pacientes\/[^/]+$/.test(pathname) && !pathname.endsWith("/nuevo");
  const enDiabetes = pathname.startsWith("/pacientes") && !enFichaPaciente;
  const enHeridas = pathname.startsWith("/heridas");
  const enImportar = pathname.startsWith("/importar");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Franja institucional (Junta de Andalucía + Área de Gestión Sanitaria) */}
      <div className="border-b border-slate-200/70 bg-slate-50/80 px-4 py-1.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo_junta_andalucia.png"
              alt="Junta de Andalucía"
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
            <div className="leading-tight">
              <div className="text-[11.5px] font-extrabold tracking-tight text-emerald-900">
                Junta de Andalucía
              </div>
              <div className="text-[10px] italic text-slate-500">
                Consejería de Sanidad, Presidencia y Emergencias
              </div>
            </div>
          </div>

          <div className="hidden h-6 w-px bg-slate-300/80 sm:block" />

          <div className="flex items-center gap-2.5">
            <Image
              src="/logo_ags_cge.png"
              alt="Área de Gestión Sanitaria Campo de Gibraltar Este"
              width={30}
              height={30}
              className="h-7 w-auto object-contain"
              priority
            />
            <div className="leading-tight">
              <div className="text-[11px] font-bold text-slate-700">
                AGS Campo de Gibraltar Este
              </div>
              <div className="text-[10px] font-medium text-emerald-800">
                Servicio Andaluz de Salud
              </div>
            </div>
          </div>

          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800 lg:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Datos en este ordenador
          </span>
        </div>
      </div>

      {/* Barra de módulos */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-8">
        {/* Inicio */}
        <Link
          href="/"
          title="Pantalla de inicio"
          className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${
            enPortada ? "bg-slate-100" : "hover:bg-slate-100"
          }`}
        >
          <Image
            src="/logo_agscge_round.png"
            alt="Inicio"
            width={34}
            height={34}
            className="h-8 w-8 object-contain"
          />
          <span className="hidden text-[13px] font-bold tracking-tight text-slate-800 sm:inline">
            Inicio
          </span>
        </Link>

        <div className="h-7 w-px flex-shrink-0 bg-slate-200" />

        {/* Los dos módulos de trabajo diario */}
        <nav className="flex min-w-0 flex-1 items-center gap-1.5">
          <PestanaModulo
            href="/pacientes"
            activa={enDiabetes}
            icono={<Stethoscope size={17} />}
            titulo="Diabetes"
            subtitulo="CODEAPA"
            color="sky"
          />
          <PestanaModulo
            href="/heridas"
            activa={enHeridas}
            icono={<Bandage size={17} />}
            titulo="Heridas"
            subtitulo="CUSEAPA"
            color="emerald"
          />
        </nav>

        {/* Herramienta secundaria */}
        <Link
          href="/importar"
          title="Importar datos del SAS desde una hoja de cálculo"
          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            enImportar
              ? "bg-purple-100 text-purple-900 ring-1 ring-purple-300"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <Upload size={15} />
          <span className="hidden sm:inline">Importar</span>
        </Link>
      </div>
    </header>
  );
}

const ESTILOS_COLOR = {
  sky: {
    activa: "bg-sky-50 text-sky-900 ring-1 ring-sky-300",
    icono: "text-sky-700",
    subtitulo: "text-sky-700/80",
  },
  emerald: {
    activa: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300",
    icono: "text-emerald-700",
    subtitulo: "text-emerald-700/80",
  },
} as const;

function PestanaModulo({
  href,
  activa,
  icono,
  titulo,
  subtitulo,
  color,
}: {
  href: string;
  activa: boolean;
  icono: React.ReactNode;
  titulo: string;
  subtitulo: string;
  color: keyof typeof ESTILOS_COLOR;
}) {
  const estilo = ESTILOS_COLOR[color];

  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={`inline-flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-colors ${
        activa ? estilo.activa : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className={activa ? estilo.icono : "text-slate-400"}>{icono}</span>
      <span className="leading-tight">
        <span className="block text-[13.5px] font-bold tracking-tight">{titulo}</span>
        <span
          className={`hidden text-[10px] font-semibold uppercase tracking-wide sm:block ${
            activa ? estilo.subtitulo : "text-slate-400"
          }`}
        >
          {subtitulo}
        </span>
      </span>
    </Link>
  );
}

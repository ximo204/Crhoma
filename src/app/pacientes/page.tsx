import Link from "next/link";
import { TablaPacientesInteractive } from "@/components/codeapa/TablaPacientesInteractive";
import {
  FILTROS_VACIOS,
  obtenerOpcionesCupo,
  obtenerPagina,
  obtenerPeriodosDisponibles,
} from "@/lib/codeapa/listaPacientes";

export const dynamic = "force-dynamic";

export default async function ListaPacientesPage() {
  // La tabla solo recibe la primera página; el resto lo pide al cambiar de
  // página o de filtros (ver listaPacientes.ts).
  const [paginaInicial, periodosDisponibles, opcionesCupo] = await Promise.all([
    obtenerPagina(FILTROS_VACIOS, 0),
    obtenerPeriodosDisponibles(),
    obtenerOpcionesCupo(),
  ]);

  return (
    <main className="mx-auto max-w-[110rem] px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800"
        >
          ← Volver a Áreas
        </Link>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          ● Modo Local Activo (SQLite Embebido)
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              CODEAPA
            </span>
            <span className="text-xs text-slate-400">Atención Primaria Andalucía</span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Control y Seguimiento de Diabetes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro de pacientes, baremos oficiales, monitorización continua (MCG), estratificación de pie diabético, retinografía y checklist automático de complicaciones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/importar"
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-900 shadow-2xs hover:bg-purple-100 transition-colors"
          >
            <span>📥</span> Importar Datos SAS
          </Link>
          <Link
            href="/pacientes/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
          >
            <span>+</span> Nuevo Paciente
          </Link>
        </div>
      </div>

      <TablaPacientesInteractive
        paginaInicial={paginaInicial}
        periodosDisponibles={periodosDisponibles}
        opcionesCupo={opcionesCupo}
      />
    </main>
  );
}

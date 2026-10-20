"use client";

/**
 * Desplegables de cupo: clave médica, clave de enfermería y centro.
 *
 * Se usan igual en CODEAPA (tabla de pacientes) y en Heridas. "TODOS" en los
 * tres equivale a toda el área.
 */

export interface ValoresCupo {
  claveMedica: string;
  claveEnfermeria: string;
  centro: string;
}

export interface OpcionesCupoUI {
  clavesMedicas: string[];
  clavesEnfermeria: string[];
  centros: string[];
}

export const CUPO_TODOS: ValoresCupo = { claveMedica: "TODOS", claveEnfermeria: "TODOS", centro: "TODOS" };

export function cuentaFiltrosCupo(v: ValoresCupo) {
  return [v.claveMedica, v.claveEnfermeria, v.centro].filter((x) => x !== "TODOS").length;
}

/** Valores distintos de cada campo de cupo entre los pacientes dados. */
export function opcionesCupoDe(
  pacientes: { claveMedica: string | null; claveEnfermeria: string | null; centroSalud: string | null }[]
): OpcionesCupoUI {
  const ordenar = (valores: (string | null)[]) =>
    Array.from(new Set(valores.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, "es"));
  return {
    clavesMedicas: ordenar(pacientes.map((p) => p.claveMedica)),
    clavesEnfermeria: ordenar(pacientes.map((p) => p.claveEnfermeria)),
    centros: ordenar(pacientes.map((p) => p.centroSalud)),
  };
}

export function FiltrosCupo({
  valores,
  opciones,
  onChange,
  colorFoco = "#0f4c5c",
}: {
  valores: ValoresCupo;
  opciones: OpcionesCupoUI;
  onChange: (nuevos: ValoresCupo) => void;
  /** Color del borde al enfocar, para que encaje con cada módulo. */
  colorFoco?: string;
}) {
  const desplegables: { campo: keyof ValoresCupo; etiqueta: string; todos: string; lista: string[] }[] = [
    { campo: "claveMedica", etiqueta: "Clave médica", todos: "Todas", lista: opciones.clavesMedicas },
    { campo: "claveEnfermeria", etiqueta: "Clave enfermería", todos: "Todas", lista: opciones.clavesEnfermeria },
    { campo: "centro", etiqueta: "Centro", todos: "Todos", lista: opciones.centros },
  ];

  return (
    <>
      {desplegables.map(({ campo, etiqueta, todos, lista }) => {
        const activo = valores[campo] !== "TODOS";
        return (
          <div key={campo} className="min-w-[140px]">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {etiqueta}
            </label>
            <select
              value={valores[campo]}
              onChange={(e) => onChange({ ...valores, [campo]: e.target.value })}
              style={{ ["--foco" as string]: colorFoco }}
              className={`w-full rounded-lg border px-2.5 py-2 text-xs focus:border-[var(--foco)] focus:outline-none focus:ring-1 focus:ring-[var(--foco)] ${
                activo ? "border-[var(--foco)] bg-slate-50 font-semibold text-slate-900" : "border-slate-300 bg-white text-slate-800"
              }`}
            >
              <option value="TODOS">{todos}</option>
              {lista.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </>
  );
}

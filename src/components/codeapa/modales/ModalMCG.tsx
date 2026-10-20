"use client";

import { CRITERIOS_INCLUSION_MCG } from "@/lib/codeapa/datosClinicos";

export function ModalMCG({
  isOpen,
  onClose,
  estadoActual,
}: {
  isOpen: boolean;
  onClose: () => void;
  estadoActual?: string | null;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
              Protocolo Oficial SAS — Resolución BOJA 2026
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              3. Monitorización Continua de Glucosa (MCG)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Resumen de Estados */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div
            className={`rounded-xl border p-4 ${
              estadoActual === "SI"
                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 font-bold text-emerald-800">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              SÍ
            </div>
            <p className="text-xs text-slate-600">
              Cumple criterios de inclusión y lo tiene puesto.
            </p>
            <div className="mt-2 text-[11px] text-slate-500">
              • Integración SAS: Sí/No
              <br />• Revisiones cada tres meses
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              estadoActual === "NO"
                ? "border-slate-400 bg-slate-100 ring-2 ring-slate-400"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 font-bold text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              NO
            </div>
            <p className="text-xs text-slate-600">
              No cumple criterios de inclusión o cumple criterios de exclusión.
            </p>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              estadoActual === "DEBERIA"
                ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 font-bold text-amber-800">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              DEBERÍA
            </div>
            <p className="text-xs text-slate-600">
              No la porta pero cumple alguno de los criterios de inclusión.
            </p>
          </div>
        </div>

        {/* Criterios de Inclusión */}
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-900">
            Criterios de Inclusión (Resolución BOJA 2026)
          </h3>

          <div className="space-y-3 text-sm text-slate-800">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="font-semibold text-sky-800">{CRITERIOS_INCLUSION_MCG.criterio1A}</p>
            </div>

            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="font-semibold text-sky-800">{CRITERIOS_INCLUSION_MCG.criterio1B}</p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-700">
                {CRITERIOS_INCLUSION_MCG.situaciones1B.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="font-semibold text-slate-900">Requisitos indispensables en todos los casos:</p>
              <ul className="mt-1 list-disc pl-5 space-y-1 text-slate-600">
                {CRITERIOS_INCLUSION_MCG.requisitosIndispensables.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Criterios de Retirada */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-900">
            Criterios de Retirada de la MCG
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
            {CRITERIOS_INCLUSION_MCG.criteriosRetirada.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

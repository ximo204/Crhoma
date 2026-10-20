"use client";

import { TIPOS_DIABETES_INFO } from "@/lib/codeapa/datosClinicos";

export function ModalTipoDiabetes({
  tipoActual,
  isOpen,
  onClose,
}: {
  tipoActual?: string | null;
  isOpen: boolean;
  onClose: () => void;
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
              Guía Clínica Oficial CODEAPA
            </span>
            <h2 className="text-xl font-bold text-slate-900">1. Tipos de Diabetes y Tratamiento de Elección</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Características clave</th>
                <th className="px-4 py-3 font-semibold">OBSERVACIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {Object.values(TIPOS_DIABETES_INFO).map((t) => {
                const esSeleccionado = tipoActual === t.id || tipoActual === t.nombre;
                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      esSeleccionado ? "bg-sky-50 font-medium" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-sky-900">
                      <div className="flex items-center gap-2">
                        {esSeleccionado && <span className="h-2 w-2 rounded-full bg-sky-600" />}
                        {t.nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.caracteristicas}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{t.observaciones}</p>
                      <span className="mt-1 block text-xs italic text-slate-400">Fuente: {t.fuente}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
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

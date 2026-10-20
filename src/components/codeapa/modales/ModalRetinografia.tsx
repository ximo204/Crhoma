"use client";

import { PROTOCOLO_RETINOGRAFIA } from "@/lib/codeapa/datosClinicos";

export function ModalRetinografia({
  isOpen,
  onClose,
}: {
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
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
              Guía Oficial CODEAPA — Página 10
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Cribado de Retinopatía Diabética (Retinografía) y Circuitos Asistenciales
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

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Situación Clínica</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Periodicidad / Próximo Control</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Circuito Asistencial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {PROTOCOLO_RETINOGRAFIA.map((p, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition-colors ${
                    p.periodicidad.includes("Desaparece")
                      ? "bg-amber-50/70 font-medium text-amber-900"
                      : "text-slate-700"
                  }`}
                >
                  <td className="px-4 py-3.5 font-medium">{p.situacionClinica}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-bold text-sky-900">{p.periodicidad}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{p.circuito}</td>
                </tr>
              ))}
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

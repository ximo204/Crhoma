"use client";

import { OBJETIVOS_CONTROL_GLUCEMICO } from "@/lib/codeapa/datosClinicos";

export function ModalObjetivosGlucemicos({
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
              Guía Oficial CODEAPA — Páginas 6 y 10
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              5. Objetivos de Control Glucémico (Individualizados) & Seguimiento
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
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Perfil del Paciente</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">HbA1c Objetivo</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Glucemia Basal (GB)</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Glucemia Postprandial</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Frecuencia de HbA1c</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {OBJETIVOS_CONTROL_GLUCEMICO.map((o, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{o.perfil}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-bold text-sky-700">{o.hba1cObjetivo}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{o.glucemiaBasal}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{o.glucemiaPostprandial}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{o.frecuenciaHbA1c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sección T.A. */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-800">
            6. Control Periódico de la Presión Arterial (T.A.)
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
            <li>
              <strong>General:</strong> &lt; 140/90 mmHg (individualizar &lt; 130/80 si joven, buena tolerancia o albuminuria). Frecuencia: en cada visita (mínimo semestral; anual si normal).
            </li>
            <li>
              <strong>Anciano frágil:</strong> &lt; 140/90 mmHg, evitar PAS &lt; 120–130 mmHg. En cada visita.
            </li>
            <li>
              <strong>DM1 / Riesgo CV elevado:</strong> &lt; 130/80 mmHg. En cada visita.
            </li>
          </ul>
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

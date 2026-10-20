"use client";

export function ModalPieDiabetico({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const filas = [
    {
      riesgo: "Bajo",
      criterios: "Monofilamento y diapasón normales; sin deformidad; pulsos presentes",
      frecuencia: "Anual",
      clase: "bg-emerald-50 text-emerald-900 border-emerald-200",
    },
    {
      riesgo: "Moderado",
      criterios: "Neuropatía (monofilamento y/o diapasón alterados), sin deformidad ni EAP",
      frecuencia: "Cada 6 meses",
      clase: "bg-yellow-50 text-yellow-900 border-yellow-200",
    },
    {
      riesgo: "Alto",
      criterios: "Neuropatía + deformidad y/o EAP (sin úlcera previa)",
      frecuencia: "Cada 3-4 meses",
      clase: "bg-amber-50 text-amber-900 border-amber-200",
    },
    {
      riesgo: "Muy alto",
      criterios: "Antecedente de úlcera y/o amputación previa",
      frecuencia: "Cada 1-3 meses",
      clase: "bg-red-50 text-red-900 border-red-200",
    },
  ];

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
              Guía Oficial CODEAPA — Página 7
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Exploración del Pie Diabético, Estratificación del Riesgo y Próximo Control
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
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Nivel de Riesgo</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Criterios Clínicos</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Periodicidad / Próxima Revisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filas.map((f, idx) => (
                <tr key={idx} className={f.clase}>
                  <td className="whitespace-nowrap px-4 py-3.5 font-bold">{f.riesgo}</td>
                  <td className="px-4 py-3.5">{f.criterios}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-bold">{f.frecuencia}</td>
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

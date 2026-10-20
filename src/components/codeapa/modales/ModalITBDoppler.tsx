"use client";

import { TABLA_ITB_COMPLETA, PERLAS_CLINICAS_ITB } from "@/lib/codeapa/datosClinicos";
import { OndaDopplerSVG, type TipoOndaDoppler } from "@/components/codeapa/OndaDopplerSVG";

export function ModalITBDoppler({
  itbActual,
  isOpen,
  onClose,
}: {
  itbActual?: number | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const getTipoOnda = (resultado: string): TipoOndaDoppler => {
    if (resultado.includes(">")) return "CALCIFICACION";
    if (resultado.includes("1,00")) return "TRIFASICA";
    if (resultado.includes("0,91")) return "TRIFASICA_BIFASICA";
    if (resultado.includes("0,80")) return "BIFASICA";
    if (resultado.includes("0,60")) return "MONOFASICA";
    return "MONOFASICA_GRAVE";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Clínica */}
        <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                CODEAPA • Tabla Oficial
              </span>
              <span className="text-xs text-slate-500">Páginas 8 y 9 del Documento</span>
            </div>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              ITB (Índice Tobillo-Brazo) y Morfología Doppler: Interpretación y Recomendación de Terapia Compresiva
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {itbActual != null && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-950">
            <span className="font-semibold text-slate-700">Valor ITB del paciente seleccionado:</span>
            <span className="rounded-md border border-sky-300 bg-white px-2.5 py-1 font-mono text-sm font-bold text-sky-800 shadow-2xs">
              {itbActual}
            </span>
          </div>
        )}

        {/* Tabla con Gráficos de Ondas Doppler */}
        <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm">
          <table className="min-w-full divide-y divide-slate-300 text-left text-xs">
            <thead className="bg-[#0f4c5c] text-white">
              <tr>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">ITB</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">Morfología Doppler (Ondas)</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">Interpretación Clínica</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">Recomendación de Terapia Compresiva</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">Presión Recomendada (mmHg)</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">Conducta Clínica Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {TABLA_ITB_COMPLETA.map((f, idx) => {
                const tipoOnda = getTipoOnda(f.resultado);

                let badgeColor = "bg-slate-50 text-slate-800";
                if (f.severidad === "alerta-maxima") badgeColor = "bg-red-50 text-red-950 font-medium";
                if (f.severidad === "riesgo-alto") badgeColor = "bg-amber-50 text-amber-950";
                if (f.severidad === "riesgo-medio") badgeColor = "bg-yellow-50 text-yellow-950";
                if (f.severidad === "normal") badgeColor = "bg-emerald-50 text-emerald-950";

                return (
                  <tr key={idx} className={`transition-colors hover:bg-slate-50/80 ${badgeColor}`}>
                    <td className="whitespace-nowrap px-3 py-3 text-sm font-extrabold text-slate-900">
                      {f.resultado}
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1.5">
                        <span className="block font-bold text-slate-800">{f.morfologia}</span>
                        <OndaDopplerSVG tipo={tipoOnda} width={135} height={52} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700 leading-relaxed">{f.interpretacion}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900 leading-relaxed">
                      {f.recomendacionCompresion}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-slate-800">
                      {f.presionRecomendada}
                    </td>
                    <td className="px-3 py-3 text-slate-700 leading-relaxed">{f.conductaClinica}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Perlas Clínicas del Documento */}
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Perlas Clínicas
            </span>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 leading-relaxed">
            {PERLAS_CLINICAS_ITB.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0f4c5c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0c3c49]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ComplicacionEvaluada } from "@/lib/codeapa/complicaciones";
import { guardarCampo } from "@/lib/codeapa/actions";
import { useRouter } from "next/navigation";

export function ModalComplicaciones({
  complicaciones,
  pacienteId,
  isOpen,
  onClose,
  soloLectura = false,
}: {
  complicaciones: ComplicacionEvaluada[];
  pacienteId: string;
  isOpen: boolean;
  onClose: () => void;
  soloLectura?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<ComplicacionEvaluada[]>(complicaciones || []);
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  async function toggleComplicacion(id: string, valorActual: boolean) {
    if (soloLectura) return;
    const nuevoValor = !valorActual;
    
    // Actualización optimista local
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, presente: nuevoValor, origen: "manual" } : c))
    );

    setGuardando(true);
    await guardarCampo({
      tabla: "complicaciones",
      registroId: null,
      campo: id,
      tipo: "booleano",
      valor: nuevoValor ? "si" : "no",
      pacienteId,
    });
    setGuardando(false);
    router.refresh();
  }

  const micro = items.filter((c) => c.categoria === "MICROVASCULARES");
  const macro = items.filter((c) => c.categoria === "MACROVASCULARES");
  const pie = items.filter((c) => c.categoria === "PIE_DIABETICO");
  const otras = items.filter((c) => c.categoria === "OTRAS");

  const totalActivas = items.filter((c) => c.presente).length;

  const renderTablaSeccion = (titulo: string, lista: ComplicacionEvaluada[]) => (
    <div className="mb-4">
      <h3 className="mb-2 bg-sky-950 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-200 rounded-t-lg">
        {titulo}
      </h3>
      <div className="overflow-x-auto rounded-b-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">Complicación</th>
              <th className="px-3 py-2 font-semibold">Cómo se valora / Criterio</th>
              <th className="w-28 px-3 py-2 text-center font-semibold">¿Presente?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {lista.map((c) => (
              <tr
                key={c.id}
                onClick={() => !soloLectura && toggleComplicacion(c.id, c.presente)}
                className={`transition-colors ${
                  c.presente ? "bg-amber-50/70" : "hover:bg-slate-50"
                } ${!soloLectura ? "cursor-pointer" : ""}`}
              >
                <td className="px-3 py-2.5 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        c.presente ? "bg-amber-500" : "bg-slate-300"
                      }`}
                    />
                    {c.nombre}
                  </div>
                  {c.motivoDetectado && (
                    <span className="mt-0.5 block text-[11px] font-normal text-amber-800">
                      ⚡ {c.motivoDetectado}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{c.criterioClinico}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <label className="flex items-center gap-1 text-slate-700">
                      <input
                        type="checkbox"
                        checked={c.presente}
                        disabled={soloLectura}
                        onChange={() => toggleComplicacion(c.id, c.presente)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Sí</span>
                    </label>
                    <label className="flex items-center gap-1 text-slate-500">
                      <input
                        type="checkbox"
                        checked={!c.presente}
                        disabled={soloLectura}
                        onChange={() => toggleComplicacion(c.id, c.presente)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-400 focus:ring-slate-400"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
              Guía Oficial CODEAPA — Páginas 11 a 14
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Checklist Integral de Complicaciones</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  totalActivas > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {totalActivas} activa(s)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Las complicaciones detectadas automáticamente por analítica o exploración aparecen marcadas con ⚡ y pueden ajustarse manualmente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {guardando && (
          <div className="mb-3 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 animate-pulse">
            Guardando cambios clínicos en la base de datos local...
          </div>
        )}

        <div className="space-y-4">
          {renderTablaSeccion("Complicaciones Microvasculares", micro)}
          {renderTablaSeccion("Complicaciones Macrovasculares (Riesgo Cardiovascular)", macro)}
          {renderTablaSeccion("Complicaciones de Pie Diabético", pie)}
          {renderTablaSeccion("Otras Complicaciones Asociadas (Hepáticas, Digestivas, Cognitivas)", otras)}
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

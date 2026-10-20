"use client";

import { useState } from "react";
import { TRATAMIENTOS_INFO } from "@/lib/codeapa/datosClinicos";

export function ModalTratamientos({
  tratamientosSeleccionados,
  onGuardar,
  isOpen,
  onClose,
  soloLectura = false,
}: {
  tratamientosSeleccionados: string[];
  onGuardar?: (seleccionados: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  soloLectura?: boolean;
}) {
  const [seleccionados, setSeleccionados] = useState<string[]>(tratamientosSeleccionados || []);

  if (!isOpen) return null;

  function toggleTratamiento(id: string) {
    if (soloLectura) return;
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleGuardar() {
    if (onGuardar) {
      onGuardar(seleccionados);
    }
    onClose();
  }

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
            <h2 className="text-xl font-bold text-slate-900">2. Tipos de Tratamiento (Selección Múltiple)</h2>
            <p className="text-xs text-slate-500">
              Marca los tratamientos que aplican al paciente (se pueden mezclar y seleccionar varios).
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

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                {!soloLectura && <th className="w-10 px-3 py-3 text-center">Sel.</th>}
                <th className="px-4 py-3 font-semibold">Tipo de Tratamiento</th>
                <th className="px-4 py-3 font-semibold">Características clave</th>
                <th className="px-4 py-3 font-semibold">OBSERVACIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {TRATAMIENTOS_INFO.map((t) => {
                const activo = seleccionados.includes(t.id);
                return (
                  <tr
                    key={t.id}
                    onClick={() => !soloLectura && toggleTratamiento(t.id)}
                    className={`cursor-pointer transition-colors ${
                      activo ? "bg-sky-50 font-medium" : "hover:bg-slate-50"
                    }`}
                  >
                    {!soloLectura && (
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={activo}
                          onChange={() => toggleTratamiento(t.id)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-sky-900">
                      {t.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.caracteristicas}</td>
                    <td className="px-4 py-3 text-slate-600">{t.observaciones}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {soloLectura ? "Cerrar" : "Cancelar"}
          </button>
          {!soloLectura && (
            <button
              type="button"
              onClick={handleGuardar}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Guardar Tratamientos Seleccionados
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

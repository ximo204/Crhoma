"use client";

import { useEffect, useState } from "react";
import { guardarCampo } from "@/lib/codeapa/actions";

/** Ventana para leer y editar las notas u observaciones de un paciente. */
export function ModalNotas({
  paciente,
  onClose,
  onGuardado,
}: {
  /** Paciente cuyas notas se editan; null = ventana cerrada. */
  paciente: { id: string; nombre: string | null; notas: string | null } | null;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTexto(paciente?.notas ?? "");
    setError(null);
  }, [paciente]);

  if (!paciente) return null;

  const sinCambios = texto.trim() === (paciente.notas ?? "").trim();

  async function guardar() {
    if (!paciente) return;
    setGuardando(true);
    setError(null);
    const res = await guardarCampo({
      tabla: "paciente",
      registroId: paciente.id,
      campo: "notas",
      tipo: "textoLargo",
      valor: texto,
      pacienteId: paciente.id,
    });
    setGuardando(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onGuardado();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">Notas</span>
            <h3 className="text-base font-bold text-slate-900">{paciente.nombre ?? "Paciente sin nombre"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoFocus
          rows={8}
          placeholder="Escribe aquí notas u observaciones sobre el paciente…"
          className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || sinCambios}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

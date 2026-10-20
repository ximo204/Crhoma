"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ResultadoCampo } from "@/lib/crhoma/types";
import { COLORES_ESTADO } from "@/lib/crhoma/colores";
import { guardarCampo } from "@/lib/codeapa/actions";

function valorInicialEdicion(campo: ResultadoCampo): string {
  const editable = campo.editable;
  if (!editable) return "";
  if (editable.tipo === "booleano" || editable.tipo === "booleanoTriEstado") {
    if (campo.valor === "Sí") return "si";
    if (campo.valor === "No") return "no";
    return "";
  }
  return campo.valor == null ? "" : String(campo.valor);
}

export function CeldaFicha({ campo, pacienteId }: { campo: ResultadoCampo; pacienteId: string }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(() => valorInicialEdicion(campo));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const color = COLORES_ESTADO[campo.estado];
  const esCalculado = Boolean(campo.formula);
  const esTextoLargo = campo.editable?.tipo === "textoLargo";
  const sinDatos = campo.valor == null || campo.valor === "";

  function abrir() {
    setValor(valorInicialEdicion(campo));
    setEditando(false);
    setError(null);
    setAbierta(true);
  }

  async function guardar() {
    if (!campo.editable) return;
    setGuardando(true);
    setError(null);
    const resultado = await guardarCampo({
      tabla: campo.editable.tabla,
      registroId: campo.editable.registroId,
      campo: campo.editable.campo,
      tipo: campo.editable.tipo,
      valor,
      pacienteId,
    });
    setGuardando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setAbierta(false);
    setEditando(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={`group flex w-full flex-col items-start gap-1 rounded-lg border border-l-4 px-3.5 py-3 text-left shadow-sm transition-colors ${color.fondo} ${color.borde} ${color.bordeIzquierdo}`}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {campo.etiqueta}
          </span>
          {esCalculado ? (
            <span
              className="text-[10px] font-semibold text-slate-300 group-hover:text-slate-400"
              title="Valor calculado automáticamente"
            >
              ƒx
            </span>
          ) : campo.editable ? (
            <span
              className="text-[10px] text-slate-300 group-hover:text-slate-400"
              title="Se puede editar"
            >
              ✎
            </span>
          ) : null}
        </span>
        <span
          className={`${
            esTextoLargo ? "line-clamp-3 whitespace-pre-line break-words text-sm" : "text-lg"
          } font-semibold leading-tight ${sinDatos ? "text-slate-300" : color.texto}`}
        >
          {sinDatos ? "—" : String(campo.valor)}
          {campo.unidad && !sinDatos ? (
            <span className="ml-1 text-sm font-normal text-slate-400">{campo.unidad}</span>
          ) : null}
        </span>
        {campo.interpretacion && !sinDatos && (
          <span className="text-xs text-slate-500">{campo.interpretacion}</span>
        )}
      </button>

      {abierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          onClick={() => setAbierta(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900">{campo.etiqueta}</h3>
              <button
                type="button"
                onClick={() => setAbierta(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {!editando ? (
              <>
                <div className={`mb-4 flex items-center gap-3 rounded-xl border p-3.5 ${color.fondo} ${color.borde}`}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.punto}`} />
                  <div>
                    <div
                      className={`${
                        esTextoLargo ? "whitespace-pre-line break-words text-sm font-medium" : "text-xl font-bold"
                      } ${sinDatos ? "text-slate-400" : color.texto}`}
                    >
                      {sinDatos ? "Sin dato" : String(campo.valor)}
                      {campo.unidad && !sinDatos ? (
                        <span className="ml-1 text-sm font-normal text-slate-500">{campo.unidad}</span>
                      ) : null}
                    </div>
                    <div className="text-xs font-medium text-slate-500">{color.etiqueta}</div>
                  </div>
                </div>

                {campo.interpretacion && (
                  <p className="mb-4 text-sm text-slate-700">{campo.interpretacion}</p>
                )}

                {campo.formula && (
                  <div className="mb-4">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Cómo se ha calculado
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
                      {campo.formula}
                    </div>
                  </div>
                )}

                {campo.entradas && campo.entradas.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Valores usados
                    </div>
                    <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
                      {campo.entradas.map((entrada) => (
                        <li
                          key={entrada.etiqueta}
                          className="flex justify-between gap-2 bg-slate-50/50 px-3 py-1.5 text-sm"
                        >
                          <span className="text-slate-500">{entrada.etiqueta}</span>
                          <span className="font-medium text-slate-800">
                            {entrada.valor}
                            {entrada.unidad ? ` ${entrada.unidad}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {campo.rangoNormal && (
                  <div className="mb-4 text-sm">
                    <span className="font-semibold text-slate-500">Rango normal: </span>
                    <span className="text-slate-700">{campo.rangoNormal}</span>
                  </div>
                )}

                {campo.observaciones && (
                  <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {campo.observaciones}
                  </p>
                )}

                {campo.fuente && (
                  <p className="mb-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    Fuente: {campo.fuente}
                  </p>
                )}

                {campo.editable && (
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
                  >
                    Editar este valor
                  </button>
                )}
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nuevo valor
                </label>
                {campo.editable?.opciones ? (
                  <select
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    autoFocus
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Sin especificar</option>
                    {campo.editable.opciones.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.texto}
                      </option>
                    ))}
                  </select>
                ) : esTextoLargo ? (
                  <textarea
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    autoFocus
                    rows={6}
                    className="mb-3 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                ) : (
                  <input
                    type={
                      campo.editable?.tipo === "numero"
                        ? "number"
                        : campo.editable?.tipo === "fecha"
                        ? "date"
                        : "text"
                    }
                    step={campo.editable?.tipo === "numero" ? "any" : undefined}
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    autoFocus
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                )}

                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(false);
                      setError(null);
                    }}
                    disabled={guardando}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={guardar}
                    disabled={guardando}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {guardando && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {guardando ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

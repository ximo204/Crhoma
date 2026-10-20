"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarFiliacion, type DatosFiliacion } from "@/lib/codeapa/actions";

/** Convierte una fecha de la base de datos al formato que espera <input type="date">. */
function aValorInput(fecha: Date | string | null): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function ModalFiliacion({
  pacienteId,
  inicial,
  isOpen,
  onClose,
}: {
  pacienteId: string;
  inicial: {
    nombre: string | null;
    nuhsa: string;
    sexo: string;
    fechaNacimiento: Date | string | null;
    centroSalud: string | null;
    claveMedica: string | null;
    claveEnfermeria: string | null;
    claveEquipo: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [datos, setDatos] = useState<DatosFiliacion>(() => ({
    nombre: inicial.nombre ?? "",
    nuhsa: inicial.nuhsa,
    sexo: inicial.sexo,
    fechaNacimiento: aValorInput(inicial.fechaNacimiento),
    centroSalud: inicial.centroSalud ?? "",
    claveMedica: inicial.claveMedica ?? "",
    claveEnfermeria: inicial.claveEnfermeria ?? "",
    claveEquipo: inicial.claveEquipo ?? "",
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campoConError, setCampoConError] = useState<keyof DatosFiliacion | null>(null);

  if (!isOpen) return null;

  const set = (campo: keyof DatosFiliacion) => (valor: string) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (campoConError === campo) {
      setCampoConError(null);
      setError(null);
    }
  };

  async function guardar() {
    setGuardando(true);
    setError(null);
    setCampoConError(null);

    const resultado = await guardarFiliacion(pacienteId, datos);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      setCampoConError(resultado.campo ?? null);
      return;
    }

    // El NUHSA se normaliza en el servidor: reflejamos lo que se ha guardado.
    setDatos((d) => ({ ...d, nuhsa: resultado.nuhsaGuardado }));
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Historia CRHOMA
            </span>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Corregir datos del paciente
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Los cambios se reflejan al momento en Diabetes y en Heridas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Identidad */}
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Identidad
        </h3>
        <div className="mb-5 grid gap-3.5 sm:grid-cols-2">
          <CampoTexto
            etiqueta="Nombre y apellidos"
            valor={datos.nombre}
            onChange={set("nombre")}
            placeholder="ej. María García López"
          />
          <CampoTexto
            etiqueta="NUHSA"
            valor={datos.nuhsa}
            onChange={set("nuhsa")}
            placeholder="ej. AN1234567890"
            obligatorio
            mono
            conError={campoConError === "nuhsa"}
            ayuda="Identificador único. Si solo escribes los dígitos se le añade «AN» delante."
          />
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Sexo <span className="text-rose-500">*</span>
            </label>
            <select
              value={datos.sexo}
              onChange={(e) => set("sexo")(e.target.value)}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 ${
                campoConError === "sexo"
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"
              }`}
            >
              <option value="">Sin especificar</option>
              <option value="H">Hombre</option>
              <option value="M">Mujer</option>
            </select>
          </div>
          <CampoTexto
            etiqueta="Fecha de nacimiento"
            valor={datos.fechaNacimiento}
            onChange={set("fechaNacimiento")}
            tipo="date"
            conError={campoConError === "fechaNacimiento"}
          />
        </div>

        {/* Asignación en el SAS */}
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Centro y cupo
        </h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <CampoTexto
            etiqueta="Centro"
            valor={datos.centroSalud}
            onChange={set("centroSalud")}
            placeholder="ej. C.S. La Línea Poniente"
          />
          <CampoTexto
            etiqueta="Clave médica"
            valor={datos.claveMedica}
            onChange={set("claveMedica")}
            placeholder="ej. MED-104"
          />
          <CampoTexto
            etiqueta="Clave enfermería"
            valor={datos.claveEnfermeria}
            onChange={set("claveEnfermeria")}
            placeholder="ej. ENF-201"
          />
          <CampoTexto
            etiqueta="Clave equipo"
            valor={datos.claveEquipo}
            onChange={set("claveEquipo")}
            placeholder="ej. EQ-04"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {guardando && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampoTexto({
  etiqueta,
  valor,
  onChange,
  placeholder,
  tipo = "text",
  obligatorio = false,
  mono = false,
  conError = false,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  obligatorio?: boolean;
  mono?: boolean;
  conError?: boolean;
  ayuda?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {etiqueta} {obligatorio && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 ${
          mono ? "font-mono" : ""
        } ${
          conError
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
            : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"
        }`}
      />
      {ayuda && <p className="mt-1 text-[10.5px] leading-snug text-slate-400">{ayuda}</p>}
    </div>
  );
}

"use client";

import { useFormStatus } from "react-dom";

/** Botón de envío que muestra un pequeño spinner mientras el formulario se está guardando. */
export function BotonEnviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {pending ? "Guardando…" : children}
    </button>
  );
}

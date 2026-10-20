import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  nombre: string;
  ayuda?: string;
};

export function Campo({ etiqueta, nombre, ayuda, ...props }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{etiqueta}</span>
      <input
        name={nombre}
        {...props}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />
      {ayuda && <span className="text-xs text-slate-400">{ayuda}</span>}
    </label>
  );
}

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta: string;
  nombre: string;
  opciones: { valor: string; texto: string }[];
  placeholder?: string;
};

export function CampoSelect({ etiqueta, nombre, opciones, placeholder = "Sin especificar", ...props }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{etiqueta}</span>
      <select
        name={nombre}
        defaultValue=""
        {...props}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        <option value="">{placeholder}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}

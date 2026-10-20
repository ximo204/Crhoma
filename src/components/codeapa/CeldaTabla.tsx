import type { ResultadoCampo } from "@/lib/crhoma/types";

const COLOR_TEXTO: Record<ResultadoCampo["estado"], string> = {
  bajo: "text-sky-700",
  normal: "text-slate-700",
  alto: "text-amber-700 font-semibold",
  "muy-alto": "text-red-700 font-semibold",
  "sin-datos": "text-slate-300",
};

export function CeldaTabla({ campo }: { campo: ResultadoCampo | undefined }) {
  if (!campo || campo.valor == null || campo.valor === "") {
    return <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-sm text-slate-300">—</td>;
  }

  const texto = String(campo.valor);
  return (
    <td
      className={`whitespace-nowrap border border-slate-200 px-3 py-2.5 text-sm ${COLOR_TEXTO[campo.estado]}`}
      title={campo.interpretacion}
    >
      {texto.length > 22 ? `${texto.slice(0, 22)}…` : texto}
      {campo.unidad ? <span className="ml-0.5 text-xs font-normal text-slate-400">{campo.unidad}</span> : null}
    </td>
  );
}

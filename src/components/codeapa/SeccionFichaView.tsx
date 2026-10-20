import type { SeccionFicha } from "@/lib/codeapa/ficha";
import { CeldaFicha } from "./CeldaFicha";

export function SeccionFichaView({ seccion, pacienteId }: { seccion: SeccionFicha; pacienteId: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {seccion.titulo}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {seccion.campos.map((campo) => (
          <CeldaFicha key={campo.id} campo={campo} pacienteId={pacienteId} />
        ))}
      </div>
    </section>
  );
}

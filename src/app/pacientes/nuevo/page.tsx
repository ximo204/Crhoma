import Link from "next/link";
import { crearPaciente } from "@/lib/codeapa/actions";
import { Campo } from "@/components/ui/Campo";
import { CampoSelect } from "@/components/ui/CampoSelect";
import { BotonEnviar } from "@/components/ui/BotonEnviar";
import { TRATAMIENTOS_INFO } from "@/lib/codeapa/datosClinicos";

export default async function NuevoPacientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/pacientes"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-700"
      >
        ← Volver a Pacientes
      </Link>
      <div className="flex items-center gap-2">
        <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
          CODEAPA
        </span>
        <span className="text-xs text-slate-400">Atención Primaria</span>
      </div>
      <h1 className="mb-6 mt-1 text-2xl font-bold tracking-tight text-slate-900">
        Nuevo Paciente Diabético
      </h1>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={crearPaciente} className="space-y-6">
        {/* Filiación */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            1. Filiación y Datos Administrativos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo etiqueta="NUHSA *" nombre="nuhsa" placeholder="ej. AN1234567890" required />
            <Campo etiqueta="Nombre y Apellidos" nombre="nombre" placeholder="ej. María García López" />
            <CampoSelect
              etiqueta="Sexo *"
              nombre="sexo"
              required
              opciones={[
                { valor: "H", texto: "Hombre" },
                { valor: "M", texto: "Mujer" },
              ]}
            />
            <Campo etiqueta="Fecha de nacimiento" nombre="fechaNacimiento" type="date" />
            <Campo etiqueta="Centro" nombre="centroSalud" placeholder="ej. C.S. Ronda Sur" />
            <Campo etiqueta="Clave médica" nombre="claveMedica" placeholder="ej. MED-412" />
            <Campo etiqueta="Clave enfermería" nombre="claveEnfermeria" placeholder="ej. ENF-809" />
            <Campo etiqueta="Clave equipo" nombre="claveEquipo" placeholder="ej. EQ-03" />
          </div>
        </section>

        {/* Diabetes y Tratamientos */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            2. Tipo de Diabetes, Tratamientos y MCG
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <CampoSelect
              etiqueta="Tipo de diabetes"
              nombre="tipoDiabetes"
              opciones={[
                { valor: "TIPO_1", texto: "DM tipo 1" },
                { valor: "TIPO_2", texto: "DM tipo 2" },
                { valor: "GESTACIONAL", texto: "DM gestacional" },
                { valor: "LADA", texto: "LADA" },
                { valor: "SECUNDARIA_FARMACOS", texto: "Secundaria a fármacos" },
                { valor: "OTRA", texto: "Otra" },
              ]}
            />
            <CampoSelect
              etiqueta="Monitorización Continua de Glucosa (MCG)"
              nombre="mcgEstado"
              opciones={[
                { valor: "SI", texto: "Sí, cumple criterios y la lleva" },
                { valor: "NO", texto: "No cumple criterios" },
                { valor: "DEBERIA", texto: "Debería (cumple criterios pero no la lleva)" },
              ]}
            />
            <CampoSelect
              etiqueta="Perfil de control glucémico / Fragilidad"
              nombre="perfilControlGlucemico"
              placeholder="General / DM2 reciente"
              opciones={[
                { valor: "GENERAL", texto: "General / DM2 reciente (HbA1c < 7%)" },
                { valor: "ANCIANO_FRAGIL", texto: "Anciano frágil / comorbilidad (HbA1c < 8-8.5%)" },
                { valor: "DM1_INTENSIVO", texto: "DM1 / tratamiento intensivo (HbA1c < 7%)" },
                { valor: "GESTACION", texto: "Gestación (HbA1c < 6-6.5%)" },
              ]}
            />
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="embarazo"
                  value="true"
                  className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                />
                <span>🤰 Paciente en gestación / programación</span>
              </label>
            </div>
          </div>

          {/* Selector múltiple de tipos de tratamiento */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Tratamientos de Elección (Selección múltiple / combinable)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              {TRATAMIENTOS_INFO.map((t) => (
                <label
                  key={t.id}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 hover:bg-sky-50/50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    name="tratamientos"
                    value={t.id}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900">{t.nombreCorto}</span>
                    <span className="block text-[11px] text-slate-500 line-clamp-1">{t.caracteristicas}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Antecedentes */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            3. Antecedentes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoSelect
              etiqueta="Tiempo de evolución"
              nombre="tiempoEvolucionDiabetes"
              opciones={[
                { valor: "<=5", texto: "≤ 5 años" },
                { valor: "5-10", texto: "5 – 10 años" },
                { valor: ">=10", texto: "≥ 10 años" },
              ]}
            />
            <CampoSelect
              etiqueta="Antecedentes familiares"
              nombre="antecedentesFamiliaresDiabetes"
              opciones={[
                { valor: "N", texto: "No" },
                { valor: "1_GRADO", texto: "1º grado" },
                { valor: "2_GRADO", texto: "2º grado" },
                { valor: "3_GRADO", texto: "3º grado" },
              ]}
            />
            <CampoSelect
              etiqueta="Diabetes gestacional previa"
              nombre="diabetesGestacionalPrevia"
              opciones={[
                { valor: "NO", texto: "No" },
                { valor: "NO_SIGUE", texto: "Sí (No sigue tras embarazo)" },
                { valor: "SIGUE", texto: "Sí (Sigue tras embarazo)" },
                { valor: "APARECE_A_LOS_X", texto: "Aparece a los X años" },
              ]}
            />
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/pacientes"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <BotonEnviar>Crear Paciente y Abrir Ficha</BotonEnviar>
        </div>
      </form>
    </main>
  );
}

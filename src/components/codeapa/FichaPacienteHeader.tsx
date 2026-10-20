"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModalTipoDiabetes } from "./modales/ModalTipoDiabetes";
import { ModalTratamientos } from "./modales/ModalTratamientos";
import { ModalMCG } from "./modales/ModalMCG";
import { ModalITBDoppler } from "./modales/ModalITBDoppler";
import { ModalPieDiabetico } from "./modales/ModalPieDiabetico";
import { ModalRetinografia } from "./modales/ModalRetinografia";
import { ModalObjetivosGlucemicos } from "./modales/ModalObjetivosGlucemicos";
import { ModalComplicaciones } from "./modales/ModalComplicaciones";
import { ModalFiliacion } from "./ModalFiliacion";
import { formatearTratamientos } from "@/lib/codeapa/ficha";
import { guardarCampo } from "@/lib/codeapa/actions";
import type { ComplicacionEvaluada } from "@/lib/codeapa/complicaciones";
import { ChartCard, SinDatosGrafico } from "@/components/charts/ChartCard";
import { TrendLineChart, type SerieLinea } from "@/components/charts/TrendLineChart";
import { BarChart, type CategoriaBarras } from "@/components/charts/BarChart";
import { DonutChart, type SegmentoDonut } from "@/components/charts/DonutChart";
import { CATEGORICO, SERIE_UNICA, ESTADO } from "@/lib/charts/colores";
import type {
  ControlGlicada,
  ControlTA,
  Medicion,
  Paciente,
  VisitaPeriodo,
} from "@/generated/prisma";

export function FichaPacienteHeader({
  paciente,
  periodoActual,
  todasLasVisitas,
  complicaciones,
  historialGlicada,
  historialTA,
  historialMediciones,
}: {
  paciente: Paciente;
  periodoActual?: string;
  todasLasVisitas: VisitaPeriodo[];
  complicaciones: ComplicacionEvaluada[];
  historialGlicada: ControlGlicada[];
  historialTA: ControlTA[];
  historialMediciones: Medicion[];
  historialPie?: unknown[];
}) {
  const router = useRouter();

  const [modalTipoOpen, setModalTipoOpen] = useState(false);
  const [modalTtoOpen, setModalTtoOpen] = useState(false);
  const [modalMCGOpen, setModalMCGOpen] = useState(false);
  const [modalITBOpen, setModalITBOpen] = useState(false);
  const [modalPieOpen, setModalPieOpen] = useState(false);
  const [modalRetinoOpen, setModalRetinoOpen] = useState(false);
  const [modalObjetivosOpen, setModalObjetivosOpen] = useState(false);
  const [modalComplicacionesOpen, setModalComplicacionesOpen] = useState(false);
  const [modalEvolucionOpen, setModalEvolucionOpen] = useState(false);
  const [modalFiliacionOpen, setModalFiliacionOpen] = useState(false);

  // Edad calculada a partir de la fecha de nacimiento (años cumplidos).
  let edad: number | null = null;
  if (paciente.fechaNacimiento) {
    const nac = new Date(paciente.fechaNacimiento);
    if (!Number.isNaN(nac.getTime())) {
      const hoy = new Date();
      edad = hoy.getFullYear() - nac.getFullYear();
      const noHaCumplido =
        hoy.getMonth() < nac.getMonth() ||
        (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate());
      if (noHaCumplido) edad -= 1;
    }
  }

  let ttosArray: string[] = [];
  try {
    ttosArray = JSON.parse(paciente.tratamientoDiabetes ?? "[]");
  } catch {
    if (paciente.tratamientoDiabetes) ttosArray = [paciente.tratamientoDiabetes];
  }

  async function handleGuardarTratamientos(seleccionados: string[]) {
    await guardarCampo({
      tabla: "paciente",
      registroId: paciente.id,
      campo: "tratamientoDiabetes",
      tipo: "texto",
      valor: JSON.stringify(seleccionados),
      pacienteId: paciente.id,
    });
    router.refresh();
  }

  const totalComplicaciones = complicaciones.filter((c) => c.presente).length;

  // --- Datos derivados para los gráficos de evolución ---
  // El historial llega ordenado de más reciente a más antiguo (para las
  // tablas); los gráficos de tendencia necesitan el orden inverso para
  // leerse de izquierda (pasado) a derecha (presente).
  const glicadaAscendente = [...historialGlicada].reverse();
  const serieHbA1c: SerieLinea[] = [
    {
      nombre: "HbA1c",
      color: SERIE_UNICA,
      unidad: "%",
      puntos: glicadaAscendente.map((g) => ({
        x: g.fecha ? new Date(g.fecha).toLocaleDateString("es-ES", { month: "short", year: "2-digit" }) : "—",
        y: g.hba1c,
      })),
    },
  ];

  const taAscendente = [...historialTA].reverse();
  const categoriasTA: CategoriaBarras[] = taAscendente
    .filter((t) => t.pas != null || t.pad != null)
    .map((t) => ({
      etiqueta: t.fecha ? new Date(t.fecha).toLocaleDateString("es-ES", { month: "short", year: "2-digit" }) : "—",
      grupos: [
        { nombre: "PAS", valor: t.pas ?? 0, color: CATEGORICO[0] },
        { nombre: "PAD", valor: t.pad ?? 0, color: CATEGORICO[1] },
      ],
    }));

  // Reparto del histórico de HbA1c por banda de control. Con menos de dos
  // bandas realmente representadas, un donut no aporta nada — se omite y se
  // deja que la tarjeta no se muestre (ver más abajo).
  let buenas = 0,
    moderadas = 0,
    malas = 0;
  for (const g of historialGlicada) {
    if (g.hba1c == null) continue;
    if (g.hba1c < 7) buenas++;
    else if (g.hba1c <= 8.5) moderadas++;
    else malas++;
  }
  const segmentosControl: SegmentoDonut[] = [
    { etiqueta: "Buen control (<7%)", valor: buenas, color: ESTADO.bueno },
    { etiqueta: "Control moderado (7–8,5%)", valor: moderadas, color: ESTADO.aviso },
    { etiqueta: "Mal control (>8,5%)", valor: malas, color: ESTADO.critico },
  ];
  const bandasConDatos = segmentosControl.filter((s) => s.valor > 0).length;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {paciente.nombre ?? "Paciente sin nombre"}
            </h1>
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700">
              {paciente.nuhsa}
            </span>
            <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
              {paciente.sexo === "H" ? "Hombre" : paciente.sexo === "M" ? "Mujer" : "Sexo sin indicar"}
            </span>
            {edad !== null && (
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {edad} años
              </span>
            )}
            {periodoActual && (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                Período: {periodoActual}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              <strong>Nacimiento:</strong>{" "}
              {paciente.fechaNacimiento
                ? new Date(paciente.fechaNacimiento).toLocaleDateString("es-ES")
                : "Sin registrar"}
            </span>
            <span>
              <strong>Centro:</strong> {paciente.centroSalud ?? "No asignado"}
            </span>
            <span>
              <strong>Clave Médica:</strong> {paciente.claveMedica ?? "—"}
            </span>
            <span>
              <strong>Clave Enfermería:</strong> {paciente.claveEnfermeria ?? "—"}
            </span>
            <span>
              <strong>Equipo:</strong> {paciente.claveEquipo ?? "—"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalFiliacionOpen(true)}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <span>✎</span>
            <span>Corregir nombre, NUHSA, sexo, fecha o cupo</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalEvolucionOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 shadow-sm hover:bg-sky-100"
          >
            📊 Ver Evolución Histórica ({todasLasVisitas.length > 0 ? `${todasLasVisitas.length} períodos` : "1 período"})
          </button>
        </div>
      </div>

      {/* Badges y accesos directos a guías de este paciente */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setModalTipoOpen(true)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-800"
        >
          🏷️ Tipo: <strong>{paciente.tipoDiabetes ?? "Sin definir"}</strong> ✎
        </button>

        <button
          type="button"
          onClick={() => setModalTtoOpen(true)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-800"
        >
          💊 Tratamiento: <strong>{formatearTratamientos(paciente.tratamientoDiabetes)}</strong> ✎
        </button>

        <button
          type="button"
          onClick={() => setModalMCGOpen(true)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            paciente.mcgEstado === "SI"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : paciente.mcgEstado === "DEBERIA"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
          } hover:opacity-90`}
        >
          📡 MCG: <strong>{paciente.mcgEstado ?? "No evaluado"}</strong> ✎
        </button>

        {paciente.embarazo && (
          <span className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-800">
            🤰 En Gestación
          </span>
        )}

        <button
          type="button"
          onClick={() => setModalComplicacionesOpen(true)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            totalComplicaciones > 0
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          } hover:opacity-90`}
        >
          ⚠️ Complicaciones: <strong>{totalComplicaciones} activa(s)</strong> ✎
        </button>
      </div>

      {/* Corrección de los datos de filiación del paciente */}
      <ModalFiliacion
        pacienteId={paciente.id}
        inicial={{
          nombre: paciente.nombre,
          nuhsa: paciente.nuhsa,
          sexo: paciente.sexo,
          fechaNacimiento: paciente.fechaNacimiento,
          centroSalud: paciente.centroSalud,
          claveMedica: paciente.claveMedica,
          claveEnfermeria: paciente.claveEnfermeria,
          claveEquipo: paciente.claveEquipo,
        }}
        isOpen={modalFiliacionOpen}
        onClose={() => setModalFiliacionOpen(false)}
      />

      {/* Modales Clínicos */}
      <ModalTipoDiabetes
        tipoActual={paciente.tipoDiabetes}
        isOpen={modalTipoOpen}
        onClose={() => setModalTipoOpen(false)}
      />

      <ModalTratamientos
        tratamientosSeleccionados={ttosArray}
        isOpen={modalTtoOpen}
        onClose={() => setModalTtoOpen(false)}
        onGuardar={handleGuardarTratamientos}
      />

      <ModalMCG
        estadoActual={paciente.mcgEstado}
        isOpen={modalMCGOpen}
        onClose={() => setModalMCGOpen(false)}
      />

      <ModalITBDoppler
        isOpen={modalITBOpen}
        onClose={() => setModalITBOpen(false)}
      />

      <ModalPieDiabetico
        isOpen={modalPieOpen}
        onClose={() => setModalPieOpen(false)}
      />

      <ModalRetinografia
        isOpen={modalRetinoOpen}
        onClose={() => setModalRetinoOpen(false)}
      />

      <ModalObjetivosGlucemicos
        isOpen={modalObjetivosOpen}
        onClose={() => setModalObjetivosOpen(false)}
      />

      <ModalComplicaciones
        complicaciones={complicaciones}
        pacienteId={paciente.id}
        isOpen={modalComplicacionesOpen}
        onClose={() => setModalComplicacionesOpen(false)}
      />

      {/* Modal de Evolución Histórica de Períodos */}
      {modalEvolucionOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setModalEvolucionOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                  Seguimiento Longitudinal
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Evolución Histórica de Períodos del Paciente
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalEvolucionOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Evolución de HbA1c: línea de tendencia */}
              <ChartCard
                titulo="Histórico de HbA1c (Hemoglobina Glicada)"
                subtitulo="Línea de tendencia frente al objetivo general (<7%)"
                tabla={
                  historialGlicada.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin registros históricos de HbA1c.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                        <thead className="bg-slate-100 font-semibold text-slate-700">
                          <tr>
                            <th className="px-3 py-2">Fecha</th>
                            <th className="px-3 py-2">Período</th>
                            <th className="px-3 py-2">Cifra HbA1c</th>
                            <th className="px-3 py-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {historialGlicada.map((g, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-slate-600">
                                {g.fecha ? new Date(g.fecha).toLocaleDateString("es-ES") : "—"}
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-800">
                                {g.periodo || (g.fecha ? new Date(g.fecha).getFullYear().toString() : "—")}
                              </td>
                              <td className="px-3 py-2 font-bold text-sky-800">{g.hba1c}%</td>
                              <td className="px-3 py-2">
                                {g.hba1c != null && g.hba1c < 7 ? (
                                  <span className="text-emerald-700 font-medium">Buen control (&lt;7%)</span>
                                ) : g.hba1c != null && g.hba1c <= 8.5 ? (
                                  <span className="text-amber-700 font-medium">Control moderado</span>
                                ) : (
                                  <span className="text-red-700 font-bold">Mal control (&gt;8.5%)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              >
                {historialGlicada.length === 0 ? (
                  <SinDatosGrafico texto="Sin registros históricos de HbA1c." />
                ) : (
                  <TrendLineChart series={serieHbA1c} objetivo={{ valor: 7, etiqueta: "Objetivo <7%" }} />
                )}
              </ChartCard>

              {/* Reparto del histórico de HbA1c por banda de control */}
              {bandasConDatos >= 2 && (
                <ChartCard
                  titulo="Tiempo en cada banda de control (histórico)"
                  subtitulo="Proporción de analíticas de HbA1c en cada franja"
                  tabla={
                    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                      {segmentosControl.map((s) => (
                        <li key={s.etiqueta} className="flex items-center justify-between px-3 py-2">
                          <span className="font-medium text-slate-700">{s.etiqueta}</span>
                          <strong className="text-slate-900">{s.valor}</strong>
                        </li>
                      ))}
                    </ul>
                  }
                >
                  <DonutChart
                    segmentos={segmentosControl}
                    centroTitulo={String(buenas + moderadas + malas)}
                    centroSubtitulo="analíticas"
                  />
                </ChartCard>
              )}

              {/* Evolución de Peso e IMC */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Histórico de Antropometría (Peso, Talla, Cintura)
                </h3>
                {historialMediciones.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin registros antropométricos.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                      <thead className="bg-slate-100 font-semibold text-slate-700">
                        <tr>
                          <th className="px-3 py-2">Fecha</th>
                          <th className="px-3 py-2">Peso</th>
                          <th className="px-3 py-2">Talla</th>
                          <th className="px-3 py-2">Cintura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {historialMediciones.map((m, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-slate-600">
                              {m.fecha ? new Date(m.fecha).toLocaleDateString("es-ES") : "—"}
                            </td>
                            <td className="px-3 py-2 font-medium">{m.pesoKg ? `${m.pesoKg} kg` : "—"}</td>
                            <td className="px-3 py-2 font-medium">{m.tallaM ? `${m.tallaM} m` : "—"}</td>
                            <td className="px-3 py-2 font-medium">{m.perimetroCinturaCm ? `${m.perimetroCinturaCm} cm` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Evolución de Presión Arterial: barras agrupadas PAS/PAD */}
              <ChartCard
                titulo="Histórico de Presión Arterial (T.A.)"
                subtitulo="mmHg por visita"
                tabla={
                  historialTA.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin registros de T.A.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                        <thead className="bg-slate-100 font-semibold text-slate-700">
                          <tr>
                            <th className="px-3 py-2">Fecha</th>
                            <th className="px-3 py-2">PAS</th>
                            <th className="px-3 py-2">PAD</th>
                            <th className="px-3 py-2">Cifra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {historialTA.map((t, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-slate-600">
                                {t.fecha ? new Date(t.fecha).toLocaleDateString("es-ES") : "—"}
                              </td>
                              <td className="px-3 py-2">{t.pas ?? "—"}</td>
                              <td className="px-3 py-2">{t.pad ?? "—"}</td>
                              <td className="px-3 py-2 font-bold">{t.pas && t.pad ? `${t.pas}/${t.pad} mmHg` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              >
                {categoriasTA.length === 0 ? (
                  <SinDatosGrafico texto="Sin registros de T.A." />
                ) : (
                  <BarChart categorias={categoriasTA} unidad="" mostrarLeyenda />
                )}
              </ChartCard>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalEvolucionOpen(false)}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

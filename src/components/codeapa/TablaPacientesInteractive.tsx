"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { COLUMNAS_TABLA, agruparColumnas } from "@/lib/codeapa/resumenTabla";
import { ModalTipoDiabetes } from "./modales/ModalTipoDiabetes";
import { ModalTratamientos } from "./modales/ModalTratamientos";
import { ModalMCG } from "./modales/ModalMCG";
import { ModalITBDoppler } from "./modales/ModalITBDoppler";
import { ModalPieDiabetico } from "./modales/ModalPieDiabetico";
import { ModalRetinografia } from "./modales/ModalRetinografia";
import { ModalObjetivosGlucemicos } from "./modales/ModalObjetivosGlucemicos";
import { ModalComplicaciones } from "./modales/ModalComplicaciones";
import { ModalNotas } from "./modales/ModalNotas";
import { useRouter } from "next/navigation";
import { buscarPacientes, guardarCampo } from "@/lib/codeapa/actions";
import type { FiltrosPacientes, FilaPacienteUI, OpcionesCupo, PaginaPacientes } from "@/lib/codeapa/listaPacientes";
import { PanelEstadisticas } from "./PanelEstadisticas";
import { CUPO_TODOS, FiltrosCupo, cuentaFiltrosCupo, type ValoresCupo } from "./FiltrosCupo";
import type { ComplicacionEvaluada } from "@/lib/codeapa/complicaciones";

/**
 * Grupos de columnas que se muestran en la vista reducida.
 *
 * La tabla completa tiene 37 columnas y obliga a mucho desplazamiento
 * horizontal. La vista reducida deja lo que se consulta a diario; el resto
 * sigue estando disponible con un clic.
 */
const GRUPOS_VISTA_ESENCIAL = [
  "FILIACIÓN",
  "DIABETES",
  "GLICADA",
  "PIE DIABÉTICO",
];

const CLAVE_ALMACEN_COLUMNAS = "codeapa:columnasVisibles";
const CLAVE_ALMACEN_CUPO = "codeapa:cupo";

export function TablaPacientesInteractive({
  paginaInicial,
  periodosDisponibles,
  opcionesCupo,
}: {
  paginaInicial: PaginaPacientes;
  periodosDisponibles: string[];
  opcionesCupo: OpcionesCupo;
}) {
  const router = useRouter();

  // Estados de Búsqueda y Filtros Clínicos
  const [busqueda, setBusqueda] = useState("");
  const [cupo, setCupoEstado] = useState<ValoresCupo>(CUPO_TODOS);
  const [filtroTipoDiab, setFiltroTipoDiab] = useState("TODOS");
  const [filtroMCG, setFiltroMCG] = useState("TODOS");
  const [filtroRiesgoPie, setFiltroRiesgoPie] = useState("TODOS");
  const [filtroRetino, setFiltroRetino] = useState("TODOS");
  const [filtroComplicaciones, setFiltroComplicaciones] = useState("TODOS");
  const [filtroEmbarazo, setFiltroEmbarazo] = useState("TODOS");
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("TODOS");

  // Estado de modales
  const [modalTipoOpen, setModalTipoOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);

  const [modalTtoOpen, setModalTtoOpen] = useState(false);
  const [pacienteTto, setPacienteTto] = useState<{ id: string; ttos: string[] } | null>(null);

  const [modalMCGOpen, setModalMCGOpen] = useState(false);
  const [mcgEstado, setMcgEstado] = useState<string | null>(null);

  const [modalITBOpen, setModalITBOpen] = useState(false);
  const [itbValor, setItbValor] = useState<number | null>(null);

  const [modalPieOpen, setModalPieOpen] = useState(false);
  const [modalRetinoOpen, setModalRetinoOpen] = useState(false);
  const [modalObjetivosOpen, setModalObjetivosOpen] = useState(false);

  const [modalComplicacionesOpen, setModalComplicacionesOpen] = useState(false);
  const [complicacionesData, setComplicacionesData] = useState<{
    pacienteId: string;
    lista: ComplicacionEvaluada[];
  } | null>(null);

  // Panel de filtros plegado por defecto: ocupa mucho y no se toca en cada consulta.
  const [pacienteNotas, setPacienteNotas] = useState<FilaPacienteUI["paciente"] | null>(null);

  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [panelColumnasAbierto, setPanelColumnasAbierto] = useState(false);

  // Grupos de columnas visibles. Se recuerda la elección entre sesiones.
  const todosLosGrupos = useMemo(
    () => Array.from(new Set(COLUMNAS_TABLA.map((c) => c.grupo))),
    []
  );
  const [gruposVisibles, setGruposVisibles] = useState<string[]>(todosLosGrupos);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_ALMACEN_COLUMNAS);
      if (!guardado) return;
      const lista = JSON.parse(guardado) as string[];
      // Solo se aceptan grupos que sigan existiendo en la tabla.
      const validos = lista.filter((g) => todosLosGrupos.includes(g));
      if (validos.length > 0) setGruposVisibles(validos);
    } catch {
      // Si el valor guardado no es válido, se queda la vista completa.
    }
  }, [todosLosGrupos]);

  // El cupo elegido se recuerda entre sesiones: casi siempre se trabaja con
  // el mismo. Solo se aceptan valores que sigan existiendo. Se lee una única
  // vez: tras cada edición llegan opciones nuevas (router.refresh) y volver a
  // aplicarlo devolvería la tabla a la primera página.
  const cupoRestaurado = useRef(false);
  useEffect(() => {
    if (cupoRestaurado.current) return;
    cupoRestaurado.current = true;
    try {
      const guardado = window.localStorage.getItem(CLAVE_ALMACEN_CUPO);
      if (!guardado) return;
      const v = JSON.parse(guardado) as Partial<ValoresCupo>;
      const valido = (x: unknown, lista: string[]) =>
        typeof x === "string" && lista.includes(x) ? x : "TODOS";
      setCupoEstado({
        claveMedica: valido(v.claveMedica, opcionesCupo.clavesMedicas),
        claveEnfermeria: valido(v.claveEnfermeria, opcionesCupo.clavesEnfermeria),
        centro: valido(v.centro, opcionesCupo.centros),
      });
    } catch {
      // Valor guardado no válido: se queda toda el área.
    }
  }, [opcionesCupo]);

  function setCupo(nuevo: ValoresCupo) {
    setCupoEstado(nuevo);
    try {
      window.localStorage.setItem(CLAVE_ALMACEN_CUPO, JSON.stringify(nuevo));
    } catch {
      // Sin almacenamiento disponible la elección solo dura esta sesión.
    }
  }

  function cambiarGruposVisibles(nuevos: string[]) {
    setGruposVisibles(nuevos);
    try {
      window.localStorage.setItem(CLAVE_ALMACEN_COLUMNAS, JSON.stringify(nuevos));
    } catch {
      // Sin almacenamiento disponible la elección solo dura esta sesión.
    }
  }

  function alternarGrupo(grupo: string) {
    const yaEsta = gruposVisibles.includes(grupo);
    // Nunca se dejan todas las columnas ocultas.
    if (yaEsta && gruposVisibles.length === 1) return;
    cambiarGruposVisibles(
      yaEsta
        ? gruposVisibles.filter((g) => g !== grupo)
        : todosLosGrupos.filter((g) => gruposVisibles.includes(g) || g === grupo)
    );
  }

  const columnasVisibles = useMemo(
    () => COLUMNAS_TABLA.filter((c) => gruposVisibles.includes(c.grupo)),
    [gruposVisibles]
  );
  const grupos = useMemo(() => agruparColumnas(columnasVisibles), [columnasVisibles]);
  const vistaCompleta = gruposVisibles.length === todosLosGrupos.length;

  // Comprobar si hay filtros activos
  const numeroFiltrosActivos = [
    filtroTipoDiab,
    filtroMCG,
    filtroRiesgoPie,
    filtroRetino,
    filtroComplicaciones,
    filtroEmbarazo,
    periodoSeleccionado,
  ].filter((v) => v !== "TODOS").length;

  const hayFiltrosActivos = busqueda.trim() !== "" || numeroFiltrosActivos > 0 || cuentaFiltrosCupo(cupo) > 0;

  function limpiarTodosFiltros() {
    setBusqueda("");
    setCupo(CUPO_TODOS);
    setFiltroTipoDiab("TODOS");
    setFiltroMCG("TODOS");
    setFiltroRiesgoPie("TODOS");
    setFiltroRetino("TODOS");
    setFiltroComplicaciones("TODOS");
    setFiltroEmbarazo("TODOS");
    setPeriodoSeleccionado("TODOS");
  }

  // La búsqueda y los filtros se resuelven en el servidor, que devuelve solo
  // la página visible: con miles de pacientes, mandarlos todos al navegador
  // dejaba la pantalla bloqueada.
  const filtros: FiltrosPacientes = useMemo(
    () => ({
      busqueda,
      ...cupo,
      tipoDiab: filtroTipoDiab,
      mcg: filtroMCG,
      riesgoPie: filtroRiesgoPie,
      retino: filtroRetino,
      complicaciones: filtroComplicaciones,
      embarazo: filtroEmbarazo,
      periodo: periodoSeleccionado,
    }),
    [busqueda, cupo, filtroTipoDiab, filtroMCG, filtroRiesgoPie, filtroRetino, filtroComplicaciones, filtroEmbarazo, periodoSeleccionado]
  );
  const [datos, setDatos] = useState<PaginaPacientes>(paginaInicial);
  const [cargando, setCargando] = useState(false);
  const ultimaPeticion = useRef(0);

  const cargarPagina = useCallback(async (f: FiltrosPacientes, pagina: number) => {
    // Si llegan respuestas desordenadas (se teclea rápido), solo vale la última.
    const id = ++ultimaPeticion.current;
    setCargando(true);
    try {
      const res = await buscarPacientes(f, pagina);
      if (id === ultimaPeticion.current) setDatos(res);
    } finally {
      if (id === ultimaPeticion.current) setCargando(false);
    }
  }, []);

  // Al cambiar los filtros se vuelve a la primera página. La búsqueda espera a
  // que se deje de teclear para no pedir una página por cada letra.
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    const t = setTimeout(() => cargarPagina(filtros, 0), 250);
    return () => clearTimeout(t);
  }, [filtros, cargarPagina]);

  // Tras guardar algo, la página se refresca (router.refresh) y llega una
  // paginaInicial nueva: se vuelve a pedir la página que se estaba viendo.
  const datosRef = useRef(datos);
  datosRef.current = datos;
  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;
  const montada = useRef(false);
  useEffect(() => {
    if (!montada.current) {
      montada.current = true;
      return;
    }
    cargarPagina(filtrosRef.current, datosRef.current.pagina);
  }, [paginaInicial, cargarPagina]);

  const filasFiltradas = datos.filas;

  async function handleGuardarTratamientos(seleccionados: string[]) {
    if (!pacienteTto) return;
    await guardarCampo({
      tabla: "paciente",
      registroId: pacienteTto.id,
      campo: "tratamientoDiabetes",
      tipo: "texto",
      valor: JSON.stringify(seleccionados),
      pacienteId: pacienteTto.id,
    });
    router.refresh();
  }

  return (
    <>
      {/* Barra de búsqueda siempre visible, con filtros y columnas plegables */}
      <div className="mb-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          {/* Búsqueda: es lo que se usa en casi todas las consultas */}
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Buscar paciente
            </label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, NUHSA, fecha de nacimiento o centro…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-xs text-slate-800 focus:border-[#0f4c5c] focus:outline-none focus:ring-1 focus:ring-[#0f4c5c]"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                  aria-label="Borrar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cupo: afecta a la vez a la analítica y a la tabla */}
          <FiltrosCupo valores={cupo} opciones={opcionesCupo} onChange={setCupo} />

          {/* Filtros clínicos */}
          <button
            type="button"
            onClick={() => {
              setFiltrosAbiertos((v) => !v);
              setPanelColumnasAbierto(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              hayFiltrosActivos
                ? "border-[#0f4c5c] bg-[#0f4c5c] text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Filtros</span>
            {hayFiltrosActivos && (
              <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-black">
                {numeroFiltrosActivos}
              </span>
            )}
            <span className="text-[10px]">{filtrosAbiertos ? "▲" : "▼"}</span>
          </button>

          {/* Columnas visibles */}
          <button
            type="button"
            onClick={() => {
              setPanelColumnasAbierto((v) => !v);
              setFiltrosAbiertos(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              vistaCompleta
                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                : "border-sky-400 bg-sky-50 text-sky-900"
            }`}
          >
            <span>Columnas</span>
            <span className="rounded-full bg-slate-200/80 px-1.5 text-[10px] font-black text-slate-700">
              {columnasVisibles.length}
            </span>
            <span className="text-[10px]">{panelColumnasAbierto ? "▲" : "▼"}</span>
          </button>

          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700">
            {datos.totalFiltrados} de {datos.total}
          </span>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarTodosFiltros}
              className="py-2 text-xs font-semibold text-[#0f4c5c] hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Panel de columnas visibles */}
        {panelColumnasAbierto && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Qué columnas quieres ver
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cambiarGruposVisibles(GRUPOS_VISTA_ESENCIAL)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Vista reducida
                </button>
                <button
                  type="button"
                  onClick={() => cambiarGruposVisibles(todosLosGrupos)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Todas ({COLUMNAS_TABLA.length})
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {todosLosGrupos.map((g) => {
                const activo = gruposVisibles.includes(g);
                const cuantas = COLUMNAS_TABLA.filter((c) => c.grupo === g).length;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => alternarGrupo(g)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      activo
                        ? "border-[#0f4c5c] bg-[#0f4c5c] text-white"
                        : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span>{activo ? "✓" : "＋"}</span>
                    <span>{g}</span>
                    <span className={activo ? "text-white/60" : "text-slate-400"}>{cuantas}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[10.5px] text-slate-500">
              Tu elección se recuerda para la próxima vez. La columna del
              paciente y la de complicaciones siempre se muestran.
            </p>
          </div>
        )}

        {/* Filtros clínicos (plegados por defecto) */}
        {filtrosAbiertos && (
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtro Tipo de Diabetes */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tipo de Diabetes
            </label>
            <select
              value={filtroTipoDiab}
              onChange={(e) => setFiltroTipoDiab(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#0f4c5c] focus:outline-none focus:ring-1 focus:ring-[#0f4c5c]"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="TIPO_1">DM Tipo 1</option>
              <option value="TIPO_2">DM Tipo 2</option>
              <option value="GESTACIONAL">DM Gestacional</option>
              <option value="LADA">LADA</option>
              <option value="SECUNDARIA">Secundaria a fármacos</option>
            </select>
          </div>

          {/* Filtro MCG */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Monitorización (MCG)
            </label>
            <select
              value={filtroMCG}
              onChange={(e) => setFiltroMCG(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#0f4c5c] focus:outline-none focus:ring-1 focus:ring-[#0f4c5c]"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="SI">Sí (La tiene puesta)</option>
              <option value="DEBERIA">Debería (Cumple criterios)</option>
              <option value="NO">No (No cumple criterios)</option>
            </select>
          </div>

          {/* Filtro Riesgo Pie Diabético */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Riesgo Pie Diabético
            </label>
            <select
              value={filtroRiesgoPie}
              onChange={(e) => setFiltroRiesgoPie(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#0f4c5c] focus:outline-none focus:ring-1 focus:ring-[#0f4c5c]"
            >
              <option value="TODOS">Todos los riesgos</option>
              <option value="Bajo">Bajo (Revisión anual)</option>
              <option value="Moderado">Moderado (Cada 6 meses)</option>
              <option value="Alto">Alto (Cada 3-4 meses)</option>
              <option value="Muy alto">Muy alto (Cada 1-3 meses)</option>
            </select>
          </div>

          {/* Filtro Retinografía */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cribado Retinografía
            </label>
            <select
              value={filtroRetino}
              onChange={(e) => setFiltroRetino(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#0f4c5c] focus:outline-none focus:ring-1 focus:ring-[#0f4c5c]"
            >
              <option value="TODOS">Todos los resultados</option>
              <option value="NORMAL">Normal (Seguimiento rutinario)</option>
              <option value="PATOLOGICA">Patológica (Derivación 2º nivel)</option>
              <option value="NO_REALIZADA">No realizada</option>
            </select>
          </div>

          {/* Filtro Complicaciones */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Complicaciones
            </label>
            <select
              value={filtroComplicaciones}
              onChange={(e) => setFiltroComplicaciones(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#0f4c5c] focus:outline-none focus:ring-1 focus:ring-[#0f4c5c]"
            >
              <option value="TODOS">Todas las situaciones</option>
              <option value="CON">Con complicaciones activas</option>
              <option value="SIN">Sin complicaciones registradas</option>
            </select>
          </div>

          {/* Filtro Período / Año */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Período / Año Visita
            </label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#0f4c5c] focus:outline-none focus:ring-1 focus:ring-[#0f4c5c]"
            >
              <option value="TODOS">Todos los períodos / Último año</option>
              {periodosDisponibles.map((p) => (
                <option key={p} value={p}>
                  Año {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        )}
      </div>

      {/* Analítica de los mismos pacientes que la tabla (mismos filtros) */}
      <div className={`transition-opacity ${cargando ? "opacity-60" : ""}`}>
        <PanelEstadisticas resumen={datos.estadisticas} />
      </div>

      {/* Botones de Consulta a Guías Oficiales */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Consultar criterios oficiales:
        </span>
        <button
          type="button"
          onClick={() => {
            setTipoSeleccionado(null);
            setModalTipoOpen(true);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f4c5c]"
        >
          Tipos de Diabetes
        </button>
        <button
          type="button"
          onClick={() => {
            setPacienteTto(null);
            setModalTtoOpen(true);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f4c5c]"
        >
          Tratamientos
        </button>
        <button
          type="button"
          onClick={() => {
            setMcgEstado(null);
            setModalMCGOpen(true);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f4c5c]"
        >
          Criterios MCG
        </button>
        <button
          type="button"
          onClick={() => {
            setItbValor(null);
            setModalITBOpen(true);
          }}
          className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900 shadow-2xs hover:bg-sky-100"
        >
          Tabla ITB & Doppler (Ondas)
        </button>
        <button
          type="button"
          onClick={() => setModalPieOpen(true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f4c5c]"
        >
          Pie Diabético
        </button>
        <button
          type="button"
          onClick={() => setModalRetinoOpen(true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f4c5c]"
        >
          Retinografía
        </button>
        <button
          type="button"
          onClick={() => setModalObjetivosOpen(true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f4c5c]"
        >
          Objetivos Glucémicos
        </button>
      </div>

      {/* Tabla Principal de Pacientes */}
      {datos.totalFiltrados === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          <p className="font-semibold text-slate-700">No se encontraron pacientes con los filtros seleccionados.</p>
          <button
            type="button"
            onClick={limpiarTodosFiltros}
            className="mt-3 rounded-lg bg-[#0f4c5c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c49]"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <>
        {/* Leyenda: qué hace cada casilla al pulsarla */}
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600">Al pulsar una casilla:</span>
          <span className="inline-flex items-center gap-1">
            <span className="text-slate-400">ℹ</span> consulta los criterios oficiales
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-sky-500">✎</span> cambia el valor
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[#0f4c5c]">nombre del paciente</span> abre su historia completa
          </span>
        </div>

        <div
          className={`overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm transition-opacity ${
            cargando ? "opacity-60" : ""
          }`}
        >
          <table className="min-w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-20 border border-slate-300 bg-[#0f4c5c] px-4 py-2.5 font-bold uppercase tracking-wider text-white shadow-sm"
                >
                  PACIENTE
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-300 bg-[#0f4c5c] px-3 py-2.5 font-bold uppercase tracking-wider text-white"
                >
                  NOTAS
                </th>
                {grupos.map((g) => (
                  <th
                    key={g.grupo}
                    colSpan={g.columnas.length}
                    className="border border-slate-300 bg-[#0f4c5c] px-3 py-2 text-center font-bold uppercase tracking-wider text-white"
                  >
                    {g.grupo}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="border border-slate-300 bg-[#0f4c5c] px-3 py-2.5 text-center font-bold uppercase tracking-wider text-white"
                >
                  COMPLICACIONES
                </th>
              </tr>
              <tr>
                {columnasVisibles.map((columna) => (
                  <th
                    key={columna.id}
                    className="whitespace-nowrap border border-slate-300 bg-slate-100 px-3 py-2 font-bold text-slate-700"
                  >
                    {columna.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filasFiltradas.map(({ paciente, fila, complicacionesActivas, complicacionesDetalle }, i) => (
                <tr key={paciente.id} className={i % 2 === 1 ? "bg-slate-50/60" : "bg-white"}>
                  {/* Columna fija de Paciente — puerta a su historia CRHOMA */}
                  <td className="sticky left-0 z-10 whitespace-nowrap border border-slate-200 bg-inherit px-4 py-2.5">
                    <Link
                      href={`/pacientes/${paciente.id}`}
                      title={`Abrir la historia completa de ${paciente.nombre ?? "este paciente"}`}
                      className="group/pac block"
                    >
                      <span className="font-bold text-[#0f4c5c] underline decoration-transparent decoration-2 underline-offset-2 group-hover/pac:decoration-[#0f4c5c]">
                        {paciente.nombre ?? "Sin nombre"}
                      </span>
                      <span className="ml-1.5 text-[10px] text-slate-400 group-hover/pac:text-[#0f4c5c]">
                        abrir →
                      </span>
                      <span className="block font-mono text-[11px] text-slate-500">
                        {paciente.nuhsa}
                      </span>
                    </Link>
                  </td>

                  {/* Notas libres del profesional: al pulsar se leen enteras y se editan */}
                  <td
                    onClick={() => setPacienteNotas(paciente)}
                    title={paciente.notas ?? "Pulsa para añadir una nota"}
                    className="cursor-pointer border border-slate-200 px-3 py-2 text-xs transition-colors hover:bg-sky-100/70"
                  >
                    {paciente.notas ? (
                      <span className="block max-w-[220px] truncate text-slate-800">{paciente.notas}</span>
                    ) : (
                      <span className="whitespace-nowrap text-slate-300">+ añadir nota</span>
                    )}
                  </td>

                  {/* Celdas interactivas */}
                  {columnasVisibles.map((columna) => {
                    const campo = fila[columna.id];
                    const valorStr = campo?.valor != null && campo.valor !== "" ? String(campo.valor) : "—";
                    const sinDato = valorStr === "—";

                    let onClickHandler: (() => void) | undefined = undefined;
                    let cursorClass = "";
                    // Distingue las casillas que sólo consultan criterios (ℹ) de
                    // las que además guardan un valor (✎). Antes todas tenían el
                    // mismo aspecto clicable y parecía que se podían editar todas.
                    let tipoAccion: "info" | "edita" | null = null;

                    if (columna.id === "tipoDiabetes") {
                      cursorClass = "cursor-pointer hover:bg-sky-100/70 font-semibold text-sky-950";
                      tipoAccion = "info";
                      onClickHandler = () => {
                        setTipoSeleccionado(paciente.tipoDiabetes);
                        setModalTipoOpen(true);
                      };
                    } else if (columna.id === "tratamiento") {
                      cursorClass = "cursor-pointer hover:bg-sky-100/70 font-medium text-slate-900";
                      tipoAccion = "edita";
                      onClickHandler = () => {
                        let ttos: string[] = [];
                        try {
                          ttos = JSON.parse(paciente.tratamientoDiabetes ?? "[]");
                        } catch {
                          if (paciente.tratamientoDiabetes) ttos = [paciente.tratamientoDiabetes];
                        }
                        setPacienteTto({ id: paciente.id, ttos });
                        setModalTtoOpen(true);
                      };
                    } else if (columna.id === "mcgEstado") {
                      cursorClass = "cursor-pointer hover:bg-sky-100/70 font-bold";
                      tipoAccion = "info";
                      onClickHandler = () => {
                        setMcgEstado(paciente.mcgEstado);
                        setModalMCGOpen(true);
                      };
                    } else if (columna.id === "itb") {
                      cursorClass = "cursor-pointer hover:bg-sky-100/70 font-bold text-sky-900";
                      tipoAccion = "info";
                      onClickHandler = () => {
                        setItbValor(typeof campo?.valor === "number" ? campo.valor : null);
                        setModalITBOpen(true);
                      };
                    } else if (columna.id === "riesgoPie" || columna.id === "pieProxControl") {
                      cursorClass = "cursor-pointer hover:bg-sky-100/70 font-medium";
                      tipoAccion = "info";
                      onClickHandler = () => setModalPieOpen(true);
                    } else if (columna.id === "retinografiaResultado" || columna.id === "retinoProxControl") {
                      cursorClass = "cursor-pointer hover:bg-sky-100/70 font-medium";
                      tipoAccion = "info";
                      onClickHandler = () => setModalRetinoOpen(true);
                    } else if (columna.id === "glucemiaBasal" || columna.id === "objetivoHbA1c" || columna.id === "perfilControlGlucemico") {
                      cursorClass = "cursor-pointer hover:bg-sky-100/70";
                      tipoAccion = "info";
                      onClickHandler = () => setModalObjetivosOpen(true);
                    }

                    // Colores de estado clínico
                    let estadoClass = "text-slate-800";
                    if (sinDato) estadoClass = "text-slate-300";
                    else if (campo?.estado === "alto") estadoClass = "text-amber-800 font-semibold bg-amber-50/50";
                    else if (campo?.estado === "muy-alto") estadoClass = "text-red-800 font-bold bg-red-50/60";
                    else if (campo?.estado === "bajo") estadoClass = "text-sky-800 font-medium";

                    return (
                      <td
                        key={columna.id}
                        onClick={onClickHandler}
                        className={`group/celda whitespace-nowrap border border-slate-200 px-3 py-2 text-xs transition-colors ${estadoClass} ${cursorClass}`}
                        title={
                          tipoAccion === "info"
                            ? `Ver criterios oficiales. ${campo?.interpretacion || ""}`.trim()
                            : tipoAccion === "edita"
                            ? `Pulsa para cambiar este valor. ${campo?.interpretacion || ""}`.trim()
                            : campo?.interpretacion
                        }
                      >
                        <span className="flex items-center gap-1.5">
                          {columna.id === "itb" && !sinDato ? (
                            <>
                              <span>{valorStr}</span>
                              <span className="rounded bg-slate-900 px-1 py-0.2 font-mono text-[9px] text-yellow-400">
                                onda ∿
                              </span>
                            </>
                          ) : (
                            <span>
                              {valorStr.length > 25 ? `${valorStr.slice(0, 25)}…` : valorStr}
                              {campo?.unidad && !sinDato ? (
                                <span className="ml-0.5 text-[10px] text-slate-500">{campo.unidad}</span>
                              ) : null}
                            </span>
                          )}

                          {tipoAccion && (
                            <span
                              aria-hidden
                              className={`ml-auto text-[10px] ${
                                tipoAccion === "edita"
                                  ? "text-sky-500"
                                  : "text-slate-300 group-hover/celda:text-slate-500"
                              }`}
                            >
                              {tipoAccion === "edita" ? "✎" : "ℹ"}
                            </span>
                          )}
                        </span>
                      </td>
                    );
                  })}

                  {/* Columna interactiva de Complicaciones */}
                  <td
                    onClick={() => {
                      setComplicacionesData({
                        pacienteId: paciente.id,
                        lista: complicacionesDetalle,
                      });
                      setModalComplicacionesOpen(true);
                    }}
                    className="cursor-pointer whitespace-nowrap border border-slate-200 px-3 py-2 text-center font-bold hover:bg-sky-100/70 transition-colors"
                  >
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                        complicacionesActivas > 0
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}
                    >
                      {complicacionesActivas > 0
                        ? `${complicacionesActivas} activa(s)`
                        : "0 registradas"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {datos.totalPaginas > 1 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              Pacientes {datos.pagina * datos.filasPorPagina + 1}–
              {Math.min((datos.pagina + 1) * datos.filasPorPagina, datos.totalFiltrados)} de{" "}
              {datos.totalFiltrados}
            </span>
            <div className="flex items-center gap-1.5">
              <BotonPagina disabled={datos.pagina === 0 || cargando} onClick={() => cargarPagina(filtros, 0)}>
                « Primera
              </BotonPagina>
              <BotonPagina
                disabled={datos.pagina === 0 || cargando}
                onClick={() => cargarPagina(filtros, datos.pagina - 1)}
              >
                ‹ Anterior
              </BotonPagina>
              <span className="px-2 font-semibold text-slate-700">
                Página {datos.pagina + 1} de {datos.totalPaginas}
              </span>
              <BotonPagina
                disabled={datos.pagina >= datos.totalPaginas - 1 || cargando}
                onClick={() => cargarPagina(filtros, datos.pagina + 1)}
              >
                Siguiente ›
              </BotonPagina>
              <BotonPagina
                disabled={datos.pagina >= datos.totalPaginas - 1 || cargando}
                onClick={() => cargarPagina(filtros, datos.totalPaginas - 1)}
              >
                Última »
              </BotonPagina>
            </div>
          </div>
        )}
        </>
      )}

      {/* Modales Interactivos Oficiales */}
      <ModalNotas
        paciente={pacienteNotas}
        onClose={() => setPacienteNotas(null)}
        onGuardado={() => router.refresh()}
      />

      <ModalTipoDiabetes
        tipoActual={tipoSeleccionado}
        isOpen={modalTipoOpen}
        onClose={() => setModalTipoOpen(false)}
      />

      <ModalTratamientos
        tratamientosSeleccionados={pacienteTto?.ttos || []}
        isOpen={modalTtoOpen}
        onClose={() => setModalTtoOpen(false)}
        onGuardar={handleGuardarTratamientos}
        soloLectura={!pacienteTto}
      />

      <ModalMCG
        estadoActual={mcgEstado}
        isOpen={modalMCGOpen}
        onClose={() => setModalMCGOpen(false)}
      />

      <ModalITBDoppler
        itbActual={itbValor}
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

      {complicacionesData && (
        <ModalComplicaciones
          complicaciones={complicacionesData.lista}
          pacienteId={complicacionesData.pacienteId}
          isOpen={modalComplicacionesOpen}
          onClose={() => {
            setModalComplicacionesOpen(false);
            setComplicacionesData(null);
          }}
        />
      )}
    </>
  );
}

function BotonPagina({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f4c5c] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700"
    >
      {children}
    </button>
  );
}

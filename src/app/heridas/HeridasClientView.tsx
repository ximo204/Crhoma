"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { OndaDopplerSVG, type TipoOndaDoppler } from "@/components/codeapa/OndaDopplerSVG";
import {
  CATALOGO_APOSITOS_SAS,
  TIPO_HERIDA_OPTS,
  recommendProducts,
} from "@/lib/heridas/catalogo";
import {
  RESVECH_SUPERFICIE,
  RESVECH_PROFUNDIDAD,
  RESVECH_BORDES,
  RESVECH_TEJIDO,
  RESVECH_EXUDADO,
  RESVECH_INFECCION_ITEMS,
  calcularResvechTotal,
  calcularITB,
  obtenerRecomendacionCompresionCRHOMA,
  evaluarTestBuerger,
  FONTAINE_ESTADIOS,
} from "@/lib/heridas/evaluacion";
import {
  calcularIMC,
  evaluarPerimetroCintura,
  evaluarFGE,
  evaluarControlGlucemico,
} from "@/lib/crhoma/formulas";
import { COLORES_ESTADO } from "@/lib/crhoma/colores";
import type { EstadoSemaforo } from "@/lib/crhoma/types";
import {
  Search,
  Heart,
  Activity,
  Package,
  Sparkles,
  Info,
  ClipboardList,
  Check,
  AlertTriangle,
  FolderHeart,
  TrendingUp,
  Upload,
} from "@/components/ui/Icons";
import {
  type PacienteHeridasSummary,
  crearHeridaAction,
  guardarValoracionHeridaAction,
  cambiarEstadoHeridaAction,
  subirFotoHeridaAction,
} from "@/lib/heridas/actions";
import { comprimirImagen } from "@/lib/heridas/comprimirImagen";
import { PanelEstadisticasHeridas } from "@/components/codeapa/PanelEstadisticasHeridas";
import {
  CUPO_TODOS,
  FiltrosCupo,
  cuentaFiltrosCupo,
  opcionesCupoDe,
  type ValoresCupo,
} from "@/components/codeapa/FiltrosCupo";
import { ChartCard, SinDatosGrafico } from "@/components/charts/ChartCard";
import { TrendLineChart, type SerieLinea } from "@/components/charts/TrendLineChart";
import { BarChart, type CategoriaBarras } from "@/components/charts/BarChart";
import { SERIE_UNICA, CATEGORICO } from "@/lib/charts/colores";

// Pacientes que se pintan a la vez en la lista de selección.
const MAX_PACIENTES_LISTA = 60;

// Misma clave que en CODEAPA: el cupo elegido en un módulo vale para el otro.
const CLAVE_ALMACEN_CUPO = "codeapa:cupo";

interface Props {
  pacientes: PacienteHeridasSummary[];
  pacienteInicialId?: string;
  /** Herida concreta a abrir, al llegar desde la historia CRHOMA del paciente. */
  heridaInicialId?: string;
}

export function HeridasClientView({
  pacientes,
  pacienteInicialId,
  heridaInicialId,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // 1. Selección de Paciente de la Base de Datos
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [cupo, setCupoEstado] = useState<ValoresCupo>(CUPO_TODOS);
  const opcionesCupo = useMemo(() => opcionesCupoDe(pacientes), [pacientes]);

  // El cupo guardado se lee una sola vez, al abrir. Solo se aceptan valores
  // que sigan existiendo.
  const cupoRestaurado = useRef(false);
  useEffect(() => {
    if (cupoRestaurado.current) return;
    cupoRestaurado.current = true;
    try {
      const guardado = window.localStorage.getItem(CLAVE_ALMACEN_CUPO);
      if (!guardado) return;
      const v = JSON.parse(guardado) as Partial<ValoresCupo>;
      const valido = (x: unknown, lista: string[]) => (typeof x === "string" && lista.includes(x) ? x : "TODOS");
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
  const [pacienteId, setPacienteId] = useState<string>(() => {
    if (pacienteInicialId && pacientes.some((p) => p.id === pacienteInicialId)) {
      return pacienteInicialId;
    }
    // Priorizar un paciente con heridas activas si existe
    const conHeridas = pacientes.find((p) => p.heridasActivasCount > 0);
    return conHeridas?.id || pacientes[0]?.id || "";
  });

  const pacienteActual = pacientes.find((p) => p.id === pacienteId) || pacientes[0];

  // 2. Selección de Herida del Paciente
  // Si se ha llegado pulsando una herida concreta desde la historia CRHOMA,
  // se abre esa; si no, la más reciente del paciente.
  const heridaInicial =
    (heridaInicialId && pacienteActual?.heridas.find((h) => h.id === heridaInicialId)) ||
    pacienteActual?.heridas[0] ||
    null;

  const [heridaId, setHeridaId] = useState<string>(() => heridaInicial?.id || "");

  // Si cambia de paciente, actualizar la herida seleccionada
  const handleSeleccionarPaciente = (id: string) => {
    setPacienteId(id);
    const p = pacientes.find((pac) => pac.id === id);
    if (p && p.heridas.length > 0) {
      setHeridaId(p.heridas[0].id);
      cargarDatosHerida(p.heridas[0]);
    } else {
      setHeridaId("");
      setLocalizacion("");
      setCodigoHerida(`HER-${Math.floor(100 + Math.random() * 900)}`);
    }
    setMensajeExito(null);
  };

  const heridaActual = pacienteActual?.heridas.find((h) => h.id === heridaId);

  // Modal / Formulario de Nueva Herida
  const [mostrarModalNuevaHerida, setMostrarModalNuevaHerida] = useState(false);
  const [codigoHerida, setCodigoHerida] = useState(() => heridaInicial?.codigo ?? "UDP-01");
  const [etiologia, setEtiologia] = useState(() => heridaInicial?.etiologia ?? "pie_diabetico");
  const [localizacion, setLocalizacion] = useState(() => heridaInicial?.localizacion ?? "");
  const [fechaInicio, setFechaInicio] = useState(() => heridaInicial?.fechaInicio ?? new Date().toISOString().slice(0, 10));
  const [notasHerida, setNotasHerida] = useState("");

  // Función para cargar todos los datos de la herida y su última valoración
  const cargarDatosHerida = (h: typeof pacienteActual.heridas[0]) => {
    setCodigoHerida(h.codigo);
    setEtiologia(h.etiologia);
    setLocalizacion(h.localizacion);
    if (h.fechaInicio) setFechaInicio(h.fechaInicio);

    // Pre-poblar con la última valoración guardada en la BD
    if (h.ultimoLargoCm !== null) setLargoCm(String(h.ultimoLargoCm));
    if (h.ultimoAnchoCm !== null) setAnchoCm(String(h.ultimoAnchoCm));
    if (h.ultimoProfundidadCm !== null) setProfundidadCm(String(h.ultimoProfundidadCm));
    if (h.ultimoSuperficieIdx !== null) setSuperficieIdx(h.ultimoSuperficieIdx);
    if (h.ultimoProfundidadIdx !== null) setProfundidadIdx(h.ultimoProfundidadIdx);
    if (h.ultimoBordesIdx !== null) setBordesIdx(h.ultimoBordesIdx);
    if (h.ultimoTejidoIdx !== null) setTejidoIdx(h.ultimoTejidoIdx);
    if (h.ultimoExudadoIdx !== null) setExudadoIdx(h.ultimoExudadoIdx);
    if (h.ultimoInfeccionItems && Array.isArray(h.ultimoInfeccionItems)) setInfeccionItems(h.ultimoInfeccionItems);
    if (h.ultimoInfeccionConfirmada !== null) setInfeccionConfirmada(h.ultimoInfeccionConfirmada ?? false);
    if (h.ultimoPasBrazoD !== null) setBrazoD(String(h.ultimoPasBrazoD));
    if (h.ultimoPasBrazoI !== null) setBrazoI(String(h.ultimoPasBrazoI));
    if (h.ultimoPasPedioD !== null) setPedioD(String(h.ultimoPasPedioD));
    if (h.ultimoPasTibialD !== null) setTibialD(String(h.ultimoPasTibialD));
    if (h.ultimoPasPedioI !== null) setPedioI(String(h.ultimoPasPedioI));
    if (h.ultimoPasTibialI !== null) setTibialI(String(h.ultimoPasTibialI));
    if (h.ultimoDopplerDerecho) setDopplerD(h.ultimoDopplerDerecho as TipoOndaDoppler);
    if (h.ultimoDopplerIzquierdo) setDopplerI(h.ultimoDopplerIzquierdo as TipoOndaDoppler);
    if (h.ultimoBuergerAngulo) setBuergerAngulo(h.ultimoBuergerAngulo);
    if (h.ultimoBuergerRubor) setBuergerRubor(h.ultimoBuergerRubor);
    if (h.ultimoFontaine) setFontaine(h.ultimoFontaine);
    if (h.ultimoApositoPrincipal) setApositoPrincipal(h.ultimoApositoPrincipal);
    if (h.ultimoApositoSecundario) setApositoSecundario(h.ultimoApositoSecundario);
    if (h.ultimoTerapiaCompresiva) setTerapiaCompresivaPautada(h.ultimoTerapiaCompresiva);
    if (h.ultimoFrecuenciaCuras) setFrecuenciaCuras(h.ultimoFrecuenciaCuras);
  };

  // 3. Pestañas
  const [tab, setTab] = useState<"herida" | "vascular" | "pai" | "catalogo" | "evolucion">("herida");

  // 4. Datos de la Valoración (Mediciones & Resvech 2.0)
  const [largoCm, setLargoCm] = useState(() => heridaInicial?.ultimoLargoCm != null ? String(heridaInicial.ultimoLargoCm) : "2.5");
  const [anchoCm, setAnchoCm] = useState(() => heridaInicial?.ultimoAnchoCm != null ? String(heridaInicial.ultimoAnchoCm) : "2.0");
  const [profundidadCm, setProfundidadCm] = useState(() => heridaInicial?.ultimoProfundidadCm != null ? String(heridaInicial.ultimoProfundidadCm) : "0.5");

  const [superficieIdx, setSuperficieIdx] = useState(() => heridaInicial?.ultimoSuperficieIdx ?? 2);
  const [profundidadIdx, setProfundidadIdx] = useState(() => heridaInicial?.ultimoProfundidadIdx ?? 1);
  const [bordesIdx, setBordesIdx] = useState(() => heridaInicial?.ultimoBordesIdx ?? 1);
  const [tejidoIdx, setTejidoIdx] = useState(() => heridaInicial?.ultimoTejidoIdx ?? 2);
  const [exudadoIdx, setExudadoIdx] = useState(() => heridaInicial?.ultimoExudadoIdx ?? 2);
  const [infeccionItems, setInfeccionItems] = useState<boolean[]>(() =>
    (heridaInicial?.ultimoInfeccionItems && Array.isArray(heridaInicial.ultimoInfeccionItems))
      ? heridaInicial.ultimoInfeccionItems
      : Array(12).fill(false)
  );
  const [infeccionConfirmada, setInfeccionConfirmada] = useState(() => heridaInicial?.ultimoInfeccionConfirmada ?? false);

  // 5. Exploración Vascular & ITB
  const [brazoD, setBrazoD] = useState(() => heridaInicial?.ultimoPasBrazoD != null ? String(heridaInicial.ultimoPasBrazoD) : "135");
  const [brazoI, setBrazoI] = useState(() => heridaInicial?.ultimoPasBrazoI != null ? String(heridaInicial.ultimoPasBrazoI) : "130");
  const [pedioD, setPedioD] = useState(() => heridaInicial?.ultimoPasPedioD != null ? String(heridaInicial.ultimoPasPedioD) : "120");
  const [tibialD, setTibialD] = useState(() => heridaInicial?.ultimoPasTibialD != null ? String(heridaInicial.ultimoPasTibialD) : "115");
  const [pedioI, setPedioI] = useState(() => heridaInicial?.ultimoPasPedioI != null ? String(heridaInicial.ultimoPasPedioI) : "120");
  const [tibialI, setTibialI] = useState(() => heridaInicial?.ultimoPasTibialI != null ? String(heridaInicial.ultimoPasTibialI) : "115");
  const [dopplerD, setDopplerD] = useState<TipoOndaDoppler>(() => (heridaInicial?.ultimoDopplerDerecho as TipoOndaDoppler) ?? "TRIFASICA");
  const [dopplerI, setDopplerI] = useState<TipoOndaDoppler>(() => (heridaInicial?.ultimoDopplerIzquierdo as TipoOndaDoppler) ?? "TRIFASICA_BIFASICA");

  // Tests vasculares
  const [buergerAngulo, setBuergerAngulo] = useState(() => heridaInicial?.ultimoBuergerAngulo ?? "normal");
  const [buergerRubor, setBuergerRubor] = useState(() => heridaInicial?.ultimoBuergerRubor ?? "normal");
  const [buergerLlenado] = useState("normal");
  const [fontaine, setFontaine] = useState(() => heridaInicial?.ultimoFontaine ?? "I");

  // 6. Pauta de Tratamiento y Cura
  const [apositoPrincipal, setApositoPrincipal] = useState(() => heridaInicial?.ultimoApositoPrincipal ?? "Apósito hidrocelular de silicona");
  const [apositoSecundario, setApositoSecundario] = useState(() => heridaInicial?.ultimoApositoSecundario ?? "");
  const [terapiaCompresivaPautada, setTerapiaCompresivaPautada] = useState(() => heridaInicial?.ultimoTerapiaCompresiva ?? "");
  const [frecuenciaCuras, setFrecuenciaCuras] = useState(() => heridaInicial?.ultimoFrecuenciaCuras ?? "Cada 48-72 horas según saturación");
  const [observacionesCura, setObservacionesCura] = useState("");

  // 7. Catálogo y Búsqueda
  const [busquedaAposito, setBusquedaAposito] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");

  // Mensaje de éxito / Feedback
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Cálculos reactivos
  const resvech = calcularResvechTotal({
    superficieIdx,
    profundidadIdx,
    bordesIdx,
    tejidoIdx,
    exudadoIdx,
    infeccionItems,
    infeccionConfirmada,
  });

  // --- Evolución de la herida seleccionada, para la pestaña de gráficos ---
  // El historial ya llega ordenado de más antiguo a más reciente (ver
  // heridas/actions.ts), tal como lo necesita un gráfico de tendencia.
  const historialHerida = heridaActual?.historial ?? [];
  const formateaFechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

  const serieResvechHistorico: SerieLinea[] = [
    {
      nombre: "RESVECH",
      color: SERIE_UNICA,
      unidad: " pts",
      puntos: historialHerida.map((v) => ({ x: formateaFechaCorta(v.fecha), y: v.resvechTotal })),
    },
  ];

  const categoriasSuperficieHistorico: CategoriaBarras[] = historialHerida
    .filter((v) => v.superficieCm2 != null)
    .map((v) => ({
      etiqueta: formateaFechaCorta(v.fecha),
      grupos: [{ nombre: "Superficie", valor: v.superficieCm2 as number, color: CATEGORICO[2] }],
    }));

  const pasBrazoMayor = Math.max(parseFloat(brazoD) || 0, parseFloat(brazoI) || 0);
  const pasTobilloMayorD = Math.max(parseFloat(pedioD) || 0, parseFloat(tibialD) || 0);
  const pasTobilloMayorI = Math.max(parseFloat(pedioI) || 0, parseFloat(tibialI) || 0);

  const itbD = calcularITB(pasBrazoMayor, pasTobilloMayorD);
  const itbI = calcularITB(pasBrazoMayor, pasTobilloMayorI);

  // Recomendación oficial CRHOMA de terapia compresiva
  const recomendacionCompresionD = obtenerRecomendacionCompresionCRHOMA(itbD.itb, dopplerD);
  const testBuerger = evaluarTestBuerger(buergerAngulo, buergerRubor, buergerLlenado);

  // Recomendación inteligente de apósitos del catálogo SAS
  const tejidoActualTag = RESVECH_TEJIDO[tejidoIdx]?.tag;
  const exudadoActualNivel = RESVECH_EXUDADO[exudadoIdx]?.nivel;
  const sospechaInfeccion = infeccionConfirmada || infeccionItems.some(Boolean);

  const apositosRecomendados = recommendProducts({
    tejidoTag: tejidoActualTag,
    exudadoNivel: exudadoActualNivel,
    sospechaInfeccion,
    tipoHeridaTags: [etiologia],
  });

  // PAI Riesgo Vascular con la antropometría real del paciente en CRHOMA.
  // Si el paciente no tiene medición registrada no se inventa un valor: se
  // muestra el aviso de "sin datos" y se le invita a registrarlo en su ficha.
  const pesoCRHOMA = pacienteActual?.ultimoPesoKg ?? null;
  const tallaCRHOMA = pacienteActual?.ultimaTallaM ?? null;
  const cinturaCRHOMA = pacienteActual?.ultimaCinturaCm ?? null;

  const imcEvaluado = pesoCRHOMA != null && tallaCRHOMA != null
    ? calcularIMC(pesoCRHOMA, tallaCRHOMA)
    : null;
  const cinturaEvaluada = cinturaCRHOMA != null
    ? evaluarPerimetroCintura(cinturaCRHOMA, (pacienteActual?.sexo as "H" | "M") || "H")
    : null;
  const fgeEvaluado = pacienteActual?.ultimoFGe != null
    ? evaluarFGE(pacienteActual.ultimoFGe)
    : null;
  const hba1cEvaluada = pacienteActual?.ultimaHbA1c
    ? evaluarControlGlucemico(pacienteActual.ultimaHbA1c, "GENERAL")
    : null;

  const categorias = ["Todas", ...Array.from(new Set(CATALOGO_APOSITOS_SAS.map((a) => a.categoria)))];
  const apositosFiltrados = CATALOGO_APOSITOS_SAS.filter((a) => {
    const coincideCat = categoriaSeleccionada === "Todas" || a.categoria === categoriaSeleccionada;
    const coincideBusq =
      !busquedaAposito ||
      a.nombre.toLowerCase().includes(busquedaAposito.toLowerCase()) ||
      a.laboratorio.toLowerCase().includes(busquedaAposito.toLowerCase()) ||
      a.indicaciones.toLowerCase().includes(busquedaAposito.toLowerCase());
    return coincideCat && coincideBusq;
  });

  // Pacientes que dejan pasar la barra de filtros (búsqueda + cupo). Son los
  // mismos para la analítica y para la lista de selección. Primero los que
  // tienen heridas registradas, que son con los que se trabaja aquí.
  const pacientesFiltrados = useMemo(() => {
    const q = busquedaPaciente.toLowerCase();
    const coinciden = pacientes.filter((p) => {
      if (cupo.claveMedica !== "TODOS" && p.claveMedica !== cupo.claveMedica) return false;
      if (cupo.claveEnfermeria !== "TODOS" && p.claveEnfermeria !== cupo.claveEnfermeria) return false;
      if (cupo.centro !== "TODOS" && p.centroSalud !== cupo.centro) return false;
      return (
        !q ||
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        p.nuhsa.toLowerCase().includes(q) ||
        (p.centroSalud && p.centroSalud.toLowerCase().includes(q))
      );
    });
    return [...coinciden.filter((p) => p.heridas.length > 0), ...coinciden.filter((p) => p.heridas.length === 0)];
  }, [pacientes, busquedaPaciente, cupo]);
  const hayFiltros = busquedaPaciente.trim() !== "" || cuentaFiltrosCupo(cupo) > 0;

  // Con miles de pacientes, pintarlos todos bloquea la pantalla: se muestran
  // los primeros y el buscador llega al resto. El seleccionado siempre se ve.
  const pacientesVisibles = useMemo(() => {
    const visibles = pacientesFiltrados.slice(0, MAX_PACIENTES_LISTA);
    const sel = pacientesFiltrados.find((p) => p.id === pacienteId);
    if (sel && !visibles.includes(sel)) visibles.unshift(sel);
    return visibles;
  }, [pacientesFiltrados, pacienteId]);

  // Guardar Valoración en la Base de Datos
  const handleGuardarValoracion = () => {
    if (!pacienteActual) return;
    if (!heridaId) {
      alert("Por favor, selecciona o crea primero una herida para este paciente antes de guardar la valoración.");
      return;
    }

    startTransition(async () => {
      try {
        const largoNum = parseFloat(largoCm) || null;
        const anchoNum = parseFloat(anchoCm) || null;
        const profNum = parseFloat(profundidadCm) || null;
        const supNum = largoNum && anchoNum ? Math.round(largoNum * anchoNum * 100) / 100 : null;

        await guardarValoracionHeridaAction({
          heridaId,
          pacienteId: pacienteActual.id,
          largoCm: largoNum,
          anchoCm: anchoNum,
          profundidadCm: profNum,
          superficieCm2: supNum,
          superficieIdx,
          profundidadIdx,
          bordesIdx,
          tejidoIdx,
          exudadoIdx,
          infeccionItems,
          infeccionConfirmada,
          resvechTotal: resvech.total,
          pasBrazoD: parseFloat(brazoD) || null,
          pasBrazoI: parseFloat(brazoI) || null,
          pasPedioD: parseFloat(pedioD) || null,
          pasTibialD: parseFloat(tibialD) || null,
          pasPedioI: parseFloat(pedioI) || null,
          pasTibialI: parseFloat(tibialI) || null,
          itbDerecho: itbD.itb,
          itbIzquierdo: itbI.itb,
          dopplerDerecho: dopplerD,
          dopplerIzquierdo: dopplerI,
          buergerAngulo,
          buergerRubor,
          fontaineEstadio: fontaine,
          recomendacionCompresion: recomendacionCompresionD.valor != null ? String(recomendacionCompresionD.valor) : null,
          apositoPrincipal,
          apositoSecundario: apositoSecundario || null,
          terapiaCompresivaPautada: terapiaCompresivaPautada || null,
          frecuenciaCuras,
          observacionesCura: observacionesCura || null,
        });

        setMensajeExito(
          `✓ Valoración registrada con éxito en la base de datos CRHOMA (Resvech: ${resvech.total} pts, ITB: ${itbD.itb || "—"}). Datos sincronizados.`
        );
      } catch (err: unknown) {
        alert(`Error al guardar en la base de datos: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  };

  // Crear una nueva herida para el paciente actual
  const handleCrearHerida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteActual) return;
    if (!codigoHerida || !localizacion) {
      alert("Por favor, completa el código y la localización de la herida.");
      return;
    }

    startTransition(async () => {
      try {
        const nueva = await crearHeridaAction({
          pacienteId: pacienteActual.id,
          codigo: codigoHerida,
          etiologia,
          localizacion,
          fechaInicio,
          notas: notasHerida,
        });

        setMostrarModalNuevaHerida(false);
        setHeridaId(nueva.id);
        setMensajeExito(`✓ Nueva herida [${nueva.codigo}] creada y vinculada a ${pacienteActual.nombre}.`);
      } catch (err: unknown) {
        alert(`Error al crear la herida: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  };

  // Cambiar estado de la herida (Cicatrizada / Activa)
  const handleCambiarEstadoHerida = (nuevoEstado: string) => {
    if (!heridaId) return;
    startTransition(async () => {
      try {
        await cambiarEstadoHeridaAction(heridaId, nuevoEstado, pacienteActual?.id);
        setMensajeExito(`✓ Estado de la herida actualizado a: ${nuevoEstado}`);
      } catch (err: unknown) {
        alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  };

  // Subida de fotos de la herida seleccionada
  const [comentarioFoto, setComentarioFoto] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  async function handleSubirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo más tarde
    if (!archivo || !heridaId) return;

    if (!archivo.type.startsWith("image/")) {
      setErrorFoto("Elige un archivo de imagen (JPG, PNG o WEBP).");
      return;
    }

    setErrorFoto(null);
    setSubiendoFoto(true);
    try {
      const comprimida = await comprimirImagen(archivo);
      const formData = new FormData();
      formData.set("heridaId", heridaId);
      formData.set("pacienteId", pacienteActual?.id ?? "");
      formData.set("comentario", comentarioFoto);
      formData.set("archivo", comprimida);

      startTransition(async () => {
        const resultado = await subirFotoHeridaAction(formData);
        if (!resultado.ok) {
          setErrorFoto(resultado.error);
        } else {
          setComentarioFoto("");
          setMensajeExito("✓ Foto guardada");
        }
        setSubiendoFoto(false);
      });
    } catch (err: unknown) {
      setErrorFoto(err instanceof Error ? err.message : "No se ha podido comprimir la imagen.");
      setSubiendoFoto(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Notificación de éxito */}
      {mensajeExito && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-950 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-emerald-700" />
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Encabezado del módulo CUSEAPA (heridas) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="min-w-0">
          <div className="mb-2.5 flex h-12 items-center">
            <Image
              src="/logo_cuseapa.svg"
              alt="CUSEAPA — Cuidado y Seguimiento de Heridas en Atención Primaria de Andalucía"
              width={280}
              height={80}
              className="h-full w-auto max-w-full object-contain object-left"
              priority
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Comisión de Heridas • AGSCGE
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Seguimiento y tratamiento de heridas complejas
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
            Los datos clínicos del paciente se leen de su historia CRHOMA. Aquí
            registras la valoración RESVECH, el ITB y la pauta de cura.
          </p>
        </div>

        {/* Acceso a la historia completa del paciente seleccionado */}
        {pacienteActual && (
          <Link
            href={`/pacientes/${pacienteActual.id}?desde=heridas`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-slate-700"
          >
            <FolderHeart size={15} />
            <span>Ver historia completa de {pacienteActual.nombre ?? "este paciente"}</span>
            <span>→</span>
          </Link>
        )}
      </div>

      {/* Barra de filtros: afecta a la vez a la analítica y a la lista de pacientes */}
      <div className="mb-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Buscar paciente
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaPaciente}
                onChange={(e) => setBusquedaPaciente(e.target.value)}
                placeholder="Buscar por nombre, NUHSA o centro..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <FiltrosCupo valores={cupo} opciones={opcionesCupo} onChange={setCupo} colorFoco="#059669" />
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700">
            {pacientesFiltrados.length} de {pacientes.length}
          </span>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setBusquedaPaciente("");
                setCupo(CUPO_TODOS);
              }}
              className="py-2 text-xs font-semibold text-emerald-700 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <PanelEstadisticasHeridas pacientes={pacientesFiltrados} />

      {/* 2. PASO 1 — ELEGIR PACIENTE DE LA BASE CRHOMA */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-black text-white">
              1
            </span>
            <div className="leading-tight">
              <h2 className="text-sm font-bold text-slate-900">Elige el paciente</h2>
              <span className="text-[11px] text-slate-500">
                {pacientesFiltrados.length === pacientes.length
                  ? `${pacientes.length} ${pacientes.length === 1 ? "paciente" : "pacientes"} en CRHOMA`
                  : `${pacientesFiltrados.length} de ${pacientes.length} pacientes`}
              </span>
            </div>
          </div>
        </div>

        {/* Lista completa de pacientes. Con scroll a partir de unos pocos, para
            que se pueda llegar a todo el cupo y no solo a los primeros. */}
        {pacientesFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
            <p className="text-xs font-semibold text-slate-600">
              Ningún paciente cumple los filtros de arriba.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusquedaPaciente("");
                setCupo(CUPO_TODOS);
              }}
              className="mt-2 text-xs font-bold text-emerald-700 underline hover:text-emerald-800"
            >
              Quitar filtros
            </button>
          </div>
        ) : (
          <div
            className={`mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 ${
              pacientesFiltrados.length > 6
                ? "max-h-72 overflow-y-auto pr-1"
                : ""
            }`}
          >
            {pacientesVisibles.map((p) => {
              const isSelected = p.id === pacienteActual?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarPaciente(p.id)}
                  aria-pressed={isSelected}
                  className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500"
                      : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {p.nuhsa}
                    </span>
                    {p.heridasActivasCount > 0 ? (
                      <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-extrabold text-rose-800">
                        {p.heridasActivasCount} activa{p.heridasActivasCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin heridas</span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-xs font-bold text-slate-900">
                    {p.nombre || "Sin nombre"}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-500">
                    {p.edad != null ? `${p.edad} años • ` : ""}
                    {p.centroSalud || "Centro no asignado"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {pacientesFiltrados.length > pacientesVisibles.length && (
          <p className="-mt-2 mb-4 text-[11px] text-slate-500">
            Se muestran {pacientesVisibles.length} de {pacientesFiltrados.length}. Escribe en el buscador
            para encontrar a cualquier otro paciente.
          </p>
        )}

        {/* Resumen clínico del paciente elegido, leído de su historia CRHOMA */}
        {pacienteActual && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/pacientes/${pacienteActual.id}?desde=heridas`}
                    className="text-base font-extrabold text-slate-900 underline decoration-slate-300 decoration-2 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-500"
                    title="Abrir la historia completa de este paciente"
                  >
                    {pacienteActual.nombre ?? "Paciente sin nombre"}
                  </Link>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    ({pacienteActual.nuhsa})
                  </span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                    {pacienteActual.edad ? `${pacienteActual.edad} años` : "Edad s/d"} •{" "}
                    {pacienteActual.sexo === "H" ? "Varón" : "Mujer"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span>🏥 <strong>Centro:</strong> {pacienteActual.centroSalud || "No asignado"}</span>
                  <span>🩺 <strong>Médico:</strong> {pacienteActual.claveMedica || "s/d"}</span>
                  <span>🩹 <strong>Enfermería:</strong> {pacienteActual.claveEnfermeria || "s/d"}</span>
                </div>
              </div>

              {/* Constantes de CRHOMA */}
              <div className="flex flex-wrap gap-2 text-xs">
                {/* Diabetes */}
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Diabetes</span>
                  <strong className="text-slate-900">
                    {pacienteActual.tipoDiabetes ? pacienteActual.tipoDiabetes.replace("_", " ") : "No consta"}
                  </strong>
                </div>

                {/* HbA1c */}
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Última HbA1c</span>
                  <strong className="text-slate-900">
                    {pacienteActual.ultimaHbA1c ? `${pacienteActual.ultimaHbA1c}%` : "s/d"}
                  </strong>
                </div>

                {/* FGe */}
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">FGe Renal</span>
                  <strong className="text-slate-900">
                    {pacienteActual.ultimoFGe ? `${pacienteActual.ultimoFGe} mL/min` : "s/d"}
                  </strong>
                </div>

                {/* ITB en BD */}
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">ITB Previo BD</span>
                  <strong className="text-slate-900">
                    {pacienteActual.ultimoITB ? pacienteActual.ultimoITB : "Sin registro"}
                  </strong>
                </div>

                {/* Pie Diabético */}
                {pacienteActual.ulceraPieDiabeticoComplicacion && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-rose-800 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span>Riesgo Pie Diabético</span>
                  </div>
                )}

                {/* Factores de riesgo de úlceras por presión (del volcado Infoweb) */}
                {pacienteActual.inmovilizado && (
                  <div
                    className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-amber-800 font-bold flex items-center gap-1.5"
                    title="Paciente inmovilizado: mayor riesgo de úlceras por presión"
                  >
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Inmovilizado</span>
                  </div>
                )}
                {pacienteActual.viveEnResidencia && (
                  <div
                    className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-amber-800 font-bold flex items-center gap-1.5"
                    title="Vive en residencia: mayor riesgo de úlceras por presión"
                  >
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>En residencia</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. GESTOR DE HERIDAS DEL PACIENTE */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-black text-white">
              2
            </span>
            <div className="leading-tight">
              <h3 className="text-sm font-bold text-slate-900">Elige la herida</h3>
              <span className="text-[11px] text-slate-500">
                {pacienteActual?.heridas.length === 0
                  ? "Este paciente todavía no tiene ninguna herida registrada"
                  : `${pacienteActual?.heridas.length || 0} registrada(s) en este paciente`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCodigoHerida(`HER-${Math.floor(100 + Math.random() * 900)}`);
              setMostrarModalNuevaHerida(true);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-800"
          >
            <span>+</span>
            <span>Registrar nueva herida</span>
          </button>
        </div>

        {/* Lista de Heridas Registradas para Seleccionar */}
        {pacienteActual && pacienteActual.heridas.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pacienteActual.heridas.map((h) => {
              const esSeleccionada = h.id === heridaId;
              return (
                <div
                  key={h.id}
                  onClick={() => {
                    setHeridaId(h.id);
                    cargarDatosHerida(h);
                  }}
                  className={`rounded-xl p-4 border transition-all cursor-pointer relative ${
                    esSeleccionada
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      [{h.codigo}]
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        h.estado === "ACTIVA"
                          ? "bg-rose-100 text-rose-800"
                          : h.estado === "CICATRIZADA"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {h.estado}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs mb-1">
                    {TIPO_HERIDA_OPTS.find((o) => o.v === h.etiologia)?.label || h.etiologia}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mb-2">
                    📍 {h.localizacion}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {h.ultimaFechaValoracion ? `Última cura: ${h.ultimaFechaValoracion}` : "Sin valoraciones"}
                    </span>
                    {h.ultimoResvech !== null && (
                      <span className="font-bold text-emerald-800">
                        Resvech: {h.ultimoResvech} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 mb-2">
              No constan heridas para {pacienteActual?.nombre}.
            </p>
            <button
              type="button"
              onClick={() => {
                setCodigoHerida(`HER-${Math.floor(100 + Math.random() * 900)}`);
                setMostrarModalNuevaHerida(true);
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
            >
              Registrar la primera herida de este paciente
            </button>
          </div>
        )}
      </div>

      {/* Modal / Formulario de Nueva Herida */}
      {mostrarModalNuevaHerida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Dar de Alta Nueva Herida en Base de Datos
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalNuevaHerida(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearHerida} className="space-y-4 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5 text-slate-600">
                Paciente: <strong>{pacienteActual?.nombre}</strong> ({pacienteActual?.nuhsa})
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Código de Identificación de la Lesión *
                </label>
                <input
                  type="text"
                  value={codigoHerida}
                  onChange={(e) => setCodigoHerida(e.target.value)}
                  placeholder="Ej: UDP-PD-01, UPP-SACRO..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Etiología / Tipo de Lesión *
                </label>
                <select
                  value={etiologia}
                  onChange={(e) => setEtiologia(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
                >
                  {TIPO_HERIDA_OPTS.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Localización Anatómica Exacta *
                </label>
                <input
                  type="text"
                  value={localizacion}
                  onChange={(e) => setLocalizacion(e.target.value)}
                  placeholder="Ej: Región supramaleolar interna izquierda, 1er metatarso..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha de Aparición / Diagnóstico
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas Clínicas Iniciales
                </label>
                <textarea
                  rows={2}
                  value={notasHerida}
                  onChange={(e) => setNotasHerida(e.target.value)}
                  placeholder="Antecedentes, traumatismo desencadenante, aspecto inicial..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaHerida(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Crear en Base de Datos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PASO 3 — BARRA DE VALORACIÓN Y GUARDADO.
           Queda fija en la parte baja de la pantalla: la página es larga y así
           el resultado y el botón de guardar están siempre a la vista. */}
      <div className="sticky bottom-3 z-30 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 p-4 text-white shadow-lg ring-1 ring-emerald-900/20 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-emerald-900">
              3
            </span>
            <span className="rounded bg-emerald-600/60 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
              VALORACIÓN ACTUAL
            </span>
            <span className="text-xs font-semibold text-emerald-100">
              {heridaActual ? `Herida: ${heridaActual.codigo} (${heridaActual.localizacion})` : "Selecciona una herida"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-black">Resvech: {resvech.total} pts</span>
            <span className="text-xs text-emerald-200">
              ITB: {itbD.itb || "—"} • {recomendacionCompresionD.valor}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {heridaActual && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => handleCambiarEstadoHerida("ACTIVA")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  heridaActual.estado === "ACTIVA"
                    ? "bg-rose-600 text-white"
                    : "text-emerald-100 hover:bg-white/10"
                }`}
              >
                Activa
              </button>
              <button
                type="button"
                onClick={() => handleCambiarEstadoHerida("CICATRIZADA")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  heridaActual.estado === "CICATRIZADA"
                    ? "bg-emerald-500 text-white"
                    : "text-emerald-100 hover:bg-white/10"
                }`}
              >
                Cicatrizada
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleGuardarValoracion}
            disabled={isPending || !heridaId}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-black text-amber-950 shadow-md hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer"
          >
            <span>💾</span>
            <span>{isPending ? "Guardando en SQLite..." : "Guardar Valoración en Base de Datos"}</span>
          </button>
        </div>
      </div>

      {/* 5. Pestañas de Navegación del Módulo */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTab("herida")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "herida"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ClipboardList size={16} />
          <span>Valoración Resvech 2.0</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
            Score: {resvech.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("vascular")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "vascular"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Activity size={16} />
          <span>Exploración Vascular & ITB</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
            ITB: {itbD.itb || "—"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("pai")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "pai"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Heart size={16} />
          <span>Riesgo Vascular PAI CRHOMA</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("catalogo")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "catalogo"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Package size={16} />
          <span>Catálogo de Apósitos SAS</span>
          {apositosRecomendados.length > 0 && (
            <span className="rounded-full bg-amber-400 text-amber-950 px-2 py-0.2 text-[10px] font-extrabold">
              {apositosRecomendados.length} sugeridos
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("evolucion")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "evolucion"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <TrendingUp size={16} />
          <span>Evolución y Fotos</span>
          {heridaActual && heridaActual.fotos.length > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
              {heridaActual.fotos.length} foto{heridaActual.fotos.length > 1 ? "s" : ""}
            </span>
          )}
        </button>
      </div>

      {/* 6. CONTENIDO DE LAS PESTAÑAS */}

      {/* PESTAÑA 1: RESVECH 2.0 & CURA */}
      {tab === "herida" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulario de la Herida y Resvech */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dimensiones y Medición en Centímetros */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>1. Medición de Dimensiones de la Lesión</span>
                <span className="text-xs font-semibold text-slate-500">
                  {heridaActual ? `[${heridaActual.codigo}] ${heridaActual.localizacion}` : "Selecciona una herida arriba"}
                </span>
              </h2>

              <div className="grid gap-4 grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Largo (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={largoCm}
                    onChange={(e) => setLargoCm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ancho (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={anchoCm}
                    onChange={(e) => setAnchoCm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Profundidad (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={profundidadCm}
                    onChange={(e) => setProfundidadCm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Área calculada */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Superficie geométrica estimada:</span>
                <strong className="text-emerald-800 text-sm font-mono">
                  {largoCm && anchoCm
                    ? `${(parseFloat(largoCm) * parseFloat(anchoCm)).toFixed(2)} cm²`
                    : "—"}
                </strong>
              </div>
            </div>

            {/* Criterios Resvech 2.0 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>2. Escala de Cicatrización Resvech 2.0</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Total: {resvech.total} pts
                </span>
              </h2>

              {/* Superficie */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Superficie (cm²)
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {RESVECH_SUPERFICIE.map((s) => (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => setSuperficieIdx(s.v)}
                      className={`text-left rounded-xl p-2.5 text-xs transition-all border cursor-pointer ${
                        superficieIdx === s.v
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {s.label} ({s.pts} pts)
                    </button>
                  ))}
                </div>
              </div>

              {/* Profundidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Profundidad y Afectación Tisular
                </label>
                <div className="grid gap-2">
                  {RESVECH_PROFUNDIDAD.map((p) => (
                    <button
                      key={p.v}
                      type="button"
                      onClick={() => setProfundidadIdx(p.v)}
                      className={`text-left rounded-xl p-2.5 text-xs transition-all border cursor-pointer ${
                        profundidadIdx === p.v
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bordes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Estado de los Bordes
                </label>
                <div className="grid gap-2">
                  {RESVECH_BORDES.map((b) => (
                    <button
                      key={b.v}
                      type="button"
                      onClick={() => setBordesIdx(b.v)}
                      className={`text-left rounded-xl p-2.5 text-xs transition-all border cursor-pointer ${
                        bordesIdx === b.v
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tejido en el lecho */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Tejido en el Lecho
                </label>
                <div className="grid gap-2">
                  {RESVECH_TEJIDO.map((t) => (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => setTejidoIdx(t.v)}
                      className={`text-left rounded-xl p-2.5 text-xs transition-all border cursor-pointer ${
                        tejidoIdx === t.v
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exudado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nivel de Exudado
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {RESVECH_EXUDADO.map((e) => (
                    <button
                      key={e.v}
                      type="button"
                      onClick={() => setExudadoIdx(e.v)}
                      className={`text-left rounded-xl p-2.5 text-xs transition-all border cursor-pointer ${
                        exudadoIdx === e.v
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Infección / Biofilm */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Signos de Infección / Carga Microbiana / Biofilm</span>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={infeccionConfirmada}
                      onChange={(e) => setInfeccionConfirmada(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span className="text-red-700 font-bold text-xs">
                      Infección franca (+5 pts)
                    </span>
                  </label>
                </label>

                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {RESVECH_INFECCION_ITEMS.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={infeccionItems[idx]}
                        onChange={(e) => {
                          const updated = [...infeccionItems];
                          updated[idx] = e.target.checked;
                          setInfeccionItems(updated);
                        }}
                        className="mt-0.5 rounded text-emerald-600"
                      />
                      <span className="text-slate-800 text-[11px] leading-tight">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Lateral: Diagnóstico, Apósitos Recomendados y Pauta */}
          <div className="space-y-6">
            {/* Tarjeta de Severidad Resvech */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Puntuación Resvech 2.0
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold text-slate-900">{resvech.total}</span>
                <span className="text-xs text-slate-400">/ 35 pts máx</span>
              </div>

              <div
                className={`inline-block rounded-lg px-3 py-1 text-xs font-extrabold ring-1 mb-3 ${resvech.color}`}
              >
                {resvech.gravedad}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{resvech.interpretacion}</p>
            </div>

            {/* Pauta de Cura Prescrita */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pauta de Tratamiento Local
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Apósito Primario (en contacto con lecho)
                </label>
                <input
                  type="text"
                  value={apositoPrincipal}
                  onChange={(e) => setApositoPrincipal(e.target.value)}
                  placeholder="Ej: Hidrogel, Alginato cálcico con plata..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Apósito Secundario / Cobertura
                </label>
                <input
                  type="text"
                  value={apositoSecundario}
                  onChange={(e) => setApositoSecundario(e.target.value)}
                  placeholder="Ej: Espuma de poliuretano, gasa estéril..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Terapia Compresiva Pautada (si procede)
                </label>
                <input
                  type="text"
                  value={terapiaCompresivaPautada}
                  onChange={(e) => setTerapiaCompresivaPautada(e.target.value)}
                  placeholder="Ej: Vendaje multicomponente 2 capas, 20-30 mmHg..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Frecuencia de Curas
                </label>
                <input
                  type="text"
                  value={frecuenciaCuras}
                  onChange={(e) => setFrecuenciaCuras(e.target.value)}
                  placeholder="Ej: Cada 48-72h..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Observaciones de Enfermería
                </label>
                <textarea
                  rows={2}
                  value={observacionesCura}
                  onChange={(e) => setObservacionesCura(e.target.value)}
                  placeholder="Higiene perilesional, descarga de presiones..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleGuardarValoracion}
                disabled={isPending || !heridaId}
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-center text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isPending ? "Guardando..." : "Guardar Esta Valoración"}
              </button>
            </div>

            {/* Recomendación de Apósitos Oficiales SAS */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                <Sparkles size={18} className="text-emerald-600" />
                <span>Apósitos Sugeridos (Catálogo SAS)</span>
              </div>
              <p className="text-[11.5px] text-emerald-800/80 mb-4">
                Sugeridos automáticamente según el tipo de tejido (
                <strong>{tejidoActualTag}</strong>), nivel de exudado (
                <strong>{exudadoActualNivel}</strong>) y estado infeccioso.
              </p>

              <div className="space-y-3">
                {apositosRecomendados.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setApositoPrincipal(item.nombre)}
                    className="rounded-xl bg-white p-3.5 border border-emerald-200 shadow-2xs text-xs hover:border-emerald-400 transition-colors cursor-pointer"
                    title="Haz clic para seleccionar este apósito en la pauta"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-emerald-700">
                          {item.categoria}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{item.nombre}</h4>
                        <span className="text-[11px] text-slate-500">{item.laboratorio}</span>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                        {item.formatos[0]?.codigo}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-600 leading-tight">
                      {item.motivos[0]}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>{item.formatos[0]?.tam}</span>
                      <span className="text-emerald-700">
                        {item.formatos[0]?.precio.toFixed(2)} € / ud
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setTab("catalogo")}
                className="mt-4 w-full rounded-xl bg-emerald-700 py-2.5 text-center text-xs font-bold text-white hover:bg-emerald-800 transition-colors"
              >
                Ver Catálogo Completo SAS →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: EXPLORACIÓN VASCULAR & ITB CON CRHOMA */}
      {tab === "vascular" && (
        <div className="space-y-6">
          {/* Ficha ITB Bilateral */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-900">
                  MOTOR CRHOMA
                </span>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Cálculo del Índice Tobillo-Brazo (ITB) y Doppler Vascular
                </h2>
                <p className="text-xs text-slate-500">
                  Algoritmo oficial de estratificación vascular y decisión de terapia compresiva en úlceras.
                </p>
              </div>

              {/* Guía Doppler Visual */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block text-[11px] text-slate-400">Doppler Pie Derecho</span>
                  <span className="text-xs font-bold text-slate-800">{dopplerD}</span>
                </div>
                <OndaDopplerSVG tipo={dopplerD} width={130} height={52} />
              </div>
            </div>

            {/* Entradas de Presión Sistólica */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Miembro Inferior Derecho */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Miembro Inferior Derecho</h3>
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">PAS Brazo Derecho (mmHg)</label>
                    <input
                      type="number"
                      value={brazoD}
                      onChange={(e) => setBrazoD(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">PAS Brazo Izquierdo (mmHg)</label>
                    <input
                      type="number"
                      value={brazoI}
                      onChange={(e) => setBrazoI(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">PAS Tibial Post. Der (mmHg)</label>
                    <input
                      type="number"
                      value={tibialD}
                      onChange={(e) => setTibialD(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">PAS Pedia Der (mmHg)</label>
                    <input
                      type="number"
                      value={pedioD}
                      onChange={(e) => setPedioD(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Morfología Doppler */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Morfología de la Onda Doppler (Tibial/Pedia)
                  </label>
                  <select
                    value={dopplerD}
                    onChange={(e) => setDopplerD(e.target.value as TipoOndaDoppler)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-bold"
                  >
                    <option value="TRIFASICA">Trifásica (Normal / Flujo arterial óptimo)</option>
                    <option value="TRIFASICA_BIFASICA">Trifásica / Bifásica</option>
                    <option value="BIFASICA">Bifásica (Flujo conservado)</option>
                    <option value="MONOFASICA">Monofásica (Flujo patológico / obstructivo)</option>
                    <option value="CALCIFICACION">Calcificación vascular (Incompresible)</option>
                  </select>
                </div>

                {/* Resultado ITB Derecho */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">ITB Pie Derecho:</span>
                    <strong className="text-2xl text-slate-900">{itbD.itb || "—"}</strong>
                  </div>
                  {itbD.semaforo && (
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${itbD.semaforo.color}`}
                    >
                      {itbD.semaforo.etiqueta}
                    </span>
                  )}
                </div>
              </div>

              {/* Miembro Inferior Izquierdo */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Miembro Inferior Izquierdo</h3>
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">PAS Tibial Post. Izq (mmHg)</label>
                    <input
                      type="number"
                      value={tibialI}
                      onChange={(e) => setTibialI(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">PAS Pedia Izq (mmHg)</label>
                    <input
                      type="number"
                      value={pedioI}
                      onChange={(e) => setPedioI(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Morfología de la Onda Doppler (Tibial/Pedia)
                  </label>
                  <select
                    value={dopplerI}
                    onChange={(e) => setDopplerI(e.target.value as TipoOndaDoppler)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-bold"
                  >
                    <option value="TRIFASICA">Trifásica (Normal / Flujo arterial óptimo)</option>
                    <option value="TRIFASICA_BIFASICA">Trifásica / Bifásica</option>
                    <option value="BIFASICA">Bifásica (Flujo conservado)</option>
                    <option value="MONOFASICA">Monofásica (Flujo patológico / obstructivo)</option>
                    <option value="CALCIFICACION">Calcificación vascular (Incompresible)</option>
                  </select>
                </div>

                {/* Resultado ITB Izquierdo */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">ITB Pie Izquierdo:</span>
                    <strong className="text-2xl text-slate-900">{itbI.itb || "—"}</strong>
                  </div>
                  {itbI.semaforo && (
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${itbI.semaforo.color}`}
                    >
                      {itbI.semaforo.etiqueta}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Decisión Clínica CRHOMA sobre Terapia Compresiva */}
            <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
              <div className="flex items-center gap-2 font-bold text-sky-950 text-sm mb-1">
                <Info size={18} className="text-sky-600" />
                <span>
                  Recomendación Terapia Compresiva CRHOMA: {recomendacionCompresionD.valor}
                </span>
              </div>
              <p className="text-xs text-sky-900/90 leading-relaxed">
                {recomendacionCompresionD.interpretacion} — {recomendacionCompresionD.observaciones}
              </p>
            </div>
          </div>

          {/* Tests Vasculares Complementarios (Buerger, Fontaine) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Test de Buerger */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Test Postural de Buerger (Isquemia)
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Palidez al elevar a 90°:</label>
                  <select
                    value={buergerAngulo}
                    onChange={(e) => setBuergerAngulo(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    <option value="normal">Sin palidez a 90° (Normal)</option>
                    <option value="leve">Palidez leve (60° - 90°)</option>
                    <option value="moderado">Palidez moderada (30° - 60°)</option>
                    <option value="severo">Palidez severa (&lt; 30° o reposo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Tiempo de rubor dependiente:</label>
                  <select
                    value={buergerRubor}
                    onChange={(e) => setBuergerRubor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    <option value="normal">&lt; 10 segundos (Normal)</option>
                    <option value="leve">10 - 15 segundos (Leve)</option>
                    <option value="moderado">15 - 25 segundos (Moderado)</option>
                    <option value="severo">&gt; 25-40 segundos (Muy retrasado)</option>
                  </select>
                </div>

                {testBuerger && (
                  <div className={`mt-3 p-3 rounded-lg border ${testBuerger.color}`}>
                    <strong className="block">{testBuerger.resultado}</strong>
                    <span className="text-[11px]">{testBuerger.conducta}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Clasificación de Fontaine */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Clasificación de Fontaine (Claudicación)
              </h3>
              <div className="space-y-2">
                {Object.entries(FONTAINE_ESTADIOS).map(([key, val]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      fontaine === key
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fontaine"
                      value={key}
                      checked={fontaine === key}
                      onChange={() => setFontaine(key)}
                      className="text-emerald-600"
                    />
                    <span>{val.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PAI RIESGO VASCULAR SAS CON CRHOMA */}
      {tab === "pai" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                CRHOMA • PAI RIESGO VASCULAR
              </span>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Variables Clínicas del Paciente y Factores de Riesgo
              </h2>
              <p className="text-xs text-slate-500">
                Comorbilidades que influyen directamente en la micro y macrocirculación periférica y en la cicatrización.
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            {/* IMC */}
            <TarjetaPAI
              titulo="Índice de Masa Corporal"
              valor={imcEvaluado ? `${imcEvaluado.valor} kg/m²` : null}
              etiquetaEstado={imcEvaluado?.interpretacion}
              estado={imcEvaluado?.estado}
              nota={
                imcEvaluado?.formula ??
                "Falta el peso o la talla del paciente en su historia CRHOMA."
              }
              pacienteId={pacienteActual?.id}
            />

            {/* Perímetro Cintura */}
            <TarjetaPAI
              titulo="Perímetro de Cintura"
              valor={cinturaEvaluada ? `${cinturaEvaluada.valor} cm` : null}
              etiquetaEstado={cinturaEvaluada?.interpretacion}
              estado={cinturaEvaluada?.estado}
              nota={
                cinturaEvaluada
                  ? pacienteActual?.sexo === "M"
                    ? "Umbral mujer: >80 cm riesgo, >88 cm muy elevado."
                    : "Umbral varón: >94 cm riesgo, >102 cm muy elevado."
                  : "Falta el perímetro de cintura en su historia CRHOMA."
              }
              pacienteId={pacienteActual?.id}
            />

            {/* HbA1c */}
            <TarjetaPAI
              titulo="Hemoglobina Glicosilada"
              valor={
                pacienteActual?.ultimaHbA1c != null ? `${pacienteActual.ultimaHbA1c}%` : null
              }
              etiquetaEstado={hba1cEvaluada?.etiqueta}
              estado={hba1cEvaluada?.estado}
              nota={
                pacienteActual?.ultimaHbA1c != null
                  ? "Objetivo clínico general: <7,0%"
                  : "Sin analítica de glicada registrada en CRHOMA."
              }
              pacienteId={pacienteActual?.id}
            />

            {/* FGE Renal */}
            <TarjetaPAI
              titulo="Filtrado Glomerular (CKD-EPI)"
              valor={
                pacienteActual?.ultimoFGe != null
                  ? `${pacienteActual.ultimoFGe} mL/min`
                  : null
              }
              etiquetaEstado={fgeEvaluado?.interpretacion}
              estado={fgeEvaluado?.estado}
              nota={
                pacienteActual?.ultimoFGe == null
                  ? "Sin analítica renal registrada en CRHOMA."
                  : pacienteActual.ultimoFGe < 60
                  ? "ERC confirmada en CRHOMA"
                  : "Función renal conservada"
              }
              pacienteId={pacienteActual?.id}
            />
          </div>

          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-500">
            Todos estos valores se leen de la historia CRHOMA del paciente. Para
            cambiarlos o rellenar los que falten, entra en su historia completa y
            edita la casilla correspondiente.
          </p>
        </div>
      )}

      {/* PESTAÑA 4: CATÁLOGO DE APÓSITOS OFICIALES SAS */}
      {tab === "catalogo" && (
        <div className="space-y-6">
          {/* Barra de Filtros y Búsqueda */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={busquedaAposito}
                onChange={(e) => setBusquedaAposito(e.target.value)}
                placeholder="Buscar por apósito, principio activo, laboratorio o código..."
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-800"
              />
            </div>

            {/* Selector de Categorías */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    categoriaSeleccionada === cat
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Rejilla del Catálogo SAS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apositosFiltrados.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                      {item.categoria}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {item.formatos[0]?.codigo}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.nombre}</h3>
                  <span className="text-xs text-slate-500 block mb-2">{item.laboratorio}</span>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {item.indicaciones}
                  </p>

                  {item.notas && (
                    <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 mb-3 border border-slate-100">
                      <strong>Nota clínica:</strong> {item.notas}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    Cambio: <strong className="text-slate-800">{item.duracion}</strong>
                  </div>
                  <div className="text-right">
                    <strong className="text-emerald-700 text-sm">
                      {item.formatos[0]?.precio.toFixed(2)} €
                    </strong>
                    <span className="text-[10px] text-slate-400 block">por unidad</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 5: EVOLUCIÓN Y FOTOS */}
      {tab === "evolucion" && (
        <div className="space-y-6">
          {!heridaActual ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Elige o registra una herida para ver su evolución y sus fotos.
            </div>
          ) : (
            <>
              {/* Gráficos de evolución de la herida seleccionada */}
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  titulo="Evolución del RESVECH 2.0"
                  subtitulo="Puntuación total en cada valoración guardada"
                  tabla={
                    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                      {historialHerida.map((v, i) => (
                        <li key={i} className="flex items-center justify-between px-3 py-2">
                          <span className="font-medium text-slate-700">{formateaFechaCorta(v.fecha)}</span>
                          <strong className="text-slate-900">{v.resvechTotal ?? "—"} pts</strong>
                        </li>
                      ))}
                    </ul>
                  }
                >
                  {historialHerida.length < 2 ? (
                    <SinDatosGrafico texto="Hacen falta al menos dos valoraciones guardadas para ver una tendencia." />
                  ) : (
                    <TrendLineChart series={serieResvechHistorico} />
                  )}
                </ChartCard>

                <ChartCard
                  titulo="Evolución de la superficie"
                  subtitulo="cm² medidos en cada valoración"
                  tabla={
                    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs">
                      {categoriasSuperficieHistorico.map((c) => (
                        <li key={c.etiqueta} className="flex items-center justify-between px-3 py-2">
                          <span className="font-medium text-slate-700">{c.etiqueta}</span>
                          <strong className="text-slate-900">{c.grupos[0].valor} cm²</strong>
                        </li>
                      ))}
                    </ul>
                  }
                >
                  {categoriasSuperficieHistorico.length === 0 ? (
                    <SinDatosGrafico texto="Ninguna valoración guardada tiene largo y ancho registrados." />
                  ) : (
                    <BarChart categorias={categoriasSuperficieHistorico} unidad=" cm²" />
                  )}
                </ChartCard>
              </div>

              {/* Fotografías de la herida */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Fotografías</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Queda guardada la fecha automáticamente; el comentario es opcional.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={comentarioFoto}
                        onChange={(e) => setComentarioFoto(e.target.value)}
                        placeholder="Comentario opcional..."
                        className="w-48 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <label
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors ${
                          subiendoFoto ? "bg-emerald-400 cursor-wait" : "bg-emerald-700 hover:bg-emerald-800"
                        }`}
                      >
                        {subiendoFoto ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>{subiendoFoto ? "Subiendo..." : "Subir foto"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={subiendoFoto}
                          onChange={handleSubirFoto}
                        />
                      </label>
                    </div>
                    {errorFoto && <p className="text-[11px] font-medium text-rose-600">{errorFoto}</p>}
                  </div>
                </div>

                {heridaActual.fotos.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Esta herida todavía no tiene ninguna foto guardada.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {heridaActual.fotos.map((foto) => (
                      <figure
                        key={foto.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                      >
                        {/* Fotos clínicas: next/image exige dimensiones fijas que no
                            conocemos de antemano, así que se sirve como <img> normal. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/fotos-heridas/${foto.id}`}
                          alt={foto.comentario || `Foto del ${new Date(foto.fecha).toLocaleDateString("es-ES")}`}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                        <figcaption className="p-2">
                          <div className="text-[10.5px] font-bold text-slate-700">
                            {new Date(foto.fecha).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          {foto.comentario && (
                            <div className="mt-0.5 line-clamp-2 text-[10.5px] text-slate-500">{foto.comentario}</div>
                          )}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

/**
 * Tarjeta de una variable del PAI de riesgo vascular.
 *
 * El valor siempre procede de la historia CRHOMA del paciente. Cuando no hay
 * dato registrado se dice explícitamente y se ofrece el enlace para ir a
 * rellenarlo, en lugar de mostrar una cifra de relleno.
 */
function TarjetaPAI({
  titulo,
  valor,
  etiquetaEstado,
  estado,
  nota,
  pacienteId,
}: {
  titulo: string;
  valor: string | null;
  etiquetaEstado?: string;
  estado?: EstadoSemaforo;
  nota?: string;
  pacienteId?: string;
}) {
  const color = COLORES_ESTADO[estado ?? "sin-datos"];
  const sinDato = valor === null;

  return (
    <div
      className={`rounded-xl border p-4 ${
        sinDato ? "border-dashed border-slate-300 bg-slate-50/60" : `${color.borde} bg-white`
      }`}
    >
      <span className="block font-semibold text-slate-500">{titulo}</span>

      {sinDato ? (
        <>
          <strong className="mt-1 block text-2xl text-slate-300">—</strong>
          <span className="mt-1 inline-block rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            Sin registrar
          </span>
        </>
      ) : (
        <>
          <strong className={`mt-1 block text-2xl ${color.texto}`}>{valor}</strong>
          {etiquetaEstado && (
            <span
              className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-bold ${color.fondo} ${color.texto}`}
            >
              {etiquetaEstado}
            </span>
          )}
        </>
      )}

      {nota && <p className="mt-2 text-[10.5px] leading-snug text-slate-500">{nota}</p>}

      {sinDato && pacienteId && (
        <Link
          href={`/pacientes/${pacienteId}?desde=heridas`}
          className="mt-2 inline-block text-[10.5px] font-bold text-emerald-700 underline hover:text-emerald-800"
        >
          Registrarlo en su historia →
        </Link>
      )}
    </div>
  );
}

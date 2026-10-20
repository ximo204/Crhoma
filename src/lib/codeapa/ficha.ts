import type { EditableInfo, OpcionEdicion, ResultadoCampo } from "@/lib/crhoma/types";
import {
  calcularFIB4,
  calcularIMC,
  calcularIndiceCinturaAltura,
  combinarRiesgoRenalKDIGO,
  evaluarALT,
  evaluarAST,
  evaluarCAC,
  evaluarCreatinina,
  evaluarFGe,
  evaluarGlucemiaBasal,
  evaluarHbA1c,
  evaluarObjetivoHbA1c,
  evaluarPAD,
  evaluarPAS,
  evaluarPerimetroCintura,
  evaluarRiesgoPie,
  evaluarTerapiaCompresiva,
  type PerfilControlGlucemico,
} from "@/lib/crhoma/formulas";
import type {
  Complicaciones,
  ControlAnemia,
  ControlCardiovascular,
  ControlGlicada,
  ControlHepatico,
  ControlMetabolico,
  ControlRenal,
  ControlTA,
  CribadoClaudicacion,
  CribadoObesidad,
  ExploracionPie,
  Medicion,
  Paciente,
  Retinografia,
  VisitaPeriodo,
} from "@/generated/prisma";
import {
  TIPOS_DIABETES_INFO,
  TRATAMIENTOS_INFO,
  CRITERIOS_INCLUSION_MCG,
} from "./datosClinicos";
import { evaluarComplicaciones } from "./complicaciones";

export interface SeccionFicha {
  id: string;
  titulo: string;
  campos: ResultadoCampo[];
}

export interface DatosParaFicha {
  paciente: Paciente;
  periodoSeleccionado?: string;
  todasLasVisitas?: VisitaPeriodo[];
  ultimaMedicion: Medicion | null;
  ultimoControlTA: ControlTA | null;
  ultimoControlGlicada: ControlGlicada | null;
  ultimaExploracionPie: ExploracionPie | null;
  ultimaRetinografia: Retinografia | null;
  ultimoControlRenal: ControlRenal | null;
  ultimoControlHepatico: ControlHepatico | null;
  ultimoControlCardiovascular: ControlCardiovascular | null;
  ultimoCribadoClaudicacion: CribadoClaudicacion | null;
  ultimoControlMetabolico: ControlMetabolico | null;
  ultimoControlAnemia: ControlAnemia | null;
  ultimoCribadoObesidad: CribadoObesidad | null;
  complicaciones: Complicaciones | null;

  historialMediciones?: Medicion[];
  historialTA?: ControlTA[];
  historialGlicada?: ControlGlicada[];
  historialPie?: ExploracionPie[];
  historialRetinografia?: Retinografia[];
  historialRenal?: ControlRenal[];
  historialHepatico?: ControlHepatico[];
}

function campoDirecto(
  id: string,
  etiqueta: string,
  valor: string | number | boolean | null | undefined,
  opciones?: {
    unidad?: string;
    fecha?: Date | null;
    observaciones?: string;
    fuente?: string;
    interpretacion?: string;
    estado?: "bajo" | "normal" | "alto" | "muy-alto" | "sin-datos";
    editable?: EditableInfo;
  }
): ResultadoCampo {
  const valorMostrado =
    valor == null ? null : typeof valor === "boolean" ? (valor ? "Sí" : "No") : valor;

  return {
    id,
    etiqueta,
    valor: valorMostrado,
    unidad: opciones?.unidad,
    estado: opciones?.estado ?? (valorMostrado == null ? "sin-datos" : "normal"),
    interpretacion: opciones?.interpretacion,
    fuente: opciones?.fuente,
    observaciones:
      valorMostrado == null
        ? "Sin dato registrado todavía."
        : opciones?.observaciones ??
          `Valor introducido directamente${
            opciones?.fecha ? ` el ${opciones.fecha.toLocaleDateString("es-ES")}` : ""
          }.`,
    editable: opciones?.editable,
  };
}

function conEditable(campo: ResultadoCampo, editable: EditableInfo | undefined): ResultadoCampo {
  return editable ? { ...campo, editable } : campo;
}

const OPCIONES_SI_NO: OpcionEdicion[] = [
  { valor: "si", texto: "Sí" },
  { valor: "no", texto: "No" },
];

const OPCIONES_TIPO_DIABETES: OpcionEdicion[] = [
  { valor: "TIPO_1", texto: "DM tipo 1" },
  { valor: "TIPO_2", texto: "DM tipo 2" },
  { valor: "GESTACIONAL", texto: "DM gestacional" },
  { valor: "LADA", texto: "LADA" },
  { valor: "SECUNDARIA_FARMACOS", texto: "Secundaria a fármacos" },
  { valor: "OTRA", texto: "Otra" },
];

const OPCIONES_MCG: OpcionEdicion[] = [
  { valor: "SI", texto: "Sí (Cumple criterios y la lleva puesta)" },
  { valor: "NO", texto: "No (No cumple criterios o exclusión)" },
  { valor: "DEBERIA", texto: "Debería (Cumple criterios pero no la lleva)" },
];

const OPCIONES_RETINOGRAFIA: OpcionEdicion[] = [
  { valor: "NORMAL", texto: "Normal" },
  { valor: "PATOLOGICA", texto: "Patológica" },
  { valor: "NO_REALIZADA", texto: "No realizada" },
];

const OPCIONES_PERFIL_GLUCEMICO: OpcionEdicion[] = [
  { valor: "GENERAL", texto: "General / DM2 reciente" },
  { valor: "ANCIANO_FRAGIL", texto: "Anciano frágil / comorbilidad grave" },
  { valor: "DM1_INTENSIVO", texto: "DM1 / tratamiento insulínico intensivo" },
  { valor: "GESTACION", texto: "Gestación (pregestacional o gestacional)" },
];

export function calcularProximoControlPie(riesgo: string | null): string {
  switch (riesgo?.toLowerCase()) {
    case "bajo":
      return "Anual";
    case "moderado":
      return "Cada 6 meses";
    case "alto":
      return "Cada 3-4 meses";
    case "muy-alto":
    case "muy alto":
      return "Cada 1-3 meses";
    default:
      return "Pendiente de valoración";
  }
}

export function calcularProximoControlRetino(
  resultado: string | null,
  tiempoEvolucion: string | null,
  hba1c: number | null
): { texto: string; circuito: string } {
  if (resultado === "PATOLOGICA") {
    return {
      texto: "Derivación a Oftalmología (2º nivel)",
      circuito: "Circuito preferente / 2º nivel de cribado para valoración y gradación",
    };
  }
  if (resultado === "NORMAL") {
    if (tiempoEvolucion === ">=10" || tiempoEvolucion === "mas_10") {
      return { texto: "Anual", circuito: "Circuito habitual de cribado en Atención Primaria" };
    }
    if (hba1c != null && hba1c > 8.0) {
      return { texto: "Entre 1 y 2 años", circuito: "Circuito habitual (Factor de riesgo: HbA1c > 8%)" };
    }
    return { texto: "Trienal (cada 3 años)", circuito: "Circuito habitual de cribado" };
  }
  return { texto: "Retinografía inicial de referencia", circuito: "1er nivel de cribado AP/AH" };
}

export function calcularProximoControlGlicada(perfil: string | null, hba1c: number | null): string {
  switch (perfil) {
    case "GESTACION":
      return "Mensual (cada 14 días según pauta)";
    case "DM1_INTENSIVO":
      return "Trimestral";
    case "ANCIANO_FRAGIL":
      return "Semestral";
    case "GENERAL":
    default:
      return hba1c != null && hba1c >= 8.0 ? "Trimestral (mal control)" : "Semestral si está estable";
  }
}

export function formatearTratamientos(tratamientoStr: string | null | undefined): string {
  if (!tratamientoStr) return "Sin tratamiento registrado";
  try {
    const parsed = JSON.parse(tratamientoStr);
    if (Array.isArray(parsed)) {
      const nombres = parsed.map((id) => {
        const found = TRATAMIENTOS_INFO.find((t) => t.id === id);
        return found ? found.nombreCorto : id;
      });
      return nombres.join(" + ") || "Sin tratamiento";
    }
  } catch {
    // Texto plano
  }
  return tratamientoStr;
}

export function construirFichaPaciente(datos: DatosParaFicha): SeccionFicha[] {
  const {
    paciente,
    periodoSeleccionado,
    ultimaMedicion,
    ultimoControlTA,
    ultimoControlGlicada,
    ultimaExploracionPie,
    ultimaRetinografia,
    ultimoControlRenal,
    ultimoControlHepatico,
    ultimoControlCardiovascular,
    ultimoCribadoClaudicacion,
    ultimoControlMetabolico,
    complicaciones,
  } = datos;

  const edad = paciente.fechaNacimiento ? calcularEdad(paciente.fechaNacimiento) : null;
  const tipoDiabetesInfo = paciente.tipoDiabetes ? TIPOS_DIABETES_INFO[paciente.tipoDiabetes] : null;

  const ed = {
    paciente: (campo: string, tipo: EditableInfo["tipo"], opciones?: OpcionEdicion[]): EditableInfo => ({
      tabla: "paciente",
      registroId: paciente.id,
      campo,
      tipo,
      opciones,
    }),
    pacienteBooleano: (campo: string): EditableInfo => ({
      tabla: "paciente",
      registroId: paciente.id,
      campo,
      tipo: "booleanoTriEstado",
      opciones: OPCIONES_SI_NO,
    }),
    medicion: (campo: string): EditableInfo => ({
      tabla: "medicion",
      registroId: ultimaMedicion?.id ?? null,
      campo,
      tipo: "numero",
    }),
    controlTA: (campo: string): EditableInfo => ({
      tabla: "controlTA",
      registroId: ultimoControlTA?.id ?? null,
      campo,
      tipo: "numero",
    }),
    controlGlicada: (campo: string): EditableInfo => ({
      tabla: "controlGlicada",
      registroId: ultimoControlGlicada?.id ?? null,
      campo,
      tipo: "numero",
    }),
    controlRenal: (campo: string): EditableInfo => ({
      tabla: "controlRenal",
      registroId: ultimoControlRenal?.id ?? null,
      campo,
      tipo: "numero",
    }),
    controlHepatico: (campo: string): EditableInfo => ({
      tabla: "controlHepatico",
      registroId: ultimoControlHepatico?.id ?? null,
      campo,
      tipo: "numero",
    }),
    exploracionPieNumero: (campo: string): EditableInfo => ({
      tabla: "exploracionPie",
      registroId: ultimaExploracionPie?.id ?? null,
      campo,
      tipo: "numero",
    }),
    exploracionPieBooleano: (campo: string): EditableInfo => ({
      tabla: "exploracionPie",
      registroId: ultimaExploracionPie?.id ?? null,
      campo,
      tipo: "booleanoTriEstado",
      opciones: OPCIONES_SI_NO,
    }),
    retinografia: (campo: string): EditableInfo => ({
      tabla: "retinografia",
      registroId: ultimaRetinografia?.id ?? null,
      campo,
      tipo: "enum",
      opciones: OPCIONES_RETINOGRAFIA,
    }),
    complicaciones: (campo: string): EditableInfo => ({
      tabla: "complicaciones",
      registroId: complicaciones?.id ?? null,
      campo,
      tipo: "booleano",
      opciones: OPCIONES_SI_NO,
    }),
    controlMetabolico: (campo: string): EditableInfo => ({
      tabla: "controlMetabolico",
      registroId: ultimoControlMetabolico?.id ?? null,
      campo,
      tipo: "numero",
    }),
  };

  const secciones: SeccionFicha[] = [];

  // -- 1. Filiación -----------------------------------------------------------
  secciones.push({
    id: "filiacion",
    titulo: "Filiación",
    campos: [
      campoDirecto("periodo", "Período", periodoSeleccionado || new Date().getFullYear().toString(), {
        observaciones: "Período o año de la visita médica/enfermera mostrada.",
      }),
      campoDirecto("nuhsa", "NUHSA", paciente.nuhsa),
      campoDirecto("nombre", "Nombre y Apellidos", paciente.nombre ?? "Sin nombre"),
      campoDirecto("sexo", "Sexo", paciente.sexo === "H" ? "Hombre" : "Mujer"),
      campoDirecto("edad", "Edad", edad, { unidad: "años" }),
      campoDirecto("fechaNacimiento", "Fecha de nacimiento", paciente.fechaNacimiento?.toLocaleDateString("es-ES") ?? null),
      campoDirecto("claveMedica", "Clave médica", paciente.claveMedica, {
        editable: ed.paciente("claveMedica", "texto"),
      }),
      campoDirecto("claveEnfermeria", "Clave enfermería", paciente.claveEnfermeria, {
        editable: ed.paciente("claveEnfermeria", "texto"),
      }),
      campoDirecto("claveEquipo", "Clave equipo", paciente.claveEquipo, {
        editable: ed.paciente("claveEquipo", "texto"),
      }),
      campoDirecto("centroSalud", "Centro", paciente.centroSalud, {
        editable: ed.paciente("centroSalud", "texto"),
      }),
      campoDirecto("inmovilizado", "Paciente inmovilizado", paciente.inmovilizado, {
        observaciones: "Relevante para el riesgo de úlceras por presión (ver módulo Heridas).",
        editable: ed.pacienteBooleano("inmovilizado"),
      }),
      campoDirecto("viveEnResidencia", "Vive en residencia", paciente.viveEnResidencia, {
        observaciones: "Relevante para el riesgo de úlceras por presión (ver módulo Heridas).",
        editable: ed.pacienteBooleano("viveEnResidencia"),
      }),
      campoDirecto("notas", "Notas", paciente.notas, {
        observaciones: "Notas u observaciones libres sobre el paciente. También se ven en la tabla de CODEAPA.",
        editable: ed.paciente("notas", "textoLargo"),
      }),
    ],
  });

  // -- 2. Diabetes -------------------------------------------------------------
  const ttoFormateado = formatearTratamientos(paciente.tratamientoDiabetes);
  
  let mcgExplicacion = "Cumple criterios según la Resolución BOJA 2026";
  if (paciente.mcgEstado === "DEBERIA") {
    mcgExplicacion = "Cumple criterios de inclusión (p. ej. terapia insulínica, gestación o HbA1c ≥ 9%) pero no la tiene pautada todavía.";
  } else if (paciente.mcgEstado === "NO") {
    mcgExplicacion = "No cumple criterios de inclusión de la Resolución BOJA 2026 o presenta criterios de exclusión.";
  } else if (paciente.mcgEstado === "SI") {
    mcgExplicacion = "Porta MCG activa y cumple criterios de inclusión. Requiere revisiones trimestrales.";
  }

  const sexoTipado = paciente.sexo === "M" ? "M" : "H";

  secciones.push({
    id: "diabetes",
    titulo: "Diabetes",
    campos: [
      campoDirecto("tipoDiabetes", "Tipo de diabetes", tipoDiabetesInfo?.nombre ?? paciente.tipoDiabetes, {
        observaciones: tipoDiabetesInfo?.observaciones ?? "Haz clic para ver características y guía clínica.",
        fuente: tipoDiabetesInfo?.fuente ?? "PAI Diabetes Andalucía",
        interpretacion: tipoDiabetesInfo?.caracteristicas,
        editable: ed.paciente("tipoDiabetes", "enum", OPCIONES_TIPO_DIABETES),
      }),
      campoDirecto("tratamiento", "Tratamiento", ttoFormateado, {
        observaciones: "Tipos de tratamiento de elección (pueden combinarse varios).",
        editable: ed.paciente("tratamientoDiabetes", "texto"),
      }),
      campoDirecto("mcgEstado", "Monitorización Continua de Glucosa (MCG)", paciente.mcgEstado, {
        estado: paciente.mcgEstado === "SI" ? "normal" : paciente.mcgEstado === "DEBERIA" ? "alto" : "sin-datos",
        interpretacion: mcgExplicacion,
        observaciones: `${CRITERIOS_INCLUSION_MCG.criterio1A} / ${CRITERIOS_INCLUSION_MCG.criterio1B}`,
        fuente: CRITERIOS_INCLUSION_MCG.resumen,
        editable: ed.paciente("mcgEstado", "enum", OPCIONES_MCG),
      }),
      campoDirecto("embarazo", "Gestación / Embarazo", paciente.embarazo, {
        observaciones: "Criterio prioritario de inclusión en MCG y objetivos glucémicos específicos.",
        editable: ed.pacienteBooleano("embarazo"),
      }),
      campoDirecto("mcgIntegracionSAS", "Integración SAS (MCG)", paciente.mcgIntegracionSAS, {
        editable: ed.pacienteBooleano("mcgIntegracionSAS"),
      }),
      campoDirecto("mcgRevisionesTrim", "Revisiones cada 3 meses", paciente.mcgRevisionesTrim, {
        editable: ed.pacienteBooleano("mcgRevisionesTrim"),
      }),
    ],
  });

  // -- 3. Datos Antropométricos -----------------------------------------------
  const pesoKg = ultimaMedicion?.pesoKg ?? null;
  const tallaM = ultimaMedicion?.tallaM ?? null;
  const cinturaCm = ultimaMedicion?.perimetroCinturaCm ?? null;

  secciones.push({
    id: "antropometricos",
    titulo: "Datos antropométricos",
    campos: [
      campoDirecto("peso", "Peso", pesoKg, {
        unidad: "kg",
        fecha: ultimaMedicion?.fecha,
        editable: ed.medicion("pesoKg"),
      }),
      campoDirecto("talla", "Talla", tallaM, {
        unidad: "m",
        fecha: ultimaMedicion?.fecha,
        editable: ed.medicion("tallaM"),
      }),
      calcularIMC(pesoKg, tallaM),
      campoDirecto("perimetroCintura", "Perímetro de cintura", cinturaCm, {
        unidad: "cm",
        fecha: ultimaMedicion?.fecha,
        editable: ed.medicion("perimetroCinturaCm"),
      }),
      evaluarPerimetroCintura(cinturaCm, sexoTipado),
      calcularIndiceCinturaAltura(cinturaCm, tallaM),
    ],
  });

  // -- 4. Antecedentes --------------------------------------------------------
  secciones.push({
    id: "antecedentes",
    titulo: "Antecedentes personales y familiares",
    campos: [
      campoDirecto("tiempoEvolucion", "Tiempo de evolución", paciente.tiempoEvolucionDiabetes, {
        observaciones: "≤5 años, 5-10 años, ≥10 años. Relevante para cribado de retinopatía y riesgo.",
        editable: ed.paciente("tiempoEvolucionDiabetes", "texto"),
      }),
      campoDirecto("controlEvolucion", "Control de evolución", paciente.controlEvolucion, {
        observaciones: "Buen o mal control metabólico histórico.",
        editable: ed.paciente("controlEvolucion", "texto"),
      }),
      campoDirecto("antFamiliares", "Antecedentes familiares", paciente.antecedentesFamiliaresDiabetes, {
        observaciones: "1º grado, 2º grado o 3º grado.",
        editable: ed.paciente("antecedentesFamiliaresDiabetes", "texto"),
      }),
      campoDirecto("diabetesGestacional", "Diabetes gestacional previa", paciente.diabetesGestacionalPrevia, {
        observaciones: "S/N, No sigue después del embarazo, Sigue después del embarazo, Aparece a los X años.",
        editable: ed.paciente("diabetesGestacionalPrevia", "texto"),
      }),
    ],
  });

  // -- 5. Objetivos de Control Glucémico ---------------------------------------
  const gbValor = ultimoControlMetabolico?.glucemiaBasal ?? null;
  const gbFecha = ultimoControlMetabolico?.fechaGB ?? ultimoControlMetabolico?.fecha;
  const hba1cActual = ultimoControlGlicada?.hba1c ?? null;

  secciones.push({
    id: "objetivosGlucemicos",
    titulo: "Objetivos de control glucémico",
    campos: [
      campoDirecto("perfilControlGlucemico", "Perfil del paciente / Fragilidad", paciente.perfilControlGlucemico, {
        observaciones: "General / Anciano frágil / DM1 intensivo / Gestación.",
        editable: ed.paciente("perfilControlGlucemico", "enum", OPCIONES_PERFIL_GLUCEMICO),
      }),
      conEditable(evaluarGlucemiaBasal(gbValor), ed.controlMetabolico("glucemiaBasal")),
      campoDirecto("fechaGB", "Fecha de toma Glucemia Basal", gbFecha?.toLocaleDateString("es-ES") ?? null),
      evaluarObjetivoHbA1c(hba1cActual, (paciente.perfilControlGlucemico as PerfilControlGlucemico) || "GENERAL"),
    ],
  });

  // -- 6. Presión Arterial (T.A.) ---------------------------------------------
  secciones.push({
    id: "ta",
    titulo: "Control de la presión arterial (T.A.)",
    campos: [
      conEditable(evaluarPAS(ultimoControlTA?.pas ?? null), ed.controlTA("pas")),
      conEditable(evaluarPAD(ultimoControlTA?.pad ?? null), ed.controlTA("pad")),
      campoDirecto(
        "cifraTA",
        "Cifra T.A. (PAS/PAD)",
        ultimoControlTA?.pas && ultimoControlTA?.pad ? `${ultimoControlTA.pas}/${ultimoControlTA.pad}` : null,
        {
          unidad: "mmHg",
          fecha: ultimoControlTA?.fecha,
          interpretacion:
            ultimoControlTA?.pas && ultimoControlTA?.pad
              ? ultimoControlTA.pas < 140 && ultimoControlTA.pad < 90
                ? "Objetivo cumplido (<140/90 mmHg)"
                : "Tensión arterial elevada"
              : "Sin datos de T.A.",
        }
      ),
      campoDirecto("fechaTA", "Fecha de toma T.A.", ultimoControlTA?.fecha?.toLocaleDateString("es-ES") ?? null),
    ],
  });

  // -- 7. Pie Diabético e ITB -------------------------------------------------
  const evaluacionRiesgoPie = evaluarRiesgoPie({
    monofilamentoNormal: ultimaExploracionPie?.monofilamentoNormal ?? null,
    diapasonNormal: ultimaExploracionPie?.diapasonNormal ?? null,
    deformidad: ultimaExploracionPie?.deformidad ?? null,
    enfermedadArterialPeriferica: ultimaExploracionPie?.enfermedadArterialPeriferica ?? null,
    antecedenteUlceraOAmputacion: ultimaExploracionPie?.antecedenteUlceraOAmputacion ?? null,
  });

  const riesgoStr = String(evaluacionRiesgoPie.valor ?? "");
  const proxControlPie = calcularProximoControlPie(riesgoStr);

  const morfologiaDopplerValida =
    ultimaExploracionPie?.morfologiaDoppler === "TRIFASICA" ||
    ultimaExploracionPie?.morfologiaDoppler === "BIFASICA" ||
    ultimaExploracionPie?.morfologiaDoppler === "MONOFASICA" ||
    ultimaExploracionPie?.morfologiaDoppler === "ONDA_VARIABLE"
      ? ultimaExploracionPie.morfologiaDoppler
      : null;

  secciones.push({
    id: "pie",
    titulo: "Exploración del pie diabético & ITB",
    campos: [
      campoDirecto("pieRealizado", "Exploración realizada", ultimaExploracionPie?.realizado ?? (ultimaExploracionPie ? true : null), {
        editable: ed.exploracionPieBooleano("realizado"),
      }),
      campoDirecto("pieFecha", "Fecha exploración pie", ultimaExploracionPie?.fecha?.toLocaleDateString("es-ES") ?? null),
      evaluacionRiesgoPie,
      campoDirecto("pieProxControl", "Próximo control pie", proxControlPie, {
        estado: riesgoStr.includes("Muy") ? "muy-alto" : riesgoStr.includes("Alto") ? "alto" : "normal",
        observaciones: "Bajo: Anual | Moderado: Cada 6m | Alto: Cada 3-4m | Muy alto: Cada 1-3m.",
        fuente: "Documento oficial CODEAPA — Pág 7",
      }),
      campoDirecto("itb", "Índice Tobillo-Brazo (ITB)", ultimaExploracionPie?.itb ?? null, {
        observaciones: "Haz clic para ver la tabla completa de morfología Doppler y recomendación compresiva.",
        fuente: "Documento oficial CODEAPA — Págs 8 y 9",
        editable: ed.exploracionPieNumero("itb"),
      }),
      conEditable(
        evaluarTerapiaCompresiva(
          ultimaExploracionPie?.itb ?? null,
          morfologiaDopplerValida
        ),
        undefined
      ),
      campoDirecto("monofilamentoNormal", "Monofilamento normal", ultimaExploracionPie?.monofilamentoNormal, {
        editable: ed.exploracionPieBooleano("monofilamentoNormal"),
      }),
      campoDirecto("diapasonNormal", "Diapasón normal", ultimaExploracionPie?.diapasonNormal, {
        editable: ed.exploracionPieBooleano("diapasonNormal"),
      }),
      campoDirecto("deformidad", "Deformidad / Charcot", ultimaExploracionPie?.deformidad, {
        editable: ed.exploracionPieBooleano("deformidad"),
      }),
      campoDirecto("enfermedadArterialPeriferica", "EAP clínica", ultimaExploracionPie?.enfermedadArterialPeriferica, {
        editable: ed.exploracionPieBooleano("enfermedadArterialPeriferica"),
      }),
      campoDirecto("antecedenteUlceraOAmputacion", "Antecedente de úlcera / amputación", ultimaExploracionPie?.antecedenteUlceraOAmputacion, {
        editable: ed.exploracionPieBooleano("antecedenteUlceraOAmputacion"),
      }),
    ],
  });

  // -- 8. Retinografía --------------------------------------------------------
  const retinoInfo = calcularProximoControlRetino(
    ultimaRetinografia?.resultado ?? null,
    paciente.tiempoEvolucionDiabetes,
    hba1cActual
  );

  secciones.push({
    id: "retinografia",
    titulo: "Cribado de retinopatía diabética",
    campos: [
      campoDirecto("retinoRealizada", "Retinografía realizada", ultimaRetinografia?.realizada ?? (ultimaRetinografia ? true : null), {
        editable: ed.retinografia("realizada"),
      }),
      campoDirecto("retinografiaResultado", "Resultado retinografía", ultimaRetinografia?.resultado, {
        estado: ultimaRetinografia?.resultado === "PATOLOGICA" ? "muy-alto" : ultimaRetinografia?.resultado === "NORMAL" ? "normal" : "sin-datos",
        observaciones: "Normal / Patológica / No realizada.",
        editable: ed.retinografia("resultado"),
      }),
      campoDirecto("retinoFecha", "Fecha de retinografía", ultimaRetinografia?.fecha?.toLocaleDateString("es-ES") ?? null),
      campoDirecto("retinoProxControl", "Próximo control retinografía", retinoInfo.texto, {
        estado: ultimaRetinografia?.resultado === "PATOLOGICA" ? "muy-alto" : "normal",
        observaciones: `Circuito: ${retinoInfo.circuito}. Si es patológica, desaparece control rutinario y se deriva a 2º nivel.`,
        fuente: "Documento oficial CODEAPA — Pág 10",
      }),
    ],
  });

  // -- 9. Glicada (HbA1c) -----------------------------------------------------
  const proxGlicada = calcularProximoControlGlicada(paciente.perfilControlGlucemico, hba1cActual);
  secciones.push({
    id: "glicada",
    titulo: "HbA1c (Hemoglobina Glicada)",
    campos: [
      conEditable(evaluarHbA1c(hba1cActual), ed.controlGlicada("hba1c")),
      campoDirecto("fechaGlicada", "Fecha de extracción HbA1c", ultimoControlGlicada?.fecha?.toLocaleDateString("es-ES") ?? null),
      campoDirecto("glicadaProxControl", "Próximo control HbA1c", proxGlicada, {
        observaciones: "Frecuencia de extracción individualizada según perfil y control.",
        fuente: "Documento oficial CODEAPA — Págs 6 y 10",
      }),
    ],
  });

  // -- 10. Función Renal y Hepática -------------------------------------------
  const fge = ultimoControlRenal?.fge ?? null;
  const cac = ultimoControlRenal?.cac ?? null;
  const alt = ultimoControlHepatico?.alt ?? null;
  const ast = ultimoControlHepatico?.ast ?? null;
  const plaquetas = ultimoControlHepatico?.plaquetas ?? null;

  secciones.push({
    id: "renal",
    titulo: "Función renal",
    campos: [
      conEditable(evaluarFGe(fge), ed.controlRenal("fge")),
      conEditable(evaluarCAC(cac), ed.controlRenal("cac")),
      combinarRiesgoRenalKDIGO(fge, cac),
      conEditable(evaluarCreatinina(ultimoControlRenal?.creatinina ?? null, sexoTipado), ed.controlRenal("creatinina")),
    ],
  });

  secciones.push({
    id: "hepatico",
    titulo: "Función hepática",
    campos: [
      conEditable(evaluarALT(alt, sexoTipado), ed.controlHepatico("alt")),
      conEditable(evaluarAST(ast, sexoTipado), ed.controlHepatico("ast")),
      calcularFIB4(edad, ast, alt, plaquetas),
    ],
  });

  // -- 11. Complicaciones (Autocheck & Valoraciones) ---------------------------
  const complicacionesAuto = evaluarComplicaciones({
    ultimaRetinografia,
    ultimoControlRenal,
    ultimaExploracionPie,
    ultimoControlCardiovascular,
    ultimoControlHepatico,
    ultimoCribadoClaudicacion,
    complicacionesGuardadas: complicaciones,
  });

  const camposComplicaciones: ResultadoCampo[] = complicacionesAuto.map((c) => {
    return campoDirecto(c.id, c.nombre, c.presente ? "Sí" : "No", {
      estado: c.presente ? "alto" : "normal",
      interpretacion: c.motivoDetectado ?? (c.presente ? "Complicación detectada" : "Sin hallazgos"),
      observaciones: `Criterio: ${c.criterioClinico}${c.origen === "calculado" ? " [Autodetectado de analítica/exploración]" : ""}`,
      fuente: "CODEAPA — Existencia de Complicaciones (Págs 11-14)",
      editable: ed.complicaciones(c.id),
    });
  });

  secciones.push({
    id: "complicaciones",
    titulo: "Complicaciones (Microvasculares, Macrovasculares, Pie Diabético y Otras)",
    campos: camposComplicaciones,
  });

  return secciones;
}

export function buscarCampo(
  secciones: SeccionFicha[],
  seccionId: string,
  campoId: string
): ResultadoCampo | undefined {
  return secciones.find((s) => s.id === seccionId)?.campos.find((c) => c.id === campoId);
}

function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const aunNoCumplida =
    hoy.getMonth() < fechaNacimiento.getMonth() ||
    (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate());
  if (aunNoCumplida) edad--;
  return edad;
}

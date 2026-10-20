/**
 * Datos clínicos, tablas oficiales, baremos y bibliografía extraídos
 * directamente de la documentación de CODEAPA (Atención Primaria Andalucía).
 */

export interface TipoDiabetesInfo {
  id: string;
  nombre: string;
  caracteristicas: string;
  observaciones: string;
  fuente: string;
}

export const TIPOS_DIABETES_INFO: Record<string, TipoDiabetesInfo> = {
  TIPO_1: {
    id: "TIPO_1",
    nombre: "DM tipo 1",
    caracteristicas:
      "Destrucción autoinmune de la célula beta; insulinopenia absoluta; debut habitual en infancia/juventud, cetosis frecuente.",
    observaciones:
      "Insulinoterapia desde el diagnóstico (pauta bolo-basal o ISCI/bomba); educación diabetológica intensiva; valorar MCG desde el inicio según criterios de la Resolución BOJA 2026.",
    fuente: "Resolución BOJA 2026 / PAI Diabetes Andalucía (Consejería de Salud)",
  },
  TIPO_2: {
    id: "TIPO_2",
    nombre: "DM tipo 2",
    caracteristicas:
      "Resistencia a la insulina + déficit progresivo de secreción; asociada a obesidad, sedentarismo, edad.",
    observaciones:
      "1ª línea: cambios de estilo de vida (dieta y ejercicio) + metformina. Intensificación a los 3-6 meses si no hay objetivos: añadir iSGLT2 o aGLP-1 (preferentes si ECV, ERC u obesidad), iDPP-4, pioglitazona o sulfonilurea (gliclazida/glimepirida). Insulina basal si persiste mal control o síntomas de descompensación.",
    fuente: "Guía de Práctica Clínica sobre Diabetes tipo 2 / PAI Diabetes Andalucía",
  },
  GESTACIONAL: {
    id: "GESTACIONAL",
    nombre: "DM gestacional",
    caracteristicas:
      "Diagnosticada durante el embarazo (cribado con test de O'Sullivan a las 24-28 semanas y SOG si positivo).",
    observaciones:
      "1ª línea: dieta y ejercicio con autocontrol glucémico. Si no se alcanzan objetivos: insulina (fármaco de elección en gestación); metformina como alternativa en casos seleccionados. Reclasificación con SOG a las 6-12 semanas posparto.",
    fuente: "Protocolo de Asistencia al Embarazo en Andalucía (SAS)",
  },
  LADA: {
    id: "LADA",
    nombre: "LADA (diabetes autoinmune latente del adulto)",
    caracteristicas:
      "Adultos con anticuerpos positivos (anti-GAD) pero destrucción autoinmune de evolución lenta; a menudo mal clasificada inicialmente como DM2.",
    observaciones:
      "Insulinización precoz para preservar reserva pancreática; evitar sulfonilureas (agotan rápidamente la secreción residual); vigilancia estrecha de la progresión.",
    fuente: "Documento de Consenso SED / Guías Internacionales ADA-EASD",
  },
  SECUNDARIA_FARMACOS: {
    id: "SECUNDARIA_FARMACOS",
    nombre: "Secundaria a fármacos",
    caracteristicas:
      "Hiperglucemia inducida por tratamiento (corticoides, antipsicóticos, inhibidores del punto de control inmunológico, tacrolimus/ciclosporina); en inmunoterapia puede presentarse como DM autoinmune fulminante.",
    observaciones:
      "Ajustar o retirar el fármaco causal si es posible; insulina si se prevé tratamiento >6 meses o hiperglucemia marcada; en sospecha de origen autoinmune por inmunoterapia, insulinización urgente y valoración por Endocrinología.",
    fuente: "Consenso sobre Diabetes Inducida por Fármacos / Endocrinología SAS",
  },
  OTRA: {
    id: "OTRA",
    nombre: "Otras causas (Pancreoprivas, Monogénica...)",
    caracteristicas:
      "Diabetes pancreoprivas (pancreatitis crónica, cirugía), monogénicas (MODY), post-trasplante o asociadas a endocrinopatías.",
    observaciones:
      "Manejo según etiología subyacente y requerimientos insulínicos específicos.",
    fuente: "PAI Diabetes Andalucía",
  },
};

export interface TratamientoInfo {
  id: string;
  nombre: string;
  nombreCorto: string;
  caracteristicas: string;
  observaciones: string;
}

export const TRATAMIENTOS_INFO: TratamientoInfo[] = [
  {
    id: "DIETA_EJERCICIO",
    nombre: "1º escalón: dieta y ejercicio con autocontrol glucémico",
    nombreCorto: "Dieta y Ejercicio",
    caracteristicas:
      "Modificación de estilo de vida (dieta mediterránea/hipocalórica, ejercicio aeróbico ≥150 min/semana, pérdida de peso objetivo 5-10%), autocontrol glucémico capilar según pauta individualizada.",
    observaciones:
      "Es la base de todo el tratamiento y se mantiene aunque se añadan fármacos, nunca se sustituye por ellos. En DM2 recién diagnosticada sin descompensación puede ensayarse como monoterapia 3-6 meses. Requiere educación diabetológica estructurada y refuerzo continuo; sin apoyo activo la adherencia cae con el tiempo.",
  },
  {
    id: "ADOS",
    nombre: "ADOs (Antidiabéticos Orales)",
    nombreCorto: "ADOs",
    caracteristicas:
      "Metformina (1ª línea farmacológica en DM2); iSGLT2, iDPP-4, sulfonilureas (gliclazida, glimepirida), pioglitazona, repaglinida como opciones de intensificación.",
    observaciones:
      "Metformina contraindicada con FGe <30 (ajustar dosis entre 30-45); los iSGLT2/aGLP-1 son preferentes si hay ECV, ERC u obesidad asociadas; sulfonilureas: riesgo de hipoglucemia y ganancia de peso, evitarlas en LADA por agotar la reserva insulínica residual; pioglitazona: evitar si insuficiencia cardiaca u osteoporosis.",
  },
  {
    id: "BASAL",
    nombre: "Basal (Insulina basal)",
    nombreCorto: "Basal",
    caracteristicas:
      "Insulina de acción prolongada o ultra-prolongada (Glargina, Degludec, Detemir) administrada una vez al día para cubrir las necesidades basales.",
    observaciones:
      "Indicada en DM2 cuando los no insulínicos no alcanzan objetivos o en descompensación hiperglucémica. Titulación progresiva según glucemia basal en ayunas. Menor riesgo de hipoglucemias que pautas complejas.",
  },
  {
    id: "PAUTA_BOLO_BASAL",
    nombre: "Pauta bolo-basal",
    nombreCorto: "Bolo-Basal",
    caracteristicas:
      "Insulina basal + insulina rápida prandial antes de cada comida, ajustada según ingesta de hidratos y glucemia.",
    observaciones:
      "Estándar en DM1 y en DM2 con insulinización avanzada; exige educación en conteo de raciones/hidratos de carbono; mayor riesgo de hipoglucemia que la basal sola, pero más flexible que las premezclas; base para pasar posteriormente a ISCI si procede.",
  },
  {
    id: "ISCI_BOMBA",
    nombre: "ISCI / bomba de insulina",
    nombreCorto: "ISCI / Bomba",
    caracteristicas:
      "Infusión subcutánea continua de insulina mediante catéter; puede integrarse con MCG en sistemas híbridos de asa cerrada.",
    observaciones:
      "Indicada en DM1 con control metabólico no óptimo pese a bolo-basal correcto y buena adherencia (criterio recogido en el PAI); reduce variabilidad glucémica e hipoglucemias graves; requiere alta capacitación del paciente/cuidador y del equipo, y cumplimiento estricto de los criterios de uso.",
  },
  {
    id: "AGLP1",
    nombre: "aGLP-1 (Agonistas del receptor GLP-1)",
    nombreCorto: "aGLP-1",
    caracteristicas:
      "Liraglutida, semaglutida, dulaglutida; efecto incretina, enlentecen el vaciado gástrico y aumentan la saciedad.",
    observaciones:
      "Preferentes en pacientes con obesidad o ECV establecida por su beneficio en peso y protección cardiovascular; efectos adversos digestivos frecuentes (náuseas, sobre todo al iniciar); contraindicados si antecedente de pancreatitis, MEN2 o carcinoma medular de tiroides; administración subcutánea semanal (existe presentación oral de semaglutida).",
  },
];

export interface FilaITB {
  resultado: string;
  morfologia: string;
  interpretacion: string;
  recomendacionCompresion: string;
  presionRecomendada: string;
  conductaClinica: string;
  severidad: "alerta-maxima" | "riesgo-alto" | "riesgo-medio" | "normal" | "no-concluyente";
}

export const TABLA_ITB_COMPLETA: FilaITB[] = [
  {
    resultado: "> 1,30",
    morfologia: "Onda variable (calcificación)",
    interpretacion:
      "Vasos no compresibles por calcificación medial; ITB puede estar falsamente elevado y no descarta EAP.",
    recomendacionCompresion: "No decidir la compresión solo con el ITB.",
    presionRecomendada: "No aplicable hasta completar estudio de perfusión.",
    conductaClinica: "Solicitar IDB/TBI (presión del primer dedo) o eco-Doppler; decidir compresión según resultado.",
    severidad: "no-concluyente",
  },
  {
    resultado: "1,00 – 1,30",
    morfologia: "Trifásica",
    interpretacion: "Flujo arterial normal. Sin evidencia de enfermedad arterial periférica significativa.",
    recomendacionCompresion: "Compresión terapéutica completa (indicada si existe insuficiencia venosa).",
    presionRecomendada: "35 – 40 mmHg (40 mmHg en multicapa si úlcera venosa).",
    conductaClinica: "Iniciar/continuar compresión estándar según patología venosa y tolerancia.",
    severidad: "normal",
  },
  {
    resultado: "0,91 – 0,99",
    morfologia: "Trifásica o bifásica",
    interpretacion: "Flujo arterial generalmente conservado. ITB en límite inferior de la normalidad.",
    recomendacionCompresion: "Compresión terapéutica completa (habitualmente segura).",
    presionRecomendada: "30 – 40 mmHg.",
    conductaClinica: "Iniciar compresión con vigilancia clínica. Considerar estudio adicional si hay síntomas arteriales (claudicación, dolor en reposo, úlceras isquémicas).",
    severidad: "normal",
  },
  {
    resultado: "0,80 – 0,90",
    morfologia: "Bifásica",
    interpretacion: "Enfermedad arterial periférica leve. Disminución moderada del flujo arterial.",
    recomendacionCompresion: "Compresión moderada. Usar con precaución.",
    presionRecomendada: "20 – 30 mmHg.",
    conductaClinica: "Valorar junto a la clínica y otros parámetros (presión sistólica de tobillo >70 mmHg). Seguimiento clínico estrecho.",
    severidad: "riesgo-medio",
  },
  {
    resultado: "0,60 – 0,79",
    morfologia: "Monofásica",
    interpretacion: "Enfermedad arterial periférica moderada. Flujo arterial disminuido de forma significativa.",
    recomendacionCompresion: "Compresión modificada. Solo bajo supervisión especializada.",
    presionRecomendada: "20 – 30 mmHg (< 40 mmHg).",
    conductaClinica: "Usar compresión reducida con estrecho seguimiento; derivar a valoración vascular.",
    severidad: "riesgo-alto",
  },
  {
    resultado: "< 0,60",
    morfologia: "Monofásica",
    interpretacion: "Enfermedad arterial periférica grave. Alto riesgo de isquemia crítica.",
    recomendacionCompresion: "CONTRAINDICADA la compresión sostenida. Riesgo de isquemia crítica y necrosis.",
    presionRecomendada: "No aplicar compresión terapéutica.",
    conductaClinica: "Derivación urgente a Cirugía Vascular. Valorar revascularización antes de iniciar compresión.",
    severidad: "alerta-maxima",
  },
];

export const PERLAS_CLINICAS_ITB = [
  "En diabéticos o ERC, un ITB > 1,30 suele indicar calcificación de la media arterial y no excluye EAP; interpretar siempre junto a IDB/TBI, TcPO₂ o eco-Doppler.",
  "Contraindicación absoluta de compresión sostenida si ITB < 0,60 por riesgo inminente de necrosis tisular.",
];

export interface FilaRetinografiaProtocolo {
  situacionClinica: string;
  periodicidad: string;
  circuito: string;
  observacion: string;
}

export const PROTOCOLO_RETINOGRAFIA: FilaRetinografiaProtocolo[] = [
  {
    situacionClinica: "DM2 al diagnóstico / DM1 a partir de los 5 años de evolución o pubertad",
    periodicidad: "Retinografía inicial de referencia",
    circuito: "1er nivel de cribado: profesional de AP/AH con competencias específicas. Lectura en <1 mes",
    observacion: "Cribado de entrada.",
  },
  {
    situacionClinica: "Retinografía normal, DM >10 años de evolución",
    periodicidad: "Anual",
    circuito: "Circuito habitual de cribado en Atención Primaria",
    observacion: "Por duración de la diabetes > 10 años.",
  },
  {
    situacionClinica: "Retinografía normal, DM <10 años de evolución, sin otros FR (HTA, ERC, tabaquismo, HbA1c >8%)",
    periodicidad: "Trienal (cada 3 años)",
    circuito: "Circuito habitual",
    observacion: "Bajo riesgo de progresión rápida.",
  },
  {
    situacionClinica: "Retinografía normal con algún factor de riesgo de retinopatía (HTA, mal control, etc.)",
    periodicidad: "Individualizada, entre 1 y 2 años",
    circuito: "Circuito habitual",
    observacion: "Seguimiento más estrecho.",
  },
  {
    situacionClinica: "Cualquier grado de retinopatía u otro hallazgo patológico",
    periodicidad: "Desaparece próximo control rutinario (según indicación de Oftalmología)",
    circuito: "Derivación a 2º nivel de cribado (Oftalmología) para valoración y gradación",
    observacion: "Requiere estudio oftalmológico especializado.",
  },
  {
    situacionClinica: "Gestación con DM pregestacional",
    periodicidad: "Antes de la gestación, cada trimestre y posparto",
    circuito: "Circuito preferente",
    observacion: "Alto riesgo de progresión durante el embarazo.",
  },
];

export interface FilaObjetivoGlucemico {
  perfil: string;
  hba1cObjetivo: string;
  glucemiaBasal: string;
  glucemiaPostprandial: string;
  frecuenciaHbA1c: string;
}

export const OBJETIVOS_CONTROL_GLUCEMICO: FilaObjetivoGlucemico[] = [
  {
    perfil: "General / DM2 reciente, sin complicaciones, esperanza de vida larga",
    hba1cObjetivo: "< 7% (algunos < 6,5% si se logra sin hipoglucemias)",
    glucemiaBasal: "80 – 130 mg/dl",
    glucemiaPostprandial: "< 180 mg/dl",
    frecuenciaHbA1c: "Semestral si estable; trimestral si cambio de tratamiento o mal control",
  },
  {
    perfil: "Anciano frágil, comorbilidad grave, complicaciones avanzadas, esperanza de vida corta",
    hba1cObjetivo: "< 8 – 8,5%",
    glucemiaBasal: "100 – 150 mg/dl",
    glucemiaPostprandial: "< 200 mg/dl",
    frecuenciaHbA1c: "Semestral",
  },
  {
    perfil: "DM1 / tratamiento insulínico intensivo",
    hba1cObjetivo: "< 7% (individualizar, evitar hipoglucemias)",
    glucemiaBasal: "80 – 130 mg/dl",
    glucemiaPostprandial: "< 180 mg/dl",
    frecuenciaHbA1c: "Trimestral",
  },
  {
    perfil: "Gestación (DM pregestacional o gestacional)",
    hba1cObjetivo: "< 6 – 6,5%",
    glucemiaBasal: "< 95 mg/dl (basal)",
    glucemiaPostprandial: "< 140 mg/dl (1h) / < 120 mg/dl (2h)",
    frecuenciaHbA1c: "Mensual / Cada 14 días",
  },
];

export const CRITERIOS_INCLUSION_MCG = {
  resumen: "Resolución BOJA 2026 sobre Monitorización Continua de Glucosa en el SAS",
  criterio1A:
    "1.A. Población con diabetes en edad adulta y pediátrica en terapia insulínica intensiva con múltiples dosis de insulina o bomba de insulina y con necesidad de realizar 6 ó más controles de glucemia capilar al día (ISCI o DM1).",
  criterio1B:
    "1.B. Población con diabetes en edad adulta y pediátrica en terapia insulínica con al menos una dosis de insulina basal en la que concurra alguna de las siguientes situaciones:",
  situaciones1B: [
    "Pacientes institucionalizados, en situación de dependencia o con discapacidad funcional o cognitiva que impida la realización de glucemia capilar y/o su interpretación.",
    "Gestación o programación de gestación.",
    "Edad inferior a 18 años.",
    "Pacientes con antecedentes de hipoglucemia grave (≥ 1 episodio en los últimos 2 años que precisó atención sanitaria o ayuda por terceros).",
    "Pacientes con necesidad de intensificación en su control metabólico (HbA1c ≥ 9%).",
  ],
  requisitosIndispensables: [
    "Supervisión por una persona cuidadora mayor de 18 años (si < 18 años o falta de autonomía).",
    "Nivel adecuado de educación terapéutica en diabetes.",
    "Buena adherencia a las recomendaciones de su equipo sanitario.",
  ],
  criteriosRetirada: [
    "a) No se alcanzan los objetivos de control esperados y/o la tasa de complicaciones agudas supera la del año previo.",
    "b) No se cumplen los criterios de adherencia establecidos por el equipo de diabetes.",
    "c) Problemas de seguridad clínica por manejo no óptimo que no se resuelven tras refuerzo educativo.",
    "d) Reacciones cutáneas asociadas al adhesivo del sensor u otros efectos adversos.",
    "e) Se sigue utilizando un número de tiras reactivas similar o mayor al que venía utilizando previamente.",
  ],
};

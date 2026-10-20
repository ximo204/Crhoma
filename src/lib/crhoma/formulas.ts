import type { EntradaUsada, EstadoSemaforo, ResultadoCampo } from "./types";

/**
 * Fórmulas y clasificaciones extraídas del documento CRHOMA
 * (Cuadrante Predictivo de Complicaciones, Actitudes Terapéuticas y Cuidados).
 *
 * Cada función devuelve un `ResultadoCampo` con el valor, el color/semáforo,
 * y —si el campo es calculado— la fórmula y los datos de entrada usados,
 * para que la casilla pueda explicarse a sí misma al hacer clic.
 *
 * Import: cuando el dato de entrada falta, la función devuelve
 * estado "sin-datos" en vez de lanzar un error — un paciente puede tener
 * la ficha incompleta.
 */

export type Sexo = "H" | "M";

// ---------------------------------------------------------------------------
// IMC (Índice de Masa Corporal)
// Fuente: CRHOMA — Dominio Obesidad, sección 1 y 2
// ---------------------------------------------------------------------------
export function calcularIMC(pesoKg: number | null, tallaM: number | null): ResultadoCampo {
  if (pesoKg == null || tallaM == null || tallaM <= 0) {
    return {
      id: "imc",
      etiqueta: "IMC",
      valor: null,
      unidad: "kg/m²",
      estado: "sin-datos",
      formula: "Peso (kg) ÷ Talla² (m²)",
      fuente: "CRHOMA — Dominio Obesidad, sección 1",
      observaciones: "Faltan peso y/o talla para poder calcularlo.",
    };
  }

  const imc = pesoKg / (tallaM * tallaM);
  const redondeado = Math.round(imc * 10) / 10;

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (imc < 18.5) {
    estado = "bajo";
    interpretacion = "Bajo peso";
  } else if (imc < 25) {
    estado = "normal";
    interpretacion = "Normopeso";
  } else if (imc < 30) {
    estado = "alto";
    interpretacion = "Sobrepeso";
  } else if (imc < 35) {
    estado = "alto";
    interpretacion = "Obesidad grado I";
  } else if (imc < 40) {
    estado = "muy-alto";
    interpretacion = "Obesidad grado II";
  } else {
    estado = "muy-alto";
    interpretacion = "Obesidad grado III (mórbida)";
  }

  return {
    id: "imc",
    etiqueta: "IMC",
    valor: redondeado,
    unidad: "kg/m²",
    estado,
    interpretacion,
    formula: "IMC = Peso (kg) ÷ Talla² (m²)",
    entradas: [
      { etiqueta: "Peso", valor: pesoKg, unidad: "kg" },
      { etiqueta: "Talla", valor: tallaM, unidad: "m" },
    ],
    rangoNormal: "18,5–24,9 kg/m²",
    fuente: "CRHOMA — Dominio Obesidad, sección 1-2",
  };
}

// ---------------------------------------------------------------------------
// Perímetro de cintura — umbral depende del sexo
// Fuente: CRHOMA — Dominio Obesidad, sección 1
// ---------------------------------------------------------------------------
export function evaluarPerimetroCintura(
  cinturaCm: number | null,
  sexo: Sexo | null
): ResultadoCampo {
  if (cinturaCm == null || sexo == null) {
    return {
      id: "riesgoCintura",
      etiqueta: "Perímetro de cintura",
      valor: cinturaCm,
      unidad: "cm",
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Obesidad, sección 1",
      observaciones: sexo == null ? "Falta el sexo del paciente para aplicar el umbral correcto." : "Falta el valor de perímetro de cintura.",
    };
  }

  const umbralAumentado = sexo === "H" ? 94 : 80;
  const umbralMuyAumentado = sexo === "H" ? 102 : 88;

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (cinturaCm < umbralAumentado) {
    estado = "normal";
    interpretacion = "Sin adiposidad central aumentada";
  } else if (cinturaCm < umbralMuyAumentado) {
    estado = "alto";
    interpretacion = "Perímetro aumentado";
  } else {
    estado = "muy-alto";
    interpretacion = "Perímetro muy aumentado — riesgo cardiovascular muy elevado";
  }

  return {
    id: "riesgoCintura",
    etiqueta: "Perímetro de cintura",
    valor: cinturaCm,
    unidad: "cm",
    estado,
    interpretacion,
    entradas: [
      { etiqueta: "Perímetro de cintura", valor: cinturaCm, unidad: "cm" },
      { etiqueta: "Sexo", valor: sexo === "H" ? "Hombre" : "Mujer" },
    ],
    rangoNormal: sexo === "H" ? "< 94 cm (hombre)" : "< 80 cm (mujer)",
    fuente: "CRHOMA — Dominio Obesidad, sección 1",
  };
}

// ---------------------------------------------------------------------------
// Índice cintura/altura (ICA) = perímetro cintura ÷ talla (misma unidad)
// Fuente: CRHOMA — Dominio Obesidad, sección 3
// ---------------------------------------------------------------------------
export function calcularIndiceCinturaAltura(
  cinturaCm: number | null,
  tallaM: number | null
): ResultadoCampo {
  if (cinturaCm == null || tallaM == null || tallaM <= 0) {
    return {
      id: "ica",
      etiqueta: "Índice cintura/altura",
      valor: null,
      estado: "sin-datos",
      formula: "Perímetro de cintura (cm) ÷ Talla (cm)",
      fuente: "CRHOMA — Dominio Obesidad, sección 3",
      observaciones: "Faltan el perímetro de cintura y/o la talla.",
    };
  }

  const tallaCm = tallaM * 100;
  const ica = cinturaCm / tallaCm;
  const redondeado = Math.round(ica * 100) / 100;

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (ica < 0.4) {
    estado = "bajo";
    interpretacion = "Rango poco habitual — valorar estado nutricional";
  } else if (ica < 0.5) {
    estado = "normal";
    interpretacion = "Riesgo cardiometabólico bajo";
  } else if (ica < 0.6) {
    estado = "alto";
    interpretacion = "Adiposidad central aumentada";
  } else {
    estado = "muy-alto";
    interpretacion = "Adiposidad central marcada — riesgo muy aumentado";
  }

  return {
    id: "ica",
    etiqueta: "Índice cintura/altura",
    valor: redondeado,
    estado,
    interpretacion,
    formula: "ICA = Perímetro de cintura (cm) ÷ Talla (cm)",
    entradas: [
      { etiqueta: "Perímetro de cintura", valor: cinturaCm, unidad: "cm" },
      { etiqueta: "Talla", valor: tallaCm, unidad: "cm" },
    ],
    rangoNormal: "< 0,5 (sin riesgo aumentado)",
    fuente: "CRHOMA — Dominio Obesidad, sección 3",
    observaciones: "Regla rápida: el perímetro de cintura debería ser inferior a la mitad de la talla.",
  };
}

// ---------------------------------------------------------------------------
// Presión arterial sistólica / diastólica
// Fuente: CRHOMA — Dominio Cardiovascular, sección 1
// ---------------------------------------------------------------------------
export function evaluarPAS(pas: number | null): ResultadoCampo {
  if (pas == null) {
    return {
      id: "pas",
      etiqueta: "PA sistólica",
      valor: null,
      unidad: "mmHg",
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Cardiovascular, sección 1",
    };
  }

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (pas < 90) {
    estado = "bajo";
    interpretacion = "Hipotensión";
  } else if (pas < 130) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (pas < 160) {
    estado = "alto";
    interpretacion = "HTA grado 1 (140-159)";
  } else if (pas < 180) {
    estado = "muy-alto";
    interpretacion = "HTA grado 2 (160-179)";
  } else {
    estado = "muy-alto";
    interpretacion = "HTA grado 3 (≥180)";
  }

  return {
    id: "pas",
    etiqueta: "PA sistólica",
    valor: pas,
    unidad: "mmHg",
    estado,
    interpretacion,
    rangoNormal: "90–129 mmHg (objetivo <140, o <130 en prevención 2ª/RV alto)",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 1",
  };
}

export function evaluarPAD(pad: number | null): ResultadoCampo {
  if (pad == null) {
    return {
      id: "pad",
      etiqueta: "PA diastólica",
      valor: null,
      unidad: "mmHg",
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Cardiovascular, sección 1",
    };
  }

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (pad < 60) {
    estado = "bajo";
    interpretacion = "Hipotensión";
  } else if (pad <= 84) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (pad < 90) {
    estado = "normal";
    interpretacion = "Límite alto — vigilar junto a la PAS";
  } else if (pad < 100) {
    estado = "alto";
    interpretacion = "HTA grado 1 (90-99)";
  } else if (pad < 110) {
    estado = "muy-alto";
    interpretacion = "HTA grado 2 (100-109)";
  } else {
    estado = "muy-alto";
    interpretacion = "HTA grado 3 (≥110)";
  }

  return {
    id: "pad",
    etiqueta: "PA diastólica",
    valor: pad,
    unidad: "mmHg",
    estado,
    interpretacion,
    rangoNormal: "60–84 mmHg (objetivo <90, o <80 en prevención 2ª/RV alto)",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 1",
    observaciones: "Valorar siempre junto a la PAS.",
  };
}

// ---------------------------------------------------------------------------
// HbA1c — clasificación diagnóstica general (no sustituye al objetivo
// individualizado por perfil de paciente, que se añadirá más adelante).
// Fuente: CRHOMA — Dominio Metabólico, sección 1
// ---------------------------------------------------------------------------
export function evaluarHbA1c(hba1c: number | null): ResultadoCampo {
  if (hba1c == null) {
    return {
      id: "hba1c",
      etiqueta: "HbA1c",
      valor: null,
      unidad: "%",
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Metabólico, sección 1",
    };
  }

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (hba1c < 5.7) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (hba1c < 6.5) {
    estado = "alto";
    interpretacion = "Prediabetes";
  } else if (hba1c < 9) {
    estado = "alto";
    interpretacion = "Diabetes";
  } else {
    estado = "muy-alto";
    interpretacion = "Diabetes con mal control (≥9%) — intensificar tratamiento";
  }

  return {
    id: "hba1c",
    etiqueta: "HbA1c",
    valor: hba1c,
    unidad: "%",
    estado,
    interpretacion,
    rangoNormal: "< 5,7 % (diagnóstico); objetivo de control individualizado según perfil",
    fuente: "CRHOMA — Dominio Metabólico, sección 1",
    observaciones:
      "Esta es la clasificación diagnóstica general. El objetivo de control (p. ej. <7% o <8,5%) depende del perfil del paciente (edad, fragilidad, tipo de diabetes).",
  };
}

// ---------------------------------------------------------------------------
// Riesgo de pie diabético — no es una fórmula matemática sino una regla
// clínica que combina varios hallazgos de la exploración.
// Fuente: CRHOMA — Dominio Metabólico, sección 7.2 / CODEAPA, sección 6
// ---------------------------------------------------------------------------
export interface DatosExploracionPie {
  monofilamentoNormal: boolean | null;
  diapasonNormal: boolean | null;
  deformidad: boolean | null;
  enfermedadArterialPeriferica: boolean | null;
  antecedenteUlceraOAmputacion: boolean | null;
}

export function evaluarRiesgoPie(datos: DatosExploracionPie): ResultadoCampo {
  const {
    monofilamentoNormal,
    diapasonNormal,
    deformidad,
    enfermedadArterialPeriferica,
    antecedenteUlceraOAmputacion,
  } = datos;

  const faltanDatos =
    monofilamentoNormal == null ||
    diapasonNormal == null ||
    deformidad == null ||
    enfermedadArterialPeriferica == null ||
    antecedenteUlceraOAmputacion == null;

  if (faltanDatos) {
    return {
      id: "riesgoPie",
      etiqueta: "Riesgo de pie diabético",
      valor: null,
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Metabólico, sección 7.2",
      observaciones: "Faltan datos de la exploración del pie (monofilamento, diapasón, deformidad, EAP o antecedente de úlcera/amputación).",
    };
  }

  const neuropatia = !monofilamentoNormal || !diapasonNormal;

  let valor: string;
  let estado: EstadoSemaforo;
  let interpretacion: string;
  const rangoNormal = "Cada 1-3 meses (muy alto) · 3-4 meses (alto) · 6 meses (moderado) · anual (bajo)";

  if (antecedenteUlceraOAmputacion) {
    valor = "Muy alto";
    estado = "muy-alto";
    interpretacion = "Antecedente de úlcera y/o amputación previa — revisión cada 1-3 meses";
  } else if (neuropatia && (deformidad || enfermedadArterialPeriferica)) {
    valor = "Alto";
    estado = "muy-alto";
    interpretacion = "Neuropatía + deformidad y/o EAP (sin úlcera previa) — revisión cada 3-4 meses";
  } else if (neuropatia) {
    valor = "Moderado";
    estado = "alto";
    interpretacion = "Neuropatía sin deformidad ni EAP — revisión cada 6 meses";
  } else {
    valor = "Bajo";
    estado = "normal";
    interpretacion = "Monofilamento y diapasón normales, sin deformidad ni EAP — revisión anual";
  }

  return {
    id: "riesgoPie",
    etiqueta: "Riesgo de pie diabético",
    valor,
    estado,
    interpretacion,
    entradas: [
      { etiqueta: "Monofilamento normal", valor: monofilamentoNormal ? "Sí" : "No" },
      { etiqueta: "Diapasón normal", valor: diapasonNormal ? "Sí" : "No" },
      { etiqueta: "Deformidad", valor: deformidad ? "Sí" : "No" },
      { etiqueta: "Enfermedad arterial periférica", valor: enfermedadArterialPeriferica ? "Sí" : "No" },
      { etiqueta: "Antecedente de úlcera/amputación", valor: antecedenteUlceraOAmputacion ? "Sí" : "No" },
    ],
    rangoNormal,
    fuente: "CRHOMA — Dominio Metabólico, sección 7.2 / CODEAPA, sección 6",
  };
}

// ---------------------------------------------------------------------------
// Filtrado glomerular estimado (FGe) — grados G1-G5
// Fuente: CRHOMA — Dominio Renal, sección 1-2
// ---------------------------------------------------------------------------
export function evaluarFGe(fge: number | null): ResultadoCampo {
  if (fge == null) {
    return {
      id: "fge",
      etiqueta: "FGe",
      valor: null,
      unidad: "ml/min/1,73m²",
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Renal, sección 1",
    };
  }

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (fge >= 90) {
    estado = "normal";
    interpretacion = "G1 — normal";
  } else if (fge >= 60) {
    estado = "normal";
    interpretacion = "G2 — leve";
  } else if (fge >= 45) {
    estado = "alto";
    interpretacion = "G3a — moderado";
  } else if (fge >= 30) {
    estado = "alto";
    interpretacion = "G3b — moderado-grave";
  } else if (fge >= 15) {
    estado = "muy-alto";
    interpretacion = "G4 — grave";
  } else {
    estado = "muy-alto";
    interpretacion = "G5 — fallo renal";
  }

  return {
    id: "fge",
    etiqueta: "FGe",
    valor: fge,
    unidad: "ml/min/1,73m²",
    estado,
    interpretacion,
    rangoNormal: "≥ 90 ml/min/1,73m² (G1)",
    fuente: "CRHOMA — Dominio Renal, sección 1",
    observaciones:
      "< 60 mantenido ≥ 3 meses es uno de los dos criterios diagnósticos de ERC (ver Cociente albúmina/creatinina).",
  };
}

// ---------------------------------------------------------------------------
// Cociente albúmina/creatinina (CAC/UACR) — categorías A1-A3
// Fuente: CRHOMA — Dominio Renal, sección 1-2
// ---------------------------------------------------------------------------
export function evaluarCAC(cac: number | null): ResultadoCampo {
  if (cac == null) {
    return {
      id: "cac",
      etiqueta: "Cociente albúmina/creatinina (CAC)",
      valor: null,
      unidad: "mg/g",
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Renal, sección 1",
    };
  }

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (cac < 30) {
    estado = "normal";
    interpretacion = "A1 — normal-leve";
  } else if (cac < 300) {
    estado = "alto";
    interpretacion = "A2 — moderadamente aumentada (albuminuria)";
  } else {
    estado = "muy-alto";
    interpretacion = "A3 — muy aumentada (albuminuria)";
  }

  return {
    id: "cac",
    etiqueta: "Cociente albúmina/creatinina (CAC)",
    valor: cac,
    unidad: "mg/g",
    estado,
    interpretacion,
    rangoNormal: "< 30 mg/g (A1)",
    fuente: "CRHOMA — Dominio Renal, sección 1",
    observaciones:
      "Un único valor elevado no confirma albuminuria: se necesitan 2 de 3 muestras positivas en 3-6 meses.",
  };
}

// ---------------------------------------------------------------------------
// Riesgo renal combinado (matriz de calor KDIGO: FGe × CAC)
// Fuente: CRHOMA — Dominio Renal, sección 5
// ---------------------------------------------------------------------------
export function combinarRiesgoRenalKDIGO(fge: number | null, cac: number | null): ResultadoCampo {
  if (fge == null || cac == null) {
    return {
      id: "riesgoRenalKdigo",
      etiqueta: "Riesgo renal (KDIGO)",
      valor: null,
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Renal, sección 5",
      observaciones: "Requiere FGe y CAC para calcular el riesgo combinado.",
    };
  }

  const grupoFGe = fge >= 90 ? "G1" : fge >= 60 ? "G2" : fge >= 45 ? "G3a" : fge >= 30 ? "G3b" : fge >= 15 ? "G4" : "G5";
  const grupoCAC = cac < 30 ? "A1" : cac < 300 ? "A2" : "A3";

  // Matriz KDIGO (CRHOMA — Dominio Renal, sección 5)
  const matriz: Record<string, Record<string, "bajo" | "moderado" | "alto" | "muy-alto">> = {
    G1: { A1: "bajo", A2: "moderado", A3: "alto" },
    G2: { A1: "bajo", A2: "moderado", A3: "alto" },
    G3a: { A1: "moderado", A2: "alto", A3: "muy-alto" },
    G3b: { A1: "alto", A2: "muy-alto", A3: "muy-alto" },
    G4: { A1: "muy-alto", A2: "muy-alto", A3: "muy-alto" },
    G5: { A1: "muy-alto", A2: "muy-alto", A3: "muy-alto" },
  };

  const nivel = matriz[grupoFGe][grupoCAC];
  const estado: EstadoSemaforo = nivel === "bajo" ? "normal" : nivel === "moderado" ? "alto" : nivel === "alto" ? "alto" : "muy-alto";
  const valor = nivel === "bajo" ? "Bajo" : nivel === "moderado" ? "Moderado" : nivel === "alto" ? "Alto" : "Muy alto";

  return {
    id: "riesgoRenalKdigo",
    etiqueta: "Riesgo renal (KDIGO)",
    valor,
    estado,
    interpretacion: `FGe ${grupoFGe} × CAC ${grupoCAC}`,
    entradas: [
      { etiqueta: "FGe", valor: fge, unidad: "ml/min/1,73m²" },
      { etiqueta: "CAC", valor: cac, unidad: "mg/g" },
    ],
    fuente: "CRHOMA — Dominio Renal, sección 5 (matriz KDIGO 2024)",
    observaciones: "Cruza el grado de FGe con la categoría de albuminuria para dar el riesgo global de progresión renal.",
  };
}

// ---------------------------------------------------------------------------
// ALT/GPT y AST/GOT — umbrales por sexo
// Fuente: CODEAPA — Valoración hepática
// ---------------------------------------------------------------------------
export function evaluarALT(alt: number | null, sexo: Sexo | null): ResultadoCampo {
  if (alt == null || sexo == null) {
    return {
      id: "alt",
      etiqueta: "ALT (GPT)",
      valor: alt,
      unidad: "U/l",
      estado: "sin-datos",
      fuente: "CODEAPA — Valoración hepática",
    };
  }
  const umbral = sexo === "H" ? 41 : 33;
  const estado: EstadoSemaforo = alt <= umbral ? "normal" : "alto";
  return {
    id: "alt",
    etiqueta: "ALT (GPT)",
    valor: alt,
    unidad: "U/l",
    estado,
    interpretacion: estado === "normal" ? "Normal" : "Por encima del rango — componente del FIB-4",
    rangoNormal: sexo === "H" ? "≤ 41 U/l (hombre)" : "≤ 33 U/l (mujer)",
    fuente: "CODEAPA — Valoración hepática",
  };
}

export function evaluarAST(ast: number | null, sexo: Sexo | null): ResultadoCampo {
  if (ast == null || sexo == null) {
    return {
      id: "ast",
      etiqueta: "AST (GOT)",
      valor: ast,
      unidad: "U/l",
      estado: "sin-datos",
      fuente: "CODEAPA — Valoración hepática",
    };
  }
  const umbral = sexo === "H" ? 40 : 34;
  const estado: EstadoSemaforo = ast <= umbral ? "normal" : "alto";
  return {
    id: "ast",
    etiqueta: "AST (GOT)",
    valor: ast,
    unidad: "U/l",
    estado,
    interpretacion: estado === "normal" ? "Normal" : "Por encima del rango — componente del FIB-4",
    rangoNormal: sexo === "H" ? "≤ 40 U/l (hombre)" : "≤ 34 U/l (mujer)",
    fuente: "CODEAPA — Valoración hepática",
  };
}

// ---------------------------------------------------------------------------
// FIB-4 — índice de fibrosis hepática, ajustado por edad
// Fuente: CRHOMA — Dominio Hepático, sección 3
// ---------------------------------------------------------------------------
export function calcularFIB4(
  edadAnios: number | null,
  ast: number | null,
  alt: number | null,
  plaquetas: number | null
): ResultadoCampo {
  if (edadAnios == null || ast == null || alt == null || plaquetas == null || plaquetas <= 0 || alt <= 0) {
    return {
      id: "fib4",
      etiqueta: "FIB-4",
      valor: null,
      estado: "sin-datos",
      formula: "(Edad × AST) ÷ (Plaquetas × √ALT)",
      fuente: "CRHOMA — Dominio Hepático, sección 3",
      observaciones: "Faltan edad, AST, ALT y/o plaquetas para poder calcularlo.",
    };
  }

  const fib4 = (edadAnios * ast) / (plaquetas * Math.sqrt(alt));
  const redondeado = Math.round(fib4 * 100) / 100;

  const esMayor = edadAnios > 65;
  const umbralBajo = esMayor ? 2.0 : 1.3;

  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (edadAnios < 35) {
    estado = fib4 < 1.3 ? "normal" : fib4 <= 2.67 ? "alto" : "muy-alto";
    interpretacion = "Rendimiento del FIB-4 limitado en <35 años — priorizar ecografía/elastografía";
  } else if (fib4 < umbralBajo) {
    estado = "normal";
    interpretacion = "Riesgo bajo de fibrosis avanzada";
  } else if (fib4 <= 2.67) {
    estado = "alto";
    interpretacion = "Riesgo intermedio — derivar a elastografía (VCTE)";
  } else {
    estado = "muy-alto";
    interpretacion = "Riesgo alto — derivación directa a Hepatología";
  }

  return {
    id: "fib4",
    etiqueta: "FIB-4",
    valor: redondeado,
    estado,
    interpretacion,
    formula: "FIB-4 = (Edad × AST) ÷ (Plaquetas × √ALT)",
    entradas: [
      { etiqueta: "Edad", valor: edadAnios, unidad: "años" },
      { etiqueta: "AST", valor: ast, unidad: "U/l" },
      { etiqueta: "ALT", valor: alt, unidad: "U/l" },
      { etiqueta: "Plaquetas", valor: plaquetas, unidad: "×10⁹/l" },
    ],
    rangoNormal: esMayor ? "< 2,0 (bajo riesgo, > 65 años)" : "< 1,3 (bajo riesgo, 35-65 años)",
    fuente: "CRHOMA — Dominio Hepático, sección 3 (AASLD/EASL 2024)",
  };
}

// ---------------------------------------------------------------------------
// Objetivo de HbA1c individualizado según el perfil clínico del paciente
// Fuente: CRHOMA — Dominio Metabólico, sección 6 / CODEAPA, sección 5
// ---------------------------------------------------------------------------
export type PerfilControlGlucemico = "GENERAL" | "ANCIANO_FRAGIL" | "DM1_INTENSIVO" | "GESTACION";

const OBJETIVOS_HBA1C: Record<PerfilControlGlucemico, { limite: number; texto: string; etiquetaPerfil: string }> = {
  GENERAL: { limite: 7, texto: "< 7% (algunos < 6,5% si se logra sin hipoglucemias)", etiquetaPerfil: "General / DM2 reciente" },
  ANCIANO_FRAGIL: { limite: 8.5, texto: "< 8-8,5%", etiquetaPerfil: "Anciano frágil / comorbilidad grave" },
  DM1_INTENSIVO: { limite: 7, texto: "< 7% (individualizar, evitar hipoglucemias)", etiquetaPerfil: "DM1 / tratamiento insulínico intensivo" },
  GESTACION: { limite: 6.5, texto: "< 6-6,5%", etiquetaPerfil: "Gestación" },
};

export function evaluarObjetivoHbA1c(
  hba1c: number | null,
  perfil: PerfilControlGlucemico
): ResultadoCampo {
  const objetivo = OBJETIVOS_HBA1C[perfil];

  if (hba1c == null) {
    return {
      id: "objetivoHbA1c",
      etiqueta: "Objetivo de HbA1c",
      valor: null,
      estado: "sin-datos",
      rangoNormal: objetivo.texto,
      fuente: "CRHOMA — Dominio Metabólico, sección 6",
      observaciones: `Perfil: ${objetivo.etiquetaPerfil}.`,
    };
  }

  const cumple = hba1c < objetivo.limite;
  const estado: EstadoSemaforo = cumple ? "normal" : "alto";

  return {
    id: "objetivoHbA1c",
    etiqueta: "Objetivo de HbA1c",
    valor: cumple ? "Objetivo cumplido" : "Objetivo no alcanzado",
    estado,
    interpretacion: `HbA1c actual ${hba1c}% frente a objetivo ${objetivo.texto}`,
    entradas: [
      { etiqueta: "HbA1c actual", valor: hba1c, unidad: "%" },
      { etiqueta: "Perfil", valor: objetivo.etiquetaPerfil },
    ],
    rangoNormal: objetivo.texto,
    fuente: "CRHOMA — Dominio Metabólico, sección 6 / CODEAPA, sección 5",
    observaciones: "El objetivo se individualiza según edad, fragilidad y tipo de diabetes — no es el mismo umbral diagnóstico que la clasificación general de HbA1c.",
  };
}

// =============================================================================
// DOMINIO CARDIOVASCULAR (resto del panel — PAS/PAD ya están más arriba)
// =============================================================================

export function evaluarFrecuenciaCardiaca(fc: number | null): ResultadoCampo {
  if (fc == null) {
    return { id: "frecuenciaCardiaca", etiqueta: "Frecuencia cardiaca", valor: null, unidad: "lpm", estado: "sin-datos", fuente: "CRHOMA — Dominio Cardiovascular, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (fc < 60) {
    estado = "bajo";
    interpretacion = "Bradicardia";
  } else if (fc <= 100) {
    estado = "normal";
    interpretacion = "Normal";
  } else {
    estado = "alto";
    interpretacion = "Taquicardia";
  }
  return {
    id: "frecuenciaCardiaca",
    etiqueta: "Frecuencia cardiaca",
    valor: fc,
    unidad: "lpm",
    estado,
    interpretacion,
    rangoNormal: "60–100 lpm",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 1",
    observaciones: "Cribado oportunista de FA ≥65 años (pulso irregular → ECG).",
  };
}

export function evaluarColesterolTotal(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "colesterolTotal", etiqueta: "Colesterol total", valor: null, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Cardiovascular, sección 2" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 200) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (valor < 240) {
    estado = "alto";
    interpretacion = "Límite";
  } else {
    estado = "muy-alto";
    interpretacion = "Alto";
  }
  return {
    id: "colesterolTotal",
    etiqueta: "Colesterol total",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion,
    rangoNormal: "< 200 mg/dl",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 2",
    observaciones: "Interpretar siempre junto al perfil lipídico completo.",
  };
}

export function evaluarCLDL(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "cldl", etiqueta: "cLDL", valor: null, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Cardiovascular, sección 2" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 100) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (valor < 160) {
    estado = "alto";
    interpretacion = "Elevado";
  } else {
    estado = "muy-alto";
    interpretacion = valor >= 190 ? "Muy alto" : "Alto";
  }
  return {
    id: "cldl",
    etiqueta: "cLDL",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion,
    rangoNormal: "Objetivo < 70 mg/dl en RV muy alto/prevención 2ª",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 2",
    observaciones: "Objetivo terapéutico principal en riesgo vascular alto/muy alto.",
  };
}

export function evaluarCHDL(valor: number | null, sexo: Sexo | null): ResultadoCampo {
  if (valor == null || sexo == null) {
    return { id: "chdl", etiqueta: "cHDL", valor, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Cardiovascular, sección 2" };
  }
  const umbralBajo = sexo === "H" ? 40 : 50;
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < umbralBajo) {
    estado = "alto";
    interpretacion = "Factor de riesgo (bajo)";
  } else if (valor >= 60) {
    estado = "normal";
    interpretacion = "Protector — resta un factor de riesgo";
  } else {
    estado = "normal";
    interpretacion = "Normal";
  }
  return {
    id: "chdl",
    etiqueta: "cHDL",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion,
    rangoNormal: sexo === "H" ? "≥ 40 mg/dl (hombre)" : "≥ 50 mg/dl (mujer)",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 2",
  };
}

export function evaluarTrigliceridos(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "trigliceridos", etiqueta: "Triglicéridos", valor: null, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Cardiovascular, sección 2" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 150) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (valor < 200) {
    estado = "alto";
    interpretacion = "Límite";
  } else if (valor < 500) {
    estado = "alto";
    interpretacion = "Elevado";
  } else {
    estado = "muy-alto";
    interpretacion = "Riesgo de pancreatitis";
  }
  return {
    id: "trigliceridos",
    etiqueta: "Triglicéridos",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion,
    rangoNormal: "< 150 mg/dl",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 2",
    observaciones: "Requiere ayuno de 9-12h.",
  };
}

export function evaluarNTProBNP(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "ntProBnp", etiqueta: "NT-proBNP", valor: null, unidad: "pg/ml", estado: "sin-datos", fuente: "CRHOMA — Dominio Cardiovascular, sección 2" };
  }
  const estado: EstadoSemaforo = valor < 125 ? "normal" : "alto";
  return {
    id: "ntProBnp",
    etiqueta: "NT-proBNP",
    valor,
    unidad: "pg/ml",
    estado,
    interpretacion: valor < 125 ? "Normal (<75 años, no agudo)" : "Elevado — sospecha de insuficiencia cardiaca si hay disnea/edemas",
    rangoNormal: "< 125 pg/ml",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 2",
    observaciones: "Ajustar por edad y FGe; solicitar si sospecha de IC en CKM ≥2.",
  };
}

export function evaluarLpA(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "lpA", etiqueta: "Lp(a)", valor: null, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Cardiovascular, sección 2" };
  }
  const estado: EstadoSemaforo = valor >= 50 ? "alto" : "normal";
  return {
    id: "lpA",
    etiqueta: "Lp(a)",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion: estado === "alto" ? "Riesgo aumentado" : "Normal",
    rangoNormal: "< 30 mg/dl (~<75 nmol/l)",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 2",
    observaciones: "Determinación única en la vida.",
  };
}

// ---------------------------------------------------------------------------
// Cuestionario de Edimburgo de Claudicación (ECQ)
// Fuente: CRHOMA — Dominio Cardiovascular, sección 4
// ---------------------------------------------------------------------------
export interface RespuestasECQ {
  q1DolorAlCaminar: boolean | null;
  q2ApareceEnReposo: boolean | null;
  q3ApareceAlSubirCuesta: boolean | null;
  q4ApareceEnLlano: boolean | null;
  q5DesaparaceEnReposo: boolean | null;
  q6Localizacion: "PANTORRILLA" | "MUSLO_GLUTEO" | "OTRA" | null;
}

export function evaluarECQ(r: RespuestasECQ): ResultadoCampo {
  const faltan =
    r.q1DolorAlCaminar == null ||
    r.q2ApareceEnReposo == null ||
    r.q3ApareceAlSubirCuesta == null;

  if (faltan) {
    return {
      id: "ecq",
      etiqueta: "Cuestionario de Edimburgo (ECQ)",
      valor: null,
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Cardiovascular, sección 4",
    };
  }

  function resultado(valor: string, estado: EstadoSemaforo, interpretacion: string): ResultadoCampo {
    return {
      id: "ecq",
      etiqueta: "Cuestionario de Edimburgo (ECQ)",
      valor,
      estado,
      interpretacion,
      entradas: [
        { etiqueta: "Q1 dolor al caminar", valor: r.q1DolorAlCaminar ? "Sí" : "No" },
        { etiqueta: "Q2 aparece en reposo", valor: r.q2ApareceEnReposo ? "Sí" : "No" },
        { etiqueta: "Q3 aparece al subir cuesta", valor: r.q3ApareceAlSubirCuesta ? "Sí" : "No" },
        { etiqueta: "Q4 aparece en llano", valor: r.q4ApareceEnLlano == null ? "—" : r.q4ApareceEnLlano ? "Sí" : "No" },
        { etiqueta: "Q5 desaparece en reposo <10min", valor: r.q5DesaparaceEnReposo == null ? "—" : r.q5DesaparaceEnReposo ? "Sí" : "No" },
        { etiqueta: "Q6 localización", valor: r.q6Localizacion ?? "—" },
      ],
      fuente: "CRHOMA — Dominio Cardiovascular, sección 4",
      observaciones: "Alta especificidad pero sensibilidad variable (baja en diabéticos). Un negativo no descarta EAP: confirmar con ITB ante sospecha clínica.",
    };
  }

  if (!r.q1DolorAlCaminar) return resultado("Negativo", "normal", "Bajo riesgo — sin sospecha por cuestionario");
  if (r.q2ApareceEnReposo) return resultado("Negativo", "normal", "No vascular (aparece en reposo)");
  if (!r.q3ApareceAlSubirCuesta) return resultado("Negativo", "normal", "Bajo riesgo — sin sospecha por cuestionario");

  const grado = r.q4ApareceEnLlano ? 2 : 1;

  if (r.q5DesaparaceEnReposo == null) {
    return resultado(`Definida grado ${grado} (pendiente Q5/Q6)`, "alto", "Completar Q5 y Q6 para confirmar");
  }
  if (!r.q5DesaparaceEnReposo) return resultado("Negativo", "normal", "No típica (no desaparece en <10 min)");

  if (r.q6Localizacion === "PANTORRILLA") {
    return grado === 2
      ? resultado("Definida grado 2", "muy-alto", "Muy alto riesgo — derivar a valoración vascular con ITB/eco-Doppler")
      : resultado("Definida grado 1", "alto", "Alto riesgo — confirmar con ITB");
  }
  if (r.q6Localizacion === "MUSLO_GLUTEO") {
    return resultado("Atípica", "alto", "Riesgo moderado — explorar + ITB");
  }
  return resultado("Negativo", "normal", "Localización no compatible");
}

// ---------------------------------------------------------------------------
// ITB + morfología Doppler → recomendación de terapia compresiva
// Fuente: CRHOMA — Dominio Cardiovascular, sección 3
// ---------------------------------------------------------------------------
export function evaluarTerapiaCompresiva(
  itb: number | null,
  morfologia: "TRIFASICA" | "BIFASICA" | "MONOFASICA" | "ONDA_VARIABLE" | null
): ResultadoCampo {
  if (itb == null) {
    return {
      id: "terapiaCompresiva",
      etiqueta: "Terapia compresiva recomendada",
      valor: null,
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Cardiovascular, sección 3",
    };
  }

  let valor: string;
  let estado: EstadoSemaforo;
  let interpretacion: string;
  let rangoNormal: string;

  if (itb > 1.3) {
    valor = "No decidir solo con ITB";
    estado = "alto";
    interpretacion = "Vasos no compresibles (calcificación) — no descarta EAP";
    rangoNormal = "Solicitar IDB/TBI o eco-Doppler";
  } else if (itb >= 1.0) {
    valor = "Compresión terapéutica completa";
    estado = "normal";
    interpretacion = "Flujo arterial normal";
    rangoNormal = "35-40 mmHg (40 en multicapa si úlcera venosa)";
  } else if (itb >= 0.91) {
    valor = "Compresión terapéutica completa";
    estado = "normal";
    interpretacion = "Flujo conservado, límite inferior de la normalidad";
    rangoNormal = "30-40 mmHg";
  } else if (itb >= 0.8) {
    valor = "Compresión moderada";
    estado = "alto";
    interpretacion = "EAP leve";
    rangoNormal = "20-30 mmHg";
  } else if (itb >= 0.6) {
    valor = "Compresión modificada (con precaución)";
    estado = "muy-alto";
    interpretacion = "EAP moderada — solo bajo supervisión especializada";
    rangoNormal = "20-30 mmHg (<40)";
  } else {
    valor = "Contraindicada la compresión sostenida";
    estado = "muy-alto";
    interpretacion = "EAP grave, alto riesgo de isquemia crítica";
    rangoNormal = "No aplicar";
  }

  return {
    id: "terapiaCompresiva",
    etiqueta: "Terapia compresiva recomendada",
    valor,
    estado,
    interpretacion,
    entradas: [
      { etiqueta: "ITB", valor: itb },
      { etiqueta: "Morfología Doppler", valor: morfologia ?? "No registrada" },
    ],
    rangoNormal,
    fuente: "CRHOMA — Dominio Cardiovascular, sección 3 (ESVS 2022, WOCN, SVS/AVF)",
    observaciones: "En diabéticos o ERC, un ITB >1,30 suele indicar calcificación de la media arterial y no excluye EAP.",
  };
}

// =============================================================================
// DOMINIO RENAL (resto del panel — FGe/CAC/KDIGO ya están más arriba)
// =============================================================================

export function evaluarCreatinina(valor: number | null, sexo: Sexo | null): ResultadoCampo {
  if (valor == null || sexo == null) {
    return { id: "creatinina", etiqueta: "Creatinina", valor, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Renal, sección 2" };
  }
  const [min, max] = sexo === "H" ? [0.7, 1.3] : [0.6, 1.1];
  const estado: EstadoSemaforo = valor >= min && valor <= max ? "normal" : "alto";
  return {
    id: "creatinina",
    etiqueta: "Creatinina",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion: estado === "normal" ? "Normal" : "Por encima del rango del laboratorio",
    rangoNormal: sexo === "H" ? "0,7-1,3 mg/dl" : "0,6-1,1 mg/dl",
    fuente: "CRHOMA — Dominio Renal, sección 2",
    observaciones: "Interpretar siempre junto al FGe, nunca de forma aislada.",
  };
}

export function evaluarPotasio(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "potasio", etiqueta: "Potasio (K+)", valor: null, unidad: "mEq/l", estado: "sin-datos", fuente: "CRHOMA — Dominio Renal, sección 2" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 3.5) {
    estado = "bajo";
    interpretacion = "Hipopotasemia";
  } else if (valor <= 5.0) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (valor <= 5.5) {
    estado = "alto";
    interpretacion = "Límite alto — vigilar";
  } else {
    estado = "muy-alto";
    interpretacion = "Hiperpotasemia — riesgo con IECA/ARA-II/ARM";
  }
  return {
    id: "potasio",
    etiqueta: "Potasio (K+)",
    valor,
    unidad: "mEq/l",
    estado,
    interpretacion,
    rangoNormal: "3,5-5,0 mEq/l",
    fuente: "CRHOMA — Dominio Renal, sección 2",
    observaciones: "Monitorizar tras inicio/ajuste de IECA/ARA-II/ARM, sobre todo si FGe <45.",
  };
}

export function evaluarBicarbonato(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "bicarbonato", etiqueta: "Bicarbonato sérico", valor: null, unidad: "mmol/l", estado: "sin-datos", fuente: "CRHOMA — Dominio Renal, sección 2" };
  }
  const estado: EstadoSemaforo = valor < 22 ? "alto" : "normal";
  return {
    id: "bicarbonato",
    etiqueta: "Bicarbonato sérico",
    valor,
    unidad: "mmol/l",
    estado,
    interpretacion: estado === "alto" ? "Acidosis metabólica" : "Normal",
    rangoNormal: "22-26 mmol/l",
    fuente: "CRHOMA — Dominio Renal, sección 2",
    observaciones: "Solicitar si FGe <45; la acidosis acelera la progresión de ERC.",
  };
}

export function evaluarPTH(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "pth", etiqueta: "PTH intacta", valor: null, unidad: "pg/ml", estado: "sin-datos", fuente: "CRHOMA — Dominio Renal, sección 2" };
  }
  return {
    id: "pth",
    etiqueta: "PTH intacta",
    valor,
    unidad: "pg/ml",
    estado: "normal",
    interpretacion: "Valorar según rango del laboratorio",
    fuente: "CRHOMA — Dominio Renal, sección 2",
    observaciones: "Puede estar elevada en ERC avanzada (hiperparatiroidismo secundario). Solicitar si FGe <45.",
  };
}

export function evaluarVitaminaDRenal(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "vitaminaD", etiqueta: "Vitamina D (25-OH)", valor: null, unidad: "ng/ml", estado: "sin-datos", fuente: "CRHOMA — Dominio Renal, sección 2" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 20) {
    estado = "alto";
    interpretacion = "Déficit";
  } else if (valor < 30) {
    estado = "alto";
    interpretacion = "Insuficiencia";
  } else {
    estado = "normal";
    interpretacion = "Normal";
  }
  return {
    id: "vitaminaD",
    etiqueta: "Vitamina D (25-OH)",
    valor,
    unidad: "ng/ml",
    estado,
    interpretacion,
    rangoNormal: "30-100 ng/ml",
    fuente: "CRHOMA — Dominio Renal, sección 2",
    observaciones: "Solicitar si FGe <45; relevante en el metabolismo óseo-mineral.",
  };
}

// =============================================================================
// DOMINIO HEPÁTICO (resto del panel — ALT/AST/FIB-4 ya están más arriba)
// =============================================================================

export function evaluarGGT(valor: number | null, sexo: Sexo | null): ResultadoCampo {
  if (valor == null || sexo == null) {
    return { id: "ggt", etiqueta: "GGT", valor, unidad: "U/l", estado: "sin-datos", fuente: "CRHOMA — Dominio Hepático, sección 2" };
  }
  const max = sexo === "H" ? 61 : 36;
  const estado: EstadoSemaforo = valor <= max ? "normal" : "alto";
  return {
    id: "ggt",
    etiqueta: "GGT",
    valor,
    unidad: "U/l",
    estado,
    interpretacion: estado === "normal" ? "Normal" : "Por encima del rango del laboratorio",
    rangoNormal: sexo === "H" ? "8-61 U/l (hombre)" : "5-36 U/l (mujer)",
    fuente: "CRHOMA — Dominio Hepático, sección 2",
    observaciones: "Marcador de colestasis/consumo de alcohol; apoya el diagnóstico diferencial.",
  };
}

export function evaluarElastografia(lsmKpa: number | null): ResultadoCampo {
  if (lsmKpa == null) {
    return { id: "lsmKpa", etiqueta: "Elastografía (LSM)", valor: null, unidad: "kPa", estado: "sin-datos", fuente: "CRHOMA — Dominio Hepático, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (lsmKpa < 8) {
    estado = "normal";
    interpretacion = "Bajo riesgo";
  } else if (lsmKpa < 12) {
    estado = "alto";
    interpretacion = "Indeterminado";
  } else {
    estado = "muy-alto";
    interpretacion = "Alta probabilidad de fibrosis avanzada/cirrosis";
  }
  return {
    id: "lsmKpa",
    etiqueta: "Elastografía (LSM)",
    valor: lsmKpa,
    unidad: "kPa",
    estado,
    interpretacion,
    rangoNormal: "< 8 kPa",
    fuente: "CRHOMA — Dominio Hepático, sección 1",
    observaciones: "Se solicita si FIB-4 intermedio/alto.",
  };
}

export function evaluarCAP(capDbM: number | null): ResultadoCampo {
  if (capDbM == null) {
    return { id: "capDbM", etiqueta: "CAP (esteatosis)", valor: null, unidad: "dB/m", estado: "sin-datos", fuente: "CRHOMA — Dominio Hepático, sección 1" };
  }
  const estado: EstadoSemaforo = capDbM < 275 ? "normal" : "alto";
  return {
    id: "capDbM",
    etiqueta: "CAP (esteatosis)",
    valor: capDbM,
    unidad: "dB/m",
    estado,
    interpretacion: estado === "normal" ? "Sin esteatosis significativa" : "Esteatosis presente",
    rangoNormal: "< 275 dB/m",
    fuente: "CRHOMA — Dominio Hepático, sección 1",
  };
}

export function evaluarBilirrubina(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "bilirrubinaTotal", etiqueta: "Bilirrubina total", valor: null, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Hepático, sección 2" };
  }
  const estado: EstadoSemaforo = valor <= 1.2 ? "normal" : "alto";
  return {
    id: "bilirrubinaTotal",
    etiqueta: "Bilirrubina total",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion: estado === "normal" ? "Normal" : "Elevada — enfermedad hepática avanzada/colestasis",
    rangoNormal: "0,3-1,2 mg/dl",
    fuente: "CRHOMA — Dominio Hepático, sección 2",
  };
}

export function evaluarAlbuminaSerica(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "albuminaSerica", etiqueta: "Albúmina sérica", valor: null, unidad: "g/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Hepático, sección 2" };
  }
  const estado: EstadoSemaforo = valor < 3.5 ? "alto" : "normal";
  return {
    id: "albuminaSerica",
    etiqueta: "Albúmina sérica",
    valor,
    unidad: "g/dl",
    estado,
    interpretacion: estado === "alto" ? "Hipoalbuminemia" : "Normal",
    rangoNormal: "3,5-5,0 g/dl",
    fuente: "CRHOMA — Dominio Hepático, sección 2",
    observaciones: "Marcador de función de síntesis hepática; baja en hepatopatía descompensada.",
  };
}

export function evaluarINR(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "inr", etiqueta: "INR", valor: null, estado: "sin-datos", fuente: "CRHOMA — Dominio Hepático, sección 2" };
  }
  const estado: EstadoSemaforo = valor <= 1.1 ? "normal" : "alto";
  return {
    id: "inr",
    etiqueta: "INR",
    valor,
    estado,
    interpretacion: estado === "normal" ? "Normal" : "Prolongado — sugiere disfunción de síntesis hepática",
    rangoNormal: "0,8-1,1",
    fuente: "CRHOMA — Dominio Hepático, sección 2",
  };
}

// =============================================================================
// DOMINIO OBESIDAD (resto — IMC/perímetro cintura/ICA ya están más arriba)
// =============================================================================

export function calcularICC(cinturaCm: number | null, caderaCm: number | null, sexo: Sexo | null): ResultadoCampo {
  if (cinturaCm == null || caderaCm == null || caderaCm <= 0 || sexo == null) {
    return {
      id: "icc",
      etiqueta: "Índice cintura-cadera (ICC)",
      valor: null,
      estado: "sin-datos",
      formula: "ICC = Perímetro de cintura (cm) ÷ Perímetro de cadera (cm)",
      fuente: "CRHOMA — Dominio Obesidad, sección 4",
      observaciones: "Faltan el perímetro de cintura, cadera y/o el sexo.",
    };
  }
  const icc = cinturaCm / caderaCm;
  const redondeado = Math.round(icc * 100) / 100;
  const umbral = sexo === "H" ? 0.9 : 0.85;
  const estado: EstadoSemaforo = icc >= umbral ? "alto" : "normal";
  return {
    id: "icc",
    etiqueta: "Índice cintura-cadera (ICC)",
    valor: redondeado,
    estado,
    interpretacion: estado === "alto" ? "Patrón androide — riesgo cardiometabólico alto" : "Distribución ginecoide — menor riesgo",
    formula: "ICC = Perímetro de cintura (cm) ÷ Perímetro de cadera (cm)",
    entradas: [
      { etiqueta: "Perímetro de cintura", valor: cinturaCm, unidad: "cm" },
      { etiqueta: "Perímetro de cadera", valor: caderaCm, unidad: "cm" },
    ],
    rangoNormal: sexo === "H" ? "< 0,90 (hombre)" : "< 0,85 (mujer)",
    fuente: "CRHOMA — Dominio Obesidad, sección 4 (OMS)",
  };
}

export function evaluarEOSS(estadio: number | null): ResultadoCampo {
  if (estadio == null) {
    return { id: "eoss", etiqueta: "Estadio EOSS", valor: null, estado: "sin-datos", fuente: "CRHOMA — Dominio Obesidad, sección 5" };
  }
  const textos = [
    "Sin comorbilidad ni limitación funcional",
    "Factores de riesgo subclínicos; limitación funcional leve",
    "Comorbilidad establecida; limitación funcional moderada",
    "Daño de órgano diana; psicopatología/limitación significativa",
    "Discapacidad grave/potencialmente terminal",
  ];
  const estado: EstadoSemaforo = estadio === 0 ? "normal" : estadio <= 1 ? "bajo" : estadio <= 3 ? "alto" : "muy-alto";
  return {
    id: "eoss",
    etiqueta: "Estadio EOSS",
    valor: `Estadio ${estadio}`,
    estado,
    interpretacion: textos[estadio] ?? "",
    fuente: "CRHOMA — Dominio Obesidad, sección 5 (Edmonton Obesity Staging System)",
    observaciones: "Aporta más valor pronóstico que el IMC aislado.",
  };
}

export function evaluarSTOPBANG(puntuacion: number | null): ResultadoCampo {
  if (puntuacion == null) {
    return { id: "stopBang", etiqueta: "STOP-BANG", valor: null, estado: "sin-datos", fuente: "CRHOMA — Dominio Obesidad, sección 6" };
  }
  const estado: EstadoSemaforo = puntuacion >= 3 ? "alto" : "normal";
  return {
    id: "stopBang",
    etiqueta: "STOP-BANG",
    valor: puntuacion,
    unidad: "/8",
    estado,
    interpretacion: estado === "alto" ? "Riesgo intermedio-alto de SAOS — valorar polisomnografía" : "Bajo riesgo",
    rangoNormal: "< 3 puntos",
    fuente: "CRHOMA — Dominio Obesidad, sección 6",
    observaciones: "Realizar en obesidad grado ≥II, o antes de tratamiento intensivo.",
  };
}

export function evaluarTCA(sospecha: boolean | null): ResultadoCampo {
  if (sospecha == null) {
    return { id: "sospechaTCA", etiqueta: "Sospecha de TCA", valor: null, estado: "sin-datos", fuente: "CRHOMA — Dominio Obesidad, sección 6" };
  }
  return {
    id: "sospechaTCA",
    etiqueta: "Sospecha de TCA",
    valor: sospecha ? "Sí" : "No",
    estado: sospecha ? "muy-alto" : "normal",
    interpretacion: sospecha
      ? "Derivar a Salud Mental/Nutrición especializada ANTES de intensificar tratamiento del peso"
      : "Sin sospecha",
    fuente: "CRHOMA — Dominio Obesidad, sección 6",
  };
}

// =============================================================================
// DOMINIO METABÓLICO (resto — HbA1c/objetivo/riesgo pie ya están más arriba)
// =============================================================================

export function evaluarGlucemiaBasal(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "glucemiaBasal", etiqueta: "Glucemia basal", valor: null, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Metabólico, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 70) {
    estado = "bajo";
    interpretacion = "Hipoglucemia";
  } else if (valor < 100) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (valor < 126) {
    estado = "alto";
    interpretacion = "Glucemia basal alterada (GBA)";
  } else {
    estado = "muy-alto";
    interpretacion = "Diabetes (confirmar en 2ª determinación)";
  }
  return {
    id: "glucemiaBasal",
    etiqueta: "Glucemia basal",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion,
    rangoNormal: "70-99 mg/dl",
    fuente: "CRHOMA — Dominio Metabólico, sección 1",
  };
}

export function evaluarTSH(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "tsh", etiqueta: "TSH", valor: null, unidad: "mUI/l", estado: "sin-datos", fuente: "CRHOMA — Dominio Metabólico, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 0.4) {
    estado = "alto";
    interpretacion = "Hipertiroidismo";
  } else if (valor <= 4.0) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (valor <= 10) {
    estado = "alto";
    interpretacion = "Hipotiroidismo subclínico";
  } else {
    estado = "muy-alto";
    interpretacion = "Hipotiroidismo franco";
  }
  return {
    id: "tsh",
    etiqueta: "TSH",
    valor,
    unidad: "mUI/l",
    estado,
    interpretacion,
    rangoNormal: "0,4-4,0 mUI/l",
    fuente: "CRHOMA — Dominio Metabólico, sección 1",
  };
}

export function evaluarSOG(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "sogGlucemia2h", etiqueta: "SOG (glucemia a las 2h)", valor: null, unidad: "mg/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Metabólico, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 140) {
    estado = "normal";
    interpretacion = "Normal";
  } else if (valor < 200) {
    estado = "alto";
    interpretacion = "Intolerancia a la glucosa";
  } else {
    estado = "muy-alto";
    interpretacion = "Diabetes";
  }
  return {
    id: "sogGlucemia2h",
    etiqueta: "SOG (glucemia a las 2h)",
    valor,
    unidad: "mg/dl",
    estado,
    interpretacion,
    rangoNormal: "< 140 mg/dl",
    fuente: "CRHOMA — Dominio Metabólico, sección 1",
    observaciones: "Sobrecarga oral con 75g de glucosa; obligatoria en cribado de diabetes gestacional (24-28 semanas).",
  };
}

export interface DatosSindromeMetabolico {
  cinturaCm: number | null;
  sexo: Sexo | null;
  trigliceridos: number | null;
  cHDL: number | null;
  pas: number | null;
  pad: number | null;
  glucemiaBasal: number | null;
}

export function evaluarSindromeMetabolico(d: DatosSindromeMetabolico): ResultadoCampo {
  const disponibles = [
    d.cinturaCm != null && d.sexo != null,
    d.trigliceridos != null,
    d.cHDL != null && d.sexo != null,
    d.pas != null || d.pad != null,
    d.glucemiaBasal != null,
  ];
  if (disponibles.every((v) => !v)) {
    return {
      id: "sindromeMetabolico",
      etiqueta: "Síndrome metabólico",
      valor: null,
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Metabólico, sección 4 (ATP-III/IDF)",
      observaciones: "Requiere al menos algunos de: perímetro cintura, TG, cHDL, PA, glucemia basal.",
    };
  }

  const criterios: EntradaUsada[] = [];
  let cumplidos = 0;
  let evaluados = 0;

  if (d.cinturaCm != null && d.sexo != null) {
    evaluados++;
    const umbral = d.sexo === "H" ? 94 : 80;
    const cumple = d.cinturaCm >= umbral;
    if (cumple) cumplidos++;
    criterios.push({ etiqueta: "Perímetro de cintura aumentado", valor: cumple ? "Sí" : "No" });
  }
  if (d.trigliceridos != null) {
    evaluados++;
    const cumple = d.trigliceridos >= 150;
    if (cumple) cumplidos++;
    criterios.push({ etiqueta: "Triglicéridos ≥150", valor: cumple ? "Sí" : "No" });
  }
  if (d.cHDL != null && d.sexo != null) {
    evaluados++;
    const umbral = d.sexo === "H" ? 40 : 50;
    const cumple = d.cHDL < umbral;
    if (cumple) cumplidos++;
    criterios.push({ etiqueta: "cHDL bajo", valor: cumple ? "Sí" : "No" });
  }
  if (d.pas != null || d.pad != null) {
    evaluados++;
    const cumple = (d.pas ?? 0) >= 130 || (d.pad ?? 0) >= 85;
    if (cumple) cumplidos++;
    criterios.push({ etiqueta: "PA ≥130/85", valor: cumple ? "Sí" : "No" });
  }
  if (d.glucemiaBasal != null) {
    evaluados++;
    const cumple = d.glucemiaBasal >= 100;
    if (cumple) cumplidos++;
    criterios.push({ etiqueta: "Glucemia basal ≥100", valor: cumple ? "Sí" : "No" });
  }

  const completo = evaluados === 5;
  const cumpleSindrome = cumplidos >= 3;

  return {
    id: "sindromeMetabolico",
    etiqueta: "Síndrome metabólico",
    valor: cumpleSindrome ? "Sí" : "No",
    estado: cumpleSindrome ? "alto" : "normal",
    interpretacion: `${cumplidos} de ${evaluados} criterios evaluados cumplidos${completo ? "" : " (panel incompleto)"}`,
    entradas: criterios,
    rangoNormal: "≥3 de 5 criterios (ATP-III/IDF armonizados)",
    fuente: "CRHOMA — Dominio Metabólico, sección 4",
    observaciones: completo ? undefined : "Panel incompleto: faltan datos de alguno de los 5 criterios; el resultado puede cambiar al completarlos.",
  };
}

// =============================================================================
// DOMINIO ANEMIA
// =============================================================================

export function evaluarHb(valor: number | null, sexo: Sexo | null): ResultadoCampo {
  if (valor == null || sexo == null) {
    return { id: "hb", etiqueta: "Hemoglobina (Hb)", valor, unidad: "g/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  const umbral = sexo === "H" ? 13 : 12;
  const estado: EstadoSemaforo = valor < umbral ? "muy-alto" : "normal";
  return {
    id: "hb",
    etiqueta: "Hemoglobina (Hb)",
    valor,
    unidad: "g/dl",
    estado,
    interpretacion: estado === "muy-alto" ? "Anemia (criterio OMS)" : "Normal",
    rangoNormal: sexo === "H" ? "13-17 g/dl (hombre)" : "12-15,5 g/dl (mujer)",
    fuente: "CRHOMA — Dominio Anemia, sección 1-2 (OMS)",
    observaciones: "En gestante, el umbral es <11 g/dl (1er/3er trimestre) o <10,5 g/dl (2º trimestre).",
  };
}

export function evaluarVCM(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "vcm", etiqueta: "VCM", valor: null, unidad: "fL", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 80) {
    estado = "alto";
    interpretacion = "Microcítica";
  } else if (valor <= 100) {
    estado = "normal";
    interpretacion = "Normocítica";
  } else {
    estado = "alto";
    interpretacion = "Macrocítica";
  }
  return {
    id: "vcm",
    etiqueta: "VCM",
    valor,
    unidad: "fL",
    estado,
    interpretacion,
    rangoNormal: "80-100 fL",
    fuente: "CRHOMA — Dominio Anemia, sección 3",
  };
}

export function evaluarHCM(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "hcm", etiqueta: "HCM", valor: null, unidad: "pg", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  const estado: EstadoSemaforo = valor < 27 ? "alto" : valor > 33 ? "alto" : "normal";
  return {
    id: "hcm",
    etiqueta: "HCM",
    valor,
    unidad: "pg",
    estado,
    interpretacion: valor < 27 ? "Hipocromía" : valor > 33 ? "Hipercromía" : "Normal",
    rangoNormal: "27-33 pg",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
  };
}

export function evaluarCHCM(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "chcm", etiqueta: "CHCM", valor: null, unidad: "g/dl", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  const estado: EstadoSemaforo = valor < 32 ? "alto" : valor > 36 ? "alto" : "normal";
  return {
    id: "chcm",
    etiqueta: "CHCM",
    valor,
    unidad: "g/dl",
    estado,
    interpretacion: valor < 32 ? "Hipocromía" : valor > 36 ? "Esferocitosis hereditaria (valorar artefacto)" : "Normal",
    rangoNormal: "32-36 g/dl",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
  };
}

export function evaluarPlaquetasAnemia(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "plaquetasAnemia", etiqueta: "Plaquetas", valor: null, unidad: "×10⁹/l", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 150) {
    estado = "muy-alto";
    interpretacion = "Trombocitopenia — valorar hiperesplenismo/fallo medular";
  } else if (valor <= 450) {
    estado = "normal";
    interpretacion = "Normal";
  } else {
    estado = "alto";
    interpretacion = "Trombocitosis — frecuente de forma reactiva en la ferropenia";
  }
  return {
    id: "plaquetasAnemia",
    etiqueta: "Plaquetas",
    valor,
    unidad: "×10⁹/l",
    estado,
    interpretacion,
    rangoNormal: "150-450 ×10⁹/l",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
    observaciones: "Mismo valor que en el panel hepático (FIB-4), interpretado aquí desde la óptica hematológica.",
  };
}

export function evaluarFerritinaAnemia(valor: number | null, sexo: Sexo | null): ResultadoCampo {
  if (valor == null || sexo == null) {
    return { id: "ferritina", etiqueta: "Ferritina", valor, unidad: "ng/ml", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  const [min, max] = sexo === "H" ? [30, 400] : [15, 150];
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 30) {
    estado = "muy-alto";
    interpretacion = "Déficit de hierro";
  } else if (valor > max) {
    estado = "alto";
    interpretacion = "Elevada — descartar hemocromatosis/inflamación";
  } else {
    estado = "normal";
    interpretacion = "Normal";
  }
  return {
    id: "ferritina",
    etiqueta: "Ferritina",
    valor,
    unidad: "ng/ml",
    estado,
    interpretacion,
    rangoNormal: `${min}-${max} ng/ml`,
    fuente: "CRHOMA — Dominio Anemia, sección 1",
    observaciones: "En ERC, deficiencia absoluta si <100 ng/ml con IST <20%. Reactante de fase aguda: valorar junto a PCR.",
  };
}

export function evaluarIST(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "ist", etiqueta: "Índice de saturación de transferrina (IST)", valor: null, unidad: "%", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 20) {
    estado = "muy-alto";
    interpretacion = "Ferropenia (absoluta o funcional según ferritina)";
  } else if (valor <= 50) {
    estado = "normal";
    interpretacion = "Normal";
  } else {
    estado = "alto";
    interpretacion = "Sobrecarga férrica";
  }
  return {
    id: "ist",
    etiqueta: "Índice de saturación de transferrina (IST)",
    valor,
    unidad: "%",
    estado,
    interpretacion,
    rangoNormal: "20-50%",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
  };
}

export function evaluarVitaminaB12(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "vitaminaB12", etiqueta: "Vitamina B12", valor: null, unidad: "pg/ml", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 200) {
    estado = "alto";
    interpretacion = "Déficit";
  } else if (valor <= 300) {
    estado = "alto";
    interpretacion = "Límite — valorar ácido metilmalónico/homocisteína";
  } else {
    estado = "normal";
    interpretacion = "Normal";
  }
  return {
    id: "vitaminaB12",
    etiqueta: "Vitamina B12",
    valor,
    unidad: "pg/ml",
    estado,
    interpretacion,
    rangoNormal: "200-900 pg/ml",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
    observaciones: "Solicitar ante anemia macrocítica o clínica neurológica sugestiva.",
  };
}

export function evaluarAcidoFolico(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "acidoFolico", etiqueta: "Ácido fólico", valor: null, unidad: "ng/ml", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  const estado: EstadoSemaforo = valor < 4 ? "alto" : "normal";
  return {
    id: "acidoFolico",
    etiqueta: "Ácido fólico",
    valor,
    unidad: "ng/ml",
    estado,
    interpretacion: estado === "alto" ? "Déficit" : "Normal",
    rangoNormal: "> 4 ng/ml",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
    observaciones: "Solicitar ante anemia macrocítica.",
  };
}

export function evaluarReticulocitos(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "reticulocitos", etiqueta: "Reticulocitos", valor: null, unidad: "%", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (valor < 0.5) {
    estado = "alto";
    interpretacion = "Respuesta medular inadecuada (arregenerativa)";
  } else if (valor <= 2.5) {
    estado = "normal";
    interpretacion = "Normal";
  } else {
    estado = "alto";
    interpretacion = "Respuesta regenerativa (hemólisis, sangrado agudo)";
  }
  return {
    id: "reticulocitos",
    etiqueta: "Reticulocitos",
    valor,
    unidad: "%",
    estado,
    interpretacion,
    rangoNormal: "0,5-2,5%",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
    observaciones: "Solicitar ante anemia de causa no aclarada.",
  };
}

export function evaluarPCRAnemia(valor: number | null): ResultadoCampo {
  if (valor == null) {
    return { id: "pcr", etiqueta: "PCR", valor: null, unidad: "mg/l", estado: "sin-datos", fuente: "CRHOMA — Dominio Anemia, sección 1" };
  }
  const estado: EstadoSemaforo = valor < 5 ? "normal" : "alto";
  return {
    id: "pcr",
    etiqueta: "PCR",
    valor,
    unidad: "mg/l",
    estado,
    interpretacion: estado === "normal" ? "Normal" : "Elevada — sugiere anemia de trastorno crónico/inflamatorio",
    rangoNormal: "< 5 mg/l",
    fuente: "CRHOMA — Dominio Anemia, sección 1",
    observaciones: "Interfiere en la interpretación de la ferritina (reactante de fase aguda).",
  };
}

export function evaluarRiesgoCardiovascularGlobal(porcentaje: number | null): ResultadoCampo {
  if (porcentaje == null) {
    return {
      id: "riesgoScorePrevent",
      etiqueta: "Riesgo CV (SCORE2/PREVENT)",
      valor: null,
      unidad: "%",
      estado: "sin-datos",
      fuente: "CRHOMA — Dominio Cardiovascular, sección 6",
      observaciones: "Introducir el % a 10 años calculado con la calculadora externa de SCORE2 o PREVENT.",
    };
  }
  let estado: EstadoSemaforo;
  let interpretacion: string;
  if (porcentaje < 1) {
    estado = "normal";
    interpretacion = "Bajo — estilo de vida";
  } else if (porcentaje < 5) {
    estado = "normal";
    interpretacion = "Moderado — valorar intervención según FR acompañantes";
  } else if (porcentaje < 10) {
    estado = "alto";
    interpretacion = "Alto — intervención farmacológica activa";
  } else {
    estado = "muy-alto";
    interpretacion = "Muy alto — objetivos estrictos (cLDL <70, PA <130/80)";
  }
  return {
    id: "riesgoScorePrevent",
    etiqueta: "Riesgo CV (SCORE2/PREVENT)",
    valor: porcentaje,
    unidad: "%",
    estado,
    interpretacion,
    rangoNormal: "<1% bajo · 1-4% moderado · 5-9% alto · ≥10% muy alto",
    fuente: "CRHOMA — Dominio Cardiovascular, sección 6",
    observaciones:
      "Introducido a mano desde una calculadora externa (SCORE2 de uso habitual en el PAI-SAS; PREVENT recomendado por la guía CKM 2026). Enfermedad vascular establecida o diabetes con LOD clasifican directamente en riesgo alto/muy alto sin necesidad de calcular el score.",
  };
}

/* ============================================================
   ALIASES DE COMPATIBILIDAD
   ============================================================ */

/** Alias: evaluarControlGlucemico → evaluarObjetivoHbA1c */
export function evaluarControlGlucemico(
  hba1c: number | null,
  perfil: PerfilControlGlucemico = "GENERAL"
): ResultadoCampo {
  return evaluarObjetivoHbA1c(hba1c, perfil);
}

/** Alias: evaluarFGE → evaluarFGe (capitalización alternativa) */
export const evaluarFGE = evaluarFGe;

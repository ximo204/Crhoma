/**
 * Motor de cálculo y autocheck de complicaciones diabéticas
 * según los criterios oficiales del documento CODEAPA (págs. 11 a 14).
 */

import type {
  Complicaciones,
  ControlCardiovascular,
  ControlHepatico,
  ControlRenal,
  CribadoClaudicacion,
  ExploracionPie,
  Retinografia,
} from "@/generated/prisma";

export interface ComplicacionEvaluada {
  id: string;
  nombre: string;
  categoria: "MICROVASCULARES" | "MACROVASCULARES" | "PIE_DIABETICO" | "OTRAS";
  presente: boolean;
  origen: "calculado" | "manual";
  criterioClinico: string;
  motivoDetectado?: string;
}

export function evaluarComplicaciones({
  ultimaRetinografia,
  ultimoControlRenal,
  ultimaExploracionPie,
  ultimoControlCardiovascular,
  ultimoControlHepatico,
  ultimoCribadoClaudicacion,
  complicacionesGuardadas,
}: {
  ultimaRetinografia: Retinografia | null;
  ultimoControlRenal: ControlRenal | null;
  ultimaExploracionPie: ExploracionPie | null;
  ultimoControlCardiovascular: ControlCardiovascular | null;
  ultimoControlHepatico: ControlHepatico | null;
  ultimoCribadoClaudicacion: CribadoClaudicacion | null;
  complicacionesGuardadas: Complicaciones | null;
}): ComplicacionEvaluada[] {
  const lista: ComplicacionEvaluada[] = [];

  // 1. Retinopatía diabética
  const retinoPatologica = ultimaRetinografia?.resultado === "PATOLOGICA";
  const retinoGuardada = complicacionesGuardadas?.retinopatiaDiabetica ?? false;
  const retinoActiva = retinoPatologica || retinoGuardada;
  lista.push({
    id: "retinopatiaDiabetica",
    nombre: "Retinopatía diabética",
    categoria: "MICROVASCULARES",
    presente: retinoActiva,
    origen: retinoPatologica ? "calculado" : "manual",
    criterioClinico: "Cribado con fondo de ojo / retinografía patológica.",
    motivoDetectado: retinoPatologica
      ? "Detectada retinografía patológica en el último cribado."
      : retinoGuardada
      ? "Registrada manualmente en antecedentes."
      : undefined,
  });

  // 2. Nefropatía diabética (ERC)
  const fgeBajo = ultimoControlRenal?.fge != null && ultimoControlRenal.fge < 60;
  const cacAlto = ultimoControlRenal?.cac != null && ultimoControlRenal.cac >= 30;
  const ercCalculada = fgeBajo || cacAlto;
  const ercGuardada = complicacionesGuardadas?.nefropatiaDiabetica ?? false;
  const ercActiva = ercCalculada || ercGuardada;
  lista.push({
    id: "nefropatiaDiabetica",
    nombre: "Nefropatía diabética (ERC)",
    categoria: "MICROVASCULARES",
    presente: ercActiva,
    origen: ercCalculada ? "calculado" : "manual",
    criterioClinico: "FGe < 60 ml/min/1,73m² y/o CAC ≥ 30 mg/g.",
    motivoDetectado: fgeBajo && cacAlto
      ? `FGe alterado (${ultimoControlRenal?.fge} ml/min) y albuminuria CAC alterada (${ultimoControlRenal?.cac} mg/g).`
      : fgeBajo
      ? `FGe disminuido (${ultimoControlRenal?.fge} ml/min/1,73m²).`
      : cacAlto
      ? `Cociente Albúmina/Creatinina elevado (${ultimoControlRenal?.cac} mg/g).`
      : ercGuardada
      ? "Registrada manualmente en antecedentes."
      : undefined,
  });

  // 3. Neuropatía periférica
  const neuroAlterada =
    ultimaExploracionPie?.monofilamentoNormal === false ||
    ultimaExploracionPie?.diapasonNormal === false;
  const neuroGuardada = complicacionesGuardadas?.neuropatiaPeriferica ?? false;
  const neuroActiva = neuroAlterada || neuroGuardada;
  lista.push({
    id: "neuropatiaPeriferica",
    nombre: "Neuropatía periférica",
    categoria: "MICROVASCULARES",
    presente: neuroActiva,
    origen: neuroAlterada ? "calculado" : "manual",
    criterioClinico: "Monofilamento (10g) y/o diapasón (128Hz) alterados.",
    motivoDetectado: neuroAlterada
      ? `Exploración neurológica de pie alterada (${
          ultimaExploracionPie?.monofilamentoNormal === false ? "Monofilamento alterado" : ""
        }${
          ultimaExploracionPie?.monofilamentoNormal === false &&
          ultimaExploracionPie?.diapasonNormal === false
            ? ", "
            : ""
        }${ultimaExploracionPie?.diapasonNormal === false ? "Diapasón alterado" : ""}).`
      : neuroGuardada
      ? "Registrada manualmente en antecedentes."
      : undefined,
  });

  // 4. Cardiopatía isquémica
  const cardioGuardada = complicacionesGuardadas?.cardiopatiaIsquemica ?? false;
  lista.push({
    id: "cardiopatiaIsquemica",
    nombre: "Cardiopatía isquémica",
    categoria: "MACROVASCULARES",
    presente: cardioGuardada,
    origen: "manual",
    criterioClinico: "Antecedente de angina, infarto (IAM), angioplastia o cirugía coronaria.",
    motivoDetectado: cardioGuardada ? "Antecedente clínico confirmado." : undefined,
  });

  // 5. Enfermedad cerebrovascular
  const ictusGuardada = complicacionesGuardadas?.enfermedadCerebrovascular ?? false;
  lista.push({
    id: "enfermedadCerebrovascular",
    nombre: "Enfermedad cerebrovascular",
    categoria: "MACROVASCULARES",
    presente: ictusGuardada,
    origen: "manual",
    criterioClinico: "Antecedente de ictus (isquémico o hemorrágico), AIT o revascularización carotídea.",
    motivoDetectado: ictusGuardada ? "Antecedente clínico confirmado." : undefined,
  });

  // 6. Arteriopatía periférica
  const itbBajo = ultimaExploracionPie?.itb != null && ultimaExploracionPie.itb < 0.9;
  const eapPie = ultimaExploracionPie?.enfermedadArterialPeriferica === true;
  const claudicacionPositiva =
    ultimoCribadoClaudicacion?.q1DolorAlCaminar === true &&
    ultimoCribadoClaudicacion?.q2ApareceEnReposo === false &&
    ultimoCribadoClaudicacion?.q5DesaparaceEnReposo === true;
  const eapCalculada = itbBajo || eapPie || claudicacionPositiva;
  const eapGuardada = complicacionesGuardadas?.arteriopatiaPeriferica ?? false;
  const eapActiva = eapCalculada || eapGuardada;
  lista.push({
    id: "arteriopatiaPeriferica",
    nombre: "Arteriopatía periférica",
    categoria: "MACROVASCULARES",
    presente: eapActiva,
    origen: eapCalculada ? "calculado" : "manual",
    criterioClinico: "ITB < 0,90, claudicación intermitente o revascularización.",
    motivoDetectado: itbBajo
      ? `Índice tobillo-brazo disminuido (ITB = ${ultimaExploracionPie?.itb}).`
      : claudicacionPositiva
      ? "Cuestionario de Edimburgo (ECQ) positivo para claudicación."
      : eapPie
      ? "Signos clínicos de EAP en exploración de pie."
      : eapGuardada
      ? "Registrada manualmente en antecedentes."
      : undefined,
  });

  // 7. Úlcera de pie diabético
  const ulceraPie =
    ultimaExploracionPie?.antecedenteUlceraOAmputacion === true ||
    complicacionesGuardadas?.ulceraPieDiabetico === true;
  lista.push({
    id: "ulceraPieDiabetico",
    nombre: "Úlcera de pie diabético",
    categoria: "PIE_DIABETICO",
    presente: ulceraPie,
    origen: ultimaExploracionPie?.antecedenteUlceraOAmputacion ? "calculado" : "manual",
    criterioClinico: "Herida activa o antecedente de úlcera plantar.",
    motivoDetectado: ulceraPie ? "Antecedente o herida activa registrada." : undefined,
  });

  // 8. Amputación
  const amputacionGuardada = complicacionesGuardadas?.amputacion ?? false;
  lista.push({
    id: "amputacion",
    nombre: "Amputación",
    categoria: "PIE_DIABETICO",
    presente: amputacionGuardada,
    origen: "manual",
    criterioClinico: "Antecedente de amputación menor (dedo/antepié) o mayor.",
    motivoDetectado: amputacionGuardada ? "Antecedente registrado." : undefined,
  });

  // 9. Deformidad / pie de Charcot
  const deformidadDetectada =
    ultimaExploracionPie?.deformidad === true ||
    complicacionesGuardadas?.deformidadPieCharcot === true;
  lista.push({
    id: "deformidadPieCharcot",
    nombre: "Deformidad / pie de Charcot",
    categoria: "PIE_DIABETICO",
    presente: deformidadDetectada,
    origen: ultimaExploracionPie?.deformidad ? "calculado" : "manual",
    criterioClinico: "Inspección: deformidad ósea, colapso del arco plantar.",
    motivoDetectado: deformidadDetectada ? "Deformidad ósea o colapso detectado." : undefined,
  });

  // 10. Insuficiencia cardíaca
  const ntProBnpAlto =
    ultimoControlCardiovascular?.ntProBnp != null && ultimoControlCardiovascular.ntProBnp >= 125;
  const icGuardada = complicacionesGuardadas?.insuficienciaCardiaca ?? false;
  const icActiva = ntProBnpAlto || icGuardada;
  lista.push({
    id: "insuficienciaCardiaca",
    nombre: "Insuficiencia cardíaca",
    categoria: "OTRAS",
    presente: icActiva,
    origen: ntProBnpAlto ? "calculado" : "manual",
    criterioClinico: "Clínica (disnea, edemas), ecocardiograma o NT-proBNP ≥ 125 pg/ml.",
    motivoDetectado: ntProBnpAlto
      ? `NT-proBNP elevado (${ultimoControlCardiovascular?.ntProBnp} pg/ml).`
      : icGuardada
      ? "Registrada manualmente."
      : undefined,
  });

  // 11. Enfermedad hepática metabólica (MASLD/MASH)
  const lsmAlto =
    ultimoControlHepatico?.lsmKpa != null && ultimoControlHepatico.lsmKpa >= 8.0;
  const capAlto =
    ultimoControlHepatico?.capDbM != null && ultimoControlHepatico.capDbM >= 275;
  const masldCalculada = lsmAlto || capAlto;
  const masldGuardada = complicacionesGuardadas?.enfermedadHepaticaMetabolica ?? false;
  const masldActiva = masldCalculada || masldGuardada;
  lista.push({
    id: "enfermedadHepaticaMetabolica",
    nombre: "Enfermedad hepática metabólica (MASLD)",
    categoria: "OTRAS",
    presente: masldActiva,
    origen: masldCalculada ? "calculado" : "manual",
    criterioClinico: "Ecografía / elastografía hepática alterada (LSM ≥ 8 kPa o CAP ≥ 275 dB/m) o FIB-4 elevado.",
    motivoDetectado: lsmAlto
      ? `Rigidez hepática elevada (${ultimoControlHepatico?.lsmKpa} kPa).`
      : capAlto
      ? `Esteatosis hepática marcada (CAP ${ultimoControlHepatico?.capDbM} dB/m).`
      : masldGuardada
      ? "Registrada manualmente."
      : undefined,
  });

  // 12. Gastroparesia diabética
  const gastroGuardada = complicacionesGuardadas?.gastroparesiaDiabetica ?? false;
  lista.push({
    id: "gastroparesiaDiabetica",
    nombre: "Gastroparesia diabética",
    categoria: "OTRAS",
    presente: gastroGuardada,
    origen: "manual",
    criterioClinico: "Clínica digestiva sugestiva (saciedad precoz, náuseas, distensión posprandial).",
    motivoDetectado: gastroGuardada ? "Clínica registrada." : undefined,
  });

  // 13. Deterioro cognitivo
  const deterioroGuardado = complicacionesGuardadas?.deterioroCognitivo ?? false;
  lista.push({
    id: "deterioroCognitivo",
    nombre: "Deterioro cognitivo",
    categoria: "OTRAS",
    presente: deterioroGuardado,
    origen: "manual",
    criterioClinico: "Cribado cognitivo alterado (Pfeiffer / MEC de Lobo) o sospecha clínica.",
    motivoDetectado: deterioroGuardado ? "Detectado en cribado cognitivo." : undefined,
  });

  return lista;
}

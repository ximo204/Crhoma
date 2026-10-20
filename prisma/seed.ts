import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Borrando datos de ejemplo anteriores...");
  await prisma.valoracionHerida.deleteMany();
  await prisma.herida.deleteMany();
  await prisma.visitaPeriodo.deleteMany();
  await prisma.complicaciones.deleteMany();
  await prisma.retinografia.deleteMany();
  await prisma.exploracionPie.deleteMany();
  await prisma.controlHepatico.deleteMany();
  await prisma.controlRenal.deleteMany();
  await prisma.controlGlicada.deleteMany();
  await prisma.controlTA.deleteMany();
  await prisma.medicion.deleteMany();
  await prisma.controlCardiovascular.deleteMany();
  await prisma.cribadoClaudicacion.deleteMany();
  await prisma.controlMetabolico.deleteMany();
  await prisma.controlAnemia.deleteMany();
  await prisma.cribadoObesidad.deleteMany();
  await prisma.paciente.deleteMany();

  console.log("Creando pacientes de ejemplo clínicos CODEAPA...");

  // Paciente 1: DM Tipo 1 con ISCI + MCG Sí + Múltiples periodos
  const carmen = await prisma.paciente.create({
    data: {
      nuhsa: "AN1029384756",
      nombre: "Carmen Morales Delgado",
      sexo: "M",
      fechaNacimiento: new Date("1996-05-12"),
      centroSalud: "C.S. Ronda Sur",
      claveMedica: "MED-104",
      claveEnfermeria: "ENF-208",
      claveEquipo: "EQ-02",
      tipoDiabetes: "TIPO_1",
      tratamientoDiabetes: JSON.stringify(["ISCI_BOMBA", "DIETA_EJERCICIO"]),
      mcgEstado: "SI",
      mcgIntegracionSAS: true,
      mcgRevisionesTrim: true,
      embarazo: false,
      tiempoEvolucionDiabetes: ">=10",
      controlEvolucion: "BUENO",
      antecedentesFamiliaresDiabetes: "1_GRADO",
      diabetesGestacionalPrevia: "NO",
      perfilControlGlucemico: "DM1_INTENSIVO",
      visitas: {
        create: [
          { periodo: "2026", fecha: new Date("2026-02-10"), notas: "Revisión anual de seguimiento y calibración ISCI" },
          { periodo: "2025", fecha: new Date("2025-02-14"), notas: "Control anual previo" },
          { periodo: "2024", fecha: new Date("2024-03-01"), notas: "Inicio sistema MCG integrado" },
        ],
      },
      mediciones: {
        create: [
          { periodo: "2026", pesoKg: 58.5, tallaM: 1.65, perimetroCinturaCm: 74, fecha: new Date("2026-02-10") },
          { periodo: "2025", pesoKg: 60.0, tallaM: 1.65, perimetroCinturaCm: 76, fecha: new Date("2025-02-14") },
        ],
      },
      controlesTA: {
        create: [
          { periodo: "2026", pas: 115, pad: 72, fecha: new Date("2026-02-10") },
          { periodo: "2025", pas: 120, pad: 75, fecha: new Date("2025-02-14") },
        ],
      },
      controlesGlicada: {
        create: [
          { periodo: "2026", hba1c: 6.7, fecha: new Date("2026-02-10") },
          { periodo: "2025", hba1c: 7.2, fecha: new Date("2025-02-14") },
          { periodo: "2024", hba1c: 8.1, fecha: new Date("2024-03-01") },
        ],
      },
      exploracionesPie: {
        create: {
          periodo: "2026",
          realizado: true,
          monofilamentoNormal: true,
          diapasonNormal: true,
          deformidad: false,
          enfermedadArterialPeriferica: false,
          antecedenteUlceraOAmputacion: false,
          itb: 1.15,
          morfologiaDoppler: "TRIFASICA",
          fecha: new Date("2026-02-10"),
        },
      },
      retinografias: {
        create: {
          periodo: "2026",
          realizada: true,
          resultado: "NORMAL",
          fecha: new Date("2026-01-15"),
        },
      },
      controlesRenales: { create: { fge: 104, cac: 8, fecha: new Date("2026-02-10") } },
      controlesHepaticos: { create: { alt: 22, ast: 19, plaquetas: 260, fecha: new Date("2026-02-10") } },
      controlesMetabolicos: { create: { glucemiaBasal: 112, fechaGB: new Date("2026-02-10") } },
      complicaciones: { create: {} },
    },
  });

  // Paciente 2: DM Tipo 2 con ADOs + Basal + aGLP-1 + Complicación renal y neuropatía
  const manuel = await prisma.paciente.create({
    data: {
      nuhsa: "AN9876543210",
      nombre: "Manuel Jiménez Benítez",
      sexo: "H",
      fechaNacimiento: new Date("1958-11-20"),
      centroSalud: "C.S. Alameda",
      claveMedica: "MED-201",
      claveEnfermeria: "ENF-110",
      claveEquipo: "EQ-01",
      tipoDiabetes: "TIPO_2",
      tratamientoDiabetes: JSON.stringify(["DIETA_EJERCICIO", "ADOS", "BASAL", "AGLP1"]),
      mcgEstado: "DEBERIA",
      mcgIntegracionSAS: false,
      mcgRevisionesTrim: false,
      embarazo: false,
      tiempoEvolucionDiabetes: ">=10",
      controlEvolucion: "MALO",
      antecedentesFamiliaresDiabetes: "1_GRADO",
      perfilControlGlucemico: "GENERAL",
      visitas: {
        create: [
          { periodo: "2026", fecha: new Date("2026-01-20"), notas: "Detección de microalbuminuria y neuropatía incipiente" },
          { periodo: "2025", fecha: new Date("2025-06-15"), notas: "Ajuste de dosis de insulina basal" },
        ],
      },
      mediciones: {
        create: [
          { periodo: "2026", pesoKg: 94.2, tallaM: 1.72, perimetroCinturaCm: 108, fecha: new Date("2026-01-20") },
          { periodo: "2025", pesoKg: 97.0, tallaM: 1.72, perimetroCinturaCm: 112, fecha: new Date("2025-06-15") },
        ],
      },
      controlesTA: {
        create: [
          { periodo: "2026", pas: 146, pad: 92, fecha: new Date("2026-01-20") },
          { periodo: "2025", pas: 152, pad: 96, fecha: new Date("2025-06-15") },
        ],
      },
      controlesGlicada: {
        create: [
          { periodo: "2026", hba1c: 8.6, fecha: new Date("2026-01-20") },
          { periodo: "2025", hba1c: 9.2, fecha: new Date("2025-06-15") },
        ],
      },
      exploracionesPie: {
        create: {
          periodo: "2026",
          realizado: true,
          monofilamentoNormal: false,
          diapasonNormal: false,
          deformidad: true,
          enfermedadArterialPeriferica: false,
          antecedenteUlceraOAmputacion: false,
          itb: 0.85,
          morfologiaDoppler: "BIFASICA",
          fecha: new Date("2026-01-20"),
        },
      },
      retinografias: {
        create: {
          periodo: "2026",
          realizada: true,
          resultado: "NORMAL",
          fecha: new Date("2025-11-05"),
        },
      },
      controlesRenales: { create: { fge: 54, cac: 68, fecha: new Date("2026-01-20") } }, // ERC detectada FGe <60 y CAC >=30
      controlesHepaticos: { create: { alt: 48, ast: 42, plaquetas: 195, fecha: new Date("2026-01-20") } },
      controlesMetabolicos: { create: { glucemiaBasal: 168, fechaGB: new Date("2026-01-20") } },
      complicaciones: { create: {} },
    },
  });

  // Paciente 3: DM Gestacional + Embarazo activo + Objetivos estrictos
  const lucia = await prisma.paciente.create({
    data: {
      nuhsa: "AN5544332211",
      nombre: "Lucía Navarro Soler",
      sexo: "M",
      fechaNacimiento: new Date("1993-08-18"),
      centroSalud: "C.S. San Juan",
      claveMedica: "MED-104",
      claveEnfermeria: "ENF-302",
      claveEquipo: "EQ-03",
      tipoDiabetes: "GESTACIONAL",
      tratamientoDiabetes: JSON.stringify(["DIETA_EJERCICIO"]),
      mcgEstado: "SI",
      mcgIntegracionSAS: true,
      mcgRevisionesTrim: false,
      embarazo: true,
      tiempoEvolucionDiabetes: "<=5",
      controlEvolucion: "BUENO",
      antecedentesFamiliaresDiabetes: "2_GRADO",
      diabetesGestacionalPrevia: "SIGUE",
      perfilControlGlucemico: "GESTACION",
      visitas: {
        create: [
          { periodo: "2026", fecha: new Date("2026-03-05"), notas: "Control de 28 semanas de gestación" },
        ],
      },
      mediciones: {
        create: { periodo: "2026", pesoKg: 69.0, tallaM: 1.68, perimetroCinturaCm: 88, fecha: new Date("2026-03-05") },
      },
      controlesTA: {
        create: { periodo: "2026", pas: 110, pad: 68, fecha: new Date("2026-03-05") },
      },
      controlesGlicada: {
        create: { periodo: "2026", hba1c: 5.6, fecha: new Date("2026-03-05") },
      },
      exploracionesPie: {
        create: {
          periodo: "2026",
          realizado: true,
          monofilamentoNormal: true,
          diapasonNormal: true,
          deformidad: false,
          enfermedadArterialPeriferica: false,
          antecedenteUlceraOAmputacion: false,
          itb: 1.10,
          morfologiaDoppler: "TRIFASICA",
          fecha: new Date("2026-03-05"),
        },
      },
      retinografias: {
        create: {
          periodo: "2026",
          realizada: true,
          resultado: "NORMAL",
          fecha: new Date("2026-02-12"),
        },
      },
      controlesRenales: { create: { fge: 112, cac: 12, fecha: new Date("2026-03-05") } },
      controlesHepaticos: { create: { alt: 18, ast: 16, plaquetas: 275, fecha: new Date("2026-03-05") } },
      controlesMetabolicos: { create: { glucemiaBasal: 89, fechaGB: new Date("2026-03-05") } },
      complicaciones: { create: {} },
    },
  });

  // Paciente 4: Anciana frágil con retinopatía patológica + riesgo muy alto de pie
  const dolores = await prisma.paciente.create({
    data: {
      nuhsa: "AN7788990011",
      nombre: "Dolores Romero Vega",
      sexo: "M",
      fechaNacimiento: new Date("1942-01-25"),
      centroSalud: "C.S. Triana",
      claveMedica: "MED-305",
      claveEnfermeria: "ENF-410",
      claveEquipo: "EQ-04",
      tipoDiabetes: "TIPO_2",
      tratamientoDiabetes: JSON.stringify(["DIETA_EJERCICIO", "ADOS", "BASAL"]),
      mcgEstado: "SI",
      mcgIntegracionSAS: true,
      mcgRevisionesTrim: true,
      embarazo: false,
      tiempoEvolucionDiabetes: ">=10",
      controlEvolucion: "MALO",
      antecedentesFamiliaresDiabetes: "1_GRADO",
      perfilControlGlucemico: "ANCIANO_FRAGIL",
      visitas: {
        create: [
          { periodo: "2026", fecha: new Date("2026-02-18"), notas: "Paciente dependiente con cuidador. Úlcera previa cicatrizada." },
        ],
      },
      mediciones: {
        create: { periodo: "2026", pesoKg: 64.0, tallaM: 1.55, perimetroCinturaCm: 90, fecha: new Date("2026-02-18") },
      },
      controlesTA: {
        create: { periodo: "2026", pas: 136, pad: 78, fecha: new Date("2026-02-18") },
      },
      controlesGlicada: {
        create: { periodo: "2026", hba1c: 7.9, fecha: new Date("2026-02-18") },
      },
      exploracionesPie: {
        create: {
          periodo: "2026",
          realizado: true,
          monofilamentoNormal: false,
          diapasonNormal: false,
          deformidad: true,
          enfermedadArterialPeriferica: true,
          antecedenteUlceraOAmputacion: true, // Riesgo Muy Alto
          itb: 0.65,
          morfologiaDoppler: "MONOFASICA",
          fecha: new Date("2026-02-18"),
        },
      },
      retinografias: {
        create: {
          periodo: "2026",
          realizada: true,
          resultado: "PATOLOGICA", // Retinopatía patológica -> Derivación a 2º nivel
          fecha: new Date("2026-02-01"),
        },
      },
      controlesRenales: { create: { fge: 48, cac: 120, fecha: new Date("2026-02-18") } },
      controlesHepaticos: { create: { alt: 28, ast: 30, plaquetas: 180, fecha: new Date("2026-02-18") } },
      controlesCardiovasculares: { create: { ntProBnp: 160, fecha: new Date("2026-02-18") } }, // Insuf cardiaca detectada
      controlesMetabolicos: { create: { glucemiaBasal: 142, fechaGB: new Date("2026-02-18") } },
      complicaciones: { create: {} },
    },
  });

  // Paciente 5: recién dado de alta, SIN ningún dato clínico todavía.
  // Sirve para comprobar que la aplicación avisa de "sin registrar" en vez de
  // mostrar cifras inventadas (tabla, ficha y pestaña PAI del módulo Heridas).
  const rafael = await prisma.paciente.create({
    data: {
      nuhsa: "AN3312007788",
      nombre: "Rafael Ortega Pineda",
      sexo: "H",
      fechaNacimiento: new Date("1968-11-02"),
      centroSalud: "C.S. Los Barrios",
      claveMedica: "MED-221",
      claveEnfermeria: "ENF-410",
      claveEquipo: "EQ-11",
      tipoDiabetes: "TIPO_2",
      perfilControlGlucemico: "GENERAL",
      visitas: {
        create: [
          { periodo: "2026", fecha: new Date("2026-09-24"), notas: "Alta en el programa. Pendiente de primera analítica y exploración." },
        ],
      },
    },
  });

  // Paciente 6: DM1 joven, buen control con MCG. Sin complicaciones.
  const nuria = await prisma.paciente.create({
    data: {
      nuhsa: "AN6620114455",
      nombre: "Nuria Cabrera Ibáñez",
      sexo: "M",
      fechaNacimiento: new Date("1998-04-27"),
      centroSalud: "C.S. Los Barrios",
      claveMedica: "MED-221",
      claveEnfermeria: "ENF-411",
      claveEquipo: "EQ-11",
      tipoDiabetes: "TIPO_1",
      tratamientoDiabetes: JSON.stringify(["INSULINA_BASAL", "INSULINA_RAPIDA"]),
      mcgEstado: "SI",
      mcgIntegracionSAS: true,
      mcgRevisionesTrim: true,
      mcgProximaRevision: new Date("2026-12-15"),
      tiempoEvolucionDiabetes: ">=10",
      controlEvolucion: "BUENO",
      antecedentesFamiliaresDiabetes: "1_GRADO",
      perfilControlGlucemico: "DM1_INTENSIVO",
      visitas: {
        create: [{ periodo: "2026", fecha: new Date("2026-09-10"), notas: "Revisión trimestral de MCG" }],
      },
      mediciones: {
        create: { periodo: "2026", pesoKg: 61.5, tallaM: 1.70, perimetroCinturaCm: 74, fecha: new Date("2026-09-10") },
      },
      controlesTA: { create: { periodo: "2026", pas: 112, pad: 70, fecha: new Date("2026-09-10") } },
      controlesGlicada: { create: { periodo: "2026", hba1c: 6.5, fecha: new Date("2026-09-10") } },
      controlesRenales: { create: { periodo: "2026", fge: 105, cac: 6, creatinina: 0.75, fecha: new Date("2026-09-10") } },
      controlesCardiovasculares: {
        create: { periodo: "2026", colesterolTotal: 168, cLDL: 92, cHDL: 61, trigliceridos: 78, fecha: new Date("2026-09-10") },
      },
      retinografias: { create: { periodo: "2026", realizada: true, resultado: "NORMAL", fecha: new Date("2026-05-20") } },
      exploracionesPie: {
        create: {
          periodo: "2026",
          realizado: true,
          monofilamentoNormal: true,
          diapasonNormal: true,
          deformidad: false,
          enfermedadArterialPeriferica: false,
          antecedenteUlceraOAmputacion: false,
          itb: 1.08,
          morfologiaDoppler: "TRIFASICA",
          fecha: new Date("2026-09-10"),
        },
      },
      complicaciones: { create: {} },
    },
  });

  // Paciente 7: DM2 de larga evolución, mal control y varias complicaciones.
  // Además tendrá tres heridas (ver más abajo), para probar el selector.
  const antonio = await prisma.paciente.create({
    data: {
      nuhsa: "AN4455880022",
      nombre: "Antonio Gutiérrez Salas",
      sexo: "H",
      fechaNacimiento: new Date("1949-01-19"),
      centroSalud: "C.S. La Línea Poniente",
      claveMedica: "MED-108",
      claveEnfermeria: "ENF-205",
      claveEquipo: "EQ-08",
      tipoDiabetes: "TIPO_2",
      tratamientoDiabetes: JSON.stringify(["INSULINA_BASAL", "METFORMINA", "ISGLT2"]),
      mcgEstado: "DEBERIA",
      tiempoEvolucionDiabetes: ">=10",
      controlEvolucion: "MALO",
      antecedentesFamiliaresDiabetes: "1_GRADO",
      antecedentesFamiliaresECVPrecoz: true,
      perfilControlGlucemico: "ANCIANO_FRAGIL",
      visitas: {
        create: [
          { periodo: "2026", fecha: new Date("2026-09-12"), notas: "Seguimiento estrecho por heridas múltiples" },
          { periodo: "2025", fecha: new Date("2025-10-08"), notas: "Revisión anual" },
        ],
      },
      mediciones: {
        create: [
          { periodo: "2026", pesoKg: 94.0, tallaM: 1.72, perimetroCinturaCm: 116, fecha: new Date("2026-09-12") },
          { periodo: "2025", pesoKg: 91.5, tallaM: 1.72, perimetroCinturaCm: 112, fecha: new Date("2025-10-08") },
        ],
      },
      controlesTA: {
        create: [
          { periodo: "2026", pas: 158, pad: 92, fecha: new Date("2026-09-12") },
          { periodo: "2025", pas: 150, pad: 88, fecha: new Date("2025-10-08") },
        ],
      },
      controlesGlicada: {
        create: [
          { periodo: "2026", hba1c: 9.4, fecha: new Date("2026-09-12") },
          { periodo: "2025", hba1c: 8.7, fecha: new Date("2025-10-08") },
        ],
      },
      controlesRenales: {
        create: { periodo: "2026", fge: 38, cac: 320, creatinina: 1.82, potasio: 5.1, fecha: new Date("2026-09-12") },
      },
      controlesHepaticos: {
        create: { periodo: "2026", alt: 46, ast: 38, plaquetas: 142, ggt: 88, fecha: new Date("2026-09-12") },
      },
      controlesCardiovasculares: {
        create: {
          periodo: "2026",
          colesterolTotal: 226,
          cLDL: 148,
          cHDL: 36,
          trigliceridos: 232,
          ntProBnp: 410,
          fecha: new Date("2026-09-12"),
        },
      },
      controlesAnemia: {
        create: { periodo: "2026", hb: 10.8, vcm: 79, ferritina: 22, ist: 11, pcr: 6.4, fecha: new Date("2026-09-12") },
      },
      controlesMetabolicos: {
        create: { periodo: "2026", glucemiaBasal: 198, tsh: 3.1, fechaGB: new Date("2026-09-12") },
      },
      retinografias: {
        create: { periodo: "2026", realizada: true, resultado: "PATOLOGICA", fecha: new Date("2026-04-15") },
      },
      exploracionesPie: {
        create: {
          periodo: "2026",
          realizado: true,
          monofilamentoNormal: false,
          diapasonNormal: false,
          deformidad: true,
          enfermedadArterialPeriferica: true,
          antecedenteUlceraOAmputacion: true,
          itb: 0.58,
          morfologiaDoppler: "MONOFASICA",
          fecha: new Date("2026-09-12"),
        },
      },
      cribadosClaudicacion: {
        create: {
          periodo: "2026",
          q1DolorAlCaminar: true,
          q2ApareceEnReposo: false,
          q3ApareceAlSubirCuesta: true,
          q4ApareceEnLlano: true,
          q5DesaparaceEnReposo: true,
          q6Localizacion: "PANTORRILLA",
          fecha: new Date("2026-09-12"),
        },
      },
      complicaciones: {
        create: {
          retinopatiaDiabetica: true,
          nefropatiaDiabetica: true,
          neuropatiaPeriferica: true,
          arteriopatiaPeriferica: true,
          ulceraPieDiabetico: true,
          cardiopatiaIsquemica: true,
        },
      },
    },
  });

  // Paciente 8: mujer mayor con úlcera venosa ya cicatrizada. Otro centro.
  const josefa = await prisma.paciente.create({
    data: {
      nuhsa: "AN7001223344",
      nombre: "Josefa Ramírez Cortés",
      sexo: "M",
      fechaNacimiento: new Date("1944-06-30"),
      centroSalud: "C.S. San Roque",
      claveMedica: "MED-108",
      claveEnfermeria: "ENF-206",
      claveEquipo: "EQ-08",
      tipoDiabetes: "TIPO_2",
      tratamientoDiabetes: JSON.stringify(["METFORMINA"]),
      mcgEstado: "NO",
      tiempoEvolucionDiabetes: "5-10",
      controlEvolucion: "BUENO",
      perfilControlGlucemico: "ANCIANO_FRAGIL",
      visitas: {
        create: [{ periodo: "2026", fecha: new Date("2026-08-28"), notas: "Alta de la herida. Continúa con media de compresión." }],
      },
      mediciones: {
        create: { periodo: "2026", pesoKg: 78.0, tallaM: 1.56, perimetroCinturaCm: 101, fecha: new Date("2026-08-28") },
      },
      controlesTA: { create: { periodo: "2026", pas: 138, pad: 78, fecha: new Date("2026-08-28") } },
      controlesGlicada: { create: { periodo: "2026", hba1c: 7.4, fecha: new Date("2026-08-28") } },
      controlesRenales: { create: { periodo: "2026", fge: 64, cac: 28, creatinina: 0.95, fecha: new Date("2026-08-28") } },
      retinografias: { create: { periodo: "2026", realizada: false, resultado: "NO_REALIZADA", fecha: new Date("2026-08-28") } },
      exploracionesPie: {
        create: {
          periodo: "2026",
          realizado: true,
          monofilamentoNormal: true,
          diapasonNormal: false,
          deformidad: false,
          enfermedadArterialPeriferica: false,
          antecedenteUlceraOAmputacion: false,
          itb: 0.96,
          morfologiaDoppler: "BIFASICA",
          fecha: new Date("2026-08-28"),
        },
      },
      complicaciones: { create: {} },
    },
  });

  console.log("Creando heridas de ejemplo vinculadas a la base de datos CRHOMA...");

  // Herida 1: Dolores Romero - Úlcera en pie diabético neuropática/isquémica
  await prisma.herida.create({
    data: {
      pacienteId: dolores.id,
      codigo: "UDP-PD-01",
      etiologia: "pie_diabetico",
      localizacion: "Cabeza del 1er metatarsiano pie derecho (zona plantar)",
      fechaInicio: new Date("2026-01-10"),
      estado: "ACTIVA",
      notas: "Úlcera de pie diabético con fondo esfacelado moderado, neuropatía confirmada y EAP leve asociada.",
      valoraciones: {
        create: [
          {
            fecha: new Date("2026-02-18"),
            largoCm: 2.8,
            anchoCm: 2.1,
            profundidadCm: 0.6,
            superficieCm2: 5.88,
            superficieIdx: 2,
            profundidadIdx: 1,
            bordesIdx: 1,
            tejidoIdx: 2,
            exudadoIdx: 2,
            infeccionItems: JSON.stringify(Array(12).fill(false)),
            infeccionConfirmada: false,
            resvechTotal: 14,
            pasBrazoD: 136,
            pasBrazoI: 134,
            pasPedioD: 90,
            pasTibialD: 88,
            itbDerecho: 0.66,
            itbIzquierdo: 0.65,
            dopplerDerecho: "MONOFASICA",
            dopplerIzquierdo: "MONOFASICA",
            buergerAngulo: "moderado",
            buergerRubor: "positivo",
            fontaineEstadio: "IIa",
            recomendacionCompresion: "CONTRAINDICADA",
            apositoPrincipal: "Hidrogel + Apósito Hidrocelular de Silicona",
            apositoSecundario: "Espuma de poliuretano no adhesiva",
            terapiaCompresivaPautada: "No procede por ITB < 0.8 y onda monofásica",
            frecuenciaCuras: "Cada 48-72 horas o según saturación del apósito",
            observacionesCura: "Descarga absoluta con calzado terapéutico de descarga en balancín. No comprimir.",
          },
          {
            fecha: new Date("2026-01-20"),
            largoCm: 3.5,
            anchoCm: 2.8,
            profundidadCm: 0.8,
            superficieCm2: 9.8,
            superficieIdx: 3,
            profundidadIdx: 2,
            bordesIdx: 2,
            tejidoIdx: 3,
            exudadoIdx: 2,
            infeccionItems: JSON.stringify(Array(12).fill(false)),
            infeccionConfirmada: false,
            resvechTotal: 19,
            pasBrazoD: 140,
            pasBrazoI: 138,
            pasPedioD: 90,
            pasTibialD: 92,
            itbDerecho: 0.65,
            itbIzquierdo: 0.64,
            dopplerDerecho: "MONOFASICA",
            dopplerIzquierdo: "MONOFASICA",
            apositoPrincipal: "Desbridamiento cortante + Hidrogel",
            frecuenciaCuras: "Cada 48h",
            observacionesCura: "Valoración inicial al ingreso en programa de heridas complejas.",
          },
        ],
      },
    },
  });

  // Herida 2: Manuel Jiménez - Úlcera vascular venosa en tercio distal pierna izquierda
  await prisma.herida.create({
    data: {
      pacienteId: manuel.id,
      codigo: "UV-MII-01",
      etiologia: "venosa",
      localizacion: "Región supramaleolar interna de pierna izquierda",
      fechaInicio: new Date("2025-12-05"),
      estado: "ACTIVA",
      notas: "Úlcera venosa con edema bimaleolar. ITB conservado (0.85). Candidato a terapia compresiva multicomponente.",
      valoraciones: {
        create: [
          {
            fecha: new Date("2026-01-20"),
            largoCm: 4.2,
            anchoCm: 3.0,
            profundidadCm: 0.3,
            superficieCm2: 12.6,
            superficieIdx: 3,
            profundidadIdx: 1,
            bordesIdx: 1,
            tejidoIdx: 2,
            exudadoIdx: 3,
            infeccionItems: JSON.stringify(Array(12).fill(false)),
            infeccionConfirmada: false,
            resvechTotal: 16,
            pasBrazoD: 146,
            pasBrazoI: 142,
            pasPedioD: 125,
            pasTibialD: 124,
            itbDerecho: 0.86,
            itbIzquierdo: 0.85,
            dopplerDerecho: "BIFASICA",
            dopplerIzquierdo: "BIFASICA",
            buergerAngulo: "normal",
            buergerRubor: "normal",
            fontaineEstadio: "I",
            recomendacionCompresion: "COMPRESION_MODERADA",
            apositoPrincipal: "Alginato cálcico con plata",
            apositoSecundario: "Apósito absorbente extra",
            terapiaCompresivaPautada: "Vendaje compresivo de 2 capas (tracción corta)",
            frecuenciaCuras: "2 veces por semana coincidiendo con cambio de vendaje",
            observacionesCura: "Buena tolerancia al vendaje. Reducción evidente del edema perilesional.",
          },
        ],
      },
    },
  });

  // Heridas 3, 4 y 5: Antonio Gutiérrez tiene tres lesiones a la vez.
  // Sirve para probar el selector de heridas y el cambio entre ellas.
  await prisma.herida.create({
    data: {
      pacienteId: antonio.id,
      codigo: "UDP-MTT-01",
      etiologia: "pie_diabetico",
      localizacion: "Cabeza del 5º metatarsiano pie izquierdo",
      fechaInicio: new Date("2026-06-02"),
      estado: "ACTIVA",
      notas: "Mal perforante plantar sobre callosidad. Neuropatía establecida y EAP moderada (ITB 0,58).",
      valoraciones: {
        create: [
          {
            fecha: new Date("2026-09-12"),
            largoCm: 1.9,
            anchoCm: 1.6,
            profundidadCm: 0.9,
            superficieCm2: 3.04,
            superficieIdx: 1,
            profundidadIdx: 2,
            bordesIdx: 2,
            tejidoIdx: 2,
            exudadoIdx: 1,
            infeccionItems: JSON.stringify(Array(12).fill(false)),
            infeccionConfirmada: false,
            resvechTotal: 12,
            pasBrazoD: 152,
            pasBrazoI: 148,
            pasPedioI: 88,
            pasTibialI: 86,
            itbIzquierdo: 0.58,
            dopplerIzquierdo: "MONOFASICA",
            fontaineEstadio: "IIb",
            recomendacionCompresion: "CONTRAINDICADA",
            apositoPrincipal: "Apósito hidrocelular de silicona",
            frecuenciaCuras: "Cada 48 horas",
            observacionesCura: "Descarga con fieltro adhesivo. No comprimir por ITB < 0,6.",
          },
        ],
      },
    },
  });

  await prisma.herida.create({
    data: {
      pacienteId: antonio.id,
      codigo: "LPP-SACRO-01",
      etiologia: "LPP",
      localizacion: "Región sacra",
      fechaInicio: new Date("2026-07-19"),
      estado: "ACTIVA",
      notas: "Lesión por presión categoría II por encamamiento durante ingreso hospitalario.",
      valoraciones: {
        create: [
          {
            fecha: new Date("2026-09-12"),
            largoCm: 3.4,
            anchoCm: 2.7,
            profundidadCm: 0.4,
            superficieCm2: 9.18,
            superficieIdx: 2,
            profundidadIdx: 1,
            bordesIdx: 1,
            tejidoIdx: 1,
            exudadoIdx: 2,
            infeccionItems: JSON.stringify(Array(12).fill(false)),
            infeccionConfirmada: false,
            resvechTotal: 9,
            apositoPrincipal: "Espuma de poliuretano adhesiva",
            frecuenciaCuras: "Cada 72 horas",
            observacionesCura: "Cambios posturales cada 2-3 horas y superficie de alivio de presión.",
          },
        ],
      },
    },
  });

  await prisma.herida.create({
    data: {
      pacienteId: antonio.id,
      codigo: "UV-MID-01",
      etiologia: "venosa",
      localizacion: "Región maleolar interna de pierna derecha",
      fechaInicio: new Date("2026-03-11"),
      estado: "CICATRIZADA",
      notas: "Cicatrizada el 20/08/2026. Se mantiene media de compresión para prevenir recidiva.",
      valoraciones: {
        create: [
          {
            fecha: new Date("2026-08-20"),
            largoCm: 0,
            anchoCm: 0,
            profundidadCm: 0,
            superficieCm2: 0,
            superficieIdx: 0,
            profundidadIdx: 0,
            bordesIdx: 0,
            tejidoIdx: 0,
            exudadoIdx: 0,
            infeccionItems: JSON.stringify(Array(12).fill(false)),
            infeccionConfirmada: false,
            resvechTotal: 0,
            apositoPrincipal: "Ninguno. Epitelización completa.",
            terapiaCompresivaPautada: "Media de compresión normal (clase II) de mantenimiento",
            frecuenciaCuras: "No precisa",
            observacionesCura: "Alta de la herida. Revisión preventiva en 3 meses.",
          },
        ],
      },
    },
  });

  // Herida 6: Josefa, úlcera venosa cerrada. Paciente sin heridas activas.
  await prisma.herida.create({
    data: {
      pacienteId: josefa.id,
      codigo: "UV-MII-02",
      etiologia: "venosa",
      localizacion: "Tercio distal cara interna de pierna izquierda",
      fechaInicio: new Date("2026-02-14"),
      estado: "CICATRIZADA",
      notas: "Resuelta con terapia compresiva multicomponente en 6 meses.",
      valoraciones: {
        create: [
          {
            fecha: new Date("2026-08-28"),
            largoCm: 0,
            anchoCm: 0,
            superficieCm2: 0,
            superficieIdx: 0,
            profundidadIdx: 0,
            bordesIdx: 0,
            tejidoIdx: 0,
            exudadoIdx: 0,
            infeccionItems: JSON.stringify(Array(12).fill(false)),
            infeccionConfirmada: false,
            resvechTotal: 0,
            pasBrazoD: 140,
            pasBrazoI: 138,
            pasPedioI: 134,
            pasTibialI: 132,
            itbIzquierdo: 0.96,
            dopplerIzquierdo: "BIFASICA",
            recomendacionCompresion: "COMPRESION_FUERTE",
            terapiaCompresivaPautada: "Media de compresión clase II de mantenimiento",
            frecuenciaCuras: "No precisa",
            observacionesCura: "Cicatrización completa. Educación para prevenir recidiva.",
          },
        ],
      },
    },
  });

  console.log(`
Pacientes de ejemplo creados con éxito:
  - ${carmen.nombre} (${carmen.nuhsa}) — DM2, buen control
  - ${manuel.nombre} (${manuel.nuhsa}) — úlcera venosa activa
  - ${lucia.nombre} (${lucia.nuhsa}) — DM gestacional, con MCG
  - ${dolores.nombre} (${dolores.nuhsa}) — anciana frágil, pie diabético
  - ${rafael.nombre} (${rafael.nuhsa}) — SIN datos clínicos (prueba de "sin registrar")
  - ${nuria.nombre} (${nuria.nuhsa}) — DM1 joven con MCG, sin complicaciones
  - ${antonio.nombre} (${antonio.nuhsa}) — mal control, 6 complicaciones y 3 heridas
  - ${josefa.nombre} (${josefa.nuhsa}) — otro centro, herida ya cicatrizada
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

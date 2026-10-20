export interface FormatoAposito {
  tam: string;
  codigo: string;
  precio: number;
}

export interface ApositoSAS {
  id: string;
  categoria: string;
  nombre: string;
  laboratorio: string;
  formatos: FormatoAposito[];
  indicaciones: string;
  tipoHerida: string[];
  exudado: string[];
  tejido: string[];
  infeccion: boolean | null;
  duracion: string;
  notas: string;
}

export const TIPO_HERIDA_OPTS = [
  { v: "LPP", label: "Lesión por presión (LPP)" },
  { v: "venosa", label: "Úlcera venosa" },
  { v: "arterial", label: "Úlcera arterial / isquémica" },
  { v: "pie_diabetico", label: "Pie diabético" },
  { v: "quemadura", label: "Quemadura" },
  { v: "quirurgica", label: "Quirúrgica / dehiscente" },
  { v: "traumatica", label: "Traumática / laceración" },
  { v: "oncologica", label: "Oncológica / fístula" },
  { v: "injerto", label: "Injerto / zona donante" },
];

export const CATALOGO_APOSITOS_SAS: ApositoSAS[] = [
  {
    id: "esp-01",
    categoria: "Espuma no adhesiva",
    nombre: "Biatain no adhesivo",
    laboratorio: "Coloplast",
    formatos: [
      { tam: "10x10", codigo: "E64893", precio: 2.1 },
      { tam: "15x15", codigo: "E64895", precio: 3.55 },
    ],
    indicaciones: "Heridas exudativas de moderadas a muy exudativas: úlceras por presión, úlceras venosas, pie diabético.",
    tipoHerida: ["LPP", "venosa", "pie_diabetico"],
    exudado: ["moderado", "alto"],
    tejido: ["granulacion", "esfacelo"],
    infeccion: null,
    duracion: "Hasta 7 días",
    notas: "Estructura alveolar 3D. Excelente absorción vertical.",
  },
  {
    id: "mp-01",
    categoria: "Malla con plata",
    nombre: "Acticoat Flex 3",
    laboratorio: "Smith & Nephew",
    formatos: [{ tam: "10x10", codigo: "E65162", precio: 11.0 }],
    indicaciones: "Plata nanocristalina, barrera antimicrobiana de amplio espectro. Lesiones infectadas, quemaduras, LPP, úlceras venosas.",
    tipoHerida: ["LPP", "venosa", "quemadura", "quirurgica", "injerto"],
    exudado: ["moderado", "alto"],
    tejido: ["esfacelo", "granulacion", "necrotico"],
    infeccion: true,
    duracion: "Mínimo 3 días",
    notas: "Humedecer con agua estéril, NO con suero salino.",
  },
  {
    id: "ms-01",
    categoria: "Malla con silicona",
    nombre: "Mepilex One",
    laboratorio: "Mölnlycke",
    formatos: [
      { tam: "6x7", codigo: "E65534", precio: 1.76 },
      { tam: "13x15", codigo: "E64998", precio: 7.63 },
    ],
    indicaciones: "Lesiones superficiales, incisiones quirúrgicas, quemaduras de espesor parcial, úlceras de pie diabético.",
    tipoHerida: ["traumatica", "quirurgica", "quemadura", "injerto", "pie_diabetico"],
    exudado: ["ninguno", "bajo"],
    tejido: ["epitelizacion", "cerrada"],
    infeccion: false,
    duracion: "Hasta 14 días",
    notas: "Retirada atraumática. Minimiza cicatrices hipertróficas.",
  },
  {
    id: "mpv-01",
    categoria: "Malla con parafina/hidrocoloide",
    nombre: "Urgotul",
    laboratorio: "Urgo",
    formatos: [
      { tam: "5x5", codigo: "G02490", precio: 2.18 },
      { tam: "10x12", codigo: "E64983", precio: 1.63 },
    ],
    indicaciones: "Heridas agudas, traumáticas, postoperatorias, crónicas (LPP, pie diabético) y fase de epitelización.",
    tipoHerida: ["quemadura", "traumatica", "quirurgica", "LPP", "pie_diabetico"],
    exudado: ["bajo", "moderado"],
    tejido: ["epitelizacion", "granulacion"],
    infeccion: false,
    duracion: "Hasta 7 días",
    notas: "Malla de poliéster con TLC. Retirada atraumática.",
  },
  {
    id: "mpv-02",
    categoria: "Malla con oligosacáridos",
    nombre: "Urgo Start Contact",
    laboratorio: "Urgo",
    formatos: [{ tam: "5x7", codigo: "F73554", precio: 5.5 }],
    indicaciones: "Toda herida NO infectada desde granulación hasta cicatrización: úlceras venosas, pie diabético, LPP. Inhibe metaloproteasas (TLC-NOSF).",
    tipoHerida: ["venosa", "pie_diabetico", "LPP"],
    exudado: ["ninguno", "bajo"],
    tejido: ["granulacion", "epitelizacion"],
    infeccion: false,
    duracion: "Máximo 7 días",
    notas: "Estimula la angiogénesis.",
  },
  {
    id: "hc-01",
    categoria: "Hidrocoloide extrafino",
    nombre: "Varihesive",
    laboratorio: "Convatec",
    formatos: [{ tam: "10x10", codigo: "E65056", precio: 0.72 }],
    indicaciones: "Lesiones cutáneas ligeramente exudativas; protección de zonas con riesgo de ulceración por fricción.",
    tipoHerida: ["venosa", "LPP"],
    exudado: ["bajo"],
    tejido: ["epitelizacion", "granulacion"],
    infeccion: false,
    duracion: "Hasta 5 días",
    notas: "NO usar si hay riesgo o signos de infección.",
  },
  {
    id: "hg-01",
    categoria: "Hidrogel",
    nombre: "Intrasite Conformable",
    laboratorio: "Smith & Nephew",
    formatos: [{ tam: "estándar", codigo: "E67655", precio: 1.98 }],
    indicaciones: "Acción desbridante suave, rehidrata el tejido necrótico seco o con esfácelos.",
    tipoHerida: ["venosa", "arterial", "LPP", "pie_diabetico"],
    exudado: ["ninguno", "bajo"],
    tejido: ["necrotico", "esfacelo"],
    infeccion: null,
    duracion: "Cada 24-72h",
    notas: "Desbridamiento autolítico.",
  },
  {
    id: "fp-01",
    categoria: "Fibra de poliacrilato",
    nombre: "UrgoClean",
    laboratorio: "Urgo",
    formatos: [
      { tam: "6x6", codigo: "G02488", precio: 2.18 },
      { tam: "10x10", codigo: "E64737", precio: 3.27 },
    ],
    indicaciones: "Desbridante. Fase de desbridamiento de heridas crónicas con exudado: úlceras de pierna, LPP, pie diabético.",
    tipoHerida: ["venosa", "LPP", "pie_diabetico", "oncologica"],
    exudado: ["moderado", "alto"],
    tejido: ["esfacelo", "necrotico"],
    infeccion: null,
    duracion: "1-2 días en fase de limpieza",
    notas: "Fibras poliacrilato de alta cohesión. Retirada en una sola pieza.",
  },
  {
    id: "fp-05",
    categoria: "Fibra de poliacrilato con plata",
    nombre: "UrgoClean Ag",
    laboratorio: "Urgo",
    formatos: [
      { tam: "6x6", codigo: "F58032", precio: 3.28 },
      { tam: "10x10", codigo: "E99807", precio: 5.06 },
    ],
    indicaciones: "Tratamiento de infecciones locales, acción combinada antimicrobiana + desbridamiento + limpieza: úlceras de pierna, LPP, pie diabético.",
    tipoHerida: ["venosa", "LPP", "pie_diabetico", "quemadura", "traumatica", "quirurgica"],
    exudado: ["moderado", "alto"],
    tejido: ["esfacelo", "granulacion"],
    infeccion: true,
    duracion: "1-2 días en desbridamiento, máx. 7 días",
    notas: "Acción bactericida rápida de amplio espectro contra biofilm.",
  },
  {
    id: "alg-01",
    categoria: "Alginato cálcico",
    nombre: "Cutimed Alginate",
    laboratorio: "Essity",
    formatos: [{ tam: "10x10", codigo: "E64880", precio: 0.9 }],
    indicaciones: "Heridas exudativas libres de tejido necrótico: pie diabético, venosas, LPP, hemostático leve.",
    tipoHerida: ["pie_diabetico", "venosa", "arterial", "LPP", "traumatica", "quirurgica"],
    exudado: ["moderado", "alto"],
    tejido: ["granulacion", "esfacelo"],
    infeccion: null,
    duracion: "Hasta 72h",
    notas: "Forma gel suave hidrofílico.",
  },
  {
    id: "sa-01",
    categoria: "Superabsorbente",
    nombre: "ConvaMax",
    laboratorio: "Convatec",
    formatos: [
      { tam: "10x10", codigo: "F76781", precio: 1.69 },
      { tam: "15x15", codigo: "F76783", precio: 3.19 },
    ],
    indicaciones: "Heridas con muy alto grado de exudado, edemas o fístulas. Gran capacidad de retención.",
    tipoHerida: ["LPP", "venosa", "quirurgica"],
    exudado: ["alto"],
    tejido: ["granulacion", "esfacelo"],
    infeccion: null,
    duracion: "Hasta 7 días según saturación",
    notas: "Bloquea el exudado y las bacterias impidiendo la maceración perilesional.",
  },
  {
    id: "sol-01",
    categoria: "Solución limpiadora",
    nombre: "Prontosan Solución",
    laboratorio: "Braun",
    formatos: [{ tam: "350ml", codigo: "B41691", precio: 10.7 }],
    indicaciones: "Solución de polihexanida con betaína (PHMB) para limpieza y descontaminación tisular y retirada de biofilm.",
    tipoHerida: ["quirurgica", "traumatica", "venosa", "quemadura", "pie_diabetico", "LPP"],
    exudado: ["ninguno", "bajo", "moderado", "alto"],
    tejido: ["granulacion", "esfacelo", "necrotico"],
    infeccion: null,
    duracion: "Aplicar en fomento 10-15 min",
    notas: "Gold standard en desbridamiento y preparación del lecho (TIME).",
  },
];

const TEJIDO_LABELS: Record<string, string> = {
  necrotico: "tejido necrótico",
  esfacelo: "esfácelos",
  granulacion: "tejido de granulación",
  epitelizacion: "tejido epitelial",
  cerrada: "herida cerrada",
};

export function recommendProducts({
  tejidoTag,
  exudadoNivel,
  sospechaInfeccion,
  tipoHeridaTags,
}: {
  tejidoTag?: string;
  exudadoNivel?: string;
  sospechaInfeccion?: boolean;
  tipoHeridaTags?: string[];
}) {
  const scored = CATALOGO_APOSITOS_SAS.map((p) => {
    let score = 0;
    const motivos: string[] = [];

    if (tejidoTag && p.tejido.includes(tejidoTag)) {
      score += 3;
      motivos.push(
        `Indicado para heridas con ${TEJIDO_LABELS[tejidoTag] || tejidoTag} en el lecho.`
      );
    }

    if (exudadoNivel && p.exudado.includes(exudadoNivel)) {
      score += 3;
      motivos.push(
        `Capacidad de absorción adecuada para nivel de exudado "${exudadoNivel}".`
      );
    }

    if (tipoHeridaTags && tipoHeridaTags.length) {
      const matched = tipoHeridaTags.filter((t) => p.tipoHerida.includes(t));
      if (matched.length) {
        score += matched.length * 2;
        const labels = matched
          .map((t) => TIPO_HERIDA_OPTS.find((o) => o.v === t)?.label || t)
          .join(", ");
        motivos.push(`Indicado específicamente para esta etiología (${labels}).`);
      }
    }

    if (sospechaInfeccion) {
      if (p.infeccion === true) {
        score += 5;
        motivos.push("Acción antimicrobiana / barrera contra biofilm prioritario por sospecha de infección.");
      }
      if (p.infeccion === false) score -= 3;
    } else {
      if (p.infeccion === true) score -= 2;
    }

    return { ...p, score, motivos };
  }).filter((p) => p.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 6);
}

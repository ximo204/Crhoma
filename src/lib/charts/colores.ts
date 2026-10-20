/**
 * Paleta de color para los gráficos de CODEAPA/CRHOMA.
 *
 * Son los valores hexadecimales exactos de la paleta por defecto del método
 * de visualización de datos (ver skill "dataviz"), validados con
 * `validate_palette.js` antes de usarlos aquí — no están "a ojo". El orden
 * de los 8 colores categóricos es el mecanismo de seguridad para daltonismo:
 * nunca se reordena ni se generan colores nuevos a partir del 9º elemento.
 *
 * Solo se valida y usa el modo claro: el resto de CODEAPA no tiene modo
 * oscuro, así que añadirlo solo a los gráficos rompería la consistencia.
 */

/** Los 8 colores categóricos, en su orden validado. Nunca reordenar. */
export const CATEGORICO = [
  "#2a78d6", // 1 azul
  "#eb6834", // 2 naranja
  "#1baf7a", // 3 aqua
  "#eda100", // 4 amarillo
  "#e87ba4", // 5 magenta
  "#008300", // 6 verde
  "#4a3aa7", // 7 violeta
  "#e34948", // 8 rojo
] as const;

/** Gris neutro para categorías "Otros / Sin especificar": no gasta un slot categórico. */
export const CATEGORICO_OTROS = "#898781";

/** Línea única (tendencia de un solo paciente): siempre el slot 1, azul. */
export const SERIE_UNICA = CATEGORICO[0];

/**
 * Rampa secuencial de un solo tono (azul), clara→oscura, para magnitud.
 * Pasos 100→700 tal cual los documenta la paleta de referencia.
 */
export const SECUENCIAL_AZUL = {
  100: "#cde2fb",
  150: "#b7d3f6",
  200: "#9ec5f4",
  250: "#86b6ef",
  300: "#6da7ec",
  350: "#5598e7",
  400: "#3987e5",
  450: "#2a78d6",
  500: "#256abf",
  550: "#1c5cab",
  600: "#184f95",
  650: "#104281",
  700: "#0d366b",
} as const;

/**
 * Tramo ordinal de 4 pasos para bandas de control (p.ej. HbA1c): más
 * oscuro = peor control. Validado con --ordinal (monotonía, contraste del
 * extremo claro ≥ 2:1, mismo tono).
 */
export const ORDINAL_4 = [
  SECUENCIAL_AZUL[300],
  SECUENCIAL_AZUL[450],
  SECUENCIAL_AZUL[550],
  SECUENCIAL_AZUL[650],
] as const;

/** Paleta de estado fija (nunca para "serie 4"): siempre con icono + etiqueta. */
export const ESTADO = {
  bueno: "#0ca30c",
  aviso: "#fab219",
  grave: "#ec835a",
  critico: "#d03b3b",
} as const;

/** Cromática del lienzo del gráfico — alineada con los tokens slate ya usados en el resto de CODEAPA. */
export const CHROME = {
  superficie: "#ffffff",
  tintaPrimaria: "#0f172a", // slate-900
  tintaSecundaria: "#475569", // slate-600
  tintaMuda: "#94a3b8", // slate-400
  rejilla: "#e2e8f0", // slate-200
  eje: "#cbd5e1", // slate-300
} as const;

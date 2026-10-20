export type FormatoSAS =
  | "INFOWEB"
  | "FARMA"
  | "LAB_BIOQUIMICA"
  | "LAB_HEMATO"
  | "GENERICO";

export interface ColumnaMapeada {
  origen: string;
  destino: string;
  ejemplo?: string;
}

export interface FilaProcesada {
  nuhsa: string;
  datosPaciente: {
    nombre?: string;
    sexo?: "H" | "M";
    edad?: number;
    fechaNacimiento?: Date;
    centroSalud?: string;
    claveMedica?: string;
    claveEnfermeria?: string;
    claveEquipo?: string;
    tipoDiabetes?: string;
    tratamientoDiabetes?: string;
    // Relevantes para el riesgo de úlceras por presión (módulo Heridas).
    inmovilizado?: boolean;
    viveEnResidencia?: boolean;
  };
  periodo?: string;
  clinico: {
    // Renal
    creatinina?: number;
    fge?: number;
    cac?: number;
    potasio?: number;
    // Glicada & Metabolico
    hba1c?: number;
    glucemiaBasal?: number;
    tsh?: number;
    // Cardiovascular
    colesterolTotal?: number;
    cHDL?: number;
    cLDL?: number;
    trigliceridos?: number;
    ntProBnp?: number;
    lpA?: number;
    // Anemia / Hemato
    hb?: number;
    vcm?: number;
    hcm?: number;
    chcm?: number;
    plaquetas?: number;
    ferritina?: number;
    ist?: number;
    vitaminaB12?: number;
    acidoFolico?: number;
    pcr?: number;
    // Pie & Retinografia
    riesgoPieDiabetico?: string; // 'BAJO' | 'MEDIO' | 'ALTO'
    retino3Anos?: boolean;
    // Complicaciones directas
    amputado?: boolean;
    pieDiabetico?: boolean;
  };
  raw: Record<string, string>;
}

export interface ResultadoParseo {
  formato: FormatoSAS;
  nombreFormato: string;
  descripcion: string;
  totalFilas: number;
  filasValidas: number;
  columnasDetectadas: string[];
  filas: FilaProcesada[];
  advertencias: string[];
}

/**
 * Normaliza nombres de columna para comparación insensible a mayúsculas, tildes y símbolos.
 */
export function normalizarHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Detecta el formato SAS analizando la lista de columnas.
 */
export function detectarFormatoSAS(headers: string[]): {
  formato: FormatoSAS;
  nombreFormato: string;
  descripcion: string;
} {
  const normHeaders = headers.map(normalizarHeader);

  const has = (keyword: string) =>
    normHeaders.some((h) => h.includes(normalizarHeader(keyword)));

  // 1. Infoweb (Diabetes, HTA, Mayores 60, Vascular)
  if (
    has("periodo") &&
    (has("nuhsa") || has("nusa")) &&
    (has("desccap") || has("riesgobajopd") || has("claveenfermeria") || has("pacate"))
  ) {
    return {
      formato: "INFOWEB",
      nombreFormato: "SAS Infoweb (Diabetes / HTA / Vascular)",
      descripcion: "Exportación de indicadores y cupos poblacionales con estratificación de pie y retinografía.",
    };
  }

  // 2. Farmacia A10 Diabetes
  if (
    (has("nusa") || has("nuhsa")) &&
    (has("compofarma") || has("atcnivel4") || has("atc5n") || has("codicompo") || has("recetas") || has("envases"))
  ) {
    return {
      formato: "FARMA",
      nombreFormato: "SAS Farmacia A10 (Tratamientos Diabetes)",
      descripcion: "Consumo farmacéutico y dispensaciones de antidiabéticos orales e insulinas.",
    };
  }

  // 3. Laboratorio Bioquímica
  if (
    (has("nuhsa") || has("nusa") || has("numerodelpaciente")) &&
    (has("creatinina") || has("filtrado") || has("glicosilada") || has("colesterol") || has("glucosa"))
  ) {
    return {
      formato: "LAB_BIOQUIMICA",
      nombreFormato: "Laboratorio Clínico (Bioquímica)",
      descripcion: "Analíticas con FGE, Creatinina, HbA1c, Perfil lipídico y Marcadores renales/metabólicos.",
    };
  }

  // 4. Laboratorio Hematología
  if (
    (has("nuhsa") || has("nusa")) &&
    (has("hemoglobina") || has("hematocrito") || has("vcm") || has("plaquetas") || has("ferritina"))
  ) {
    return {
      formato: "LAB_HEMATO",
      nombreFormato: "Laboratorio Clínico (Hematología y Metabolismo)",
      descripcion: "Hemograma completo, VCM, Plaquetas, Ferritina, Vitaminas y TSH.",
    };
  }

  return {
    formato: "GENERICO",
    nombreFormato: "Hoja de Cálculo / Tabla Genérica",
    descripcion: "Estructura tabular estándar con identificación de paciente y variables clínicas.",
  };
}

/**
 * Parsea un archivo de texto delimitado (CSV, TSV, ';' o tabulador).
 */
export function parsearDelimitado(texto: string): { headers: string[]; rows: Record<string, string>[] } {
  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length === 0) return { headers: [], rows: [] };

  // Detectar delimitador: coma, punto y coma, tabulador o barra vertical '|'
  const primeraLinea = lineas[0];
  const conteoComas = (primeraLinea.match(/,/g) || []).length;
  const conteoPuntoComa = (primeraLinea.match(/;/g) || []).length;
  const conteoTabs = (primeraLinea.match(/\t/g) || []).length;
  const conteoPipes = (primeraLinea.match(/\|/g) || []).length;

  let delim = ",";
  if (conteoTabs > conteoComas && conteoTabs > conteoPuntoComa) delim = "\t";
  else if (conteoPuntoComa >= conteoComas && conteoPuntoComa > conteoPipes) delim = ";";
  else if (conteoPipes > conteoComas) delim = "|";

  // Función para partir respetando comillas
  const splitLine = (l: string): string[] => {
    if (delim === "\t" || delim === "|") {
      return l.split(delim).map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    const regex = new RegExp(`(?:^|${delim})("(?:[^"]|"")*"|[^${delim}]*)`, "g");
    const matches: string[] = [];
    let m;
    while ((m = regex.exec(l)) !== null) {
      let val = m[1];
      if (val.startsWith(delim)) val = val.substring(1);
      val = val.trim().replace(/^"|"$/g, "").replace(/""/g, '"');
      matches.push(val);
    }
    return matches;
  };

  const rawHeaders = splitLine(lineas[0]);
  const headers = rawHeaders.map((h, i) => h || `Columna_${i + 1}`);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lineas.length; i++) {
    const vals = splitLine(lineas[i]);
    if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] !== undefined ? vals[idx].trim() : "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Convierte un valor "S/N" del SAS a booleano. Devuelve `undefined` (no
 * `false`) cuando el valor no es reconocible, para distinguir "la columna
 * dice que no" de "esta fila no trae esa columna".
 */
function parseSN(val: string | undefined): boolean | undefined {
  if (!val) return undefined;
  const v = val.trim().toUpperCase();
  if (v === "S" || v === "SI" || v === "1") return true;
  if (v === "N" || v === "NO" || v === "0") return false;
  return undefined;
}

/**
 * Convierte un número en formato español ("1,23") a number.
 */
function parseNum(val: string | number | null | undefined): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const s = String(val).trim().replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

/**
 * Normaliza y limpia un NUHSA andaluz (ej. "AN0123456789" o "0123456789").
 */
export function normalizarNUHSA(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (cleaned.startsWith("AN") || cleaned.startsWith("AN-")) {
    return cleaned.replace("-", "");
  }
  // Si son dígitos de longitud adecuada (10 a 12 dígitos)
  if (/^\d{9,12}$/.test(cleaned)) {
    return `AN${cleaned}`;
  }
  return cleaned;
}

/**
 * Mapea una fila según el formato detectado.
 */
export function mapearFila(
  row: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formato: FormatoSAS
): FilaProcesada | null {
  // Mapa de clave normalizada -> valor
  const normMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    normMap[normalizarHeader(k)] = v;
  }

  // `excluir`: columnas que contienen el candidato pero son de otro campo
  // (p. ej. "hemoglobina" aparece también en "Hemoglobina glicosilada").
  const buscar = (excluir: string[], candidates: string[]): string => {
    for (const c of candidates) {
      const normC = normalizarHeader(c);
      if (normMap[normC] !== undefined && normMap[normC] !== "") {
        return normMap[normC];
      }
      // Búsqueda por subcadena. Los nombres cortos (siglas como "lpa" o "hb")
      // aparecen por casualidad dentro de otras palabras ("edad del PAciente"
      // contiene "lpa"), así que solo valen al final de la columna, que es
      // donde el SAS pone las siglas ("Volumen corpuscular medio #VCM").
      for (const [k, v] of Object.entries(normMap)) {
        if (!v || excluir.some((e) => k.includes(e))) continue;
        if (normC.length >= 5 ? k.includes(normC) : k.endsWith(normC)) return v;
      }
    }
    return "";
  };
  const get = (...candidates: string[]): string => buscar([], candidates);

  const nuhsaRaw = get("nuhsa", "tarjetanusabdu", "nusa", "numdepaciente", "paciente", "historia");
  const nuhsa = normalizarNUHSA(nuhsaRaw);
  if (!nuhsa) return null;

  // Sexo
  const sexoRaw = get("sexo", "sexodelpaciente");
  let sexo: "H" | "M" | undefined = undefined;
  if (sexoRaw) {
    const s = sexoRaw.trim().toUpperCase();
    if (s.startsWith("H") || s.startsWith("MASC")) sexo = "H";
    else if (s.startsWith("M") || s.startsWith("FEM")) sexo = "M";
  }

  // Edad / Fecha nacimiento
  const edad: number | undefined = parseNum(get("edad", "edaddelpaciente", "edadconsumo"));
  let fechaNacimiento: Date | undefined = undefined;
  const fechaNacRaw = get("fechanacimiento", "fechanac");
  if (fechaNacRaw) {
    const d = new Date(fechaNacRaw);
    if (!isNaN(d.getTime())) fechaNacimiento = d;
  } else if (edad) {
    // Estimación de nacimiento aproximada para el año actual
    const anio = new Date().getFullYear() - edad;
    fechaNacimiento = new Date(`${anio}-06-15`);
  }

  // Datos organizativos SAS
  const centroSalud = get("desccap", "centro", "centrobdu", "cap", "ugc");
  const claveMedica = get("clavemedica", "clavemedicaespspacientebdu", "medico", "doctor");
  const claveEnfermeria = get("claveenfermeria", "enfermera");
  const claveEquipo = get("claveequipo", "equipo");
  const periodo = buscar(["nac"], ["periodo", "fecha"]) || new Date().getFullYear().toString();

  // Tratamiento / Farmacia
  const tratamiento = get("compofarma", "atc5n", "atc6n", "atcnivel4", "tratamiento");

  // Clínico
  const clinico: FilaProcesada["clinico"] = {};

  // Bioquímica / Renal
  clinico.creatinina = parseNum(get("creatininasuero", "creasuero", "creatinina"));
  clinico.fge = parseNum(get("filtradoglomerular", "fg", "fge"));
  clinico.cac = parseNum(get("albuminacreatininaorina", "albcrea", "cac"));
  clinico.potasio = parseNum(get("potasiok", "potasio"));

  // Glicada & Metabolismo
  clinico.hba1c = parseNum(get("hemoglobinaglicosiladaa1c", "hba1c", "a1c"));
  clinico.glucemiaBasal = parseNum(get("glucosaglu", "glucosa", "glucemiabasal"));
  clinico.tsh = parseNum(get("tirotropinatsh", "tsh"));

  // Cardiovascular
  clinico.colesterolTotal = parseNum(get("colesterolcol", "colesteroltotal", "colesterol"));
  clinico.cHDL = parseNum(get("colesteroldehdlhdl", "chdl", "hdl"));
  clinico.cLDL = parseNum(get("colesteroldeldlcalculadoldlc", "colesteroldeldl", "cldl", "ldl"));
  clinico.trigliceridos = parseNum(get("trigliceridos", "tg"));
  clinico.ntProBnp = parseNum(get("propeptidonatriureticocerebralprobnp", "probnp", "ntprobnp"));
  clinico.lpA = parseNum(get("lipoproteinaa", "lpa"));

  // Hematología / Anemia
  clinico.hb = parseNum(buscar(["glicosilada", "a1c", "corpuscular"], ["hemoglobina", "hb"]));
  clinico.vcm = parseNum(get("vcm"));
  clinico.hcm = parseNum(get("hbcm", "hcm"));
  clinico.chcm = parseNum(get("chcm"));
  clinico.plaquetas = parseNum(get("plaquetas"));
  clinico.ferritina = parseNum(get("ferritina"));
  clinico.ist = parseNum(get("ist"));
  clinico.vitaminaB12 = parseNum(get("vitb12", "vitaminab12"));
  clinico.acidoFolico = parseNum(get("afolico", "acidofolico"));
  clinico.pcr = parseNum(get("proteinacreactivapcr", "pcr"));

  // Infoweb: Pie & Retino
  const rBajo = get("riesgobajopd");
  const rMedio = get("riesgomediopd");
  const rAlto = get("riesgoaltopd");
  if (rAlto === "S" || rAlto === "SI" || rAlto === "1") clinico.riesgoPieDiabetico = "ALTO";
  else if (rMedio === "S" || rMedio === "SI" || rMedio === "1") clinico.riesgoPieDiabetico = "MEDIO";
  else if (rBajo === "S" || rBajo === "SI" || rBajo === "1") clinico.riesgoPieDiabetico = "BAJO";

  const retino = get("retino3anos", "retinografia");
  if (retino === "S" || retino === "SI" || retino === "1") clinico.retino3Anos = true;
  else if (retino === "N" || retino === "NO" || retino === "0") clinico.retino3Anos = false;

  const amp = get("pacamputado");
  if (amp === "S" || amp === "SI" || amp === "1") clinico.amputado = true;

  const pd = get("pacpiediabetico");
  if (pd === "S" || pd === "SI" || pd === "1") clinico.pieDiabetico = true;

  // Infoweb: situación funcional (riesgo de úlceras por presión)
  const inmovilizado = parseSN(get("pacinmovilizado"));
  const viveEnResidencia = parseSN(get("pacresidencia"));

  return {
    nuhsa,
    datosPaciente: {
      sexo: sexo || "H",
      edad,
      fechaNacimiento,
      centroSalud: centroSalud || undefined,
      claveMedica: claveMedica || undefined,
      claveEnfermeria: claveEnfermeria || undefined,
      claveEquipo: claveEquipo || undefined,
      tipoDiabetes: "TIPO_2",
      tratamientoDiabetes: tratamiento || undefined,
      inmovilizado,
      viveEnResidencia,
    },
    periodo,
    clinico,
    raw: row,
  };
}

/**
 * Función principal para procesar cualquier entrada tabular (texto, CSV o PDF extraído).
 */
export function procesarImportacion(
  headers: string[],
  rows: Record<string, string>[]
): ResultadoParseo {
  const { formato, nombreFormato, descripcion } = detectarFormatoSAS(headers);
  const advertencias: string[] = [];

  const filasMapeadas: FilaProcesada[] = [];
  for (const r of rows) {
    const f = mapearFila(r, formato);
    if (f) filasMapeadas.push(f);
  }

  if (filasMapeadas.length === 0 && rows.length > 0) {
    advertencias.push(
      "No se encontró la columna obligatoria de historia de salud (NUHSA o Tarjeta NUSA BDU) en las filas procesadas."
    );
  }

  return {
    formato,
    nombreFormato,
    descripcion,
    totalFilas: rows.length,
    filasValidas: filasMapeadas.length,
    columnasDetectadas: headers,
    filas: filasMapeadas,
    advertencias,
  };
}

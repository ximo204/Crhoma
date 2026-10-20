/**
 * Tipos compartidos del motor CRHOMA.
 *
 * CRHOMA es la "base" común de fórmulas, rangos y explicaciones clínicas.
 * Cualquier área (CODEAPA, y las que vengan después) consulta este motor
 * en vez de tener sus propios umbrales o cálculos duplicados.
 */

export type EstadoSemaforo = "bajo" | "normal" | "alto" | "muy-alto" | "sin-datos";

/** Tablas cuyo último registro puede editarse desde una casilla. */
export type TablaEditable =
  | "paciente"
  | "medicion"
  | "controlTA"
  | "controlGlicada"
  | "controlRenal"
  | "controlHepatico"
  | "exploracionPie"
  | "retinografia"
  | "complicaciones"
  | "controlCardiovascular"
  | "cribadoClaudicacion"
  | "controlMetabolico"
  | "controlAnemia"
  | "cribadoObesidad";

export type TipoEdicion =
  | "texto"
  /** Texto de varias líneas (p. ej. las notas del paciente). */
  | "textoLargo"
  | "numero"
  | "enum"
  | "fecha"
  | "booleano"
  | "booleanoTriEstado";

export interface OpcionEdicion {
  valor: string;
  texto: string;
}

/**
 * Describe cómo editar el valor en bruto que hay detrás de una casilla:
 * en qué tabla vive, qué fila y qué columna. Solo los campos introducidos
 * a mano llevan esto — los calculados (IMC, FIB-4...) no son editables
 * directamente, se edita su entrada (peso, ALT...).
 *
 * `registroId: null` significa que el paciente todavía no tiene ningún
 * registro en esa tabla — al guardar, en vez de actualizar una fila
 * existente se crea la primera. Así una casilla es editable desde el
 * primer momento, sin depender de haber "registrado una visita" antes.
 */
export interface EditableInfo {
  tabla: TablaEditable;
  registroId: string | null;
  campo: string;
  tipo: TipoEdicion;
  opciones?: OpcionEdicion[];
}

export interface EntradaUsada {
  /** Etiqueta legible del dato de entrada, ej. "Peso" */
  etiqueta: string;
  /** Valor tal cual se usó en el cálculo */
  valor: number | string;
  /** Unidad del valor, ej. "kg" */
  unidad?: string;
}

/**
 * Resultado de evaluar un campo (calculado o directo) contra el motor CRHOMA.
 * Es lo que alimenta la casilla clicable: valor mostrado, color, y la
 * explicación completa de "por qué" tiene ese valor.
 */
export interface ResultadoCampo {
  /** Identificador estable del campo, ej. "imc" */
  id: string;
  /** Etiqueta legible, ej. "IMC" */
  etiqueta: string;
  /** Valor final a mostrar en la casilla */
  valor: number | string | null;
  /** Unidad del valor mostrado, ej. "kg/m²" */
  unidad?: string;
  /** Color/semáforo de la casilla */
  estado: EstadoSemaforo;
  /** Texto corto de interpretación clínica, ej. "Obesidad grado I" */
  interpretacion?: string;
  /**
   * Si el campo es calculado (no introducido a mano), aquí va la fórmula
   * en texto y los valores de entrada usados, para poder explicarlo al
   * hacer clic en la casilla.
   */
  formula?: string;
  entradas?: EntradaUsada[];
  /** Rango normal de referencia, en texto, ej. "18,5–24,9 kg/m²" */
  rangoNormal?: string;
  /** Cita a la sección/documento de origen del criterio (trazabilidad) */
  fuente?: string;
  /** Notas adicionales (observaciones del documento CRHOMA) */
  observaciones?: string;
  /** Si está presente, la casilla se puede editar desde el propio modal. */
  editable?: EditableInfo;
}

/**
 * Helpers de lectura de FormData compartidos por las acciones de CODEAPA.
 * Devuelven `undefined` (no null) cuando el campo viene vacío, para poder
 * usar "?? " al construir los `data` de Prisma sin pisar valores existentes
 * por accidente.
 *
 * Nota: este archivo NO lleva "use server" — son funciones puras de
 * utilidad, no acciones invocables desde el cliente.
 */

export function texto(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string") return undefined;
  const limpio = v.trim();
  return limpio === "" ? undefined : limpio;
}

export function textoComoEnum<T extends string>(formData: FormData, key: string): T | undefined {
  return texto(formData, key) as T | undefined;
}

export function numero(formData: FormData, key: string): number | undefined {
  const v = texto(formData, key);
  if (v === undefined) return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function fecha(formData: FormData, key: string): Date | undefined {
  const v = texto(formData, key);
  if (v === undefined) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Select de 3 estados: "si" -> true, "no" -> false, vacío -> undefined (no tocar). */
export function triEstado(formData: FormData, key: string): boolean | undefined {
  const v = texto(formData, key);
  if (v === "si") return true;
  if (v === "no") return false;
  return undefined;
}

"use client";

/**
 * Redimensiona y comprime una foto en el propio navegador antes de subirla.
 *
 * Una foto de móvil sin tocar pesa varios MB; como se guarda como blob
 * dentro de la base SQLite (ver schema.prisma, modelo FotoHerida), conviene
 * dejarla en unos cientos de KB. No se usa ninguna librería de imagen en el
 * servidor (`sharp` da problemas al empaquetar la app de escritorio — ver
 * memoria del proyecto), así que todo el trabajo pesado pasa aquí, con
 * `<canvas>`, que ya trae el navegador.
 */
export async function comprimirImagen(
  archivo: File,
  { ladoMaximoPx = 1600, calidad = 0.82 }: { ladoMaximoPx?: number; calidad?: number } = {}
): Promise<File> {
  const bitmap = await createImageBitmap(archivo);

  let { width, height } = bitmap;
  if (width > ladoMaximoPx || height > ladoMaximoPx) {
    const escala = ladoMaximoPx / Math.max(width, height);
    width = Math.round(width * escala);
    height = Math.round(height * escala);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return archivo; // Navegador sin soporte de canvas 2D: se sube el original.

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
  if (!blob) return archivo;

  const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], nombre, { type: "image/jpeg" });
}

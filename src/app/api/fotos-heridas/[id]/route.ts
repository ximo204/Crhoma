import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Sirve el blob de una fotografía de herida guardada en la base de datos.
 *
 * No va por `public/` porque las fotos de pacientes no son un activo
 * estático del sitio: viven en SQLite, igual que el resto de datos clínicos,
 * para que la copia de seguridad siga siendo "copiar un único archivo .db".
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const foto = await prisma.fotoHerida.findUnique({
    where: { id },
    select: { datos: true, tipoMime: true },
  });

  if (!foto) {
    return new NextResponse("Foto no encontrada", { status: 404 });
  }

  return new NextResponse(new Uint8Array(foto.datos), {
    headers: {
      "Content-Type": foto.tipoMime,
      // Local y de solo lectura (nunca cambia una vez subida): cachear fuerte.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Actualización de bases de datos ya instaladas.
//
// La aplicación de escritorio copia la base vacía (prisma/plantilla.db) solo
// la primera vez que se abre; después el usuario conserva la suya, con sus
// pacientes. Si una versión nueva añade un campo al esquema, esa base no lo
// tiene y Prisma fallaría al leer pacientes. Aquí se añaden las columnas que
// falten, sin tocar los datos. Se ejecuta al arrancar el servidor (ver
// src/instrumentation.ts), antes de atender ninguna petición.
//
// Al añadir un campo nuevo a un modelo existente en schema.prisma, añádelo
// también a esta lista (solo columnas opcionales o con valor por defecto).
// ---------------------------------------------------------------------------

const COLUMNAS_NUEVAS: { tabla: string; columna: string; tipoSql: string }[] = [
  { tabla: "Paciente", columna: "notas", tipoSql: "TEXT" },
];

export async function actualizarBaseDatos() {
  for (const { tabla, columna, tipoSql } of COLUMNAS_NUEVAS) {
    const columnas = await prisma.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${tabla}")`);
    // Tabla inexistente: base vacía o ajena; no es cosa de esta actualización.
    if (columnas.length === 0 || columnas.some((c) => c.name === columna)) continue;
    await prisma.$executeRawUnsafe(`ALTER TABLE "${tabla}" ADD COLUMN "${columna}" ${tipoSql}`);
    console.log(`[base de datos] añadida la columna ${tabla}.${columna}`);
  }
}

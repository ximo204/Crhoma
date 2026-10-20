import { PrismaClient } from "@/generated/prisma";

// Patrón estándar de Next.js: en desarrollo, el hot-reload puede crear
// múltiples instancias de PrismaClient y agotar las conexiones a la BD.
// Guardamos una única instancia en `globalThis` y la reutilizamos.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

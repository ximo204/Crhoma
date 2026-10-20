/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera en .next/standalone un servidor que ya incluye sus dependencias.
  // Es lo que arranca la aplicación de escritorio (ver electron/main.js), y
  // permite empaquetarla sin depender de que haya Node instalado en el equipo.
  output: "standalone",

  experimental: {
    // Activa src/instrumentation.ts: al arrancar se actualiza la base de datos
    // del usuario si a su esquema le faltan columnas nuevas.
    instrumentationHook: true,
    // El motor de consultas de Prisma es un binario nativo: hay que copiarlo
    // tal cual al paquete en vez de intentar empaquetarlo con el resto.
    // (En Next 14 esta opción va dentro de `experimental`; fuera se ignora.)
    outputFileTracingIncludes: {
      "/**": ["./src/generated/prisma/**"],
    },
    // El rastreo de archivos de Next arrastraba al servidor carpetas del
    // proyecto que no usa (entre ellas los propios instaladores ya generados).
    outputFileTracingExcludes: {
      "/**": ["./dist-escritorio/**", "./electron/**", "./build/**", "./scripts/**", "./.git/**"],
    },
    serverActions: {
      // Por defecto Next rechaza cuerpos de más de 1 MB, y en producción solo
      // muestra un error genérico. El importador ya envía por lotes; esto es
      // margen para lotes con muchas columnas o fotos grandes.
      bodySizeLimit: "25mb",
    },
  },

  images: {
    // Los logos son archivos locales y pequeños: no hay nada que optimizar.
    // Además, optimizarlos exigiría empaquetar `sharp` (binario nativo por
    // plataforma), que en la aplicación de escritorio solo añade peso y fallos.
    unoptimized: true,
  },
};

export default nextConfig;

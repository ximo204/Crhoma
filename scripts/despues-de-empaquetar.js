/**
 * Hook `afterPack` de electron-builder: se ejecuta con cada paquete ya
 * montado y antes de crear el instalador.
 *
 * El servidor lleva el motor de consultas de Prisma de todas las plataformas
 * (ver binaryTargets en prisma/schema.prisma), ~20 MB cada uno. Aquí se deja
 * solo el que usa este paquete y se borra el resto.
 */
const fs = require("fs");
const path = require("path");

// Valores del enum Arch de electron-builder.
const ARCH = { 1: "x64", 3: "arm64" };

const MOTOR = {
  "win32-x64": "query_engine-windows.dll.node",
  "darwin-x64": "libquery_engine-darwin.dylib.node",
  "darwin-arm64": "libquery_engine-darwin-arm64.dylib.node",
  "linux-x64": "libquery_engine-debian-openssl-3.0.x.so.node",
};

exports.default = async function despuesDeEmpaquetar(context) {
  const plataforma = context.electronPlatformName;
  const clave = `${plataforma}-${ARCH[context.arch]}`;
  const necesario = MOTOR[clave];
  if (!necesario) throw new Error(`No hay motor de Prisma definido para ${clave}`);

  const recursos =
    plataforma === "darwin"
      ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, "Contents", "Resources")
      : path.join(context.appOutDir, "resources");
  const carpeta = path.join(recursos, "server", "src", "generated", "prisma");

  if (!fs.existsSync(path.join(carpeta, necesario))) {
    throw new Error(`Falta el motor de Prisma para ${clave}: ${necesario}`);
  }
  for (const archivo of fs.readdirSync(carpeta)) {
    if (/query_engine/.test(archivo) && archivo !== necesario) {
      fs.rmSync(path.join(carpeta, archivo));
    }
  }
  console.log(`  • motor de Prisma para ${clave}: solo ${necesario}`);
};

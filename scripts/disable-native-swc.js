// En algunos entornos WSL2 (ver README, sección "Problemas conocidos") el
// binario nativo del compilador de Next.js (SWC) provoca un "Bus error" al
// cargarse, porque el sistema limita a 64MB la memoria que un proceso puede
// bloquear (RLIMIT_MEMLOCK) y ese límite no se puede subir de forma fiable
// en WSL2.
//
// Este script borra los paquetes nativos de SWC después de cada
// `npm install`, para que Next.js use en su lugar la versión en
// WebAssembly (@next/swc-wasm-nodejs), que no tiene ese problema. Es más
// lento, pero funciona.
//
// Solo se aplica en WSL2: en cualquier otro Linux (incluidos los
// contenedores de build de Vercel) esta limitación no existe, y el binario
// nativo es bastante más rápido — así que ahí lo dejamos intacto.
const fs = require("fs");
const os = require("os");
const path = require("path");

const esWSL2 = os.release().toLowerCase().includes("microsoft");

if (!esWSL2) {
  console.log("[disable-native-swc] No es WSL2 — se mantiene el compilador nativo (más rápido).");
  process.exit(0);
}

const paquetesNativos = ["@next/swc-linux-x64-gnu", "@next/swc-linux-x64-musl"];

for (const paquete of paquetesNativos) {
  const ruta = path.join(__dirname, "..", "node_modules", paquete);
  if (fs.existsSync(ruta)) {
    fs.rmSync(ruta, { recursive: true, force: true });
    console.log(`[disable-native-swc] Eliminado ${paquete} (evita el Bus error en WSL2)`);
  }
}

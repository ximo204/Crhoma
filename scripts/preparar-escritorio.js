/**
 * Deja listo el resultado de `next build` para empaquetarlo como aplicación
 * de escritorio.
 *
 * `output: "standalone"` genera el servidor y sus dependencias, pero por
 * diseño no copia ni los recursos estáticos ni la carpeta public. Además hace
 * falta una base de datos vacía con el esquema ya aplicado, que se copiará a
 * la carpeta del usuario la primera vez que abra la aplicación.
 *
 *   node scripts/preparar-escritorio.js
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const raiz = path.join(__dirname, "..");
const standalone = path.join(raiz, ".next", "standalone");

function abortar(mensaje) {
  console.error(`\n✗ ${mensaje}\n`);
  process.exit(1);
}

if (!fs.existsSync(path.join(standalone, "server.js"))) {
  abortar(
    "No existe .next/standalone/server.js.\n" +
      "  Ejecuta primero `npm run build` (con output: \"standalone\" en next.config.mjs)."
  );
}

// 1. Recursos estáticos que el servidor autónomo espera encontrar a su lado
const copias = [
  { desde: path.join(raiz, ".next", "static"), hasta: path.join(standalone, ".next", "static") },
  { desde: path.join(raiz, "public"), hasta: path.join(standalone, "public") },
];

for (const { desde, hasta } of copias) {
  if (!fs.existsSync(desde)) {
    abortar(`No se encuentra ${path.relative(raiz, desde)}.`);
  }
  fs.rmSync(hasta, { recursive: true, force: true });
  fs.cpSync(desde, hasta, { recursive: true });
  console.log(`✓ Copiado ${path.relative(raiz, desde)} → ${path.relative(raiz, hasta)}`);
}

// 2. Fuera lo que el servidor empaquetado no necesita:
//    - .env y prisma/: configuración de desarrollo (la aplicación de escritorio
//      le pasa DATABASE_URL al arrancar el servidor, ver electron/main.js);
//    - el motor WASM/edge de Prisma: solo sirve para entornos edge; en Node se
//      usa el motor nativo (que se recorta por plataforma en scripts/despues-de-empaquetar.js).
const sobrantes = [
  ".env",
  "prisma",
  "dist-escritorio",
  "src/generated/prisma/query_engine_bg.js",
  "src/generated/prisma/query_engine_bg.wasm",
  "src/generated/prisma/wasm.js",
  "src/generated/prisma/wasm.d.ts",
  "src/generated/prisma/wasm-edge-light-loader.mjs",
  "src/generated/prisma/wasm-worker-loader.mjs",
  "src/generated/prisma/edge.js",
  "src/generated/prisma/edge.d.ts",
];
for (const rel of sobrantes) fs.rmSync(path.join(standalone, rel), { recursive: true, force: true });
console.log("✓ Quitados del servidor los archivos de desarrollo y el motor WASM de Prisma");

// 3. Base de datos vacía con el esquema actual.
//    Se regenera en cada build para que nunca quede desfasada del schema.
const plantilla = path.join(raiz, "prisma", "plantilla.db");
fs.rmSync(plantilla, { force: true });

try {
  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
    {
      cwd: raiz,
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: `file:${plantilla}` },
    }
  );
} catch (error) {
  const salida = [error.stdout, error.stderr].filter(Boolean).join("\n");
  abortar(`No se ha podido crear la base de datos inicial:\n${salida}`);
}

if (!fs.existsSync(plantilla)) {
  abortar("Prisma no ha creado prisma/plantilla.db.");
}

const kb = (fs.statSync(plantilla).size / 1024).toFixed(0);
console.log(`✓ Base de datos inicial vacía creada: prisma/plantilla.db (${kb} KB)`);

console.log("\nListo. Ya se puede empaquetar con `npm run dist:win` o `npm run dist:mac`.\n");

/**
 * Genera el icono de la aplicación (build/icon.png) sin dependencias externas.
 *
 * electron-builder parte de este PNG para producir el .ico de Windows y el
 * .icns de macOS, así que basta con un único archivo cuadrado grande.
 *
 * El dibujo reproduce la identidad de logo_codeapa.svg: cuadrado redondeado
 * en azul con la línea de pulso en blanco y el punto verde. Se rasteriza con
 * funciones de distancia (SDF) para que los bordes salgan suavizados sin
 * necesidad de una librería de imagen.
 *
 *   node scripts/generar-icono.js [tamaño]
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const TAMANO = Number(process.argv[2]) || 512;

// ---------------------------------------------------------------------------
// Utilidades de geometría (funciones de distancia con signo)
// ---------------------------------------------------------------------------

/** Distancia a un rectángulo redondeado centrado en (cx, cy). */
function sdfRectRedondeado(px, py, cx, cy, mitadAncho, mitadAlto, radio) {
  const qx = Math.abs(px - cx) - (mitadAncho - radio);
  const qy = Math.abs(py - cy) - (mitadAlto - radio);
  const fueraX = Math.max(qx, 0);
  const fueraY = Math.max(qy, 0);
  return (
    Math.hypot(fueraX, fueraY) + Math.min(Math.max(qx, qy), 0) - radio
  );
}

/** Distancia al segmento (ax,ay)-(bx,by) engrosado `grosor`. */
function sdfSegmento(px, py, ax, ay, bx, by, grosor) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const longitud2 = bax * bax + bay * bay;
  let h = longitud2 === 0 ? 0 : (pax * bax + pay * bay) / longitud2;
  h = Math.max(0, Math.min(1, h));
  return Math.hypot(pax - bax * h, pay - bay * h) - grosor;
}

function sdfCirculo(px, py, cx, cy, radio) {
  return Math.hypot(px - cx, py - cy) - radio;
}

/** Cobertura del pixel a partir de la distancia: 1 dentro, 0 fuera, suave en el borde. */
function cobertura(distancia) {
  return Math.max(0, Math.min(1, 0.5 - distancia));
}

/** Mezcla `color` sobre `destino` con opacidad `alfa` (todo 0..255). */
function mezclar(destino, indice, r, g, b, alfa) {
  if (alfa <= 0) return;
  const inversa = 1 - alfa;
  destino[indice] = Math.round(r * alfa + destino[indice] * inversa);
  destino[indice + 1] = Math.round(g * alfa + destino[indice + 1] * inversa);
  destino[indice + 2] = Math.round(b * alfa + destino[indice + 2] * inversa);
  destino[indice + 3] = Math.round(255 * alfa + destino[indice + 3] * inversa);
}

// ---------------------------------------------------------------------------
// Dibujo del icono
// ---------------------------------------------------------------------------

function dibujar(tamano) {
  const pixeles = Buffer.alloc(tamano * tamano * 4, 0); // RGBA transparente
  const e = tamano / 64; // escala: el diseño se define sobre una rejilla de 64

  const centro = tamano / 2;
  const mitad = 30 * e;
  const radio = 14 * e;

  // Línea de pulso, en coordenadas de la rejilla de 64
  const pulso = [
    [10, 34],
    [20, 34],
    [25, 22],
    [32, 46],
    [38, 26],
    [43, 36],
    [46, 34],
    [54, 34],
  ].map(([x, y]) => [x * e, y * e]);
  const grosorPulso = 2.6 * e;

  for (let y = 0; y < tamano; y++) {
    for (let x = 0; x < tamano; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const indice = (y * tamano + x) * 4;

      // 1. Fondo: cuadrado redondeado con degradado azul en diagonal
      const dFondo = sdfRectRedondeado(px, py, centro, centro, mitad, mitad, radio);
      const alfaFondo = cobertura(dFondo);
      if (alfaFondo > 0) {
        const t = Math.max(0, Math.min(1, (px + py) / (2 * tamano)));
        const r = Math.round(2 + (3 - 2) * t);
        const g = Math.round(132 + (105 - 132) * t);
        const b = Math.round(199 + (161 - 199) * t);
        mezclar(pixeles, indice, r, g, b, alfaFondo);
      }

      // Todo lo demás queda recortado al fondo
      if (alfaFondo <= 0) continue;
      const recorte = alfaFondo;

      // 2. Línea de pulso en blanco
      let dPulso = Infinity;
      for (let i = 0; i < pulso.length - 1; i++) {
        const [ax, ay] = pulso[i];
        const [bx, by] = pulso[i + 1];
        dPulso = Math.min(dPulso, sdfSegmento(px, py, ax, ay, bx, by, grosorPulso));
      }
      mezclar(pixeles, indice, 255, 255, 255, cobertura(dPulso) * recorte);

      // 3. Punto verde (glucosa) arriba a la derecha
      const dPunto = sdfCirculo(px, py, 46.5 * e, 19 * e, 5.2 * e);
      mezclar(pixeles, indice, 52, 211, 153, cobertura(dPunto) * recorte);
    }
  }

  return pixeles;
}

// ---------------------------------------------------------------------------
// Codificación PNG
// ---------------------------------------------------------------------------

function trozoPNG(tipo, datos) {
  const longitud = Buffer.alloc(4);
  longitud.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo) >>> 0, 0);
  return Buffer.concat([longitud, cuerpo, crc]);
}

const TABLA_CRC = (() => {
  const tabla = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c;
  }
  return tabla;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    c = TABLA_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

function codificarPNG(pixeles, tamano) {
  // Cada fila lleva delante un byte de tipo de filtro (0 = sin filtro)
  const enBruto = Buffer.alloc(tamano * (tamano * 4 + 1));
  for (let y = 0; y < tamano; y++) {
    const destino = y * (tamano * 4 + 1);
    enBruto[destino] = 0;
    pixeles.copy(enBruto, destino + 1, y * tamano * 4, (y + 1) * tamano * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamano, 0);
  ihdr.writeUInt32BE(tamano, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozoPNG("IHDR", ihdr),
    trozoPNG("IDAT", zlib.deflateSync(enBruto, { level: 9 })),
    trozoPNG("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------

const destino = path.join(__dirname, "..", "build", "icon.png");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, codificarPNG(dibujar(TAMANO), TAMANO));
console.log(`Icono generado: build/icon.png (${TAMANO}x${TAMANO})`);

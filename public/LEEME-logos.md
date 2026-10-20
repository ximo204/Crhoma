# Logos de la aplicación

Todos los logos viven en esta carpeta (`public/`) y se referencian desde el
código con una ruta que empieza por `/`, por ejemplo `/logo_codeapa.svg`.

## Logos en uso

| Archivo | Dónde se usa | Origen |
|---|---|---|
| `logo_junta_andalucia.png` | Franja institucional del encabezado — Junta de Andalucía | Logos institucionales facilitados por el Área |
| `logo_ags_cge.png` | Franja institucional del encabezado — AGS Campo de Gibraltar Este | Logos institucionales facilitados por el Área |
| `logo_codeapa.svg` | Portada — módulo CODEAPA (Control de Diabetes en Atención Primaria de Andalucía) | Diseñado para la app |
| `logo_cuseapa.svg` | Portada y página del módulo — CUSEAPA (Cuidado y Seguimiento de Heridas en Atención Primaria de Andalucía) | Diseñado para la app |

Los dos logos son de la misma familia: lienzo de **280 × 80**, el mismo
escudo (azul con pulso en CODEAPA, verde con apósito en CUSEAPA), la misma
tipografía y el lema en dos líneas a la derecha. Si se cambia uno, conviene
mantener esas proporciones en el otro.

Para sustituir un logo basta con sobrescribir su archivo (SVG con fondo
transparente y mismas proporciones). No hace falta tocar código.

`logo_agscge_round.png` es el logo redondo del Área que aparece en la cabecera
(`src/components/layout/HeaderSAS.tsx`).

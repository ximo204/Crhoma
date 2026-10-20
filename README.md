# CODEAPA · CUSEAPA

Aplicación de escritorio para el **seguimiento clínico de pacientes en Atención Primaria**, pensada para las consultas de Enfermería. Tiene dos módulos:

- **CODEAPA**: control de la diabetes (glucemia, TA, función renal y hepática, pie diabético, retinografía, riesgo cardiovascular, complicaciones...).
- **CUSEAPA**: seguimiento de heridas crónicas complejas, con valoraciones periódicas y fotos.

Funciona en local, sin servidor ni conexión a internet. Los datos de los pacientes no salen del equipo.

> Los datos que incluye el repositorio (`prisma/seed.ts`) son **ficticios**.

## Qué tiene de interesante

- **Motor clínico CRHOMA** (`src/lib/crhoma`). Recoge las fórmulas y clasificaciones del documento CRHOMA (IMC, índice cintura/altura, filtrado glomerular, riesgo de pie diabético, semáforos de control...) como funciones puras. Cada resultado incluye el valor, el estado del semáforo (bajo, normal, alto, muy alto, sin datos), la fórmula y los datos de entrada que se han usado.
- **Fichas que se explican solas.** Al hacer clic en cualquier casilla calculada se ve cómo se ha obtenido. Si el valor se introdujo a mano, se ve cuándo se registró. En la base de datos **solo se guardan valores en bruto**: todo lo derivado se calcula al vuelo, así que nunca queda desfasado.
- **Importador por lotes** (`src/lib/importer`) de los informes de origen (INFOWEB, FARMA, laboratorio), pegados desde Excel o CSV. Procesa en lotes de 200 filas con una transacción por lote.
- **Gráficos en SVG hechos a mano** (`src/components/charts`): líneas de tendencia, barras y donut, sin librerías de gráficos.
- **Aplicación de escritorio con Electron** (`electron/main.js`). Arranca el servidor *standalone* de Next.js con el Node que trae Electron y guarda la base de datos en la carpeta de datos del usuario. Al arrancar, actualiza el esquema de las bases ya instaladas (`src/lib/actualizarBaseDatos.ts`).
- **CI con GitHub Actions** (`.github/workflows/construir-escritorio.yml`) que genera los instaladores de Windows, macOS y Linux, cada uno en su propio sistema.

## Tecnologías

Next.js 14 (App Router, Server Actions) · React 18 · TypeScript · Tailwind CSS · Prisma + SQLite · Electron · electron-builder

## Estructura

```
src/
├── app/                 Rutas (pacientes, ficha, heridas, importar) y API de fotos
├── components/
│   ├── codeapa/         Tabla de pacientes, ficha, filtros, estadísticas y modales clínicos
│   ├── charts/          Gráficos SVG
│   ├── layout/ ui/      Cabecera y componentes de formulario
├── lib/
│   ├── crhoma/          Motor de fórmulas y rangos (común a todos los módulos)
│   ├── codeapa/         Lógica del módulo de diabetes y server actions
│   ├── heridas/         Lógica del módulo de heridas (CUSEAPA)
│   ├── importer/        Parser e importación por lotes
│   └── charts/          Paleta de colores de los gráficos
prisma/                  Esquema de la base de datos y datos de ejemplo
electron/                Proceso principal de la app de escritorio
scripts/                 Preparación del empaquetado, icono y ajustes de instalación
```

## Arrancar en desarrollo

Requiere Node.js 18 o superior.

```bash
npm install
cp .env.example .env
npm run db:push      # crea prisma/dev.db con el esquema actual
npm run db:seed      # carga los pacientes de ejemplo
npm run dev
```

Abre <http://localhost:3000>.

Otros scripts útiles:

| Script | Qué hace |
|---|---|
| `npm run db:studio` | Abre Prisma Studio para ver y editar los datos |
| `npm run lint` | ESLint |
| `npm run desktop:probar` | Abre la app en Electron (antes, `npm run desktop:preparar`) |
| `npm run dist:win` / `dist:mac` / `dist:linux` | Genera los instaladores en `dist-escritorio/` |

Cómo se generan y distribuyen los instaladores: [DISTRIBUCION.md](DISTRIBUCION.md).

## Notas

- **WSL2 y "Bus error".** En algunos WSL2 el compilador nativo de Next.js (SWC) no llega a cargar por el límite de memoria bloqueable. Por eso `scripts/disable-native-swc.js` se ejecuta en el `postinstall` y fuerza la versión WebAssembly de SWC.
- **Privacidad.** `.gitignore` excluye cualquier `*.db`, las copias de seguridad y los instaladores generados. La base de datos real nunca debe subirse al repositorio.

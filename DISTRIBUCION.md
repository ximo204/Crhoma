# Cómo generar la aplicación de escritorio

CODEAPA se empaqueta con **Electron**: el resultado es un programa normal de
escritorio, con su icono y su acceso directo, que no necesita navegador ni
tener Node.js instalado en el ordenador de destino.

---

## Qué produce cada plataforma

| Plataforma | Comando | Resultado en `dist-escritorio/` |
|---|---|---|
| **Windows** | `npm run dist:win` | `CODEAPA-0.1.0-x64-exe.exe` (instalador) y `CODEAPA-0.1.0-portable.exe` (ejecutable suelto, sin instalar) |
| **macOS** | `npm run dist:mac` | `CODEAPA-0.1.0-x64.dmg` / `CODEAPA-0.1.0-arm64.dmg` (instaladores) y `CODEAPA-0.1.0-x64.zip` / `CODEAPA-0.1.0-arm64.zip` (ejecutable suelto, sin instalar) |
| **Linux** | `npm run dist:linux` | `CODEAPA-0.1.0.AppImage` |

El **portable** (Windows) y el **.zip** (macOS) son la app suelta: se copian a
una carpeta o a un USB y se abren con doble clic, sin instalación ni permisos
de administrador.

En macOS hacen falta **dos** archivos, uno por tipo de chip — no hay forma de
saber de antemano cuál usa el ordenador del cliente sin preguntarlo, así que
lo más simple es llevar los dos:

| Archivo | Para qué Mac |
|---|---|
| `CODEAPA-0.1.0-x64.*` | Mac con procesador **Intel** (todos los Mac de antes de 2020–2021, aprox.) |
| `CODEAPA-0.1.0-arm64.*` | Mac con procesador **Apple Silicon** (M1, M2, M3, M4…) |

Se comprueba en  → **Acerca de este Mac**: si pone "Chip Apple M…" es arm64; si
pone "Procesador Intel…" es x64.

---

## Regla importante: cada sistema se empaqueta en su propio sistema

Esto no es una limitación de CODEAPA, sino de cómo funciona el empaquetado:

- El `.exe` de Windows hay que generarlo **en Windows** (o en Linux con Wine
  instalado).
- El **instalador `.dmg`** de macOS hay que generarlo **en un Mac** — Apple no
  permite crear ese formato fuera de macOS, ni con Wine ni con nada parecido.
- El **`.zip`** de macOS (la app suelta, sin instalar) sí se puede generar
  desde Linux, porque no necesita ninguna herramienta exclusiva de Apple. Es
  lo que se ha hecho para esta entrega: los dos `.zip` de `entregable/` están
  generados, comprobados y listos para usar ya mismo, sin necesitar un Mac.

---

## Windows (prioritario)

### Opción A — Compilar en Windows (recomendada)

Es la vía más fiable. Hace falta [Node.js 18 o superior](https://nodejs.org)
instalado en Windows.

1. Copia el proyecto a una carpeta de Windows, por ejemplo `C:\CODEAPA`.

   > Si el proyecto está dentro de WSL, **cópialo** a una carpeta de Windows en
   > lugar de compilar directamente sobre `\\wsl$\...`: por la red es muy lento
   > y a veces falla al escribir los binarios.
   >
   > Desde WSL:
   > ```bash
   > cp -r ~/Codeapa /mnt/c/CODEAPA
   > ```

2. Borra lo que sea específico de Linux, para que se reinstale limpio:

   ```powershell
   cd C:\CODEAPA
   rmdir /s /q node_modules
   rmdir /s /q .next
   ```

3. Instala y compila:

   ```powershell
   npm install
   npm run dist:win
   ```

4. El instalador y el portable quedan en `C:\CODEAPA\dist-escritorio\`.

### Opción B — Compilar desde WSL/Linux con Wine

Permite generar el `.exe` sin salir de Linux.

```bash
sudo apt update && sudo apt install -y wine
npm run dist:win
```

Wine solo se usa para estampar el icono y los datos de versión dentro del
`.exe`; el programa resultante es un ejecutable de Windows normal.

### Opción C — Compilar en GitHub Actions

Si el proyecto está en GitHub, el flujo de trabajo incluido en
`.github/workflows/construir-escritorio.yml` genera el `.exe` en un servidor
Windows y lo deja como artefacto descargable. Se lanza a mano desde la pestaña
**Actions** del repositorio.

> Ten en cuenta que esto sube el código del proyecto a GitHub. La base de datos
> con los pacientes **no** se sube: está excluida en `.gitignore`.

---

## macOS

### Ya disponible: la app suelta (`.zip`), sin necesidad de un Mac

En `entregable/` hay dos archivos ya generados y comprobados:

- `CODEAPA-0.1.0-mac-Intel.zip`
- `CODEAPA-0.1.0-mac-AppleSilicon.zip`

Para usarlos en el Mac de destino:

1. Copia el `.zip` que corresponda (USB, o lo que resulte más cómodo).
2. Doble clic para descomprimirlo: aparece `CODEAPA.app`.
3. Arrastra `CODEAPA.app` a la carpeta **Aplicaciones**.
4. Primera apertura: **clic derecho sobre la app → Abrir → Abrir** (en vez de
   doble clic normal). Es el mismo tipo de aviso que el SmartScreen de
   Windows: la app no lleva un certificado de pago de Apple. Solo hace falta
   hacerlo así la primera vez.

> **Si en vez del aviso normal aparece "CODEAPA está dañado y no se puede
> abrir"**: no está dañado — es Gatekeeper siendo más estricto con apps sin
> firmar que con otras sin certificado. Se arregla desde la Terminal del Mac,
> una sola vez:
> ```bash
> xattr -cr /Applications/CODEAPA.app
> ```
> y se vuelve a abrir con clic derecho → Abrir.

### Generar el instalador `.dmg` (requiere un Mac real)

El `.dmg` es el único paso que de verdad no se puede hacer desde Linux ni
Windows — Apple reserva la herramienta que lo crea (`hdiutil`) a macOS. En un
Mac, con Node.js instalado:

```bash
npm install
npm run dist:mac
```

Esto genera **a la vez** los dos `.dmg` (uno por tipo de chip) y los dos `.zip`
en `dist-escritorio/`. El primer arranque del `.dmg` instalado avisa igual que
el `.zip` — clic derecho → Abrir la primera vez.

### Compilar en GitHub Actions (alternativa sin tener un Mac a mano)

El flujo `.github/workflows/construir-escritorio.yml` incluye un trabajo de
macOS que, si se lanza con la opción "windows-y-mac" o "todos", compila en un
Mac real en la nube de GitHub y deja el `.dmg` y el `.zip` como artefacto
descargable. Útil si no tienes acceso físico a un Mac.

---

## Dónde se guardan los datos de los pacientes

La base de datos **nunca** se guarda junto al programa, porque esa carpeta es de
solo lectura una vez instalado. Vive en la carpeta de datos del usuario:

| Sistema | Ruta |
|---|---|
| Windows | `C:\Users\<usuario>\AppData\Roaming\codeapa-app\codeapa.db` |
| macOS | `~/Library/Application Support/codeapa-app/codeapa.db` |
| Linux | `~/.config/codeapa-app/codeapa.db` |

Desde la propia aplicación: menú **Archivo → Abrir la carpeta de mis datos**.

Consecuencias prácticas:

- **La primera vez** que se abre, la aplicación crea una base vacía. No trae
  pacientes de ejemplo.
- **Actualizar** la aplicación (instalar una versión nueva encima) **no borra
  los datos**, porque están fuera de la carpeta del programa.
- **Copia de seguridad**: basta con copiar ese único archivo `.db` a un lugar
  seguro. Para restaurar, se vuelve a poner en su sitio con la aplicación
  cerrada.

---

## Detalles de funcionamiento

- Al abrirse, la aplicación levanta su propio servidor en un puerto libre de
  `127.0.0.1`. No queda accesible desde la red: solo desde ese ordenador.
- Solo se permite **una ventana a la vez**. Si se intenta abrir de nuevo, se
  trae al frente la que ya estaba, para evitar que dos procesos escriban a la
  vez en la misma base de datos.
- El motor de consultas de Prisma es un binario distinto por sistema operativo.
  Los cuatro (Windows, macOS Intel, macOS ARM y Linux) se generan mediante
  `binaryTargets` en `prisma/schema.prisma` y viajan dentro del paquete.

---

## Si algo falla

**«No se encuentra el servidor en…»**
Falta compilar. Ejecuta `npm run desktop:preparar` antes de empaquetar (los
comandos `dist:*` ya lo hacen por su cuenta).

**«wine is required» al hacer `dist:win` desde Linux**
Es la Opción B: instala Wine, o compila en Windows (Opción A).

**Windows Defender o SmartScreen avisan al abrir el `.exe`**
Ocurre con cualquier programa sin firma digital de pago. Pulsa
**Más información → Ejecutar de todas formas**. Para quitarlo definitivamente
haría falta un certificado de firma de código.

**La ventana se queda en blanco**
La aplicación muestra un aviso si el servidor interno no arranca. Si aparece
en blanco sin aviso, abre **Ver → Herramientas de desarrollo** y mira la
pestaña *Console*.

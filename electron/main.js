/**
 * Proceso principal de la aplicación de escritorio.
 *
 * CODEAPA es por dentro una aplicación web con servidor (Next.js + Prisma),
 * así que el arranque tiene tres pasos:
 *
 *   1. Asegurar que la base de datos del usuario existe y es escribible.
 *      Dentro del paquete instalado los archivos son de solo lectura, así que
 *      la base vive en la carpeta de datos del usuario, no junto al programa.
 *   2. Levantar el servidor de Next.js en un puerto libre de localhost,
 *      usando el Node que ya trae Electron (no hace falta instalar Node).
 *   3. Abrir la ventana apuntando a ese servidor.
 */
const { app, BrowserWindow, dialog, shell, Menu } = require("electron");
const { fork } = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");

const esDesarrollo = !app.isPackaged;

/** Carpeta que contiene el servidor de Next.js ya compilado. */
function carpetaServidor() {
  return esDesarrollo
    ? path.join(__dirname, "..", ".next", "standalone")
    : path.join(process.resourcesPath, "server");
}

/** Base de datos vacía de referencia, con el esquema ya aplicado. */
function plantillaBaseDatos() {
  return esDesarrollo
    ? path.join(__dirname, "..", "prisma", "plantilla.db")
    : path.join(process.resourcesPath, "plantilla.db");
}

/**
 * Ruta definitiva de la base de datos del usuario.
 *
 * Se guarda en la carpeta de datos de la aplicación para que sobreviva a las
 * actualizaciones del programa y no dependa de permisos de escritura en
 * "Archivos de programa".
 */
function rutaBaseDatos() {
  return path.join(app.getPath("userData"), "codeapa.db");
}

/** Copia la base vacía la primera vez que se abre la aplicación. */
function prepararBaseDatos() {
  const destino = rutaBaseDatos();
  if (fs.existsSync(destino)) return destino;

  const plantilla = plantillaBaseDatos();
  if (!fs.existsSync(plantilla)) {
    throw new Error(
      `No se encuentra la base de datos inicial en:\n${plantilla}\n\n` +
        "El paquete de la aplicación está incompleto."
    );
  }

  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(plantilla, destino);
  return destino;
}

/** Pide al sistema operativo un puerto libre. */
function buscarPuertoLibre() {
  return new Promise((resolve, reject) => {
    const servidor = net.createServer();
    servidor.unref();
    servidor.on("error", reject);
    servidor.listen(0, "127.0.0.1", () => {
      const { port } = servidor.address();
      servidor.close(() => resolve(port));
    });
  });
}

/** Espera a que el servidor conteste, con un límite de tiempo. */
function esperarServidor(puerto, msMaximo = 45000) {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intentar = () => {
      const peticion = http.get(
        { host: "127.0.0.1", port: puerto, path: "/", timeout: 2000 },
        (respuesta) => {
          respuesta.resume();
          resolve();
        }
      );
      peticion.on("error", reintentar);
      peticion.on("timeout", () => {
        peticion.destroy();
        reintentar();
      });
    };

    const reintentar = () => {
      if (Date.now() - inicio > msMaximo) {
        reject(new Error("El servidor interno no ha respondido a tiempo."));
        return;
      }
      setTimeout(intentar, 300);
    };

    intentar();
  });
}

let procesoServidor = null;

/** Arranca el servidor de Next.js y devuelve el puerto en el que escucha. */
async function arrancarServidor(rutaDb) {
  const carpeta = carpetaServidor();
  const scriptServidor = path.join(carpeta, "server.js");

  if (!fs.existsSync(scriptServidor)) {
    throw new Error(
      `No se encuentra el servidor en:\n${scriptServidor}\n\n` +
        (esDesarrollo
          ? "Ejecuta antes: npm run desktop:preparar"
          : "El paquete de la aplicación está incompleto.")
    );
  }

  const puerto = await buscarPuertoLibre();

  procesoServidor = fork(scriptServidor, [], {
    cwd: carpeta,
    // Hace que Electron ejecute el script como si fuese Node a secas.
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(puerto),
      HOSTNAME: "127.0.0.1",
      // Ruta absoluta: dentro del paquete el directorio de trabajo no es fiable.
      DATABASE_URL: `file:${rutaDb}`,
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  procesoServidor.stdout?.on("data", (d) => console.log(`[servidor] ${d}`));
  procesoServidor.stderr?.on("data", (d) => console.error(`[servidor] ${d}`));

  await esperarServidor(puerto);
  return puerto;
}

function detenerServidor() {
  if (procesoServidor && !procesoServidor.killed) {
    procesoServidor.kill();
    procesoServidor = null;
  }
}

function crearVentana(puerto) {
  const ventana = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: "#f8fafc",
    title: "CODEAPA",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  ventana.once("ready-to-show", () => {
    ventana.maximize();
    ventana.show();
  });

  // Los enlaces externos se abren en el navegador, no dentro de la aplicación.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Si la ventana no consigue cargar, se avisa en vez de quedarse en blanco.
  ventana.webContents.on("did-fail-load", (_evento, codigo, descripcion, url) => {
    // -3 es una carga abortada por una navegación nueva: no es un fallo real.
    if (codigo === -3) return;
    console.error(`[ventana] fallo al cargar ${url}: ${descripcion} (${codigo})`);
    dialog.showErrorBox(
      "No se ha podido mostrar la aplicación",
      `La ventana no ha conseguido cargar la página.\n\n${descripcion} (${codigo})`
    );
  });

  // Electron no trae menú de clic derecho: sin esto no hay forma de pegar con
  // el ratón en los formularios (p. ej. el NUHSA al crear un paciente).
  ventana.webContents.on("context-menu", (_evento, params) => {
    const { editFlags, isEditable, selectionText } = params;
    const opciones = isEditable
      ? [
          { role: "undo", label: "Deshacer", enabled: editFlags.canUndo },
          { role: "redo", label: "Rehacer", enabled: editFlags.canRedo },
          { type: "separator" },
          { role: "cut", label: "Cortar", enabled: editFlags.canCut },
          { role: "copy", label: "Copiar", enabled: editFlags.canCopy },
          { role: "paste", label: "Pegar", enabled: editFlags.canPaste },
          { type: "separator" },
          { role: "selectAll", label: "Seleccionar todo", enabled: editFlags.canSelectAll },
        ]
      : selectionText.trim()
        ? [{ role: "copy", label: "Copiar" }]
        : [];
    if (opciones.length > 0) Menu.buildFromTemplate(opciones).popup({ window: ventana });
  });

  ventana.webContents.on("did-finish-load", () => {
    console.log(`[ventana] cargada correctamente: "${ventana.webContents.getTitle()}"`);
  });

  ventana.loadURL(`http://127.0.0.1:${puerto}/`);
  return ventana;
}

/** Menú en español, con un acceso directo a la carpeta de la base de datos. */
function construirMenu() {
  const plantilla = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Abrir la carpeta de mis datos",
          click: () => shell.showItemInFolder(rutaBaseDatos()),
        },
        { type: "separator" },
        { role: "quit", label: "Salir" },
      ],
    },
    // Los atajos Ctrl/Cmd+C, V, X, Z y A dependen de este menú: en macOS, si
    // no existe, copiar y pegar no funciona en ningún campo.
    {
      label: "Editar",
      submenu: [
        { role: "undo", label: "Deshacer" },
        { role: "redo", label: "Rehacer" },
        { type: "separator" },
        { role: "cut", label: "Cortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Pegar" },
        { role: "selectAll", label: "Seleccionar todo" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload", label: "Recargar" },
        { role: "resetZoom", label: "Tamaño normal" },
        { role: "zoomIn", label: "Aumentar" },
        { role: "zoomOut", label: "Reducir" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Pantalla completa" },
        { role: "toggleDevTools", label: "Herramientas de desarrollo" },
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Dónde se guardan los datos",
          click: () => {
            dialog.showMessageBox({
              type: "info",
              title: "Dónde se guardan los datos",
              message: "Tus datos están solo en este ordenador",
              detail:
                `Archivo de base de datos:\n${rutaBaseDatos()}\n\n` +
                "No se envía nada por internet. Para hacer una copia de " +
                "seguridad, copia ese archivo a un lugar seguro.",
              buttons: ["Entendido"],
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(plantilla));
}

// Una sola instancia: dos procesos escribiendo la misma base darían problemas.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [ventana] = BrowserWindow.getAllWindows();
    if (ventana) {
      if (ventana.isMinimized()) ventana.restore();
      ventana.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const rutaDb = prepararBaseDatos();
      const puerto = await arrancarServidor(rutaDb);
      construirMenu();
      crearVentana(puerto);

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) crearVentana(puerto);
      });
    } catch (error) {
      dialog.showErrorBox(
        "No se ha podido iniciar CODEAPA",
        String(error && error.message ? error.message : error)
      );
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    detenerServidor();
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", detenerServidor);
  app.on("quit", detenerServidor);
}

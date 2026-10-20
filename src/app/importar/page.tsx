"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  parsearDelimitado,
  procesarImportacion,
  type ResultadoParseo,
  type FormatoSAS,
  type FilaProcesada,
} from "@/lib/importer/parser";
import { importarFilasABaseDeDatos, type ResultadoGuardado } from "@/lib/importer/actions";
import {
  Upload,
  FileText,
  Check,
  AlertTriangle,
  Sparkles,
  Activity,
  Droplets,
  Package,
} from "@/components/ui/Icons";

// Plantillas de ejemplo con el formato exacto de los 7 informes de origen (INFOWEB, FARMA, LAB)
const FORMATOS_EJEMPLO: Record<
  string,
  { nombre: string; formato: FormatoSAS; descripcion: string; csv: string }
> = {
  INFOWEB_DIABETES: {
    nombre: "pru_INFOWEB_DIABETES (Infoweb)",
    formato: "INFOWEB",
    descripcion: "Estratificación de riesgo de pie diabético, retinografía, cupo SAS e inmovilización/residencia.",
    csv: `PERIODO,NUHSA,SEXO,EDAD,CLAVE_MEDICA,CLAVE_ENFERMERIA,CLAVE_EQUIPO,DESC_CAP,RIESGO_BAJO_PD,RIESGO_MEDIO_PD,RIESGO_ALTO_PD,RETINO_3_AÑOS,PAC_AMPUTADO,PAC_PIE_DIABETICO,PAC_INMOVILIZADO,PAC_RESIDENCIA
2026,AN0145892341,H,67,MED-104,ENF-201,EQ-04,C.S. La Línea Poniente,N,S,N,S,N,N,N,N
2026,AN0987123456,M,72,MED-104,ENF-202,EQ-04,C.S. La Línea Poniente,N,N,S,N,N,S,S,N
2026,AN0554128963,H,58,MED-108,ENF-205,EQ-08,C.S. San Roque,S,N,N,S,N,N,N,S`,
  },
  LAB_BIOQUIMICA: {
    nombre: "pru_LAB_BIOQUIMICA (Laboratorio)",
    formato: "LAB_BIOQUIMICA",
    descripcion: "FGE, Creatinina, HbA1c, Colesterol, Triglicéridos, Potasio y Glucemia.",
    csv: `Fecha,NUHSA,Edad del Paciente,Sexo del Paciente,Doctor,Centro,Creatinina (suero),"Filtrado glomerular/1,73 m^2 (estimado) (C)",Hemoglobina glicosilada (A1c),Colesterol #Col,Colesterol de LDL (calculado) #LDL (C),Colesterol de HDL #HDL,Triglicéridos,Glucosa #GLU,Potasio #K,Tirotropina #TSH
2026-09-15,AN0145892341,67,H,Dr. Gómez,C.S. La Línea Poniente,1.05,74.5,7.2,185,102,48,160,138,4.3,2.1
2026-09-20,AN0987123456,72,M,Dr. Gómez,C.S. La Línea Poniente,1.45,42.0,8.8,220,138,41,210,175,4.8,3.4
2026-09-22,AN0554128963,58,H,Dra. Ruiz,C.S. San Roque,0.90,92.0,6.4,165,88,55,115,105,4.1,1.8`,
  },
  LAB_HEMATO: {
    nombre: "pru_LAB_HEMATO (Hematología)",
    formato: "LAB_HEMATO",
    descripcion: "Hemograma completo, VCM, Plaquetas, Ferritina, IST y Vitaminas.",
    csv: `Fecha,NUHSA,Sexo del Paciente,Centro,Hemoglobina,Hematíes (recuento),VCM,Plaquetas,Ferritina,IST,Vit B12,A. Fólico,PCR,TSH
2026-09-15,AN0145892341,H,C.S. La Línea Poniente,14.2,4.8,89.5,245000,120,28,450,8.5,1.2,2.1
2026-09-20,AN0987123456,M,C.S. La Línea Poniente,11.4,3.9,78.2,310000,18,12,320,6.1,4.5,3.4
2026-09-22,AN0554128963,H,C.S. San Roque,15.5,5.1,91.0,195000,180,32,580,11.2,0.8,1.8`,
  },
  FARMA_DIABETES: {
    nombre: "pru_FARMA_A10_DIABETES (Farmacia)",
    formato: "FARMA",
    descripcion: "Tratamientos pautados, dispensaciones de metformina, iSGLT2, arGLP1 e insulinas.",
    csv: `Tarjeta NUSA BDU,EDAD,Centro BDU,Clave Médica/Esp (s/Paciente BDU),Atc Nivel 4,CompoFarma,Envases,DDD,Recetas
AN0145892341,67,C.S. La Línea Poniente,MED-104,A10BD,Metformina + Empagliflozina,3,90,3
AN0987123456,72,C.S. La Línea Poniente,MED-104,A10AE,Insulina Glargina + Semaglutida,4,120,4
AN0554128963,58,C.S. San Roque,MED-108,A10BA,Metformina 850mg,2,60,2`,
  },
};

// Filas por llamada al servidor al importar (ver handleImportar).
const TAMANO_LOTE = 200;

export default function ImportadorPage() {
  const [textoEntrada, setTextoEntrada] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [resultado, setResultado] = useState<ResultadoParseo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null);
  const [informeGuardado, setInformeGuardado] = useState<ResultadoGuardado | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  // Analizar texto (CSV/TSV/Tablas)
  const handleProcesarTexto = (contenido: string, nombre = "Datos introducidos") => {
    setTextoEntrada(contenido);
    setNombreArchivo(nombre);
    setInformeGuardado(null);

    const { headers, rows } = parsearDelimitado(contenido);
    if (headers.length === 0) {
      setResultado(null);
      return;
    }
    const res = procesarImportacion(headers, rows);
    setResultado(res);
  };

  // Leer un Excel (.xlsx/.xls): se toma la primera hoja con datos y, dentro de
  // ella, la primera fila con al menos dos celdas rellenas como cabecera (los
  // volcados del SAS a veces traen un título o filas en blanco encima).
  const procesarExcel = async (file: File) => {
    const XLSX = await import("xlsx");
    const libro = XLSX.read(await file.arrayBuffer(), { cellDates: true });

    for (const nombreHoja of libro.SheetNames) {
      const filas = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombreHoja], {
        header: 1,
        defval: "",
        blankrows: false,
      });
      // Valores crudos: los números sin separador de miles y las fechas como
      // aaaa-mm-dd (el formato visible depende del idioma de Excel).
      const texto = (v: unknown): string => {
        if (v === null || v === undefined) return "";
        if (v instanceof Date) {
          const dd = (n: number) => String(n).padStart(2, "0");
          return `${v.getFullYear()}-${dd(v.getMonth() + 1)}-${dd(v.getDate())}`;
        }
        return String(v).trim();
      };
      const idxCabecera = filas.findIndex((f) => f.filter((c) => texto(c) !== "").length >= 2);
      if (idxCabecera === -1) continue;

      const headers = filas[idxCabecera].map((h, i) => texto(h) || `Columna_${i + 1}`);
      const rows: Record<string, string>[] = [];
      for (const f of filas.slice(idxCabecera + 1)) {
        if (f.every((c) => texto(c) === "")) continue;
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = texto(f[i]);
        });
        rows.push(row);
      }

      setTextoEntrada("");
      setNombreArchivo(file.name);
      setInformeGuardado(null);
      setResultado(procesarImportacion(headers, rows));
      return;
    }

    setErrorArchivo("El Excel no contiene ninguna hoja con datos.");
  };

  // Cargar archivo: Excel (.xlsx/.xls) o texto delimitado (CSV, TSV, TXT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nombre = file.name.toLowerCase();
    // Permite volver a elegir el mismo archivo después de corregirlo.
    e.target.value = "";

    if (nombre.endsWith(".pdf")) {
      setErrorArchivo(
        "Los PDF no se pueden importar. Abre el PDF, copia la tabla y pégala en el cuadro de la derecha."
      );
      return;
    }

    setErrorArchivo(null);

    if (nombre.endsWith(".xlsx") || nombre.endsWith(".xls") || nombre.endsWith(".xlsm")) {
      try {
        await procesarExcel(file);
      } catch (err: unknown) {
        setResultado(null);
        setErrorArchivo(
          `No se ha podido leer el Excel (${err instanceof Error ? err.message : String(err)}). ` +
            "Si está protegido con contraseña, quítasela o guárdalo como CSV."
        );
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleProcesarTexto(reader.result as string, file.name);
    };
    reader.readAsText(file);
  };

  // Confirmar e importar a SQLite.
  // Se envía en lotes: una server action no admite cuerpos grandes (Next corta
  // por encima del límite y en producción solo muestra un error genérico), y un
  // volcado del SAS puede tener miles de filas. Además se quita `raw` (la fila
  // original), que el servidor no usa y duplicaría el tamaño del envío.
  const handleImportar = async () => {
    if (!resultado || resultado.filas.length === 0) return;
    const filas = resultado.filas.map((f) => {
      const resto: Partial<FilaProcesada> = { ...f };
      delete resto.raw;
      return resto as Omit<FilaProcesada, "raw">;
    });
    const total: ResultadoGuardado = {
      pacientesCreados: 0,
      pacientesActualizados: 0,
      registrosClinicosCreados: 0,
      errores: [],
    };
    setGuardando(true);
    setProgreso({ hechas: 0, total: filas.length });
    try {
      for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
        const res = await importarFilasABaseDeDatos(filas.slice(i, i + TAMANO_LOTE));
        total.pacientesCreados += res.pacientesCreados;
        total.pacientesActualizados += res.pacientesActualizados;
        total.registrosClinicosCreados += res.registrosClinicosCreados;
        total.errores.push(...res.errores);
        setProgreso({ hechas: Math.min(i + TAMANO_LOTE, filas.length), total: filas.length });
      }
      setInformeGuardado(total);
    } catch (err: unknown) {
      const hechas = total.pacientesCreados + total.pacientesActualizados;
      alert(
        `Error al guardar en base de datos: ${err instanceof Error ? err.message : String(err)}` +
          (hechas > 0 ? `\n\nSe llegaron a guardar ${hechas} pacientes antes del error.` : "")
      );
      if (hechas > 0) setInformeGuardado(total);
    } finally {
      setGuardando(false);
      setProgreso(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-900">
              IMPORTADOR SAS
            </span>
            <span className="text-xs text-slate-500">Módulo Universal de Datos Clínicos</span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Importación Masiva de Pacientes y Analíticas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Carga volcados de hojas de cálculo del SAS (Infoweb, Farmacia A10, Laboratorio Bioquímica y Hematología) en formato Excel, CSV o pegando directamente la tabla copiada.
          </p>
        </div>

        <Link
          href="/pacientes"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          ← Ver Pacientes en CODEAPA
        </Link>
      </div>

      {/* Formatos Soportados */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <div className="flex items-center gap-2 text-sky-800 font-bold text-xs mb-1">
            <Activity size={16} />
            <span>SAS Infoweb</span>
          </div>
          <p className="text-[11.5px] text-sky-950/80 leading-relaxed">
            Estratificación de riesgo de pie diabético, retinografía y cupos de Medicina y Enfermería.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
            <Package size={16} />
            <span>Farmacia A10</span>
          </div>
          <p className="text-[11.5px] text-emerald-950/80 leading-relaxed">
            Consumo farmacéutico de antidiabéticos orales e insulinas, recetas, DDD y envases.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs mb-1">
            <Droplets size={16} />
            <span>Lab Bioquímica</span>
          </div>
          <p className="text-[11.5px] text-indigo-950/80 leading-relaxed">
            FGE, Creatinina, HbA1c glicada, Colesterol LDL/HDL, Triglicéridos, Glucemia basal y Potasio.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
            <Sparkles size={16} />
            <span>Lab Hematología</span>
          </div>
          <p className="text-[11.5px] text-amber-950/80 leading-relaxed">
            Hemograma, VCM, Plaquetas, Ferritina, IST, Vitamina B12, Ácido fólico, PCR y TSH.
          </p>
        </div>
      </div>

      {/* Zona de Carga / Input */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Subida de Archivo */}
        <div className="lg:col-span-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center hover:border-purple-400 transition-colors flex flex-col justify-center items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Upload size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Subir Archivo SAS</h3>
          <p className="mt-1 text-xs text-slate-500 mb-4">
            Selecciona un Excel o una exportación tabular (.xlsx, .xls, .csv, .tsv, .txt)
          </p>
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors">
            <span>Seleccionar Archivo</span>
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            ¿Tienes un PDF? Ábrelo, selecciona la tabla con sus cabeceras,
            cópiala y pégala en el cuadro de la derecha.
          </p>

          {errorArchivo && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-left text-[11.5px] leading-relaxed text-amber-900">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{errorArchivo}</span>
            </div>
          )}
        </div>

        {/* Pegar texto o tabla */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText size={16} />
              <span>O pega aquí el contenido de la hoja de cálculo / CSV</span>
            </label>
            {textoEntrada && (
              <button
                type="button"
                onClick={() => {
                  setTextoEntrada("");
                  setResultado(null);
                  setInformeGuardado(null);
                }}
                className="text-xs text-slate-400 hover:text-red-600"
              >
                Limpiar
              </button>
            )}
          </div>
          <textarea
            rows={5}
            value={textoEntrada}
            onChange={(e) => handleProcesarTexto(e.target.value)}
            placeholder="Pega aquí filas copiadas de Excel, Diraya o CSV con sus cabeceras (ej. NUHSA, PERIODO, RIESGO_BAJO_PD, etc.)..."
            className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />

          {/* Botones de plantillas de prueba */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Formatos de ejemplo:</span>
            {Object.entries(FORMATOS_EJEMPLO).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleProcesarTexto(item.csv, item.nombre)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-purple-100 hover:text-purple-800 transition-colors"
              >
                {item.nombre.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Informe de Éxito al Guardar */}
      {informeGuardado && (
        <div className="mb-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Check size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                ¡Importación completada con éxito en la base de datos local!
              </h3>
              <p className="text-xs text-emerald-800">
                Todos los datos han quedado almacenados en tu base de datos SQLite de CODEAPA.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs mt-4 border-t border-emerald-200/80 pt-4">
            <div className="rounded-xl bg-white p-3 border border-emerald-200">
              <span className="text-slate-500 block">Nuevos pacientes creados:</span>
              <strong className="text-lg text-emerald-700">{informeGuardado.pacientesCreados}</strong>
            </div>
            <div className="rounded-xl bg-white p-3 border border-emerald-200">
              <span className="text-slate-500 block">Pacientes actualizados:</span>
              <strong className="text-lg text-sky-700">{informeGuardado.pacientesActualizados}</strong>
            </div>
            <div className="rounded-xl bg-white p-3 border border-emerald-200">
              <span className="text-slate-500 block">Registros analíticos/visitas:</span>
              <strong className="text-lg text-purple-700">
                {informeGuardado.registrosClinicosCreados}
              </strong>
            </div>
          </div>

          {informeGuardado.errores.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
              <strong>Advertencias durante la importación:</strong>
              <ul className="list-disc list-inside mt-1">
                {informeGuardado.errores.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Link
              href="/pacientes"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors"
            >
              <span>Ir a la lista de pacientes →</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setInformeGuardado(null);
                setResultado(null);
                setTextoEntrada("");
              }}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Importar otro archivo
            </button>
          </div>
        </div>
      )}

      {/* Vista previa de lo detectado */}
      {resultado && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Ficha de Detección */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-extrabold text-emerald-800">
                  ✓ Formato Detectado: {resultado.nombreFormato}
                </span>
                <span className="text-xs text-slate-400">Archivo: {nombreArchivo}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{resultado.descripcion}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right text-xs">
                <span className="block text-slate-400 font-medium">Filas válidas con NUHSA</span>
                <strong className="text-base text-slate-900">
                  {resultado.filasValidas} de {resultado.totalFilas}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleImportar}
                disabled={guardando || resultado.filasValidas === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-800 disabled:opacity-50 transition-all cursor-pointer"
              >
                {guardando ? (
                  <span>
                    Guardando en BD
                    {progreso && progreso.total > TAMANO_LOTE
                      ? ` (${progreso.hechas} de ${progreso.total})`
                      : ""}
                    ...
                  </span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirmar e Importar {resultado.filasValidas} Pacientes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {resultado.advertencias.length > 0 && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>{resultado.advertencias.join(" ")}</div>
            </div>
          )}

          {/* Tabla de previsualización */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">NUHSA</th>
                  <th className="px-3.5 py-3">Sexo / Edad</th>
                  <th className="px-3.5 py-3">Centro</th>
                  <th className="px-3.5 py-3">Médico / Enf</th>
                  <th className="px-3.5 py-3">Variables Detectadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado.filas.map((fila, idx) => {
                  const clinicoItems: string[] = [];
                  if (fila.clinico.hba1c) clinicoItems.push(`HbA1c: ${fila.clinico.hba1c}%`);
                  if (fila.clinico.glucemiaBasal) clinicoItems.push(`GB: ${fila.clinico.glucemiaBasal}mg/dL`);
                  if (fila.clinico.fge) clinicoItems.push(`FGE: ${fila.clinico.fge}`);
                  if (fila.clinico.creatinina) clinicoItems.push(`Crea: ${fila.clinico.creatinina}`);
                  if (fila.clinico.colesterolTotal) clinicoItems.push(`Col: ${fila.clinico.colesterolTotal}`);
                  if (fila.clinico.hb) clinicoItems.push(`Hb: ${fila.clinico.hb}g/dL`);
                  if (fila.clinico.plaquetas) clinicoItems.push(`Plaq: ${fila.clinico.plaquetas}`);
                  if (fila.clinico.riesgoPieDiabetico) clinicoItems.push(`Pie: ${fila.clinico.riesgoPieDiabetico}`);
                  if (fila.clinico.retino3Anos !== undefined)
                    clinicoItems.push(`Retino: ${fila.clinico.retino3Anos ? "SÍ" : "NO"}`);
                  if (fila.datosPaciente.tratamientoDiabetes)
                    clinicoItems.push(`Trat: ${fila.datosPaciente.tratamientoDiabetes}`);
                  if (fila.datosPaciente.inmovilizado) clinicoItems.push("Inmovilizado");
                  if (fila.datosPaciente.viveEnResidencia) clinicoItems.push("En residencia");

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-900">
                        {fila.nuhsa}
                      </td>
                      <td className="px-3.5 py-3 text-slate-700">
                        {fila.datosPaciente.sexo === "H" ? "Hombre" : "Mujer"}
                        {fila.datosPaciente.edad ? ` • ${fila.datosPaciente.edad} años` : ""}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">
                        {fila.datosPaciente.centroSalud || "—"}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">
                        {fila.datosPaciente.claveMedica || fila.datosPaciente.claveEnfermeria
                          ? `${fila.datosPaciente.claveMedica || ""} ${fila.datosPaciente.claveEnfermeria ? `/ ${fila.datosPaciente.claveEnfermeria}` : ""}`
                          : "—"}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {clinicoItems.map((item, i) => (
                            <span
                              key={i}
                              className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                              {item}
                            </span>
                          ))}
                          {clinicoItems.length === 0 && (
                            <span className="text-slate-400 italic">Datos demográficos</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

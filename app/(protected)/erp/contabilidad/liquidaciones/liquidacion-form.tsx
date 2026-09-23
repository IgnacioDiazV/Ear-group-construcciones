"use client";

import { type ChangeEvent, type DragEvent, useActionState, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { guardarLiquidacion, type LiquidacionActionState } from "./actions";
import styles from "./liquidaciones.module.css";

const initialState: LiquidacionActionState = {};

function sumarColumnaImportes(rows: unknown[][]): number {
  const encabezado = rows[0]?.map((celda) => String(celda ?? "").trim().toLowerCase()) ?? [];
  const columnasCandidatas = ["importe", "monto", "total", "pago", "jornal"];
  let columnaIndex = encabezado.findIndex((titulo) => columnasCandidatas.some((candidata) => titulo.includes(candidata)));
  if (columnaIndex === -1) {
    // Sin encabezado reconocible: usar la última columna numérica del cuerpo.
    columnaIndex = (rows[1]?.length ?? 1) - 1;
  }
  return rows.slice(1).reduce((acc, fila) => {
    const valor = Number(String(fila[columnaIndex] ?? "").replace(/[^0-9.,-]/g, "").replace(",", "."));
    return acc + (Number.isFinite(valor) ? valor : 0);
  }, 0);
}

export function LiquidacionForm({ obras }: { obras: { id: number; nombre: string }[] }) {
  const [state, formAction, pending] = useActionState(guardarLiquidacion, initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [montoDetectado, setMontoDetectado] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function procesarExcel(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1 });
      setMontoDetectado(sumarColumnaImportes(filas));
    } catch {
      setMontoDetectado(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) void procesarExcel(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (fileInputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInputRef.current.files = transfer.files;
    }
    void procesarExcel(file);
  }

  return (
    <form action={formAction} className={styles.refactoredForm}>
      {/* Columna Izquierda: Dropzone Planilla */}
      <div style={{ display: "grid", alignContent: "start", gap: "14px" }}>
        {/* Header */}
        <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
          <span style={{ display: "grid", width: "36px", height: "36px", placeItems: "center", border: "1px solid #e0dcda", background: "#f5f3f0", color: "#4a3f3a", borderRadius: "8px", fontSize: "18px" }}>
            📊
          </span>
          <div>
            <h3 style={{ margin: "0", color: "#3d1c14", fontSize: "18px", fontWeight: "700" }}>Cargar planilla semanal</h3>
            <p style={{ margin: "5px 0 0", color: "#726560", fontSize: "12px" }}>Subí el archivo Excel o CSV de jornales para procesar la liquidación.</p>
          </div>
        </div>

        {/* Dropzone */}
        <div
          style={{
            minHeight: "220px",
            display: "grid",
            placeItems: "center",
            alignContent: "center",
            gap: "8px",
            padding: "24px",
            border: "2px dashed #d1cac7",
            borderRadius: "8px",
            background: "#faf8f7",
            color: "#726560",
            textAlign: "center",
            cursor: "pointer",
            borderColor: isDragging ? "#3E2723" : undefined,
            backgroundColor: isDragging ? "rgba(210, 180, 140, 0.4)" : undefined,
            transition: "all 0.2s ease",
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
        >
          <strong style={{ color: "#4a3f3a", fontSize: "14px" }}>{selectedFile ? "Archivo seleccionado" : "Cargar planilla Excel"}</strong>
          <span style={{ display: "block", color: "#9a8e89", fontSize: "12px" }}>{selectedFile ? selectedFile.name : "Arrastrá el archivo o hacé clic para explorar"}</span>
          <small style={{ display: "block", color: "#9a8e89", fontSize: "12px" }}>{selectedFile ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB` : ".XLSX, .XLS o .CSV"}</small>
        </div>

        <input accept=".xlsx,.xls,.csv" style={{ display: "none" }} name="file" onChange={handleFileChange} ref={fileInputRef} required type="file" />

        {/* Error/Success Messages */}
        {state.error && <div style={{ padding: "12px", borderRadius: "6px", background: "#fef2f2", color: "#991b1b", fontSize: "13px", fontWeight: "500" }} role="alert">{state.error}</div>}
        {state.success && <div style={{ padding: "12px", borderRadius: "6px", background: "#f0fdf4", color: "#15803d", fontSize: "13px", fontWeight: "500" }} role="status">{state.success}</div>}
      </div>

      {/* Columna Derecha: Confirmar Datos */}
      <div style={{ display: "grid", alignContent: "start", gap: "14px" }}>
        {/* Header */}
        <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
          <span style={{ display: "grid", width: "36px", height: "36px", placeItems: "center", border: "1px solid #e0dcda", background: "#f5f3f0", color: "#4a3f3a", borderRadius: "8px", fontSize: "18px" }}>
            ✓
          </span>
          <div>
            <h3 style={{ margin: "0", color: "#3d1c14", fontSize: "18px", fontWeight: "700" }}>Confirmar liquidación</h3>
            <p style={{ margin: "5px 0 0", color: "#726560", fontSize: "12px" }}>Revisá la imputación de obra y montos antes de registrar.</p>
          </div>
        </div>

        {/* Campos */}
        <label style={{ display: "grid", gap: "5px", color: "#4a3f3a", fontSize: "12px", fontWeight: "700" }}>
          Obra
          <select defaultValue="" name="obra_id" style={{ width: "100%", padding: "9px", border: "1px solid #d3cec9", borderRadius: "4px", background: "#fff", color: "#2c2420", font: "inherit", fontSize: "13px" }}>
            <option value="">Planilla General (Multi-obra)</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nombre}
              </option>
            ))}
          </select>
        </label>

        {/* Fila doble: Semana y Fecha */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label style={{ display: "grid", gap: "5px", color: "#4a3f3a", fontSize: "12px", fontWeight: "700" }}>
            Semana / Período
            <input name="semana" placeholder="Semana 36 - Septiembre 2026" required style={{ width: "100%", padding: "9px", border: "1px solid #d3cec9", borderRadius: "4px", background: "#fff", color: "#2c2420", font: "inherit", fontSize: "13px" }} />
          </label>
          <label style={{ display: "grid", gap: "5px", color: "#4a3f3a", fontSize: "12px", fontWeight: "700" }}>
            Fecha de pago
            <input name="fecha_pago" type="date" style={{ width: "100%", padding: "9px", border: "1px solid #d3cec9", borderRadius: "4px", background: "#fff", color: "#2c2420", font: "inherit", fontSize: "13px" }} />
          </label>
        </div>

        {/* Monto */}
        <label style={{ display: "grid", gap: "5px", color: "#4a3f3a", fontSize: "12px", fontWeight: "700" }}>
          Monto total liquidado ($)
          <input defaultValue={montoDetectado ?? undefined} key={montoDetectado} min="0" name="total_pagado" required step="0.01" type="number" style={{ width: "100%", padding: "9px", border: "1px solid #d3cec9", borderRadius: "4px", background: "#fff", color: "#2c2420", font: "inherit", fontSize: "13px" }} />
        </label>

        {/* Botón de Guardado */}
        <button
          disabled={pending}
          type="submit"
          style={{
            width: "100%",
            marginTop: "8px",
            padding: "10px 16px",
            borderRadius: "6px",
            background: "#2B1810",
            color: "#fff",
            border: "none",
            cursor: pending ? "wait" : "pointer",
            font: "inherit",
            fontSize: "14px",
            fontWeight: "600",
            opacity: pending ? 0.6 : 1,
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => !pending && (e.currentTarget.style.background = "#3D2318")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#2B1810")}
        >
          {pending ? "Guardando..." : "Guardar liquidación"}
        </button>
      </div>
    </form>
  );
}

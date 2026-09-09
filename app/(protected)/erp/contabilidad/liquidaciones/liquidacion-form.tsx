"use client";

import { type ChangeEvent, type DragEvent, useActionState, useRef, useState } from "react";
import { guardarLiquidacion, type LiquidacionActionState } from "./actions";
import styles from "./liquidaciones.module.css";

const initialState: LiquidacionActionState = {};

export function LiquidacionForm({ obras }: { obras: { id: number; nombre: string }[] }) {
  const [state, formAction, pending] = useActionState(guardarLiquidacion, initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (fileInputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInputRef.current.files = transfer.files;
    }
  }

  return <form action={formAction} className={styles.form}>
    {state.error && <div className={styles.error} role="alert">{state.error}</div>}
    {state.success && <div className={styles.success} role="status">{state.success}</div>}
    <div className={styles.formGrid}><label>Obra<select defaultValue="" name="obra_id" required><option disabled value="">Seleccioná una obra</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label><label>Semana / Período<input name="semana" placeholder="Semana 36 - Septiembre 2026" required /></label><label>Monto total liquidado ($)<input min="0" name="total_pagado" required step="0.01" type="number" /></label></div>
    <div className={styles.fileRow}><div className={styles.dropzone} onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} role="button" tabIndex={0}><strong>{selectedFile ? "Archivo seleccionado" : "Adjuntar planilla Excel"}</strong><span>{selectedFile ? selectedFile.name : "Arrastrá el archivo o hacé clic para explorar"}</span><small>{selectedFile ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB` : ".xlsx, .xls o .csv"}</small></div><input accept=".xlsx,.xls,.csv" className={styles.hiddenInput} name="file" onChange={handleFileChange} ref={fileInputRef} required type="file" /></div>
    <button className={styles.primaryButton} disabled={pending} type="submit">{pending ? "Guardando..." : "Guardar planilla"}</button>
  </form>;
}

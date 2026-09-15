"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useRef, useState } from "react";
import { analizarComprobante, cargarComprobante, type ComprobanteOCR, type ExpenseActionState } from "./actions";
import styles from "./contabilidad.module.css";
import smartStyles from "./contabilidad-smart.module.css";

const initialState: ExpenseActionState = {};

export function ExpenseForm({ obras }: { obras: { id: number; nombre: string }[] }) {
  const [state, formAction, pending] = useActionState(cargarComprobante, initialState);
  const [preview, setPreview] = useState("");
  const [reading, setReading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fields, setFields] = useState({ obraId: "", proveedor: "", tipo: "Ticket", fecha: new Date().toISOString().slice(0, 10), rubro: "", descripcion: "", importe: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (state.success) {
      setPreview("");
      setOcrError("");
      setFields((prev) => ({ obraId: prev.obraId, proveedor: "", tipo: "Ticket", fecha: prev.fecha, rubro: "", descripcion: "", importe: "" }));
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [state.success]);

  function applyOCR(data: ComprobanteOCR) {
    setFields((prev) => ({ obraId: prev.obraId, proveedor: data.proveedor, tipo: data.tipo_comprobante, fecha: data.fecha || new Date().toISOString().slice(0, 10), rubro: data.rubro_sugerido, descripcion: data.descripcion, importe: data.total ? String(data.total) : "" }));
  }

  async function selectFile(file: File | undefined) {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setReading(true);
    setOcrError("");
    const analysisData = new FormData();
    analysisData.set("file", file);
    const result = await analizarComprobante(analysisData);
    setReading(false);
    if (result.data) applyOCR(result.data);
    if (result.error) setOcrError(result.error);
  }

  function clearFile() {
    setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return <form action={formAction} className={smartStyles.smartForm}>
    <div className={smartStyles.smartUpload}>
      <div className={smartStyles.smartHeading}>
        <span className={smartStyles.scanIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </span>
        <div>
          <h2>Carga inteligente</h2>
          <p>Subí una factura o ticket para revisar sus datos antes de imputarlo.</p>
        </div>
      </div>
      <div 
        className={smartStyles.dropzone} 
        onClick={() => fileRef.current?.click()} 
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()} 
        onDrop={(event) => { 
          event.preventDefault(); 
          setIsDragging(false);
          selectFile(event.dataTransfer.files[0]); 
        }} 
        role="button" 
        tabIndex={0}
        style={{
          borderColor: isDragging ? '#3E2723' : undefined,
          backgroundColor: isDragging ? 'rgba(210, 180, 140, 0.4)' : undefined,
          transition: 'all 0.2s ease',
        }}
      >
        {preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                alt="Vista previa del comprobante" 
                className={smartStyles.receiptPreview} 
                src={preview} 
              />
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: reading ? '#f59e0b' : '#10b981',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}>
                {reading ? "Analizando..." : "Listo"}
              </div>
            </div>
            <strong>{reading ? "Leyendo comprobante con IA..." : "Comprobante listo para revisar"}</strong>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d3cec9',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#2c2420',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d3cec9',
                  borderRadius: '4px',
                  background: '#f4f1ef',
                  color: '#2c2420',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Reemplazar
              </button>
            </div>
          </div>
        ) : (
          <>
            <strong>Arrastrá el comprobante aquí</strong>
            <span>o hacé clic para explorar / capturar con cámara</span>
            <small>PNG, JPG, WebP o PDF</small>
          </>
        )}
      </div>
      <input accept="image/*,.pdf" capture="environment" className={smartStyles.hiddenFile} name="file" onChange={(event) => selectFile(event.target.files?.[0])} ref={fileRef} type="file" />
      {(state.error || ocrError) && <div className={styles.error} role="alert">{state.error || ocrError}</div>}
      {state.success && <div className={styles.success} role="status">{state.success}</div>}
    </div>
    <div className={smartStyles.confirmFields}>
      <div className={smartStyles.smartHeading}>
        <span className={smartStyles.scanIcon}>✓</span>
        <div>
          <h2>Confirmar imputación</h2>
          <p>Editá cualquier dato antes de guardar.</p>
        </div>
      </div>
      <label>
        Obra
        <select name="obra_id" onChange={(event) => setFields({ ...fields, obraId: event.target.value })} required value={fields.obraId}>
          <option value="">Seleccioná una obra</option>
          {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
        </select>
      </label>
      <div className={styles.formRow}>
        <label>
          Proveedor / Emisor
          <input name="proveedor" onChange={(event) => setFields({ ...fields, proveedor: event.target.value })} placeholder="Detectado por OCR" value={fields.proveedor} />
        </label>
        <label>
          Tipo
          <select name="tipo_comprobante" onChange={(event) => setFields({ ...fields, tipo: event.target.value })} value={fields.tipo}>
            <option>Factura A</option>
            <option>Factura B</option>
            <option>Factura C</option>
            <option>Ticket</option>
            <option>Vale</option>
          </select>
        </label>
      </div>
      <div className={styles.formRow}>
        <label>
          Fecha
          <input name="fecha" onChange={(event) => setFields({ ...fields, fecha: event.target.value })} required type="date" value={fields.fecha} />
        </label>
        <label>
          Rubro
          <input name="rubro" onChange={(event) => setFields({ ...fields, rubro: event.target.value })} placeholder="Materiales, combustible..." required value={fields.rubro} />
        </label>
      </div>
      <label>
        Descripción
        <input name="descripcion" onChange={(event) => setFields({ ...fields, descripcion: event.target.value })} placeholder="Concepto del comprobante" required value={fields.descripcion} />
      </label>
      <label>
        Importe
        <input min="0" name="precio_unitario" onChange={(event) => setFields({ ...fields, importe: event.target.value })} required step="0.01" type="number" value={fields.importe} />
      </label>
      <button className={styles.primaryButton} disabled={pending || reading} type="submit">
        {pending ? "Guardando..." : "Guardar e imputar a obra"}
      </button>
    </div>
  </form>;
}

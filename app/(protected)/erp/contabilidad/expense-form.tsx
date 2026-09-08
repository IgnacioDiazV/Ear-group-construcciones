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
  const [fields, setFields] = useState({ proveedor: "", tipo: "Ticket", fecha: new Date().toISOString().slice(0, 10), rubro: "", descripcion: "", importe: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function applyOCR(data: ComprobanteOCR) {
    setFields({ proveedor: data.proveedor, tipo: data.tipo_comprobante, fecha: data.fecha || new Date().toISOString().slice(0, 10), rubro: data.rubro_sugerido, descripcion: data.descripcion, importe: data.total ? String(data.total) : "" });
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

  return <form action={formAction} className={smartStyles.smartForm}>
    <div className={smartStyles.smartUpload}>
      <div className={smartStyles.smartHeading}><span className={smartStyles.scanIcon}>⌁</span><div><h2>Carga inteligente</h2><p>Subí una factura o ticket para revisar sus datos antes de imputarlo.</p></div></div>
      <div className={smartStyles.dropzone} onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }} role="button" tabIndex={0}>
        {preview ? <><img alt="Vista previa del comprobante" className={smartStyles.receiptPreview} src={preview} /><strong>{reading ? "Leyendo comprobante con IA..." : "Comprobante listo para revisar"}</strong></> : <><strong>Arrastrá el comprobante aquí</strong><span>o hacé clic para explorar / capturar con cámara</span><small>PNG, JPG, WebP o PDF</small></>}
      </div>
      <input accept="image/*,.pdf" capture="environment" className={smartStyles.hiddenFile} name="file" onChange={(event) => selectFile(event.target.files?.[0])} ref={fileRef} type="file" />
      {(state.error || ocrError) && <div className={styles.error} role="alert">{state.error || ocrError}</div>}
      {state.success && <div className={styles.success} role="status">{state.success}</div>}
    </div>
    <div className={smartStyles.confirmFields}><div className={smartStyles.smartHeading}><span className={smartStyles.scanIcon}>✓</span><div><h2>Confirmar imputación</h2><p>Editá cualquier dato antes de guardar.</p></div></div>
      <label>Obra<select defaultValue="" name="obra_id" required><option disabled value="">Seleccioná una obra</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label>
    <div className={styles.formRow}><label>Proveedor / Emisor<input name="proveedor" onChange={(event) => setFields({ ...fields, proveedor: event.target.value })} placeholder="Detectado por OCR" value={fields.proveedor} /></label><label>Tipo<select name="tipo_comprobante" onChange={(event) => setFields({ ...fields, tipo: event.target.value })} value={fields.tipo}><option>Factura A</option><option>Factura B</option><option>Factura C</option><option>Ticket</option><option>Vale</option></select></label></div>
    <div className={styles.formRow}><label>Fecha<input name="fecha" onChange={(event) => setFields({ ...fields, fecha: event.target.value })} required type="date" value={fields.fecha} /></label><label>Rubro<input name="rubro" onChange={(event) => setFields({ ...fields, rubro: event.target.value })} placeholder="Materiales, combustible..." required value={fields.rubro} /></label></div>
    <label>Descripción<input name="descripcion" onChange={(event) => setFields({ ...fields, descripcion: event.target.value })} placeholder="Concepto del comprobante" required value={fields.descripcion} /></label>
    <label>Importe<input min="0" name="precio_unitario" onChange={(event) => setFields({ ...fields, importe: event.target.value })} required step="0.01" type="number" value={fields.importe} /></label>
      <button className={styles.primaryButton} disabled={pending || reading} type="submit">{pending ? "Guardando..." : "Guardar e imputar a obra"}</button>
    </div>
  </form>;
}

"use client";

import { useActionState } from "react";
import { cargarComprobante, type ExpenseActionState } from "./actions";
import styles from "./contabilidad.module.css";

const initialState: ExpenseActionState = {};

export function ExpenseForm({ obras }: { obras: { id: number; nombre: string }[] }) {
  const [state, formAction, pending] = useActionState(cargarComprobante, initialState);
  return <form action={formAction} className={styles.form} encType="multipart/form-data">
    {state.error && <div className={styles.error} role="alert">{state.error}</div>}
    {state.success && <div className={styles.success} role="status">{state.success}</div>}
    <label>Obra<select defaultValue="" name="obra_id" required><option disabled value="">Seleccioná una obra</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label>
    <label>Rubro<input name="rubro" placeholder="Combustible, materiales..." required /></label>
    <label>Descripción<input name="descripcion" placeholder="Factura o comprobante" required /></label>
    <div className={styles.formRow}><label>Importe<input min="0" name="precio_unitario" required step="0.01" type="number" /></label><label>Fecha<input defaultValue={new Date().toISOString().slice(0, 10)} name="fecha" required type="date" /></label></div>
    <label>Comprobante<input accept="image/*,.pdf" name="file" type="file" /></label>
    <button className={styles.primaryButton} disabled={pending} type="submit">{pending ? "Guardando..." : "Guardar comprobante"}</button>
  </form>;
}

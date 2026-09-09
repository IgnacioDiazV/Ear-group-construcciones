"use client";

import { useActionState, useState } from "react";
import { crearCobro, type CobroActionState } from "./actions";
import styles from "./cobros.module.css";

type Obra = { id: number; nombre: string };
const initialState: CobroActionState = {};

export function CobrosForm({ obras }: { obras: Obra[] }) {
  const [state, formAction, pending] = useActionState(crearCobro, initialState);
  const [method, setMethod] = useState("TRANSFERENCIA");

  return <form action={formAction} className={styles.form}>
    {state.error && <div className={styles.error} role="alert">{state.error}</div>}
    {state.success && <div className={styles.success} role="status">{state.success}</div>}
    <div className={styles.formGrid}>
      <label>Obra<select defaultValue="" name="obra_id" required><option disabled value="">Seleccioná una obra</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label>
      <label>Descripción<input name="descripcion" placeholder="Cuota 3/10 - Acopio materiales" required /></label>
      <label>Fecha estimada de cobro<input defaultValue={new Date().toISOString().slice(0, 10)} name="fecha_estimada_cobro" required type="date" /></label>
      <label>Monto<input min="0" name="monto" required step="0.01" type="number" /></label>
      <label>Moneda<select defaultValue="ARS" name="moneda"><option>ARS</option><option>USD</option></select></label>
      <label>Método de pago<select name="metodo_pago" onChange={(event) => setMethod(event.target.value)} value={method}><option>TRANSFERENCIA</option><option>EFECTIVO</option><option>CHEQUE</option></select></label>
      <label>Cuota número<input min="1" name="numero_cuota" type="number" /></label>
      <label>Total de cuotas<input min="1" name="total_cuotas" type="number" /></label>
    </div>
    {method === "CHEQUE" && <div className={styles.chequePanel}>
      <p className={styles.chequeTitle}>Datos del cheque</p>
      <div className={styles.formGrid}>
        <label>Banco<input name="banco" required /></label>
        <label>Número de cheque<input name="numero_cheque" required /></label>
        <label>Librador<input name="librador_nombre" /></label>
        <label>Fecha de pago diferido<input defaultValue={new Date().toISOString().slice(0, 10)} name="fecha_pago_diferido" required type="date" /></label>
      </div>
    </div>}
    <button className={styles.primaryButton} disabled={pending} type="submit">{pending ? "Guardando..." : "Registrar cobro"}</button>
  </form>;
}

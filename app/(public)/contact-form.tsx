"use client";

import { useActionState } from "react";
import { submitContactLead, type ContactFormState } from "./actions";
import styles from "./contact.module.css";

const initialState: ContactFormState = {};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactLead, initialState);

  return (
    <form action={formAction} className={styles.form}>
      {state.error && <div className={styles.alertError} role="alert">{state.error}</div>}
      {state.success && <div className={styles.alertSuccess} role="status">{state.success}</div>}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre y apellido</label>
          <input id="nombre" name="nombre" placeholder="Ej. Juan Pérez" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder="juan@email.com" required type="email" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="telefono">Teléfono <span>(opcional)</span></label>
          <input id="telefono" name="telefono" placeholder="+54 381 ..." type="tel" />
        </div>
        <div className={styles.field}>
          <label htmlFor="tipo_proyecto_interes">Tipo de proyecto <span>(opcional)</span></label>
          <select defaultValue="" id="tipo_proyecto_interes" name="tipo_proyecto_interes">
            <option disabled value="">Seleccioná una opción</option>
            <option value="Residencial">Residencial</option>
            <option value="Comercial">Comercial</option>
            <option value="Corporativo">Corporativo</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="mensaje">Mensaje</label>
        <textarea id="mensaje" name="mensaje" placeholder="Contanos brevemente tu proyecto..." required />
      </div>

      <button className={styles.submitButton} disabled={isPending} type="submit">
        {isPending ? "Enviando consulta..." : "Solicitar presupuesto"}
      </button>
    </form>
  );
}
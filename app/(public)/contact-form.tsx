"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { submitContactLead, type ContactFormState } from "./actions";
import styles from "./contact.module.css";

const initialState: ContactFormState = {};
const WHATSAPP_PHONE = "5493816958566";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactLead, initialState);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo_proyecto_interes: "",
    mensaje: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openWhatsAppMessage = () => {
    const { nombre, tipo_proyecto_interes, mensaje } = formData;
    
    let whatsappText = `Hola! Soy ${nombre}.`;
    if (tipo_proyecto_interes) {
      whatsappText += `\n\nTipo de proyecto: *${tipo_proyecto_interes}*`;
    }
    whatsappText += `\n\nMi consulta:\n${mensaje}`;

    const encodedMessage = encodeURIComponent(whatsappText);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  };

  useEffect(() => {
    if (state.success && !isPending) {
      setShowConfirmation(true);
      // Abrir WhatsApp automáticamente
      openWhatsAppMessage();
      if (formRef.current) {
        formRef.current.reset();
        setFormData({ nombre: "", tipo_proyecto_interes: "", mensaje: "" });
      }
      // Limpiar mensaje de éxito después de 5 segundos
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success, isPending]);

  if (showConfirmation) {
    return (
      <div className={styles.confirmationContainer}>
        <div className={styles.confirmationContent}>
          <div className={styles.checkmarkIcon}>✓</div>
          <h3 className={styles.confirmationTitle}>¡Consulta enviada con éxito!</h3>
          <p className={styles.confirmationMessage}>
            Recibimos tu consulta. Nuestro equipo te contactará en breve a través del email o teléfono proporcionado. En breve se abrirá WhatsApp para continuar la conversación.
          </p>
          <button
            className={styles.newQueryButton}
            onClick={() => setShowConfirmation(false)}
            type="button"
          >
            Enviar otra consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form} ref={formRef}>
      {state.error && <div className={styles.alertError} role="alert">{state.error}</div>}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre y apellido</label>
          <input 
            id="nombre" 
            name="nombre" 
            placeholder="Ej. Juan Pérez" 
            required 
            disabled={isPending}
            onChange={handleFormChange}
            value={formData.nombre}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input 
            id="email" 
            name="email" 
            placeholder="juan@email.com" 
            required 
            type="email" 
            disabled={isPending} 
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="telefono">Teléfono <span>(opcional)</span></label>
          <input 
            id="telefono" 
            name="telefono" 
            placeholder="+54 381 ..." 
            type="tel" 
            disabled={isPending} 
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="tipo_proyecto_interes">Tipo de proyecto <span>(opcional)</span></label>
          <select 
            id="tipo_proyecto_interes" 
            name="tipo_proyecto_interes" 
            disabled={isPending}
            onChange={handleFormChange}
            value={formData.tipo_proyecto_interes}
          >
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
        <textarea 
          id="mensaje" 
          name="mensaje" 
          placeholder="Contanos brevemente tu proyecto..." 
          required 
          disabled={isPending}
          onChange={handleFormChange}
          value={formData.mensaje}
        />
      </div>

      <button className={styles.submitButton} disabled={isPending} type="submit">
        {isPending ? (
          <>
            <span className={styles.spinner}></span>
            Enviando consulta...
          </>
        ) : (
          "Solicitar presupuesto"
        )}
      </button>
    </form>
  );
}
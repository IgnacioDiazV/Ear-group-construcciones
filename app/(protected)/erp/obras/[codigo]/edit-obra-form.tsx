"use client";

import { useActionState, useEffect } from "react";
import { updateObra, type ObraDetailActionState } from "./actions";
import styles from "./obra-detalle.module.css";
import type { Database } from "@/lib/supabase/database.types";
import { normalizeObraEstado } from "../estado";

type Obra = Database["public"]["Tables"]["obras"]["Row"];
const initialState: ObraDetailActionState = {};

export function EditObraForm({ obra, onClose }: { obra: Obra; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateObra, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [onClose, state.success]);

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <div aria-labelledby="edit-obra-title" aria-modal="true" className={styles.modal} role="dialog">
        <div className={styles.modalHeader}>
          <h2 id="edit-obra-title">Editar información</h2>
          <button aria-label="Cerrar" className={styles.closeButton} onClick={onClose} type="button">×</button>
        </div>
        <form action={formAction} className={styles.form}>
          <input name="obra_id" type="hidden" value={obra.id} />
          {state.error && <div className={styles.error} role="alert">{state.error}</div>}
          <div className={styles.formRow}><div className={styles.field}><label htmlFor="edit-codigo">Código</label><input defaultValue={obra.codigo} id="edit-codigo" name="codigo" required /></div><div className={styles.field}><label htmlFor="edit-nombre">Nombre de la obra</label><input defaultValue={obra.nombre} id="edit-nombre" name="nombre" required /></div></div>
          <div className={styles.formRow}><div className={styles.field}><label htmlFor="edit-tipo">Tipo de obra</label><input defaultValue={obra.tipo_obra} id="edit-tipo" name="tipo_obra" required /></div><div className={styles.field}><label htmlFor="edit-estado">Estado</label><select defaultValue={normalizeObraEstado(obra.estado)} id="edit-estado" name="estado"><option value="presupuesto">Presupuesto</option><option value="en_ejecucion">En ejecución</option><option value="finalizada">Finalizada</option><option value="cancelada">Cancelada</option></select></div></div>
          <div className={styles.field}><label htmlFor="edit-direccion">Dirección</label><input defaultValue={obra.direccion ?? ""} id="edit-direccion" name="direccion" /></div>
          <div className={styles.formRow}><div className={styles.field}><label htmlFor="edit-presupuesto">Presupuesto base</label><input defaultValue={obra.presupuesto_base ?? ""} id="edit-presupuesto" min="0" name="presupuesto_base" step="0.01" type="number" /></div><div className={styles.field}><label htmlFor="edit-moneda">Moneda</label><select defaultValue={obra.moneda_base ?? "ARS"} id="edit-moneda" name="moneda_base"><option>ARS</option><option>USD</option></select></div></div>
          <div className={styles.formRow}><div className={styles.field}><label htmlFor="edit-inicio">Fecha de inicio</label><input defaultValue={obra.fecha_inicio ?? ""} id="edit-inicio" name="fecha_inicio" type="date" /></div><div className={styles.field}><label htmlFor="edit-cierre">Cierre estimado</label><input defaultValue={obra.fecha_fin_estimada ?? ""} id="edit-cierre" name="fecha_fin_estimada" type="date" /></div></div>
          <div className={styles.field}><label htmlFor="edit-cierre-real">Cierre real</label><input defaultValue={obra.fecha_cierre_real ?? ""} id="edit-cierre-real" name="fecha_cierre_real" type="date" /></div>
          <label className={styles.checkboxField}><input defaultChecked={obra.es_publica_web ?? false} name="es_publica_web" type="checkbox" /> <span>Publicar en la web comercial</span></label>
          <div className={styles.formActions}><button className={styles.secondaryButton} onClick={onClose} type="button">Cancelar</button><button className={styles.primaryButton} disabled={isPending} type="submit">{isPending ? "Guardando..." : "Guardar cambios"}</button></div>
        </form>
      </div>
    </div>
  );
}

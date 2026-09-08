"use client";
/* eslint-disable @next/next/no-img-element */

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarGasto } from "./actions";
import styles from "./contabilidad.module.css";
import actionStyles from "./expense-actions.module.css";

type Expense = { id: number; obra_id: number; descripcion: string; rubro: string; precio_unitario: number; subtotal: number | null; fecha: string; comprobante_archivo_url: string | null; obra_nombre: string };

export function ExpenseTable({ expenses, obras }: { expenses: Expense[]; obras: { id: number; nombre: string }[] }) {
  const router = useRouter();
  const [obraFilter, setObraFilter] = useState("all");
  const [previewExpense, setPreviewExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const filtered = useMemo(() => obraFilter === "all" ? expenses : expenses.filter((expense) => expense.obra_id === Number(obraFilter)), [expenses, obraFilter]);
  async function downloadExpense(expense: Expense) {
    if (!expense.comprobante_archivo_url) return;
    const response = await fetch(expense.comprobante_archivo_url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = expense.descripcion || `comprobante-${expense.id}`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  function deleteExpense(expense: Expense) {
    if (!window.confirm(`¿Eliminar el comprobante de ${expense.descripcion}?`)) return;
    setDeletingId(expense.id);
    setError("");
    startTransition(async () => {
      const result = await eliminarGasto(expense.id, expense.comprobante_archivo_url);
      setDeletingId(null);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  return <>
    <div className={styles.tableToolbar}><p>{filtered.length} gastos registrados.</p><label>Filtrar por obra<select value={obraFilter} onChange={(event) => setObraFilter(event.target.value)}><option value="all">Todas las obras</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label></div>
    {error && <div className={styles.error} role="alert">{error}</div>}
    {filtered.length === 0 ? <div className={styles.empty}>No hay gastos para la selección actual.</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Obra</th><th>Rubro / descripción</th><th>Fecha</th><th>Importe</th><th>Acciones</th></tr></thead><tbody>{filtered.map((expense) => <tr key={expense.id}><td>{expense.obra_nombre}</td><td><strong>{expense.rubro}</strong><br />{expense.descripcion}</td><td>{expense.fecha}</td><td>${(expense.subtotal ?? expense.precio_unitario).toLocaleString("es-AR")}</td><td>{expense.comprobante_archivo_url ? <div className={actionStyles.actions}><button aria-label="Previsualizar comprobante" className={actionStyles.action} onClick={() => setPreviewExpense(expense)} title="Previsualizar comprobante" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></button><button aria-label="Descargar comprobante" className={actionStyles.action} onClick={() => downloadExpense(expense)} title="Descargar comprobante" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" /></svg></button><button aria-label="Eliminar comprobante" className={`${actionStyles.action} ${actionStyles.danger}`} disabled={deletingId === expense.id} onClick={() => deleteExpense(expense)} title="Eliminar comprobante" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div> : "Sin archivo"}</td></tr>)}</tbody></table></div>}
    {previewExpense && <div className={actionStyles.previewBackdrop} onClick={() => setPreviewExpense(null)} role="presentation"><div aria-label={`Vista previa de ${previewExpense.descripcion}`} aria-modal="true" className={actionStyles.previewModal} onClick={(event) => event.stopPropagation()} role="dialog"><div className={actionStyles.previewHeader}><span>{previewExpense.descripcion}</span><button aria-label="Cerrar vista previa" className={actionStyles.close} onClick={() => setPreviewExpense(null)} type="button">×</button></div><div className={actionStyles.previewBody}>{previewExpense.comprobante_archivo_url?.toLowerCase().includes(".pdf") ? <iframe className={actionStyles.previewFrame} src={previewExpense.comprobante_archivo_url} title="Comprobante PDF" /> : <img alt="Comprobante" className={actionStyles.previewImage} src={previewExpense.comprobante_archivo_url ?? ""} />}</div></div></div>}
  </>;
}

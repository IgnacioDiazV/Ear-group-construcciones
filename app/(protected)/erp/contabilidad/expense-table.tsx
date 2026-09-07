"use client";

import { useMemo, useState } from "react";
import styles from "./contabilidad.module.css";

type Expense = { id: number; obra_id: number; descripcion: string; rubro: string; precio_unitario: number; subtotal: number | null; fecha: string; comprobante_archivo_url: string | null; obra_nombre: string };

export function ExpenseTable({ expenses, obras }: { expenses: Expense[]; obras: { id: number; nombre: string }[] }) {
  const [obraFilter, setObraFilter] = useState("all");
  const filtered = useMemo(() => obraFilter === "all" ? expenses : expenses.filter((expense) => expense.obra_id === Number(obraFilter)), [expenses, obraFilter]);
  return <>
    <div className={styles.tableToolbar}><p>{filtered.length} gastos registrados.</p><label>Filtrar por obra<select value={obraFilter} onChange={(event) => setObraFilter(event.target.value)}><option value="all">Todas las obras</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label></div>
    {filtered.length === 0 ? <div className={styles.empty}>No hay gastos para la selección actual.</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Obra</th><th>Rubro / descripción</th><th>Fecha</th><th>Importe</th><th>Comprobante</th></tr></thead><tbody>{filtered.map((expense) => <tr key={expense.id}><td>{expense.obra_nombre}</td><td><strong>{expense.rubro}</strong><br />{expense.descripcion}</td><td>{expense.fecha}</td><td>${(expense.subtotal ?? expense.precio_unitario).toLocaleString("es-AR")}</td><td>{expense.comprobante_archivo_url ? <a href={expense.comprobante_archivo_url} rel="noopener noreferrer" target="_blank">Abrir comprobante</a> : "Sin archivo"}</td></tr>)}</tbody></table></div>}
  </>;
}

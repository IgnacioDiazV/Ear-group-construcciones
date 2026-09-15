"use client";
/* eslint-disable @next/next/no-img-element */

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarGasto, actualizarGasto, type ExpenseActionState } from "./actions";
import styles from "./contabilidad.module.css";
import actionStyles from "./expense-actions.module.css";

type Expense = { id: number; obra_id: number; descripcion: string; rubro: string; precio_unitario: number; subtotal: number | null; fecha: string; comprobante_archivo_url: string | null; obra_nombre: string };

export function ExpenseTable({ expenses, obras }: { expenses: Expense[]; obras: { id: number; nombre: string }[] }) {
  const router = useRouter();
  const [obraFilter, setObraFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Expense>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    let result = obraFilter === "all" ? expenses : expenses.filter((expense) => expense.obra_id === Number(obraFilter));
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter((expense) => 
        expense.descripcion.toLowerCase().includes(search) ||
        expense.rubro.toLowerCase().includes(search) ||
        expense.obra_nombre.toLowerCase().includes(search) ||
        String(expense.precio_unitario).includes(search)
      );
    }
    
    return result;
  }, [expenses, obraFilter, searchTerm]);
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

  function openEditModal(expense: Expense) {
    setEditingExpense(expense);
    setEditFormData({
      id: expense.id,
      obra_id: expense.obra_id,
      rubro: expense.rubro,
      descripcion: expense.descripcion,
      precio_unitario: expense.precio_unitario,
      fecha: expense.fecha,
    });
  }

  function closeEditModal() {
    setEditingExpense(null);
    setEditFormData({});
  }

  async function saveEditedExpense() {
    if (!editingExpense || !editFormData.id) return;
    setEditingId(editingExpense.id);
    setError("");
    
    const formData = new FormData();
    formData.append("id", String(editFormData.id));
    formData.append("obra_id", String(editFormData.obra_id ?? editingExpense.obra_id));
    formData.append("rubro", String(editFormData.rubro ?? editingExpense.rubro));
    formData.append("descripcion", String(editFormData.descripcion ?? editingExpense.descripcion));
    formData.append("precio_unitario", String(editFormData.precio_unitario ?? editingExpense.precio_unitario));
    formData.append("fecha", String(editFormData.fecha ?? editingExpense.fecha));

    startTransition(async () => {
      const result = await actualizarGasto({}, formData);
      setEditingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      closeEditModal();
      router.refresh();
    });
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
    <div className={styles.tableToolbar}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
        <label style={{ display: 'grid', gap: '4px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700, flex: 1 }}>
          Buscar
          <input 
            type="text" 
            placeholder="Descripción, rubro, obra, importe..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d3cec9', borderRadius: '8px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
          />
        </label>
        
      </div>
      <label style={{ display: 'grid', gap: '4px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700, minWidth: '240px' }}>
        Filtrar por obra
        <select value={obraFilter} onChange={(event) => setObraFilter(event.target.value)} style={{ width: '100%', padding: '9px', border: '1px solid #d3cec9', borderRadius: '8px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}>
          <option value="all">Todas las obras</option>
          {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
        </select>
      </label>
    </div>
    {error && <div className={styles.error} role="alert">{error}</div>}
    {filtered.length === 0 ? (
      <div className={styles.empty}>
        {searchTerm.trim() ? "No se encontraron gastos que coincidan con la búsqueda." : "No hay gastos para la selección actual."}
      </div>
    ) : (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Obra</th>
              <th>Rubro / descripción</th>
              <th>Fecha</th>
              <th>Importe</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.obra_nombre}</td>
                <td>
                  <strong>{expense.rubro}</strong>
                  <br />
                  {expense.descripcion}
                </td>
                <td>{expense.fecha}</td>
                <td>${(expense.subtotal ?? expense.precio_unitario).toLocaleString("es-AR")}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    {expense.comprobante_archivo_url && (
                      <a
                        href={expense.comprobante_archivo_url}
                        target="_blank"
                        rel="noreferrer"
                        className={actionStyles.action}
                        title="Ver comprobante"
                        aria-label="Ver comprobante"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      </a>
                    )}
                    {expense.comprobante_archivo_url && (
                      <button
                        aria-label="Descargar comprobante"
                        className={actionStyles.action}
                        onClick={() => downloadExpense(expense)}
                        title="Descargar comprobante"
                        type="button"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />
                        </svg>
                      </button>
                    )}
                    <button
                      aria-label="Editar gasto"
                      className={actionStyles.action}
                      disabled={editingId === expense.id}
                      onClick={() => openEditModal(expense)}
                      title="Editar gasto"
                      type="button"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                      </svg>
                    </button>
                    <button
                      aria-label="Eliminar gasto"
                      className={`${actionStyles.action} ${actionStyles.danger}`}
                      disabled={deletingId === expense.id}
                      onClick={() => deleteExpense(expense)}
                      title="Eliminar gasto"
                      type="button"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m6 6 12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Modal de Edición */}
    {editingExpense && (
      <div
        className={actionStyles.previewBackdrop}
        onClick={closeEditModal}
        role="presentation"
      >
        <div
          aria-label={`Editar gasto: ${editingExpense.descripcion}`}
          aria-modal="true"
          className={actionStyles.previewModal}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          style={{ maxWidth: '500px' }}
        >
          <div className={actionStyles.previewHeader}>
            <span>Editar Gasto</span>
            <button
              aria-label="Cerrar"
              className={actionStyles.close}
              onClick={closeEditModal}
              type="button"
            >
              ×
            </button>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, overflow: 'auto' }}>
            <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
              Obra
              <select
                value={editFormData.obra_id ?? editingExpense.obra_id}
                onChange={(e) => setEditFormData({ ...editFormData, obra_id: Number(e.target.value) })}
                style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
              >
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
              Rubro
              <input
                type="text"
                value={editFormData.rubro ?? editingExpense.rubro}
                onChange={(e) => setEditFormData({ ...editFormData, rubro: e.target.value })}
                placeholder="Materiales, combustible..."
                style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
              Descripción
              <input
                type="text"
                value={editFormData.descripcion ?? editingExpense.descripcion}
                onChange={(e) => setEditFormData({ ...editFormData, descripcion: e.target.value })}
                placeholder="Concepto del comprobante"
                style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
              Importe
              <input
                type="number"
                min="0"
                step="0.01"
                value={editFormData.precio_unitario ?? editingExpense.precio_unitario}
                onChange={(e) => setEditFormData({ ...editFormData, precio_unitario: Number(e.target.value) })}
                style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
              Fecha
              <input
                type="date"
                value={editFormData.fecha ?? editingExpense.fecha}
                onChange={(e) => setEditFormData({ ...editFormData, fecha: e.target.value })}
                style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                onClick={closeEditModal}
                style={{ border: '1px solid #d3cec9', borderRadius: '4px', padding: '10px 15px', background: '#fff', color: '#2c2420', cursor: 'pointer', font: 'inherit', fontSize: '13px', fontWeight: 700 }}
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedExpense}
                disabled={editingId === editingExpense.id}
                style={{ border: 0, borderRadius: '4px', padding: '10px 15px', background: '#3d1c14', color: '#fff', cursor: editingId === editingExpense.id ? 'wait' : 'pointer', font: 'inherit', fontSize: '13px', fontWeight: 700, opacity: editingId === editingExpense.id ? 0.6 : 1 }}
                type="button"
              >
                {editingId === editingExpense.id ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>;
}

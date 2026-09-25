"use client";
/* eslint-disable @next/next/no-img-element */

import { startTransition, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { eliminarGasto, actualizarGasto, type ExpenseActionState } from "./actions";
import styles from "./contabilidad.module.css";
import actionStyles from "./expense-actions.module.css";

type Expense = { 
  id: number; 
  obra_id: number; 
  descripcion: string; 
  rubro: string; 
  precio_unitario: number; 
  subtotal: number | null; 
  fecha: string; 
  comprobante_archivo_url: string | null; 
  obra_nombre: string 
};

const ELEMENTOS_POR_PAGINA = 20;

export function ExpenseTable({ expenses, obras }: { expenses: Expense[]; obras: { id: number; nombre: string }[] }) {
  const router = useRouter();
  const [obraFilter, setObraFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Expense>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, obraFilter, fechaDesde, fechaHasta]);

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

    // Filtrado por rango de fechas
    if (fechaDesde || fechaHasta) {
      result = result.filter((expense) => {
        const itemFecha = expense.fecha.slice(0, 10);
        if (fechaDesde && itemFecha < fechaDesde) return false;
        if (fechaHasta && itemFecha > fechaHasta) return false;
        return true;
      });
    }
    
    return result;
  }, [expenses, obraFilter, searchTerm, fechaDesde, fechaHasta]);

  const totalPaginas = Math.ceil(filtered.length / ELEMENTOS_POR_PAGINA) || 1;
  const itemsPaginados = filtered.slice((paginaActual - 1) * ELEMENTOS_POR_PAGINA, paginaActual * ELEMENTOS_POR_PAGINA);
  const desde = filtered.length === 0 ? 0 : (paginaActual - 1) * ELEMENTOS_POR_PAGINA + 1;
  const hasta = Math.min(paginaActual * ELEMENTOS_POR_PAGINA, filtered.length);

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
      if (result.error) { 
        setError(result.error); 
        return; 
      }
      router.refresh();
    });
  }

  return (
    <>
      {/* Contenedor sin bordes ni marco exterior */}
      <div className="mb-4 px-5 pt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Input de búsqueda con ícono */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-stone-50/50 border border-stone-200 rounded-lg focus-within:bg-white focus-within:border-stone-400 transition">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="Descripción, rubro, obra, importe..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="flex-1 bg-transparent text-xs text-stone-900 placeholder:text-stone-400 outline-none"
          />
        </div>

        {/* Controles de fecha y obra - agrupados a la derecha */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Fecha Desde */}
          <div className="flex items-center gap-1.5 border border-stone-200 rounded-lg bg-white px-2.5 py-1 text-xs text-stone-600">
            <span className="text-xs text-stone-500 font-semibold whitespace-nowrap">Desde:</span>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
              className="bg-transparent text-xs text-stone-900 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex items-center gap-1.5 border border-stone-200 rounded-lg bg-white px-2.5 py-1 text-xs text-stone-600">
            <span className="text-xs text-stone-500 font-semibold whitespace-nowrap">Hasta:</span>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
              className="bg-transparent text-xs text-stone-900 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Separador vertical */}
          <div className="hidden lg:block h-5 w-px bg-stone-200" />

          {/* Filtro Obra */}
          <select 
            value={obraFilter} 
            onChange={(event) => setObraFilter(event.target.value)} 
            className="h-[34px] px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white text-xs text-stone-900 focus:border-stone-400 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las obras</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
          </select>
        </div>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {searchTerm.trim() || fechaDesde || fechaHasta ? "No se encontraron gastos que coincidan con los filtros." : "No hay gastos para la selección actual."}
        </div>
      ) : (
        <>
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
                {itemsPaginados.map((expense) => (
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
                              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z" />
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

          {/* Pie de página con paginador */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #d3cec9', padding: '12px 16px' }} className="sm:flex-row sm:items-center sm:justify-between">
            <div style={{ fontSize: '12px', color: '#8b7a73' }}>
              Mostrando {desde} a {hasta} de {filtered.length} comprobantes
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="bg-[#2B1810] text-white hover:bg-[#3D2318] rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                type="button"
              >
                Anterior
              </button>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4a3f3a' }}>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
                className="bg-[#2B1810] text-white hover:bg-[#3D2318] rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
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
    </>
  );
}
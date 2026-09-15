"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { marcarComoCobrado, eliminarCobro, actualizarCobro } from "./actions";
import styles from "./cobros.module.css";

type Cobro = {
  id: number;
  obra_id: number;
  obra_nombre: string;
  descripcion: string;
  monto: number;
  moneda: string | null;
  numero_cuota: number | null;
  total_cuotas: number | null;
  metodo_pago: string;
  fecha_estimada_cobro: string | null;
  fecha_cobro_real: string | null;
  estado: string | null;
  cheque_id?: number;
  cheque_banco?: string;
  cheque_numero?: string;
  cheque_fecha?: string;
};

type Obra = { id: number; nombre: string };

export function CobrosTable({ rows, obras = [] }: { rows: Cobro[]; obras?: Obra[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [editingCobro, setEditingCobro] = useState<Cobro | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Cobro>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const WHATSAPP_PHONE = "5493816958566";
  const DAYS_AHEAD = 5;

  function parseFechaLocal(value?: string | null): Date | null {
    if (!value) return null;
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12, 0, 0);
    const latino = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(value);
    if (latino) return new Date(Number(latino[3]), Number(latino[2]) - 1, Number(latino[1]), 12, 0, 0);
    return null;
  }

  function avisarVencimientos() {
    console.log("Datos crudos en rows:", rows);

    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + DAYS_AHEAD);
    limit.setHours(23, 59, 59, 999);

    const pendientes = rows.filter((row) => {
      // 1. Descartar sólo si ya está efectivamente cobrado
      const est = (row.estado || "").toLowerCase().trim();
      if (est === "cobrado") return false;

      // 2. Detección normalizada: método de pago o presencia de datos de cheque
      const esCheque =
        (row.metodo_pago || "").toLowerCase().includes("cheque") ||
        Boolean(row.cheque_numero) ||
        Boolean(row.cheque_id);

      if (!esCheque) return false;

      // 3. Sólo avisar cheques sin fecha o próximos a vencer
      const fecha = parseFechaLocal(row.cheque_fecha || row.fecha_estimada_cobro);
      return !fecha || fecha <= limit;
    });

    console.log("Pendientes detectados:", pendientes);

    if (!pendientes.length) {
      window.alert(`No se detectaron cheques pendientes. Registros totales en vista: ${rows.length}. Revisá en consola si metodo_pago figura como CHEQUE.`);
      return;
    }

    const lineas = pendientes
      .map((row) => {
        const banco = row.cheque_banco || "A convenir";
        const num = row.cheque_numero ? ` · N°: ${row.cheque_numero}` : "";
        const fecha = row.cheque_fecha || row.fecha_estimada_cobro || "Sin fecha";
        return `• ${row.obra_nombre}\n  Detalle: ${row.descripcion}\n  Monto: $${Number(row.monto).toLocaleString("es-AR")}\n  Banco: ${banco}${num} | Vence: ${fecha}`;
      })
      .join("\n\n");

    const total = pendientes.reduce((acc, row) => acc + (Number(row.monto) || 0), 0);
    const mensaje = `🔔 *EAR GROUP - Cheques y Cobros a gestionar*\n\n${lineas}\n\n*Total a ingresar:* $${total.toLocaleString("es-AR")}`;

    window.open(
      `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function cobrar(row: Cobro) {
    setPendingId(row.id);
    setError("");
    startTransition(async () => {
      const result = await marcarComoCobrado(row.id, row.cheque_id);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function openEditModal(cobro: Cobro) {
    setEditingCobro(cobro);
    setEditFormData({
      id: cobro.id,
      obra_id: cobro.obra_id,
      descripcion: cobro.descripcion,
      monto: cobro.monto,
      numero_cuota: cobro.numero_cuota,
      total_cuotas: cobro.total_cuotas,
      fecha_estimada_cobro: cobro.fecha_estimada_cobro,
      estado: cobro.estado,
      cheque_id: cobro.cheque_id,
      cheque_banco: cobro.cheque_banco,
      cheque_numero: cobro.cheque_numero,
      cheque_fecha: cobro.cheque_fecha,
    });
  }

  function closeEditModal() {
    setEditingCobro(null);
    setEditFormData({});
  }

  async function saveEditedCobro() {
    if (!editingCobro || !editFormData.id) return;
    setEditingId(editingCobro.id);
    setError("");

    const formData = new FormData();
    formData.append("id", String(editFormData.id));
    formData.append("obra_id", String(editFormData.obra_id ?? editingCobro.obra_id));
    formData.append("descripcion", String(editFormData.descripcion ?? editingCobro.descripcion));
    formData.append("monto", String(editFormData.monto ?? editingCobro.monto));
    formData.append("numero_cuota", String(editFormData.numero_cuota ?? editingCobro.numero_cuota ?? ""));
    formData.append("total_cuotas", String(editFormData.total_cuotas ?? editingCobro.total_cuotas ?? ""));
    formData.append("fecha_estimada_cobro", String(editFormData.fecha_estimada_cobro ?? editingCobro.fecha_estimada_cobro ?? ""));
    formData.append("estado", String(editFormData.estado ?? editingCobro.estado ?? "pendiente"));
    
    if (editFormData.cheque_id ?? editingCobro.cheque_id) {
      formData.append("cheque_id", String(editFormData.cheque_id ?? editingCobro.cheque_id));
      formData.append("banco", String(editFormData.cheque_banco ?? editingCobro.cheque_banco ?? ""));
      formData.append("numero_cheque", String(editFormData.cheque_numero ?? editingCobro.cheque_numero ?? ""));
      formData.append("fecha_pago_diferido", String(editFormData.cheque_fecha ?? editingCobro.cheque_fecha ?? ""));
    }

    startTransition(async () => {
      const result = await actualizarCobro({}, formData);
      setEditingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      closeEditModal();
      router.refresh();
    });
  }

  function deleteCobro(cobro: Cobro) {
    if (!window.confirm(`¿Eliminar el cobro de ${cobro.descripcion}?`)) return;
    setError("");
    startTransition(async () => {
      const result = await eliminarCobro(cobro.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {rows.length === 0 ? (
        <div className={styles.empty}>No hay cobros registrados.</div>
      ) : (
        <>
          <div className={styles.tableToolbar}>
            <p>{rows.length} registros en cartera.</p>
            <button
              className={styles.whatsappButton}
              onClick={avisarVencimientos}
              type="button"
            >
              🔔 Avisar vencimientos por WhatsApp
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Cuota</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Fecha / vencimiento</th>
                  <th>Cheque</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const estaCobrado = (row.estado || "").toLowerCase().trim() === "cobrado";
                  return (
                    <tr key={row.id}>
                      <td>{row.obra_nombre}</td>
                      <td>
                        {row.numero_cuota ?? "-"}
                        {row.total_cuotas ? `/${row.total_cuotas}` : ""}
                      </td>
                      <td>{row.descripcion}</td>
                      <td>
                        ${row.monto.toLocaleString("es-AR")} {row.moneda ?? "ARS"}
                      </td>
                      <td>{row.metodo_pago}</td>
                      <td>
                        {row.fecha_cobro_real ??
                          row.cheque_fecha ??
                          row.fecha_estimada_cobro ??
                          "Sin fecha"}
                      </td>
                      <td>
                        {row.cheque_numero
                          ? `${row.cheque_banco} · #${row.cheque_numero}`
                          : "-"}
                      </td>
                      <td>
                        <span className={styles.status}>
                          {row.estado ? row.estado.toUpperCase() : "PENDIENTE"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {!estaCobrado ? (
                            <button
                              className={styles.actionButton}
                              disabled={pendingId === row.id}
                              onClick={() => cobrar(row)}
                              type="button"
                            >
                              {pendingId === row.id ? "Guardando..." : "Marcar cobrado"}
                            </button>
                          ) : (
                            <span style={{ fontSize: '13px', color: '#6b5b54', fontWeight: 500 }}>Completo</span>
                          )}
                          <button
                            aria-label="Editar cobro"
                            className={styles.iconButton}
                            onClick={() => openEditModal(row)}
                            title="Editar cobro"
                            type="button"
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                            </svg>
                          </button>
                          <button
                            aria-label="Eliminar cobro"
                            className={styles.iconButton}
                            onClick={() => deleteCobro(row)}
                            title="Eliminar cobro"
                            type="button"
                            style={{ color: '#d32f2f' }}
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" style={{ fill: 'currentColor' }}>
                              <path d="M6 4v2h12V4H6zm1 3h10v10c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V7zm2 2v6h2V9H9zm4 0v6h2V9h-2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {/* Modal de Edición */}
      {editingCobro && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={closeEditModal}
          role="presentation"
        >
          <div
            aria-label={`Editar cobro: ${editingCobro.descripcion}`}
            aria-modal="true"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #e0d5d0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, color: '#3E2723', fontSize: '16px', fontWeight: 700 }}>Editar Cobro</h3>
              <button
                aria-label="Cerrar"
                onClick={closeEditModal}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#8b7b76',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>
              <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                Obra
                <select
                  value={editFormData.obra_id ?? editingCobro.obra_id}
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
                Descripción
                <input
                  type="text"
                  value={editFormData.descripcion ?? editingCobro.descripcion}
                  onChange={(e) => setEditFormData({ ...editFormData, descripcion: e.target.value })}
                  placeholder="Concepto del cobro"
                  style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                Monto
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.monto ?? editingCobro.monto}
                  onChange={(e) => setEditFormData({ ...editFormData, monto: Number(e.target.value) })}
                  style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                Cuota
                <input
                  type="number"
                  min="1"
                  value={editFormData.numero_cuota ?? editingCobro.numero_cuota ?? ""}
                  onChange={(e) => setEditFormData({ ...editFormData, numero_cuota: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Número de cuota (opcional)"
                  style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                Total de cuotas
                <input
                  type="number"
                  min="1"
                  value={editFormData.total_cuotas ?? editingCobro.total_cuotas ?? ""}
                  onChange={(e) => setEditFormData({ ...editFormData, total_cuotas: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Total de cuotas (opcional)"
                  style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                Fecha de cobro estimada
                <input
                  type="date"
                  value={editFormData.fecha_estimada_cobro ?? editingCobro.fecha_estimada_cobro ?? ""}
                  onChange={(e) => setEditFormData({ ...editFormData, fecha_estimada_cobro: e.target.value })}
                  style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                Estado
                <select
                  value={editFormData.estado ?? editingCobro.estado ?? "pendiente"}
                  onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                  style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="cobrado">Cobrado</option>
                </select>
              </label>

              {(editFormData.cheque_id ?? editingCobro.cheque_id) && (
                <>
                  <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #d3cec9' }} />
                  <p style={{ margin: '0 0 12px 0', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>Datos del Cheque</p>

                  <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                    Banco
                    <input
                      type="text"
                      value={editFormData.cheque_banco ?? editingCobro.cheque_banco ?? ""}
                      onChange={(e) => setEditFormData({ ...editFormData, cheque_banco: e.target.value })}
                      placeholder="Nombre del banco"
                      style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                    Número de cheque
                    <input
                      type="text"
                      value={editFormData.cheque_numero ?? editingCobro.cheque_numero ?? ""}
                      onChange={(e) => setEditFormData({ ...editFormData, cheque_numero: e.target.value })}
                      placeholder="Número del cheque"
                      style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '5px', color: '#4a3f3a', fontSize: '12px', fontWeight: 700 }}>
                    Fecha de pago diferido
                    <input
                      type="date"
                      value={editFormData.cheque_fecha ?? editingCobro.cheque_fecha ?? ""}
                      onChange={(e) => setEditFormData({ ...editFormData, cheque_fecha: e.target.value })}
                      style={{ padding: '9px', border: '1px solid #d3cec9', borderRadius: '4px', background: '#fff', color: '#2c2420', font: 'inherit', fontSize: '13px' }}
                    />
                  </label>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  onClick={closeEditModal}
                  type="button"
                  style={{ border: '1px solid #d3cec9', borderRadius: '4px', padding: '10px 15px', background: '#fff', color: '#2c2420', cursor: 'pointer', font: 'inherit', fontSize: '13px', fontWeight: 700 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEditedCobro}
                  disabled={editingId === editingCobro.id}
                  type="button"
                  style={{ border: 0, borderRadius: '4px', padding: '10px 15px', background: '#3E2723', color: '#fff', cursor: editingId === editingCobro.id ? 'wait' : 'pointer', font: 'inherit', fontSize: '13px', fontWeight: 700, opacity: editingId === editingCobro.id ? 0.6 : 1 }}
                >
                  {editingId === editingCobro.id ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
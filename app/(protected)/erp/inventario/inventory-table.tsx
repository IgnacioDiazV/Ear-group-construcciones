"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { registrarDevolucion, transferirHerramienta, editarAsignacionHerramienta } from "./actions";
import styles from "./inventario.module.css";

type HerramientaActiva = { id: number; obra_id: number; descripcion_libre: string; cantidad: number; cantidad_devuelta: number; fecha_entrega: string; obra_nombre: string };
type ObraOption = { id: number; nombre: string };
type DepositoOption = { id: number; nombre: string; es_obrador: boolean | null };

export function InventoryTable({ items, obras, depositos }: { items: HerramientaActiva[]; obras: ObraOption[]; depositos: DepositoOption[] }) {
  const router = useRouter();
  const [selectedObraId, setSelectedObraId] = useState("all");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [transferItem, setTransferItem] = useState<HerramientaActiva | null>(null);
  const [transferDestino, setTransferDestino] = useState("");
  const [editItem, setEditItem] = useState<HerramientaActiva | null>(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editCantidad, setEditCantidad] = useState(1);
  const [editObraId, setEditObraId] = useState("");
  const filteredItems = selectedObraId === "all"
    ? items
    : items.filter((item) => item.obra_id === Number(selectedObraId));

  function returnTool(item: HerramientaActiva) {
    const pendiente = item.cantidad - item.cantidad_devuelta;
    const quantity = Number(window.prompt(`Cantidad a devolver (máximo ${pendiente})`, String(pendiente)));
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    setPendingId(item.id);
    setError("");
    startTransition(async () => {
      const result = await registrarDevolucion(item.id, quantity, item.cantidad, item.cantidad_devuelta);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function openTransferModal(item: HerramientaActiva) {
    setTransferItem(item);
    setTransferDestino("");
    setError("");
  }

  function confirmarTransferencia() {
    if (!transferItem || !transferDestino) return;
    const [tipo, rawId] = transferDestino.split(":");
    const destinoObraId = tipo === "obra" ? Number(rawId) : null;
    const depositoDestinoId = tipo === "deposito" ? Number(rawId) : null;
    setPendingId(transferItem.id);
    setError("");
    startTransition(async () => {
      const result = await transferirHerramienta(transferItem.id, destinoObraId, depositoDestinoId);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTransferItem(null);
      router.refresh();
    });
  }

  function openEditModal(item: HerramientaActiva) {
    setEditItem(item);
    setEditDescripcion(item.descripcion_libre);
    setEditCantidad(item.cantidad);
    setEditObraId(String(item.obra_id));
    setError("");
  }

  function confirmarEdicion() {
    if (!editItem || !editDescripcion.trim() || editCantidad <= 0 || !editObraId) return;
    setPendingId(editItem.id);
    setError("");
    startTransition(async () => {
      const result = await editarAsignacionHerramienta(editItem.id, {
        descripcion_libre: editDescripcion,
        cantidad: editCantidad,
        obra_id: Number(editObraId),
      });
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditItem(null);
      router.refresh();
    });
  }

  if (items.length === 0) return <div className={styles.empty}>No hay herramientas activas asignadas a obras.</div>;

  return <div className={styles.tableWrapper}>
    <div className={styles.tableToolbar}>
      <p className={styles.tableCount}>{filteredItems.length} {selectedObraId === "all" ? "asignaciones pendientes de devolución" : "asignaciones en esta obra"}.</p>
      <label className={styles.filterLabel} htmlFor="obra-filter">Filtrar por obra
        <select className={styles.filterSelect} id="obra-filter" onChange={(event) => setSelectedObraId(event.target.value)} value={selectedObraId}>
          <option value="all">Todas las obras</option>
          {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
        </select>
      </label>
    </div>
    {error && <div className={styles.error} role="alert">{error}</div>}
    {filteredItems.length === 0 ? <div className={styles.empty}>No hay herramientas activas para la obra seleccionada.</div> : <table className={styles.table}><thead><tr><th>Herramienta</th><th>Obra destino</th><th>Saldo pendiente</th><th>Fecha de envío</th><th>Acción</th></tr></thead><tbody>{filteredItems.map((item) => <tr key={item.id}><td>{item.descripcion_libre}</td><td>{item.obra_nombre}</td><td>{item.cantidad - item.cantidad_devuelta} de {item.cantidad}</td><td>{item.fecha_entrega}</td><td><button className={styles.secondaryButton} disabled={pendingId === item.id} onClick={() => returnTool(item)} type="button">{pendingId === item.id ? "Guardando..." : "Marcar Devuelto"}</button>{" "}<button className={styles.secondaryButton} disabled={pendingId === item.id} onClick={() => openTransferModal(item)} type="button">Transferir</button>{" "}<button aria-label="Editar herramienta" className={styles.secondaryButton} disabled={pendingId === item.id} onClick={() => openEditModal(item)} type="button">✏️ Editar</button></td></tr>)}</tbody></table>}
    {transferItem && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTransferItem(null)} role="presentation">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(event) => event.stopPropagation()} role="dialog">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8D6E63]">Transferencia</p>
          <h2 className="text-xl font-bold text-neutral-800">Transferir &quot;{transferItem.descripcion_libre}&quot;</h2>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Destino</span>
          <select className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" onChange={(event) => setTransferDestino(event.target.value)} value={transferDestino}>
            <option value="">Seleccioná un destino</option>
            <optgroup label="Obras">
              {obras.filter((obra) => obra.id !== transferItem.obra_id).map((obra) => <option key={`obra:${obra.id}`} value={`obra:${obra.id}`}>{obra.nombre}</option>)}
            </optgroup>
            <optgroup label="Depósitos">
              {depositos.map((deposito) => <option key={`deposito:${deposito.id}`} value={`deposito:${deposito.id}`}>{deposito.nombre}{deposito.es_obrador ? " (Galpón central)" : ""}</option>)}
            </optgroup>
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button className="border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 transition" onClick={() => setTransferItem(null)} type="button">Cancelar</button>
          <button className="bg-[#3E2723] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2C1B17] transition disabled:opacity-50" disabled={!transferDestino || pendingId === transferItem.id} onClick={confirmarTransferencia} type="button">{pendingId === transferItem.id ? "Transfiriendo..." : "Confirmar"}</button>
        </div>
      </div>
    </div>}
    {editItem && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditItem(null)} role="presentation">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(event) => event.stopPropagation()} role="dialog">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8D6E63]">Edición</p>
          <h2 className="text-xl font-bold text-neutral-800">Editar herramienta</h2>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Nombre / concepto</span>
          <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" onChange={(event) => setEditDescripcion(event.target.value)} value={editDescripcion} />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Cantidad</span>
          <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" min="1" onChange={(event) => setEditCantidad(Math.max(1, Number(event.target.value) || 1))} type="number" value={editCantidad} />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Obra asignada</span>
          <select className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" onChange={(event) => setEditObraId(event.target.value)} value={editObraId}>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button className="border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 transition" onClick={() => setEditItem(null)} type="button">Cancelar</button>
          <button className="bg-[#3E2723] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2C1B17] transition disabled:opacity-50" disabled={!editDescripcion.trim() || editCantidad <= 0 || pendingId === editItem.id} onClick={confirmarEdicion} type="button">{pendingId === editItem.id ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </div>
    </div>}
  </div>;
}

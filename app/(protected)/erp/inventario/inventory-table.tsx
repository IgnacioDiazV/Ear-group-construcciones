"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { registrarDevolucion } from "./actions";
import styles from "./inventario.module.css";

type HerramientaActiva = { id: number; obra_id: number; descripcion_libre: string; cantidad: number; cantidad_devuelta: number; fecha_entrega: string; obra_nombre: string };
type ObraOption = { id: number; nombre: string };

export function InventoryTable({ items, obras }: { items: HerramientaActiva[]; obras: ObraOption[] }) {
  const router = useRouter();
  const [selectedObraId, setSelectedObraId] = useState("all");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");
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
    {filteredItems.length === 0 ? <div className={styles.empty}>No hay herramientas activas para la obra seleccionada.</div> : <table className={styles.table}><thead><tr><th>Herramienta</th><th>Obra destino</th><th>Saldo pendiente</th><th>Fecha de envío</th><th>Acción</th></tr></thead><tbody>{filteredItems.map((item) => <tr key={item.id}><td>{item.descripcion_libre}</td><td>{item.obra_nombre}</td><td>{item.cantidad - item.cantidad_devuelta} de {item.cantidad}</td><td>{item.fecha_entrega}</td><td><button className={styles.secondaryButton} disabled={pendingId === item.id} onClick={() => returnTool(item)} type="button">{pendingId === item.id ? "Guardando..." : "Marcar Devuelto"}</button></td></tr>)}</tbody></table>}
  </div>;
}

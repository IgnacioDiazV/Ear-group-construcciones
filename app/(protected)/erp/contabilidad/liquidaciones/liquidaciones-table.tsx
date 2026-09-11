"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarLiquidacion } from "./actions";
import styles from "./liquidaciones.module.css";

type Liquidacion = { id: string; obra_id: number | null; semana_etiqueta: string; fecha_pago: string; total_pagado: number; archivo_url: string | null; created_at: string | null; obra_nombre: string };

function nombreObra(row: Liquidacion) {
  return row.obra_id == null ? "Planilla General" : row.obra_nombre;
}

export function LiquidacionesTable({ rows }: { rows: Liquidacion[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  function download(row: Liquidacion) { if (!row.archivo_url) return; const anchor = document.createElement("a"); anchor.href = row.archivo_url; anchor.download = `${row.semana_etiqueta}.xlsx`; anchor.click(); }
  function remove(row: Liquidacion) { if (!window.confirm(`¿Eliminar la liquidación ${row.semana_etiqueta}?`)) return; setPendingId(row.id); setError(""); startTransition(async () => { const result = await eliminarLiquidacion(String(row.id), row.archivo_url); setPendingId(null); if (result.error) { setError(result.error); return; } router.refresh(); }); }
  return <>{error && <div className={styles.error} role="alert">{error}</div>}{rows.length === 0 ? <div className={styles.empty}>No hay planillas guardadas.</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Obra</th><th>Semana / Período</th><th>Fecha de carga</th><th>Monto total</th><th>Acciones</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{nombreObra(row)}</td><td>{row.semana_etiqueta}</td><td>{row.fecha_pago || (row.created_at ? new Date(row.created_at).toLocaleDateString("es-AR") : "Sin fecha")}</td><td>${row.total_pagado.toLocaleString("es-AR")}</td><td><div className={styles.actions}>{row.archivo_url && <button className={styles.actionButton} onClick={() => download(row)} type="button">Descargar</button>}<button className={styles.deleteButton} disabled={pendingId === row.id} onClick={() => remove(row)} type="button">{pendingId === row.id ? "Eliminando..." : "Eliminar"}</button></div></td></tr>)}</tbody></table></div>}</>;
}

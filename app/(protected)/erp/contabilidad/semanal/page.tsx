"use client";

import { startTransition, useMemo, useState } from "react";
import { guardarCajaSemanal, type CajaSemanalFilaPayload } from "./actions";
import styles from "./semanal.module.css";

type Row = CajaSemanalFilaPayload & { id: number };
const emptyRow = (id: number): Row => ({ id, concepto_o_nombre: "", horas: null, valor_hora: null, debe: 0, debe_aun: "", pago_final: 0, pago_hoy: 0, medio_pago: "EFECTIVO", detalle_pago: "" });

function calculatePayment(row: Row) {
  if (row.horas === null || row.valor_hora === null) return row.pago_hoy;
  return Math.max(0, row.horas * row.valor_hora - row.debe);
}

export default function CajaSemanalPage() {
  const [week, setWeek] = useState("Semana 31/08 al 04/09");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cashBalance, setCashBalance] = useState(0);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow(1)]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const totals = useMemo(() => rows.reduce((result, row) => {
    const payment = calculatePayment(row);
    result.total += payment;
    if (row.medio_pago === "TRANSFERENCIA") result.transfer += payment;
    else if (row.medio_pago === "MIXTO") { result.transfer += payment / 2; result.cash += payment / 2; }
    else result.cash += payment;
    return result;
  }, { cash: 0, transfer: 0, total: 0 }), [rows]);

  function updateRow(id: number, field: keyof Row, value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: field === "concepto_o_nombre" || field === "debe_aun" || field === "detalle_pago" || field === "medio_pago" ? value : value === "" ? null : Number(value) } : row));
  }

  function removeRow(id: number) { setRows((current) => current.filter((row) => row.id !== id)); }

  function save() {
    setPending(true); setMessage("");
    startTransition(async () => {
      const result = await guardarCajaSemanal({ semana_etiqueta: week, fecha_pago: date, saldo_en_caja: cashBalance, observaciones: notes, total_efectivo: totals.cash, total_transferencia: totals.transfer, total_pagado: totals.total, filas: rows.map((row) => ({ ...row, pago_hoy: calculatePayment(row), pago_final: calculatePayment(row), id: undefined as never })) });
      setPending(false); setMessage(result.error ?? result.success ?? "");
    });
  }

  return <main className={styles.page}><div className={styles.container}><header className={styles.header}><div><p className={styles.eyebrow}>EAR Group / Contabilidad</p><h1>LiquidaciÃ³n semanal y arqueo de caja</h1><p>Planilla de jornales, adelantos y pagos de la semana.</p></div><div className={styles.actions}><button className={styles.secondaryButton} onClick={() => window.print()} type="button">Imprimir A4</button><button className={styles.primaryButton} disabled={pending} onClick={save} type="button">{pending ? "Guardando..." : "Guardar Planilla"}</button></div></header>
  {message && <div className={styles.notice}>{message}</div>}
    <section className={styles.metaCard}><div className={styles.metaGrid}><label>Semana<input onChange={(event) => setWeek(event.target.value)} value={week} /></label><label>Fecha de pago<input onChange={(event) => setDate(event.target.value)} type="date" value={date} /></label><label>Queda en caja<input min="0" onChange={(event) => setCashBalance(Number(event.target.value) || 0)} type="number" value={cashBalance} /></label><label>Observaciones<input onChange={(event) => setNotes(event.target.value)} value={notes} /></label></div></section>
    <section className={styles.metrics}><div><span>Total efectivo</span><strong>${totals.cash.toLocaleString("es-AR")}</strong></div><div><span>Total transferencias</span><strong>${totals.transfer.toLocaleString("es-AR")}</strong></div><div><span>Total pagado</span><strong>${totals.total.toLocaleString("es-AR")}</strong></div></section>
    <section className={styles.sheet}><div className={styles.sheetMasthead}>EAR Group - LiquidaciÃ³n Semanal</div><div className={styles.sheetHeader}><h2>Detalle de jornales y pagos</h2><button className={styles.secondaryButton} onClick={() => setRows((current) => [...current, emptyRow(Date.now())])} type="button">+ Agregar fila</button></div><div className={styles.tableWrap}><table><thead><tr><th>Nombre / Concepto</th><th>Horas</th><th>Valor hora</th><th>Debe</th><th>Debe aÃºn</th><th>Pago hoy</th><th>Medio</th><th>Detalle / Obs.</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><input onChange={(event) => updateRow(row.id, "concepto_o_nombre", event.target.value)} value={row.concepto_o_nombre} /></td><td><input min="0" onChange={(event) => updateRow(row.id, "horas", event.target.value)} type="number" value={row.horas ?? ""} /></td><td><input min="0" onChange={(event) => updateRow(row.id, "valor_hora", event.target.value)} type="number" value={row.valor_hora ?? ""} /></td><td><input min="0" onChange={(event) => updateRow(row.id, "debe", event.target.value)} type="number" value={row.debe} /></td><td><input onChange={(event) => updateRow(row.id, "debe_aun", event.target.value)} value={row.debe_aun} /></td><td><input min="0" onChange={(event) => updateRow(row.id, "pago_hoy", event.target.value)} type="number" value={row.horas === null || row.valor_hora === null ? row.pago_hoy : calculatePayment(row)} /></td><td><select onChange={(event) => updateRow(row.id, "medio_pago", event.target.value)} value={row.medio_pago}><option>EFECTIVO</option><option>TRANSFERENCIA</option><option>MIXTO</option></select></td><td><input onChange={(event) => updateRow(row.id, "detalle_pago", event.target.value)} value={row.detalle_pago} /></td><td><button aria-label="Eliminar fila" className={styles.removeButton} onClick={() => removeRow(row.id)} type="button">Ã—</button></td></tr>)}</tbody></table></div></section>
  </div></main>;
}


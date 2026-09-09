"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { marcarComoCobrado } from "./actions";
import styles from "./cobros.module.css";

type Cobro = {
  id: number;
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

export function CobrosTable({ rows }: { rows: Cobro[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const WHATSAPP_PHONE = "5493816958566";
  const DAYS_AHEAD = 5;

  function avisarVencimientos() {
    console.log("Datos crudos en rows:", rows);

    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 7); // margen de 7 días
    limit.setHours(23, 59, 59, 999);

    const pendientes = rows.filter((row) => {
      // 1. Descartar sólo si ya está efectivamente cobrado
      const est = (row.estado || "").toLowerCase().trim();
      if (est === "cobrado") return false;

      // 2. Si no hay cheques específicos, tomar los que no sean transferencia pura o que tengan fecha próxima
      const esCheque =
        (row.metodo_pago || "").toUpperCase().includes("CHEQUE") ||
        Boolean(row.cheque_numero) ||
        Boolean(row.cheque_id);

      // Si querés que avise cualquier cobro pendiente próximo (sea cheque o cuota), dejá esto activo:
      return esCheque;
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
                  const estaCobrado = row.estado?.trim().toLowerCase() === "cobrado";
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
                          "Completo"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
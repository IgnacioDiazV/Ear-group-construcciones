"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import styles from "./obra-detalle.module.css";

type Gasto = Database["public"]["Tables"]["gastos_obra"]["Row"];

const PAGE_SIZE = 10;

export function ObraExpensesList({ expenses }: { expenses: Gasto[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(expenses.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedExpenses = expenses.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const displayedCount = expenses.length;
  const fromItem = displayedCount === 0 ? 0 : startIndex + 1;
  const toItem = Math.min(endIndex, displayedCount);

  return (
    <div>
      {expenses.length === 0 ? (
        <div className={styles.empty}>No hay gastos imputados a esta obra.</div>
      ) : (
        <>
          <div className={styles.list}>
            {paginatedExpenses.map((expense) => (
              <div className={styles.listItem} key={expense.id}>
                <div>
                  <p className={styles.listTitle}>{expense.descripcion}</p>
                  <p className={styles.listMeta}>
                    {expense.rubro} · {formatDate(expense.fecha)}{" "}
                    {expense.numero_comprobante ? `· ${expense.numero_comprobante}` : ""}
                  </p>
                </div>
                <div className={styles.expenseActions}>
                  <span className={styles.listValue}>
                    {formatCurrency(expense.subtotal ?? expense.precio_unitario, expense.moneda ?? "ARS")}
                  </span>
                  {expense.comprobante_archivo_url && (
                    <a
                      className={styles.documentAction}
                      href={expense.comprobante_archivo_url}
                      rel="noopener noreferrer"
                      target="_blank"
                      title="Ver comprobante"
                    >
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5C7 5 2.73 8.11 1 12.46c1.73 4.35 6 7.54 11 7.54s9.27-3.19 11-7.54C21.27 8.11 17 5 12 5m0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderTop: "1px solid #efebe9",
                gap: "12px",
              }}
            >
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                style={{
                  border: "1px solid #d3cec9",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  background: currentPage === 1 ? "#f4f1ef" : "#ffffff",
                  color: currentPage === 1 ? "#b3a9a0" : "#3d1c14",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  font: "inherit",
                  fontSize: "12px",
                  fontWeight: "600",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                Anterior
              </button>

              <span
                style={{
                  color: "#726560",
                  fontSize: "12px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                Mostrando {fromItem} - {toItem} de {displayedCount} comprobante
                {displayedCount !== 1 ? "s" : ""}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                style={{
                  border: "1px solid #d3cec9",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  background: currentPage === totalPages ? "#f4f1ef" : "#ffffff",
                  color: currentPage === totalPages ? "#b3a9a0" : "#3d1c14",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  font: "inherit",
                  fontSize: "12px",
                  fontWeight: "600",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

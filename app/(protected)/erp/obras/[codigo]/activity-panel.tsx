"use client";

import { useState, useMemo, useEffect } from "react";
import { formatDate } from "@/lib/formatters";
import styles from "./obra-detalle.module.css";

export type ActivityEvent = {
  id?: number;
  referencia_id?: string | null;
  obra_id: number;
  fecha: string;
  mes_anio: string | null;
  semana_mes: number | null;
  tipo_evento: string;
  detalle: string;
  monto: number | null;
  url_archivo: string | null;
};

const ITEMS_PER_PAGE = 6;

// Función para formatear mes_anio a formato legible en español
function formatMonthYear(monthYear: string): string {
  const monthsES: Record<string, string> = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
  };

  if (monthYear && monthYear.length === 7) {
    const [year, month] = monthYear.split("-");
    const monthName = monthsES[month] || month;
    return `${monthName} ${year}`;
  }
  return monthYear;
}

export function ActivityPanel({
  eventos,
  error,
}: {
  eventos: ActivityEvent[];
  error?: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<"all" | 1 | 2 | 3 | 4 | 5>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedWeek]);

  // Obtener meses únicos disponibles, ordenados de más reciente a más antiguo
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    eventos.forEach((event) => {
      if (event.mes_anio) {
        months.add(event.mes_anio);
      }
    });
    return Array.from(months).sort().reverse();
  }, [eventos]);

  // Establecer mes por defecto (más reciente)
  const defaultMonth = selectedMonth || availableMonths[0] || "";

  // Filtrar eventos según mes y semana seleccionados
  const filteredEventos = useMemo(() => {
    let result = eventos;

    // Filtrar por mes
    if (defaultMonth) {
      result = result.filter((event) => event.mes_anio === defaultMonth);
    }

    // Filtrar por semana
    if (selectedWeek !== "all") {
      result = result.filter((event) => event.semana_mes === selectedWeek);
    }

    return result;
  }, [eventos, defaultMonth, selectedWeek]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredEventos.length / ITEMS_PER_PAGE) || 1;
  const paginatedEventos = filteredEventos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calcular total de gastos para el filtro actual
  const totalExpenses = useMemo(() => {
    return filteredEventos
      .filter((event) => event.tipo_evento?.toLowerCase() === "gasto")
      .reduce((sum, event) => sum + (event.monto ?? 0), 0);
  }, [filteredEventos]);

  // Función para obtener el ícono según tipo de evento
  function getEventIcon(tipoEvento: string) {
    const tipo = tipoEvento?.toLowerCase() || "";
    if (tipo === "gasto") {
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-full h-full">
          <path fill="currentColor" d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    } else if (tipo === "herramienta") {
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-full h-full">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 1 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          />
        </svg>
      );
    } else if (tipo === "stock") {
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-full h-full">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" stroke="currentColor" strokeWidth="2" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
          />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="w-full h-full">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (eventos.length === 0 && !error) {
    return <div className={styles.empty}>No hay actividad registrada en esta obra.</div>;
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        No se pudo cargar esta sección: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Controles de filtrado superiores sin el badge de gastos */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        {/* Selector de mes */}
        <div className="flex items-center gap-3">
          <label htmlFor="activity-month" className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
            Mes:
          </label>
          <select
            id="activity-month"
            value={defaultMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedWeek("all");
            }}
            className="px-3 py-2 text-xs font-medium bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#3E2723]/20 cursor-pointer"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonthYear(month)}
              </option>
            ))}
          </select>
        </div>

        {/* Píldoras de semanas continuas en una sola fila */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 rounded-full flex-wrap">
          {(["all", 1, 2, 3, 4, 5] as const).map((week) => {
            const isActive = selectedWeek === week;
            const label = week === "all" ? "Todas" : `Sem. ${week}`;
            return (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                  isActive
                    ? "bg-[#3E2723] text-white shadow-sm"
                    : "bg-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de eventos */}
      {filteredEventos.length === 0 ? (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <div className="text-3xl mb-2 opacity-40">📋</div>
          <p className="text-sm text-neutral-500">No hay actividad para el período seleccionado.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {paginatedEventos.map((evento, index) => {
              const tipoLower = evento.tipo_evento?.toLowerCase() || "";
              const badgeClass =
                tipoLower === "gasto"
                  ? "bg-emerald-50 text-emerald-700"
                  : tipoLower === "herramienta"
                  ? "bg-amber-50 text-amber-800"
                  : tipoLower === "stock"
                  ? "bg-sky-50 text-sky-800"
                  : "bg-neutral-50 text-neutral-700";

              return (
                <div
                  className="flex justify-between items-center bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50/50 transition-all duration-150 cursor-default gap-3"
                  style={{ padding: "14px 18px" }}
                  key={`activity-${evento.tipo_evento}-${evento.referencia_id || evento.id || index}`}
                >
                  {/* Lado izquierdo: Ícono + Contenido */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
                      <span className="w-5 h-5 flex items-center justify-center">
                        {getEventIcon(evento.tipo_evento)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-800 truncate">
                        {evento.tipo_evento?.toLowerCase() === "gasto"
                          ? evento.detalle.replace(/\s*·\s*\$[\d.,\s]+$/, "")
                          : evento.detalle}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-neutral-500">{formatDate(evento.fecha)}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${badgeClass}`}>
                          {tipoLower === "gasto"
                            ? "Gasto"
                            : tipoLower === "herramienta"
                            ? "Herramienta"
                            : tipoLower === "stock"
                            ? "Stock"
                            : "Evento"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lado derecho: Monto + Botón archivo */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {tipoLower === "gasto" && evento.monto !== null && (
                      <div className="text-base font-bold text-neutral-800 text-right">
                        ${evento.monto.toLocaleString("es-AR")}
                      </div>
                    )}
                    {evento.url_archivo && (
                      <a
                        href={evento.url_archivo}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver archivo"
                        aria-label="Ver archivo"
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-neutral-200 text-neutral-500 hover:text-[#3E2723] transition-all duration-150 flex-shrink-0"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          />
                          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra inferior: Izquierda (conteo), Centro (total), Derecha (paginador) */}
          <div className="mt-5 pt-4 border-t border-neutral-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Izquierda */}
            <div className="text-xs text-neutral-500 font-medium sm:w-1/3">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredEventos.length)} de {filteredEventos.length} movimientos
            </div>

            {/* Centro */}
            <div className="flex justify-center sm:w-1/3">
              {totalExpenses > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f8f5f4] border border-[#d7ccc8] text-xs text-neutral-700">
                  <span className="text-neutral-500">Total período:</span>
                  <span className="font-bold text-[#3E2723]">${totalExpenses.toLocaleString("es-AR")}</span>
                </div>
              )}
            </div>

            {/* Derecha */}
            <div className="flex items-center justify-end gap-2.5 sm:w-1/3">
              {totalPages > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold border border-neutral-200 rounded hover:border-[#3E2723] hover:text-[#3E2723] text-neutral-600 bg-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:text-neutral-600"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-semibold text-neutral-600 whitespace-nowrap">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-semibold border border-neutral-200 rounded hover:border-[#3E2723] hover:text-[#3E2723] text-neutral-600 bg-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:text-neutral-600"
                  >
                    Siguiente
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
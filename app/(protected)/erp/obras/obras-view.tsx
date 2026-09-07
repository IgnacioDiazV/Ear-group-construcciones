"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createObra, seedObras, type ObraActionState } from "./actions";
import styles from "./obras.module.css";
import type { Obra } from "@/features/obras/queries";
import { normalizeObraEstado, obraEstadoLabel } from "./estado";

const initialState: ObraActionState = {};

function formatStatus(status: string | null) {
  return obraEstadoLabel(status);
}

function formatBudget(obra: Obra) {
  if (obra.presupuesto_base === null) return "Sin presupuesto";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: obra.moneda_base === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(obra.presupuesto_base);
}

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized = normalizeObraEstado(status);
  const className = normalized.includes("ejec")
    ? `${styles.badge} ${styles.badgeActive}`
    : normalized === "presupuesto"
      ? `${styles.badge} ${styles.badgeReview}`
      : styles.badge;

  return <span className={className}>{formatStatus(status)}</span>;
}

function NewObraModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createObra, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [onClose, state.success]);

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <div aria-labelledby="new-obra-title" aria-modal="true" className={styles.modal} role="dialog">
        <div className={styles.modalHeader}>
          <h2 id="new-obra-title">Nueva obra</h2>
          <button aria-label="Cerrar" className={styles.closeButton} onClick={onClose} type="button">×</button>
        </div>
        <form action={formAction} className={styles.form}>
          {state.error && <div className={styles.alertError} role="alert">{state.error}</div>}
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="codigo">Código</label>
              <input id="codigo" name="codigo" placeholder="OBR-TA-003" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="nombre">Nombre de la obra</label>
              <input id="nombre" name="nombre" placeholder="Ej. Torre Alvear" required />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="tipo_obra">Tipo de obra</label>
              <select defaultValue="Residencial" id="tipo_obra" name="tipo_obra">
                <option>Residencial</option>
                <option>Residencial Multifamiliar</option>
                <option>Comercial</option>
                <option>Corporativo</option>
                <option>Infraestructura</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="estado">Estado</label>
              <select defaultValue="presupuesto" id="estado" name="estado">
                <option value="presupuesto">Presupuesto</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="direccion">Dirección <span>(opcional)</span></label>
            <input id="direccion" name="direccion" placeholder="Ciudad, provincia" />
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="presupuesto_base">Presupuesto base <span>(opcional)</span></label>
              <input id="presupuesto_base" min="0" name="presupuesto_base" placeholder="0" step="0.01" type="number" />
            </div>
            <div className={styles.field}>
              <label htmlFor="moneda_base">Moneda</label>
              <select defaultValue="ARS" id="moneda_base" name="moneda_base">
                <option>ARS</option>
                <option>USD</option>
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="fecha_inicio">Fecha de inicio <span>(opcional)</span></label>
              <input id="fecha_inicio" name="fecha_inicio" type="date" />
            </div>
            <div className={styles.field}>
              <label htmlFor="fecha_fin_estimada">Cierre estimado <span>(opcional)</span></label>
              <input id="fecha_fin_estimada" name="fecha_fin_estimada" type="date" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.secondaryButton} onClick={onClose} type="button">Cancelar</button>
            <button className={styles.primaryButton} disabled={isPending} type="submit">{isPending ? "Guardando..." : "Guardar obra"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ObrasView({ obras }: { obras: Obra[] }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [seedState, seedAction, isSeeding] = useActionState(seedObras, initialState);
  const activeCount = obras.filter((obra) => obra.estado?.toLowerCase().includes("ejec")).length;
  const publicCount = obras.filter((obra) => obra.es_publica_web).length;
  const budgetCount = obras.filter((obra) => obra.presupuesto_base !== null).length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>EAR Group / ERP</p>
            <h1 className={styles.title}>Obras y proyectos</h1>
            <p className={styles.subtitle}>Centro de control de obras, presupuestos y documentación operativa.</p>
          </div>
          <button className={styles.primaryButton} onClick={() => setModalOpen(true)} type="button">+ Nueva obra</button>
        </header>

        {seedState.error && <div className={styles.alertError} role="alert">{seedState.error}</div>}
        {seedState.success && <div className={styles.alertSuccess} role="status">{seedState.success}</div>}

        <section aria-label="Resumen de obras" className={styles.metrics}>
          <div className={styles.metric}><p className={styles.metricLabel}>Total de obras</p><p className={styles.metricValue}>{obras.length}</p></div>
          <div className={styles.metric}><p className={styles.metricLabel}>En ejecución</p><p className={styles.metricValue}>{activeCount}</p></div>
          <div className={styles.metric}><p className={styles.metricLabel}>Con presupuesto cargado</p><p className={styles.metricValue}>{budgetCount}</p><p className={styles.metricNote}>{publicCount} visibles en la web pública</p></div>
        </section>

        {obras.length === 0 ? (
          <section className={styles.empty}>
            <h2>Todavía no hay obras cargadas</h2>
            <p>Podés crear una obra manualmente o cargar dos registros de prueba.</p>
            <p className={styles.seedNote}>Las semillas sólo se ejecutan cuando la tabla está vacía.</p>
            <form action={seedAction}>
              <button className={styles.secondaryButton} disabled={isSeeding} type="submit">{isSeeding ? "Cargando semillas..." : "Cargar obras de prueba"}</button>
            </form>
          </section>
        ) : (
          <>
            <section aria-label="Obras destacadas" className={styles.cardGrid}>
              {obras.map((obra) => (
                <article className={styles.obraCard} key={obra.id}>
                  <div className={styles.cardTop}>
                    <div><p className={styles.code}>{obra.codigo}</p><h2 className={styles.obraTitle}>{obra.nombre}</h2></div>
                    <StatusBadge status={obra.estado} />
                  </div>
                  <dl className={styles.details}>
                    <div><dt>Tipo de obra</dt><dd>{obra.tipo_obra}</dd></div>
                    <div><dt>Presupuesto base</dt><dd>{formatBudget(obra)}</dd></div>
                    <div><dt>Ubicación</dt><dd>{obra.direccion ?? "Sin dirección cargada"}</dd></div>
                  </dl>
                  <Link className={styles.detailLink} href={`/erp/obras/${obra.id}`}>Ver detalle -&gt;</Link>
                </article>
              ))}
            </section>
            <section className={styles.tableCard}>
              <div className={styles.tableHeading}><h2>Vista detallada</h2><p>Información principal de cada centro de costos.</p></div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Código / obra</th><th>Estado</th><th>Inicio</th><th>Cierre estimado</th><th>Presupuesto</th></tr></thead>
                  <tbody>{obras.map((obra) => <tr key={`row-${obra.id}`}><td><Link className={styles.tableName} href={`/erp/obras/${obra.id}`}>{obra.nombre}</Link><div className={styles.code}>{obra.codigo}</div></td><td><StatusBadge status={obra.estado} /></td><td>{formatDate(obra.fecha_inicio)}</td><td>{formatDate(obra.fecha_fin_estimada)}</td><td>{formatBudget(obra)}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
      {isModalOpen && <NewObraModal onClose={() => setModalOpen(false)} />}
    </main>
  );
}

import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DocumentsPanel } from "./documents-panel";
import styles from "./obra-detalle.module.css";

type Documento = Database["public"]["Tables"]["documentos_obra"]["Row"];
type Movimiento = Database["public"]["Tables"]["movimientos_stock"]["Row"];
type Articulo = Database["public"]["Tables"]["articulos"]["Row"];
type Gasto = Database["public"]["Tables"]["gastos_obra"]["Row"];
type Anticipo = Database["public"]["Tables"]["anticipos_clientes"]["Row"];
type Cheque = Database["public"]["Tables"]["cheques"]["Row"];
type RelatedData<T> = { data: T[]; error?: string };

type Obra = Database["public"]["Tables"]["obras"]["Row"];

function progressClass(percentage: number) {
  if (percentage >= 100) return styles.progress100;
  if (percentage >= 75) return styles.progress75;
  if (percentage >= 50) return styles.progress50;
  if (percentage >= 25) return styles.progress25;
  return styles.progress0;
}

async function getRelatedData(id: number) {
  const supabase = await createSupabaseServerClient();
  const [documentsResult, movementsResult, expensesResult, advancesResult] = await Promise.all([
    supabase.from("documentos_obra").select("*").eq("obra_id", id).order("created_at", { ascending: false }),
    supabase.from("movimientos_stock").select("*").eq("obra_id", id).order("fecha", { ascending: false }),
    supabase.from("gastos_obra").select("*").eq("obra_id", id).order("fecha", { ascending: false }),
    supabase.from("anticipos_clientes").select("*").eq("obra_id", id).order("fecha_estimada_cobro", { ascending: true }),
  ]);

  const movements = (movementsResult.data ?? []) as Movimiento[];
  const advances = (advancesResult.data ?? []) as Anticipo[];
  const articleIds = [...new Set(movements.map((movement) => movement.articulo_id))];
  const advanceIds = advances.map((advance) => advance.id);
  const [checksResult, articlesResult] = await Promise.all([
    advanceIds.length > 0 ? supabase.from("cheques").select("*").in("anticipo_id", advanceIds).order("fecha_pago_diferido", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    articleIds.length > 0 ? supabase.from("articulos").select("*").in("id", articleIds) : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    documents: { data: (documentsResult.data ?? []) as Documento[], error: documentsResult.error?.message },
    movements: { data: movements, error: movementsResult.error?.message },
    articles: { data: (articlesResult.data ?? []) as Articulo[], error: articlesResult.error?.message },
    expenses: { data: (expensesResult.data ?? []) as Gasto[], error: expensesResult.error?.message },
    advances: { data: advances, error: advancesResult.error?.message },
    checks: { data: (checksResult.data ?? []) as Cheque[], error: checksResult.error?.message },
  } satisfies { documents: RelatedData<Documento>; movements: RelatedData<Movimiento>; articles: RelatedData<Articulo>; expenses: RelatedData<Gasto>; advances: RelatedData<Anticipo>; checks: RelatedData<Cheque> };
}

function RelatedError({ message }: { message?: string }) {
  return message ? <div className={styles.error} role="alert">No se pudo cargar esta sección: {message}</div> : null;
}

export default async function OperationalSections({ obra }: { obra: Obra }) {
  const related = await getRelatedData(obra.id);
  const articlesById = new Map(related.articles.data.map((article) => [article.id, article]));
  const totalExpenses = related.expenses.data.reduce((total, expense) => total + (expense.subtotal ?? expense.precio_unitario), 0);
  const pendingAdvances = related.advances.data.filter((advance) => !["pagado", "cobrado", "cancelado"].includes(advance.estado?.toLowerCase() ?? ""));
  const pendingChecks = related.checks.data.filter((check) => !["pagado", "cobrado", "cancelado"].includes(check.estado?.toLowerCase() ?? ""));
  const approvedBudget = obra.presupuesto_base ?? 0;
  const consumedPercentage = approvedBudget > 0 ? Math.min(100, Math.round((totalExpenses / approvedBudget) * 100)) : 0;
  const remainingBudget = Math.max(0, approvedBudget - totalExpenses);

  return <>
    <section className={styles.financialMetrics} aria-label="Resumen financiero">
      <div className={styles.financialMetric}><p>Presupuesto aprobado</p><strong>{formatCurrency(approvedBudget, obra.moneda_base ?? "ARS")}</strong><span>Base vigente de la obra</span></div>
      <div className={styles.financialMetric}><p>Total ejecutado / pagado</p><strong>{formatCurrency(totalExpenses, obra.moneda_base ?? "ARS")}</strong><span>Según gastos imputados</span></div>
      <div className={styles.financialMetric}><p>Saldo restante disponible</p><strong>{formatCurrency(remainingBudget, obra.moneda_base ?? "ARS")}</strong><span>{consumedPercentage}% de consumo del presupuesto</span><div className={styles.progress}><span className={progressClass(consumedPercentage)} /></div></div>
    </section>

    <div className={styles.contentGrid}>
      <section className={styles.card}>
        <div className={styles.cardHeader}><h2>Información operativa</h2><p>Documentación y movimientos asociados a esta obra.</p></div>
        <DocumentsPanel documents={related.documents.data} obraId={obra.id} obraNombre={obra.nombre} />
        <RelatedError message={related.documents.error} />
        <div className={styles.cardHeader}><h2>Insumos asignados</h2><p>Movimientos de stock registrados para la obra.</p></div>
        <RelatedError message={related.movements.error ?? related.articles.error} />
        {related.movements.data.length === 0 && !related.movements.error ? <div className={styles.empty}>No hay movimientos de insumos vinculados a esta obra.</div> : <div className={styles.list}>{related.movements.data.map((movement) => { const article = articlesById.get(movement.articulo_id); return <div className={styles.listItem} key={movement.id}><div><p className={styles.listTitle}>{article?.nombre ?? `Artículo #${movement.articulo_id}`}</p><p className={styles.listMeta}>{movement.tipo_movimiento} · {formatDate(movement.fecha)}</p></div><span className={styles.listValue}>{movement.cantidad} {article?.unidad_medida ?? "unidades"}</span></div>; })}</div>}
        <div className={styles.cardHeader}><h2>Gastos imputados</h2><p>Comprobantes y costos asociados al centro de obra.</p></div>
        <RelatedError message={related.expenses.error} />
        {related.expenses.data.length === 0 && !related.expenses.error ? <div className={styles.empty}>No hay gastos imputados a esta obra.</div> : <div className={styles.list}>{related.expenses.data.map((expense) => <div className={styles.listItem} key={expense.id}><div><p className={styles.listTitle}>{expense.descripcion}</p><p className={styles.listMeta}>{expense.rubro} · {formatDate(expense.fecha)} {expense.numero_comprobante ? `· ${expense.numero_comprobante}` : ""}</p></div><div className={styles.expenseActions}><span className={styles.listValue}>{formatCurrency(expense.subtotal ?? expense.precio_unitario, expense.moneda ?? "ARS")}</span>{expense.comprobante_archivo_url && <a className={styles.detailLink} href={expense.comprobante_archivo_url} rel="noopener noreferrer" target="_blank">Comprobante</a>}</div></div>)}</div>}
        <div className={styles.cardHeader}><h2>Flujo financiero y pagos pendientes</h2><p>Anticipos asociados y cheques diferidos próximos a vencer.</p></div>
        <RelatedError message={related.advances.error ?? related.checks.error} />
        {pendingAdvances.length === 0 && pendingChecks.length === 0 && !related.advances.error && !related.checks.error ? <div className={styles.empty}>No hay pagos pendientes registrados para esta obra.</div> : <div className={styles.list}>{pendingAdvances.map((advance) => <div className={styles.listItem} key={`advance-${advance.id}`}><div><p className={styles.listTitle}>{advance.descripcion}<span className={styles.typeTag}>Pendiente</span></p><p className={styles.listMeta}>Fecha estimada: {formatDate(advance.fecha_estimada_cobro)} · {advance.metodo_pago}</p></div><span className={styles.listValue}>{formatCurrency(advance.monto, advance.moneda ?? "ARS")}</span></div>)}{pendingChecks.map((check) => <div className={styles.listItem} key={`check-${check.id}`}><div><p className={styles.listTitle}>Cheque {check.numero_cheque}<span className={styles.typeTag}>Vencimiento</span></p><p className={styles.listMeta}>{check.banco} · Pago diferido: {formatDate(check.fecha_pago_diferido)}</p></div><span className={styles.listValue}>{formatCurrency(check.monto)}</span></div>)}</div>}
      </section>
      <aside className={`${styles.card} ${styles.sideCard}`}><h2>Datos generales</h2><div className={styles.sideRow}><span>Código</span><strong>{obra.codigo}</strong></div><div className={styles.sideRow}><span>Tipología</span><strong>{obra.tipo_obra}</strong></div><div className={styles.sideRow}><span>Visible en web</span><strong>{obra.es_publica_web ? "Sí" : "No"}</strong></div><div className={styles.sideRow}><span>Alta</span><strong>{formatDate(obra.created_at?.slice(0, 10) ?? null)}</strong></div></aside>
    </div>
  </>;
}

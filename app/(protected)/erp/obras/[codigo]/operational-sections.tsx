import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getUSDARSRate } from "@/lib/exchange-rates";
import { DocumentsPanel } from "./documents-panel";
import { ActivityPanel, type ActivityEvent } from "./activity-panel";
import styles from "./obra-detalle.module.css";

type Documento = Database["public"]["Tables"]["documentos_obra"]["Row"];
type Movimiento = Database["public"]["Tables"]["movimientos_stock"]["Row"];
type Articulo = Database["public"]["Tables"]["articulos"]["Row"];
type Gasto = Database["public"]["Tables"]["gastos_obra"]["Row"];
type Anticipo = Database["public"]["Tables"]["anticipos_clientes"]["Row"];
type Cheque = Database["public"]["Tables"]["cheques"]["Row"];
type RelatedData<T> = { data: T[]; error?: string };

type Obra = Database["public"]["Tables"]["obras"]["Row"];

async function getRelatedData(id: number) {
  const supabase = await createSupabaseServerClient();
  const documentsResult = await supabase.from("documentos_obra").select("*").eq("obra_id", id).order("created_at", { ascending: false });
  const movementsResult = await supabase.from("movimientos_stock").select("*").eq("obra_id", id).order("fecha", { ascending: false });
  const expensesResult = await supabase.from("gastos_obra").select("*").eq("obra_id", id).order("fecha", { ascending: false });
  const advancesResult = await supabase.from("anticipos_clientes").select("*").eq("obra_id", id).order("fecha_estimada_cobro", { ascending: true });
  
  const activityQuery = await (supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: unknown) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{
            data: ActivityEvent[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("vista_actividad_obra")
    .select("*")
    .eq("obra_id", id)
    .order("fecha", { ascending: false });

  const activityData = activityQuery.data ?? [];
  const activityError = activityQuery.error ? activityQuery.error.message : undefined;

  const movements = (movementsResult.data ?? []) as Movimiento[];
  const advances = (advancesResult.data ?? []) as Anticipo[];
  const articleIds = [...new Set(movements.map((movement) => movement.articulo_id))];
  const advanceIds = advances.map((advance) => advance.id);
  
  const checksResult = advanceIds.length > 0 
    ? await supabase.from("cheques").select("*").in("anticipo_id", advanceIds).order("fecha_pago_diferido", { ascending: true })
    : { data: [], error: null };
  const articlesResult = articleIds.length > 0
    ? await supabase.from("articulos").select("*").in("id", articleIds)
    : { data: [], error: null };

  return {
    documents: { data: (documentsResult.data ?? []) as Documento[], error: documentsResult.error?.message },
    movements: { data: movements, error: movementsResult.error?.message },
    articles: { data: (articlesResult.data ?? []) as Articulo[], error: articlesResult.error?.message },
    expenses: { data: (expensesResult.data ?? []) as Gasto[], error: expensesResult.error?.message },
    advances: { data: advances, error: advancesResult.error?.message },
    checks: { data: (checksResult.data ?? []) as Cheque[], error: checksResult.error?.message },
    activity: {
      data: activityData,
      error: activityError,
    },
  } satisfies { documents: RelatedData<Documento>; movements: RelatedData<Movimiento>; articles: RelatedData<Articulo>; expenses: RelatedData<Gasto>; advances: RelatedData<Anticipo>; checks: RelatedData<Cheque>; activity: RelatedData<ActivityEvent> };
}

function RelatedError({ message }: { message?: string }) {
  return message ? <div className={styles.error} role="alert">No se pudo cargar esta sección: {message}</div> : null;
}

export default async function OperationalSections({ obra }: { obra: Obra }) {
  const related = await getRelatedData(obra.id);
  const totalExpenses = related.expenses.data.reduce((total, expense) => total + (expense.subtotal ?? expense.precio_unitario), 0);
  
  // Crear mapa de cheques por anticipo_id para asociarlos correctamente
  const checksByAdvanceId = new Map(
    related.checks.data.map((check) => [check.anticipo_id, check])
  );
  
  // Filtrar cheques que no pertenezcan a anticipos cobrados
  const cobradosIds = new Set(
    related.advances.data
      .filter((advance) => ["cobrado", "pagado"].includes(advance.estado?.toLowerCase().trim() ?? ""))
      .map((advance) => advance.id)
  );
  
  const pendingChecks = related.checks.data.filter((check) => {
    const isFromCobradoAdvance = check.anticipo_id && cobradosIds.has(check.anticipo_id);
    const isPending = !["pagado", "cobrado", "cancelado"].includes(check.estado?.toLowerCase() ?? "");
    return isPending && !isFromCobradoAdvance;
  });
  
  // Obtener cotización de dólar
  const exchangeRate = await getUSDARSRate();
  
  // Calcular totales de anticipos con conversión multimoneda
  const cobrados = related.advances.data.filter((advance) => advance.estado?.toLowerCase().trim() === "cobrado");
  
  let totalCobradoARS = 0;
  let totalUSD = 0;
  
  cobrados.forEach((item) => {
    const moneda = (item.moneda ?? "ARS").toUpperCase().trim();
    const monto = Number(item.monto || 0);
    
    if (moneda === "USD") {
      totalUSD += monto;
      totalCobradoARS += monto * exchangeRate.venta;
    } else {
      totalCobradoARS += monto;
    }
  });
  
  const cuotasCobradas = cobrados.length;
  
  const presupuestoBase = obra.presupuesto_base ?? 0;
  const totalEjecutado = totalExpenses;
  const saldoRestanteDisponible = Math.max(0, presupuestoBase - totalEjecutado);
  const consumedPercentage = presupuestoBase > 0 ? Math.min(100, Math.round((totalEjecutado / presupuestoBase) * 100)) : 0;

  return <>
    <section className={styles.financialMetrics} aria-label="Resumen financiero">
      <div className={`${styles.financialMetric} flex flex-col justify-between`}>
        <div>
          <p>Presupuesto aprobado</p>
          <strong>{formatCurrency(presupuestoBase, obra.moneda_base ?? "ARS")}</strong>
        </div>
        <span>Base vigente de la obra</span>
      </div>

      <div className={`${styles.financialMetric} flex flex-col justify-between`}>
        <div>
          <p>Total cobrado</p>
          <strong>{formatCurrency(totalCobradoARS, obra.moneda_base ?? "ARS")}</strong>
        </div>
        <span className="mt-4">
          {totalUSD > 0
            ? `${cuotasCobradas} cuota${cuotasCobradas !== 1 ? "s" : ""} cobrada${cuotasCobradas !== 1 ? "s" : ""} (incluye US$ ${totalUSD.toLocaleString("es-AR")} a cotiz. $${exchangeRate.venta.toLocaleString("es-AR", { maximumFractionDigits: 2 })})`
            : `${cuotasCobradas} cuota${cuotasCobradas !== 1 ? "s" : ""} cobrada${cuotasCobradas !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className={`${styles.financialMetric} flex flex-col justify-between`}>
        <div>
          <p>Total ejecutado / pagado</p>
          <strong>{formatCurrency(totalEjecutado, obra.moneda_base ?? "ARS")}</strong>
        </div>
        <span className="mt-4">Según comprobantes imputados</span>
      </div>

      <div className={`${styles.financialMetric} flex flex-col justify-between`}>
        <div>
          <p>Saldo restante disponible</p>
          <strong>{formatCurrency(saldoRestanteDisponible, obra.moneda_base ?? "ARS")}</strong>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Consumo del presupuesto</span>
            <span className="font-bold text-sm text-neutral-900">{consumedPercentage}%</span>
          </div>
          <div className="w-full bg-stone-100 border border-neutral-200/60 h-2 rounded-full overflow-hidden">
            <div className="bg-[#3E2723] h-full transition-all duration-300" style={{ width: `${Math.min(Math.max(consumedPercentage, 0), 100)}%` }} />
          </div>
        </div>
      </div>
    </section>

    <div className={styles.contentGrid}>
      <div className="flex flex-col gap-6 flex-1 min-w-0">
        {/* Tarjeta 1: Actividad y movimientos recientes */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3E2723]" />
              <h2>Actividad y movimientos recientes</h2>
            </div>
            <p>Bitácora cronológica con desglose semanal de comprobantes, herramientas y stock.</p>
          </div>
          {related.activity.error && <RelatedError message={related.activity.error} />}
          
          {/* Agregamos el contenedor con padding de 20px y margen inferior */}
          <div className="p-5 pt-3">
            <ActivityPanel eventos={related.activity.data} error={related.activity.error ?? undefined} />
          </div>
        </section>

        {/* Tarjeta 2: Flujo financiero y cobros */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2>Flujo financiero y cobros</h2>
            </div>
            <p>Anticipos y cobros realizados, además de cheques diferidos próximos a vencer.</p>
          </div>
          <RelatedError message={related.advances.error ?? related.checks.error} />
          
          {related.advances.data.length === 0 && pendingChecks.length === 0 && !related.advances.error && !related.checks.error ? (
            <div className={styles.empty}>No hay cobros ni cheques diferidos registrados para esta obra.</div>
          ) : (
            <div className={styles.list}>
              {related.advances.data.map((advance) => {
                const estadoNormalizado = advance.estado?.toLowerCase().trim() ?? "";
                const isCobrado = ["cobrado", "pagado"].includes(estadoNormalizado);
                const estadoTag = isCobrado ? "Cobrado" : "Pendiente";
                const estadoClass = styles.typeTag;
                const relatedCheck = checksByAdvanceId.get(advance.id);
                return (
                  <div className={styles.listItem} key={`advance-${advance.id}`}>
                    <div>
                      <p className={styles.listTitle}>
                        {advance.descripcion}
                        <span className={estadoClass} style={isCobrado ? { background: "#e8f5e9", color: "#2e7d32" } : {}}>
                          {estadoTag}
                        </span>
                      </p>
                      <p className={styles.listMeta}>
                        {isCobrado && relatedCheck
                          ? `CHEQUE · ${relatedCheck.banco} #${relatedCheck.numero_cheque}`
                          : `Fecha estimada: ${formatDate(advance.fecha_estimada_cobro)} · ${advance.metodo_pago}`}
                      </p>
                    </div>
                    <span className={styles.listValue}>{formatCurrency(advance.monto, advance.moneda ?? "ARS")}</span>
                  </div>
                );
              })}
              {pendingChecks.map((check) => (
                <div className={styles.listItem} key={`check-${check.id}`}>
                  <div>
                    <p className={styles.listTitle}>
                      Cheque {check.numero_cheque}
                      <span className={styles.typeTag}>Vencimiento</span>
                    </p>
                    <p className={styles.listMeta}>{check.banco} · Pago diferido: {formatDate(check.fecha_pago_diferido)}</p>
                  </div>
                  <span className={styles.listValue}>{formatCurrency(check.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tarjeta 3: Documentación y planos */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <h2>Información operativa</h2>
            </div>
            <p>Documentación técnica, planos y renders asociados a esta obra.</p>
          </div>
          <DocumentsPanel documents={related.documents.data} obraId={obra.id} obraNombre={obra.nombre} />
          <RelatedError message={related.documents.error} />
        </section>
      </div>

      {/* Barra lateral */}
      <aside className={`${styles.card} ${styles.sideCard}`}>
        <h2>Datos generales</h2>
        <div className={styles.sideRow}><span>Código</span><strong>{obra.codigo}</strong></div>
        <div className={styles.sideRow}><span>Tipología</span><strong>{obra.tipo_obra}</strong></div>
        <div className={styles.sideRow}><span>Visible en web</span><strong>{obra.es_publica_web ? "Sí" : "No"}</strong></div>
        <div className={styles.sideRow}><span>Alta</span><strong>{formatDate(obra.created_at?.slice(0, 10) ?? null)}</strong></div>
      </aside>
    </div>
  </>;
}
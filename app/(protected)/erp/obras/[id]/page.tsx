import Link from "next/link";
import { Suspense } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ObraDetailActions } from "./obra-detail-actions";
import OperationalSections from "./operational-sections";
import { normalizeObraEstado, obraEstadoLabel } from "../estado";
import styles from "./obra-detalle.module.css";

type Obra = Database["public"]["Tables"]["obras"]["Row"];

function StatusBadge({ status }: { status: string | null }) {
  const normalized = normalizeObraEstado(status);
  const className = normalized === "en_ejecucion" ? `${styles.status} ${styles.statusActive}` : normalized === "presupuesto" ? `${styles.status} ${styles.statusReview}` : styles.status;
  return <span className={className}>{obraEstadoLabel(status)}</span>;
}

function OperationalSkeleton() {
  return <div aria-label="Cargando información operativa" className={styles.documentsSkeleton} role="status"><span /><span /><span /></div>;
}

export default async function ObraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return <DetailError message="El identificador de la obra no es válido." />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: obra, error } = await supabase.from("obras").select("*").eq("id", id).maybeSingle();

  if (error) return <DetailError message={`No se pudo consultar la obra: ${error.message}`} />;
  if (!obra) return <DetailError message="La obra solicitada no existe o no está disponible para tu usuario." />;

  return <main className={styles.page}><div className={styles.container}>
    <Link className={styles.backLink} href="/erp/obras">&lt;- Volver a obras</Link>
    <header className={styles.header}><div><p className={styles.eyebrow}>{obra.codigo}</p><h1 className={styles.title}>{obra.nombre}</h1><p className={styles.subtitle}>{obra.tipo_obra} {obra.direccion ? `· ${obra.direccion}` : ""}</p></div><div className={styles.headerActions}><StatusBadge status={obra.estado} /><ObraDetailActions obra={obra} /></div></header>
    <dl className={styles.overview}><div className={styles.overviewItem}><dt>Presupuesto base</dt><dd>{formatCurrency(obra.presupuesto_base, obra.moneda_base ?? "ARS")}</dd></div><div className={styles.overviewItem}><dt>Moneda</dt><dd>{obra.moneda_base ?? "No definida"}</dd></div><div className={styles.overviewItem}><dt>Inicio</dt><dd>{formatDate(obra.fecha_inicio)}</dd></div><div className={styles.overviewItem}><dt>Cierre estimado</dt><dd>{formatDate(obra.fecha_fin_estimada)}</dd></div><div className={styles.overviewItem}><dt>Cierre real</dt><dd>{obra.fecha_cierre_real ? formatDate(obra.fecha_cierre_real) : "En curso"}</dd></div></dl>
    <Suspense fallback={<OperationalSkeleton />}><OperationalSections obra={obra as Obra} /></Suspense>
  </div></main>;
}

function DetailError({ message }: { message: string }) {
  return <main className={styles.page}><div className={styles.container}><Link className={styles.backLink} href="/erp/obras">&lt;- Volver a obras</Link><section className={styles.alert} role="alert"><h1>No se pudo cargar la obra</h1><p>{message}</p></section></div></main>;
}

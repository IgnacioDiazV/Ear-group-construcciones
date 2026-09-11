import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ContabilidadTabs } from "../contabilidad-tabs";
import { LiquidacionForm } from "./liquidacion-form";
import { LiquidacionesTable } from "./liquidaciones-table";
import styles from "./liquidaciones.module.css";

type Obra = { id: number; nombre: string };
type RawLiquidacion = { id: number; obra_id: number; semana_etiqueta: string; fecha_pago: string; total_pagado: number; archivo_url: string | null; created_at: string | null };

export default async function LiquidacionesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: obrasData }, { data: liquidacionesData }] = await Promise.all([
    supabase.from("obras").select("id, nombre").order("nombre"),
    (supabase.from("caja_semanal" as never) as unknown as { select: (columns: string) => { order: (column: string, options: { ascending: boolean }) => Promise<{ data: RawLiquidacion[] | null; error: { message: string } | null }> } }).select("id, obra_id, semana_etiqueta, fecha_pago, total_pagado, archivo_url, created_at").order("created_at", { ascending: false }),
  ]);
  const obras = (obrasData ?? []) as Obra[];
  const names = new Map(obras.map((obra) => [obra.id, obra.nombre]));
  const rows = (liquidacionesData ?? []).map((row) => ({ ...row, id: String(row.id), obra_nombre: names.get(row.obra_id) ?? `Obra #${row.obra_id}` }));

  return <main className={styles.page}><div className={styles.container}><header className={styles.header}><p className={styles.eyebrow}>EAR GROUP / ERP</p><h1>Liquidaciones y jornales</h1><p>Registro y archivo de planillas semanales de pago.</p></header><ContabilidadTabs /><section className={styles.card}><div className={styles.cardHeader}><h2>Registrar planilla semanal</h2><p>Adjuntá el Excel y vinculalo a una obra.</p></div><LiquidacionForm obras={obras} /></section><section className={styles.card}><div className={styles.cardHeader}><h2>Planillas guardadas</h2><p>Repositorio histórico de liquidaciones semanales.</p></div><LiquidacionesTable rows={rows} /></section></div></main>;
}

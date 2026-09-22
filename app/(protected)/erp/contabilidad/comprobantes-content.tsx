import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExpenseForm } from "./expense-form";
import { ExpenseTable } from "./expense-table";
import styles from "./contabilidad.module.css";

type Obra = { id: number; nombre: string };
type RawExpense = { id: number; obra_id: number; descripcion: string; rubro: string; precio_unitario: number; subtotal: number | null; fecha: string; comprobante_archivo_url: string | null };

export async function ComprobantesContent() {
  const supabase = await createSupabaseServerClient();
  const [{ data: obrasData, error: obrasError }, { data: gastosData, error: gastosError }] = await Promise.all([
    supabase.from("obras").select("id, nombre").order("nombre"),
    (supabase.from("gastos_obra") as unknown as { select: (columns: string) => { order: (column: string, options: { ascending: boolean }) => Promise<{ data: RawExpense[] | null; error: { message: string } | null }> } }).select("id, obra_id, descripcion, rubro, precio_unitario, subtotal, fecha, comprobante_archivo_url").order("fecha", { ascending: false }),
  ]);
  const obras = (obrasData ?? []) as Obra[];
  const obraNames = new Map(obras.map((obra) => [obra.id, obra.nombre]));
  const expenses = (gastosData ?? []).map((expense) => ({ ...expense, obra_nombre: obraNames.get(expense.obra_id) ?? `Obra #${expense.obra_id}` }));
  const error = obrasError?.message ?? gastosError?.message;

  return (
    <>
      {error && <div className={styles.error} role="alert">No se pudo cargar contabilidad: {error}</div>}
      <ExpenseForm obras={obras} />
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Gastos de obra</h2>
          <p>Filtrá los comprobantes por centro de costos.</p>
        </div>
        <ExpenseTable expenses={expenses} obras={obras} />
      </section>
    </>
  );
}

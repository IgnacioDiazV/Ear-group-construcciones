import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WhatsAppImportModal } from "./whatsapp-import-modal";
import { InventoryTable } from "./inventory-table";
import styles from "./inventario.module.css";

type ObraOption = { id: number; nombre: string };
type RawAsignacion = { id: number; obra_id: number; descripcion_libre: string; cantidad: number; cantidad_devuelta: number; fecha_entrega: string; fecha_devolucion: string | null };

export default async function InventarioPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: obrasData, error: obrasError }, { data: asignacionesData, error: asignacionesError }] = await Promise.all([
    supabase.from("obras").select("id, nombre, estado").order("nombre"),
    (supabase.from("asignacion_herramientas") as unknown as { select: (columns: string) => { is: (column: string, value: null) => Promise<{ data: RawAsignacion[] | null; error: { message: string } | null }> } }).select("id, obra_id, descripcion_libre, cantidad, cantidad_devuelta, fecha_entrega, fecha_devolucion").is("fecha_devolucion", null),
  ]);

  const obras = ((obrasData ?? []) as Array<ObraOption & { estado: string | null }>).filter((obra) => !["finalizada", "cancelada"].includes(obra.estado?.toLowerCase() ?? ""));
  const obraNames = new Map(obrasData?.map((obra) => [obra.id, obra.nombre]) ?? []);
  const items = (asignacionesData ?? []).map((item) => ({ ...item, obra_nombre: obraNames.get(item.obra_id) ?? `Obra #${item.obra_id}` }));
  const error = obrasError?.message ?? asignacionesError?.message;

  return <main className={styles.page}><div className={styles.container}><header className={styles.header}><div><p className={styles.eyebrow}>EAR Group / ERP</p><h1>Inventario y herramientas</h1><p>Control de entregas, saldos pendientes y devoluciones en obra.</p></div><WhatsAppImportModal obras={obras} /></header>{error && <div className={styles.error} role="alert">No se pudo cargar el inventario: {error}</div>}<section className={styles.card}><div className={styles.cardHeader}><h2>Herramientas activas en obra</h2><p>Seleccioná una obra para consultar sus asignaciones.</p></div><InventoryTable items={items} obras={obras} /></section></div></main>;
}

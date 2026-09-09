import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ContabilidadTabs } from "../contabilidad-tabs";
import { CobrosForm } from "./cobros-form";
import { CobrosTable } from "./cobros-table";
import styles from "./cobros.module.css";

type Obra = { id: number; nombre: string };

type Anticipo = {
  id: number;
  obra_id: number;
  descripcion: string;
  monto: number;
  moneda: string | null;
  numero_cuota: number | null;
  total_cuotas: number | null;
  metodo_pago: string;
  fecha_estimada_cobro: string | null;
  fecha_cobro_real: string | null;
  estado: string | null;
  cheques?: Array<{ id: number; banco: string; numero_cheque: string; fecha_pago_diferido: string }>;
};

export default async function CobrosPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: obrasData }, { data: cobrosData, error }] = await Promise.all([
    supabase.from("obras").select("id, nombre").order("nombre"),
    supabase.from("anticipos_clientes").select("id, obra_id, descripcion, monto, moneda, numero_cuota, total_cuotas, metodo_pago, fecha_estimada_cobro, fecha_cobro_real, estado, cheques(id, banco, numero_cheque, fecha_pago_diferido)").order("fecha_estimada_cobro", { ascending: false }),
  ]);
  const obras = (obrasData ?? []) as Obra[];
  const obraNames = new Map(obras.map((obra) => [obra.id, obra.nombre]));
  const rows = ((cobrosData ?? []) as Anticipo[]).map((cobro) => {
    const cheque = cobro.cheques?.[0];
    return {
      ...cobro,
      obra_nombre: obraNames.get(cobro.obra_id) ?? `Obra #${cobro.obra_id}`,
      cheque_id: cheque?.id,
      cheque_banco: cheque?.banco,
      cheque_numero: cheque?.numero_cheque,
      cheque_fecha: cheque?.fecha_pago_diferido,
    };
  });

  return <main className={styles.page}><div className={styles.container}><header className={styles.header}><p className={styles.eyebrow}>EAR GROUP / ERP</p><h1>Cobros y Cheques</h1><p>Control de cuotas de clientes, anticipos y cartera de cheques diferidos.</p></header><ContabilidadTabs />{error && <div className={styles.error} role="alert">No se pudieron cargar los cobros: {error.message}</div>}<section className={styles.card}><div className={styles.cardHeader}><h2>Registrar cobro</h2><p>Cargá cuotas de cliente o cheques diferidos.</p></div><CobrosForm obras={obras} /></section><section className={styles.card}><div className={styles.cardHeader}><h2>Cartera registrada</h2><p>Seguimiento de anticipos, cuotas y cheques pendientes.</p></div><CobrosTable rows={rows} /></section></div></main>;
}

import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Obra = Database["public"]["Tables"]["obras"]["Row"];
type GastoResumen = { obra_id: number; subtotal: number | null; precio_unitario: number };
type HerramientaResumen = { obra_id: number; cantidad: number; cantidad_devuelta: number };

export type ObraResumen = Obra & {
  gastos_ejecutados: number;
  herramientas_asignadas: number;
};

export async function getObras(): Promise<Obra[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("obras")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar las obras: ${error.message}`);
  }

  return data;
}

export async function getObrasResumen(): Promise<ObraResumen[]> {
  const supabase = await createSupabaseServerClient();
  const [obrasResult, gastosResult, herramientasResult] = await Promise.all([
    supabase.from("obras").select("*").order("id", { ascending: false }),
    supabase.from("gastos_obra").select("obra_id, subtotal, precio_unitario"),
    (supabase.from("asignacion_herramientas") as unknown as {
      select: (columns: string) => {
        is: (column: string, value: null) => Promise<{ data: HerramientaResumen[] | null; error: { message: string } | null }>;
      };
    }).select("obra_id, cantidad, cantidad_devuelta").is("fecha_devolucion", null),
  ]);

  if (obrasResult.error) {
    throw new Error(`No se pudieron cargar las obras: ${obrasResult.error.message}`);
  }

  const gastosPorObra = new Map<number, number>();
  for (const gasto of (gastosResult.data ?? []) as GastoResumen[]) {
    gastosPorObra.set(gasto.obra_id, (gastosPorObra.get(gasto.obra_id) ?? 0) + (gasto.subtotal ?? gasto.precio_unitario));
  }

  const herramientasPorObra = new Map<number, number>();
  for (const herramienta of herramientasResult.data ?? []) {
    const pendientes = Math.max(0, herramienta.cantidad - herramienta.cantidad_devuelta);
    herramientasPorObra.set(herramienta.obra_id, (herramientasPorObra.get(herramienta.obra_id) ?? 0) + pendientes);
  }

  return (obrasResult.data ?? []).map((obra) => ({
    ...obra,
    gastos_ejecutados: gastosPorObra.get(obra.id) ?? 0,
    herramientas_asignadas: herramientasPorObra.get(obra.id) ?? 0,
  }));
}
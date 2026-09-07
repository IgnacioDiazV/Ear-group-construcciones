"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type HerramientaItem = { cantidad: number; nombre: string };
type AsignacionPayload = {
  obra_id: number;
  descripcion_libre: string;
  cantidad: number;
  cantidad_devuelta: number;
  fecha_entrega: string;
  estado_herramienta: string;
};

type AsignacionTable = {
  insert: (values: AsignacionPayload[]) => Promise<{ error: { message: string } | null }>;
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: number) => Promise<{ error: { message: string } | null }>;
  };
};

function asignacionesTable(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  return supabase.from("asignacion_herramientas") as unknown as AsignacionTable;
}

export async function registrarEnvioHerramientas({
  obra_id,
  fecha_entrega,
  items,
}: {
  obra_id: number;
  fecha_entrega: string;
  items: HerramientaItem[];
}) {
  if (!Number.isInteger(obra_id) || !fecha_entrega || items.length === 0) {
    return { error: "Seleccioná una obra, una fecha y al menos una herramienta." };
  }

  const payload: AsignacionPayload[] = items
    .filter((item) => item.nombre.trim() && item.cantidad > 0)
    .map((item) => ({
      obra_id,
      descripcion_libre: item.nombre.trim(),
      cantidad: item.cantidad,
      cantidad_devuelta: 0,
      fecha_entrega,
      estado_herramienta: "operativa",
    }));

  if (payload.length === 0) return { error: "No hay herramientas válidas para registrar." };

  const supabase = await createSupabaseServerClient();
  const { error } = await asignacionesTable(supabase).insert(payload);
  if (error) return { error: `No se pudo registrar el envío: ${error.message}` };

  revalidatePath("/erp/inventario");
  revalidatePath(`/erp/obras/${obra_id}`);
  return { success: "Envío de herramientas registrado." };
}

export async function registrarDevolucion(
  asignacionId: number,
  cantidadADevolver: number,
  cantidadTotal: number,
  cantidadYaDevuelta: number,
) {
  const cantidad = Math.max(0, Math.min(cantidadADevolver, cantidadTotal - cantidadYaDevuelta));
  if (!Number.isInteger(asignacionId) || cantidad <= 0) return { error: "La cantidad a devolver no es válida." };

  const nuevaCantidadDevuelta = cantidadYaDevuelta + cantidad;
  const supabase = await createSupabaseServerClient();
  const { error } = await asignacionesTable(supabase).update({
    cantidad_devuelta: nuevaCantidadDevuelta,
    fecha_devolucion: nuevaCantidadDevuelta >= cantidadTotal ? new Date().toISOString().slice(0, 10) : null,
  }).eq("id", asignacionId);

  if (error) return { error: `No se pudo registrar la devolución: ${error.message}` };

  revalidatePath("/erp/inventario");
  return { success: "Devolución registrada." };
}

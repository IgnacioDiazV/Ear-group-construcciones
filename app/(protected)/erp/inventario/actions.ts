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

export async function editarAsignacionHerramienta(
  id: number,
  cambios: { descripcion_libre: string; cantidad: number; obra_id: number },
) {
  const descripcion = cambios.descripcion_libre.trim();
  if (!Number.isInteger(id) || !descripcion || !Number.isInteger(cambios.obra_id) || !(cambios.cantidad > 0)) {
    return { error: "Completá herramienta, cantidad y obra con valores válidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await asignacionesTable(supabase).update({
    descripcion_libre: descripcion,
    cantidad: cambios.cantidad,
    obra_id: cambios.obra_id,
  }).eq("id", id);

  if (error) return { error: `No se pudo actualizar la herramienta: ${error.message}` };

  revalidatePath("/erp/inventario");
  return { success: "Herramienta actualizada correctamente." };
}

export async function transferirHerramienta(
  asignacionId: number,
  destinoObraId: number | null,
  depositoDestinoId: number | null,
) {
  if (!Number.isInteger(asignacionId)) return { error: "La asignación seleccionada no es válida." };
  if (!destinoObraId && !depositoDestinoId) return { error: "Elegí una obra destino o el depósito central." };

  const supabase = await createSupabaseServerClient();
  // Casteo para evitar el bloqueo de TypeScript por tipos desactualizados
  const db = supabase as any;

  const { data: asignacion, error: fetchError } = await db
    .from("asignacion_herramientas")
    .select("id, obra_id, articulo_id, descripcion_libre, cantidad, cantidad_devuelta")
    .eq("id", asignacionId)
    .maybeSingle();
  if (fetchError || !asignacion) return { error: "No se encontró la asignación de la herramienta." };

  const cantidadPendiente = asignacion.cantidad - asignacion.cantidad_devuelta;
  if (cantidadPendiente <= 0) return { error: "Esta herramienta ya no tiene saldo pendiente para transferir." };

  if (destinoObraId) {
    const { error: updateError } = await db
      .from("asignacion_herramientas")
      .update({ obra_id: destinoObraId })
      .eq("id", asignacionId);
    if (updateError) return { error: `No se pudo transferir la herramienta: ${updateError.message}` };

    await db.from("movimientos_stock").insert({
      articulo_id: asignacion.articulo_id ?? null,
      cantidad: cantidadPendiente,
      obra_id: destinoObraId,
      tipo_movimiento: "traslado_obra",
      observaciones: `Traslado de "${asignacion.descripcion_libre}" desde obra ${asignacion.obra_id} hacia obra ${destinoObraId}.`,
    });
  } else if (depositoDestinoId) {
    const { error: updateError } = await db
      .from("asignacion_herramientas")
      .update({ cantidad_devuelta: asignacion.cantidad, fecha_devolucion: new Date().toISOString().slice(0, 10) })
      .eq("id", asignacionId);
    if (updateError) return { error: `No se pudo registrar la devolución: ${updateError.message}` };

    if (asignacion.articulo_id) {
      const { data: stockRow } = await db
        .from("stock_por_deposito")
        .select("id, cantidad_actual")
        .eq("deposito_id", depositoDestinoId)
        .eq("articulo_id", asignacion.articulo_id)
        .maybeSingle();

      if (stockRow) {
        await db.from("stock_por_deposito").update({ cantidad_actual: stockRow.cantidad_actual + cantidadPendiente }).eq("id", stockRow.id);
      } else {
        await db.from("stock_por_deposito").insert({ deposito_id: depositoDestinoId, articulo_id: asignacion.articulo_id, cantidad_actual: cantidadPendiente });
      }
    }

    await db.from("movimientos_stock").insert({
      articulo_id: asignacion.articulo_id ?? null,
      cantidad: cantidadPendiente,
      obra_id: asignacion.obra_id,
      destino_deposito_id: depositoDestinoId,
      tipo_movimiento: "traslado_obra",
      observaciones: `Devolución de "${asignacion.descripcion_libre}" al depósito central.`,
    });
  }

  revalidatePath("/erp/inventario");
  return { success: "Transferencia registrada correctamente." };
}

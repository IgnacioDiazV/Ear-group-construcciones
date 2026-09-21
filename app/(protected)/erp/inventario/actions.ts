"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type HerramientaItem = { cantidad: number; nombre: string; tipo: "herramienta" | "material" };
type AsignacionPayload = {
  obra_id: number;
  descripcion_libre: string;
  cantidad: number;
  cantidad_devuelta: number;
  fecha_entrega: string;
  estado_herramienta: string;
  tipo_item?: "herramienta" | "material";
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
      tipo_item: item.tipo,
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
  cambios: { descripcion_libre: string; cantidad: number; obra_id: number; tipo_item: 'herramienta' | 'material' },
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
    tipo_item: cambios.tipo_item,
  }).eq("id", id);

  if (error) return { error: `No se pudo actualizar la herramienta: ${error.message}` };

  revalidatePath("/erp/inventario");
  return { success: "Herramienta actualizada correctamente." };
}

export async function transferirHerramienta(
  asignacionId: number,
  destinoObraId: number | null,
  depositoDestinoId: number | null,
  cantidad: number = 0,
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

  // Validar que la cantidad a transferir sea válida
  const cantidadTransferida = cantidad > 0 ? Math.min(cantidad, cantidadPendiente) : cantidadPendiente;
  if (cantidadTransferida <= 0) return { error: "La cantidad a transferir debe ser mayor a 0." };
  if (cantidadTransferida > cantidadPendiente) return { error: "La cantidad a transferir no puede exceder la cantidad disponible." };

  if (destinoObraId) {
    // Transferencia a otra obra
    if (cantidadTransferida === cantidadPendiente) {
      // Transferencia total: reasignar el registro completo
      const { error: updateError } = await db
        .from("asignacion_herramientas")
        .update({ obra_id: destinoObraId })
        .eq("id", asignacionId);
      if (updateError) return { error: `No se pudo transferir la herramienta: ${updateError.message}` };
    } else {
      // Transferencia parcial: actualizar cantidad devuelta de origen y crear nuevo registro
      const { error: updateError } = await db
        .from("asignacion_herramientas")
        .update({ cantidad_devuelta: asignacion.cantidad_devuelta + cantidadTransferida })
        .eq("id", asignacionId);
      if (updateError) return { error: `No se pudo actualizar el registro de origen: ${updateError.message}` };

      // Crear nuevo registro en la obra destino
      const { error: insertError } = await db
        .from("asignacion_herramientas")
        .insert({
          obra_id: destinoObraId,
          articulo_id: asignacion.articulo_id,
          descripcion_libre: asignacion.descripcion_libre,
          cantidad: cantidadTransferida,
          cantidad_devuelta: 0,
          fecha_entrega: new Date().toISOString().slice(0, 10),
          tipo_item: "herramienta", // o el tipo que corresponda
        });
      if (insertError) return { error: `No se pudo crear el registro en la obra destino: ${insertError.message}` };
    }

    await db.from("movimientos_stock").insert({
      articulo_id: asignacion.articulo_id ?? null,
      cantidad: cantidadTransferida,
      obra_id: destinoObraId,
      tipo_movimiento: "traslado_obra",
      observaciones: `Traslado de "${asignacion.descripcion_libre}" (${cantidadTransferida} un) desde obra ${asignacion.obra_id} hacia obra ${destinoObraId}.`,
    });
  } else if (depositoDestinoId) {
    // Devolución a depósito
    if (cantidadTransferida === cantidadPendiente) {
      // Devolución total
      const { error: updateError } = await db
        .from("asignacion_herramientas")
        .update({ cantidad_devuelta: asignacion.cantidad, fecha_devolucion: new Date().toISOString().slice(0, 10) })
        .eq("id", asignacionId);
      if (updateError) return { error: `No se pudo registrar la devolución: ${updateError.message}` };
    } else {
      // Devolución parcial
      const { error: updateError } = await db
        .from("asignacion_herramientas")
        .update({ cantidad_devuelta: asignacion.cantidad_devuelta + cantidadTransferida })
        .eq("id", asignacionId);
      if (updateError) return { error: `No se pudo registrar la devolución parcial: ${updateError.message}` };
    }

    if (asignacion.articulo_id) {
      const { data: stockRow } = await db
        .from("stock_por_deposito")
        .select("id, cantidad_actual")
        .eq("deposito_id", depositoDestinoId)
        .eq("articulo_id", asignacion.articulo_id)
        .maybeSingle();

      if (stockRow) {
        await db.from("stock_por_deposito").update({ cantidad_actual: stockRow.cantidad_actual + cantidadTransferida }).eq("id", stockRow.id);
      } else {
        await db.from("stock_por_deposito").insert({ deposito_id: depositoDestinoId, articulo_id: asignacion.articulo_id, cantidad_actual: cantidadTransferida });
      }
    }

    await db.from("movimientos_stock").insert({
      articulo_id: asignacion.articulo_id ?? null,
      cantidad: cantidadTransferida,
      obra_id: asignacion.obra_id,
      destino_deposito_id: depositoDestinoId,
      tipo_movimiento: "traslado_obra",
      observaciones: `Devolución de "${asignacion.descripcion_libre}" (${cantidadTransferida} un) al depósito central.`,
    });
  }

  revalidatePath("/erp/inventario");
  return { success: "Transferencia registrada correctamente." };
}

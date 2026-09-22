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

/**
 * Consolidar una herramienta/material: busca si existe en la misma obra y suma cantidades,
 * o crea un registro nuevo si no existe.
 */
async function consolidarHerramienta(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  obra_id: number,
  nombre: string,
  cantidad: number,
  tipo: "herramienta" | "material",
  fecha_entrega: string,
) {
  const nombreLimpio = nombre.trim().toLowerCase();
  
  // Buscar registro existente activo (sin devolución total) en la misma obra con el mismo nombre
  const db = supabase as any;
  const { data: existente, error: fetchError } = await db
    .from("asignacion_herramientas")
    .select("id, descripcion_libre, cantidad, cantidad_devuelta, tipo_item")
    .eq("obra_id", obra_id)
    .is("fecha_devolucion", null)
    .order("id", { ascending: false })
    .limit(100);

  if (fetchError) {
    return { error: `No se pudo buscar duplicados: ${fetchError.message}`, consolidado: false };
  }

  // Buscar coincidencia case-insensitive y mismo tipo
  const registroExistente = existente?.find(
    (reg: any) =>
      reg.descripcion_libre.toLowerCase() === nombreLimpio &&
      reg.tipo_item === tipo
  );

  if (registroExistente) {
    // EXISTE: sumar cantidades mediante UPDATE
    const cantidadAnterior = registroExistente.cantidad - registroExistente.cantidad_devuelta;
    const nuevaCantidadTotal = registroExistente.cantidad + cantidad;
    const nuevaCantidadDisponible = cantidadAnterior + cantidad;

    const { error: updateError } = await db
      .from("asignacion_herramientas")
      .update({
        cantidad: nuevaCantidadTotal,
        // Mantener cantidad_devuelta igual para que cantidad_disponible aumente correctamente
      })
      .eq("id", registroExistente.id);

    if (updateError) {
      return { error: `No se pudo consolidar: ${updateError.message}`, consolidado: false };
    }

    return {
      consolidado: true,
      accion: "actualizado",
      nombre: registroExistente.descripcion_libre,
      cantidadAnterior: registroExistente.cantidad - registroExistente.cantidad_devuelta,
      cantidadNueva: cantidad,
      cantidadTotal: nuevaCantidadTotal,
      cantidadDisponible: nuevaCantidadDisponible,
    };
  }

  // NO EXISTE: crear nuevo registro
  const payload: AsignacionPayload = {
    obra_id,
    descripcion_libre: nombre.trim(),
    cantidad,
    cantidad_devuelta: 0,
    fecha_entrega,
    estado_herramienta: "operativa",
    tipo_item: tipo,
  };

  const { error: insertError } = await asignacionesTable(supabase).insert([payload]);

  if (insertError) {
    return { error: `No se pudo registrar: ${insertError.message}`, consolidado: false };
  }

  return {
    consolidado: true,
    accion: "nuevo",
    nombre: nombre.trim(),
    cantidadTotal: cantidad,
    cantidadDisponible: cantidad,
  };
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

  const itemsValidos = items.filter((item) => item.nombre.trim() && item.cantidad > 0);
  if (itemsValidos.length === 0) {
    return { error: "No hay herramientas válidas para registrar." };
  }

  const supabase = await createSupabaseServerClient();
  const resultados: Array<{
    nombre: string;
    mensaje: string;
    accion: "nuevo" | "actualizado";
    detalles?: any;
  }> = [];
  const errores: string[] = [];

  // Procesar cada herramienta individualmente para consolidar duplicados
  for (const item of itemsValidos) {
    const resultado = await consolidarHerramienta(
      supabase,
      obra_id,
      item.nombre,
      item.cantidad,
      item.tipo,
      fecha_entrega,
    );

    if (resultado.error) {
      errores.push(`${item.nombre}: ${resultado.error}`);
      continue;
    }

    if (resultado.accion === "nuevo") {
      resultados.push({
        nombre: resultado.nombre,
        accion: "nuevo",
        mensaje: `"${resultado.nombre}" registrado exitosamente (${resultado.cantidadTotal} un.)`,
        detalles: resultado,
      });
    } else if (resultado.accion === "actualizado") {
      resultados.push({
        nombre: resultado.nombre,
        accion: "actualizado",
        mensaje: `Se sumaron ${resultado.cantidadNueva} un. a "${resultado.nombre}" (Total: ${resultado.cantidadDisponible} disponibles)`,
        detalles: resultado,
      });
    }
  }

  if (errores.length > 0) {
    return {
      error: `Algunos ítems no se pudieron procesar: ${errores.join(" | ")}`,
      parcial: true,
      resultados,
    };
  }

  revalidatePath("/erp/inventario");
  revalidatePath(`/erp/obras/${obra_id}`);
  return {
    success: true,
    resultados,
    mensaje: `${resultados.length} herramienta(s) procesada(s) correctamente.`,
  };
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

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CobroActionState = { error?: string; success?: string };
const today = () => new Date().toISOString().slice(0, 10);

export async function crearCobro(_previousState: CobroActionState, formData: FormData): Promise<CobroActionState> {
  const obraId = Number(formData.get("obra_id"));
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const monto = Number(formData.get("monto"));
  const moneda = String(formData.get("moneda") ?? "ARS");
  const numeroCuota = Number(formData.get("numero_cuota"));
  const totalCuotas = Number(formData.get("total_cuotas"));
  const metodoPago = String(formData.get("metodo_pago") ?? "");
  const fechaEstimada = String(formData.get("fecha_estimada_cobro") ?? "");

  if (!Number.isInteger(obraId) || !descripcion || !Number.isFinite(monto) || !metodoPago || !fechaEstimada) {
    return { error: "Completá obra, descripción, monto, método y fecha de cobro." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: cobro, error } = await supabase
    .from("anticipos_clientes")
    .insert({
      descripcion,
      estado: "pendiente",
      fecha_emision: today(),
      fecha_estimada_cobro: fechaEstimada,
      metodo_pago: metodoPago,
      moneda,
      monto,
      numero_cuota: Number.isFinite(numeroCuota) ? numeroCuota : null,
      obra_id: obraId,
      total_cuotas: Number.isFinite(totalCuotas) ? totalCuotas : null,
    })
    .select("id")
    .single();

  if (error || !cobro) return { error: `No se pudo registrar el cobro: ${error?.message ?? "sin ID"}` };

  if (metodoPago === "CHEQUE") {
    const banco = String(formData.get("banco") ?? "").trim();
    const numeroCheque = String(formData.get("numero_cheque") ?? "").trim();
    const librador = String(formData.get("librador_nombre") ?? "").trim();
    const fechaDiferida = String(formData.get("fecha_pago_diferido") ?? "");
    if (!banco || !numeroCheque || !fechaDiferida) {
      return { error: "Completá banco, número de cheque y fecha de pago diferido." };
    }

    const { error: chequeError } = await supabase.from("cheques").insert({
      anticipo_id: cobro.id,
      banco,
      estado: "en_cartera",
      fecha_emision: today(),
      fecha_pago_diferido: fechaDiferida,
      librador_nombre: librador || null,
      monto,
      numero_cheque: numeroCheque,
      tipo: "echeq",
    });

    if (chequeError) return { error: `El cobro quedó registrado, pero no se pudo crear el cheque: ${chequeError.message}` };
  }

  revalidatePath("/erp/contabilidad/cobros");
  return { success: "Cobro registrado correctamente." };
}

export async function marcarComoCobrado(anticipoId: number, chequeId?: number) {
  if (!Number.isInteger(anticipoId)) return { error: "El cobro seleccionado no es válido." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("anticipos_clientes").update({ estado: "cobrado", fecha_cobro_real: today() }).eq("id", anticipoId);
  if (error) return { error: `No se pudo marcar como cobrado: ${error.message}` };

  if (chequeId) {
    const { error: chequeError } = await supabase.from("cheques").update({ estado: "acreditado" }).eq("id", chequeId);
    if (chequeError) return { error: `El anticipo quedó cobrado, pero no se pudo actualizar el cheque: ${chequeError.message}` };
  }

  revalidatePath("/erp/contabilidad/cobros");
  return { success: "Cobro actualizado." };
}

export async function eliminarCobro(anticipoId: number): Promise<CobroActionState> {
  if (!Number.isInteger(anticipoId)) return { error: "El cobro seleccionado no es válido." };
  
  const supabase = await createSupabaseServerClient();
  
  const { error: chequeError } = await supabase
    .from("cheques")
    .delete()
    .eq("anticipo_id", anticipoId);
  
  if (chequeError) return { error: `No se pudo eliminar los cheques vinculados: ${chequeError.message}` };
  
  const { error } = await supabase
    .from("anticipos_clientes")
    .delete()
    .eq("id", anticipoId);
  
  if (error) return { error: `No se pudo eliminar el cobro: ${error.message}` };
  
  revalidatePath("/erp/contabilidad/cobros");
  revalidatePath("/erp/obras");
  return { success: "Cobro eliminado correctamente." };
}

export async function actualizarCobro(_prevState: CobroActionState, formData: FormData): Promise<CobroActionState> {
  const anticipoId = Number(formData.get("id"));
  const obraId = Number(formData.get("obra_id"));
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const monto = Number(formData.get("monto"));
  const numeroCuota = formData.get("numero_cuota") ? Number(formData.get("numero_cuota")) : null;
  const totalCuotas = formData.get("total_cuotas") ? Number(formData.get("total_cuotas")) : null;
  const fechaEstimada = String(formData.get("fecha_estimada_cobro") ?? "").trim();
  const estado = String(formData.get("estado") ?? "pendiente").trim().toLowerCase();
  const chequeId = formData.get("cheque_id") ? Number(formData.get("cheque_id")) : null;

  if (!Number.isInteger(anticipoId) || !Number.isInteger(obraId) || !descripcion || !Number.isFinite(monto) || !fechaEstimada) {
    return { error: "Completá todos los campos requeridos." };
  }

  if (!["pendiente", "cobrado"].includes(estado)) {
    return { error: "El estado debe ser 'pendiente' o 'cobrado'." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("anticipos_clientes")
    .update({
      obra_id: obraId,
      descripcion,
      monto,
      numero_cuota: numeroCuota,
      total_cuotas: totalCuotas,
      fecha_estimada_cobro: fechaEstimada,
      estado,
    })
    .eq("id", anticipoId);

  if (error) return { error: `No se pudo actualizar el cobro: ${error.message}` };

  if (chequeId) {
    const banco = String(formData.get("banco") ?? "").trim();
    const numeroCheque = String(formData.get("numero_cheque") ?? "").trim();
    const fechaPagoDiferido = String(formData.get("fecha_pago_diferido") ?? "").trim();

    if (banco || numeroCheque || fechaPagoDiferido) {
      const { error: chequeError } = await supabase
        .from("cheques")
        .update({
          ...(banco ? { banco } : {}),
          ...(numeroCheque ? { numero_cheque: numeroCheque } : {}),
          ...(fechaPagoDiferido ? { fecha_pago_diferido: fechaPagoDiferido } : {}),
          monto,
        } as never)
        .eq("id", chequeId);

      if (chequeError) return { error: `El anticipo se actualizó, pero no se pudo actualizar el cheque: ${chequeError.message}` };
    }
  }

  revalidatePath("/erp/contabilidad/cobros");
  return { success: "Cobro actualizado correctamente." };
}
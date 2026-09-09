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
      estado: "EN_CARTERA",
      fecha_emision: today(),
      fecha_pago_diferido: fechaDiferida,
      librador_nombre: librador || null,
      monto,
      numero_cheque: numeroCheque,
      tipo: "DIFERIDO",
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
    const { error: chequeError } = await supabase.from("cheques").update({ estado: "cobrado" }).eq("id", chequeId);
    if (chequeError) return { error: `El anticipo quedó cobrado, pero no se pudo actualizar el cheque: ${chequeError.message}` };
  }

  revalidatePath("/erp/contabilidad/cobros");
  return { success: "Cobro actualizado." };
}

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CajaSemanalFilaPayload = {
  concepto_o_nombre: string;
  horas: number | null;
  valor_hora: number | null;
  debe: number;
  debe_aun: string;
  pago_final: number;
  pago_hoy: number;
  medio_pago: "EFECTIVO" | "TRANSFERENCIA" | "MIXTO";
  detalle_pago: string;
};

export type CajaSemanalPayload = {
  semana_etiqueta: string;
  fecha_pago: string;
  total_efectivo: number;
  total_transferencia: number;
  total_pagado: number;
  saldo_en_caja: number;
  observaciones: string;
  filas: CajaSemanalFilaPayload[];
};

export async function guardarCajaSemanal(payload: CajaSemanalPayload) {
  if (!payload.semana_etiqueta || !payload.fecha_pago || payload.filas.length === 0) {
    return { error: "Completá la semana, la fecha y al menos una fila." };
  }

  const supabase = await createSupabaseServerClient();
  const database = supabase as unknown as {
    from: (table: string) => {
      insert: (value: unknown) => { select: (columns: string) => { single: () => Promise<{ data: { id: number } | null; error: { message: string } | null }> } };
    };
  };
  const { data: caja, error: cajaError } = await database.from("caja_semanal").insert({
    semana_etiqueta: payload.semana_etiqueta,
    fecha_pago: payload.fecha_pago,
    total_efectivo: payload.total_efectivo,
    total_transferencia: payload.total_transferencia,
    total_pagado: payload.total_pagado,
    saldo_en_caja: payload.saldo_en_caja,
    observaciones: payload.observaciones,
  }).select("id").single();

  if (cajaError || !caja) return { error: `No se pudo guardar la cabecera: ${cajaError?.message ?? "sin ID"}` };

  const filas = payload.filas.map((fila) => ({ ...fila, caja_semanal_id: caja.id }));
  const { error: filasError } = await supabase.from("caja_semanal_filas" as never).insert(filas as never);
  if (filasError) return { error: `No se pudieron guardar las filas: ${filasError.message}` };

  revalidatePath("/erp/contabilidad");
  revalidatePath("/erp/contabilidad/semanal");
  return { success: "Planilla semanal guardada correctamente." };
}

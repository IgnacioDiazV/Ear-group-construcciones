"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Empleado = {
  id: number;
  legajo: string | null;
  nombre: string;
  apellido: string;
  apodo: string | null;
  obra_actual_id: number | null;
  obra?: { id: number; nombre: string; codigo: string } | null;
  telefono: string;
  direccion: string | null;
  contacto_emergencia_nombre: string | null;
  telefono_emergencia: string | null;
};

export type EmpleadoInput = Omit<Empleado, "id"> & { id?: number | null };

type ActionResult = { ok: true } | { ok: false; error: string };

type DbError = { message: string } | null;
type EmpleadosTable = {
  insert: (values: Record<string, unknown>) => Promise<{ error: DbError }>;
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: number) => Promise<{ error: DbError }>;
  };
  delete: () => { eq: (column: string, value: number) => Promise<{ error: DbError }> };
};

const emptyToNull = (value: string | null | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
};

export async function guardarEmpleado(data: EmpleadoInput): Promise<ActionResult> {
  const nombre = data.nombre?.trim() ?? "";
  const apellido = data.apellido?.trim() ?? "";
  const telefono = data.telefono?.trim() ?? "";

  if (!nombre || !apellido || !telefono) {
    return { ok: false, error: "Nombre, apellido y teléfono son obligatorios." };
  }

  const payload = {
    legajo: emptyToNull(data.legajo),
    nombre,
    apellido,
    apodo: emptyToNull(data.apodo),
    obra_actual_id: data.obra_actual_id,
    telefono,
    direccion: emptyToNull(data.direccion),
    contacto_emergencia_nombre: emptyToNull(data.contacto_emergencia_nombre),
    telefono_emergencia: emptyToNull(data.telefono_emergencia),
  };

  const supabase = await createSupabaseServerClient();
  const table = supabase.from("empleados") as unknown as EmpleadosTable;

  const { error } = data.id
    ? await table.update(payload).eq("id", data.id)
    : await table.insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/erp/rrhh");
  return { ok: true };
}

export async function eliminarEmpleado(id: number): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const table = supabase.from("empleados") as unknown as EmpleadosTable;

  const { error } = await table.delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/erp/rrhh");
  return { ok: true };
}

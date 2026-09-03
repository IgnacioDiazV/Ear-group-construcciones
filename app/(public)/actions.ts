"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactFormState = {
  error?: string;
  success?: string;
};

export async function submitContactLead(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const tipoProyecto = String(formData.get("tipo_proyecto_interes") ?? "").trim();

  if (!nombre || !email || !mensaje) {
    return { error: "Completá tu nombre, email y mensaje para continuar." };
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Ingresá un email válido para que podamos contactarte." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contactos_leads_web").insert({
    email,
    mensaje,
    nombre,
    telefono: telefono || null,
    tipo_proyecto_interes: tipoProyecto || null,
    estado: "nuevo",
  });

  if (error) {
    return { error: "No pudimos registrar tu consulta. Intentá nuevamente en unos minutos." };
  }

  return { success: "Recibimos tu consulta. Nuestro equipo te contactará pronto." };
}
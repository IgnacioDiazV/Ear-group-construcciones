"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { EditObraForm } from "./edit-obra-form";
import styles from "./obra-detalle.module.css";

type Obra = Database["public"]["Tables"]["obras"]["Row"];

export function ObraDetailActions({ obra }: { obra: Obra }) {
  const [isEditing, setEditing] = useState(false);

  return (
    <>
      <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3E2723] text-white hover:bg-[#2C1B17] text-sm font-medium transition" onClick={() => setEditing(true)} type="button">Editar información</button>
      {isEditing && <EditObraForm obra={obra} onClose={() => setEditing(false)} />}
    </>
  );
}

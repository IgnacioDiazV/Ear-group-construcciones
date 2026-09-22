import { Suspense } from "react";
import { getObrasResumen } from "@/features/obras/queries";
import { ObrasView } from "./obras-view";

export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const obras = await getObrasResumen();

  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">Cargando obras...</div>}>
      <ObrasView obras={obras} />
    </Suspense>
  );
}
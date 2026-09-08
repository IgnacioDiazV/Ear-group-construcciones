import { getObrasResumen } from "@/features/obras/queries";
import { ObrasView } from "./obras-view";

export default async function ObrasPage() {
  const obras = await getObrasResumen();

  return <ObrasView obras={obras} />;
}

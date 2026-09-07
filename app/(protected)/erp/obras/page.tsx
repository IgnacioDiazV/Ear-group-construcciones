import { getObras } from "@/features/obras/queries";
import { ObrasView } from "./obras-view";

export default async function ObrasPage() {
  const obras = await getObras();

  return <ObrasView obras={obras} />;
}

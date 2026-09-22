import { Suspense } from "react";
import CalculadoraView from "./components/calculadora-view";

export const dynamic = "force-dynamic";

export default function CalculadoraPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8 text-center text-stone-500">
          Cargando calculadora...
        </div>
      }
    >
      <CalculadoraView />
    </Suspense>
  );
}
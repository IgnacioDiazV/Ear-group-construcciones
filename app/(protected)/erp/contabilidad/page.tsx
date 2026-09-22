import { Suspense } from "react";
import { ContabilidadTabs } from "./contabilidad-tabs";
import { ContabilidadContent } from "./contabilidad-content";
import { ComprobantesContent } from "./comprobantes-content";
import { LiquidacionesContent } from "./liquidaciones-content";
import { CobrosContent } from "./cobros-content";
import styles from "./contabilidad.module.css";

export default function ContabilidadPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Contabilidad y comprobantes</h1>
            <p>Gestión integral de gastos, liquidaciones y cobros.</p>
          </div>
        </header>
        <ContabilidadTabs />
        <Suspense fallback={<div>Cargando...</div>}>
          <ContabilidadContent
            comprobantes={<ComprobantesContent />}
            liquidaciones={<LiquidacionesContent />}
            cobros={<CobrosContent />}
          />
        </Suspense>
      </div>
    </main>
  );
}

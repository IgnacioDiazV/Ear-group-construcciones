import styles from "./erp-layout.module.css";
import Link from "next/link";
import { ErpNavigation } from "./navigation";

export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.erpShell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/erp/obras">
          <span className={styles.logo}>EAR</span>
          <span className={styles.brandTitle}>EAR GROUP</span>
        </Link>
        <div className={styles.activeProject}>Proyecto Activo: Torre Alvear - Fase 2 <span aria-hidden="true">▾</span></div>
        <div className={styles.topRight}>
          <span className={styles.syncStatus}><span aria-hidden="true">●</span> Servidor sincronizado</span>
          <span className={styles.userPill}>Admin: Usuario</span>
        </div>
      </header>

      <div className={styles.mainContainer}>
        <aside className={styles.sidebar}>
          <ErpNavigation />
          <div className={styles.sidebarFooter}>Gestión integral de obra</div>
        </aside>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./contabilidad-smart.module.css";

export function ContabilidadTabs() {
  const pathname = usePathname();
  return <nav aria-label="Secciones de contabilidad" className={styles.subTabs}>
    <Link className={pathname === "/erp/contabilidad" ? styles.subTabActive : styles.subTab} href="/erp/contabilidad">Comprobantes y gastos</Link>
    <Link className={pathname.startsWith("/erp/contabilidad/liquidaciones") ? styles.subTabActive : styles.subTab} href="/erp/contabilidad/liquidaciones">Liquidaciones y jornales</Link>
  </nav>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./contabilidad-smart.module.css";

export function ContabilidadTabs() {
  const pathname = usePathname();
  const tabs = [
    { label: "Comprobantes y gastos", href: "/erp/contabilidad" },
    { label: "Liquidaciones y jornales", href: "/erp/contabilidad/liquidaciones" },
    { label: "Cobros y Cheques", href: "/erp/contabilidad/cobros" },
  ];

  return <nav aria-label="Secciones de contabilidad" className={styles.subTabs}>
    {tabs.map((tab) => {
      const isActive = tab.href === "/erp/contabilidad" ? pathname === tab.href : pathname.startsWith(tab.href);
      return <Link className={isActive ? styles.subTabActive : styles.subTab} href={tab.href} key={tab.href}>{tab.label}</Link>;
    })}
  </nav>;
}

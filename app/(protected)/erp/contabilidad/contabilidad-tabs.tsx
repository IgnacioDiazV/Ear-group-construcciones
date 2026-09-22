"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./contabilidad-smart.module.css";

export function ContabilidadTabs() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "comprobantes";

  const tabs = [
    { label: "Comprobantes y gastos", href: "/erp/contabilidad?tab=comprobantes", key: "comprobantes" },
    { label: "Liquidaciones y jornales", href: "/erp/contabilidad?tab=liquidaciones", key: "liquidaciones" },
    { label: "Cobros y Cheques", href: "/erp/contabilidad?tab=cobros", key: "cobros" },
  ];

  return <nav aria-label="Secciones de contabilidad" className={styles.subTabs}>
    {tabs.map((tab) => {
      const isActive = activeTab === tab.key;
      return <Link className={isActive ? styles.subTabActive : styles.subTab} href={tab.href} key={tab.key}>{tab.label}</Link>;
    })}
  </nav>;
}

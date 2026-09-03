"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./erp-layout.module.css";

const navigationItems = [
  { href: "/erp/obras", label: "Obras y Proyectos", icon: "▣" },
  { href: "/erp/calculo", label: "Cálculo y Costos", icon: "⌁" },
  { href: "/erp/inventario", label: "Inventario y Stock", icon: "⌂" },
  { href: "/erp/rrhh", label: "Empleados / RRHH", icon: "♙" },
  { href: "/erp/contabilidad", label: "Contabilidad", icon: "▤" },
];

export function ErpNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación del ERP">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={styles.navItem}
            href={item.href}
            key={item.href}
          >
            <span aria-hidden="true" className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  Calculator, 
  Boxes, 
  Users, 
  Receipt 
} from "lucide-react";
import styles from "./erp-layout.module.css";

const navigationItems = [
  { href: "/erp/obras", label: "Obras y Proyectos", icon: Building2 },
  { href: "/erp/calculadora", label: "Cálculo y Costos", icon: Calculator },
  { href: "/erp/inventario", label: "Inventario y Stock", icon: Boxes },
  //{ href: "/erp/rrhh", label: "Empleados / RRHH", icon: Users },
  { href: "/erp/contabilidad", label: "Contabilidad", icon: Receipt },
];

export function ErpNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación del ERP">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const IconComponent = item.icon;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={styles.navItem}
            href={item.href}
            key={item.href}
          >
            <span aria-hidden="true" className={styles.navIcon}>
              <IconComponent size={18} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
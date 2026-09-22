"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Building2, 
  Calculator, 
  Boxes, 
  Users, 
  Receipt,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import styles from "./erp-layout.module.css";

const navigationItems = [
  { href: "/erp/obras", label: "Obras y Proyectos", icon: Building2 },
  { href: "/erp/calculadora", label: "Cálculo y Costos", icon: Calculator },
  { href: "/erp/inventario", label: "Inventario y Stock", icon: Boxes },
  //{ href: "/erp/rrhh", label: "Empleados / RRHH", icon: Users },
];

const contabilidadSubitems = [
  { href: "/erp/contabilidad?tab=comprobantes", label: "Comprobantes y gastos", key: "comprobantes" },
  { href: "/erp/contabilidad?tab=liquidaciones", label: "Liquidaciones y jornales", key: "liquidaciones" },
  { href: "/erp/contabilidad?tab=cobros", label: "Cobros y Cheques", key: "cobros" },
];

export function ErpNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isContabilidadOpen, setIsContabilidadOpen] = useState(false);

  // Detectar si estamos en Contabilidad y expandir acordeón por defecto
  useEffect(() => {
    if (pathname.includes("/erp/contabilidad")) {
      setIsContabilidadOpen(true);
    }
  }, [pathname]);

  const isContabilidadActive = pathname.includes("/erp/contabilidad");
  const currentTab = searchParams.get("tab") || inferTabFromPathname(pathname);

  function inferTabFromPathname(path: string): string {
    if (path.includes("/liquidaciones")) return "liquidaciones";
    if (path.includes("/cobros")) return "cobros";
    return "comprobantes";
  }

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

      {/* Contabilidad Accordion */}
      <button
        onClick={() => setIsContabilidadOpen(!isContabilidadOpen)}
        className={`${styles.navItem} ${isContabilidadActive ? styles.navItemActive : ""}`}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          padding: "13px 20px",
          border: "none",
          textAlign: "left",
          width: "100%",
          background: "none",
        }}
        aria-expanded={isContabilidadOpen}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "11px", flex: 1 }}>
          <span aria-hidden="true" className={styles.navIcon}>
            <Receipt size={18} />
          </span>
          Contabilidad
        </span>
        {isContabilidadOpen ? (
          <ChevronDown size={16} style={{ flexShrink: 0, color: "inherit" }} />
        ) : (
          <ChevronRight size={16} style={{ flexShrink: 0, color: "inherit" }} />
        )}
      </button>

      {/* Subitems Container */}
      {isContabilidadOpen && (
        <div className="flex flex-col gap-1 w-full px-2 py-1">
          {contabilidadSubitems.map((subitem) => {
            const isSubitemActive = currentTab === subitem.key;
            return (
              <Link
                key={subitem.key}
                href={subitem.href}
                className={`pl-10 pr-3 py-2 text-sm rounded-lg w-full flex items-center transition-colors ${
                  isSubitemActive
                    ? "bg-[#5d291e] text-white font-medium shadow-sm"
                    : "text-[#d7ccc8] hover:text-white hover:bg-[#4a2219]/60"
                }`}
              >
                {subitem.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
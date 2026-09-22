import Link from "next/link";
import Image from "next/image";
import { 
  Building2, 
  Boxes, 
  Receipt, 
  Users, 
  ArrowRight, 
  Calculator
} from "lucide-react";
import styles from "./erp-welcome.module.css";

const modules = [
  {
    href: "/erp/obras",
    title: "Obras y Proyectos",
    description: "Estados, presupuestos y seguimiento de obras",
    icon: Building2,
  },
  {
    href: "/erp/inventario",
    title: "Inventario y Herramientas",
    description: "Control de stock, galpones y transferencias",
    icon: Boxes,
  },
  {
    href: "/erp/contabilidad",
    title: "Contabilidad y Caja",
    description: "Liquidaciones semanales, gastos y cheques",
    icon: Receipt,
  },
  {
    href: "/erp/calculadora",
    title: "Calculadora",
    description: "Herramienta para realizar cálculos rápidos",
    icon: Calculator,
  },
];

export default function ErpWelcomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Image alt="EAR Group" className={styles.headerLogo} height={48} src="/logo-ear.svg" width={48} />
            <div>
              <h1 className={styles.title}>Sistema de Gestión </h1>
              <p className={styles.subtitle}>
                Plataforma integral para la administración de obras, inventario, contabilidad y personal.
              </p>
            </div>
          </div>
        </header>

        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {modules.map((module) => {
              const IconComponent = module.icon;

              return (
                <Link href={module.href} key={module.href} className={styles.card}>
                  <div className={styles.cardIcon}>
                    <IconComponent size={28} strokeWidth={1.75} />
                  </div>
                  <h2 className={styles.cardTitle}>{module.title}</h2>
                  <p className={styles.cardDescription}>{module.description}</p>
                  <div className={styles.cardArrow}>
                    <ArrowRight size={18} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
import Link from "next/link";
import Image from "next/image";
import styles from "./public-layout.module.css";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.siteShell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <Image alt="EAR Group" className="h-9 w-auto object-contain" height={49} priority src="/logo-ear.svg" width={35} />
          <span className={styles.brandTitle}>EAR GROUP CONSTRUCCIONES</span>
        </Link>

        <nav aria-label="Navegación principal" className={styles.navigation}>
          <Link href="/">Inicio</Link>
          <Link href="#portfolio">Proyectos</Link>
          <Link href="#contacto">Contacto</Link>
        </nav>

        <Link className={styles.ctaButton} href="#contacto">Solicitar Presupuesto</Link>
      </header>

      {children}

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <Image alt="EAR Group" className={styles.footerLogo} height={40} src="/logo-ear2.svg" width={40} />
            <div>
              <h2>EAR GROUP CONSTRUCCIONES</h2>
              <p>Tu socio en la construcción. Diseño, cálculo y ejecución de obra integral.</p>
            </div>
          </div>
          <div>
            <h3>Enlaces</h3>
            <Link href="/">Inicio</Link>
            <Link href="#portfolio">Proyectos</Link>
            <Link href="#contacto">Contacto</Link>
          </div>
          <div>
            <h3>Servicios</h3>
            <Link href="#servicios">Diseño y cálculo</Link>
            <Link href="#servicios">Dirección de obra</Link>
            <Link href="#servicios">Visualización 3D</Link>
          </div>
          <div>
            <h3>Contacto</h3>
            <p>info@eargroup.com</p>
            <p>+54 381 000-0000</p>
            <p>Tucumán, Argentina</p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 EAR GROUP CONSTRUCCIONES. Todos los derechos reservados.</span>
          <span>Diseño, cálculo y ejecución de obra integral.</span>
        </div>
      </footer>
    </div>
  );
}
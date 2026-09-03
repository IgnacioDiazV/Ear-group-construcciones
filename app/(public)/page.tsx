import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "./contact-form";
import contactStyles from "./contact.module.css";
import homeStyles from "./home.module.css";
import portfolioStyles from "./portfolio.module.css";
import servicesStyles from "./services.module.css";

const projects = [
  { title: "Torre Alvear - Fase 2", type: "Edificio residencial", location: "Buenos Aires", status: "En ejecución", imageAlt: "Render de Torre Alvear" },
  { title: "Residencia Jardín Sur", type: "Residencial multifamiliar", location: "Tucumán", status: "Finalizado", imageAlt: "Render de Residencia Jardín Sur" },
  { title: "Centro Comercial Pilar", type: "Desarrollo comercial", location: "Pilar", status: "Conforme a obra", imageAlt: "Render de Centro Comercial Pilar" },
  { title: "Sede Corporativa Norte", type: "Oficinas corporativas", location: "Buenos Aires", status: "En ejecución", imageAlt: "Render de Sede Corporativa Norte" },
  { title: "Complejo Residencial Siandencio", type: "Residencial", location: "Tucumán", status: "En revisión", imageAlt: "Render de Complejo Residencial Siandencio" },
  { title: "Edificio Moderno B", type: "Edificio residencial", location: "Buenos Aires", status: "Finalizado", imageAlt: "Render de Edificio Moderno B" },
];

const services = [
  { number: "01", title: "Dirección y Ejecución Integral de Obra", description: "Coordinamos cada etapa con foco en calidad, tiempos y una ejecución ordenada." },
  { number: "02", title: "Cálculo Estructural e Ingeniería", description: "Soluciones técnicas precisas para construir con respaldo y eficiencia." },
  { number: "03", title: "Renders, Modelado 3D y Anteproyectos", description: "Visualizamos las ideas antes de construirlas y alineamos cada decisión." },
  { number: "04", title: "Cómputo Métrico y Gestión Presupuestaria", description: "Medimos, proyectamos y controlamos los recursos de cada obra." },
];

export const metadata = {
  title: "EAR Group Construcciones",
  description: "Diseño, cálculo y ejecución de obra integral.",
};

export default function PublicHomePage() {
  return (
    <>
      <section className={homeStyles.hero}>
        <div className={homeStyles.heroCopy}>
          <p className={homeStyles.eyebrow}>EAR Group Construcciones</p>
          <h1>Construimos los proyectos en los que confiás.</h1>
          <p className={homeStyles.heroText}>Diseño, cálculo y ejecución de obra bajo un mismo equipo. Más de 15 años levantando desarrollos residenciales, corporativos y comerciales.</p>
          <div className={homeStyles.heroActions}>
            <Link className={homeStyles.primaryButton} href="#portfolio">Ver obras destacadas</Link>
            <Link className={homeStyles.outlineButton} href="#contacto">Contactar equipo</Link>
          </div>
          <div className={homeStyles.heroStats}>
            <div><strong>500+</strong><span>Proyectos completados</span></div>
            <div><strong>15</strong><span>Años de experiencia</span></div>
            <div><strong>32</strong><span>Obras en ejecución</span></div>
          </div>
        </div>
        <div className={homeStyles.heroRender}>
          <Image alt="Visualización arquitectónica de edificio residencial moderno" fill priority sizes="(max-width: 960px) 100vw, 42vw" src="/renders/obra-placeholder.svg" />
          <span>RENDER / EDIFICIO RESIDENCIAL MODERNO</span>
        </div>
      </section>

      <main className={homeStyles.content}>
        <section id="portfolio">
          <div className={homeStyles.sectionHeading}>
            <p className={homeStyles.eyebrow}>Trabajo que permanece</p>
            <h2>Nuestro portafolio</h2>
            <p>Obras destacadas y desarrollos en ejecución.</p>
          </div>
          <div className={portfolioStyles.portfolioGrid}>
            {projects.map((project) => (
              <article className={portfolioStyles.projectCard} key={project.title}>
                <div className={portfolioStyles.projectThumb}>
                  <Image alt={project.imageAlt} fill sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw" src="/renders/obra-placeholder.svg" />
                  <span>{project.title}</span>
                </div>
                <div className={portfolioStyles.projectInfo}>
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.type} <span aria-hidden="true">·</span> {project.location}</p>
                  </div>
                  <span className={portfolioStyles.projectStatus}>{project.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={servicesStyles.servicesSection} id="servicios">
          <div className={servicesStyles.sectionHeading}>
            <p className={servicesStyles.eyebrow}>Una mirada integral</p>
            <h2>Experiencia para cada etapa del proyecto</h2>
            <p>Un mismo equipo para transformar una idea en una obra concreta, eficiente y bien ejecutada.</p>
          </div>
          <div className={servicesStyles.servicesGrid}>
            {services.map((service) => (
              <article className={servicesStyles.serviceCard} key={service.number}>
                <span className={servicesStyles.serviceNumber}>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={contactStyles.contactSection} id="contacto">
          <div className={contactStyles.contactHeading}>
            <p className={contactStyles.eyebrow}>Hablemos de tu proyecto</p>
            <h2>Empecemos a construirlo</h2>
            <p>Dejanos tus datos y te contactamos en el día.</p>
          </div>
          <ContactForm />
        </section>
      </main>
    </>
  );
}

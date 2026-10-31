/*
 * THESIS: una landing de producto clara que se atreve a mostrar el flujo real (aprobar una publicación) en vez de prometerlo; rechaza logos y cifras inventadas.
 * OWN-WORLD: marino de la app, tinta y marcador celeste sobre blanco; Bricolage Grotesque y Figtree; ventanas de app redondeadas con portadas dibujadas.
 * STORY: el visitante reconoce su caos, ve cómo se ordena, entiende que es abierto y en desarrollo, y se une a la lista.
 * FIRST VIEWPORT: titular centrado grande, subtítulo, formulario de lista de espera y enlace a GitHub, con la demo asomando debajo.
 * FORM: dirección fijada por el usuario (landing de SaaS familiar); seed 72ca80b9.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
import Link from "next/link";
import { HublyBrandLogo } from "@/components/brand/HublyBrandLogo";
import { Cover, type CoverKind } from "@/components/Cover";
import { HeroDemo } from "@/components/HeroDemo";
import { RoleTabs } from "@/components/RoleTabs";
import { WaitlistForm } from "@/components/WaitlistForm";

const REPO_URL = "https://github.com/jairbonillacan-cmd/Hubly";
const NEW_ISSUE_URL = `${REPO_URL}/issues/new/choose`;

const STEPS = [
  {
    title: "Conecta",
    text: "Crea un espacio para cada cliente y enlaza sus redes y cuentas de anuncios.",
  },
  {
    title: "Planea",
    text: "Llena el calendario del mes, con textos, piezas y fechas en un solo sitio.",
  },
  {
    title: "Aprueba",
    text: "Envía un enlace al cliente y recibe sus comentarios sobre cada publicación.",
  },
  {
    title: "Publica y reporta",
    text: "Lo aprobado sale a su hora y, a fin de mes, el reporte se arma con esos datos.",
  },
];

const ADS = [
  { platform: "Meta", spend: "$1,240", result: "318 contactos" },
  { platform: "Google", spend: "$860", result: "142 contactos" },
  { platform: "TikTok", spend: "$410", result: "96 contactos" },
];

const COMPARISON = [
  { task: "Planear el mes", today: "Una hoja de cálculo por cliente", hubly: "Un calendario por marca" },
  { task: "Compartir la parrilla", today: "Una presentación armada a mano", hubly: "Un enlace siempre actualizado" },
  { task: "Conseguir la aprobación", today: "Capturas y audios por WhatsApp", hubly: "Comentarios en cada publicación" },
  { task: "Publicar", today: "Una alarma y varias apps abiertas", hubly: "Programado de una sola vez" },
  { task: "Reportar", today: "Copiar datos de cada plataforma", hubly: "Un reporte con las cuentas conectadas" },
];

const IDEAS = [
  "Biblioteca de recursos por marca",
  "Comentarios y mensajes en una bandeja",
  "Permisos por rol",
  "Enlace en la biografía",
  "Importar desde Canva y Drive",
  "Plantillas de reportes",
  "Aplicación móvil",
  "API pública",
];

const CONTRIBUTE = [
  {
    title: "Cuéntanos tu flujo",
    text: "Qué herramientas usas y en qué se te va el tiempo.",
    href: NEW_ISSUE_URL,
    link: "Abrir un issue",
  },
  {
    title: "Sigue el proyecto",
    text: "Una estrella en GitHub nos ayuda a que más agencias lo encuentren.",
    href: REPO_URL,
    link: "Ir al repositorio",
  },
  {
    title: "Escribe código",
    text: "Lee la guía y conversemos antes de empezar un cambio grande.",
    href: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
    link: "Leer la guía",
  },
];

const CHAOS = [
  "Las fotos, en tres carpetas de Drive.",
  "Los textos, en un documento que nadie encuentra.",
  "Las aprobaciones, perdidas en WhatsApp.",
  "Los reportes, a mano y a fin de mes.",
];

const GRID: { kind: CoverKind; label: string }[] = [
  { kind: "cup", label: "Lun 12" },
  { kind: "beans", label: "Mar 13" },
  { kind: "sun", label: "Mié 14" },
  { kind: "steam", label: "Jue 15" },
  { kind: "leaf", label: "Vie 16" },
  { kind: "cup", label: "Sáb 17" },
];

const REPORT = [
  { label: "Instagram", value: 84 },
  { label: "TikTok", value: 62 },
  { label: "Facebook", value: 37 },
  { label: "LinkedIn", value: 21 },
];

const ROADMAP = [
  { state: "done", title: "Repositorio, licencia y esta página" },
  { state: "done", title: "Demo con parrillas, aprobación por enlace y reportes" },
  { state: "next", title: "Cuentas reales, agencias y equipos" },
  { state: "later", title: "Publicación programada en cada red" },
  { state: "later", title: "Panel de anuncios conectado" },
  { state: "later", title: "Asistente con la voz de cada marca" },
];

const ROADMAP_LABEL: Record<string, string> = {
  done: "Hecho",
  next: "Lo siguiente",
  later: "Después",
};

const FAQ = [
  {
    question: "¿Ya puedo usar Hubly?",
    answer:
      "Ya puedes probar la demo con datos de ejemplo. Las cuentas reales y la publicación automática todavía no están listas: únete a la lista o sigue el repositorio para enterarte.",
  },
  {
    question: "¿Cuánto va a costar?",
    answer:
      "El código es abierto y alojarlo por tu cuenta no requiere pagar ninguna licencia; solo cubres tu propia infraestructura. Aún no hemos decidido si habrá una versión alojada por nosotros.",
  },
  {
    question: "¿Qué redes sociales tendrá?",
    answer:
      "Queremos cubrir las principales, pero la lista definitiva y su orden todavía no están decididos. Puedes proponer las que más necesitas en GitHub.",
  },
  {
    question: "¿Qué significa la licencia AGPL-3.0?",
    answer:
      "Puedes usar, modificar y alojar Hubly libremente. Si ofreces una versión modificada como servicio a otras personas, también tienes que compartir ese código.",
  },
  {
    question: "¿Necesito saber de servidores para usarlo?",
    answer:
      "Para alojarlo por tu cuenta hará falta algo de conocimiento técnico o alguien que te ayude. Cuando llegue el momento publicaremos la guía de instalación.",
  },
  {
    question: "¿Sirve si trabajo por mi cuenta?",
    answer:
      "Esa es la idea. Lo pensamos para equipos que llevan varias marcas, pero también para quien gestiona a sus clientes en solitario.",
  },
  {
    question: "¿Cómo puedo ayudar?",
    answer:
      "Cuéntanos cómo trabaja tu agencia y qué te quita más tiempo abriendo un issue en GitHub. Esa información es lo más útil en esta etapa.",
  },
];

function Logo({ height = 42 }: { height?: number }) {
  return (
    <a href="#inicio" className="logo" aria-label="Hubly, inicio">
      <HublyBrandLogo on="light" height={height} />
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" className="icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Logo />
          <nav aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#funciones">Funciones</a>
            <a href="#abierto">Código abierto</a>
            <a href="#preguntas">Preguntas</a>
          </nav>
          <div className="nav-actions">
            <a href={REPO_URL} className="nav-github">
              <GitHubIcon />
              <span>GitHub</span>
            </a>
            <Link href="/login" className="nav-github">
              <span>Entrar</span>
            </Link>
            <Link href="/dashboard" className="button button--primary button--small">
              Probar la demo
            </Link>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="hero">
          <p className="hero-status">
            <span aria-hidden="true" /> Código abierto · Demo con datos de ejemplo
          </p>
          <h1>
            Todas las marcas de tu agencia, en <mark>un solo lugar</mark>
          </h1>
          <p className="hero-lead">
            Planea el mes, arma parrillas, consigue aprobaciones con un enlace y entrega reportes sin saltar entre diez herramientas.
          </p>
          <div className="hero-actions" id="lista">
            <WaitlistForm />
            <div className="hero-links">
              <Link href="/dashboard" className="hero-github">
                Probar la demo
              </Link>
              <Link href="/share/cafe-bruma-nov" className="hero-github">
                Ver lo que recibe tu cliente
              </Link>
            </div>
          </div>
          <HeroDemo />
        </section>

        <section className="chaos" aria-labelledby="chaos-title">
          <h2 id="chaos-title" className="sr-only">
            El problema
          </h2>
          <ul>
            {CHAOS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="chaos-close">Hubly junta todo eso en una sola pantalla.</p>
        </section>

        <section className="steps" id="como-funciona">
          <h2>Un mes de trabajo, en cuatro pasos</h2>
          <p className="section-lead">Así imaginamos el recorrido de cada cliente dentro de Hubly.</p>
          <ol>
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="features" id="funciones" aria-label="Funciones">
          <article className="feature">
            <div className="feature-text">
              <h2>La parrilla se arma sola</h2>
              <p>
                Ordena las publicaciones por día y compártelas con un enlace o en PDF. Sin copiar y pegar en una presentación cada mes.
              </p>
              <p className="planned planned--live">Disponible en la demo</p>
            </div>
            <div className="feature-visual feature-visual--yellow">
              <div className="grid-sheet">
                <p>Café Lunar · Octubre</p>
                <ul>
                  {GRID.map((item) => (
                    <li key={item.label}>
                      <Cover kind={item.kind} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="feature feature--flip">
            <div className="feature-text">
              <h2>El cliente aprueba con un enlace</h2>
              <p>
                Sin cuenta y sin contraseña. Comenta o aprueba cada publicación, y tu equipo ve la respuesta en el mismo calendario.
              </p>
              <p className="planned planned--live">Disponible en la demo</p>
            </div>
            <div className="feature-visual feature-visual--lilac">
              <div className="thread">
                <p className="bubble bubble--client">
                  <b>Laura, cliente</b>
                  Me encanta, pero cambiemos «este viernes» por «desde el 16».
                </p>
                <p className="bubble bubble--team">
                  <b>Tu equipo</b>
                  Hecho. ¿La apruebas así?
                </p>
                <p className="thread-approved">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m4 10.5 4 4 8-9" />
                  </svg>
                  Laura aprobó la publicación
                </p>
              </div>
            </div>
          </article>

          <article className="feature">
            <div className="feature-text">
              <h2>El reporte, listo para enviar</h2>
              <p>
                Reúne los datos de las redes y los anuncios de cada cliente en un reporte mensual, sin pasar la tarde en una hoja de cálculo.
              </p>
              <p className="planned planned--live">Disponible en la demo</p>
            </div>
            <div className="feature-visual feature-visual--coral">
              <div className="report">
                <p>
                  Alcance por red <span>Datos de ejemplo</span>
                </p>
                <ul>
                  {REPORT.map((row) => (
                    <li key={row.label}>
                      <span>{row.label}</span>
                      <i style={{ width: `${row.value}%` }} />
                      <b>{row.value} mil</b>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="feature feature--flip">
            <div className="feature-text">
              <h2>Los anuncios de cada cliente, juntos</h2>
              <p>
                Consulta el gasto y los resultados de cada plataforma en un mismo panel, sin entrar a una cuenta distinta por cliente.
              </p>
              <p className="planned">Función prevista</p>
            </div>
            <div className="feature-visual feature-visual--ink">
              <div className="ads">
                <p>
                  Norte Bici · Octubre <span>Datos de ejemplo</span>
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Plataforma</th>
                      <th scope="col">Gasto</th>
                      <th scope="col">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADS.map((row) => (
                      <tr key={row.platform}>
                        <th scope="row">{row.platform}</th>
                        <td>{row.spend}</td>
                        <td>{row.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>

          <article className="feature">
            <div className="feature-text">
              <h2>Textos con la voz de cada marca</h2>
              <p>
                Un asistente con IA que aprende cómo habla cada cliente y respeta sus reglas, para que el primer borrador no empiece en blanco.
              </p>
              <p className="planned">Función prevista</p>
            </div>
            <div className="feature-visual feature-visual--green">
              <div className="voice">
                <p className="voice-rule">
                  Regla de Café Lunar: <s>«imperdible»</s> no se usa
                </p>
                <p className="voice-draft">Tu lunes merece una taza hecha con calma. ¿Empezamos?</p>
              </div>
            </div>
          </article>
        </section>

        <section className="roles" aria-labelledby="roles-title">
          <h2 id="roles-title">Pensado para todo el equipo, y también para el cliente</h2>
          <RoleTabs />
        </section>

        <section className="compare" aria-labelledby="compare-title">
          <h2 id="compare-title">El mismo mes, con menos vueltas</h2>
          <div className="compare-table">
            <table>
              <thead>
                <tr>
                  <td />
                  <th scope="col">Hoy</th>
                  <th scope="col">Con Hubly</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.task}>
                    <th scope="row">{row.task}</th>
                    <td>{row.today}</td>
                    <td>{row.hubly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ideas" aria-labelledby="ideas-title">
          <h2 id="ideas-title">Ideas sobre la mesa</h2>
          <p className="section-lead">Todavía no son promesas. Dinos cuáles te harían falta y cuáles faltan en la lista.</p>
          <ul>
            {IDEAS.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
          <a href={NEW_ISSUE_URL} className="text-link">
            Proponer una idea
          </a>
        </section>

        <section className="open" id="abierto">
          <div className="open-inner">
            <h2>Tu herramienta, tus datos, tu servidor</h2>
            <dl>
              <div>
                <dt>Alójalo donde quieras</dt>
                <dd>La información de tus clientes se queda en la infraestructura que tú elijas.</dd>
              </div>
              <div>
                <dt>Sin licencia por marca</dt>
                <dd>Si lo alojas tú, crecer en clientes o en equipo no añade cobros de licencia.</dd>
              </div>
              <div>
                <dt>Código a la vista</dt>
                <dd>Publicado con licencia AGPL-3.0, para revisarlo, adaptarlo y mejorarlo entre todos.</dd>
              </div>
            </dl>
            <a href={REPO_URL} className="button button--light">
              <GitHubIcon />
              Ver el repositorio
            </a>
          </div>
        </section>

        <section className="roadmap" aria-labelledby="roadmap-title">
          <h2 id="roadmap-title">Dónde estamos</h2>
          <p>Preferimos decirlo claro: la demo ya se puede recorrer, pero todavía no sirve para trabajar con clientes reales. El orden puede cambiar según lo que nos cuenten las agencias.</p>
          <ol>
            {ROADMAP.map((item) => (
              <li key={item.title} className={`roadmap-${item.state}`}>
                <span>{ROADMAP_LABEL[item.state]}</span>
                {item.title}
              </li>
            ))}
          </ol>
        </section>

        <section className="contribute" aria-labelledby="contribute-title">
          <h2 id="contribute-title">Constrúyelo con nosotros</h2>
          <ul>
            {CONTRIBUTE.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a href={item.href} className="text-link">
                  {item.link}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="faq" id="preguntas">
          <h2>Preguntas frecuentes</h2>
          <div>
            {FAQ.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="close">
          <h2>Entérate cuando esté listo</h2>
          <p>Solo te escribiremos para contarte novedades importantes de Hubly.</p>
          <WaitlistForm tone="dark" />
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <Logo height={52} />
          <p>Código abierto bajo licencia AGPL-3.0</p>
        </div>
        <nav aria-label="Producto">
          <h2>Producto</h2>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#funciones">Funciones</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <nav aria-label="Proyecto">
          <h2>Proyecto</h2>
          <a href={REPO_URL}>GitHub</a>
          <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>Cómo contribuir</a>
          <a href={`${REPO_URL}/blob/main/LICENSE`}>Licencia</a>
        </nav>
      </footer>
    </>
  );
}

import Link from "next/link";

const cards = [
  {
    title: "Écoute",
    desc: "Un espace pour s’informer et prendre contact",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-[#0b63ab]"
      >
        {/* Bulle de dialogue */}
        <path
          d="M12 14c0-3.3 3.6-6 8-6h8c4.4 0 8 2.7 8 6v8c0 3.3-3.6 6-8 6h-3.2L18 36v-6.2C14.4 29 12 26.6 12 22v-8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Ondes sonores — accent rouge */}
        <path
          className="about-icon-accent about-icon-waves"
          d="M36 16c1.6 1.4 2.6 3.4 2.6 5.6S37.6 25.8 36 27.2"
          stroke="#ce283c"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          className="about-icon-accent about-icon-waves"
          d="M39.5 13c2.4 2.1 3.9 5.1 3.9 8.6s-1.5 6.5-3.9 8.6"
          stroke="#ce283c"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          className="about-icon-accent about-icon-waves"
          d="M42.8 10c3.2 2.8 5.2 6.8 5.2 11.6s-2 8.8-5.2 11.6"
          stroke="#ce283c"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Entraide",
    desc: "Des initiatives au service des étudiants",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-[#0b63ab]"
      >
        {/* Mains qui se rejoignent */}
        <path
          d="M10 28c2-4 6-7 10-7 2.5 0 4.5 1 6 2.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M38 28c-2-4-6-7-10-7-2.5 0-4.5 1-6 2.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 30c1.5 3 4.5 5 8 5h4c3.5 0 6.5-2 8-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 22c0-2 1.5-3.5 3.5-3.5S25 20 25 22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M30 22c0-2-1.5-3.5-3.5-3.5S23 20 23 22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Cœur rouge */}
        <path
          className="about-icon-accent about-icon-heart"
          d="M24 12.5c1.2-2.2 4-2.8 5.6-1.2 1.4 1.4 1.3 3.6-.2 5L24 21l-5.4-4.7c-1.5-1.4-1.6-3.6-.2-5 1.6-1.6 4.4-1 5.6 1.2z"
          stroke="#ce283c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Clarté",
    desc: "Des informations faciles à retrouver",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-[#0b63ab]"
      >
        {/* Feuille */}
        <path
          d="M12 8h16l8 8v22a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 8v8h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Lignes de texte */}
        <path d="M15 22h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Ligne mise en valeur — rouge */}
        <path
          className="about-icon-accent about-icon-line"
          d="M15 27h12"
          stroke="#ce283c"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M15 32h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Loupe */}
        <circle
          cx="32"
          cy="30"
          r="6"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M36.5 34.5 42 40"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Participation",
    desc: "Des services conçus pour la communauté",
    icon: (
      <svg
        width="30"
        height="30"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-[#0b63ab]"
      >
        {/* Silhouette gauche */}
        <circle cx="12" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6 34c0-4.5 2.7-8 6-8s6 3.5 6 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Silhouette droite */}
        <circle cx="36" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M30 34c0-4.5 2.7-8 6-8s6 3.5 6 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Silhouette centre (plus grande) */}
        <circle cx="24" cy="14" r="5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16 36c0-5 3.6-9 8-9s8 4 8 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Bras + main levée — accent rouge */}
        <path
          className="about-icon-accent about-icon-hand"
          d="M28 22c1.5-1 3-3.5 3-6.5V10"
          stroke="#ce283c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="about-icon-accent about-icon-hand"
          d="M29.5 10c0-1.2.9-2 2-2s2 .8 2 2-.9 2-2 2"
          stroke="#ce283c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;

export function AboutTeaser() {
  return (
    <section className="section bg-background">
      <div className="container-main">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-istin-blue">
              La mutuelle
            </p>
            <h2 className="mb-4 font-heading text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              Une communauté étudiante à construire ensemble
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              La plateforme rassemble les actualités, l’agenda, les informations utiles et
              l’accès réservé aux étudiants.
            </p>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Les contenus publiés sont ajoutés et mis à jour par l’administration de la
              mutuelle.
            </p>
            <Link
              href="/a-propos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-istin-blue transition-colors hover:text-istin-blue-dark"
            >
              En savoir plus sur la mutuelle{" "}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((item) => (
              <div
                key={item.title}
                tabIndex={0}
                className="about-value-card group rounded-lg border border-border bg-muted/50 p-6 outline-none transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,99,171,0.12)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_8px_24px_rgba(11,99,171,0.12)] focus-visible:ring-2 focus-visible:ring-istin-blue/40"
              >
                <div className="mb-3 flex h-[54px] w-[54px] items-center justify-center rounded-md bg-istin-blue/10 text-istin-blue">
                  {item.icon}
                </div>
                <h3 className="mb-1 font-heading font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

const BLUE = "currentColor";
const RED = "#ce283c";

/* Pictos dessinés sur mesure pour ISTIN MUTUELLE : trait bleu (currentColor) + un détail rouge animé au survol. */
function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className="text-[#0b63ab]"
    >
      {children}
    </svg>
  );
}

/** Écoute : bulle de message et ondes sonores */
function IconEcoute() {
  return (
    <IconFrame>
      <g stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 8h14a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7H19l-7.5 6.5V28A7 7 0 0 1 4 21v-6a7 7 0 0 1 7-7z" />
        <path d="M11.5 15h13M11.5 21h8" strokeWidth="2" />
      </g>
      <g className="about-icon-accent about-icon-waves" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35.6 14.6a6.2 6.2 0 0 1 0 8.8" />
        <path d="M40 11a11.4 11.4 0 0 1 0 16" />
      </g>
    </IconFrame>
  );
}

/** Entraide : une main qui offre un cœur */
function IconEntraide() {
  return (
    <IconFrame>
      <g stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 29h6v12H4z" />
        <path d="M10 33.2h12.5a3.4 3.4 0 0 1 0 6.8H10" />
        <path d="M20 33.2l9.6-6.2a3 3 0 0 1 3.4 4.9L25 37.6" />
      </g>
      <g className="about-icon-accent about-icon-heart" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24.5 22.5 17 15.2a4.9 4.9 0 0 1 6.9-6.9l.6.6.6-.6a4.9 4.9 0 0 1 6.9 6.9z" />
      </g>
    </IconFrame>
  );
}

/** Clarté : un document, une ligne mise en valeur et une loupe */
function IconClarte() {
  return (
    <IconFrame>
      <g stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6h13l8 8v8" />
        <path d="M9 6a2 2 0 0 0-2 2v30a2 2 0 0 0 2 2h9" />
        <path d="M22 6v8h8" />
        <path d="M12.5 21h9M12.5 33h4" />
        <circle cx="31" cy="32" r="6.5" />
        <path d="M35.8 36.8 42 43" />
      </g>
      <g className="about-icon-accent about-icon-line" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.5 27h11" />
      </g>
    </IconFrame>
  );
}

/** Participation : une communauté, une personne mise en avant */
function IconParticipation() {
  return (
    <IconFrame>
      <g stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="24" r="3.3" />
        <path d="M2.5 38.5c0-3.8 2.2-6.5 5-6.5s5 2.7 5 6.5" />
        <circle cx="40.5" cy="24" r="3.3" />
        <path d="M35.5 38.5c0-3.8 2.2-6.5 5-6.5s5 2.7 5 6.5" />
      </g>
      <g className="about-icon-accent about-icon-hand" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="24" cy="17" r="5.2" />
        <path d="M15 40c0-6.5 4-11 9-11s9 4.5 9 11" />
      </g>
    </IconFrame>
  );
}

const cards = [
  { title: "Écoute", desc: "Un espace pour s’informer et prendre contact", icon: <IconEcoute /> },
  { title: "Entraide", desc: "Des initiatives au service des étudiants", icon: <IconEntraide /> },
  { title: "Clarté", desc: "Des informations faciles à retrouver", icon: <IconClarte /> },
  { title: "Participation", desc: "Des services conçus pour la communauté", icon: <IconParticipation /> },
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

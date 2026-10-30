"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const TITLE = "MUTUELLE";

export function Hero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReady(true);
      return;
    }
    const frame = requestAnimationFrame(() => setReady(true));
    // Filet de sécurité iOS : afficher le texte même si l’animation échoue
    const fallback = window.setTimeout(() => setReady(true), 400);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section
      aria-label="Présentation de la Mutuelle ISTIN"
      className="istin-hero relative flex items-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/pro/hero-1.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="istin-hero-shade absolute inset-0" />
      </div>

      <div className="istin-hero-content container-main relative z-10">
        <div className="max-w-xl lg:max-w-2xl">
          <p
            className={
              "mb-4 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-normal text-white/80 sm:mb-5 sm:text-xs " +
              (ready ? "hero-fade" : "hero-pending")
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ce283c]" />
            ISTIN · Libreville
          </p>

          <h1 className="mb-2 leading-none">
            <span className="block" aria-label="Mutuelle">
              {TITLE.split("").map((letter, index) => (
                <span
                  key={index}
                  className={"h-letter " + (ready ? "drop" : "")}
                  style={{ ["--i" as string]: index }}
                >
                  {letter}
                </span>
              ))}
            </span>
            <span className={"hero-red-line " + (ready ? "draw" : "")} aria-hidden />
          </h1>

          <p
            className={
              "mb-3 font-heading text-[1.35rem] font-black leading-tight text-white sm:mb-4 sm:text-[1.85rem] lg:text-[2.35rem] " +
              (ready ? "hero-fade hero-fade-d1" : "hero-pending")
            }
          >
            La vie étudiante, <span className="text-[#ce283c]">ensemble.</span>
          </p>

          <p
            className={
              "mb-7 max-w-lg text-[0.95rem] leading-relaxed text-white/85 sm:mb-8 sm:text-base lg:text-lg " +
              (ready ? "hero-fade hero-fade-d2" : "hero-pending")
            }
          >
            Retrouve les actualités, les événements et les informations de la Mutuelle ISTIN.
          </p>

          <div
            className={
              "flex flex-col gap-3 sm:flex-row " +
              (ready ? "hero-fade hero-fade-d3" : "hero-pending")
            }
          >
            <Link href="/evenements" className="btn btn-primary justify-center">
              Découvrir les événements
            </Link>
            <Link href="/espace" className="btn btn-outline-light justify-center">
              Espace étudiant
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-normal text-white/50 sm:flex">
        <span>Défiler</span>
        <span className="h-6 w-px bg-white/40" />
      </div>
    </section>
  );
}

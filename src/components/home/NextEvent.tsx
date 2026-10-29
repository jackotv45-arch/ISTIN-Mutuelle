"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlatform } from "@/lib/platform-store";

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const diff = now === null ? 0 : Math.max(0, Date.parse(target) - now);
  return { days: Math.floor(diff / 86400000), hours: Math.floor((diff / 3600000) % 24), minutes: Math.floor((diff / 60000) % 60), seconds: Math.floor((diff / 1000) % 60) };
}

export function NextEvent() {
  const { events, eventConnection, eventError } = usePlatform();
  const next = [...events].filter((event) => event.published !== false && event.statusLabel !== "ANNULÉ" && Date.parse(event.startAt) > Date.now()).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];
  const time = useCountdown(next?.startAt ?? new Date().toISOString());
  if (!next) return <section className="section bg-muted/50"><div className="container-main"><div className="agenda-empty mx-auto max-w-2xl py-4 text-center"><p className="text-sm font-semibold uppercase tracking-normal text-istin-red">Agenda ISTIN MUTUELLE</p><h2 className="mt-2 font-heading text-2xl font-bold text-foreground">Prochain rendez-vous</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{eventConnection === "loading" ? "Chargement des événements publiés…" : eventConnection === "error" ? eventError : "Aucun événement publié à venir pour le moment."}</p><Link href="/evenements" className="btn btn-outline mt-6 justify-center">Voir l’agenda</Link></div></div></section>;
  return <section className="section bg-muted/50"><div className="container-main"><div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-lg ring-1 ring-border"><Image src={next.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" /><div className="absolute inset-0 bg-gradient-to-t from-istin-blue-deeper/50 to-transparent" /><span className="absolute left-5 top-5 rounded-full bg-[#ce283c] px-3 py-1 text-[0.7rem] font-bold tracking-normal text-white">{next.statusLabel}</span></div>
    <div><p className="mb-2 text-sm font-semibold uppercase tracking-normal text-istin-red">Agenda de la mutuelle</p><h2 className="mb-3 font-heading text-3xl font-bold tracking-normal text-foreground sm:text-4xl">{next.title}</h2><p className="mb-5 max-w-md leading-relaxed text-muted-foreground">{next.description}</p><p className="mb-3 text-xs text-muted-foreground">Compte à rebours · {next.dateLabel}</p>
      <div className="mb-5 grid grid-cols-4 gap-3">{[{ label: "Jours", value: time.days }, { label: "Heures", value: time.hours }, { label: "Min", value: time.minutes }, { label: "Sec", value: time.seconds }].map((item) => <div key={item.label} className="rounded-lg border border-border bg-card px-3 py-3.5 text-center shadow-sm"><p className="font-heading text-2xl font-bold tabular-nums text-istin-blue-dark sm:text-3xl">{String(item.value).padStart(2, "0")}</p><p className="mt-0.5 text-[11px] uppercase tracking-normal text-muted-foreground">{item.label}</p></div>)}</div>
      <p className="mb-5 text-xs text-muted-foreground">{next.location} · modalités d’inscription à venir</p><Link href={"/evenements/" + next.slug} className="btn btn-outline justify-center">Détails de l’événement</Link>
    </div>
  </div></div></section>;
}

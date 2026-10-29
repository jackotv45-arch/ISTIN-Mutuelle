"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Countdown } from "@/components/ui/Countdown";
import { usePlatform } from "@/lib/platform-store";

export default function EvenementsPage() {
  const { events, eventConnection, eventError } = usePlatform();
  const [filter, setFilter] = useState("Tous");
  const options = ["Tous", "À venir"];
  const publicEvents = events.filter((event) => event.published !== false);
  const visible = publicEvents.filter((event) => filter === "Tous" || new Date(event.startAt).getTime() > Date.now());
  const next = [...publicEvents].filter((event) => Date.parse(event.startAt) > Date.now()).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];
  return <><Header /><main className="flex-1 pt-36 pb-16"><div className="container-main">
    <div className="mb-9"><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-istin-blue">Agenda</p><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Événements</h1><p className="mt-2 max-w-xl text-muted-foreground">Événements publiés par la Mutuelle ISTIN.</p></div>
    {eventConnection === "error" && <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{eventError}</p>}
    {next && <section className="mb-8 grid gap-5 rounded-2xl bg-istin-blue-deeper p-6 text-white md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-white/60">Prochain rendez-vous</p><h2 className="mt-1 font-heading text-xl font-bold">{next.title}</h2><p className="mt-1 text-sm text-white/70">{next.dateLabel}</p></div><Countdown targetIso={next.startAt} /></section>}
    <div className="mb-6 flex flex-wrap gap-2">{options.map((item) => <button key={item} onClick={() => setFilter(item)} type="button" className={"rounded-full px-4 py-2 text-sm font-medium " + (filter === item ? "bg-istin-blue text-white" : "bg-muted text-muted-foreground")}>{item}</button>)}</div>
    <div className="space-y-5">{visible.map((event) => <Link key={event.slug} href={"/evenements/" + event.slug} className="group card-lift flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:flex-row">
      <div className="relative h-48 shrink-0 overflow-hidden bg-muted sm:w-64 sm:h-auto lg:w-80"><Image src={event.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 320px" /></div>
      <div className="flex flex-1 flex-col justify-center p-6"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-istin-red/10 px-2.5 py-1 text-[10px] font-bold uppercase text-istin-red">{event.statusLabel}</span></div><h2 className="mb-2 font-heading text-xl font-semibold text-foreground transition-colors group-hover:text-istin-blue">{event.title}</h2><p className="mb-3 text-sm text-muted-foreground">{event.description}</p><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span>◷ {event.dateLabel}</span><span>⌖ {event.location}</span></div><span className="mt-4 text-xs font-semibold text-istin-blue">Voir la fiche →</span></div>
    </Link>)}
    {!visible.length && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{eventConnection === "loading" ? "Chargement des événements…" : eventConnection === "error" ? "Les événements ne peuvent pas être chargés pour le moment." : "Aucun événement publié pour ce filtre."}</div>}</div>
  </div></main><Footer /></>;
}

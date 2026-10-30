"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Countdown } from "@/components/ui/Countdown";
import { EventSignup } from "@/components/ui/EventSignup";
import { usePlatform } from "@/lib/platform-store";

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const { events, eventConnection, eventError } = usePlatform();
  const event = events.find((item) => item.slug === params.slug && item.published !== false);
  return <><Header /><main className="flex-1 pt-36 pb-16"><div className="container-main max-w-4xl">
    <Link href="/evenements" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-istin-blue">← Tous les événements</Link>
    {!event ? <div className="rounded-2xl border border-border bg-white p-7"><h1 className="font-heading text-xl font-bold">Événement indisponible</h1><p className="mt-2 text-sm text-muted-foreground">{eventConnection === "error" ? eventError : eventConnection === "loading" ? "Chargement de l’événement…" : "Cet événement n’existe pas ou n’est pas publié."}</p></div> : <>
      <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl bg-muted shadow-lg"><Image src={event.image} alt="" fill className="object-cover" sizes="(max-width: 896px) 100vw, 896px" priority /><div className="absolute inset-0 bg-gradient-to-t from-istin-blue-deeper/80 to-transparent" /><div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6"><span className="mb-2 inline-block rounded-full bg-istin-red px-3 py-1 text-[10px] font-bold uppercase text-white">{event.statusLabel}</span><h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">{event.title}</h1></div></div>
      <div className="grid gap-8 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2"><p className="text-lg leading-relaxed text-muted-foreground">{event.description}</p><div className="whitespace-pre-line leading-relaxed text-muted-foreground">{event.content}</div><div className="rounded-2xl border border-border bg-muted/40 p-5"><h2 className="mb-3 font-heading font-semibold">Informations pratiques</h2>{event.practicalInfo.length ? <ul className="space-y-2 text-sm text-muted-foreground">{event.practicalInfo.map((info) => <li key={info}>• {info}</li>)}</ul> : <p className="text-sm text-muted-foreground">Aucune information pratique communiquée.</p>}</div></div>
        <aside><div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-36"><p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Compte à rebours</p><Countdown targetIso={event.startAt} /><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-2"><span className="text-muted-foreground">Date</span><span className="text-right font-medium">{event.dateLabel}</span></div><div className="flex justify-between gap-2"><span className="text-muted-foreground">Lieu</span><span className="text-right font-medium">{event.location}</span></div><div className="flex justify-between gap-2"><span className="text-muted-foreground">Responsable</span><span className="text-right font-medium">{event.organizer}</span></div></div><EventSignup eventId={event.id} eventSlug={event.slug} enabled={event.registrationEnabled && event.statusLabel === "À VENIR"} /></div></aside>
      </div>
    </>}
  </div></main><Footer /></>;
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePlatform } from "@/lib/platform-store";

export default function ActualitesPage() {
  const { articles, newsConnection, newsError } = usePlatform();
  const published = useMemo(() => articles.filter((item) => item.published !== false), [articles]);
  const [category, setCategory] = useState("Toutes");
  const [query, setQuery] = useState("");
  const categories = ["Toutes", ...Array.from(new Set(published.map((item) => item.category)))];
  const visible = useMemo(() => published.filter((item) =>
    (category === "Toutes" || item.category === category) &&
    (item.title + " " + item.excerpt).toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))
  ), [published, category, query]);
  return <><Header /><main className="flex-1 pt-36 pb-16"><div className="container-main">
    <div className="mb-9"><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-istin-blue">Information</p><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Actualités & annonces</h1><p className="mt-2 max-w-xl text-muted-foreground">Publications de la Mutuelle ISTIN.</p></div>
    <label className="sr-only" htmlFor="news-search">Rechercher une actualité</label><input id="news-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une actualité…" className="mb-5 w-full max-w-md rounded-xl border border-border bg-white px-4 py-3 text-sm" />
    <div className="mb-8 flex flex-wrap gap-2">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={"rounded-full px-4 py-2 text-sm font-medium transition-colors " + (category === item ? "bg-istin-blue text-white" : "bg-muted text-muted-foreground hover:bg-slate-200")}>{item}</button>)}</div>
    {newsConnection === "error" && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{newsError}</p>}
    {visible.length ? <div className="grid gap-6 md:grid-cols-2">{visible.map((item) => <Link key={item.slug} href={"/actualites/" + item.slug} className="group card-lift flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:flex-row">
      <div className="relative h-44 shrink-0 overflow-hidden bg-muted sm:w-48 sm:h-auto"><Image src={item.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 200px" unoptimized={item.image.startsWith("data:")} /></div>
      <div className="flex flex-col justify-center p-5"><div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-istin-red/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-istin-red">{item.category}</span><span className="text-xs text-muted-foreground">{item.date}</span></div><h2 className="mb-1.5 font-heading text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-istin-blue">{item.title}</h2><p className="line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p><span className="mt-3 text-xs font-semibold text-istin-blue">Lire la suite →</span></div>
    </Link>)}</div> : <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{newsConnection === "loading" ? "Chargement des actualités…" : newsConnection === "error" ? "Les actualités ne peuvent pas être chargées pour le moment." : query || category !== "Toutes" ? "Aucune actualité ne correspond à cette recherche." : "Aucune actualité publiée pour le moment."}</div>}
  </div></main><Footer /></>;
}

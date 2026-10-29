"use client";

import Link from "next/link";
import Image from "next/image";
import { usePlatform } from "@/lib/platform-store";

export function LatestNews() {
  const { articles, newsConnection, newsError } = usePlatform();
  const items = articles.filter((item) => item.published !== false).slice(0, 3);
  return <section className="section bg-background"><div className="container-main">
    <div className="section-header"><span className="section-badge">Information</span><h2>Dernières actualités</h2><p className="section-subtitle">Annonces et publications de la Mutuelle ISTIN.</p></div>
    {items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{newsConnection === "loading" ? "Chargement des actualités…" : newsConnection === "error" ? newsError : "Aucune actualité publiée pour le moment."}</p>}
    <div className="grid gap-6 md:grid-cols-3">{items.map((item) => <Link key={item.slug} href={"/actualites/" + item.slug} className="group card-lift news-card overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-[16/9] overflow-hidden bg-istin-blue-dark"><Image src={item.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" /><span className="absolute left-4 top-4 rounded-md bg-istin-red px-3 py-1 text-[0.75rem] font-bold uppercase tracking-normal text-background">{item.category}</span></div>
      <div className="flex flex-1 flex-col p-6"><p className="mb-2 text-[0.8rem] text-muted-foreground">{item.date}</p><h3 className="mb-2 line-clamp-2 font-heading text-[1.05rem] font-bold leading-snug text-foreground transition-colors group-hover:text-istin-blue">{item.title}</h3><p className="line-clamp-3 text-[0.875rem] leading-relaxed text-muted-foreground">{item.excerpt}</p><span className="mt-auto inline-flex pt-5 items-center gap-1 text-sm font-semibold text-istin-blue">Lire la suite →</span></div>
    </Link>)}</div>
    <div className="mt-10 text-center"><Link href="/actualites" className="btn btn-outline">Toutes les actualités</Link></div>
  </div></section>;
}

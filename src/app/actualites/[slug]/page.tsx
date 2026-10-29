"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePlatform } from "@/lib/platform-store";

export default function AnnouncementDetailPage() {
  const params = useParams<{ slug: string }>();
  const { articles, newsConnection } = usePlatform();
  const article = articles.find((item) => item.slug === params.slug);
  return <><Header /><main className="flex-1 pt-36 pb-16"><article className="container-main max-w-3xl">
    <Link href="/actualites" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-istin-blue">← Toutes les actualités</Link>
    {!article || article.published === false ? <div className="rounded-2xl border border-border bg-white p-7"><h1 className="font-heading text-xl font-bold">Publication indisponible</h1><p className="mt-2 text-sm text-muted-foreground">{newsConnection === "loading" ? "Chargement de la publication…" : "Cette actualité n’existe pas ou n’est pas publiée."}</p></div> : <>
      <div className="mb-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-istin-red/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-istin-red">{article.category}</span><span className="text-sm text-muted-foreground">{article.date}</span><span className="text-sm text-muted-foreground">· {article.author}</span></div>
      <h1 className="mb-6 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
      <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-2xl bg-muted shadow-md"><Image src={article.image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority /></div>
      <div className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground sm:text-base">{article.content}</div>
    </>}
  </article></main><Footer /></>;
}

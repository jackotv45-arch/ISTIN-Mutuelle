import Link from "next/link";
import Image from "next/image";
import { getEditableSection } from "@/lib/site-settings";

export async function GalleryPreview() {
  const section = await getEditableSection("medias");
  const photos = section.items.filter((item) => item.image).slice(0, 4);
  return <section className="section bg-background"><div className="container-main">
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-istin-blue">Vie étudiante</p><h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Galerie photos</h2></div><Link href="/galerie" className="text-sm font-semibold text-istin-blue hover:text-istin-blue-dark">Toutes les photos →</Link></div>
    {photos.length ? <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{photos.map((photo) => <Link key={photo.id} href="/galerie" aria-label={photo.title} className="group relative aspect-square overflow-hidden rounded-xl bg-muted"><Image src={photo.image!} alt={photo.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 25vw" /><div className="absolute inset-0 bg-istin-blue-deeper/0 transition-colors group-hover:bg-istin-blue-deeper/20" /></Link>)}</div> : <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">Aucune photo publiée pour le moment.</p>}
  </div></section>;
}
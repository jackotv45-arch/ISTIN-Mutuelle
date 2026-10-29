import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getEditableSection } from "@/lib/site-settings";

export const metadata = {
  title: "Galerie",
  description: "Photos de la vie étudiante et des activités de la Mutuelle ISTIN.",
};

export default async function GaleriePage() {
  const section = await getEditableSection("medias");
  const photos = section.items.filter((photo) => photo.image);

  return (
    <>
      <Header />
      <main className="page-enter flex-1 pt-36 pb-16">
        <div className="container-main">
          <div className="mb-9">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-istin-blue">
              Vie étudiante
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Galerie photos
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{section.intro}</p>
          </div>

          {photos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  <Image
                    src={photo.image!}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-9 text-sm font-semibold text-white">
                    {photo.title}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-istin-blue/10 text-istin-blue">
                <svg
                  aria-hidden="true"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="1.5" />
                  <path d="M14 15l-2.5-3-4.5 5h12l-3-4z" />
                </svg>
              </div>
              <h2 className="mt-4 font-heading text-xl font-bold">Aucune photo publiée</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Les photos de la communauté et des activités apparaîtront ici dès qu’elles auront
                été ajoutées par l’administration.
              </p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getEditableSection } from "@/lib/site-settings";
import Link from "next/link";

export const metadata = {
  title: "Contact",
  description: "Contacter la Mutuelle ISTIN.",
};

export default async function ContactPage() {
  const section = await getEditableSection("parametres");
  const contactItems = section.items.filter(
    (item) =>
      item.value.trim() !== "" &&
      ["contact-email", "contact-phone", "contact-address", "contact-hours"].includes(item.id)
  );
  const hasContact = contactItems.length > 0;

  return (
    <>
      <Header />
      <main className="flex-1 pt-36 pb-16">
        <div className="container-main max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-istin-blue">
            Mutuelle ISTIN
          </p>
          <h1 className="mb-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Contact
          </h1>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Les moyens de contact officiels de la mutuelle seront affichés ici dès qu’ils auront été
            validés et publiés par les responsables.
          </p>

          {hasContact ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {contactItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">
                    {item.title}
                  </p>
                  <p className="mt-2 font-heading text-lg font-semibold text-foreground">
                    {item.value}
                  </p>
                  {item.details && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.details}</p>
                  )}
                </article>
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
                  <path d="M4 6h16v12H4z" />
                  <path d="M4 8l8 5 8-5" />
                </svg>
              </div>
              <h2 className="mt-4 font-heading text-xl font-bold">
                Aucune coordonnée publiée
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Les responsables peuvent renseigner l’adresse e-mail, le téléphone et les horaires
                depuis l’administration (rubrique Paramètres). Ces informations apparaîtront
                automatiquement ici.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/a-propos" className="btn btn-outline">
                  À propos de la mutuelle
                </Link>
                <Link href="/bureau" className="btn btn-primary">
                  Voir le bureau
                </Link>
              </div>
            </section>
          )}

          <p className="mt-10 text-center text-sm text-muted-foreground">
            En attendant, les étudiants peuvent s’adresser aux représentants de la mutuelle au sein
            de l’ISTIN.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}


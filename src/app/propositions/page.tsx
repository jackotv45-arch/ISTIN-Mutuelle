import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Propositions",
  description: "Propositions étudiantes publiées par la Mutuelle ISTIN.",
};

export default async function PublicProposalsPage() {
  const supabase = await createSupabaseServerClient();
  let items: Array<{
    id: string;
    title: string;
    category: string | null;
    body: string;
    status: string;
    created_at: string;
  }> = [];

  if (supabase) {
    const { data } = await supabase
      .from("suggestions")
      .select("id,title,category,body,status,created_at")
      .eq("is_public", true)
      .in("status", ["accepted", "done", "reviewing"])
      .order("created_at", { ascending: false })
      .limit(50);
    items = data ?? [];
  }

  return (
    <>
      <Header />
      <main className="page-enter flex-1 pt-36 pb-16">
        <div className="container-main max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-wider text-istin-red">
            Participation étudiante
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Propositions publiques
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Seules les propositions validées et autorisées à être publiées apparaissent ici. Pour
            déposer une idée, connecte-toi à l’espace étudiant.
          </p>

          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-[#1c2733]">{item.title}</h2>
                  {item.category && (
                    <span className="rounded-full bg-istin-blue/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-istin-blue">
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("fr-FR")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </article>
            ))}
            {!items.length && (
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-10 text-center shadow-sm">
                <h2 className="font-heading text-xl font-bold">Aucune proposition publiée</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Les propositions validées par le bureau apparaîtront ici. Les étudiants peuvent
                  déposer les leurs depuis leur espace personnel.
                </p>
                <Link href="/espace/propositions" className="btn btn-primary mt-5">
                  Déposer une proposition
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

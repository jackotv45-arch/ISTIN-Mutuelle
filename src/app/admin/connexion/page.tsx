import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f8fb] px-4 py-10">
        <section className="max-w-lg rounded-3xl border border-border bg-white p-8 shadow-xl">
          <h1 className="font-heading text-2xl font-bold">Supabase non configuré</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Ajoute l’URL du projet et la clé publishable dans .env.local, puis redémarre le serveur.
          </p>
          <a href="/" className="mt-5 inline-flex text-sm font-semibold text-istin-blue hover:underline">← Retour au site</a>
        </section>
      </main>
    );
  }

  return <AdminLoginForm accessDenied={params.reason === "access"} />;
}

import Link from "next/link";
import { AdminSignupForm } from "@/components/admin/AdminSignupForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { IstinLogo } from "@/components/ui/IstinLogo";

export default function AdminInscriptionPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f8fb] px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex justify-center">
            <IstinLogo className="h-12" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-istin-blue">
            ISTIN MUTUELLE
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold">Inscription administrateur</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Un code d’invitation fourni par un administrateur est obligatoire.
          </p>
        </div>
        {isSupabaseConfigured() ? (
          <AdminSignupForm />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            La création de compte n’est pas configurée pour le moment.
          </div>
        )}
        <p className="mt-5 text-center text-sm">
          <Link href="/admin/connexion" className="font-semibold text-istin-blue hover:underline">
            ← Retour à la connexion admin
          </Link>
        </p>
      </section>
    </main>
  );
}

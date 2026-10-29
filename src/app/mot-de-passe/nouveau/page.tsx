import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PasswordUpdateForm } from "@/components/student/PasswordUpdateForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function PasswordUpdatePage() {
  return <><Header /><main className="page-enter flex-1 pt-36 pb-16"><div className="container-main max-w-lg">
    <div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-wider text-istin-red">Espace étudiant</p><h1 className="mt-2 font-heading text-3xl font-bold">Choisir un nouveau mot de passe</h1></div>
    {isSupabaseConfigured() ? <PasswordUpdateForm /> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">La connexion à la base de données n’est pas configurée.</p>}
  </div></main><Footer /></>;
}

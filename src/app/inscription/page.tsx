import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StudentSignupForm } from "@/components/student/StudentSignupForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function InscriptionPage() {
  return <>
    <Header />
    <main className="flex-1 pt-36 pb-16"><div className="container-main max-w-lg">
      <div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-wider text-istin-red">Accès étudiant</p><h1 className="mt-2 font-heading text-3xl font-bold">Créer un compte</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Une invitation fournie par la mutuelle est nécessaire. Chaque étudiant crée son propre compte.</p></div>
      {isSupabaseConfigured() ? <StudentSignupForm /> : <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">La création de compte n’est pas configurée. Contacte l’administration de la mutuelle.</div>}
      <Link href="/connexion" className="mt-5 block text-center text-sm font-semibold text-istin-blue hover:underline">← Retour à la connexion</Link>
    </div></main>
    <Footer />
  </>;
}
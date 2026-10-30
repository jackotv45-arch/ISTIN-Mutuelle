import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StudentLoginForm } from "@/components/student/StudentLoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = { searchParams: Promise<{ reason?: string; next?: string }> };

export default async function ConnexionPage({ searchParams }: Props) {
  const { reason, next } = await searchParams;
  return <>
    <Header />
    <main className="flex-1 pt-36 pb-16"><div className="container-main max-w-md">
      <div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-wider text-istin-red">Espace personnel</p><h1 className="mt-2 font-heading text-3xl font-bold">Connexion étudiant</h1><p className="mt-2 text-sm text-muted-foreground">Connecte-toi avec l’adresse e-mail et le mot de passe de ton compte.</p></div>
      {isSupabaseConfigured() ? <StudentLoginForm reason={reason} next={next} /> : <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">La connexion n’est pas encore configurée. Contacte l’administration de la mutuelle.</div>}
      <p className="mt-5 text-center text-sm text-muted-foreground">Pas encore de compte ? <Link href="/inscription" className="font-semibold text-istin-blue hover:underline">Créer un compte avec une invitation</Link></p>
    </div></main>
    <Footer />
  </>;
}

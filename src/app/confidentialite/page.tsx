import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export const metadata = { title: "Confidentialité" };
export default function ConfidentialitePage() {
  return <><Header /><main className="page-enter flex-1 pt-36 pb-16"><article className="container-main max-w-3xl">
    <p className="text-xs font-bold uppercase tracking-wider text-istin-red">Informations légales</p><h1 className="mt-2 font-heading text-3xl font-bold">Confidentialité</h1>
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Notice en cours de validation.</strong><p className="mt-1">Les responsables de la mutuelle doivent confirmer les coordonnées du responsable, les durées de conservation et les modalités d’exercice des droits avant l’ouverture générale du service.</p></div>
    <div className="mt-7 space-y-5 leading-relaxed text-muted-foreground"><section><h2 className="font-heading text-lg font-bold text-foreground">Compte étudiant</h2><p className="mt-2">La création d’un compte utilise une adresse e-mail, un nom fourni par l’étudiant et un mot de passe géré par le service d’authentification Supabase. Le code d’invitation sert à autoriser la création du compte et n’est pas un mot de passe.</p></section><section><h2 className="font-heading text-lg font-bold text-foreground">Demandes d’information</h2><p className="mt-2">Pour toute question relative à un compte, contacte les responsables de la Mutuelle ISTIN par les moyens habituels de l’établissement jusqu’à la publication d’une adresse de contact vérifiée sur ce site.</p></section></div>
    <Link href="/conditions" className="mt-8 inline-block text-sm font-semibold text-istin-blue hover:underline">Lire les conditions d’utilisation →</Link>
  </article></main><Footer /></>;
}

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export const metadata = { title: "Conditions d’utilisation" };
export default function ConditionsPage() {
  return <><Header /><main className="page-enter flex-1 pt-36 pb-16"><article className="container-main max-w-3xl">
    <p className="text-xs font-bold uppercase tracking-wider text-istin-red">Informations légales</p><h1 className="mt-2 font-heading text-3xl font-bold">Conditions d’utilisation</h1>
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Conditions en cours de validation.</strong><p className="mt-1">Les responsables de la mutuelle doivent confirmer les règles d’accès, de participation, de publication et de traitement des données avant l’ouverture générale du service.</p></div>
    <div className="mt-7 space-y-5 leading-relaxed text-muted-foreground"><section><h2 className="font-heading text-lg font-bold text-foreground">Accès étudiant</h2><p className="mt-2">La création d’un compte étudiant est réservée aux personnes disposant d’un code d’invitation actif. Chaque étudiant choisit son adresse e-mail et son mot de passe personnels.</p></section><section><h2 className="font-heading text-lg font-bold text-foreground">Publications</h2><p className="mt-2">Les actualités et événements sont publiés par les comptes autorisés de l’administration. Les informations doivent être vérifiées avant leur mise en ligne.</p></section></div>
    <Link href="/confidentialite" className="mt-8 inline-block text-sm font-semibold text-istin-blue hover:underline">Consulter les informations de confidentialité →</Link>
  </article></main><Footer /></>;
}

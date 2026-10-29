import Link from "next/link";
export function CtaJoin() {
  return <section className="section relative overflow-hidden bg-gradient-to-br from-[#0b63ab] via-[#083d6b] to-[#062a4a] text-white"><div className="container-main relative z-10 mx-auto max-w-2xl text-center">
    <h2 className="mb-4 font-heading text-3xl font-black tracking-tight sm:text-4xl">Accède à ton espace étudiant</h2><p className="mb-8 leading-relaxed text-white/75">Un code d’invitation fourni par la mutuelle est nécessaire pour créer ton compte personnel.</p>
    <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row"><Link href="/connexion" className="btn border-white bg-white !text-[#083d6b] hover:!bg-white/90">Se connecter</Link><Link href="/inscription" className="btn btn-outline-light">Créer un compte</Link></div>
  </div></section>;
}

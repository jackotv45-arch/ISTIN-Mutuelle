import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function CtaJoin() {
  let studentLoggedIn = false;
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "student")
        .limit(1);

      studentLoggedIn = Boolean(roles?.length);
    }
  }

  return <section className="section relative overflow-hidden bg-gradient-to-br from-[#0b63ab] via-[#083d6b] to-[#062a4a] text-white"><div className="container-main relative z-10 mx-auto max-w-2xl text-center">
    <h2 className="mb-4 font-heading text-3xl font-black tracking-tight sm:text-4xl">{studentLoggedIn ? "Retrouve ton espace étudiant" : "Accède à ton espace étudiant"}</h2>
    <p className="mb-8 leading-relaxed text-white/75">{studentLoggedIn ? "Consulte ton profil, tes notifications et les services de la mutuelle." : "Un code d’invitation fourni par la mutuelle est nécessaire pour créer ton compte personnel."}</p>
    {studentLoggedIn ? (
      <Link href="/espace" className="btn border-white bg-white !text-[#083d6b] hover:!bg-white/90">Ouvrir mon espace</Link>
    ) : (
      <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row"><Link href="/connexion" className="btn border-white bg-white !text-[#083d6b] hover:!bg-white/90">Se connecter</Link><Link href="/inscription" className="btn btn-outline-light">Créer un compte</Link></div>
    )}
  </div></section>;
}

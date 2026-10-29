"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function FooterStudentCta() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setLoggedIn(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "student")
        .limit(1);
      if (active) setLoggedIn(Boolean(roles?.length));
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void check();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loggedIn) {
    return (
      <>
        <p className="text-sm leading-relaxed text-white/65">
          Tu es connecté à ton espace étudiant. Accède à ton profil, tes propositions et les
          sondages ouverts.
        </p>
        <Link href="/espace" className="mt-4 inline-block text-sm font-semibold text-white hover:text-white/80">
          Mon espace →
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="text-sm leading-relaxed text-white/65">
        Connecte-toi avec ton compte personnel ou demande une invitation à l’administration de la
        mutuelle.
      </p>
      <Link href="/connexion" className="mt-4 inline-block text-sm font-semibold text-white hover:text-white/80">
        Connexion étudiant →
      </Link>
    </>
  );
}

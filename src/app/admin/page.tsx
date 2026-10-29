import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) return <AdminSetupNotice />;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <AdminSetupNotice />;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/admin/connexion");

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "superadmin"])
    .limit(1);

  if (roleError) return <AdminSetupNotice />;
  if (!roles?.length) redirect("/admin/connexion?reason=access");

  return <AdminDashboard adminEmail={user.email ?? undefined} />;
}

function AdminSetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f8fb] px-4 py-10">
      <section className="max-w-xl rounded-3xl border border-border bg-white p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Administration</p>
        <h1 className="mt-2 font-heading text-2xl font-bold">Espace réservé</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Cet espace est réservé à l’administration de la Mutuelle ISTIN.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/connexion" className="btn btn-primary">Aller à la connexion</Link>
          <Link href="/" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">Retour au site public</Link>
        </div>
      </section>
    </main>
  );
}

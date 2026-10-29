import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/connexion?reason=setup");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/connexion?reason=setup");

  const { data: { user }, error } = await supabase.auth.getUser();
  const userId = user?.id;
  if (error || !userId) redirect("/connexion");

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "student")
    .limit(1);

  if (roleError || !roles?.length) redirect("/connexion?reason=student");
  return children;
}

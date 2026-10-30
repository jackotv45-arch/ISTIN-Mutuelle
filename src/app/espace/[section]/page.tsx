import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StudentProfileForm } from "@/components/student/StudentProfileForm";
import { StudentProposalForm } from "@/components/student/StudentProposalForm";
import { StudentPollsPanel } from "@/components/student/StudentPollsPanel";
import { NotificationsPanel } from "@/components/student/NotificationsPanel";
import { EnablePushToggle } from "@/components/student/EnablePushToggle";
import { NotificationBell } from "@/components/student/NotificationBell";
import { StudentTicketForm } from "@/components/student/StudentTicketForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const titles: Record<string, string> = {
  profil: "Mon profil",
  inscriptions: "Mes inscriptions",
  billets: "Mes billets",
  propositions: "Mes propositions",
  sondages: "Sondages et votes",
  notifications: "Notifications",
  demandes: "Demandes au bureau",
};

export default async function EspaceSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const title = titles[section];
  if (!title) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  let proposals: Array<{
    id: string;
    title: string;
    category: string | null;
    body: string;
    status: string;
    is_anonymous: boolean;
    is_public: boolean;
    created_at: string;
  }> = [];

  let registeredEvents: Array<{
    id: string;
    slug: string;
    title: string;
    starts_at: string;
    location: string | null;
    registered_at: string;
  }> = [];

  if (section === "propositions") {
    const { data } = await supabase!
      .from("suggestions")
      .select("id,title,category,body,status,is_anonymous,is_public,created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    proposals = data ?? [];
  }

  if (section === "inscriptions") {
    const { data: registrations } = await supabase!
      .from("event_registrations")
      .select("event_id,registered_at")
      .eq("user_id", user!.id)
      .eq("status", "registered")
      .order("registered_at", { ascending: false });

    const eventIds = [...new Set((registrations ?? []).map((registration) => registration.event_id))];
    if (eventIds.length) {
      const { data: events } = await supabase!
        .from("events")
        .select("id,slug,title,starts_at,location")
        .in("id", eventIds);
      const byId = new Map((events ?? []).map((event) => [event.id, event]));
      registeredEvents = (registrations ?? [])
        .flatMap((registration) => {
          const event = byId.get(registration.event_id);
          return event ? [{ ...event, registered_at: registration.registered_at }] : [];
        })
        .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
    }
  }

  const { data: profile } =
    section === "profil"
      ? await supabase!
          .from("profiles")
          .select("full_name,notification_prefs,program,study_year,avatar_url")
          .eq("id", user!.id)
          .maybeSingle()
      : { data: null };

  return (
    <>
      <Header />
      <div className="fixed bottom-5 right-5 z-40 sm:bottom-8 sm:right-8">
        <NotificationBell userId={user!.id} />
      </div>
      <main className="flex-1 pt-36 pb-16">
        <div className="mx-auto w-full max-w-7xl px-6">
          <Link
            href="/espace"
            className="mb-5 inline-flex text-sm font-semibold text-istin-blue hover:underline"
          >
            ← Tableau de bord étudiant
          </Link>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-istin-red">Espace étudiant</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">{title}</h1>
          </div>

          {section === "profil" && (
            <StudentProfileForm
              userId={user!.id}
              email={user!.email ?? ""}
              initialName={profile?.full_name ?? ""}
              initialProgram={(profile as { program?: string } | null)?.program ?? ""}
              initialYear={(profile as { study_year?: string } | null)?.study_year ?? ""}
              initialAvatar={(profile as { avatar_url?: string } | null)?.avatar_url ?? ""}
              initialPreferences={
                (profile?.notification_prefs ?? {}) as {
                  event_reminders?: boolean;
                  important_announcements?: boolean;
                }
              }
            />
          )}

          {section === "propositions" && (
            <StudentProposalForm userId={user!.id} initialItems={proposals} />
          )}

          {section === "sondages" && <StudentPollsPanel userId={user!.id} />}

          {section === "demandes" && <StudentTicketForm userId={user!.id} />}

          {section === "notifications" && (
            <div className="space-y-6">
              <EnablePushToggle userId={user!.id} />
              <NotificationsPanel userId={user!.id} />
            </div>
          )}

          {section === "inscriptions" && (
            <div className="space-y-4">
              {registeredEvents.length ? registeredEvents.map((event) => (
                <article key={event.id} className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-istin-red">
                    {new Date(event.starts_at).toLocaleString("fr-FR", {
                      dateStyle: "full",
                      timeStyle: "short",
                      timeZone: "Africa/Libreville",
                    })}
                  </p>
                  <h2 className="mt-2 font-heading text-xl font-bold text-[#1c2733]">{event.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{event.location || "Lieu à préciser"}</p>
                  <Link href={`/evenements/${event.slug}`} className="mt-4 inline-flex text-sm font-semibold text-istin-blue hover:underline">
                    Voir l’événement →
                  </Link>
                </article>
              )) : (
                <section className="max-w-2xl rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-8 shadow-sm">
                  <h2 className="font-heading text-xl font-bold text-[#1c2733]">Aucune inscription pour le moment</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Consulte l’agenda pour découvrir les événements ouverts aux inscriptions en ligne.
                  </p>
                  <Link href="/evenements" className="btn btn-primary mt-5">
                    Voir l’agenda
                  </Link>
                </section>
              )}
            </div>
          )}

          {section === "billets" && (
            <section className="max-w-2xl rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-[#1c2733]">Aucun billet</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Les billets apparaîtront ici lorsque tu seras inscrit à un événement qui en délivre.
              </p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

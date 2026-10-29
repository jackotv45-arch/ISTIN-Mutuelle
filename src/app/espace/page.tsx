import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { NotificationBell } from "@/components/student/NotificationBell";
import { Footer } from "@/components/layout/Footer";
import { StudentSignOutButton } from "@/components/student/StudentSignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type UpcomingEvent = { slug: string; title: string; starts_at: string; location: string | null };

const quickLinks = [
  {
    href: "/espace/profil",
    title: "Mon profil",
    desc: "Nom, filière, année, photo et préférences.",
  },
  {
    href: "/espace/propositions",
    title: "Mes propositions",
    desc: "Dépose une idée et suis son traitement.",
  },
  {
    href: "/espace/inscriptions",
    title: "Mes inscriptions",
    desc: "Événements auxquels tu es inscrit.",
  },
  {
    href: "/espace/sondages",
    title: "Sondages",
    desc: "Participe aux votes ouverts par la mutuelle.",
  },
  {
    href: "/espace/notifications",
    title: "Notifications",
    desc: "Alertes et rappels liés à ton compte.",
  },
  {
    href: "/espace/demandes",
    title: "Demandes au bureau",
    desc: "Envoie une question ou une demande au bureau.",
  },
  {
    href: "/evenements",
    title: "Agenda public",
    desc: "Consulter tous les événements publiés.",
  },
];

export default async function EspacePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  const [{ data: profile }, { data: rows }, suggestionsResult] = await Promise.all([
    supabase!.from("profiles").select("full_name").eq("id", user!.id).maybeSingle(),
    supabase!
      .from("events")
      .select("slug,title,starts_at,location")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3),
    supabase!
      .from("suggestions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id),
  ]);

  const events = (rows ?? []) as UpcomingEvent[];
  const name = profile?.full_name?.trim() || user?.email?.split("@")[0] || "étudiant";
  const suggestionCount = suggestionsResult.count ?? 0;

  return (
    <>
      <Header />
      <div className="fixed bottom-5 right-5 z-40 sm:bottom-8 sm:right-8">
        <NotificationBell userId={user!.id} />
      </div>
      <main className="flex-1 bg-[#f5f8fb]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#062a4a] via-[#0b4777] to-[#0b63ab] pt-28 pb-16 text-white sm:pt-32 sm:pb-20">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border-[48px] border-white/5" aria-hidden />
          <div className="pointer-events-none absolute -bottom-28 left-[30%] h-72 w-72 rounded-full bg-[#ce283c]/15 blur-3xl" aria-hidden />

          <div className="relative mx-auto w-full max-w-7xl px-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[.16em] text-white/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ef5265]" />
                  Espace étudiant
                </span>
                <h1 className="mt-4 font-heading text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
                  Bienvenue, {name}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                  Retrouve ton profil, tes propositions et les prochains événements de la mutuelle.
                </p>
              </div>
              <div className="shrink-0">
                <StudentSignOutButton variant="dark" />
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                  Événements à venir
                </p>
                <p className="mt-1 font-heading text-3xl font-bold tabular-nums">{events.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                  Mes propositions
                </p>
                <p className="mt-1 font-heading text-3xl font-bold tabular-nums">{suggestionCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Compte</p>
                <p className="mt-2 truncate text-sm font-semibold text-white/95">{user?.email}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contenu */}
        <section className="relative z-10 pb-16 pt-8 sm:pt-10">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(6,42,74,0.05)] transition hover:-translate-y-1 hover:border-istin-blue/30 hover:shadow-[0_16px_36px_rgba(6,42,74,0.1)]"
                >
                  <h2 className="font-heading text-lg font-bold text-[#1c2733]">{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-istin-blue transition-all group-hover:gap-2">
                    Ouvrir <span aria-hidden>→</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-bold text-[#1c2733]">Événements à venir</h2>
                  <p className="text-sm text-muted-foreground">Horaires indiqués en heure de Libreville.</p>
                </div>
                <Link href="/evenements" className="text-sm font-semibold text-istin-blue hover:underline">
                  Tout voir →
                </Link>
              </div>

              {events.length ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <article
                      key={event.slug}
                      className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-istin-red">
                        {new Date(event.starts_at).toLocaleString("fr-FR", {
                          dateStyle: "full",
                          timeStyle: "short",
                          timeZone: "Africa/Libreville",
                        })}
                      </p>
                      <h3 className="mt-2 font-heading text-lg font-bold text-[#1c2733]">{event.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.location || "Lieu à préciser"}
                      </p>
                      <Link
                        href={"/evenements/" + event.slug}
                        className="mt-3 inline-block text-sm font-semibold text-istin-blue"
                      >
                        Détails →
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
                  Aucun événement publié à venir pour le moment.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

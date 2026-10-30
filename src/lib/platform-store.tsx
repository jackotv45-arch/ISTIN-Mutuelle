"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapAnnouncement, persistAnnouncementImage, slugForTitle } from "@/lib/supabase/news";
import { librevilleDateTimeToIso, mapEvent, type EventInput } from "@/lib/supabase/events";
import type { AnnouncementItem, EventItem } from "@/lib/content-types";
import { notifyAllStudents } from "@/lib/notifications";

export type ActionResult = { ok: boolean; message: string };
type Connection = "loading" | "connected" | "error";
type ContentLoadScope = "none" | "home" | "all";
type PlatformStore = {
  articles: AnnouncementItem[];
  newsConnection: Connection;
  newsError: string | null;
  events: EventItem[];
  eventConnection: Connection;
  eventError: string | null;
  addAnnouncement: (item: Pick<AnnouncementItem, "title" | "category" | "excerpt" | "content" | "image">, published: boolean) => Promise<ActionResult>;
  updateAnnouncement: (slug: string, item: Pick<AnnouncementItem, "title" | "category" | "excerpt" | "content" | "image">, published: boolean) => Promise<ActionResult>;
  setAnnouncementPublished: (slug: string, published: boolean, notifyStudents?: boolean) => Promise<ActionResult>;
  deleteAnnouncement: (slug: string) => Promise<ActionResult>;
  addEvent: (item: EventInput) => Promise<ActionResult>;
  updateEvent: (slug: string, item: EventInput) => Promise<ActionResult>;
  setEventPublished: (slug: string, published: boolean) => Promise<ActionResult>;
  deleteEvent: (slug: string) => Promise<ActionResult>;
};
const PlatformContext = createContext<PlatformStore | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const announcementScope: ContentLoadScope = pathname === "/"
    ? "home"
    : pathname.startsWith("/actualites") || pathname === "/admin"
      ? "all"
      : "none";
  const eventScope: ContentLoadScope = pathname === "/"
    ? "home"
    : pathname.startsWith("/evenements") || pathname === "/admin"
      ? "all"
      : "none";
  const activeLoaders = useRef({ announcements: announcementScope, events: eventScope });
  activeLoaders.current = { announcements: announcementScope, events: eventScope };
  const [articles, setArticles] = useState<AnnouncementItem[]>([]);
  const [newsConnection, setNewsConnection] = useState<Connection>(supabase ? "loading" : "error");
  const [newsError, setNewsError] = useState<string | null>(supabase ? null : "La connexion Supabase n’est pas configurée.");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventConnection, setEventConnection] = useState<Connection>(supabase ? "loading" : "error");
  const [eventError, setEventError] = useState<string | null>(supabase ? null : "La connexion Supabase n’est pas configurée.");

  const loadAnnouncements = useCallback(async (scope: Exclude<ContentLoadScope, "none">) => {
    if (!supabase) return;
    try {
      let query = supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (scope === "home") query = query.limit(3);
      const timeout = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("timeout")), 10000),
      );
      const { data, error } = await Promise.race([query, timeout]) as Awaited<typeof query>;
      if (error) {
        setArticles([]);
        setNewsConnection("error");
        setNewsError("Les actualités ne sont pas accessibles. Vérifie les règles SQL et les droits Supabase.");
        return;
      }
      setArticles((data ?? []).map((row) => mapAnnouncement(row as Parameters<typeof mapAnnouncement>[0])));
      setNewsConnection("connected");
      setNewsError(null);
    } catch {
      setArticles([]);
      setNewsConnection("error");
      setNewsError("Chargement trop long. Vérifie ta connexion réseau puis réessaie.");
    }
  }, [supabase]);

  const loadEvents = useCallback(async (scope: Exclude<ContentLoadScope, "none">) => {
    if (!supabase) return;
    try {
      let query = supabase.from("events").select("*").order("starts_at", { ascending: true });
      if (scope === "home") {
        query = query
          .gte("starts_at", new Date().toISOString())
          .neq("status", "draft")
          .neq("status", "cancelled")
          .limit(3);
      }
      const timeout = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("timeout")), 10000),
      );
      const { data, error } = await Promise.race([query, timeout]) as Awaited<typeof query>;
      if (error) {
        setEvents([]);
        setEventConnection("error");
        setEventError("Les événements ne sont pas accessibles. Vérifie les règles SQL et les droits Supabase.");
        return;
      }
      setEvents((data ?? []).map((row) => mapEvent(row as Parameters<typeof mapEvent>[0])));
      setEventConnection("connected");
      setEventError(null);
    } catch {
      setEvents([]);
      setEventConnection("error");
      setEventError("Chargement trop long. Vérifie ta connexion réseau puis réessaie.");
    }
  }, [supabase]);

  useEffect(() => {
    if (announcementScope !== "none") void loadAnnouncements(announcementScope);
  }, [announcementScope, loadAnnouncements]);

  useEffect(() => {
    if (eventScope !== "none") void loadEvents(eventScope);
  }, [eventScope, loadEvents]);

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        window.setTimeout(() => {
          if (activeLoaders.current.announcements !== "none") {
            void loadAnnouncements(activeLoaders.current.announcements);
          }
          if (activeLoaders.current.events !== "none") {
            void loadEvents(activeLoaders.current.events);
          }
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, loadAnnouncements, loadEvents]);

  const addAnnouncement = useCallback(async (item: Pick<AnnouncementItem, "title" | "category" | "excerpt" | "content" | "image">, published: boolean): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, message: "Connecte-toi avec un compte administrateur avant d’enregistrer." };
    const image = await persistAnnouncementImage(supabase, item.image);
    if (!image.ok) return { ok: false, message: image.error };
    const { data, error } = await supabase.from("announcements").insert({
      slug: slugForTitle(item.title), title: item.title, excerpt: item.excerpt, body: item.content,
      category: item.category, author_label: "ISTIN MUTUELLE", cover_url: image.url,
      status: published ? "published" : "draft", published_at: published ? new Date().toISOString() : null, created_by: user.id,
    }).select("*").single();
    if (error || !data) return { ok: false, message: "Enregistrement refusé. Vérifie les règles Supabase et les droits du compte administrateur." };
    setArticles((current) => [mapAnnouncement(data as Parameters<typeof mapAnnouncement>[0]), ...current]);
    return { ok: true, message: published ? "Actualité enregistrée et publiée." : "Brouillon enregistré." };
  }, [supabase]);

  const updateAnnouncement = useCallback(async (slug: string, item: Pick<AnnouncementItem, "title" | "category" | "excerpt" | "content" | "image">, published: boolean): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const image = await persistAnnouncementImage(supabase, item.image);
    if (!image.ok) return { ok: false, message: image.error };
    const { data, error } = await supabase.from("announcements").update({
      title: item.title, excerpt: item.excerpt, body: item.content, category: item.category, cover_url: image.url,
      status: published ? "published" : "draft", published_at: published ? new Date().toISOString() : null,
    }).eq("slug", slug).select("*").maybeSingle();
    if (error || !data) return { ok: false, message: "Modification refusée par Supabase." };
    setArticles((current) => current.map((article) => article.slug === slug ? mapAnnouncement(data as Parameters<typeof mapAnnouncement>[0]) : article));
    return { ok: true, message: "Actualité mise à jour." };
  }, [supabase]);

  const setAnnouncementPublished = useCallback(async (slug: string, published: boolean, notifyStudents = false): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const { data, error } = await supabase.from("announcements").update({ status: published ? "published" : "draft", published_at: published ? new Date().toISOString() : null }).eq("slug", slug).select("*").maybeSingle();
    if (error || !data) return { ok: false, message: "Changement de statut refusé par Supabase." };
    setArticles((current) => current.map((article) => article.slug === slug ? mapAnnouncement(data as Parameters<typeof mapAnnouncement>[0]) : article));
    if (published && notifyStudents) {
      const mapped = mapAnnouncement(data as Parameters<typeof mapAnnouncement>[0]);
      await notifyAllStudents(supabase, {
        title: "Nouvelle actualité",
        body: mapped.title,
        link: "/actualites/" + mapped.slug,
        type: "news_published",
        meta: { slug: mapped.slug },
      });
    }
    return { ok: true, message: published ? (notifyStudents ? "Actualité publiée et étudiants notifiés." : "Actualité publiée.") : "Actualité dépubliée." };
  }, [supabase]);

  const deleteAnnouncement = useCallback(async (slug: string): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const { error } = await supabase.from("announcements").delete().eq("slug", slug);
    if (error) return { ok: false, message: "Suppression refusée par Supabase." };
    setArticles((current) => current.filter((article) => article.slug !== slug));
    return { ok: true, message: "Publication supprimée." };
  }, [supabase]);

  const addEvent = useCallback(async (item: EventInput): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, message: "Connecte-toi avec un compte administrateur avant d’enregistrer." };
    const image = await persistAnnouncementImage(supabase, item.image);
    if (!image.ok) return { ok: false, message: image.error };
    const startsAt = librevilleDateTimeToIso(item.startAt);
    const { data, error } = await supabase.from("events").insert({
      slug: slugForTitle(item.title), title: item.title, description: item.description, body: item.content, cover_url: image.url,
      starts_at: startsAt, location: item.location || null, organizer: item.organizer || null,
      practical_info: item.practicalInfo, registration_enabled: item.registrationEnabled,
      status: item.published ? "published" : "draft", created_by: user.id,
    }).select("*").single();
    if (error || !data) return { ok: false, message: "Événement non enregistré. Vérifie les règles Supabase." };
    const mapped = mapEvent(data as Parameters<typeof mapEvent>[0]);
    setEvents((current) => [...current, mapped].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)));
    if (item.published) {
      await notifyAllStudents(supabase, {
        title: "Nouvel événement",
        body: mapped.title + " a été publié. Consulte l’agenda.",
        link: "/evenements/" + mapped.slug,
        type: "event_published",
        meta: { slug: mapped.slug },
      });
    }
    return { ok: true, message: item.published ? "Événement publié et étudiants notifiés." : "Brouillon d’événement enregistré." };
  }, [supabase]);

  const updateEvent = useCallback(async (slug: string, item: EventInput): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const image = await persistAnnouncementImage(supabase, item.image);
    if (!image.ok) return { ok: false, message: image.error };
    const { data, error } = await supabase.from("events").update({
      title: item.title, description: item.description, body: item.content, cover_url: image.url, starts_at: librevilleDateTimeToIso(item.startAt),
      location: item.location || null, organizer: item.organizer || null, practical_info: item.practicalInfo,
      registration_enabled: item.registrationEnabled, status: item.published ? "published" : "draft",
    }).eq("slug", slug).select("*").maybeSingle();
    if (error || !data) return { ok: false, message: "Modification refusée par Supabase." };
    setEvents((current) => current.map((event) => event.slug === slug ? mapEvent(data as Parameters<typeof mapEvent>[0]) : event).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)));
    return { ok: true, message: "Événement mis à jour." };
  }, [supabase]);

  const setEventPublished = useCallback(async (slug: string, published: boolean): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const { data, error } = await supabase.from("events").update({ status: published ? "published" : "draft" }).eq("slug", slug).select("*").maybeSingle();
    if (error || !data) return { ok: false, message: "Changement de statut refusé par Supabase." };
    const mapped = mapEvent(data as Parameters<typeof mapEvent>[0]);
    setEvents((current) => current.map((event) => event.slug === slug ? mapped : event));
    if (published) {
      await notifyAllStudents(supabase, {
        title: "Nouvel événement",
        body: mapped.title + " a été publié. Consulte l’agenda.",
        link: "/evenements/" + mapped.slug,
        type: "event_published",
        meta: { slug: mapped.slug },
      });
    }
    return { ok: true, message: published ? "Événement publié et étudiants notifiés." : "Événement dépublié." };
  }, [supabase]);

  const deleteEvent = useCallback(async (slug: string): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: "La connexion Supabase n’est pas configurée." };
    const { error } = await supabase.from("events").delete().eq("slug", slug);
    if (error) return { ok: false, message: "Suppression refusée par Supabase." };
    setEvents((current) => current.filter((event) => event.slug !== slug));
    return { ok: true, message: "Événement supprimé." };
  }, [supabase]);

  const value = useMemo(() => ({
    articles, newsConnection, newsError, events, eventConnection, eventError,
    addAnnouncement, updateAnnouncement, setAnnouncementPublished, deleteAnnouncement,
    addEvent, updateEvent, setEventPublished, deleteEvent,
  }), [articles, newsConnection, newsError, events, eventConnection, eventError, addAnnouncement, updateAnnouncement, setAnnouncementPublished, deleteAnnouncement, addEvent, updateEvent, setEventPublished, deleteEvent]);
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const value = useContext(PlatformContext);
  if (!value) throw new Error("usePlatform doit être utilisé dans PlatformProvider.");
  return value;
}

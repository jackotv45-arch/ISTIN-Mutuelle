import type { SupabaseClient } from "@supabase/supabase-js";
import { broadcastPush } from "@/lib/push-broadcast";

export type NotificationType =
  | "event_published"
  | "event_today"
  | "event_reminder_1d"
  | "event_reminder_3d"
  | "poll_opened"
  | "ticket_answered"
  | "ticket_in_progress"
  | "ticket_closed"
  | "proposal_answered"
  | "proposal_under_review"
  | "proposal_accepted"
  | "proposal_rejected"
  | "news_published"
  | "news_important"
  | "account_welcome"
  | "general";

export async function notifyAllStudents(
  supabase: SupabaseClient,
  input: {
    title: string;
    body?: string | null;
    link?: string | null;
    type?: NotificationType;
    meta?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.rpc("notify_all_students", {
    p_title: input.title,
    p_body: input.body ?? null,
    p_link: input.link ?? null,
    p_type: input.type ?? "general",
    p_meta: input.meta ?? {},
  });
  if (!error) {
    void broadcastPush({
      title: input.title,
      body: input.body ?? "",
      url: input.link ?? "/espace/notifications",
    });
  }
  return { ok: !error, error: error?.message ?? null };
}

export async function notifyUser(
  supabase: SupabaseClient,
  input: {
    userId: string;
    title: string;
    body?: string | null;
    link?: string | null;
    type?: NotificationType;
    meta?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.rpc("notify_user", {
    p_user_id: input.userId,
    p_title: input.title,
    p_body: input.body ?? null,
    p_link: input.link ?? null,
    p_type: input.type ?? "general",
    p_meta: input.meta ?? {},
  });
  if (!error) {
    void broadcastPush({
      title: input.title,
      body: input.body ?? "",
      url: input.link ?? "/espace/notifications",
      userId: input.userId,
    });
  }
  return { ok: !error, error: error?.message ?? null };
}

export function notificationTypeLabel(type: string | null | undefined) {
  const map: Record<string, string> = {
    event_published: "Événement",
    event_reminder_3d: "Rappel",
    event_reminder_1d: "Rappel",
    event_today: "Aujourd'hui",
    poll_opened: "Sondage",
    ticket_answered: "Demande",
    ticket_in_progress: "Demande",
    ticket_closed: "Demande",
    proposal_answered: "Proposition",
    proposal_under_review: "Proposition",
    proposal_accepted: "Proposition",
    proposal_rejected: "Proposition",
    news_published: "Actualité",
    news_important: "Annonce",
    account_welcome: "Compte",
    general: "Info",
  };
  return map[type ?? "general"] ?? "Info";
}

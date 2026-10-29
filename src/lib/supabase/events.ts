import type { EventItem } from "@/lib/content-types";

export type EventInput = Pick<
  EventItem,
  "title" | "description" | "content" | "startAt" | "location" | "organizer" | "image" | "practicalInfo"
> & { published: boolean };

type EventRow = {
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  cover_url: string | null;
  starts_at: string;
  location: string | null;
  organizer: string | null;
  practical_info: string[] | null;
  status: "draft" | "published" | "full" | "ended" | "cancelled";
};

export function librevilleDateTimeToIso(value: string) {
  const date = new Date(`${value}:00+01:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Date d’événement invalide.");
  return date.toISOString();
}

export function isoToLibrevilleDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Libreville",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23",
  }).format(date).replace(" ", "T");
}

export function mapEvent(row: EventRow): EventItem {
  const startsAt = new Date(row.starts_at);
  const validDate = !Number.isNaN(startsAt.getTime());
  const statusLabel = row.status === "draft"
    ? "BROUILLON"
    : row.status === "full"
      ? "COMPLET"
      : row.status === "cancelled"
        ? "ANNULÉ"
        : row.status === "ended" || (validDate && startsAt.getTime() <= Date.now())
          ? "TERMINÉ"
          : "À VENIR";

  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    content: row.body ?? "",
    dateLabel: validDate
      ? startsAt.toLocaleString("fr-FR", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: "Africa/Libreville",
        })
      : "Date à confirmer",
    startAt: validDate ? startsAt.toISOString() : row.starts_at,
    location: row.location ?? "À confirmer",
    organizer: row.organizer ?? "À confirmer",
    statusLabel,
    image: row.cover_url ?? "/images/pro/hero-4.jpg",
    practicalInfo: row.practical_info ?? [],
    published: row.status !== "draft",
  };
}
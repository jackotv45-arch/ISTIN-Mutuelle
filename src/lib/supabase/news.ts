import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnnouncementItem } from "@/lib/content-types";

export const NEWS_IMAGE_BUCKET = "istin-news";

type AnnouncementRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  category: string | null;
  author_label: string | null;
  cover_url: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
};

export type AnnouncementInput = Pick<
  AnnouncementItem,
  "title" | "category" | "excerpt" | "content" | "image"
>;

export function mapAnnouncement(row: AnnouncementRow): AnnouncementItem {
  const dateValue = row.published_at ?? row.created_at;
  const date = new Date(dateValue);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.body,
    category: row.category ?? "Information",
    date: Number.isNaN(date.getTime())
      ? "Date à confirmer"
      : date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    author: row.author_label ?? "ISTIN MUTUELLE",
    image: row.cover_url ?? "/images/pro/hero-2.jpg",
    published: row.status === "published",
  };
}

export function slugForTitle(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${slug || "actualite"}-${crypto.randomUUID().slice(0, 8)}`;
}

function imageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/avif") return "avif";
  return null;
}

export async function persistAnnouncementImage(
  supabase: SupabaseClient,
  image: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!image.startsWith("data:")) return { ok: true, url: image };

  const match = image.match(/^data:(image\/(?:jpeg|png|webp|avif));base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "Importe une image JPG, PNG, WebP ou AVIF valide." };
  }

  const [, mimeType, encoded] = match;
  const extension = imageExtension(mimeType);
  if (!extension) return { ok: false, error: "Ce format d’image n’est pas pris en charge." };

  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  if (bytes.byteLength > 5 * 1024 * 1024) {
    return { ok: false, error: "L’image doit faire 5 Mo maximum." };
  }

  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(NEWS_IMAGE_BUCKET).upload(path, bytes, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { ok: false, error: "Envoi de l’image refusé. Vérifie le bucket et les droits administrateur." };

  const { data } = supabase.storage.from(NEWS_IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export function announcementRowToInput(row: AnnouncementRow): AnnouncementItem {
  return mapAnnouncement(row);
}

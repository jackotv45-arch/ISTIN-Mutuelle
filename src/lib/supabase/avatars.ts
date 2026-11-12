import type { SupabaseClient } from "@supabase/supabase-js";

export const STUDENT_AVATAR_BUCKET = "istin-student-avatars";
export const STUDENT_AVATAR_URL_TTL_SECONDS = 60 * 60;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function uploadStudentAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<
  | { ok: true; path: string; signedUrl: string }
  | { ok: false; error: string }
> {
  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) {
    return { ok: false, error: "Format de photo non pris en charge." };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { ok: false, error: "La photo doit faire 5 Mo maximum." };
  }

  const path = userId + "/" + crypto.randomUUID() + "." + extension;
  const storage = supabase.storage.from(STUDENT_AVATAR_BUCKET);
  const { error: uploadError } = await storage.upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data, error: signedUrlError } = await storage.createSignedUrl(
    path,
    STUDENT_AVATAR_URL_TTL_SECONDS,
  );
  if (signedUrlError || !data?.signedUrl) {
    await storage.remove([path]);
    return {
      ok: false,
      error: signedUrlError?.message ?? "Impossible de préparer l’aperçu de la photo.",
    };
  }

  return { ok: true, path, signedUrl: data.signedUrl };
}

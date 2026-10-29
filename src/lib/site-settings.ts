import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  editableSectionDefaults,
  normalizeEditableSectionDocument,
  sectionSettingKey,
  type EditableSectionDocument,
  type EditableSectionKey,
} from "@/lib/admin-sections";

export async function getEditableSection(key: EditableSectionKey): Promise<EditableSectionDocument> {
  const fallback = editableSectionDefaults[key];
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return fallback;
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", sectionSettingKey(key))
      .maybeSingle();
    if (error || !data) return fallback;
    return normalizeEditableSectionDocument(key, data.value);
  } catch {
    return fallback;
  }
}
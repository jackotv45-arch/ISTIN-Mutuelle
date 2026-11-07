import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  editableSectionDefaults,
  normalizeEditableSectionDocument,
  sectionSettingKey,
  type EditableSectionDocument,
  type EditableSectionKey,
} from "@/lib/admin-sections";

const HOME_SECTION_KEYS = ["finances", "bureau", "medias"] as const;
type HomeEditableSections = Pick<Record<EditableSectionKey, EditableSectionDocument>, (typeof HOME_SECTION_KEYS)[number]>;

const loadHomeEditableSections = cache(async (): Promise<HomeEditableSections> => {
  const result: HomeEditableSections = {
    finances: editableSectionDefaults.finances,
    bureau: editableSectionDefaults.bureau,
    medias: editableSectionDefaults.medias,
  };
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return result;
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", HOME_SECTION_KEYS.map(sectionSettingKey));
    if (error || !data) return result;
    for (const row of data) {
      const key = HOME_SECTION_KEYS.find((sectionKey) => sectionSettingKey(sectionKey) === row.key);
      if (key) result[key] = normalizeEditableSectionDocument(key, row.value);
    }
    return result;
  } catch {
    return result;
  }
});

export function getHomeEditableSections(): Promise<HomeEditableSections> {
  return loadHomeEditableSections();
}

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

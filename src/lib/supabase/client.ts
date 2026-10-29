"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  const { url, publishableKey } = getSupabasePublicConfig();
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}

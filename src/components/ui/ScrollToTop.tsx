"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Remet le scroll en haut à chaque changement de page.
 * Évite d’atterrir sur le footer après une navigation.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ancres : laisser le navigateur gérer
    if (typeof window === "undefined") return;
    if (window.location.hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // Certains navigateurs gardent le scroll sur documentElement
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, searchParams]);

  return null;
}

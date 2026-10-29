"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MotionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const forceVisible = () => {
      document.querySelectorAll(".reveal, .reveal-item").forEach((element) => {
        element.classList.add("is-visible");
      });
    };

    if (motionPreference.matches || !("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("motion-ready");
      forceVisible();
      return;
    }

    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -10px 0px" },
    );

    document.querySelectorAll(".reveal, .reveal-item").forEach((element) => {
      if (!element.classList.contains("is-visible")) observer.observe(element);
    });

    // Filet de sécurité mobile : ne jamais laisser une section invisible
    const fallback = window.setTimeout(forceVisible, 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [pathname]);

  return null;
}

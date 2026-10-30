"use client";

import { IstinLogo } from "@/components/ui/IstinLogo";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/actualites", label: "Actualités" },
  { href: "/evenements", label: "Événements" },
  { href: "/finances", label: "Finances" },
  { href: "/galerie", label: "Galerie" },
  { href: "/bureau", label: "Bureau" },
  { href: "/a-propos", label: "À propos" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentLoggedIn, setStudentLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.classList.add("has-mobile-bottom-nav");
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, []);

  // Fermer avec la touche Échap et si on repasse en affichage bureau
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fermer le menu à chaque navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) {
        if (active) setStudentLoggedIn(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "student")
        .limit(1);
      if (active) setStudentLoggedIn(Boolean(roles?.length));
    };

    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void check();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const espaceHref = studentLoggedIn ? "/espace" : "/connexion";
  const espaceLabel = studentLoggedIn ? "Mon espace" : "Espace étudiant";
  const backFallback = pathname.startsWith("/espace/")
    ? "/espace"
    : pathname.startsWith("/actualites/")
      ? "/actualites"
      : pathname.startsWith("/evenements/")
        ? "/evenements"
        : pathname.startsWith("/galerie/")
          ? "/galerie"
          : pathname === "/inscription" || pathname.startsWith("/mot-de-passe")
            ? "/connexion"
            : "/";

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(backFallback);
  };

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-[100]">
      <div
        className={cn(
          "border-b border-[#e9ecef] bg-white transition-shadow duration-300",
          scrolled ? "shadow-[0_2px_20px_#00000014]" : "shadow-none",
        )}
      >
        <div className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          {pathname !== "/" && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Retour"
              title="Retour"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#0b63ab] transition-colors hover:bg-[#eef5fb] lg:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </button>
          )}
          <Link href="/" className="relative z-[110] flex shrink-0 items-center" aria-label="Accueil ISTIN Mutuelle">
            <IstinLogo className="h-9 sm:h-11" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-[#eef5fb] text-[#0b63ab]"
                    : "text-[#0b63ab]/90 hover:bg-[#f8f9fa] hover:text-[#ce283c]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href={espaceHref} className="btn btn-primary !px-4 !py-2.5 text-[0.82rem]">
              {espaceLabel}
            </Link>
            <Link
              href="/admin"
              className="btn inline-flex !border-[#0b63ab] !px-4 !py-2.5 text-[0.82rem] text-[#0b63ab] hover:bg-[#0b63ab] hover:text-white"
            >
              Administration
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            className="relative z-[110] flex h-11 w-11 items-center justify-center touch-manipulation rounded-xl text-[#0b63ab] hover:bg-[#f0f4f8] active:bg-[#e8eef5] lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {mobileOpen ? (
                <>
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

    </header>
    {mounted && mobileOpen && createPortal(
      <div className="lg:hidden">
      {/* Fond semi-transparent */}
      <div
        className={cn(
          "fixed inset-0 top-[64px] z-[9998] bg-[#062a4a]/45 sm:top-[72px]",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      {/* Panneau menu */}
      <div
        id="mobile-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={cn(
          "fixed inset-x-0 top-[64px] z-[9999] max-h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain px-3 pb-6 pt-2 sm:top-[72px] sm:max-h-[calc(100dvh-72px)]",
        )}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-1 rounded-2xl border border-[#e9ecef] bg-white p-3 shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-xl px-4 py-3.5 text-base font-semibold",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-[#eef5fb] text-[#0b63ab]"
                  : "text-[#0b63ab] hover:bg-[#f8f9fa]",
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-[#e9ecef] pt-3">
            <Link
              href={espaceHref}
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary justify-center"
            >
              {espaceLabel}
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="btn btn-outline justify-center"
            >
              Administration
            </Link>
          </div>
        </div>
      </div>
      </div>,
      document.body,
    )}
    <nav
      aria-label="Navigation rapide"
      className="fixed inset-x-0 bottom-0 z-[90] grid grid-cols-4 border-t border-[#e9ecef] bg-white/95 px-1 pt-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(6,42,74,0.08)] backdrop-blur-lg lg:hidden"
    >
      {[
        { href: "/", label: "Accueil", icon: "home" },
        { href: "/actualites", label: "Actualités", icon: "news" },
        { href: "/evenements", label: "Événements", icon: "events" },
        { href: espaceHref, label: studentLoggedIn ? "Mon espace" : "Espace", icon: "student" },
      ].map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-istin-blue",
              active ? "text-istin-blue" : "text-slate-500 hover:text-istin-blue",
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {item.icon === "home" && <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>}
              {item.icon === "news" && <><path d="M5 4h14a1 1 0 0 1 1 1v14H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 8h10M7 12h10M7 16h6" /></>}
              {item.icon === "events" && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>}
              {item.icon === "student" && <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>}
            </svg>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}

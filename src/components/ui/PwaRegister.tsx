"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "istin-pwa-install-dismissed";

export function PwaRegister() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  // Enregistrement du service worker (production uniquement)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => reg.update())
      .catch(() => {
        /* silencieux : PWA optionnelle */
      });
  }, []);

  // Proposition d'installation (PC / Android) et aide iPhone
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    let timer: number | undefined;
    if (isIos) {
      timer = window.setTimeout(() => {
        setShowIosHelp(true);
        setVisible(true);
      }, 2500);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application ISTIN Mutuelle"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-[#e9ecef] bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#0b63ab]">Installer ISTIN Mutuelle</p>
        {showIosHelp && !deferred ? (
          <p className="mt-1 text-xs leading-relaxed text-[#495057]">
            Touchez le bouton <strong>Partager</strong> de Safari, puis <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
          </p>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-[#495057]">Ajoutez l&apos;application sur votre appareil pour y accéder en un geste.</p>
        )}
        <div className="mt-3 flex gap-2">
          {deferred && (
            <button type="button" onClick={install} className="btn btn-primary !min-h-0 !px-4 !py-2 text-xs">
              Installer
            </button>
          )}
          <button type="button" onClick={dismiss} className="btn btn-outline !min-h-0 !px-4 !py-2 text-xs">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

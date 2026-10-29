"use client";

import { useEffect, type ReactNode } from "react";

export function ConfirmDialog({ open, title, onClose, children, eyebrow = "Confirmation" }: { open: boolean; title: string; onClose: () => void; children: ReactNode; eyebrow?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="confirm-dialog-backdrop fixed inset-0 z-[80] grid place-items-center bg-[#061a34]/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="confirm-dialog-panel relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl sm:p-8">
      <button type="button" aria-label="Fermer la fenêtre" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:rotate-90 hover:bg-muted">×</button>
      <p className="text-xs font-bold uppercase tracking-[.14em] text-istin-red">{eyebrow}</p><h2 id="dialog-title" className="mt-2 max-w-[90%] font-heading text-2xl font-bold text-foreground">{title}</h2><div className="mt-5 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  </div>;
}

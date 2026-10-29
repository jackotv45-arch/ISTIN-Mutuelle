"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const pad = (n: number) => String(n).padStart(2, "0");
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parse(value: string) {
  const [datePart, timePart] = value.split("T");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart ?? "");
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  const time = /^\d{2}:\d{2}/.test(timePart ?? "") ? timePart!.slice(0, 5) : "18:00";
  return { date, time };
}

/**
 * Calendrier aux couleurs ISTIN (remplace le calendrier natif du navigateur, non stylable).
 * value : "AAAA-MM-JJ" ou, avec withTime, "AAAA-MM-JJTHH:MM".
 */
export function DatePicker({
  value,
  onChange,
  withTime = false,
  required = false,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const { date, time } = parse(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => date ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const emit = (d: Date | null, t: string) => {
    if (!d) return onChange("");
    onChange(withTime ? `${toYmd(d)}T${t}` : toYmd(d));
  };

  const year = view.getFullYear();
  const month = view.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const today = toYmd(new Date());
  const selected = date ? toYmd(date) : "";

  const label = date
    ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}${withTime ? ` à ${time.replace(":", " h ")}` : ""}`
    : placeholder ?? (withTime ? "Choisir la date et l’heure" : "Choisir une date");

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => { if (date) setView(date); setOpen((v) => !v); }}
        className={cn("istin-picker-trigger", open && "is-open")}
      >
        <span className={cn("truncate", !date && "text-slate-400")}>{label}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-istin-blue">
          <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {required && (
        <input tabIndex={-1} aria-hidden required value={value} onChange={() => {}} className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0" />
      )}

      {open && (
        <div id={id} role="dialog" aria-label="Calendrier" className="istin-calendar">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Mois précédent" onClick={() => setView(new Date(year, month - 1, 1))} className="istin-calendar-nav">‹</button>
            <p className="font-heading text-sm font-bold capitalize text-[#062a4a]">{MONTHS[month]} {year}</p>
            <button type="button" aria-label="Mois suivant" onClick={() => setView(new Date(year, month + 1, 1))} className="istin-calendar-nav">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d) => <span key={d} className="pb-1 text-[11px] font-bold uppercase text-istin-blue">{d}</span>)}
            {cells.map((day, i) => {
              if (!day) return <span key={"e" + i} />;
              const ymd = `${year}-${pad(month + 1)}-${pad(day)}`;
              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => { emit(new Date(year, month, day), time); if (!withTime) setOpen(false); }}
                  className={cn("istin-calendar-day", ymd === selected && "is-selected", ymd === today && "is-today")}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {withTime && (
            <label className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm font-semibold text-[#062a4a]">
              Heure
              <input type="time" value={time} onChange={(e) => emit(date ?? new Date(), e.target.value || "18:00")} className="field-control !h-10 !w-32" />
            </label>
          )}
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-xs font-semibold">
            <button type="button" onClick={() => { emit(null, time); setOpen(false); }} className="text-istin-red hover:underline">Effacer</button>
            <button type="button" onClick={() => { const n = new Date(); setView(n); emit(n, time); if (!withTime) setOpen(false); }} className="text-istin-blue hover:underline">Aujourd’hui</button>
            {withTime && <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-istin-blue px-3 py-1.5 text-white">Valider</button>}
          </div>
        </div>
      )}
    </div>
  );
}

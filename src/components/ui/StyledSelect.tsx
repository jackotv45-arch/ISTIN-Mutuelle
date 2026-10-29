"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

export function StyledSelect({
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

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

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border-2 border-[#d0dae6] bg-white px-3.5 text-left text-sm font-semibold text-[#062a4a] shadow-sm transition",
          "hover:border-istin-blue/50 focus:border-istin-blue focus:outline-none focus:ring-4 focus:ring-istin-blue/15",
          open && "border-istin-blue ring-4 ring-istin-blue/15",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className={cn("truncate", !selected && "text-slate-400")}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className={cn("shrink-0 text-istin-blue transition", open && "rotate-180")}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-[#d7e4f0] bg-white p-1.5 shadow-[0_20px_50px_rgba(6,42,74,0.22)]"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition",
                    active
                      ? "bg-istin-blue font-semibold text-white"
                      : "text-[#1e293b] hover:bg-[#e8f2fa] hover:text-istin-blue",
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type Props = {
  targetIso: string;
  className?: string;
};

export function Countdown({ targetIso, className = "" }: Props) {
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const finished = diff === 0;

  if (finished) {
    return (
      <p className={`text-sm font-medium text-muted-foreground ${className}`}>
        Événement commencé ou terminé
      </p>
    );
  }

  const cells = [
    { label: "Jours", value: days },
    { label: "Heures", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];

  return (
    <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${className}`}>
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl bg-card border border-border px-2 py-3 text-center shadow-sm"
        >
          <p className="font-heading text-xl sm:text-2xl font-bold text-istin-blue-dark tabular-nums">
            {String(c.value).padStart(2, "0")}
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}

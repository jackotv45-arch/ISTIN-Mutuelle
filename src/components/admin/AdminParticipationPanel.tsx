export function AdminParticipationPanel({ mode }: { mode: string }) {
  return <section className="rounded-2xl border border-border bg-white p-6"><p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Participation</p><h1 className="mt-2 font-heading text-2xl font-bold">{mode}</h1><p className="mt-3 text-sm text-muted-foreground">Cette fonctionnalité sera ouverte après la configuration de son stockage et de ses règles d’accès.</p></section>;
}

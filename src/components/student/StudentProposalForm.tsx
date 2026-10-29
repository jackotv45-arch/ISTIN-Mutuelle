"use client";
import { StyledSelect } from "@/components/ui/StyledSelect";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const categories = ["Vie étudiante", "Événement", "Services", "Finances", "Autre"];

type Existing = {
  id: string;
  title: string;
  category: string | null;
  body: string;
  status: string;
  is_anonymous: boolean;
  is_public: boolean;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  received: "Reçue",
  reviewing: "En étude",
  accepted: "Acceptée",
  rejected: "Refusée",
  done: "Terminée",
};

export function StudentProposalForm({
  userId,
  initialItems,
}: {
  userId: string;
  initialItems: Existing[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [items, setItems] = useState(initialItems);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (title.trim().length < 4 || body.trim().length < 10) {
      setError("Indique un titre (4 caractères min.) et une description (10 caractères min.).");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Connexion indisponible.");
      return;
    }
    setBusy(true);
    const { data, error: insertError } = await supabase
      .from("suggestions")
      .insert({
        user_id: userId,
        title: title.trim(),
        category,
        body: body.trim(),
        is_anonymous: isAnonymous,
        status: "received",
        is_public: false,
      })
      .select("id,title,category,body,status,is_anonymous,is_public,created_at")
      .single();
    setBusy(false);
    if (insertError || !data) {
      setError(
        "Envoi refusé. Vérifie que le script supabase/setup_suggestions.sql a été exécuté et que tu as le rôle étudiant.",
      );
      return;
    }
    setItems((current) => [data as Existing, ...current]);
    setTitle("");
    setBody("");
    setIsAnonymous(false);
    setNotice("Proposition envoyée. Elle sera examinée par le bureau.");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-heading text-xl font-bold">Déposer une proposition</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Décris une idée pour améliorer la vie étudiante. Tu peux demander la confidentialité.
          </p>
        </div>
        <label className="block text-sm font-medium">
          Titre
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            required
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Catégorie
          <div className="mt-1"><StyledSelect value={category} onChange={setCategory} placeholder="Choisir la catégorie de ta proposition" options={categories.map((c) => ({ value: c, label: c }))} /></div>
        </label>
        <label className="block text-sm font-medium">
          Description
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={4000}
            required
            className="mt-1 w-full rounded-xl border border-border p-3"
          />
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-slate-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <strong className="block">Proposition confidentielle</strong>
            <span className="text-muted-foreground">
              Ton identité ne sera pas affichée publiquement. Les administrateurs pourront tout de
              même voir l’auteur pour le suivi interne.
            </span>
          </span>
        </label>
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {notice}
          </p>
        )}
        <button disabled={busy} className="btn btn-primary disabled:opacity-60">
          {busy ? "Envoi…" : "Envoyer la proposition"}
        </button>
      </form>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-xl font-bold">Mes propositions</h2>
        <p className="mt-1 text-sm text-muted-foreground">Suivi de tes envois précédents.</p>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading font-bold text-[#1c2733]">{item.title}</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-istin-blue">
                  {statusLabel[item.status] ?? item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.category || "Sans catégorie"} ·{" "}
                {new Date(item.created_at).toLocaleDateString("fr-FR")}
                {item.is_anonymous ? " · confidentielle" : ""}
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.body}</p>
            </article>
          ))}
          {!items.length && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Aucune proposition pour le moment.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

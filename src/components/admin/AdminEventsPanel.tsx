"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import Image from "next/image";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { usePlatform } from "@/lib/platform-store";
import type { EventItem } from "@/lib/content-types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { isoToLibrevilleDateTime, type EventInput } from "@/lib/supabase/events";

const imageOptions = [
  { value: "/images/pro/hero-1.jpg", label: "Équipe étudiante · photo 1" },
  { value: "/images/pro/hero-2.jpg", label: "Vie de la mutuelle · photo 2" },
  { value: "/images/pro/hero-3.jpg", label: "Campus · photo 3" },
  { value: "/images/pro/hero-4.jpg", label: "Étudiants · photo 4" },
  { value: "/images/actualite1.jpg", label: "Actualité ISTIN" },
  { value: "/images/Istin_salon_etudiant.jpg", label: "Salon étudiant" },
  { value: "/images/salle_istin.jpg", label: "Salle ISTIN" },
];

const emptyForm = (): EventInput => ({
  title: "",
  description: "",
  content: "",
  startAt: "",
  location: "",
  organizer: "",
  image: "/images/pro/hero-4.jpg",
  practicalInfo: [],
  registrationEnabled: false,
  published: false,
});

function scrollToForm(el: HTMLElement | null) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function AdminEventsPanel() {
  const {
    events,
    eventConnection,
    eventError,
    addEvent,
    updateEvent,
    setEventPublished,
    deleteEvent,
  } = usePlatform();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EventInput>(emptyForm());
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<EventItem | null>(null);
  const [preview, setPreview] = useState<EventItem | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const connected = eventConnection === "connected";

  function update<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(item: EventItem) {
    setEditingSlug(item.slug);
    setForm({
      title: item.title,
      description: item.description,
      content: item.content,
      startAt: isoToLibrevilleDateTime(item.startAt),
      location: item.location === "À confirmer" ? "" : item.location,
      organizer: item.organizer === "À confirmer" ? "" : item.organizer,
      image: item.image || "/images/pro/hero-4.jpg",
      practicalInfo: item.practicalInfo ?? [],
      registrationEnabled: item.registrationEnabled,
      published: item.published !== false,
    });
    setNotice("Modification en cours : « " + item.title + " »");
    setNoticeError(false);
    window.setTimeout(() => {
      scrollToForm(formRef.current);
      titleRef.current?.focus();
    }, 50);
  }

  function cancelEdit() {
    setEditingSlug(null);
    setForm(emptyForm());
  }

  function imageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setNoticeError(true);
      setNotice("Choisis une image JPG, PNG, WebP ou AVIF de 5 Mo maximum.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("image", reader.result);
        setNotice("Image importée. Elle sera envoyée à l’enregistrement.");
        setNoticeError(false);
      }
    };
    reader.onerror = () => {
      setNoticeError(true);
      setNotice("La lecture de cette image a échoué.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!connected) {
      setNoticeError(true);
      setNotice(eventError ?? "Les événements ne sont pas accessibles.");
      return;
    }
    const result = editingSlug
      ? await updateEvent(editingSlug, form)
      : await addEvent(form);
    setNoticeError(!result.ok);
    setNotice(result.message);
    if (result.ok) {
      setEditingSlug(null);
      setForm(emptyForm());
    }
  }

  async function togglePublication(item: EventItem) {
    const result = await setEventPublished(item.slug, item.published === false);
    setNoticeError(!result.ok);
    setNotice(result.message);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const result = await deleteEvent(deleting.slug);
    setNoticeError(!result.ok);
    setNotice(result.message);
    if (result.ok) setDeleting(null);
  }

  function openFormPreview() {
    setPreview({
      slug: editingSlug ?? "apercu",
      title: form.title.trim() || "Sans titre",
      description: form.description.trim() || "Aucun résumé.",
      content: form.content.trim() || "Aucune description.",
      startAt: form.startAt,
      dateLabel: form.startAt || "Date à préciser",
      location: form.location || "Lieu à confirmer",
      organizer: form.organizer || "Organisateur à confirmer",
      image: form.image,
      practicalInfo: form.practicalInfo,
      registrationEnabled: form.registrationEnabled,
      published: form.published,
      statusLabel: form.published ? "Publié" : "Brouillon",
    } as EventItem);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Agenda</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">Gérer les événements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Clique sur « Modifier » pour charger un événement dans le formulaire. « Aperçu » permet de
          relire la fiche avant publication.
        </p>
        {eventConnection === "loading" && (
          <p className="mt-3 text-sm text-muted-foreground">Chargement des événements…</p>
        )}
        {eventConnection === "error" && (
          <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
            {eventError}
          </p>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <form
          id="event-form"
          ref={formRef}
          onSubmit={submit}
          className={
            "space-y-4 rounded-2xl border bg-white p-5 " +
            (editingSlug
              ? "border-istin-blue ring-2 ring-istin-blue/20 shadow-md"
              : "border-border")
          }
        >
          {editingSlug && (
            <div className="rounded-xl border border-istin-blue/25 bg-[#eef5fb] px-3 py-2 text-sm text-[#062a4a]">
              <strong>Mode modification</strong> — tu édites « {form.title || editingSlug} ».
            </div>
          )}
          <div>
            <h2 className="font-heading text-lg font-bold">
              {editingSlug ? "Modifier l’événement" : "Créer un événement"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Les informations seront enregistrées comme brouillon ou publiées selon ton choix.
            </p>
          </div>
          <label className="block text-sm font-medium">
            Titre de l’événement
            <input
              ref={titleRef}
              placeholder="Ex. Assemblée générale de la mutuelle"
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-border px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Résumé affiché dans l’agenda
            <textarea
              placeholder="Ex. Réunion annuelle pour présenter le bilan et voter les projets."
              required
              maxLength={400}
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full rounded-lg border border-border p-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Date et heure (heure du Gabon)
            <DatePicker
              withTime
              required
              value={form.startAt}
              onChange={(v) => update("startAt", v)}
              className="mt-1"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Lieu (facultatif)
              <input
                placeholder="Ex. Amphithéâtre A, campus ISTIN"
                maxLength={140}
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-border px-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Organisateur (facultatif)
              <input
                placeholder="Ex. Bureau de la mutuelle"
                maxLength={100}
                value={form.organizer}
                onChange={(e) => update("organizer", e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-border px-3"
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Description complète de l’événement
            <textarea
              placeholder="Programme, intervenants, ce que les étudiants doivent savoir…"
              rows={4}
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              className="mt-1 w-full rounded-lg border border-border p-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Informations pratiques · une par ligne
            <textarea
              placeholder={"Ex. Arriver 15 min avant\nApporter sa carte étudiante"}
              rows={3}
              value={form.practicalInfo.join("\n")}
              onChange={(e) => update("practicalInfo", e.target.value.split("\n"))}
              className="mt-1 w-full rounded-lg border border-border p-3"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-istin-blue/20 bg-[#eef5fb] p-4">
            <input
              type="checkbox"
              checked={form.registrationEnabled}
              onChange={(event) => update("registrationEnabled", event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#0b63ab]"
            />
            <span>
              <span className="block text-sm font-semibold text-[#062a4a]">
                Ouvrir les inscriptions en ligne
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                Les étudiants connectés pourront s’inscrire depuis la fiche de l’événement.
              </span>
            </span>
          </label>
          <div className="space-y-3 rounded-xl border border-border bg-slate-50 p-3">
            <label className="block text-sm font-medium">
              Image de couverture
              <div className="mt-1">
                <StyledSelect
                  value={form.image}
                  onChange={(v) => update("image", v)}
                  placeholder="Choisir une photo de couverture"
                  options={[
                    ...(!imageOptions.some((item) => item.value === form.image)
                      ? [
                          {
                            value: form.image,
                            label: form.image.startsWith("data:")
                              ? "Image importée"
                              : "Image actuelle",
                          },
                        ]
                      : []),
                    ...imageOptions,
                  ]}
                />
              </div>
            </label>
            <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-muted">
              <Image
                src={form.image}
                alt="Aperçu de l’image de couverture"
                fill
                unoptimized={form.image.startsWith("data:")}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
            <label className="block text-xs font-medium text-muted-foreground">
              Importer une image JPG, PNG, WebP ou AVIF · 5 Mo maximum
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={imageUpload}
                className="mt-1 block w-full text-sm"
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Publication
            <div className="mt-1">
              <StyledSelect
                value={form.published ? "published" : "draft"}
                onChange={(v) => update("published", v === "published")}
                options={[
                  { value: "draft", label: "Enregistrer en brouillon" },
                  { value: "published", label: "Publier dans l’agenda" },
                ]}
              />
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!connected} className="btn btn-primary disabled:opacity-50">
              {editingSlug ? "Enregistrer les modifications" : "Enregistrer l’événement"}
            </button>
            <button
              type="button"
              onClick={openFormPreview}
              className="rounded-lg border border-istin-blue/30 px-4 py-2 text-sm font-semibold text-istin-blue"
            >
              Aperçu
            </button>
            {editingSlug && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          <div>
            <h2 className="font-heading text-lg font-bold">Événements et brouillons</h2>
            <p className="text-xs text-muted-foreground">
              {connected
                ? events.filter((e) => e.published !== false).length +
                  " publiés · " +
                  events.filter((e) => e.published === false).length +
                  " brouillon(s)"
                : "Données indisponibles"}
            </p>
          </div>
          {events.map((item) => (
            <article
              key={item.slug}
              className={
                "rounded-xl border bg-white p-4 " +
                (editingSlug === item.slug
                  ? "border-istin-blue ring-2 ring-istin-blue/15"
                  : "border-border")
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " +
                    (item.published === false
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-100 text-emerald-800")
                  }
                >
                  {item.published === false ? "Brouillon" : "Publié"}
                </span>
                <span className="text-xs text-muted-foreground">{item.dateLabel}</span>
              </div>
              <h3 className="mt-2 font-heading font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.location}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!connected}
                  onClick={() => startEdit(item)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(item)}
                  className="rounded-lg border border-istin-blue/30 px-3 py-2 text-xs font-semibold text-istin-blue"
                >
                  Aperçu
                </button>
                <button
                  type="button"
                  disabled={!connected}
                  onClick={() => void togglePublication(item)}
                  className="rounded-lg border border-istin-blue/30 px-3 py-2 text-xs font-semibold text-istin-blue disabled:opacity-50"
                >
                  {item.published === false ? "Publier" : "Dépublier"}
                </button>
                <button
                  type="button"
                  disabled={!connected}
                  onClick={() => setDeleting(item)}
                  className="rounded-lg border border-istin-red/30 px-3 py-2 text-xs font-semibold text-istin-red disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
          {connected && events.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
              Aucun événement ni brouillon enregistré. Tu peux créer le premier événement.
            </div>
          )}
        </div>
      </div>

      {notice && (
        <p
          role={noticeError ? "alert" : "status"}
          className={
            "rounded-xl border px-4 py-3 text-sm " +
            (noticeError
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900")
          }
        >
          {notice}
        </p>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Supprimer cet événement ?"
        eyebrow="Confirmation"
        onClose={() => setDeleting(null)}
      >
        <p>La suppression retirera l’événement de l’agenda.</p>
        {deleting && <p className="mt-3 font-semibold text-foreground">{deleting.title}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!connected}
            onClick={() => void confirmDelete()}
            className="btn btn-primary"
          >
            Confirmer la suppression
          </button>
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-lg border border-border px-4 py-2 font-semibold"
          >
            Annuler
          </button>
        </div>
      </ConfirmDialog>

      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de l’événement"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] bg-muted">
              <Image
                src={preview.image}
                alt=""
                fill
                unoptimized={preview.image.startsWith("data:")}
                className="object-cover"
                sizes="800px"
              />
            </div>
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-istin-red/10 px-2.5 py-1 text-[10px] font-bold uppercase text-istin-red">
                  {preview.published === false ? "Brouillon" : "Publié"}
                </span>
                <span className="text-xs text-muted-foreground">{preview.dateLabel}</span>
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#1c2733]">{preview.title}</h2>
              <p className="text-sm text-muted-foreground">
                {preview.location} · {preview.organizer}
              </p>
              <p className="text-sm font-medium text-[#1c2733]">{preview.description}</p>
              <div className="whitespace-pre-wrap text-sm text-[#1c2733]">{preview.content}</div>
              {preview.practicalInfo?.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {preview.practicalInfo.filter(Boolean).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {preview.published !== false && preview.slug !== "apercu" && (
                  <a
                    href={"/evenements/" + preview.slug}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-istin-blue/30 px-4 py-2 text-sm font-semibold text-istin-blue"
                  >
                    Ouvrir la page publique
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

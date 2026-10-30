"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { usePlatform } from "@/lib/platform-store";
import type { AnnouncementItem } from "@/lib/content-types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StyledSelect } from "@/components/ui/StyledSelect";

const imageOptions = [
  { value: "/images/pro/hero-1.jpg", label: "Équipe étudiante · photo 1" },
  { value: "/images/pro/hero-2.jpg", label: "Vie de la mutuelle · photo 2" },
  { value: "/images/pro/hero-3.jpg", label: "Campus · photo 3" },
  { value: "/images/pro/hero-4.jpg", label: "Étudiants · photo 4" },
  { value: "/images/actualite1.jpg", label: "Actualité ISTIN" },
  { value: "/images/Istin_salon_etudiant.jpg", label: "Salon étudiant" },
  { value: "/images/salle_istin.jpg", label: "Salle ISTIN" },
  { value: "/images/salle_instin2.jpg", label: "Salle de cours" },
  { value: "/images/photo3.jpg", label: "Photo du campus" },
];

function scrollToForm(el: HTMLElement | null) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function AdminContentPanel() {
  const {
    articles,
    newsConnection,
    newsError,
    addAnnouncement,
    updateAnnouncement,
    setAnnouncementPublished,
    deleteAnnouncement,
  } = usePlatform();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Annonce");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(imageOptions[1].value);
  const [published, setPublished] = useState(false);
  const [notifyStudents, setNotifyStudents] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AnnouncementItem | null>(null);
  const [preview, setPreview] = useState<AnnouncementItem | null>(null);
  const [notice, setNotice] = useState("");
  const [isError, setIsError] = useState(false);
  const ready = newsConnection === "connected";

  function reset() {
    setEditingSlug(null);
    setTitle("");
    setCategory("Annonce");
    setExcerpt("");
    setContent("");
    setImage(imageOptions[1].value);
    setPublished(false);
    setNotifyStudents(false);
  }

  function edit(item: AnnouncementItem) {
    setEditingSlug(item.slug);
    setTitle(item.title);
    setCategory(item.category);
    setExcerpt(item.excerpt);
    setContent(item.content);
    setImage(item.image || imageOptions[1].value);
    setPublished(item.published !== false);
    setNotifyStudents(false);
    setNotice("Modification en cours : « " + item.title + " »");
    setIsError(false);
    // Laisser React appliquer le state puis scroller / focus
    window.setTimeout(() => {
      scrollToForm(formRef.current);
      titleRef.current?.focus();
    }, 50);
  }

  function importImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setIsError(true);
      setNotice("Choisis une image JPG, PNG, WebP ou AVIF de 5 Mo maximum.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
        setNotice("Image importée. Elle sera envoyée à l’enregistrement.");
        setIsError(false);
      }
    };
    reader.onerror = () => {
      setIsError(true);
      setNotice("La lecture de cette image a échoué.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) {
      setIsError(true);
      setNotice(newsError ?? "Les actualités ne sont pas accessibles.");
      return;
    }
    const input = {
      title: title.trim(),
      category: category.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      image,
    };
    const result = editingSlug
      ? await updateAnnouncement(editingSlug, input, published)
      : await addAnnouncement(input, published);
    setIsError(!result.ok);
    setNotice(result.message);
    if (result.ok) reset();
  }

  async function remove() {
    if (!deleting) return;
    const result = await deleteAnnouncement(deleting.slug);
    setIsError(!result.ok);
    setNotice(result.message);
    if (result.ok) setDeleting(null);
  }

  function openFormPreview() {
    setPreview({
      slug: editingSlug ?? "apercu",
      title: title.trim() || "Sans titre",
      category: category.trim() || "Annonce",
      excerpt: excerpt.trim() || "Aucun résumé pour le moment.",
      content: content.trim() || "Aucun texte pour le moment.",
      image,
      published,
      dateLabel: "Aperçu",
    } as AnnouncementItem);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Publications</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">Gérer les actualités</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Les brouillons restent privés. Les actualités publiées sont visibles sur le site. Utilise
          « Modifier » pour recharger une publication dans le formulaire, puis « Aperçu » pour la
          relire avant enregistrement.
        </p>
        {newsConnection === "loading" && (
          <p className="mt-3 text-sm text-muted-foreground">Chargement des actualités…</p>
        )}
        {newsConnection === "error" && (
          <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
            {newsError}
          </p>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <form
          id="content-form"
          ref={formRef}
          onSubmit={submit}
          className={
            "space-y-4 rounded-2xl border bg-white p-5 transition-shadow " +
            (editingSlug
              ? "border-istin-blue ring-2 ring-istin-blue/20 shadow-md"
              : "border-border")
          }
        >
          {editingSlug && (
            <div className="rounded-xl border border-istin-blue/25 bg-[#eef5fb] px-3 py-2 text-sm text-[#062a4a]">
              <strong>Mode modification</strong> — tu édites « {title || editingSlug} ». Les
              changements ne sont enregistrés qu’après « Enregistrer les modifications ».
            </div>
          )}
          <h2 className="font-heading text-lg font-bold">
            {editingSlug ? "Modifier l’actualité" : "Nouvelle actualité"}
          </h2>
          <label className="block text-sm font-medium">
            Titre de l’actualité
            <input
              ref={titleRef}
              placeholder="Ex. Résultats de l’élection du bureau"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-border px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Catégorie de l’actualité
            <input
              placeholder="Ex. Vie étudiante, Sport, Annonce"
              required
              maxLength={60}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-border px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Résumé (aperçu dans la liste)
            <textarea
              placeholder="Une ou deux phrases affichées dans la liste des actualités"
              required
              maxLength={300}
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border p-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Texte complet de l’actualité
            <textarea
              placeholder="Texte complet de l’actualité…"
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border p-3"
            />
          </label>
          <div className="space-y-3 rounded-xl border border-border bg-slate-50 p-3">
            <label className="block text-sm font-medium">
              Image
              <div className="mt-1">
                <StyledSelect
                  value={image}
                  onChange={setImage}
                  options={[
                    ...(!imageOptions.some((item) => item.value === image)
                      ? [
                          {
                            value: image,
                            label: image.startsWith("data:") ? "Image importée" : "Image actuelle",
                          },
                        ]
                      : []),
                    ...imageOptions,
                  ]}
                />
              </div>
            </label>
            <div className="relative aspect-[16/8] overflow-hidden rounded-lg bg-muted">
              <Image
                src={image}
                alt="Aperçu de la couverture"
                fill
                unoptimized={image.startsWith("data:")}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
            <label className="block text-xs font-medium text-muted-foreground">
              Importer une image · JPG, PNG, WebP ou AVIF · 5 Mo maximum
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={importImage}
                className="mt-1 block w-full text-sm"
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Publication
            <div className="mt-1">
              <StyledSelect
                value={published ? "published" : "draft"}
                onChange={(v) => setPublished(v === "published")}
                options={[
                  { value: "draft", label: "Enregistrer en brouillon" },
                  { value: "published", label: "Publier sur le site" },
                ]}
              />
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!ready} className="btn btn-primary disabled:opacity-50">
              {editingSlug ? "Enregistrer les modifications" : "Enregistrer l’actualité"}
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
                onClick={reset}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          <div>
            <h2 className="font-heading text-lg font-bold">Publications et brouillons</h2>
            <p className="text-xs text-muted-foreground">
              {ready ? articles.length + " élément(s) enregistrés" : "Données indisponibles"}
            </p>
          </div>
          {articles.map((item) => (
            <article
              key={item.slug}
              className={
                "flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between " +
                (editingSlug === item.slug ? "border-istin-blue ring-2 ring-istin-blue/15" : "border-border")
              }
            >
              <div className="min-w-0">
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
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
                <h3 className="mt-1 truncate font-heading font-semibold">{item.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => edit(item)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
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
                  disabled={!ready}
                  onClick={async () => {
                    const willPublish = item.published === false;
                    const shouldNotify =
                      willPublish &&
                      window.confirm(
                        "Notifier tous les étudiants de cette actualité ?\n\nOK = oui, Annuler = publier sans notification.",
                      );
                    const result = await setAnnouncementPublished(
                      item.slug,
                      willPublish,
                      shouldNotify,
                    );
                    setIsError(!result.ok);
                    setNotice(result.message);
                  }}
                  className="rounded-lg border border-istin-blue/30 px-3 py-2 text-xs font-semibold text-istin-blue disabled:opacity-50"
                >
                  {item.published === false ? "Publier" : "Dépublier"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(item)}
                  className="rounded-lg border border-istin-red/30 px-3 py-2 text-xs font-semibold text-istin-red"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
          {ready && articles.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
              Aucune actualité enregistrée. Tu peux créer la première publication.
            </div>
          )}
        </div>
      </div>

      {notice && (
        <p
          role={isError ? "alert" : "status"}
          className={
            "rounded-xl border px-4 py-3 text-sm " +
            (isError
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900")
          }
        >
          {notice}
        </p>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Supprimer cette actualité ?"
        eyebrow="Confirmation"
        onClose={() => setDeleting(null)}
      >
        <p>Cette action retirera la publication et son brouillon de la base de données.</p>
        {deleting && <p className="mt-3 font-semibold text-foreground">{deleting.title}</p>}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => void remove()} className="btn btn-primary">
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

      {/* Aperçu modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de l’actualité"
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
                <span className="rounded-full bg-istin-blue/10 px-2.5 py-1 text-[10px] font-bold uppercase text-istin-blue">
                  {preview.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {preview.published === false ? "Brouillon (non visible sur le site)" : "Publié"}
                </span>
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#1c2733]">{preview.title}</h2>
              <p className="text-sm font-medium text-muted-foreground">{preview.excerpt}</p>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[#1c2733]">
                {preview.content}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {preview.published !== false && preview.slug !== "apercu" && (
                  <a
                    href={"/actualites/" + preview.slug}
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

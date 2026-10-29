"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { persistAnnouncementImage } from "@/lib/supabase/news";
import {
  editableSectionDefaults,
  editableSectionTitles,
  normalizeEditableSectionDocument,
  sectionSettingKey,
  type EditableSectionDocument,
  type EditableSectionKey,
} from "@/lib/admin-sections";

const fieldLabelsFor = (section: EditableSectionKey) => {
  const map: Record<
    EditableSectionKey,
    { title: string; value: string; details: string; titlePh: string; valuePh: string; detailsPh: string }
  > = {
    bureau: {
      title: "Nom du membre",
      value: "Fonction / poste",
      details: "Courte présentation (facultatif)",
      titlePh: "Ex. Amina Nguema",
      valuePh: "Ex. Présidente",
      detailsPh: "Rôle au sein du bureau…",
    },
    finances: {
      title: "Intitulé de la ligne (ex. Cotisations)",
      value: "Montant (en FCFA)",
      details: "Précisions (période, source…)",
      titlePh: "Ex. Solde publié",
      valuePh: "Ex. 1 250 000 FCFA",
      detailsPh: "Période concernée…",
    },
    medias: {
      title: "Titre de la photo",
      value: "Légende affichée sous la photo",
      details: "Description (facultatif)",
      titlePh: "Ex. Salon étudiant",
      valuePh: "Ex. Édition 2025",
      detailsPh: "Contexte de la photo…",
    },
    parametres: {
      title: "Type d’information",
      value: "Contenu à afficher (ex. e-mail, téléphone)",
      details: "Note ou précision (facultatif)",
      titlePh: "Ex. Adresse e-mail",
      valuePh: "Ex. contact@mutuelle-istin.ga",
      detailsPh: "Visible sur la page Contact si renseigné",
    },
    demandes: {
      title: "Type de demande",
      value: "Service qui traite la demande",
      details: "Texte d’aide pour les étudiants",
      titlePh: "Ex. Demande d’attestation",
      valuePh: "Ex. Bureau de la mutuelle",
      detailsPh: "Explique la démarche…",
    },
    inscriptions: {
      title: "Nom de l’événement ou session",
      value: "Nombre de places ou statut (Ouvert / Complet)",
      details: "Informations pratiques (lieu, horaires)",
      titlePh: "Ex. Assemblée générale",
      valuePh: "Ex. Ouvert",
      detailsPh: "Lieu, horaires…",
    },
    rapports: {
      title: "Titre du rapport",
      value: "Période couverte (ex. Année 2025)",
      details: "Résumé du rapport",
      titlePh: "Ex. Rapport d’activités",
      valuePh: "Ex. Année 2025",
      detailsPh: "Points clés…",
    },
    propositions: {
      title: "Titre de la proposition",
      value: "Catégorie (ex. Vie étudiante, Sport…)",
      details: "Description de la proposition",
      titlePh: "Ex. Créer un club de lecture",
      valuePh: "Ex. Vie étudiante",
      detailsPh: "Explique l’idée et ce qu’elle apporterait…",
    },
    sondages: {
      title: "Question posée aux étudiants",
      value: "Statut du sondage (Ouvert ou Fermé)",
      details: "Explication du sondage",
      titlePh: "Ex. Quel jour préférez-vous pour l’assemblée ?",
      valuePh: "Ex. Ouvert",
      detailsPh: "Pourquoi ce sondage, jusqu’à quand…",
    },
  };
  return map[section];
};

export function AdminEditableSectionPanel({ section }: { section: EditableSectionKey }) {
  const labels = fieldLabelsFor(section);

  const [document, setDocument] = useState<EditableSectionDocument>(editableSectionDefaults[section]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        if (active) {
          setDocument(editableSectionDefaults[section]);
          setError("La connexion à Supabase n’est pas configurée.");
          setLoading(false);
        }
        return;
      }
      const { data, error: loadError } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", sectionSettingKey(section))
        .maybeSingle();
      if (!active) return;
      if (loadError) {
        setError("Vérifie les règles de contenu du fichier supabase/setup_admin_sections.sql.");
        setDocument(editableSectionDefaults[section]);
      } else {
        setDocument(
          data
            ? normalizeEditableSectionDocument(section, data.value)
            : editableSectionDefaults[section],
        );
      }
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [section]);

  function updateItem(
    index: number,
    field: "title" | "value" | "details" | "image",
    value: string,
  ) {
    setDocument((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function importImage(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Image invalide. Utilise JPG, PNG, WebP ou AVIF (5 Mo max).");
      event.target.value = "";
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateItem(index, "image", reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function addItem() {
    setDocument((current) => ({
      ...current,
      items: [
        ...current.items,
        { id: crypto.randomUUID(), title: "", value: "", details: "", image: "" },
      ],
    }));
  }

  function removeItem(id: string) {
    setDocument((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("La connexion à Supabase n’est pas configurée.");
      setBusy(false);
      return;
    }

    const resolvedItems = [];
    for (const item of document.items) {
      let image = item.image?.trim() || undefined;
      if (image?.startsWith("data:")) {
        const upload = await persistAnnouncementImage(supabase, image);
        if (!upload.ok) {
          setError(upload.error);
          setBusy(false);
          return;
        }
        image = upload.url;
      }
      resolvedItems.push({
        ...item,
        title: item.title.trim(),
        value: item.value.trim(),
        details: item.details.trim(),
        image,
      });
    }

    const value: EditableSectionDocument = {
      intro: document.intro.trim(),
      items: resolvedItems,
    };

    const { error: saveError } = await supabase.from("site_settings").upsert(
      {
        key: sectionSettingKey(section),
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    setBusy(false);
    if (saveError) {
      setError("Enregistrement refusé. Vérifie les droits d’administration et le script SQL.");
      return;
    }
    setDocument(value);
    setNotice("Modifications enregistrées.");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Contenu du site</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">
          {editableSectionTitles[section]}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Saisis les informations officielles de cette rubrique. Pour les photos (bureau, médias),
          choisis un fichier depuis ton ordinateur. Les images sont envoyées au stockage sécurisé
          lors de l’enregistrement.
        </p>
        {loading && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            Chargement des informations…
          </p>
        )}
      </div>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <label className="block text-sm font-medium">
          Présentation
          <textarea
            rows={3}
            maxLength={800}
            value={document.intro}
            onChange={(event) =>
              setDocument((current) => ({ ...current, intro: event.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-border p-3"
          />
        </label>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold">Éléments de cette rubrique</h2>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-istin-blue/30 px-3 py-2 text-sm font-semibold text-istin-blue hover:bg-istin-blue/5"
            >
              Ajouter un élément
            </button>
          </div>

          {document.items.map((item, index) => (
            <article
              key={item.id}
              className="grid gap-3 rounded-xl border border-border bg-slate-50 p-4 sm:grid-cols-2"
            >
              <label className="block text-sm font-medium">
                {labels.title}
                <input
                  value={item.title}
                  onChange={(event) => updateItem(index, "title", event.target.value)}
                  maxLength={140}
                  placeholder={labels.titlePh}
                  className="field-control mt-1"
                />
              </label>
              <label className="block text-sm font-medium">
                {labels.value}
                <input
                  value={item.value}
                  onChange={(event) => updateItem(index, "value", event.target.value)}
                  maxLength={120}
                  placeholder={labels.valuePh}
                  className="field-control mt-1"
                />
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                {labels.details}
                <textarea
                  value={item.details}
                  onChange={(event) => updateItem(index, "details", event.target.value)}
                  maxLength={600}
                  rows={2}
                  placeholder={labels.detailsPh}
                  className="field-control mt-1 min-h-[4.5rem]"
                />
              </label>

              <div className="space-y-2 sm:col-span-2">
                <p className="text-sm font-medium">Photo (facultatif)</p>
                {item.image ? (
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow">
                    <Image
                      src={item.image}
                      alt={item.title || "Aperçu"}
                      fill
                      unoptimized={item.image.startsWith("data:")}
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Aucune photo sélectionnée.</p>
                )}
                <label className="block text-xs font-medium text-muted-foreground">
                  Choisir une image sur l’ordinateur · JPG, PNG, WebP ou AVIF · 5 Mo max
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={(event) => importImage(index, event)}
                    className="mt-1 block w-full text-sm"
                  />
                </label>
                {item.image && (
                  <button
                    type="button"
                    onClick={() => updateItem(index, "image", "")}
                    className="text-xs font-semibold text-istin-red hover:underline"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg border border-istin-red/30 px-3 py-2 text-xs font-semibold text-istin-red hover:bg-red-50"
                >
                  Retirer cet élément
                </button>
              </div>
            </article>
          ))}

          {!document.items.length && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Aucune information enregistrée dans cette rubrique.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          >
            {notice}
          </p>
        )}
        <button disabled={busy || loading} className="btn btn-primary disabled:opacity-50">
          {busy ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </form>
    </section>
  );
}

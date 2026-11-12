"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadStudentAvatar, STUDENT_AVATAR_BUCKET } from "@/lib/supabase/avatars";

export function StudentProfileForm({
  userId,
  email,
  initialName,
  initialProgram = "",
  initialYear = "",
  initialAvatar = "",
  initialAvatarPreview = "",
  initialPreferences,
}: {
  userId: string;
  email: string;
  initialName: string;
  initialProgram?: string;
  initialYear?: string;
  initialAvatar?: string;
  initialAvatarPreview?: string;
  initialPreferences?: { event_reminders?: boolean; important_announcements?: boolean };
}) {
  const [name, setName] = useState(initialName);
  const [program, setProgram] = useState(initialProgram);
  const [year, setYear] = useState(initialYear);
  const [avatarReference, setAvatarReference] = useState(initialAvatar);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarPreview || initialAvatar);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [reminders, setReminders] = useState(initialPreferences?.event_reminders ?? true);
  const [announcements, setAnnouncements] = useState(
    initialPreferences?.important_announcements ?? true,
  );
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError(true);
      setNotice("Formats acceptés : JPG, PNG, WebP, AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(true);
      setNotice("La photo doit faire 5 Mo maximum.");
      return;
    }
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError(false);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setBusy(false);
      setError(true);
      setNotice("La connexion à la base de données est indisponible.");
      return;
    }

    let avatarUrl = avatarReference;
    let uploadedAvatarPath: string | null = null;
    let uploadedAvatarPreview = "";
    if (selectedPhoto) {
      const uploaded = await uploadStudentAvatar(supabase, userId, selectedPhoto);
      if (!uploaded.ok) {
        setBusy(false);
        setError(true);
        console.error("Échec de l’envoi de la photo de profil :", uploaded.error);
        setNotice("Envoi de la photo refusé. Vérifie que le stockage des photos de profil est configuré.");
        return;
      }
      avatarUrl = uploaded.path;
      uploadedAvatarPath = uploaded.path;
      uploadedAvatarPreview = uploaded.signedUrl;
    }

    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        program: program.trim() || null,
        study_year: year.trim() || null,
        avatar_url: avatarUrl || null,
        notification_prefs: {
          event_reminders: reminders,
          important_announcements: announcements,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (saveError) {
      if (uploadedAvatarPath) {
        const { error: cleanupError } = await supabase.storage
          .from(STUDENT_AVATAR_BUCKET)
          .remove([uploadedAvatarPath]);
        if (cleanupError) console.error("Impossible de nettoyer la photo non enregistrée :", cleanupError.message);
      }
      setBusy(false);
      setError(true);
      setNotice("Le profil n’a pas pu être enregistré. Vérifie que setup_platform_features.sql a été exécuté.");
      return;
    }

    const previousAvatarPath = avatarReference.startsWith(userId + "/") ? avatarReference : null;
    if (previousAvatarPath && uploadedAvatarPath && previousAvatarPath !== uploadedAvatarPath) {
      const { error: cleanupError } = await supabase.storage
        .from(STUDENT_AVATAR_BUCKET)
        .remove([previousAvatarPath]);
      if (cleanupError) console.error("Impossible de nettoyer l’ancienne photo :", cleanupError.message);
    }

    if (uploadedAvatarPath) {
      setAvatarReference(uploadedAvatarPath);
      setAvatarPreview(uploadedAvatarPreview);
      setSelectedPhoto(null);
    }
    setBusy(false);
    setError(false);
    setNotice("Profil enregistré.");
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Photo de profil"
              fill
              unoptimized={avatarPreview.startsWith("data:")}
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <span className="grid h-full place-items-center text-xs text-muted-foreground">Photo</span>
          )}
        </div>
        <label className="text-sm font-medium">
          Photo (facultatif)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={onPhoto}
            className="mt-1 block w-full text-sm"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Nom complet
        <input
          placeholder="Ex. Amina Nguema"
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-11 w-full rounded-lg border border-border px-3"
        />
      </label>

      <label className="block text-sm font-medium">
        Adresse e-mail
        <input
          type="email"
          readOnly
          value={email}
          className="mt-1 h-11 w-full rounded-lg border border-border bg-muted px-3 text-muted-foreground"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Pour modifier cette adresse, contacte le bureau de la mutuelle.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Filière / formation
          <input
            placeholder="Ex. Génie logiciel"
            maxLength={120}
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-border px-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Année d’étude
          <input
            placeholder="Ex. Licence 2"
            maxLength={40}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-border px-3"
          />
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Préférences de notification</legend>
        <label className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 p-4 text-sm">
          <span>Rappels des événements</span>
          <input
            type="checkbox"
            checked={reminders}
            onChange={(e) => setReminders(e.target.checked)}
            className="h-5 w-5 accent-istin-blue"
          />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 p-4 text-sm">
          <span>Annonces importantes</span>
          <input
            type="checkbox"
            checked={announcements}
            onChange={(e) => setAnnouncements(e.target.checked)}
            className="h-5 w-5 accent-istin-blue"
          />
        </label>
      </fieldset>

      {notice && (
        <p
          role={error ? "alert" : "status"}
          className={"rounded-lg p-3 text-sm " + (error ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900")}
        >
          {notice}
        </p>
      )}
      <button disabled={busy} className="btn btn-primary disabled:opacity-60">
        {busy ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </form>
  );
}

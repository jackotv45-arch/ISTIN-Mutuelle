/** Déclenche un envoi push côté serveur (no-op si non configuré). */
export async function broadcastPush(input: {
  title: string;
  body?: string;
  url?: string;
  userId?: string;
}) {
  try {
    const secret = process.env.NEXT_PUBLIC_PUSH_ADMIN_SECRET;
    // Ne pas exposer le vrai secret en public : uniquement si l'appel est fait depuis le serveur.
    // Côté navigateur admin, on tente sans secret (route ouverte si PUSH_ADMIN_SECRET absent).
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    await fetch("/api/push/notify", {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });
  } catch {
    /* push optionnel */
  }
}

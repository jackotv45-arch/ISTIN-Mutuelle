/** Déclenche un envoi push via la route serveur authentifiée. */
export async function broadcastPush(input: {
  title: string;
  body?: string;
  url?: string;
  userId?: string;
}) {
  try {
    await fetch("/api/push/notify", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    /* Push optionnel; la notification in-app est déjà enregistrée. */
  }
}

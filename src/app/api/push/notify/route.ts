import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Body = {
  title?: string;
  body?: string;
  url?: string;
  userId?: string;
};

export async function POST(request: Request) {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@istin-mutuelle.local";

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { ok: false, error: "VAPID non configuré (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)." },
      { status: 503 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur (variable privée Vercel, jamais NEXT_PUBLIC_*).",
      },
      { status: 503 },
    );
  }

  let payload: Body;
  try {
    payload = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide." }, { status: 400 });
  }

  const title = payload.title?.trim() || "ISTIN MUTUELLE";
  const body = payload.body?.trim() || "";
  const url = payload.url?.trim() || "/espace/notifications";

  const adminSecret = process.env.PUSH_ADMIN_SECRET?.trim();
  if (adminSecret) {
    const header = request.headers.get("x-push-secret");
    if (header !== adminSecret) {
      return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
    }
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = admin.from("push_subscriptions").select("id,endpoint,p256dh,auth,user_id");
  if (payload.userId) query = query.eq("user_id", payload.userId);
  const { data: subs, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!subs?.length) {
    return NextResponse.json({ ok: true, sent: 0, message: "Aucun abonnement push." });
  }

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    return NextResponse.json(
      { ok: false, error: "Paquet web-push absent. Lance npm install web-push." },
      { status: 500 },
    );
  }

  webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);

  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body, url }),
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) stale.push(sub.id);
      }
    }),
  );

  if (stale.length) {
    await admin.from("push_subscriptions").delete().in("id", stale);
  }

  return NextResponse.json({ ok: true, sent, cleaned: stale.length });
}

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  title?: string;
  body?: string;
  url?: string;
  userId?: string;
  userIds?: string[];
  notificationIds?: string[];
  deliverPendingWelcome?: boolean;
};

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function matchesPushSecret(candidate: string, expected: string) {
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes);
}

export async function POST(request: Request) {
  const pushSecret = process.env.PUSH_DISPATCH_SECRET?.trim();
  const suppliedSecret = request.headers.get("x-push-secret") ?? "";
  const internalCall = Boolean(pushSecret && matchesPushSecret(suppliedSecret, pushSecret));
  let callerId: string | null = null;

  if (!internalCall) {
    const sessionClient = await createSupabaseServerClient();
    if (!sessionClient) {
      return NextResponse.json({ ok: false, error: "Supabase non configuré." }, { status: 503 });
    }
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Authentification requise." }, { status: 401 });
    }
    callerId = user.id;
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
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, error: "Le corps doit être un objet JSON." }, { status: 400 });
  }
  if (
    (payload.title !== undefined && typeof payload.title !== "string") ||
    (payload.body !== undefined && typeof payload.body !== "string") ||
    (payload.url !== undefined && typeof payload.url !== "string") ||
    (payload.userId !== undefined && typeof payload.userId !== "string") ||
    (payload.userIds !== undefined && (!Array.isArray(payload.userIds) || payload.userIds.some((id) => typeof id !== "string"))) ||
    (payload.notificationIds !== undefined && (!Array.isArray(payload.notificationIds) || payload.notificationIds.some((id) => typeof id !== "string"))) ||
    (payload.deliverPendingWelcome !== undefined && typeof payload.deliverPendingWelcome !== "boolean")
  ) {
    return NextResponse.json({ ok: false, error: "Format de notification invalide." }, { status: 400 });
  }
  if (payload.userId && payload.userIds) {
    return NextResponse.json({ ok: false, error: "Choisis userId ou userIds, pas les deux." }, { status: 400 });
  }
  const deliverPendingWelcome = payload.deliverPendingWelcome === true;
  if (deliverPendingWelcome && (
    internalCall || payload.title !== undefined || payload.body !== undefined || payload.url !== undefined ||
    payload.userId !== undefined || payload.userIds !== undefined || payload.notificationIds !== undefined
  )) {
    return NextResponse.json({ ok: false, error: "Demande de bienvenue en attente invalide." }, { status: 400 });
  }
  if (payload.notificationIds && !internalCall) {
    return NextResponse.json({ ok: false, error: "Identifiants de notification réservés au serveur." }, { status: 400 });
  }
  let targetUserIds = payload.userIds ?? (payload.userId ? [payload.userId] : null);
  let notificationIds = payload.notificationIds ?? null;
  if (targetUserIds && (targetUserIds.length === 0 || targetUserIds.length > 5000)) {
    return NextResponse.json({ ok: false, error: "Nombre de destinataires invalide." }, { status: 400 });
  }
  if (notificationIds && (notificationIds.length === 0 || notificationIds.length > 5000)) {
    return NextResponse.json({ ok: false, error: "Nombre de notifications invalide." }, { status: 400 });
  }
  if (targetUserIds?.some((id) => !USER_ID_PATTERN.test(id))) {
    return NextResponse.json({ ok: false, error: "Identifiant utilisateur invalide." }, { status: 400 });
  }
  if (notificationIds?.some((id) => !USER_ID_PATTERN.test(id))) {
    return NextResponse.json({ ok: false, error: "Identifiant de notification invalide." }, { status: 400 });
  }
  if (internalCall && (!targetUserIds || !notificationIds)) {
    return NextResponse.json({ ok: false, error: "Les envois internes doivent préciser leurs notifications et destinataires." }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let isAdmin = false;
  if (!internalCall && callerId) {
    const { data: roles, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["admin", "superadmin"])
      .limit(1);
    if (roleError) {
      return NextResponse.json({ ok: false, error: "Vérification du rôle impossible." }, { status: 500 });
    }
    isAdmin = Boolean(roles?.length);
    if (!isAdmin && !deliverPendingWelcome) {
      return NextResponse.json({ ok: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }
  }

  let title = payload.title?.trim() || "ISTIN MUTUELLE";
  let body = payload.body?.trim() || "";
  let destination = payload.url?.trim() || "/espace/notifications";
  if (deliverPendingWelcome && callerId) {
    const { data: welcome, error: welcomeError } = await admin
      .from("notifications")
      .select("id,title,body,link")
      .eq("user_id", callerId)
      .eq("type", "account_welcome")
      .eq("is_read", false)
      .is("push_sent_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (welcomeError) {
      return NextResponse.json({ ok: false, error: "Notification de bienvenue indisponible." }, { status: 500 });
    }
    if (!welcome) {
      return NextResponse.json({ ok: true, sent: 0, message: "Aucun message de bienvenue en attente." });
    }
    title = welcome.title;
    body = welcome.body ?? "";
    destination = welcome.link ?? "/espace/notifications";
    targetUserIds = [callerId];
    notificationIds = [welcome.id];
  }

  if (title.length > 150 || body.length > 1000) {
    return NextResponse.json({ ok: false, error: "Titre ou message trop long." }, { status: 400 });
  }
  let target: URL;
  try {
    target = new URL(destination, request.url);
  } catch {
    return NextResponse.json({ ok: false, error: "Lien de notification invalide." }, { status: 400 });
  }
  if (target.origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "Le lien doit rester sur le site." }, { status: 400 });
  }
  const url = `${target.pathname}${target.search}${target.hash}`;

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@istin-mutuelle.local";
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { ok: false, error: "VAPID non configuré (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)." },
      { status: 503 },
    );
  }

  let query = admin.from("push_subscriptions").select("id,endpoint,p256dh,auth,user_id");
  if (targetUserIds) query = query.in("user_id", targetUserIds);
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

  try {
    webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);
  } catch {
    return NextResponse.json({ ok: false, error: "Configuration VAPID invalide." }, { status: 503 });
  }

  const results = await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body, url }),
        );
        return { status: "sent" as const, userId: sub.user_id };
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) return { status: "stale" as const, staleId: sub.id };
        return { status: "failed" as const };
      }
    }),
  );

  const stale = results.flatMap((result) => result.status === "stale" ? [result.staleId] : []);
  if (stale.length) {
    await admin.from("push_subscriptions").delete().in("id", stale);
  }

  const sentUserIds = [...new Set(results.flatMap((result) => result.status === "sent" ? [result.userId] : []))];
  if (notificationIds?.length && sentUserIds.length) {
    await admin
      .from("notifications")
      .update({ push_sent_at: new Date().toISOString() })
      .in("id", notificationIds)
      .in("user_id", sentUserIds);
  }

  return NextResponse.json({
    ok: true,
    sent: results.filter((result) => result.status === "sent").length,
    failed: results.filter((result) => result.status === "failed").length,
    cleaned: stale.length,
  });
}

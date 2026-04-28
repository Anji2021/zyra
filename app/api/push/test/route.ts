import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import webpush from "web-push";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function POST() {
  try {
    const { url, anonKey, isConfigured } = getSupabasePublicEnv();
    if (!isConfigured) {
      return Response.json({ error: "App is not fully configured." }, { status: 503 });
    }

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
    const vapidSubject = process.env.VAPID_SUBJECT?.trim();
    if (!vapidPublic || !vapidPrivate || !vapidSubject) {
      console.error("[api/push/test] missing VAPID env vars");
      return Response.json({ error: "Push is not configured yet." }, { status: 503 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* session refresh from Route Handler */
          }
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.error("[api/push/test] auth", authError.message);
    }
    if (!user) {
      return Response.json({ error: "Sign in to send test notifications." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) {
      console.error("[api/push/test] select push_subscriptions:", error.message);
      return Response.json({ error: "Could not send test notification." }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return Response.json({ error: "Enable push reminders first." }, { status: 400 });
    }

    const sub = data[0] as PushSubscriptionRow;
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const payload = JSON.stringify({
      title: "Zyra Reminder",
      body: "Your push notifications are working.",
      url: "/app/reminders",
    });

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      payload,
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/push/test] send failed:", error);
    return Response.json({ error: "Could not send test notification." }, { status: 500 });
  }
}

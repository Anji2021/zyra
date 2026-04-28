import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

type ReminderRow = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  reminder_date: string | null;
  reminder_time: string | null;
  is_active: boolean | null;
};

type PushSubscriptionRow = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  updated_at: string;
};

function getCronSecretFromRequest(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return (request.headers.get("x-cron-secret") ?? "").trim();
}

function nowParts() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return {
    today: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
    dayStartIso: new Date(yyyy, Number(mm) - 1, Number(dd), 0, 0, 0, 0).toISOString(),
    dayEndIso: new Date(yyyy, Number(mm) - 1, Number(dd), 23, 59, 59, 999).toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local",
  };
}

function normalizeTimeHHmm(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Handle values like "13:45:00" from Postgres time columns.
  const parts = trimmed.split(":");
  if (parts.length < 2) return null;
  const hh = parts[0]?.padStart(2, "0");
  const mm = parts[1]?.padStart(2, "0");
  if (!hh || !mm) return null;
  return `${hh}:${mm}`;
}

async function handleCron(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret) {
    console.error("[api/cron/send-reminders] missing CRON_SECRET");
    return Response.json({ error: "Cron is not configured." }, { status: 503 });
  }
  if (getCronSecretFromRequest(request) !== expectedSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isConfigured || !serviceRoleKey) {
    console.error("[api/cron/send-reminders] missing supabase env config");
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  const vapidSubject = process.env.VAPID_SUBJECT?.trim();
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    console.error("[api/cron/send-reminders] missing VAPID env vars");
    return Response.json({ error: "Push is not configured." }, { status: 503 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = createClient(url, serviceRoleKey);
  const { today, time, dayStartIso, dayEndIso, timezone } = nowParts();
  console.log("[api/cron/send-reminders] server_now", {
    server_date: today,
    server_time: time,
    timezone_assumption: timezone,
  });

  const { data: reminders, error: remindersError } = await supabase
    .from("reminders")
    .select("id,user_id,title,message,reminder_date,reminder_time,is_active")
    .eq("is_active", true);
  if (remindersError) {
    console.error("[api/cron/send-reminders] reminders.select:", remindersError.message);
    return Response.json({ error: "Failed to fetch reminders." }, { status: 500 });
  }

  const activeReminders = (reminders ?? []) as ReminderRow[];
  console.log("[api/cron/send-reminders] active_reminders_fetched", activeReminders.length);

  const dueReminders: ReminderRow[] = [];
  for (const reminder of activeReminders) {
    const reminderDate = reminder.reminder_date?.trim() ?? "";
    const reminderTime = normalizeTimeHHmm(reminder.reminder_time);

    let isDue = false;
    if (reminderDate) {
      if (reminderDate < today) {
        isDue = true;
      } else if (reminderDate === today) {
        isDue = reminderTime ? reminderTime <= time : true;
      }
    }

    console.log("[api/cron/send-reminders] reminder_due_check", {
      reminder_id: reminder.id,
      reminder_date: reminder.reminder_date,
      reminder_time: reminder.reminder_time,
      normalized_time: reminderTime,
      is_due: isDue,
    });

    if (isDue) {
      dueReminders.push(reminder);
    }
  }

  if (dueReminders.length === 0) {
    return Response.json({ ok: true, processed: 0, pushed: 0, notifications_created: 0 });
  }

  const userIds = Array.from(new Set(dueReminders.map((r) => r.user_id)));
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("user_id,endpoint,p256dh,auth,updated_at")
    .in("user_id", userIds)
    .order("updated_at", { ascending: false });
  if (subscriptionsError) {
    console.error("[api/cron/send-reminders] push_subscriptions.select:", subscriptionsError.message);
    return Response.json({ error: "Failed to fetch push subscriptions." }, { status: 500 });
  }

  const latestSubByUser = new Map<string, PushSubscriptionRow>();
  for (const row of (subscriptions ?? []) as PushSubscriptionRow[]) {
    if (!latestSubByUser.has(row.user_id)) {
      latestSubByUser.set(row.user_id, row);
    }
  }

  let pushed = 0;
  let notificationsCreated = 0;
  for (const reminder of dueReminders) {
    const dedupeType = `reminder:${reminder.id}:${today}`;
    const body = reminder.message?.trim() || "You have a Zyra reminder.";

    const { data: existingRows, error: existingError } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", reminder.user_id)
      .eq("type", dedupeType)
      .gte("created_at", dayStartIso)
      .lte("created_at", dayEndIso)
      .limit(1);
    if (existingError) {
      console.error("[api/cron/send-reminders] notifications.select:", existingError.message);
      continue;
    }
    if ((existingRows ?? []).length > 0) {
      continue;
    }

    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: reminder.user_id,
      title: reminder.title,
      message: body,
      type: dedupeType,
      is_read: false,
    });
    if (insertError) {
      console.error("[api/cron/send-reminders] notifications.insert:", insertError.message);
      continue;
    }
    notificationsCreated += 1;

    const sub = latestSubByUser.get(reminder.user_id);
    if (!sub) {
      continue;
    }
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: reminder.title,
          body,
          url: "/app/reminders",
        }),
      );
      pushed += 1;
    } catch (error) {
      console.error("[api/cron/send-reminders] web-push send failed:", error);
    }
  }

  return Response.json({
    ok: true,
    processed: dueReminders.length,
    pushed,
    notifications_created: notificationsCreated,
  });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

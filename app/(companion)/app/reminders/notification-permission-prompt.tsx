"use client";

import { useEffect, useState } from "react";
import { base64UrlToUint8Array } from "@/lib/notifications/vapid";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "notifications_enabled";

export function NotificationPermissionPrompt() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  async function refreshSubscriptionStatus() {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!supported || permission !== "granted") {
      setHasSubscription(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (!sub?.endpoint) {
        setHasSubscription(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHasSubscription(false);
        return;
      }

      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint")
        .eq("user_id", user.id)
        .eq("endpoint", sub.endpoint)
        .limit(1);
      if (error) {
        console.error("[notifications] check push_subscriptions:", error.message);
        setHasSubscription(false);
        return;
      }
      setHasSubscription((data ?? []).length > 0);
    } catch (err) {
      console.error("[notifications] refreshSubscriptionStatus failed:", err);
      setHasSubscription(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSupported = "Notification" in window;
    setSupported(isSupported);
    if (!isSupported) return;
    setPermission(Notification.permission);
    setPushEnabled(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    void refreshSubscriptionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, permission, pushEnabled]);

  async function requestPermission() {
    if (!supported || permission !== "default" || requesting) return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        localStorage.setItem(STORAGE_KEY, "true");
        setPushEnabled(true);
      }
    } catch (err) {
      console.error("[notifications] requestPermission failed:", err);
    } finally {
      setRequesting(false);
    }
  }

  async function enablePushReminders() {
    if (!supported || permission !== "granted" || enablingPush) return;
    setEnablingPush(true);
    setStatusMessage(null);
    try {
      if (!("serviceWorker" in navigator)) {
        setStatusMessage("Push is not supported in this browser.");
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
      if (!vapidPublicKey) {
        setStatusMessage("Push is not configured yet. Please try again later.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(vapidPublicKey) as BufferSource,
        }));

      const json = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        setStatusMessage("Could not read push subscription keys.");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("[notifications] getUser error:", userError.message);
      }
      if (!user) {
        setStatusMessage("Sign in again to enable push reminders.");
        return;
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

      if (error) {
        console.error("[notifications] push_subscriptions upsert error:", error.message);
        setStatusMessage("Something went wrong. Please try again.");
        return;
      }

      localStorage.setItem(STORAGE_KEY, "true");
      setPushEnabled(true);
      setStatusMessage("Push reminders enabled");
      setHasSubscription(true);
    } catch (err) {
      console.error("[notifications] enablePushReminders failed:", err);
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setEnablingPush(false);
    }
  }

  async function sendTestNotification() {
    if (permission !== "granted") {
      setStatusMessage("Notifications are blocked in your browser settings.");
      return;
    }
    if (!hasSubscription) {
      setStatusMessage("Enable push reminders first.");
      return;
    }
    setSendingTest(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const msg = data.error ?? "Could not send test notification.";
        setStatusMessage(msg);
        if (msg === "Could not send test notification.") {
          console.error("[notifications] test push failed");
        }
        return;
      }
      if (typeof window !== "undefined" && Notification.permission === "granted") {
        new Notification("Zyra Reminder", {
          body: "Your push notifications are working.",
        });
      }
      setStatusMessage("Test notification sent.");
    } catch (err) {
      console.error("[notifications] test push request failed:", err);
      setStatusMessage("Could not send test notification.");
    } finally {
      setSendingTest(false);
    }
  }

  if (!supported) {
    return null;
  }

  if (permission === "granted" && pushEnabled) {
    return (
      <div className="rounded-xl border border-border/70 bg-soft-rose/15 px-3 py-3 text-sm sm:rounded-2xl sm:px-4">
        <p className="text-foreground">Push reminders enabled</p>
        {hasSubscription ? (
          <button
            type="button"
            onClick={() => void sendTestNotification()}
            disabled={sendingTest}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            {sendingTest ? "Sending…" : "Send test notification"}
          </button>
        ) : (
          <p className="mt-2 text-xs text-muted">Enable push reminders first.</p>
        )}
        {statusMessage ? <p className="mt-2 text-xs text-muted">{statusMessage}</p> : null}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-xl border border-border/70 bg-soft-rose/15 px-3 py-3 text-sm sm:rounded-2xl sm:px-4">
        <p className="text-muted">
          Browser notifications are blocked. You can re-enable them in browser settings.
        </p>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="rounded-xl border border-border/70 bg-soft-rose/15 px-3 py-3 text-sm sm:rounded-2xl sm:px-4">
        <p className="text-foreground">Enable push reminders in this browser?</p>
        <button
          type="button"
          onClick={() => void enablePushReminders()}
          disabled={enablingPush}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        >
          {enablingPush ? "Enabling…" : "Enable push reminders"}
        </button>
        {hasSubscription ? (
          <button
            type="button"
            onClick={() => void sendTestNotification()}
            disabled={sendingTest}
            className="ml-2 mt-2 inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            {sendingTest ? "Sending…" : "Send test notification"}
          </button>
        ) : null}
        {statusMessage ? <p className="mt-2 text-xs text-muted">{statusMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-soft-rose/15 px-3 py-3 text-sm sm:rounded-2xl sm:px-4">
      <p className="text-foreground">Allow Zyra to send you reminders?</p>
      <button
        type="button"
        onClick={() => void requestPermission()}
        disabled={requesting}
        className="mt-2 inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
      >
        {requesting ? "Requesting…" : "Allow Notifications"}
      </button>
    </div>
  );
}

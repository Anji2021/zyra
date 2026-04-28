self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[sw] push received");
  let data = {};
  if (event.data) {
    try {
      data = event.data ? event.data.json() : {};
    } catch {
      data = {};
    }
  }

  const parsed = typeof data === "object" && data !== null ? data : {};
  const title = typeof parsed.title === "string" && parsed.title ? parsed.title : "Zyra Reminder";
  const options = {
    body:
      typeof parsed.body === "string" && parsed.body
        ? parsed.body
        : "You have a reminder from Zyra.",
    icon: "/zyra-icon.png",
    badge: "/zyra-icon.png",
    data: {
      url:
        typeof parsed.url === "string" && parsed.url
          ? parsed.url
          : "/app/reminders",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app/reminders";
  event.waitUntil(
    clients.openWindow(url),
  );
});

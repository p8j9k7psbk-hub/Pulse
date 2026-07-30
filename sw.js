self.addEventListener("push", (event) => {
  let message = {
    title: "Rune",
    body: "你有一个新的提醒。",
    url: "/Rune/",
  };

  if (event.data) {
    try {
      message = { ...message, ...event.data.json() };
    } catch {
      message.body = event.data.text() || message.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: "/Rune/pulse-icon-claude.png",
      badge: "/Rune/pulse-icon-claude.png",
      tag: `rune-reminder-${Date.now()}`,
      data: { url: message.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const existing = windows.find((windowClient) =>
          windowClient.url.includes("/Rune/"),
        );
        if (existing) return existing.focus();
        return clients.openWindow(event.notification.data?.url || "/Rune/");
      }),
  );
});

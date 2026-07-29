self.addEventListener("push", (event) => {
  event.waitUntil(self.registration.showNotification("Rune", {
    body: "你有一个新的提醒。",
    icon: "./pulse-icon-claude.png",
    badge: "./pulse-icon-claude.png",
    tag: "rune-reminder",
    data: { url: "./" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows[0];
    if (existing) return existing.focus();
    return clients.openWindow(event.notification.data?.url || "./");
  }));
});

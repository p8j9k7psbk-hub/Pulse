// 后端推送的负载形如 { title, body, url }。
// 之前这里忽略了 event.data，导致每条提醒都显示成同一句占位文案。
self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      try {
        payload = { body: event.data.text() };
      } catch {
        payload = {};
      }
    }
  }
  const title = payload.title || "Rune";
  const body = payload.body || "你有一个新的提醒。";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "./pulse-icon-claude.png",
    badge: "./pulse-icon-claude.png",
    // 每条提醒用不同的 tag，否则后到的会把前一条顶掉
    tag: `rune-reminder-${payload.id || Date.now()}`,
    data: { url: payload.url || "./" },
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

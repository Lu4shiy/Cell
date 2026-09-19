// ======================================================
// Cell — Service Worker (PWA)
// Кэширует статику Cell: HTML, CSS, JS, иконки.
// Не трогает запросы к Supabase, i.ibb.co и CDN.
// Стратегия: network-first с fallback на кэш.
// ======================================================

const CACHE_VERSION = "cell-v70";

const CACHE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./crypto.js",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json",
  "./manifest-monochrome.json",
  "./manifest-sea.json",
  "./manifest-fury.json",
  "./manifest-inverse.json",
  "./manifest-gradient.json",
  "./icons/icon-classic.svg",
  "./icons/icon-monochrome.svg",
  "./icons/icon-sea.svg",
  "./icons/icon-fury.svg",
  "./icons/icon-inverse.svg",
  "./icons/icon-gradient.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // 🔴 ВАЖНО: fetch(url, { cache: "reload" }) — обходим HTTP-кэш GitHub Pages.
      // Без этого браузер отдаёт SW старую версию файлов (у GH Pages max-age=600),
      // и после обновления приложение показывает старый код.
      return Promise.all(
        CACHE_FILES.map((url) =>
          fetch(url, { cache: "reload" })
            .then((res) => {
              if (!res || !res.ok) throw new Error("HTTP " + (res && res.status));
              return cache.put(url, res);
            })
            .catch((err) => {
              console.warn("[SW] Не удалось закэшировать:", url, err);
            })
        )
      );
    })
  );
  // ⚠️ НЕ вызываем self.skipWaiting() здесь.
  // Ждём, пока пользователь нажмёт «Перезагрузить» в плашке —
  // тогда из index.html придёт сообщение SKIP_WAITING.
  // Без этого новая версия молча подменяла старую при следующем запуске.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Слушаем сообщения от страницы.
// index.html отправляет { type: "SKIP_WAITING" }, когда пользователь
// нажал «Перезагрузить» в плашке обновления.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Только свой origin. Supabase, i.ibb.co, jsdelivr — пропускаем мимо.
  if (url.origin !== self.location.origin) return;

  // Сам SW и его файлы не кэшируем (иначе не сможет обновиться)
  if (url.pathname.endsWith("/sw.js")) return;

  // 🔴 stale-while-revalidate: сначала отдаём из кэша (мгновенно),
  // параллельно обновляем кэш в фоне. Так приложение и все его файлы
  // грузятся МГНОВЕННО на повторных заходах, а свежие версии подтянутся
  // через update-баннер (см. index.html + reg.update()).
  // Первый заход — идём в сеть (кэша нет).
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(req);

      const networkPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        // Не ждём сеть — отдаём из кэша немедленно.
        // networkPromise обновит кэш в фоне.
        event.waitUntil(networkPromise);
        return cached;
      }

      const fresh = await networkPromise;
      if (fresh) return fresh;
      return caches.match("./index.html");
    })
  );
});

// ======================================================
// WEB PUSH — фоновые уведомления
// ======================================================
// Срабатывает, когда наша Edge Function (в Supabase) отправит push
// на endpoint браузера. Браузер будит Service Worker и передаёт event
// с payload — мы показываем системное уведомление.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    try { data = { body: event.data && event.data.text() }; } catch (e2) {}
  }

  const title = data.title || "Cell";
  const body = data.body || "";
  const chatId = data.chatId || null;
  const tag = data.tag || ("cell-chat-" + (chatId || "unknown"));
  const iconUrl = data.icon || "icon-192.png";

  const notifOptions = {
    body: body,
    icon: iconUrl,
    badge: "icon-192.png",
    tag: tag,
    renotify: false,
    data: { chatId: chatId, url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, notifOptions));
});

// Срабатывает при клике на уведомление.
// Открывает (или фокусирует) окно приложения и передаёт chatId.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const chatId = event.notification.data && event.notification.data.chatId;
  const targetUrl = self.registration.scope;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Если есть открытое окно Cell — фокусируем его и шлём сообщение.
      for (const c of list) {
        if (c.url.startsWith(targetUrl)) {
          c.focus();
          if (chatId) {
            c.postMessage({ type: "OPEN_CHAT", chatId: chatId });
          }
          return;
        }
      }
      // Иначе открываем новое окно. chatId передаём через хэш URL.
      const url = chatId
        ? (targetUrl + "#open-chat=" + encodeURIComponent(chatId))
        : targetUrl;
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

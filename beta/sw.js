// ======================================================
// Cell — Service Worker (PWA)
// Кэширует статику Cell: HTML, CSS, JS, иконки.
// Не трогает запросы к Supabase, i.ibb.co и CDN.
// Стратегия: network-first с fallback на кэш.
// ======================================================

const CACHE_VERSION = "cell-beta-v25";

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
  event.waitUntil((async () => {
    let cache;
    try {
      cache = await caches.open(CACHE_VERSION);
    } catch (e) {
      // 🔴 CacheStorage может упасть (UnknownError, квота, повреждение).
      // Не роняем SW — он всё равно перехватит fetch и пойдёт в сеть.
      console.warn("[SW] caches.open failed on install:", e);
      return;
    }
    // 🔴 ВАЖНО: fetch(url, { cache: "reload" }) — обходим HTTP-кэш GitHub Pages.
    // Без этого браузер отдаёт SW старую версию файлов (у GH Pages max-age=600),
    // и после обновления приложение показывает старый код.
    await Promise.all(
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
  })());
  // ⚠️ НЕ вызываем self.skipWaiting() здесь.
  // Ждём, пока пользователь нажмёт «Перезагрузить» в плашке —
  // тогда из index.html придёт сообщение SKIP_WAITING.
  // Без этого новая версия молча подменяла старую при следующем запуске.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      );
    } catch (e) {
      console.warn("[SW] activate cleanup failed:", e);
    }
    try { self.clients.claim(); } catch (e) { /* silent */ }
  })());
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
  //
  // 🔴 ВСЕ операции с CacheStorage обёрнуты в try/catch: если кэш
  // повреждён/недоступен (UnknownError), SW не падает, а просто идёт
  // в сеть. Иначе браузер показывает «FetchEvent ... promise was rejected»
  // и страница может не загрузиться.
  event.respondWith((async () => {
    let cache = null;
    try {
      cache = await caches.open(CACHE_VERSION);
    } catch (e) {
      console.warn("[SW] caches.open failed on fetch:", e);
      try { return await fetch(req); }
      catch (e2) {
        try { return (await caches.match("./index.html")) || Response.error(); }
        catch (e3) { return Response.error(); }
      }
    }

    let cached = null;
    try { cached = await cache.match(req); } catch (e) { /* silent */ }

    const networkPromise = fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          try { cache.put(req, res.clone()); } catch (e) { /* silent */ }
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
    try { return (await caches.match("./index.html")) || Response.error(); }
    catch (e) { return Response.error(); }
  })());
});

// ======================================================
// WEB PUSH — фоновые уведомления
// ======================================================
// Срабатывает, когда наша Edge Function (в Supabase) отправит push
// на endpoint браузера. Браузер будит Service Worker и передаёт event
// с payload — мы показываем системное уведомление.
// Какой чат сейчас активен в открытом окне Cell.
// Обновляется через postMessage({type: "ACTIVE_CHAT", chatId}).
let activeChatId = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "ACTIVE_CHAT") {
    activeChatId = event.data.chatId || null;
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    try { data = { body: event.data && event.data.text() }; } catch (e2) {}
  }

  // 🔴 Формат уведомления:
  //   title = имя отправителя (кастомное или display_name)
  //   body  = текст сообщения
  // Android сам рисует имя приложения "Cell" самой верхней строчкой
  // (берёт из manifest.json). Поэтому дублировать "Cell" в title не нужно —
  // иначе Android покажет "от Cell" второй строкой.
  //
  // Совместимость: если Edge Function по старой версии прислал
  // title="Cell" и body="Ваня: текст" — распознаём и разбираем.
  const rawTitle = data.title || "";
  const rawBody = data.body || "";
  let title, body;
  if (rawTitle === "Cell" && rawBody.indexOf(": ") !== -1) {
    const idx = rawBody.indexOf(": ");
    title = rawBody.slice(0, idx);
    body = rawBody.slice(idx + 2);
  } else {
    title = rawTitle || "Cell";
    body = rawBody;
  }
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

  event.waitUntil((async () => {
    // 🔴 Показываем системное уведомление ТОЛЬКО если приложение полностью
    // скрыто (ни одно окно Cell не видимо на экране).
    //
    // Раньше дополнительно требовалось w.focused — но на мобильных
    // PWA focused часто false даже когда приложение прямо перед глазами,
    // из-за этого приходило и системное, и in-app уведомление одновременно,
    // а в открытом чате — вообще лишнее системное поверх тоста.
    try {
      const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
      const anyVisible = wins.some((w) => w.visibilityState === "visible");
      if (anyVisible) return;
    } catch (e) { /* silent */ }

    await self.registration.showNotification(title, notifOptions);
  })());
});

// Срабатывает при клике на уведомление.
// Открывает (или фокусирует) окно приложения и передаёт chatId.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const chatId = event.notification.data && event.notification.data.chatId;
  const targetUrl = self.registration.scope;

  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: "window", includeUncontrolled: true });

    // 🔴 Приоритет PWA (standalone): если у пользователя открыты
    // И вкладка браузера, И установленная PWA — обе делят один SW,
    // и клик по уведомлению раньше попадал в первую найденную.
    const pwaClient = list.find((c) =>
      c.url.startsWith(targetUrl) && c.displayMode === "standalone"
    );
    if (pwaClient) {
      await pwaClient.focus();
      if (chatId) pwaClient.postMessage({ type: "OPEN_CHAT", chatId });
      return;
    }

    // Иначе — любое другое окно Cell (вкладка браузера).
    const anyCellClient = list.find((c) => c.url.startsWith(targetUrl));
    if (anyCellClient) {
      await anyCellClient.focus();
      if (chatId) anyCellClient.postMessage({ type: "OPEN_CHAT", chatId });
      return;
    }

    // Ничего открытого — открываем новое окно. На Android Chrome
    // при установленной PWA это откроет именно PWA.
    const url = chatId
      ? (targetUrl + "#open-chat=" + encodeURIComponent(chatId))
      : targetUrl;
    if (clients.openWindow) return clients.openWindow(url);
  })());
});

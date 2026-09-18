// ======================================================
// Cell — Service Worker (PWA)
// Кэширует статику Cell: HTML, CSS, JS, иконки.
// Не трогает запросы к Supabase, i.ibb.co и CDN.
// Стратегия: network-first с fallback на кэш.
// ======================================================

const CACHE_VERSION = "cell-v12";

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
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // addAll упадёт целиком, если хотя бы один файл недоступен.
      // Поэтому кэшируем по одному — если что-то не загрузится, остальное всё равно закэшируется.
      return Promise.all(
        CACHE_FILES.map((url) =>
          cache.add(url).catch((err) => {
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

  // network-first: сначала пытаемся в сеть, при неудаче — из кэша.
  // Так пользователь всегда получает свежую версию, но при оффлайне
  // приложение всё равно открывается.
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Кэшируем успешный ответ (копию, чтобы не трогать оригинал)
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});

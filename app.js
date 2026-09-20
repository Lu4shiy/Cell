// ======================================================
// Imaginer
// ======================================================

// Трафик идёт через Cloudflare Worker (cell-proxy.zelenski-ivan10.workers.dev),
// чтобы обходить блокировки провайдеров. Воркер прозрачно проксирует
// REST + Auth + Storage + Realtime (WebSocket) в оригинальный Supabase.
const SUPABASE_URL = "https://uiktqkxfsoewjpgjpizf.supabase.co";
// Оригинальный домен Supabase — нужен, чтобы переписывать ссылки из ответов
// (signed URLs storage приходят с оригинального домена, а не с воркера).
const SUPABASE_ORIGIN = "https://uiktqkxfsoewjpgjpizf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3Rxa3hmc29ld2pwZ2pwaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODY5MjksImV4cCI6MjEwNDg2MjkyOX0.2OC3vrfusHK6Lqv1Yh5KfZ42Ypm02sE1XAloTSUxo2k";

// Переписывает URL с оригинального Supabase на наш воркер.
// Применяется ко всем signed URL из Storage — иначе они пойдут
// напрямую в Supabase и могут быть заблокированы провайдером.
function rewriteSupabaseUrl(u) {
  if (!u || typeof u !== "string") return u;
  if (u.startsWith(SUPABASE_ORIGIN)) return SUPABASE_URL + u.slice(SUPABASE_ORIGIN.length);
  return u;
}

// Разделяем сессии: обычная вкладка браузера и установленное PWA-приложение
// должны иметь независимые входы. Иначе они делят один localStorage и
// вход в одном окне затирает сессию в другом.
const isStandalonePWA =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: window-controls-overlay)").matches ||
  window.navigator.standalone === true;

const AUTH_STORAGE_KEY = isStandalonePWA ? "imaginer-auth-pwa" : "imaginer-auth";

import * as Crypto from "./crypto.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // localStorage — переживает закрытие PWA/вкладки.
    // sessionStorage стирался при выходе из приложения, из-за чего требовался повторный вход.
    storage: window.localStorage,
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Восстановление пароля: Supabase при возврате по ссылке из письма
// присылает событие PASSWORD_RECOVERY — показываем форму нового пароля
// и ПРЯЧЕМ приложение (иначе на фоне видны чаты чужого аккаунта).
supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    inRecoveryFlow = true;
    // Скрываем приложение и показываем экран входа как фон
    const appEl = document.getElementById("app-screen");
    const authEl = document.getElementById("auth-screen");
    if (appEl) appEl.classList.add("hidden");
    if (authEl) authEl.classList.remove("hidden");
    // Поверх всего — форма нового пароля
    const overlay = document.getElementById("reset-new-overlay");
    if (overlay) overlay.classList.remove("hidden");
  }
});

// Восстановление пароля. Проверяем hash СИНХРОННО, до того, как
// supabase-js успеет создать сессию и показать приложение.
// Формат ссылки: #access_token=...&type=recovery
const IS_RECOVERY_URL = /(?:[#&?])type=recovery(?:&|$)/.test(window.location.hash);
let inRecoveryFlow = IS_RECOVERY_URL;

const ACCENTS = ["orange", "blue", "green", "red", "purple", "pink", "teal", "gray"];
const ACCENT_COLORS = { orange:"#ff8c42",blue:"#2196f3",green:"#4caf50",red:"#f44336",purple:"#9c27b0",pink:"#e91e63",teal:"#009688",gray:"#607d8b" };
const BASE_AVATARS = [["#ff8c42","#ffb37a"],["#2196f3","#64b5f6"],["#4caf50","#81c784"],["#f44336","#ef9a9a"],["#9c27b0","#ce93d8"],["#e91e63","#f48fb1"],["#009688","#4db6ac"],["#607d8b","#90a4ae"]];
const REACTION_EMOJIS = ["👍","👎","❤️","🤣","🤮","🤯","🤬","😡","🎉","😅"];

// ---- Иконки Cell ----
// Активные (используются в UI). Отрисовываются через CSS-маску — красятся в currentColor.
const ICONS = {
  // === Сайдбар / глобальные ===
  menu:            "https://i.ibb.co/RTm827Y2/icons8-menu-100.png",
  plus:            "https://i.ibb.co/3mzyss3c/icons8-plus-100.png",
  settings:        "https://i.ibb.co/Nn163DW5/icons8-settings-100.png",
  info:            "https://i.ibb.co/MxdqLmhX/icons8-info-100.png",
  logout:          "https://i.ibb.co/Rk5CTKVf/icons8-logout-100.png",

  // === Общие (стрелки, крестик, точки, пин, поиск) ===
  cancel:          "https://i.ibb.co/chc6VshW/icons8-cancel-100.png",
  menuVertical:    "https://i.ibb.co/Mxt4KXGm/icons8-menu-vertical-100.png",
  pin:             "https://i.ibb.co/93q8mMsM/icons8-pin-100.png",
  search:          "https://i.ibb.co/Gf39Nbfw/icons8-search-100.png",
  left:            "https://i.ibb.co/TBsFzwsW/icons8-left-100.png",
  right:           "https://i.ibb.co/0j2T5pSF/icons8-right-100.png",
  down:            "https://i.ibb.co/N2CmnrTg/icons8-down-100.png",
  up:              "https://i.ibb.co/CpLH9d14/icons8-up-100.png",
  back:            "https://i.ibb.co/ZCqX2wv/icons8-back-100.png",
  forward:         "https://i.ibb.co/rRhqvpkp/icons8-forward-100.png",
  forwardArrow:    "https://i.ibb.co/FqVY25TM/icons8-forward-arrow-100.png",

  // === Composer / вложения ===
  attach:          "https://i.ibb.co/WWKScFby/icons8-attach-100.png",
  happy:           "https://i.ibb.co/MyFyBjCp/icons8-happy-100.png",
  sent:            "https://i.ibb.co/2YLJqjGy/icons8-sent-100.png",
  addFile:         "https://i.ibb.co/4yWy9LL/icons8-add-file-100.png",
  checkboxOff:     "https://i.ibb.co/GfgpKzW2/icons8-unchecked-checkbox-100.png",
  checkboxOn:      "https://i.ibb.co/VdVLWCy/icons8-checked-checkbox-100.png",

  // === Ссылки / инвайты ===
  external:        "https://i.ibb.co/DDYJBbmQ/icons8-external-link-100.png",
  copy:            "https://i.ibb.co/N6czDhg9/icons8-100.png",
  copyLink:        "https://i.ibb.co/jPxmYW92/icons8-100.png",
  addLink:         "https://i.ibb.co/SwgNs95x/icons8-add-link-100.png",
  deleteLink:      "https://i.ibb.co/0pBv1JBF/icons8-delete-link-1-100.png",
  share:           "https://i.ibb.co/gMCXfSQm/icons8-share-100.png",

  // === Медиа / файлы ===
  camera:          "https://i.ibb.co/cXDycp4t/icons8-camera-100.png",
  download:        "https://i.ibb.co/vCcf4z9T/icons8-download-100.png",
  upload:          "https://i.ibb.co/jvkhQgzC/icons8-upload-100.png",
  save:            "https://i.ibb.co/0j6zWPKB/icons8-save-100.png",
  eye:             "https://i.ibb.co/1Y5CtsFy/icons8-eye-100.png",

  // === Защита / статусы ===
  lock:            "https://i.ibb.co/HL843yqH/icons8-lock-100.png",
  padlock:         "https://i.ibb.co/S48ZYB8J/icons8-padlock-100.png",
  check:           "https://i.ibb.co/BHV9HPwq/icons8-check-mark-100.png",
  protect:         "https://i.ibb.co/dxV6ZPj/icons8-protect-100.png",
  error:           "https://i.ibb.co/2zYhmmx/icons8-error-100.png",

  // === Подарки / избранное ===
  gift:            "https://i.ibb.co/LzYxLkJb/icons8-gift-100.png",
  star:            "https://i.ibb.co/pr5KjpvN/icons8-star-100.png",
  favorite:        "https://i.ibb.co/RkqmHj4T/icons8-favorite-100.png",
  heart:           "https://i.ibb.co/7BkZr68/icons8-heart-100.png",

  // === Прочее (в запасе на будущее) ===
  home:            "https://i.ibb.co/d0w14w2c/icons8-home-100.png",
  folder:          "https://i.ibb.co/MDWNyVx0/icons8-folder-100.png",
  calendar:        "https://i.ibb.co/mFzbsxdN/icons8-calendar-100.png",
  dollarBag:       "https://i.ibb.co/v6gYZ8r9/icons8-dollar-bag-100.png",
  shop:            "https://i.ibb.co/Y7Y910n1/icons8-shop-100.png",
  notification:    "https://i.ibb.co/Nd1wqj5C/icons8-notification-100.png",
  pencil:          "https://i.ibb.co/N6BxF52S/icons8-pencil-100.png",
  bot:             "https://i.ibb.co/wNTsVXTn/icons8-bot-100.png",
  location:        "https://i.ibb.co/dJJtz3xp/icons8-location-100.png",
  email:           "https://i.ibb.co/Zzf1w0DZ/icons8-email-100.png",
  phone:           "https://i.ibb.co/B2nTLVx9/icons8-phone-100.png",
  birthday:        "https://i.ibb.co/0Rdgd9Qh/icons8-birthday-100.png",
  typing:          "https://i.ibb.co/SSq1TyZ/icons8-typing-100.png",

  // === Оставлены из старого набора (не переопределены новым списком) ===
  undo:            "https://i.ibb.co/W4JjxNdk/icons8-100.png",
  redo:            "https://i.ibb.co/7JkncpWz/icons8-100.png",
  features:        "https://i.ibb.co/C5FZd4mj/icons8-features-list-100.png",
  language:        "https://i.ibb.co/5Xr3V3Kv/icons8-language-100.png",
  saveAs:          "https://i.ibb.co/MkZN03VX/icons8-save-as-100.png",
  switchOff:       "https://i.ibb.co/0jsYMd1s/icons8-switch-off-100.png",
  switchOn:        "https://i.ibb.co/MDfhc887/icons8-switch-on-100.png",
  findFile:        "https://i.ibb.co/8L9MNx03/icons8-view-100.png",
  verified:        "https://i.ibb.co/TB7T6kgN/image.png",
};

function verifiedBadge(profile) {
  if (!profile || !profile.verified) return "";
  return `<span class="verified-badge verified-badge-icon" data-verified-badge="1">
    <span class="cell-icon" data-icon="check"></span>
  </span>`;
}

// ======================================================
// Глобальный тултип для галочки verified — рендерится вне
// .user-item-name (у которого overflow: hidden), поэтому
// не обрезается и корректно позиционируется у краёв экрана.
// ======================================================
let verifiedTooltipEl = null;

function setupVerifiedTooltip() {
  if (verifiedTooltipEl) return;
  verifiedTooltipEl = document.createElement("div");
  verifiedTooltipEl.className = "verified-tooltip-floating hidden";
  verifiedTooltipEl.textContent = "Официальный аккаунт";
  document.body.appendChild(verifiedTooltipEl);

  document.addEventListener("mouseover", (e) => {
    const badge = e.target.closest(".verified-badge");
    if (!badge) return;
    showVerifiedTooltip(badge);
  });

  document.addEventListener("mouseout", (e) => {
    const badge = e.target.closest(".verified-badge");
    if (!badge) return;
    const next = e.relatedTarget;
    if (next && next.closest && next.closest(".verified-badge")) return;
    verifiedTooltipEl.classList.add("hidden");
  });

  // Прячем при скролле — иначе тултип «прилипает» к экрану
  window.addEventListener("scroll", () => {
    if (verifiedTooltipEl) verifiedTooltipEl.classList.add("hidden");
  }, true);
}

function showVerifiedTooltip(badge) {
  const tip = verifiedTooltipEl;
  if (!tip) return;
  tip.classList.remove("hidden");
  const rect = badge.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = rect.left + rect.width / 2 - tw / 2;
  let y = rect.top - th - 8;
  if (x < 8) x = 8;
  if (x + tw > window.innerWidth - 8) x = window.innerWidth - tw - 8;
  // Если сверху не влезает — показываем снизу
  if (y < 8) y = rect.bottom + 8;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}

// ======================================================
// РЕЖИМ СПИСКА ЧАТОВ — объявлено ДО initApp, иначе TDZ
// ======================================================
const SCROLL_MODE_KEY = "cell_scroll_mode";
const GRANDMA_MODE_KEY = "cell_grandma_mode";

function isGrandmaMode() {
  try { return localStorage.getItem(GRANDMA_MODE_KEY) === "1"; } catch (e) { return false; }
}
let scrollMode = "classic"; // "classic" | "wheel"
try {
  const savedMode = localStorage.getItem(SCROLL_MODE_KEY);
  if (savedMode === "classic" || savedMode === "wheel") scrollMode = savedMode;
} catch (e) { /* silent */ }
document.documentElement.dataset.scrollMode = scrollMode;

// ======================================================
// I18N — локализация интерфейса
// ======================================================
// Словарь строк. Ключи — по секциям, чтобы не запутаться.
// При переводе пользовательских данных (ники, каналы, подписи
// подарков) — они НЕ переводятся, они хранятся в БД как есть.
const LANG_KEY = "cell_lang";

const I18N = {
  ru: {
    // ---- Настройки ----
    "settings.title": "Настройки",
    "settings.close": "Закрыть",
    "settings.language.label": "Язык",
    "settings.language.hint": "Язык интерфейса. Ники, названия каналов и подписи подарков не переводятся.",
    "settings.notifications.label": "Уведомления",
    "settings.notifications.enable": "Показывать уведомления о новых сообщениях",
    "settings.notifications.hint": "На компьютере уведомление всплывает в системном углу экрана. На телефоне — работает, когда приложение открыто или свёрнуто.",
    "settings.notifications.test": "Проверить уведомление",
    "notif.pushUnsupported": "Браузер не поддерживает push-уведомления",
    "notif.pushUnsupportedText": "На iPhone это работает только если приложение добавлено на домашний экран (iOS 16.4+).",
    "notif.pushFailed": "Не удалось оформить push-подписку",
    "settings.notifications.testTitle": "Cell",
    "settings.notifications.testBody": "Так будет выглядеть уведомление о новом сообщении.",
    "settings.notifications.denied": "Уведомления запрещены в настройках браузера",
    "settings.notifications.deniedText": "Разреши уведомления для сайта в настройках браузера и попробуй снова.",
    "notif.newMessage": "Новое сообщение",

    // ---- Экран входа ----
    "auth.tagline": "Собираемся по кусочкам",
    "auth.tab.login": "Вход",
    "auth.tab.register": "Регистрация",
    "auth.field.email": "Email",
    "auth.field.password": "Пароль",
    "auth.field.password.strict": "Пароль (мин. 10, A-Z, a-z, 0-9)",
    "auth.field.username": "Юзернейм",
    "auth.field.displayname": "Имя",
    "auth.login.submit": "Войти",
    "auth.register.submit": "Создать аккаунт",
    "auth.err.prefix": "Ошибка",
    "auth.err.username.required": "Введите юзернейм",
    "auth.err.username.format": "Юзернейм: 3-32 символа, a-z, 0-9, _ и -",
    "auth.err.displayname.required": "Введите имя",
    "auth.err.email.required": "Введите email",
    "auth.err.password.short": "Пароль минимум 10 символов",
    "auth.err.password.complex": "Пароль должен содержать заглавную, строчную букву и цифру",
    "auth.err.register.loading": "Регистрирую...",
    "auth.err.register.checkEmail": "Проверь почту и подтверди email.",
    "auth.err.login.tooManyAttempts": "Слишком много попыток. Подожди 5 минут.",
    "auth.forgotPassword": "Забыли пароль?",
    "auth.or": "или",
    "auth.localLogin": "Войти локально",
    "auth.localLoginHint": "Аккаунт только на этом устройстве. Без почты и пароля.",
    "auth.localLoginErr": "Не удалось войти локально",
    "auth.localLoginDisabled": "Локальный вход отключён в настройках сервера. Включите Anonymous Sign-Ins в Supabase.",
    "localSetup.title": "Локальный аккаунт",
    "localSetup.text": "Это аккаунт только для этого устройства. Никакой почты и пароля не нужно — войти в него с другого устройства нельзя. Придумайте имя и юзернейм.",
    "localSetup.save": "Начать пользоваться",
    "localSetup.err.name": "Введите имя",
    "localSetup.err.username": "Введите юзернейм",
    "localSetup.err.usernameFormat": "Юзернейм: 3-32 символа, a-z, 0-9, _ и -",
    "auth.reset.title": "Восстановление пароля",
    "auth.reset.text": "Введите email, привязанный к аккаунту — мы отправим ссылку для сброса пароля.",
    "auth.reset.send": "Отправить ссылку",
    "auth.reset.sent": "Если такой email зарегистрирован — на него отправлено письмо со ссылкой.",
    "auth.reset.err": "Не удалось отправить письмо",
    "auth.reset.newTitle": "Новый пароль",
    "auth.reset.newText": "Придумайте новый пароль. Требования: минимум 10 символов, заглавная и строчная буквы, цифра.",
    "auth.reset.repeat": "Повторите пароль",
    "auth.reset.save": "Сохранить пароль",
    "auth.reset.saved": "Пароль обновлён. Теперь можно войти.",
    "auth.reset.mismatch": "Пароли не совпадают",
    "auth.reset.saveErr": "Не удалось сохранить пароль",
    "auth.reset.sameAsOld": "Новый пароль должен отличаться от старого.",
    "auth.reset.newPlaceholder": "Новый пароль (мин. 10, A-Z, a-z, 0-9)",
    "auth.reset.repeatPlaceholder": "Повторите пароль",

    // ---- Сайдбар ----
    "sidebar.menu.createChannel": "Создать канал",
    "sidebar.menu.settings": "Настройки",
    "sidebar.menu.about": "О приложении",
    "sidebar.menu.logout": "Выйти",
    "sidebar.search.placeholder": "Поиск по имени или @username",
    "sidebar.search.clear": "Очистить поиск",
    "sidebar.section.chats": "Чаты",
    "sidebar.section.search": "Поиск",
    "sidebar.search.found": "Найденные",
    "sidebar.search.mine": "Ваши чаты и каналы",

    // ---- Шапка чата ----
    "chat.back": "Назад",
    "chat.search.open": "Поиск в чате",
    "chat.pins.open": "Закреплённые",
    "chat.menu.open": "Меню",
    "chat.menu.tokens": "Отправить Nectar",
    "chat.menu.clear": "Очистить чат",
    "chat.menu.delete": "Удалить чат",
    "chat.menu.block": "Заблокировать",
    "chat.menu.unblock": "Разблокировать",
    "chat.menu.channel.profile": "Профиль канала",
    "chat.menu.channel.invite": "Пригласить по ссылке",
    "chat.menu.channel.configure": "Настроить канал",
    "chat.menu.channel.unsubscribe": "Отписаться",
    "chat.menu.channel.delete": "Удалить канал",

    // ---- Поиск в чате ----
    "chat.search.placeholder": "Поиск в чате...",
    "chat.search.prev": "Предыдущее",
    "chat.search.next": "Следующее",
    "chat.search.close": "Закрыть",

    // ---- Панели над сообщениями ----
    "chat.pin.title": "Закреплённое сообщение",
    "chat.pin.list.open": "Все закрепы",
    "chat.reply.title": "Ответ",
    "chat.reply.cancel": "Отмена",
    "chat.scroll.down": "Вниз",

    // ---- E2EE ----
    "e2ee.banner.text": "Сообщения в этом чате зашифрованы.",
    "e2ee.banner.unlock": "Разблокировать",
    "e2ee.composer.hint": "Зашифровано",
    "e2ee.composer.hint.full": "Зашифровано end-to-end",

    // ---- Composer ----
    "composer.placeholder": "Написать сообщение...",
    "composer.attach": "Прикрепить файл",
    "composer.emoji": "Эмодзи",
    "composer.send": "Отправить",

    // ---- Канал ----
    "channel.action.subscribe": "Подписаться",
    "channel.action.unsubscribe": "Отписаться",
    "channel.action.request": "Подать заявку",
    "channel.action.requestCancel": "Отозвать заявку",
    "channel.action.requestRejected": "Заявка отклонена",
    "channel.action.private": "Только по ссылке-приглашению",

    // ---- Режим выбора ----
    "selection.count": "Выбрано: ",
    "selection.delete": "Удалить",
    "selection.forward": "Переслать",
    "selection.cancel": "Отмена",

    // ---- Закреплённые/ответы (плейсхолдеры) ----
    "msg.reply.you": "Ты",
    "msg.reply.answer": "В ответ",

    // ---- Общие кнопки диалогов ----
    "dialog.ok": "ОК",
    "dialog.yes": "Да",
    "dialog.cancel": "Отмена",
    "dialog.confirm": "Подтвердить",
    "dialog.search.placeholder": "Поиск...",

    // ---- Баннер блокировки ----
    "block.youBlocked": "Ты заблокировал(а) @{username}.",
    "block.theyBlocked": "@{username} заблокировал(а) тебя.",
    "block.unblockAction": "Разблокировать",

    // ---- ПКМ-меню на чате в списке ----
    "ctx.chat.profile": "Профиль",
    "ctx.chat.mute": "Отключить звук",
    "ctx.chat.unmute": "Включить звук",
    "ctx.chat.rename": "Переименовать",
    "ctx.chat.clear": "Очистить чат",
    "ctx.chat.delete": "Удалить чат",
    "ctx.chat.block": "Заблокировать",
    "ctx.chat.unblock": "Разблокировать",
    "ctx.chat.channelProfile": "Профиль канала",
    "ctx.chat.channelUnsubscribe": "Отписаться",

    // ---- Секции настроек ----
    "settings.accent.label": "Цвет приложения",
    "settings.scrollMode.label": "Режим списка чатов",
    "settings.scrollMode.classic": "Обычный",
    "settings.scrollMode.wheel": "Современный",
    "settings.scrollMode.hint": "Обычный — привычный список. Современный — колесо с центрированием и плавным переходом.",
    "settings.quickReaction.label": "Быстрая реакция",
    "settings.quickReaction.hint": "Двойной тап по сообщению поставит эту реакцию.",
    "settings.appIcon.label": "Иконка приложения",
    "settings.appIcon.hint": "Выбери иконку — она применится к установленному приложению. На iPhone иконку сменить нельзя — это ограничение iOS.",
    "settings.grandma.label": "Режим «Бабушка»",
    "settings.grandma.hint": "Упрощает интерфейс: убирает 2FA, шифрование, выход из аккаунта и лишние пункты меню. Отключить можно долгим нажатием на аватар в боковом меню (1.5 сек).",
    "settings.grandma.enable": "Включить режим «Бабушка»",
    "settings.grandma.disable": "Отключить режим «Бабушка»",
    "settings.mfa.label": "Двухфакторная аутентификация",
    "settings.mfa.manage": "Управлять 2FA",
    "settings.e2ee.label": "Шифрование",
    "settings.e2ee.manage": "Управлять шифрованием",

    // ---- Режим «Бабушка»: диалоги ----
    "grandma.enable.title": "Включить режим «Бабушка»",
    "grandma.enable.text": "Будут скрыты: выход из аккаунта, 2FA, шифрование, режим списка чатов, создание каналов, а также секция быстрых реакций и иконки приложения.\n\nОтключить можно будет долгим нажатием (1.5 сек) на аватар в боковом меню.",
    "grandma.enable.confirm": "Включить",
    "grandma.enabled.title": "Режим включён",
    "grandma.enabled.text": "Интерфейс упрощён. Чтобы отключить — удерживайте палец на своём аватаре в левом верхнем углу 1.5 секунды.",
    "grandma.disable.title": "Отключить режим «Бабушка»",
    "grandma.disable.text": "Вернуть полный интерфейс: выход из аккаунта, 2FA, шифрование и другие настройки?",
    "grandma.disable.confirm": "Отключить",
    "grandma.disabled.title": "Режим отключён",
    "grandma.disabled.text": "Полный интерфейс восстановлен.",

    // ---- 2FA: статус ----
    "mfa.status.enabled": "✅ Включена (с {date})",
    "mfa.status.disabled": "❌ Отключена. Включи — это сильно повышает защиту.",
    "mfa.status.error": "Не удалось проверить статус 2FA",

    // ---- E2EE: статус ----
    "e2ee.status.off": "🔓 E2EE выключена. Сообщения хранятся на сервере в открытом виде.",
    "e2ee.status.broken": "⚠️ Что-то не так: флаг стоит, но ключи не найдены.",
    "e2ee.status.unlocked": "🔒 Включено и разблокировано.",
    "e2ee.status.locked": "🔒 Включено, но ключ заблокирован. Разблокируй паролем.",
    "e2ee.status.error": "Не удалось проверить статус",

    // ---- Свой профиль ----
    "profile.title": "Профиль",
    "profile.section.avatar": "Аватар",
    "profile.section.name": "Имя",
    "profile.section.bio": "О себе",
    "profile.section.gender": "Пол",
    "profile.section.username": "Имя пользователя",
    "profile.section.birthday": "День рождения",
    "profile.upload": "Загрузить свою",
    "profile.name.placeholder": "Ваше имя",
    "profile.bio.placeholder": "Пара слов о себе...",
    "profile.gender.male": "Мужской",
    "profile.gender.female": "Женский",
    "profile.gender.unset": "Не выбрано",
    "profile.birthday.placeholder": "ДД.ММ или ДД.ММ.ГГГГ",
    "profile.birthday.calendar": "Выбрать дату",
    "profile.gifts": "Подарки",
    "profile.apply": "Применить изменения",
    "profile.close": "Закрыть",

    // ---- Чужой профиль ----
    "userProfile.username": "Имя пользователя",
    "userProfile.birthday": "День рождения",
    "userProfile.msgcount": "Сообщений в чате",
    "userProfile.created": "Дата регистрации аккаунта",
    "userProfile.gifts": "Подарки",
    "userProfile.close": "Закрыть",
    "userProfile.back": "Назад",

    // ---- Календарь дня рождения ----
    "calendar.today": "Сегодня",
    "calendar.clear": "Очистить",
    "calendar.prevYear": "Год назад",
    "calendar.prevMonth": "Месяц назад",
    "calendar.nextMonth": "Месяц вперёд",
    "calendar.nextYear": "Год вперёд",

    // ---- Хинты юзернейма ----
    "username.free": "@{username} свободен",
    "username.taken": "@{username} уже занят",
    "username.reserved": "@{username} зарезервирован",
    "username.current": "Это ваш текущий юзернейм",
    "username.checking": "Проверяю...",
    "username.error": "Ошибка проверки",
    "username.onlyLatin": "Только английские буквы, цифры, _ и -",
    "username.tooShort": "Минимум 3 символа",
    "username.saved": "Сохранено",
    "username.invalid": "Проверьте юзернейм",

    // ---- Last seen ----
    "lastSeen.online": "в сети",
    "lastSeen.recently.male": "был недавно",
    "lastSeen.recently.female": "была недавно",
    "lastSeen.recently.other": "был(-а) недавно",
    "lastSeen.minutes.male": "был {n} {word} назад",
    "lastSeen.minutes.female": "была {n} {word} назад",
    "lastSeen.minutes.other": "был(-а) {n} {word} назад",
    "lastSeen.hours.male": "был {n} {word} назад",
    "lastSeen.hours.female": "была {n} {word} назад",
    "lastSeen.hours.other": "был(-а) {n} {word} назад",
    "lastSeen.today.male": "был сегодня в {time}",
    "lastSeen.today.female": "была сегодня в {time}",
    "lastSeen.today.other": "был(-а) сегодня в {time}",
    "lastSeen.yesterday.male": "был вчера в {time}",
    "lastSeen.yesterday.female": "была вчера в {time}",
    "lastSeen.yesterday.other": "был(-а) вчера в {time}",
    "lastSeen.date.male": "был {date} в {time}",
    "lastSeen.date.female": "была {date} в {time}",
    "lastSeen.date.other": "был(-а) {date} в {time}",
    "lastSeen.minWord.one": "минуту",
    "lastSeen.minWord.few": "минуты",
    "lastSeen.minWord.many": "минут",
    "lastSeen.hourWord.one": "час",
    "lastSeen.hourWord.few": "часа",
    "lastSeen.hourWord.many": "часов",

    // ---- Подарки: общее ----
    "gifts.rarity.common": "Обычный",
    "gifts.rarity.rare": "Редкий",
    "gifts.rarity.epic": "Эпический",
    "gifts.title.mine": "Мои подарки",
    "gifts.title.user": "Подарки: {name}",
    "gifts.title.detail": "Подарок",
    "gifts.title.catalog": "Каталог подарков",
    "gifts.title.send": "Подарить подарок",
    "gifts.empty.mine": "У вас пока нет подарков.",
    "gifts.empty.other": "У этого пользователя нет подарков.",
    "gifts.empty.catalog": "Каталог пуст",
    "gifts.empty.contacts": "У вас пока нет контактов",
    "gifts.buy.button": "Купить подарок",
    "gifts.buy.buttonFor": "Купить подарок для {name}",
    "gifts.soldOut": "Распродано",
    "gifts.lowBalance": "мало",
    "gifts.detail.owner": "Владелец",
    "gifts.detail.rarity": "Редкость",
    "gifts.detail.background": "Фон",
    "gifts.detail.pattern": "Паттерн",
    "gifts.detail.model": "Модель",
    "gifts.detail.quantity": "Количество",
    "gifts.detail.value": "Ценность",
    "gifts.detail.caption": "Подпись",
    "gifts.detail.limit": "лимит {n}",
    "gifts.detail.recipient": "Подарок для {name}",
    "gifts.detail.sender": "От {name}",
    "gifts.purchase.saveSenderFail": "Не удалось сохранить имя отправителя",
    "gifts.detail.notOwner": "Подарок принадлежит другому пользователю",
    "gifts.action.addToProfile": "Добавить в профиль",
    "gifts.action.hideFromProfile": "Скрыть из профиля",
    "gifts.action.gift": "Подарить",
    "gifts.action.sell": "Продать за {price}",
    "gifts.action.pin": "Закрепить",
    "gifts.action.unpin": "Открепить",
    "gifts.action.toProfile": "Добавить в профиль",
    "gifts.action.fromProfile": "Убрать из профиля",
    "gifts.purchase.title.self": "Купить подарок себе",
    "gifts.purchase.title.other": "Купить подарок для {name}",
    "gifts.purchase.caption": "Подпись (необязательно)",
    "gifts.purchase.withName.self": "С моим именем",
    "gifts.purchase.withName.other": "С тем именем",
    "gifts.purchase.cost": "Стоимость: {price}",
    "gifts.purchase.buy": "Купить",
    "gifts.purchase.buying": "Покупаю...",
    "gifts.send.subtitle": "Выбери получателя из своих контактов",
    "gifts.send.confirm": "Подарить",
    "gifts.send.confirmTitle": "Передать подарок",
    "gifts.send.confirmText": "Передача стоит {price}. Продолжить?",
    "gifts.send.confirmAction": "Передать за {price}",
    "gifts.send.notEnough": "Недостаточно Nectar",
    "gifts.send.notEnoughText": "Для передачи нужно {need} Nectar, у вас {have}.",
    "gifts.sell.title": "Продать подарок",
    "gifts.sell.text": "Продать за {price} Nectar (комиссия 15%)?",
    "gifts.sell.confirm": "Продать",
    "gifts.notFound": "Не найдено",
    "gifts.error": "Ошибка",

    // ---- Превью в списке чатов ----
    "preview.gift": "🎁 Подарок",
    "preview.photo": "📷 Фото",
    "preview.video": "🎥 Видео",
    "preview.file": "📎 Файл",
    "preview.you": "Вы: ",
    "preview.noMessages": "Нет сообщений",
    "preview.encrypted": "🔒 Зашифровано",

    // ---- Создание канала ----
    "channel.create.title": "Создать канал",
    "channel.create.avatar": "Аватар",
    "channel.create.name": "Название",
    "channel.create.namePlaceholder": "Название канала",
    "channel.create.username": "Юзернейм канала",
    "channel.create.visibility": "Тип канала",
    "channel.create.visibility.public": "Открытый",
    "channel.create.visibility.request": "По заявке",
    "channel.create.visibility.private": "Приватный",
    "channel.create.visibility.hint": "Открытый — любой может подписаться. По заявке — нужна одобренная заявка. Приватный — только по ссылке-приглашению.",
    "channel.create.confirm": "Создать канал",
    "channel.create.creating": "Создаю...",
    "channel.create.uploadOwn": "Загрузить свою",

    // ---- Редактирование канала ----
    "channel.edit.title": "Изменить канал",
    "channel.edit.save": "Сохранить",
    "channel.edit.saving": "Сохраняю...",
    "channel.edit.reactions": "Доступные реакции",
    "channel.edit.admins": "Администраторы",
    "channel.edit.addAdmin": "+ Добавить администратора",
    "channel.edit.owner": "Владелец канала",
    "channel.edit.transfer": "Передать владение",
    "channel.edit.noAdmins": "Нет администраторов",
    "channel.edit.confirmAdd": "Выбрать администратора",
    "channel.edit.confirmAddText": "Кого назначить админом канала? Можно искать по имени или @username.",
    "channel.edit.confirmAddAction": "Назначить",
    "channel.edit.confirmTransfer": "Передать владение",
    "channel.edit.confirmTransferText": "Выберите нового владельца. Можно искать по имени или @username. Вы потеряете права владельца.",
    "channel.edit.confirmTransferAction": "Передать",
    "channel.edit.confirmTransferConfirm": "Точно передать владение? Действие необратимо.",
    "channel.edit.transferSuccess": "Владение передано.",
    "channel.edit.removeAdminTitle": "Снять администратора",
    "channel.edit.removeAdminText": "Снять с должности администратора?",
    "channel.edit.removeAdminAction": "Снять",
    "channel.edit.noMembers": "В канале нет других подписчиков",
    "channel.edit.allAdmins": "Все подписчики уже администраторы",
    "channel.edit.ownerRole": "Владелец",
    "channel.edit.adminRole": "Админ",
    "channel.edit.subscriberRole": "Подписчик",

    // ---- Профиль канала ----
    "channel.profile.title": "Профиль канала",
    "channel.profile.username": "Юзернейм канала",
    "channel.profile.subs": "Подписчиков",
    "channel.profile.subsHint": "Подписчиков · нажми, чтобы посмотреть список",
    "channel.profile.requests": "Заявок на вступление",
    "channel.profile.requestsHint": "Заявок на вступление · нажми, чтобы посмотреть",
    "channel.profile.requestsHintPlural": "{n} {word} · нажми, чтобы посмотреть",
    "channel.profile.views": "Просмотров за все время",
    "channel.profile.created": "Дата создания",
    "channel.profile.subsList": "Подписчики",
    "channel.profile.noSubs": "Нет подписчиков",
    "channel.profile.requestsList": "Заявки на вступление",
    "channel.profile.noRequests": "Нет активных заявок",
    "channel.subsWord.one": "подписчик",
    "channel.subsWord.few": "подписчика",
    "channel.subsWord.many": "подписчиков",
    "channel.requestWord.one": "заявка",
    "channel.requestWord.few": "заявки",
    "channel.requestWord.many": "заявок",

    // ---- Меню профиля канала ----
    "channel.menu.edit": "Изменить",
    "channel.menu.delete": "Удалить канал",

    // ---- Приглашения ----
    "invite.title": "Ссылка-приглашение",
    "invite.text": "По ссылке любой сможет подписаться на канал.",
    "invite.create": "Создать новую ссылку",
    "invite.empty": "Пока нет ссылок",
    "invite.open": "Открыть в этой вкладке",
    "invite.share": "Переслать",
    "invite.copy": "Скопировать",
    "invite.revoke": "Отозвать",
    "invite.revokeTitle": "Отозвать ссылку",
    "invite.revokeText": "Ссылка перестанет работать. Продолжить?",
    "invite.revokeAction": "Отозвать",

    // ---- Удаление канала ----
    "channel.delete.title": "Удалить канал",
    "channel.delete.text": "Канал «{name}» будет удалён у всех подписчиков безвозвратно. Продолжить?",
    "channel.delete.continue": "Продолжить",
    "channel.delete.confirmTitle": "Подтверждение",
    "channel.delete.confirmText": "Введите название канала «{name}» для подтверждения",
    "channel.delete.mismatch": "Отменено",
    "channel.delete.mismatchText": "Название не совпало. Канал не удалён.",

    // ---- Подписка / заявки ----
    "channel.sub.unsubscribeTitle": "Отписаться",
    "channel.sub.unsubscribeText": "Отписаться от канала «{name}»?",
    "channel.sub.unsubscribeAction": "Отписаться",
    "channel.sub.privateTitle": "Приватный канал",
    "channel.sub.privateText": "В этот канал можно попасть только по ссылке-приглашению.",
    "channel.sub.errorSub": "Ошибка подписки",
    "channel.sub.errorUnsub": "Ошибка отписки",
    "channel.sub.onlyAdminsDelete": "Только администраторы могут удалять сообщения в канале",
    "channel.sub.onlyAdminsPin": "Только администраторы могут закреплять сообщения в канале",
    "channel.sub.cantWrite": "Вы не являетесь подписчиком канала",

    // ---- Заявки (approve/reject) ----
    "request.approve": "Одобрить",
    "request.reject": "Отклонить",

    // ---- Ошибки каналов ----
    "channel.err.notFound": "Канал не найден",
    "channel.err.createFail": "Не удалось создать канал: {msg}",
    "channel.err.usernameTaken": "Юзернейм уже занят",
    "channel.err.noReactions": "Выберите хотя бы одну реакцию",
    "channel.err.enterName": "Введите название",
    "channel.err.enterUsername": "Введите юзернейм",
    "channel.err.checkUsername": "Проверьте юзернейм",
    "channel.err.noRightsOwner": "Только владелец канала может это делать",
    "channel.err.noRightsAdmin": "Только администраторы могут это делать",

    // ---- Пересылка ----
    "forward.title": "Переслать",
    "forward.info": "Выбрано чатов: {n} / 10",
    "forward.pickChats": "Выбери чаты",
    "forward.hideSender": "Скрыть отправителя",
    "forward.send": "Переслать",
    "forward.cancel": "Отмена",
    "forward.limit": "Максимум 10 чатов",
    "forward.none": "Нет чатов",
    "forward.done": "Готово",
    "forward.linkSent": "Ссылка отправлена.",

    // ---- Предпросмотр вложений ----
    "attach.title.image": "Отправить изображение",
    "attach.title.video": "Отправить видео",
    "attach.title.file": "Отправить файл",
    "attach.title.generic": "Отправить",
    "attach.asFile": "Отправить как файл",
    "attach.caption": "Подпись",
    "attach.captionPlaceholder": "Введите подпись...",
    "attach.addFile": "Добавить файл",
    "attach.remove": "Убрать",
    "attach.send": "Отправить",
    "attach.cancel": "Отмена",
    "attach.tooBig": "Файл слишком большой",
    "attach.tooBigText": "«{name}» больше {size}.",
    "attach.tooMany": "Слишком много файлов",
    "attach.tooManyText": "Максимум {n} файлов за раз.",

    // ---- Прочие алерты ----
    "alert.error": "Ошибка",
    "alert.notSent": "Не отправлено",
    "alert.notSentBlocked": "Сообщение не отправлено: есть блокировка.",
    "alert.notSentAttachment": "Есть блокировка — вложение не отправлено.",
    "alert.cant": "Нельзя",
    "alert.noChatYet": "Сначала напишите сообщение собеседнику — тогда создастся чат",
    "alert.createChatFail": "Не удалось создать чат",

    // ---- ПКМ-меню сообщения ----
    "msgCtx.reply": "Ответить",
    "msgCtx.pin": "Закрепить",
    "msgCtx.unpin": "Открепить",
    "msgCtx.copy": "Копировать",
    "msgCtx.edit": "Изменить",
    "msgCtx.fwd": "Переслать",
    "msgCtx.del": "Удалить",
    "msgCtx.sel": "Выбрать",
    "msgCtx.expand": "Ещё реакции",

    // ---- Меню форматирования ----
    "fmt.bold": "Жирный",
    "fmt.underline": "Подчёркнутый",
    "fmt.italic": "Курсив",
    "fmt.strike": "Зачёркнутый",
    "fmt.quote": "Цитата",
    "fmt.mono": "Моноширный",
    "fmt.spoiler": "Скрытый",

    // ---- Reply bar ----
    "replyBar.answer": "Ответ",
    "replyBar.edit": "Редактирование",

    // ---- Закреплённые ----
    "pins.title": "Закреплённые сообщения",
    "pins.one": "Закреплённое сообщение",
    "pins.multi": "Закреплённое сообщение · {i} из {total}",
    "pins.scope.shared": "Общий",
    "pins.scope.personal": "Личный",
    "pins.unpin": "Открепить",
    "pins.unpinChannel": "Открепить это сообщение в канале?",
    "pins.unpinShared": "Открепить это сообщение у обоих?",
    "pins.unpinMine": "Открепить это сообщение у себя?",
    "pins.unpinOne": "Открепить сообщение {label}?",
    "pins.none": "Пока нет закреплённых сообщений.",
    "pins.you": "Вы",
    "pins.gift": "🎁 Подарок",
    "pins.tokens": "🧩 ImagiTokens",
    "pins.noText": "(без текста)",
    "pins.choose": "Открепление",
    "pins.chooseText": "Что снять?",
    "pins.chooseUnpinMe": "У меня",
    "pins.chooseUnpinBoth": "У обоих",
    "pins.chooseAction": "Открепить",
    "pins.pinTitle": "Закрепление",
    "pins.pinText": "Как закрепить?",
    "pins.pinMe": "У меня",
    "pins.pinBoth": "У обоих",
    "pins.pinAction": "Закрепить",
    "pins.unpinLabelBoth": "у обоих",
    "pins.unpinLabelMine": "у себя",

    // ---- Удаление / очистка ----
    "delete.one.title": "Удалить сообщение",
    "delete.one.text": "У кого удалить?",
    "delete.me": "У меня",
    "delete.both": "У обоих",
    "delete.action": "Удалить",
    "delete.selected.title": "Удалить сообщения",
    "delete.selected.text": "Будет удалено: {n}",
    "delete.failed.title": "Не удалось удалить",
    "delete.failed.text": "Сервер не подтвердил удаление. Возможно, RLS-политика не разрешает удалять это сообщение.",
    "delete.clear.title": "Очистить чат",
    "delete.clear.text": "Выбери, что очистить:",
    "delete.clear.me": "Только у меня",
    "delete.clear.both": "У обоих",
    "delete.clear.action": "Очистить",
    "delete.chat.title": "Удалить чат",
    "delete.chat.text": "Что удалить?",
    "delete.chat.me": "У меня (вернётся при новом сообщении)",
    "delete.chat.both": "У обоих (безвозвратно)",
    "delete.chat.action": "Удалить",
    "delete.limit.title": "Лимит",
    "delete.limit.text": "Максимум 100 сообщений",

    // ---- О приложении ----
    "about.title": "О приложении",
    "about.section.about": "О приложении",
    "about.text.about": "Cell — семейный мессенджер. Каждый чат — это ячейка, а вместе они собираются в улей твоих близких. Здесь нет публичного шума: только ты, твоя семья и те, кому ты доверяешь.",
    "about.section.features": "Возможности",
    "about.text.features": "Личные чаты и каналы, вложения и подарки, закрепы и поиск, реакции и пересылка — всё, чтобы быть на связи.",
    "about.section.credits": "Благодарности",
    "about.section.version": "Версия",
    "about.close": "Закрыть",
    "about.credits.before": "Часть иконок взята с сайтов",
    "about.credits.and": "и",
    "about.credits.after": "Спасибо авторам за бесплатные наборы.",

    // ---- Командная палитра ----
    "cmd.placeholder": "Поиск чатов, каналов, людей или команда >",
    "cmd.foot.select": "выбор",
    "cmd.foot.open": "открыть",
    "cmd.empty": "Ничего не найдено",
    "cmd.kind.cmd": "cmd",
    "cmd.kind.channel": "канал",
    "cmd.kind.chat": "чат",
    "cmd.kind.profile": "профиль",
    "cmd.cmd.create-channel": "Создать канал",
    "cmd.cmd.create-channel.sub": "Открывает диалог создания канала",
    "cmd.cmd.profile": "Профиль",
    "cmd.cmd.profile.sub": "Свой профиль",
    "cmd.cmd.gifts": "Подарки",
    "cmd.cmd.gifts.sub": "Открыть мои подарки",
    "cmd.cmd.channel-edit": "Настройки канала",
    "cmd.cmd.channel-edit.sub": "Только для владельца/админа открытого канала",
    "cmd.cmd.about": "О приложении",
    "cmd.cmd.about.sub": "Cell · credits",

    // ---- Emoji picker ----
    "emoji.recent.empty": "Здесь появятся недавно использованные эмодзи",

    // ---- Nectar ----
    "tokens.title": "Отправить Nectar",
    "tokens.to": "Кому: {name}",
    "tokens.balance": "У вас: {balance}",
    "tokens.amountPlaceholder": "Сумма",
    "tokens.send": "Отправить",

    // ---- Системные сообщения ----
    "msg.gift.youSent": "Вы отправили подарок за {price} {icon}",
    "msg.gift.sent.male": "{name} отправил вам подарок за {price} {icon}",
    "msg.gift.sent.female": "{name} отправила вам подарок за {price} {icon}",
    "msg.gift.sent.other": "{name} отправил(а) вам подарок за {price} {icon}",
    "msg.tokens.youSent": "Вы отправили {amount} {icon}",
    "msg.tokens.sent.male": "{name} отправил вам {amount} {icon} Nectar",
    "msg.tokens.sent.female": "{name} отправила вам {amount} {icon} Nectar",
    "msg.tokens.sent.other": "{name} отправил(а) вам {amount} {icon} Nectar",

    // ---- Пустые состояния ----
    "empty.noChats": "У вас пока нет чатов.<br>Введи @username выше, чтобы найти человека.",
    "empty.noChatsShort": "У вас пока нет чатов.",
    "empty.noMessages": "Пока сообщений нет. Напиши первым!",
    "empty.noMessagesChannel": "В этом канале пока что нет сообщений.",
    "empty.channelNoRead": "Вы не являетесь подписчиком.<br>Подайте заявку, чтобы читать сообщения.",
    "empty.channelNoReadPrivate": "Этот канал приватный.<br>Читать сообщения могут только подписчики.",
    "empty.loading": "Загрузка...",
    "empty.searching": "Ищу...",
    "empty.search.start": "Начни вводить имя или @username",
    "empty.search.notFound": "Никого не найдено по «{query}»",
    "empty.search.empty": "Пусто",
    "empty.startChat": "Здесь пока нет сообщений. Напишите первым!",

    // ---- Блокировка (диалоги) ----
    "block.confirm.title": "Блокировка",
    "block.confirm.text": "Заблокировать @{username}?",
    "block.confirm.action": "Заблокировать",
    "block.failed": "Не удалось",

    // ---- Финальные мелочи ----
    "grandma.logoutBlocked.title": "Выход заблокирован",
    "grandma.logoutBlocked.text": "Режим «Бабушка» включён. Сначала отключите его долгим нажатием на аватар в боковом меню.",
    "inactivity.expired": "Сессия истекла из-за неактивности. Войди заново.",
    "date.today": "Сегодня",
    "date.yesterday": "Вчера",
    "e2ee.msg.locked": "🔒 Зашифровано — разблокируйте в настройках",
    "e2ee.msg.noChannelKey": "🔒 Нет ключа канала",
    "e2ee.msg.decryptFailed": "🔒 Не удалось расшифровать",
    "e2ee.msg.noSharedKey": "🔒 Нет ключа для расшифровки",
    "attach.encryptedLoading": "🔒 Загрузка...",
    "attach.encryptedLoadingFile": "🔒 Загрузка файла...",
    "attach.encryptedBlocked": "🔒 Файл зашифрован.<br>Разблокируйте в настройках, чтобы просмотреть.",
    "attach.loadingShort": "⏳ Загрузка…",
    "media.loadVideoFailed": "❌ Не удалось загрузить видео.",
    "media.loadVideoFailedHint": "Возможно, ссылка протухла. Переоткрой вложение.",
    "media.loadImageFailed": "❌ Не удалось загрузить изображение.",
    "media.loadImageFailedHint": "Возможно, ссылка протухла. Переоткрой вложение.",

    // ---- 2FA ----
    "mfa.title": "Двухфакторная аутентификация",
    "mfa.challenge.text": "Открой приложение-аутентификатор и введи 6-значный код.",
    "mfa.challenge.submit": "Подтвердить",
    "mfa.challenge.exit": "Выйти",
    "mfa.err.6digits": "Введи 6 цифр",
    "mfa.err.noFactor": "Нет активного TOTP-фактора",
    "mfa.err.wrongCode": "Неверный код",
    "mfa.err.confirmFailed": "Не удалось подтвердить 2FA. Попробуй ещё раз через 30 секунд.",
    "mfa.err.noUser": "Не удалось получить данные пользователя",
    "mfa.err.verifyFailed": "Ошибка проверки кода",
    "mfa.setup.enabledText": "Двухфакторная аутентификация <b>включена</b>. При входе потребуется 6-значный код из приложения.",
    "mfa.setup.disableBtn": "Отключить 2FA",
    "mfa.setup.disableTitle": "Отключить 2FA",
    "mfa.setup.disableText": "Это сильно снизит безопасность аккаунта. Продолжить?",
    "mfa.setup.disableAction": "Отключить",
    "mfa.setup.errorPrefix": "Ошибка: {msg}",
    "mfa.setup.steps": "1. Открой <b>Google Authenticator</b>, <b>Authy</b> или <b>1Password</b>.<br>2. Отсканируй QR-код.<br>3. Введи 6-значный код из приложения ниже.",
    "mfa.setup.manual": "Если QR не сканируется, введи код вручную:",
    "mfa.setup.activate": "Активировать 2FA",
    "mfa.setup.factorNotActive": "Фактор не активировался. Попробуй ещё раз.",
    "mfa.setup.doneTitle": "Готово",
    "mfa.setup.doneText": "Двухфакторная аутентификация включена!",

    // ---- E2EE: мастер ----
    "e2ee.title.init": "Включить шифрование",
    "e2ee.title.unlock": "Разблокировать шифрование",
    "e2ee.title.enabled": "Шифрование включено",
    "e2ee.setup.enabledText": "🔒 Все новые личные сообщения шифруются на твоём устройстве. Сервер видит только шифротекст.",
    "e2ee.setup.showSafety": "🔑 Показать safety number",
    "e2ee.setup.lockNow": "🔒 Заблокировать сейчас",
    "e2ee.setup.disableBtn": "Отключить шифрование",
    "e2ee.setup.noChatTitle": "Нет чата",
    "e2ee.setup.noChatText": "Открой чат с собеседником и нажми ещё раз.",
    "e2ee.setup.lockTitle": "Заблокировать сейчас",
    "e2ee.setup.lockText": "Приватный ключ будет забыт. Для чтения зашифрованных сообщений потребуется снова ввести пароль.",
    "e2ee.setup.lockAction": "Заблокировать",
    "e2ee.setup.unlockText": "Приватный ключ хранится в зашифрованном виде. Чтобы читать зашифрованные сообщения, введи свой пароль.",
    "e2ee.setup.unlockPassword": "Пароль",
    "e2ee.setup.trustDevice": "Доверять этому устройству — не спрашивать пароль при следующем входе",
    "e2ee.setup.unlockBtn": "Разблокировать",
    "e2ee.setup.unlockDone": "Ключ разблокирован.",
    "e2ee.setup.unlockErr": "Неверный пароль или повреждённый ключ",
    "e2ee.setup.initText": "Cell сгенерирует пару ключей на твоём устройстве. Приватный ключ будет зашифрован твоим паролем и сохранён на сервере в зашифрованном виде.<br><br><b>Важно:</b> мы не сможем восстановить его, если ты забудешь пароль. Дополнительно будут сгенерированы <b>12 слов восстановления</b> — их надо сохранить.",
    "e2ee.setup.initBtn": "Сгенерировать ключи",
    "e2ee.setup.initLoading": "Генерирую...",
    "e2ee.setup.pwTooShort": "Пароль слишком короткий (мин. 8)",
    "e2ee.setup.recoveryTitle": "⚠️ Код восстановления",
    "e2ee.setup.recoveryText": "Сохрани эти 12 слов в надёжном месте (менеджер паролей или бумага). Если забудешь пароль — <b>только с их помощью</b> сможешь восстановить доступ к зашифрованным сообщениям. Мы не сможем тебе помочь.",
    "e2ee.setup.recoveryConfirm": "Я сохранил код и понимаю, что без него не восстановлю доступ",
    "e2ee.setup.recoveryContinue": "Продолжить",
    "e2ee.setup.recoveryBack": "Отмена",
    "e2ee.setup.enabledDone": "Шифрование включено.",
    "e2ee.disable.title": "Отключить шифрование",
    "e2ee.disable.text": "Все НОВЫЕ сообщения будут храниться в открытом виде. Уже зашифрованные останутся зашифрованными. Продолжить?",
    "e2ee.disable.action": "Отключить",
    "e2ee.safety.lockedTitle": "Заблокировано",
    "e2ee.safety.lockedText": "Разблокируй шифрование в настройках.",
    "e2ee.safety.noKeyTitle": "Нет ключа",
    "e2ee.safety.noKeyText": "У собеседника не включено шифрование.",
    "e2ee.safety.title": "Safety number",
    "e2ee.safety.text": "Сверь этот код с @{username} лично или вслух. Если совпадает — вас не подслушивают.\n\n{groups}",
    "e2ee.err.noSavedKeys": "Нет сохранённых ключей",

    // ---- Загрузка файлов: ошибки ----
    "attach.err.readTitle": "Ошибка чтения файла",
    "attach.err.uploadTitle": "Ошибка загрузки",
    "attach.err.notSent": "Не отправлено",
    "attach.err.network": "Ошибка сети",
  },
  en: {
    // ---- Settings ----
    "settings.title": "Settings",
    "settings.close": "Close",
    "settings.language.label": "Language",
    "settings.language.hint": "Interface language. Nicknames, channel names and gift captions are not translated.",
    "settings.notifications.label": "Notifications",
    "settings.notifications.enable": "Show notifications about new messages",
    "settings.notifications.hint": "On desktop, a notification pops up in the system corner. On mobile, it works while the app is open or in the background.",
    "settings.notifications.test": "Test notification",
    "notif.pushUnsupported": "This browser doesn't support push notifications",
    "notif.pushUnsupportedText": "On iPhone it works only when the app is added to the home screen (iOS 16.4+).",
    "notif.pushFailed": "Failed to create push subscription",
    "settings.notifications.testTitle": "Cell",
    "settings.notifications.testBody": "This is how a new-message notification will look.",
    "settings.notifications.denied": "Notifications are blocked in browser settings",
    "settings.notifications.deniedText": "Allow notifications for this site in your browser settings and try again.",
    "notif.newMessage": "New message",

    // ---- Auth screen ----
    "auth.tagline": "Gathering piece by piece",
    "auth.tab.login": "Log in",
    "auth.tab.register": "Sign up",
    "auth.field.email": "Email",
    "auth.field.password": "Password",
    "auth.field.password.strict": "Password (min. 10, A-Z, a-z, 0-9)",
    "auth.field.username": "Username",
    "auth.field.displayname": "Name",
    "auth.login.submit": "Log in",
    "auth.register.submit": "Create account",
    "auth.err.prefix": "Error",
    "auth.err.username.required": "Enter a username",
    "auth.err.username.format": "Username: 3–32 characters, a-z, 0-9, _ and -",
    "auth.err.displayname.required": "Enter a name",
    "auth.err.email.required": "Enter an email",
    "auth.err.password.short": "Password must be at least 10 characters",
    "auth.err.password.complex": "Password must contain an uppercase letter, a lowercase letter and a digit",
    "auth.err.register.loading": "Signing up...",
    "auth.err.register.checkEmail": "Check your email and confirm the address.",
    "auth.err.login.tooManyAttempts": "Too many attempts. Wait 5 minutes.",
    "auth.forgotPassword": "Forgot password?",
    "auth.or": "or",
    "auth.localLogin": "Local sign-in",
    "auth.localLoginHint": "Account on this device only. No email or password.",
    "auth.localLoginErr": "Local sign-in failed",
    "auth.localLoginDisabled": "Local sign-in is disabled on the server. Enable Anonymous Sign-Ins in Supabase.",
    "localSetup.title": "Local account",
    "localSetup.text": "This account lives on this device only. No email or password needed — you can't sign in to it from another device. Choose a name and username.",
    "localSetup.save": "Start using",
    "localSetup.err.name": "Enter a name",
    "localSetup.err.username": "Enter a username",
    "localSetup.err.usernameFormat": "Username: 3–32 characters, a-z, 0-9, _ and -",
    "auth.reset.title": "Password recovery",
    "auth.reset.text": "Enter the email linked to your account — we'll send a password reset link.",
    "auth.reset.send": "Send link",
    "auth.reset.sent": "If such email is registered — a letter with a link has been sent.",
    "auth.reset.err": "Failed to send email",
    "auth.reset.newTitle": "New password",
    "auth.reset.newText": "Create a new password. Requirements: at least 10 characters, uppercase and lowercase letters, a digit.",
    "auth.reset.repeat": "Repeat password",
    "auth.reset.save": "Save password",
    "auth.reset.saved": "Password updated. You can log in now.",
    "auth.reset.mismatch": "Passwords do not match",
    "auth.reset.saveErr": "Failed to save password",
    "auth.reset.sameAsOld": "New password must be different from the old one.",
    "auth.reset.newPlaceholder": "New password (min. 10, A-Z, a-z, 0-9)",
    "auth.reset.repeatPlaceholder": "Repeat password",

    // ---- Sidebar ----
    "sidebar.menu.createChannel": "Create channel",
    "sidebar.menu.settings": "Settings",
    "sidebar.menu.about": "About",
    "sidebar.menu.logout": "Log out",
    "sidebar.search.placeholder": "Search by name or @username",
    "sidebar.search.clear": "Clear search",
    "sidebar.section.chats": "Chats",
    "sidebar.section.search": "Search",
    "sidebar.search.found": "Found",
    "sidebar.search.mine": "Your chats and channels",

    // ---- Chat header ----
    "chat.back": "Back",
    "chat.search.open": "Search in chat",
    "chat.pins.open": "Pinned",
    "chat.menu.open": "Menu",
    "chat.menu.tokens": "Send Nectar",
    "chat.menu.clear": "Clear chat",
    "chat.menu.delete": "Delete chat",
    "chat.menu.block": "Block",
    "chat.menu.unblock": "Unblock",
    "chat.menu.channel.profile": "Channel profile",
    "chat.menu.channel.invite": "Invite by link",
    "chat.menu.channel.configure": "Configure channel",
    "chat.menu.channel.unsubscribe": "Unsubscribe",
    "chat.menu.channel.delete": "Delete channel",

    // ---- Chat search ----
    "chat.search.placeholder": "Search in chat...",
    "chat.search.prev": "Previous",
    "chat.search.next": "Next",
    "chat.search.close": "Close",

    // ---- Panels above messages ----
    "chat.pin.title": "Pinned message",
    "chat.pin.list.open": "All pins",
    "chat.reply.title": "Reply",
    "chat.reply.cancel": "Cancel",
    "chat.scroll.down": "Down",

    // ---- E2EE ----
    "e2ee.banner.text": "Messages in this chat are encrypted.",
    "e2ee.banner.unlock": "Unlock",
    "e2ee.composer.hint": "Encrypted",
    "e2ee.composer.hint.full": "End-to-end encrypted",

    // ---- Composer ----
    "composer.placeholder": "Write a message...",
    "composer.attach": "Attach file",
    "composer.emoji": "Emoji",
    "composer.send": "Send",

    // ---- Channel ----
    "channel.action.subscribe": "Subscribe",
    "channel.action.unsubscribe": "Unsubscribe",
    "channel.action.request": "Send request",
    "channel.action.requestCancel": "Withdraw request",
    "channel.action.requestRejected": "Request declined",
    "channel.action.private": "Invite link only",

    // ---- Selection mode ----
    "selection.count": "Selected: ",
    "selection.delete": "Delete",
    "selection.forward": "Forward",
    "selection.cancel": "Cancel",

    // ---- Pinned / replies (placeholders) ----
    "msg.reply.you": "You",
    "msg.reply.answer": "In reply to",

    // ---- Common dialog buttons ----
    "dialog.ok": "OK",
    "dialog.yes": "Yes",
    "dialog.cancel": "Cancel",
    "dialog.confirm": "Confirm",
    "dialog.search.placeholder": "Search...",

    // ---- Block banner ----
    "block.youBlocked": "You blocked @{username}.",
    "block.theyBlocked": "@{username} blocked you.",
    "block.unblockAction": "Unblock",

    // ---- Right-click menu on chat in list ----
    "ctx.chat.profile": "Profile",
    "ctx.chat.mute": "Mute",
    "ctx.chat.unmute": "Unmute",
    "ctx.chat.rename": "Rename",
    "ctx.chat.clear": "Clear chat",
    "ctx.chat.delete": "Delete chat",
    "ctx.chat.block": "Block",
    "ctx.chat.unblock": "Unblock",
    "ctx.chat.channelProfile": "Channel profile",
    "ctx.chat.channelUnsubscribe": "Unsubscribe",

    // ---- Settings sections ----
    "settings.accent.label": "App color",
    "settings.scrollMode.label": "Chat list mode",
    "settings.scrollMode.classic": "Classic",
    "settings.scrollMode.wheel": "Modern",
    "settings.scrollMode.hint": "Classic — a familiar list. Modern — a wheel with centering and smooth transition.",
    "settings.quickReaction.label": "Quick reaction",
    "settings.quickReaction.hint": "Double-tap a message to set this reaction.",
    "settings.appIcon.label": "App icon",
    "settings.appIcon.hint": "Pick an icon — it will apply to the installed app. On iPhone the icon cannot be changed — this is an iOS limitation.",
    "settings.grandma.label": "Grandma mode",
    "settings.grandma.hint": "Simplifies the interface: removes 2FA, encryption, sign-out and extra menu items. Can be disabled by long-pressing the avatar in the sidebar (1.5 sec).",
    "settings.grandma.enable": "Enable Grandma mode",
    "settings.grandma.disable": "Disable Grandma mode",
    "settings.mfa.label": "Two-factor authentication",
    "settings.mfa.manage": "Manage 2FA",
    "settings.e2ee.label": "Encryption",
    "settings.e2ee.manage": "Manage encryption",

    // ---- Grandma mode: dialogs ----
    "grandma.enable.title": "Enable Grandma mode",
    "grandma.enable.text": "The following will be hidden: sign out, 2FA, encryption, chat list mode, channel creation, as well as the quick reactions and app icon sections.\n\nYou can disable it by long-pressing (1.5 sec) the avatar in the sidebar.",
    "grandma.enable.confirm": "Enable",
    "grandma.enabled.title": "Mode enabled",
    "grandma.enabled.text": "Interface simplified. To disable — hold your finger on your avatar in the top-left corner for 1.5 seconds.",
    "grandma.disable.title": "Disable Grandma mode",
    "grandma.disable.text": "Restore the full interface: sign out, 2FA, encryption and other settings?",
    "grandma.disable.confirm": "Disable",
    "grandma.disabled.title": "Mode disabled",
    "grandma.disabled.text": "Full interface restored.",

    // ---- 2FA: status ----
    "mfa.status.enabled": "✅ Enabled (since {date})",
    "mfa.status.disabled": "❌ Disabled. Enable it — this greatly increases security.",
    "mfa.status.error": "Failed to check 2FA status",

    // ---- E2EE: status ----
    "e2ee.status.off": "🔓 E2EE is off. Messages are stored on the server in plain text.",
    "e2ee.status.broken": "⚠️ Something is wrong: the flag is set, but no keys were found.",
    "e2ee.status.unlocked": "🔒 Enabled and unlocked.",
    "e2ee.status.locked": "🔒 Enabled, but the key is locked. Unlock with your password.",
    "e2ee.status.error": "Failed to check status",

    // ---- Own profile ----
    "profile.title": "Profile",
    "profile.section.avatar": "Avatar",
    "profile.section.name": "Name",
    "profile.section.bio": "About",
    "profile.section.gender": "Gender",
    "profile.section.username": "Username",
    "profile.section.birthday": "Birthday",
    "profile.upload": "Upload your own",
    "profile.name.placeholder": "Your name",
    "profile.bio.placeholder": "A few words about you...",
    "profile.gender.male": "Male",
    "profile.gender.female": "Female",
    "profile.gender.unset": "Not set",
    "profile.birthday.placeholder": "MM.DD or MM.DD.YYYY",
    "profile.birthday.calendar": "Pick a date",
    "profile.gifts": "Gifts",
    "profile.apply": "Apply changes",
    "profile.close": "Close",

    // ---- Other user's profile ----
    "userProfile.username": "Username",
    "userProfile.birthday": "Birthday",
    "userProfile.msgcount": "Messages in chat",
    "userProfile.created": "Account created",
    "userProfile.gifts": "Gifts",
    "userProfile.close": "Close",
    "userProfile.back": "Back",

    // ---- Birthday calendar ----
    "calendar.today": "Today",
    "calendar.clear": "Clear",
    "calendar.prevYear": "Year back",
    "calendar.prevMonth": "Month back",
    "calendar.nextMonth": "Month forward",
    "calendar.nextYear": "Year forward",

    // ---- Username hints ----
    "username.free": "@{username} is available",
    "username.taken": "@{username} is taken",
    "username.reserved": "@{username} is reserved",
    "username.current": "This is your current username",
    "username.checking": "Checking...",
    "username.error": "Check failed",
    "username.onlyLatin": "Only English letters, digits, _ and -",
    "username.tooShort": "At least 3 characters",
    "username.saved": "Saved",
    "username.invalid": "Check the username",

    // ---- Last seen ----
    "lastSeen.online": "online",
    "lastSeen.recently.male": "was online recently",
    "lastSeen.recently.female": "was online recently",
    "lastSeen.recently.other": "was online recently",
    "lastSeen.minutes.male": "was online {n} {word} ago",
    "lastSeen.minutes.female": "was online {n} {word} ago",
    "lastSeen.minutes.other": "was online {n} {word} ago",
    "lastSeen.hours.male": "was online {n} {word} ago",
    "lastSeen.hours.female": "was online {n} {word} ago",
    "lastSeen.hours.other": "was online {n} {word} ago",
    "lastSeen.today.male": "was online today at {time}",
    "lastSeen.today.female": "was online today at {time}",
    "lastSeen.today.other": "was online today at {time}",
    "lastSeen.yesterday.male": "was online yesterday at {time}",
    "lastSeen.yesterday.female": "was online yesterday at {time}",
    "lastSeen.yesterday.other": "was online yesterday at {time}",
    "lastSeen.date.male": "was online {date} at {time}",
    "lastSeen.date.female": "was online {date} at {time}",
    "lastSeen.date.other": "was online {date} at {time}",
    "lastSeen.minWord.one": "minute",
    "lastSeen.minWord.few": "minutes",
    "lastSeen.minWord.many": "minutes",
    "lastSeen.hourWord.one": "hour",
    "lastSeen.hourWord.few": "hours",
    "lastSeen.hourWord.many": "hours",

    // ---- Gifts: general ----
    "gifts.rarity.common": "Common",
    "gifts.rarity.rare": "Rare",
    "gifts.rarity.epic": "Epic",
    "gifts.title.mine": "My gifts",
    "gifts.title.user": "Gifts: {name}",
    "gifts.title.detail": "Gift",
    "gifts.title.catalog": "Gift catalog",
    "gifts.title.send": "Give a gift",
    "gifts.empty.mine": "You have no gifts yet.",
    "gifts.empty.other": "This user has no gifts.",
    "gifts.empty.catalog": "Catalog is empty",
    "gifts.empty.contacts": "You have no contacts yet",
    "gifts.buy.button": "Buy a gift",
    "gifts.buy.buttonFor": "Buy a gift for {name}",
    "gifts.soldOut": "Sold out",
    "gifts.lowBalance": "low",
    "gifts.detail.owner": "Owner",
    "gifts.detail.rarity": "Rarity",
    "gifts.detail.background": "Background",
    "gifts.detail.pattern": "Pattern",
    "gifts.detail.model": "Model",
    "gifts.detail.quantity": "Quantity",
    "gifts.detail.value": "Value",
    "gifts.detail.caption": "Caption",
    "gifts.detail.limit": "limit {n}",
    "gifts.detail.recipient": "Gift for {name}",
    "gifts.detail.sender": "From {name}",
    "gifts.purchase.saveSenderFail": "Failed to save sender name",
    "gifts.detail.notOwner": "This gift belongs to another user",
    "gifts.action.addToProfile": "Add to profile",
    "gifts.action.hideFromProfile": "Hide from profile",
    "gifts.action.gift": "Give",
    "gifts.action.sell": "Sell for {price}",
    "gifts.action.pin": "Pin",
    "gifts.action.unpin": "Unpin",
    "gifts.action.toProfile": "Add to profile",
    "gifts.action.fromProfile": "Remove from profile",
    "gifts.purchase.title.self": "Buy a gift for yourself",
    "gifts.purchase.title.other": "Buy a gift for {name}",
    "gifts.purchase.caption": "Caption (optional)",
    "gifts.purchase.withName.self": "With my name",
    "gifts.purchase.withName.other": "With that name",
    "gifts.purchase.cost": "Cost: {price}",
    "gifts.purchase.buy": "Buy",
    "gifts.purchase.buying": "Buying...",
    "gifts.send.subtitle": "Pick a recipient from your contacts",
    "gifts.send.confirm": "Give",
    "gifts.send.confirmTitle": "Transfer gift",
    "gifts.send.confirmText": "Transfer costs {price}. Continue?",
    "gifts.send.confirmAction": "Transfer for {price}",
    "gifts.send.notEnough": "Not enough Nectar",
    "gifts.send.notEnoughText": "You need {need} Nectar to transfer, you have {have}.",
    "gifts.sell.title": "Sell gift",
    "gifts.sell.text": "Sell for {price} Nectar (15% fee)?",
    "gifts.sell.confirm": "Sell",
    "gifts.notFound": "Not found",
    "gifts.error": "Error",

    // ---- Chat list previews ----
    "preview.gift": "🎁 Gift",
    "preview.photo": "📷 Photo",
    "preview.video": "🎥 Video",
    "preview.file": "📎 File",
    "preview.you": "You: ",
    "preview.noMessages": "No messages",
    "preview.encrypted": "🔒 Encrypted",

    // ---- Create channel ----
    "channel.create.title": "Create channel",
    "channel.create.avatar": "Avatar",
    "channel.create.name": "Name",
    "channel.create.namePlaceholder": "Channel name",
    "channel.create.username": "Channel username",
    "channel.create.visibility": "Channel type",
    "channel.create.visibility.public": "Public",
    "channel.create.visibility.request": "By request",
    "channel.create.visibility.private": "Private",
    "channel.create.visibility.hint": "Public — anyone can subscribe. By request — an approved request is required. Private — invite link only.",
    "channel.create.confirm": "Create channel",
    "channel.create.creating": "Creating...",
    "channel.create.uploadOwn": "Upload your own",

    // ---- Edit channel ----
    "channel.edit.title": "Edit channel",
    "channel.edit.save": "Save",
    "channel.edit.saving": "Saving...",
    "channel.edit.reactions": "Available reactions",
    "channel.edit.admins": "Administrators",
    "channel.edit.addAdmin": "+ Add administrator",
    "channel.edit.owner": "Channel owner",
    "channel.edit.transfer": "Transfer ownership",
    "channel.edit.noAdmins": "No administrators",
    "channel.edit.confirmAdd": "Choose administrator",
    "channel.edit.confirmAddText": "Who to make channel admin? You can search by name or @username.",
    "channel.edit.confirmAddAction": "Promote",
    "channel.edit.confirmTransfer": "Transfer ownership",
    "channel.edit.confirmTransferText": "Choose the new owner. You can search by name or @username. You will lose owner rights.",
    "channel.edit.confirmTransferAction": "Transfer",
    "channel.edit.confirmTransferConfirm": "Transfer ownership? This action is irreversible.",
    "channel.edit.transferSuccess": "Ownership transferred.",
    "channel.edit.removeAdminTitle": "Remove admin",
    "channel.edit.removeAdminText": "Remove from the admin position?",
    "channel.edit.removeAdminAction": "Remove",
    "channel.edit.noMembers": "No other subscribers in this channel",
    "channel.edit.allAdmins": "All subscribers are already administrators",
    "channel.edit.ownerRole": "Owner",
    "channel.edit.adminRole": "Admin",
    "channel.edit.subscriberRole": "Subscriber",

    // ---- Channel profile ----
    "channel.profile.title": "Channel profile",
    "channel.profile.username": "Channel username",
    "channel.profile.subs": "Subscribers",
    "channel.profile.subsHint": "Subscribers · tap to see the list",
    "channel.profile.requests": "Join requests",
    "channel.profile.requestsHint": "Join requests · tap to see the list",
    "channel.profile.requestsHintPlural": "{n} {word} · tap to see",
    "channel.profile.views": "Total views",
    "channel.profile.created": "Created on",
    "channel.profile.subsList": "Subscribers",
    "channel.profile.noSubs": "No subscribers",
    "channel.profile.requestsList": "Join requests",
    "channel.profile.noRequests": "No active requests",
    "channel.subsWord.one": "subscriber",
    "channel.subsWord.few": "subscribers",
    "channel.subsWord.many": "subscribers",
    "channel.requestWord.one": "request",
    "channel.requestWord.few": "requests",
    "channel.requestWord.many": "requests",

    // ---- Channel profile menu ----
    "channel.menu.edit": "Edit",
    "channel.menu.delete": "Delete channel",

    // ---- Invites ----
    "invite.title": "Invite link",
    "invite.text": "Anyone with the link can subscribe to the channel.",
    "invite.create": "Create new link",
    "invite.empty": "No links yet",
    "invite.open": "Open in this tab",
    "invite.share": "Forward",
    "invite.copy": "Copy",
    "invite.revoke": "Revoke",
    "invite.revokeTitle": "Revoke link",
    "invite.revokeText": "The link will stop working. Continue?",
    "invite.revokeAction": "Revoke",

    // ---- Delete channel ----
    "channel.delete.title": "Delete channel",
    "channel.delete.text": "Channel \"{name}\" will be permanently deleted from all subscribers. Continue?",
    "channel.delete.continue": "Continue",
    "channel.delete.confirmTitle": "Confirmation",
    "channel.delete.confirmText": "Enter the channel name \"{name}\" to confirm",
    "channel.delete.mismatch": "Cancelled",
    "channel.delete.mismatchText": "Name doesn't match. Channel was not deleted.",

    // ---- Subscribe / requests ----
    "channel.sub.unsubscribeTitle": "Unsubscribe",
    "channel.sub.unsubscribeText": "Unsubscribe from channel \"{name}\"?",
    "channel.sub.unsubscribeAction": "Unsubscribe",
    "channel.sub.privateTitle": "Private channel",
    "channel.sub.privateText": "You can only join this channel via an invite link.",
    "channel.sub.errorSub": "Subscribe error",
    "channel.sub.errorUnsub": "Unsubscribe error",
    "channel.sub.onlyAdminsDelete": "Only administrators can delete messages in a channel",
    "channel.sub.onlyAdminsPin": "Only administrators can pin messages in a channel",
    "channel.sub.cantWrite": "You are not a subscriber of this channel",

    // ---- Requests (approve/reject) ----
    "request.approve": "Approve",
    "request.reject": "Decline",

    // ---- Channel errors ----
    "channel.err.notFound": "Channel not found",
    "channel.err.createFail": "Failed to create channel: {msg}",
    "channel.err.usernameTaken": "Username is already taken",
    "channel.err.noReactions": "Choose at least one reaction",
    "channel.err.enterName": "Enter a name",
    "channel.err.enterUsername": "Enter a username",
    "channel.err.checkUsername": "Check the username",
    "channel.err.noRightsOwner": "Only the channel owner can do this",
    "channel.err.noRightsAdmin": "Only administrators can do this",

    // ---- Forward ----
    "forward.title": "Forward",
    "forward.info": "Selected chats: {n} / 10",
    "forward.pickChats": "Pick chats",
    "forward.hideSender": "Hide sender",
    "forward.send": "Forward",
    "forward.cancel": "Cancel",
    "forward.limit": "Maximum 10 chats",
    "forward.none": "No chats",
    "forward.done": "Done",
    "forward.linkSent": "Link sent.",

    // ---- Attachment preview ----
    "attach.title.image": "Send image",
    "attach.title.video": "Send video",
    "attach.title.file": "Send file",
    "attach.title.generic": "Send",
    "attach.asFile": "Send as file",
    "attach.caption": "Caption",
    "attach.captionPlaceholder": "Enter a caption...",
    "attach.addFile": "Add file",
    "attach.remove": "Remove",
    "attach.send": "Send",
    "attach.cancel": "Cancel",
    "attach.tooBig": "File is too large",
    "attach.tooBigText": "\"{name}\" is larger than {size}.",
    "attach.tooMany": "Too many files",
    "attach.tooManyText": "Maximum {n} files at once.",

    // ---- Other alerts ----
    "alert.error": "Error",
    "alert.notSent": "Not sent",
    "alert.notSentBlocked": "Message not sent: there is a block.",
    "alert.notSentAttachment": "There is a block — attachment was not sent.",
    "alert.cant": "Not allowed",
    "alert.noChatYet": "First send a message to this person — the chat will be created",
    "alert.createChatFail": "Failed to create chat",

    // ---- Message context menu ----
    "msgCtx.reply": "Reply",
    "msgCtx.pin": "Pin",
    "msgCtx.unpin": "Unpin",
    "msgCtx.copy": "Copy",
    "msgCtx.edit": "Edit",
    "msgCtx.fwd": "Forward",
    "msgCtx.del": "Delete",
    "msgCtx.sel": "Select",
    "msgCtx.expand": "More reactions",

    // ---- Format menu ----
    "fmt.bold": "Bold",
    "fmt.underline": "Underline",
    "fmt.italic": "Italic",
    "fmt.strike": "Strikethrough",
    "fmt.quote": "Quote",
    "fmt.mono": "Monospace",
    "fmt.spoiler": "Spoiler",

    // ---- Reply bar ----
    "replyBar.answer": "Reply",
    "replyBar.edit": "Editing",

    // ---- Pinned ----
    "pins.title": "Pinned messages",
    "pins.one": "Pinned message",
    "pins.multi": "Pinned message · {i} of {total}",
    "pins.scope.shared": "Shared",
    "pins.scope.personal": "Personal",
    "pins.unpin": "Unpin",
    "pins.unpinChannel": "Unpin this message in the channel?",
    "pins.unpinShared": "Unpin this message for both?",
    "pins.unpinMine": "Unpin this message for yourself?",
    "pins.unpinOne": "Unpin message {label}?",
    "pins.none": "No pinned messages yet.",
    "pins.you": "You",
    "pins.gift": "🎁 Gift",
    "pins.tokens": "🧩 ImagiTokens",
    "pins.noText": "(no text)",
    "pins.choose": "Unpin",
    "pins.chooseText": "What to unpin?",
    "pins.chooseUnpinMe": "For me",
    "pins.chooseUnpinBoth": "For both",
    "pins.chooseAction": "Unpin",
    "pins.pinTitle": "Pin",
    "pins.pinText": "How to pin?",
    "pins.pinMe": "For me",
    "pins.pinBoth": "For both",
    "pins.pinAction": "Pin",
    "pins.unpinLabelBoth": "for both",
    "pins.unpinLabelMine": "for yourself",

    // ---- Delete / clear ----
    "delete.one.title": "Delete message",
    "delete.one.text": "Delete for whom?",
    "delete.me": "For me",
    "delete.both": "For both",
    "delete.action": "Delete",
    "delete.selected.title": "Delete messages",
    "delete.selected.text": "Will be deleted: {n}",
    "delete.failed.title": "Failed to delete",
    "delete.failed.text": "The server did not confirm deletion. RLS policy probably does not allow deleting this message.",
    "delete.clear.title": "Clear chat",
    "delete.clear.text": "What to clear?",
    "delete.clear.me": "Only for me",
    "delete.clear.both": "For both",
    "delete.clear.action": "Clear",
    "delete.chat.title": "Delete chat",
    "delete.chat.text": "What to delete?",
    "delete.chat.me": "For me (returns on new message)",
    "delete.chat.both": "For both (permanent)",
    "delete.chat.action": "Delete",
    "delete.limit.title": "Limit",
    "delete.limit.text": "Maximum 100 messages",

    // ---- About ----
    "about.title": "About",
    "about.section.about": "About the app",
    "about.text.about": "Cell is a family messenger. Each chat is a cell, and together they assemble into the hive of your close ones. No public noise here: only you, your family and those you trust.",
    "about.section.features": "Features",
    "about.text.features": "Private chats and channels, attachments and gifts, pins and search, reactions and forwarding — everything to stay in touch.",
    "about.section.credits": "Credits",
    "about.section.version": "Version",
    "about.close": "Close",
    "about.credits.before": "Some icons are taken from",
    "about.credits.and": "and",
    "about.credits.after": "Thanks to the authors for the free sets.",

    // ---- Command palette ----
    "cmd.placeholder": "Search chats, channels, people or a command >",
    "cmd.foot.select": "select",
    "cmd.foot.open": "open",
    "cmd.empty": "Nothing found",
    "cmd.kind.cmd": "cmd",
    "cmd.kind.channel": "channel",
    "cmd.kind.chat": "chat",
    "cmd.kind.profile": "profile",
    "cmd.cmd.create-channel": "Create channel",
    "cmd.cmd.create-channel.sub": "Opens the channel creation dialog",
    "cmd.cmd.profile": "Profile",
    "cmd.cmd.profile.sub": "Your profile",
    "cmd.cmd.gifts": "Gifts",
    "cmd.cmd.gifts.sub": "Open my gifts",
    "cmd.cmd.channel-edit": "Channel settings",
    "cmd.cmd.channel-edit.sub": "Only for the owner/admin of an open channel",
    "cmd.cmd.about": "About",
    "cmd.cmd.about.sub": "Cell · credits",

    // ---- Emoji picker ----
    "emoji.recent.empty": "Recently used emojis will appear here",

    // ---- Nectar ----
    "tokens.title": "Send Nectar",
    "tokens.to": "To: {name}",
    "tokens.balance": "You have: {balance}",
    "tokens.amountPlaceholder": "Amount",
    "tokens.send": "Send",

    // ---- System messages ----
    "msg.gift.youSent": "You sent a gift worth {price} {icon}",
    "msg.gift.sent.male": "{name} sent you a gift worth {price} {icon}",
    "msg.gift.sent.female": "{name} sent you a gift worth {price} {icon}",
    "msg.gift.sent.other": "{name} sent you a gift worth {price} {icon}",
    "msg.tokens.youSent": "You sent {amount} {icon}",
    "msg.tokens.sent.male": "{name} sent you {amount} {icon} Nectar",
    "msg.tokens.sent.female": "{name} sent you {amount} {icon} Nectar",
    "msg.tokens.sent.other": "{name} sent you {amount} {icon} Nectar",

    // ---- Empty states ----
    "empty.noChats": "No chats yet.<br>Type @username above to find someone.",
    "empty.noChatsShort": "No chats yet.",
    "empty.noMessages": "No messages yet. Be the first to write!",
    "empty.noMessagesChannel": "No messages in this channel yet.",
    "empty.channelNoRead": "You are not a subscriber.<br>Send a request to read messages.",
    "empty.channelNoReadPrivate": "This channel is private.<br>Only subscribers can read messages.",
    "empty.loading": "Loading...",
    "empty.searching": "Searching...",
    "empty.search.start": "Start typing a name or @username",
    "empty.search.notFound": "Nobody found for \"{query}\"",
    "empty.search.empty": "Empty",
    "empty.startChat": "No messages here yet. Write first!",

    // ---- Blocking (dialogs) ----
    "block.confirm.title": "Block",
    "block.confirm.text": "Block @{username}?",
    "block.confirm.action": "Block",
    "block.failed": "Failed",

    // ---- Final bits ----
    "grandma.logoutBlocked.title": "Sign-out blocked",
    "grandma.logoutBlocked.text": "Grandma mode is on. First disable it by long-pressing the avatar in the sidebar.",
    "inactivity.expired": "Session expired due to inactivity. Please log in again.",
    "date.today": "Today",
    "date.yesterday": "Yesterday",
    "e2ee.msg.locked": "🔒 Encrypted — unlock in settings",
    "e2ee.msg.noChannelKey": "🔒 No channel key",
    "e2ee.msg.decryptFailed": "🔒 Failed to decrypt",
    "e2ee.msg.noSharedKey": "🔒 No key to decrypt",
    "attach.encryptedLoading": "🔒 Loading...",
    "attach.encryptedLoadingFile": "🔒 Loading file...",
    "attach.encryptedBlocked": "🔒 File is encrypted.<br>Unlock in settings to view.",
    "attach.loadingShort": "⏳ Loading…",
    "media.loadVideoFailed": "❌ Failed to load video.",
    "media.loadVideoFailedHint": "The link may have expired. Re-open the attachment.",
    "media.loadImageFailed": "❌ Failed to load image.",
    "media.loadImageFailedHint": "The link may have expired. Re-open the attachment.",

    // ---- 2FA ----
    "mfa.title": "Two-factor authentication",
    "mfa.challenge.text": "Open your authenticator app and enter the 6-digit code.",
    "mfa.challenge.submit": "Confirm",
    "mfa.challenge.exit": "Exit",
    "mfa.err.6digits": "Enter 6 digits",
    "mfa.err.noFactor": "No active TOTP factor",
    "mfa.err.wrongCode": "Wrong code",
    "mfa.err.confirmFailed": "Could not confirm 2FA. Try again in 30 seconds.",
    "mfa.err.noUser": "Failed to get user data",
    "mfa.err.verifyFailed": "Code verification error",
    "mfa.setup.enabledText": "Two-factor authentication is <b>enabled</b>. You'll need a 6-digit code from the app to sign in.",
    "mfa.setup.disableBtn": "Disable 2FA",
    "mfa.setup.disableTitle": "Disable 2FA",
    "mfa.setup.disableText": "This will greatly reduce account security. Continue?",
    "mfa.setup.disableAction": "Disable",
    "mfa.setup.errorPrefix": "Error: {msg}",
    "mfa.setup.steps": "1. Open <b>Google Authenticator</b>, <b>Authy</b> or <b>1Password</b>.<br>2. Scan the QR code.<br>3. Enter the 6-digit code below.",
    "mfa.setup.manual": "If you can't scan the QR, enter the code manually:",
    "mfa.setup.activate": "Activate 2FA",
    "mfa.setup.factorNotActive": "The factor was not activated. Try again.",
    "mfa.setup.doneTitle": "Done",
    "mfa.setup.doneText": "Two-factor authentication is enabled!",

    // ---- E2EE: wizard ----
    "e2ee.title.init": "Enable encryption",
    "e2ee.title.unlock": "Unlock encryption",
    "e2ee.title.enabled": "Encryption enabled",
    "e2ee.setup.enabledText": "🔒 All new direct messages are encrypted on your device. The server sees only ciphertext.",
    "e2ee.setup.showSafety": "🔑 Show safety number",
    "e2ee.setup.lockNow": "🔒 Lock now",
    "e2ee.setup.disableBtn": "Disable encryption",
    "e2ee.setup.noChatTitle": "No chat",
    "e2ee.setup.noChatText": "Open a chat with someone and tap again.",
    "e2ee.setup.lockTitle": "Lock now",
    "e2ee.setup.lockText": "The private key will be forgotten. To read encrypted messages again, you'll need to enter your password.",
    "e2ee.setup.lockAction": "Lock",
    "e2ee.setup.unlockText": "Your private key is stored encrypted. Enter your password to read encrypted messages.",
    "e2ee.setup.unlockPassword": "Password",
    "e2ee.setup.trustDevice": "Trust this device — don't ask for the password next time",
    "e2ee.setup.unlockBtn": "Unlock",
    "e2ee.setup.unlockDone": "Key unlocked.",
    "e2ee.setup.unlockErr": "Wrong password or corrupted key",
    "e2ee.setup.initText": "Cell will generate a key pair on your device. The private key will be encrypted with your password and stored on the server encrypted.<br><br><b>Important:</b> we cannot recover it if you forget the password. Additionally, <b>12 recovery words</b> will be generated — save them.",
    "e2ee.setup.initBtn": "Generate keys",
    "e2ee.setup.initLoading": "Generating...",
    "e2ee.setup.pwTooShort": "Password is too short (min. 8)",
    "e2ee.setup.recoveryTitle": "⚠️ Recovery code",
    "e2ee.setup.recoveryText": "Save these 12 words in a safe place (password manager or paper). If you forget your password — <b>only with them</b> will you be able to recover access to encrypted messages. We won't be able to help you.",
    "e2ee.setup.recoveryConfirm": "I saved the code and understand I can't recover access without it",
    "e2ee.setup.recoveryContinue": "Continue",
    "e2ee.setup.recoveryBack": "Cancel",
    "e2ee.setup.enabledDone": "Encryption is on.",
    "e2ee.disable.title": "Disable encryption",
    "e2ee.disable.text": "All NEW messages will be stored in plain text. Already encrypted ones will remain encrypted. Continue?",
    "e2ee.disable.action": "Disable",
    "e2ee.safety.lockedTitle": "Locked",
    "e2ee.safety.lockedText": "Unlock encryption in settings.",
    "e2ee.safety.noKeyTitle": "No key",
    "e2ee.safety.noKeyText": "This user has encryption disabled.",
    "e2ee.safety.title": "Safety number",
    "e2ee.safety.text": "Verify this code with @{username} in person or out loud. If it matches — no one is eavesdropping.\n\n{groups}",
    "e2ee.err.noSavedKeys": "No saved keys",

    // ---- File upload: errors ----
    "attach.err.readTitle": "File read error",
    "attach.err.uploadTitle": "Upload error",
    "attach.err.notSent": "Not sent",
    "attach.err.network": "Network error",
  },
};

// Текущий язык. Приоритет: сохранённый в localStorage → по браузеру → ru.
let currentLang = "ru";
try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "ru" || saved === "en") {
    currentLang = saved;
  } else if (navigator.language && navigator.language.toLowerCase().startsWith("en")) {
    currentLang = "en";
  }
} catch (e) { /* silent */ }

// Хелпер перевода. Если ключа нет в текущем языке — падаем на ru,
// потом на fallback, потом на сам ключ (чтобы не было пустоты).
function t(key, fallback) {
  const dict = I18N[currentLang] || I18N.ru;
  if (dict[key] !== undefined) return dict[key];
  if (I18N.ru[key] !== undefined) return I18N.ru[key];
  return fallback !== undefined ? fallback : key;
}

// t + подстановка {placeholder}-ов. Пример:
//   tFmt("block.youBlocked", { username: "vasya" })
//   → "Ты заблокировал(а) @vasya."
function tFmt(key, vars, fallback) {
  let s = t(key, fallback);
  if (vars) {
    for (const k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k)) {
        s = s.split("{" + k + "}").join(String(vars[k]));
      }
    }
  }
  return s;
}

// Локаль для форматирования дат под текущий язык.
function localeId() {
  return currentLang === "en" ? "en-US" : "ru-RU";
}

// Возвращает текст превью для сообщения в списке чатов.
// isMine — true, если это наше исходящее сообщение (тогда "Вы: ...").
function previewTextForMsg(m, isMine) {
  if (!m) return t("preview.noMessages");
  if (m.message_type === "tokens") return `🧩 +${m.tokens_amount}`;
  if (m.message_type === "gift") return t("preview.gift");
  if (m.message_type === "attachment") {
    if (m.file_kind === "image") return t("preview.photo");
    if (m.file_kind === "video") return t("preview.video");
    return t("preview.file");
  }
  if (m.encrypted) return t("preview.encrypted");
  return (isMine ? t("preview.you") : "") + stripMarkdown(m.content || "");
}

// Переключить язык и перерисовать все видимые тексты.
function setLanguage(lang) {
  if (lang !== "ru" && lang !== "en") return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* silent */ }
  applyLanguage();
  // Заголовок секции управляется JS — обновим его вручную.
  const titleEl = document.getElementById("section-title");
  const searchInput = document.getElementById("search-input");
  if (titleEl) {
    if (searchInput && searchInput.value.trim()) titleEl.textContent = t("sidebar.section.search");
    else titleEl.textContent = t("sidebar.section.chats");
  }
  // Дни недели в календаре дня рождения (в HTML они статичны).
  const bcDaysHead = document.querySelector(".bc-days-head");
  if (bcDaysHead) {
    const ru = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    const en = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const days = currentLang === "en" ? en : ru;
    bcDaysHead.querySelectorAll("span").forEach((s, i) => {
      if (days[i]) s.textContent = days[i];
    });
  }
  // Текст кнопки «Бабушка» управляется JS — обновим через applyGrandmaModeUI.
  if (typeof applyGrandmaModeUI === "function") applyGrandmaModeUI();
  // Если открыт чат — обновим заголовок баннера блокировки (там текст
  // зависит от текущего языка).
  if (typeof updateBlockUI === "function") updateBlockUI();
  // Перепроверить статусы в настройках (2FA / E2EE) — они строятся из t().
  const settingsOverlay = document.getElementById("settings-overlay");
  if (settingsOverlay && !settingsOverlay.classList.contains("hidden")) {
    if (typeof refreshMfaStatus === "function") refreshMfaStatus();
    if (typeof refreshE2eeStatus === "function") refreshE2eeStatus();
  }
  // Если открыто окно подарков — перерисуем текущий экран под новый язык.
  const giftsOverlay = document.getElementById("gifts-overlay");
  if (giftsOverlay && !giftsOverlay.classList.contains("hidden")) {
    if (typeof renderGiftsMain === "function") renderGiftsMain(currentUser.id);
  }
  // Перерисуем список чатов — там превью и заголовки.
  if (typeof loadRecentChats === "function" && currentUser) {
    loadRecentChats().catch(() => {});
  }
  // Если открыт чат — перезагрузим сообщения (системные gift/tokens зависят от t()).
  if (typeof currentChatId !== "undefined" && currentChatId && typeof loadMessages === "function") {
    loadMessages(currentChatId, openSeq).then(() => {
      if (typeof loadReactionsForVisibleMessages === "function") loadReactionsForVisibleMessages();
    }).catch(() => {});
  }
  // Если открыт профиль канала — обновим счётчики (там word / hint строятся из t()).
  const chProfileOverlay = document.getElementById("channel-profile-overlay");
  if (chProfileOverlay && !chProfileOverlay.classList.contains("hidden")) {
    if (typeof openChannelProfileDialog === "function" && currentChannelObj) {
      openChannelProfileDialog();
    }
  }
  // Если открыт редактор канала — перерисуем админов (там роли из t()).
  const chEditOverlay = document.getElementById("channel-edit-overlay");
  if (chEditOverlay && !chEditOverlay.classList.contains("hidden")) {
    if (typeof renderChannelEditAdmins === "function") renderChannelEditAdmins();
  }
  // Если открыт предпросмотр вложений — обновим заголовок.
  const attachOverlay = document.getElementById("attach-preview-overlay");
  if (attachOverlay && !attachOverlay.classList.contains("hidden")) {
    if (typeof renderAttachPreview === "function") renderAttachPreview();
  }
  // Если открыто ПКМ-меню сообщения — обновим метку pin/unpin.
  const msgMenu = document.getElementById("msg-context-menu");
  if (msgMenu && !msgMenu.classList.contains("hidden") && typeof contextMsgId !== "undefined" && contextMsgId) {
    if (typeof updatePinMenuLabel === "function") updatePinMenuLabel(contextMsgId);
  }
  // Заголовок окна закрепов перерисуем, если открыто.
  const pinsOverlay = document.getElementById("pinned-list-overlay");
  if (pinsOverlay && !pinsOverlay.classList.contains("hidden")) {
    if (typeof openPinnedListDialog === "function") openPinnedListDialog();
  }
}

// Применяет переводы к статическому HTML:
//  - data-i18n              → textContent
//  - data-i18n-placeholder  → placeholder
//  - data-i18n-title        → title (тултип)
// Плюс подсвечивает активную кнопку в переключателе языка.
function applyLanguage() {
  document.documentElement.setAttribute("lang", currentLang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    // Пропускаем section-title — им управляет JS (Чаты/Поиск), и
    // data-i18n там может перетереть актуальное значение. Оно обновится
    // через явный вызов loadRecentChats/performSearch.
    if (el.id === "section-title") return;
    if (!key) return;
    const str = t(key);
    // Если в строке есть HTML-теги (<b>, <br>) — вставляем через innerHTML,
    // иначе — безопасный textContent.
    if (/<[a-z][^>]*>/i.test(str)) el.innerHTML = str;
    else el.textContent = str;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.setAttribute("placeholder", t(key));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) el.setAttribute("title", t(key));
  });
  // Отдельно — data-placeholder (у contenteditable нет attribute placeholder,
  // там CSS читает attr(data-placeholder)).
  document.querySelectorAll("[data-i18n-data-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-data-placeholder");
    if (key) el.setAttribute("data-placeholder", t(key));
  });

  const langToggle = document.getElementById("settings-language-toggle");
  if (langToggle) {
    langToggle.querySelectorAll("button[data-lang]").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === currentLang);
    });
  }
}

// Применяем язык сразу при загрузке скрипта — DOM уже разобран
// (app.js подключён как type="module" → defer-поведение).
applyLanguage();

// ======================= Nectar (валюта) =======================
const NECTAR_ICON_URL = "https://i.ibb.co/MkfVPGwZ/icons8-100.png";
const NECTAR_HTML = `<img class="nectar-icon" src="${NECTAR_ICON_URL}" alt="Nectar" draggable="false">`;

function nectarize(text) {
  return escapeHtml(String(text || "")).replace(/🧩/g, NECTAR_HTML);
}

// ======================= 1. АВТОРИЗАЦИЯ =======================
const tabs = document.querySelectorAll(".tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

tabs.forEach((tab) => tab.addEventListener("click", () => {
  tabs.forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  const which = tab.dataset.tab;
  if (which === "login") { loginForm.classList.remove("hidden"); registerForm.classList.add("hidden"); }
  else { loginForm.classList.add("hidden"); registerForm.classList.remove("hidden"); }
}));

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("register-error");
  errEl.style.color = ""; errEl.textContent = "";
  const username = document.getElementById("reg-username").value.trim();
  const displayName = document.getElementById("reg-displayname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  if (!username) { errEl.textContent = t("auth.err.username.required"); return; }
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) { errEl.textContent = t("auth.err.username.format"); return; }
  if (!displayName) { errEl.textContent = t("auth.err.displayname.required"); return; }
  if (!email) { errEl.textContent = t("auth.err.email.required"); return; }
  if (!password || password.length < 10) {
    errEl.textContent = t("auth.err.password.short");
    return;
  }
  if (!/[A-ZА-Я]/.test(password) || !/[a-zа-я]/.test(password) || !/\d/.test(password)) {
    errEl.textContent = t("auth.err.password.complex");
    return;
  }
  errEl.style.color = "var(--accent)"; errEl.textContent = t("auth.err.register.loading");
  try {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username, display_name: displayName } } });
    if (error) { errEl.style.color = ""; errEl.textContent = error.message || t("auth.err.prefix"); return; }
    if (data.session) showApp(data.session.user);
    else { errEl.style.color = "var(--accent)"; errEl.textContent = t("auth.err.register.checkEmail"); }
  } catch (ex) { errEl.style.color = ""; errEl.textContent = t("auth.err.prefix") + ": " + (ex.message || ex); }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("login-error"); errEl.textContent = "";

  if (isLoginLocked()) {
    errEl.textContent = t("auth.err.login.tooManyAttempts");
    return;
  }

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    registerLoginAttempt();
    errEl.textContent = error.message;
    return;
  }

  clearLoginAttempts();

  // Проверяем, включена ли у пользователя 2FA
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel === "aal1") {
      // Пароль верный, но нужно пройти 2FA
      pendingMfaUser = data.user;
      document.getElementById("login-password").value = "";
      document.getElementById("mfa-challenge-code").value = "";
      document.getElementById("mfa-challenge-error").textContent = "";
      document.getElementById("mfa-challenge-overlay").classList.remove("hidden");
      setTimeout(() => document.getElementById("mfa-challenge-code").focus(), 80);
      return;
    }
  } catch (e) { /* если MFA не настроена — идём дальше */ }

  showApp(data.user);
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  // 🔴 В режиме «Бабушка» выход заблокирован — кнопка обычно скрыта,
  // но на всякий случай блокируем и здесь.
  if (isGrandmaMode()) {
    await showAlertDialog(
      t("grandma.logoutBlocked.title"),
      t("grandma.logoutBlocked.text")
    );
    return;
  }

  // Локальный (анонимный) аккаунт: НЕ вызываем signOut — он отзывает
  // refresh-токен на сервере (даже со scope:"local"), и вернуться потом
  // уже нельзя. Вместо этого сохраняем токены в отдельный ключ,
  // стираем ключ сессии supabase и перезагружаем страницу.
  // После reload supabase-js создастся с пустым localStorage → экран входа.
  // Refresh-токен на сервере остаётся валидным — при следующем
  // «Войти локально» мы поднимем ту же самую сессию через setSession().
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const isLocal = user && (
      user.is_anonymous === true ||
      !user.email ||
      (user.app_metadata && user.app_metadata.provider === "anonymous")
    );
    if (isLocal) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }));
        }
      } catch (e) { /* silent */ }
      // Очищаем ТОЛЬКО ключ сессии supabase, не трогая cell_local_session
      try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) {}
      // Перезагрузка — гарантирует, что in-memory состояние supabase-js тоже сбросится
      window.location.reload();
      return;
    }
  } catch (e) { /* silent */ }

  // Обычный аккаунт — прежняя логика
  await supabase.auth.signOut();
  showAuth();
});

// ═══════════════════════════════════════════════════════
// 2FA (TOTP через Supabase MFA)
// ═══════════════════════════════════════════════════════

function setupMfaUI() {
  const codeInput = document.getElementById("mfa-challenge-code");
  const submitBtn = document.getElementById("mfa-challenge-submit");
  const cancelBtn = document.getElementById("mfa-challenge-cancel");
  if (!codeInput || !submitBtn || !cancelBtn) return;

  // Только цифры, максимум 6
  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
  });

  async function submitChallenge() {
    const code = codeInput.value.trim();
    const errEl = document.getElementById("mfa-challenge-error");
    errEl.textContent = "";
    if (code.length !== 6) {
      errEl.textContent = t("mfa.err.6digits");
      return;
    }

    try {
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) { errEl.textContent = listErr.message; return; }
      const totp = factors && factors.totp && factors.totp.find(f => f.status === "verified");
      if (!totp) { errEl.textContent = t("mfa.err.noFactor"); return; }

      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (chalErr) { errEl.textContent = chalErr.message; return; }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: chal.id,
        code,
      });
      if (verifyErr) {
        errEl.textContent = verifyErr.message || t("mfa.err.wrongCode");
        codeInput.value = "";
        return;
      }

      // КРИТИЧНО: на PWA / мобильных уровень сессии aal2 «доезжает» с задержкой.
      // Пробуем несколько раз: refreshSession + getAuthenticatorAssuranceLevel.
      let aal2Ok = false;
      for (let i = 0; i < 6; i++) {
        try { await supabase.auth.refreshSession(); } catch (e) { /* silent */ }
        const { data: aalAfter } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalAfter && aalAfter.currentLevel === "aal2") { aal2Ok = true; break; }
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!aal2Ok) {
        errEl.textContent = t("mfa.err.confirmFailed");
        codeInput.value = "";
        return;
      }

      document.getElementById("mfa-challenge-overlay").classList.add("hidden");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        errEl.textContent = t("mfa.err.noUser");
        return;
      }
      showApp(user);
    } catch (e) {
      errEl.textContent = e.message || t("mfa.err.verifyFailed");
    }
  }

  submitBtn.addEventListener("click", submitChallenge);
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); submitChallenge(); }
  });
  cancelBtn.addEventListener("click", async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    document.getElementById("mfa-challenge-overlay").classList.add("hidden");
    pendingMfaUser = null;
  });
}

async function refreshMfaStatus() {
  const row = document.getElementById("mfa-status-row");
  if (!row) return;
  try {
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data && data.totp && data.totp.find(f => f.status === "verified");
    if (totp) {
      const dt = totp.created_at ? new Date(totp.created_at).toLocaleDateString(localeId()) : "—";
      // Заменяем «жирные» вставки через небольшой HTML-хак: берём шаблон,
      // подставляем дату, а «Включена» / «Enabled» оборачиваем в <b>.
      const raw = tFmt("mfa.status.enabled", { date: dt });
      row.innerHTML = escapeHtml(raw).replace(
        /(Включена|Enabled)/,
        "<b>$1</b>"
      );
    } else {
      const raw = t("mfa.status.disabled");
      row.innerHTML = escapeHtml(raw).replace(
        /(Отключена|Disabled)/,
        "<b>$1</b>"
      );
    }
  } catch (e) {
    row.textContent = t("mfa.status.error");
  }
}

async function openMfaSetup() {
  const overlay = document.getElementById("mfa-setup-overlay");
  const body = document.getElementById("mfa-setup-body");
  overlay.classList.remove("hidden");
  body.innerHTML = '<div class="empty">Загрузка...</div>';

  try {
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data && data.totp && data.totp.find(f => f.status === "verified");

    if (totp) {
      // Уже включена — показываем кнопку отключения
      body.innerHTML = `
        <div class="dialog-text">
          ${t("mfa.setup.enabledText")}
        </div>
        <button class="dialog-btn" id="mfa-disable-btn"
                style="width:100%;background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger);">
          ${escapeHtml(t("mfa.setup.disableBtn"))}
        </button>`;
      document.getElementById("mfa-disable-btn").addEventListener("click", async () => {
        const ok = await showConfirmDialog(
          t("mfa.setup.disableTitle"),
          t("mfa.setup.disableText"),
          t("mfa.setup.disableAction")
        );
        if (!ok) return;
        const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id });
        if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
        await refreshMfaStatus();
        closeMfaSetup();
      });
      return;
    }

    // Ещё не включена — генерируем QR
    const friendlyName = "Cell " + (myProfile && myProfile.username ? "@" + myProfile.username : "");
    const { data: enrollData, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });
    if (error) {
      body.innerHTML = `<div class="dialog-text" style="color:var(--danger);">${escapeHtml(tFmt("mfa.setup.errorPrefix", { msg: error.message }))}</div>`;
      return;
    }

    const qrSvg = enrollData.totp.qr_code; // это уже <svg>...</svg>
    const secret = enrollData.totp.secret;
    const factorId = enrollData.id;

    body.innerHTML = `
      <div class="dialog-text">
        ${t("mfa.setup.steps")}
      </div>
      <div style="background:#fff;padding:12px;border-radius:12px;width:fit-content;margin:0 auto 12px;">
        ${qrSvg}
      </div>
      <div class="dialog-text" style="text-align:center;font-size:12px;">
        ${escapeHtml(t("mfa.setup.manual"))}<br>
        <code style="font-size:13px;user-select:all;word-break:break-all;">${escapeHtml(secret)}</code>
      </div>
      <input type="text" id="mfa-setup-code" inputmode="numeric" maxlength="6"
             placeholder="000000" autocomplete="one-time-code"
             style="width:100%;padding:14px;background:var(--bg-input);
                    border:1px solid var(--border);border-radius:12px;
                    color:var(--text);font-size:22px;letter-spacing:8px;
                    text-align:center;outline:none;margin:10px 0;">
      <p class="error" id="mfa-setup-error" style="margin-bottom:10px;"></p>
      <button class="dialog-btn dialog-primary" id="mfa-setup-verify" style="width:100%;">
        ${escapeHtml(t("mfa.setup.activate"))}
      </button>`;

    const setupCode = document.getElementById("mfa-setup-code");
    setupCode.addEventListener("input", () => {
      setupCode.value = setupCode.value.replace(/\D/g, "").slice(0, 6);
    });
    setTimeout(() => setupCode.focus(), 80);

    document.getElementById("mfa-setup-verify").addEventListener("click", async () => {
      const code = setupCode.value.trim();
      const err = document.getElementById("mfa-setup-error");
      err.textContent = "";
      if (code.length !== 6) { err.textContent = t("mfa.err.6digits"); return; }

      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chalErr) { err.textContent = chalErr.message; return; }

      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId, challengeId: chal.id, code,
      });
      if (verErr) { err.textContent = verErr.message || t("mfa.err.wrongCode"); return; }

      // Дополнительная проверка: фактор должен стать «verified».
      // Без неё бывает, что SDK думает «всё ок», но при следующем входе
      // 2FA не запрашивается, пока не перезагрузишь страницу.
      const { data: factorsAfter } = await supabase.auth.mfa.listFactors();
      const verified = factorsAfter && factorsAfter.totp &&
        factorsAfter.totp.find(f => f.id === factorId && f.status === "verified");
      if (!verified) {
        err.textContent = t("mfa.setup.factorNotActive");
        return;
      }

      // Обновляем сессию — чтобы статус MFA сразу подтянулся во всех местах.
      try { await supabase.auth.refreshSession(); } catch (e) { /* silent */ }

      await refreshMfaStatus();
      closeMfaSetup();
      await showAlertDialog(t("mfa.setup.doneTitle"), t("mfa.setup.doneText"));
    });
  } catch (e) {
    body.innerHTML = `<div class="dialog-text" style="color:var(--danger);">${escapeHtml(tFmt("mfa.setup.errorPrefix", { msg: e.message || String(e) }))}</div>`;
  }
}

function closeMfaSetup() {
  document.getElementById("mfa-setup-overlay").classList.add("hidden");
}

// ============ Форматирование текста ============

function wrapSelection(format) {
  const el = document.getElementById("message-input");
  if (!el) return;
  el.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return; // ничего не выделено

  if (format === "bold") document.execCommand("bold");
  else if (format === "italic") document.execCommand("italic");
  else if (format === "underline") document.execCommand("underline");
  else if (format === "strike") document.execCommand("strikeThrough");
  else if (format === "mono") document.execCommand("insertHTML", false, "<code>" + escapeHtml(sel.toString()) + "</code>");
  else if (format === "spoiler") document.execCommand("insertHTML", false, '<span class="spoiler">' + escapeHtml(sel.toString()) + "</span>");
  else if (format === "quote") {
    const txt = sel.toString();
    const quoted = txt.split("\n").map((l) => "> " + l).join("\n");
    document.execCommand("insertText", false, "\n" + quoted + "\n");
  }
}

// HTML из contenteditable → markdown-строка
function htmlToMarkdown(node) {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      const inner = htmlToMarkdown(child);
      if (tag === "br") out += "\n";
      else if (tag === "b" || tag === "strong") out += "**" + inner + "**";
      else if (tag === "i" || tag === "em") out += "*" + inner + "*";
      else if (tag === "u") out += "__" + inner + "__";
      else if (tag === "s" || tag === "del" || tag === "strike") out += "~~" + inner + "~~";
      else if (tag === "code") out += "`" + inner + "`";
      else if (tag === "blockquote") out += "> " + inner.replace(/\n/g, "\n> ") + "\n";
      else if (child.classList && child.classList.contains("spoiler")) out += "||" + inner + "||";
      else if (tag === "div" || tag === "p") out += inner + "\n";
      else out += inner;
    }
  }
  return out.replace(/\n+$/, "");
}

function getInputText() {
  const el = document.getElementById("message-input");
  if (!el) return "";
  let md = htmlToMarkdown(el);
  // Не превращаем одиночные переносы в лишние
  return md.trim();
}

function clearInput() {
  const el = document.getElementById("message-input");
  if (el) {
    el.innerHTML = "";
    el.style.height = "auto";
  }
}

function setInputFromMarkdown(md) {
  const el = document.getElementById("message-input");
  if (!el) return;
  el.innerHTML = applyFormatting(escapeHtml(md || "")).replace(/\n/g, "<br>");
}

// Хелпер: инлайновая иконка внутри текста
function iconInline(name) {
  return `<span class="cell-icon cell-icon-sm cell-inline" data-icon="${name}"></span>`;
}

// Хелпер: рендер модели подарка.
// Если значение начинается с http(s):// — рендерим <img> (GIF автоматически анимируется).
// Иначе — эмодзи текстом.
// sizePx — размер в пикселях (для эмодзи → font-size, для картинки → width/height).
function renderGiftModel(value, sizePx) {
  if (!value) return "";
  const s = String(value).trim();
  if (/^https?:\/\//i.test(s)) {
    return `<img class="gift-model" src="${escapeHtml(s)}" ` +
      `style="width:${sizePx}px;height:${sizePx}px;max-width:100%;max-height:100%;" ` +
      `alt="" draggable="false">`;
  }
  return `<span class="gift-model-emoji" style="font-size:${sizePx}px;line-height:1;">${escapeHtml(s)}</span>`;
}

// Рендерит превью чата: экранирует HTML и заменяет emoji на наши иконки.
function renderPreviewHtml(text) {
  const s = String(text || "").slice(0, 60);
  let html = escapeHtml(s);
  // Nectar
  html = html.replace(/🧩/g,
    `<img class="nectar-icon" src="${NECTAR_ICON_URL}" alt="Nectar" draggable="false">`);
  // Иконки-замены emoji в превью
  html = html.replace(/🎁/g, iconInline("gift"));
  html = html.replace(/📷/g, iconInline("camera"));
  html = html.replace(/🎥/g, iconInline("camera"));
  html = html.replace(/📎/g, iconInline("attach"));
  html = html.replace(/🔒/g, iconInline("lock"));
  return html;
}

function stripMarkdown(text) {
  if (!text) return "";
  return String(text)
    .replace(/\|\|(.+?)\|\|/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^> /gm, "");
}

function applyFormatting(escaped) {
  let html = escaped;
  html = html.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  html = html.replace(/__([^_]+)__/g, "<u>$1</u>");
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<i>$2</i>");
  html = html.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  html = html.replace(/(^|\n)&gt; (.+?)(?=\n|$)/g, "$1<blockquote>$2</blockquote>");
  // Автолинковка http/https ссылок (текст уже экранирован, так что &amp; — это &
  // но мы уже находимся в экранированном виде, поэтому восстанавливаем & в URL)
  html = html.replace(/(^|[\s>])(https?:\/\/[^\s<]+)/g, (m, pre, url) => {
    const cleanUrl = url.replace(/&amp;/g, "&");
    return `${pre}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
  return html;
}

// ======================================================
// БЕЗОПАСНОСТЬ: глобальные переменные
// ======================================================
let pendingMfaUser = null;
let inactivityTimer = null;
const INACTIVITY_MS = 60 * 60 * 1000; // авто-выход через 1 час неактивности

// ---- Защита от брутфорса на клиенте ----
const LOGIN_ATTEMPTS_KEY = "cell_login_attempts";
const LOGIN_LOCK_KEY = "cell_login_lock";

function registerLoginAttempt() {
  try {
    const now = Date.now();
    let data = JSON.parse(sessionStorage.getItem(LOGIN_ATTEMPTS_KEY) || "[]");
    data = data.filter(t => now - t < 15 * 60 * 1000);
    data.push(now);
    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
    if (data.length >= 8) {
      sessionStorage.setItem(LOGIN_LOCK_KEY, String(now + 5 * 60 * 1000));
    }
  } catch (e) {}
}

function isLoginLocked() {
  try {
    const until = parseInt(sessionStorage.getItem(LOGIN_LOCK_KEY) || "0", 10);
    return until > Date.now();
  } catch (e) { return false; }
}

function clearLoginAttempts() {
  try {
    sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    sessionStorage.removeItem(LOGIN_LOCK_KEY);
  } catch (e) {}
}

// ---- Авто-выход по неактивности ----
function resetInactivityTimer() {
  if (!currentUser) return;
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    showAuth();
    alert(t("inactivity.expired"));
  }, INACTIVITY_MS);
}

// E2EE state
let myE2eeSecret = null;
let myIdentityPrivateJwk = null;
let myIdentityPublicJwk = null;
let sharedKeyCache = new Map();
let cryptoUnlocked = false;

// Ключи хранилища для запоминания разблокировки между перезагрузками.
// sessionStorage — F5 и переходы между чатами не сбрасывают, закрытие вкладки — сбрасывает.
// localStorage — «Доверять устройству»: не спрашивать пароль, пока не выйдешь из аккаунта.
const E2EE_SESSION_KEY = "cell_e2ee_session";
const E2EE_TRUST_KEY = "cell_e2ee_trusted";

function clearE2eeStoredKeys() {
  try { sessionStorage.removeItem(E2EE_SESSION_KEY); } catch (e) {}
  try { localStorage.removeItem(E2EE_TRUST_KEY); } catch (e) {}
}

function saveE2eeUnlock(privJwk, pubJwk, userId, trustDevice) {
  const payload = JSON.stringify({ privJwk, pubJwk: pubJwk || null, userId });
  try {
    if (trustDevice) {
      localStorage.setItem(E2EE_TRUST_KEY, payload);
      sessionStorage.removeItem(E2EE_SESSION_KEY);
    } else {
      sessionStorage.setItem(E2EE_SESSION_KEY, payload);
    }
  } catch (e) { /* silent */ }
}

// Пробуем автоматически разблокировать E2EE из сохранённого состояния.
// Возвращает true, если удалось.
function tryRestoreE2eeSession() {
  if (!currentUser) return false;
  // Приоритет: доверенное устройство (localStorage), иначе сессия (sessionStorage)
  const stores = [
    { store: localStorage, key: E2EE_TRUST_KEY },
    { store: sessionStorage, key: E2EE_SESSION_KEY },
  ];
  for (const { store, key } of stores) {
    try {
      const raw = store.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (!data || data.userId !== currentUser.id || !data.privJwk) continue;
      myIdentityPrivateJwk = data.privJwk;
      if (data.pubJwk) myIdentityPublicJwk = data.pubJwk;
      cryptoUnlocked = true;
      sharedKeyCache.clear();
      return true;
    } catch (e) { /* silent */ }
  }
  return false;
}

// ======================= 2. СОСТОЯНИЕ =======================
let currentUser = null, myProfile = null;
let currentChatId = null, currentOtherUser = null, pendingOtherUser = null;
let currentChannel = null, reactionsChannel = null, blocksChannel = null, globalChannel = null;
let globalMsgsChannel = null, profilesChannel = null, membershipChannel = null, readsChannel = null;
let searchTimeout = null;
let myBlockedIds = new Set(), blockedMeIds = new Set();
let hiddenMsgIds = new Set();
let msgCache = new Map(), reactionsCache = new Map();
let chatReads = new Map();
let chatLastMsg = new Map();
let chatIdByUser = new Map();
const pendingChatAdds = new Set();
let replyToMsg = null, editingMsgId = null;

// Мобильный режим: одна область на весь экран — либо список чатов, либо чат.
// ⚠️ Только для РЕАЛЬНЫХ тач-устройств (pointer: coarse), не для узкого окна
// браузера на компе.
const mobileMedia = window.matchMedia("(max-width: 768px) and (pointer: coarse)");
function isMobileView() { return mobileMedia.matches; }

function enterMobileChat() {
  if (!isMobileView()) return;
  document.getElementById("app-screen").classList.add("mobile-chat-open");
}
function exitMobileChat() {
  document.getElementById("app-screen").classList.remove("mobile-chat-open");
  // Снимаем подсветку со всех чатов — мы вышли из переписки.
  document.querySelectorAll(".user-item.active").forEach((el) => el.classList.remove("active"));
  // 🔴 ПОЛНОСТЬЮ закрываем чат. Иначе currentChatId остаётся, и при входящем
  // realtime-обработчик вызовет markChatRead, будто мы всё ещё в чате.
  if (currentChatId) closeCurrentChat();
  notifySwActiveChat(null);
}
// Кэш «chatId → userId собеседника» для DM. Нужен, чтобы расшифровывать
// превью последних сообщений в списке чатов (не только в открытом чате).
let chatOtherUserCache = new Map();

// Черновики сообщений по chat_id. Позволяют не терять набранный текст
// при переключении между чатами и при возврате в чат.
const chatDrafts = new Map();

function saveDraftFor(chatId) {
  if (!chatId) return;
  // В режиме редактирования в инпуте лежит текст редактируемого сообщения,
  // а не черновик — сохранять его как черновик нельзя.
  if (editingMsgId) return;
  const txt = getInputText();
  if (txt) chatDrafts.set(chatId, txt);
  else chatDrafts.delete(chatId);
}

function restoreDraftFor(chatId) {
  if (!chatId) { clearInput(); return; }
  const txt = chatDrafts.get(chatId);
  if (txt) setInputFromMarkdown(txt);
  else clearInput();
}
let selectionMode = false, selectedMsgIds = new Set();
let contextMsgId = null, contextChatUser = null, contextChatCustomName = null;
let forwardSourceMsgs = [], forwardSelectedChats = new Set();
let profileCache = new Map(), cachedProfilesForBirthday = [];
let channelCache = new Map();
let currentChannelObj = null;
let currentChannelIsAdmin = false;
let currentChannelSubscribers = 0;
let channelCreateAvatarUrl = "color:0";
let channelEditAvatarUrl = null;
let channelEditUsernameValidated = null;
let channelEditUsernameTimeout = null;
let channelEditReactions = new Set(REACTION_EMOJIS);
let channelUsernameCheckTimeout = null;
let channelUsernameValidated = null;
let channelProfileChannelId = null;
let channelProfileUpdatesChannel = null;
let currentChannelIsSubscribed = false;
let currentChannelViewsMap = new Map();
let currentChannelTotalViews = 0;
let currentChannelViewsChannel = null;
let contextChannelForMenu = null;
let channelAdminsChannel = null;
let usernameCheckTimeout = null, validatedUsername = null, reactionsRefreshTimer = null;
let giftCatalogCache = [];
let lastSeenInterval = null, otherUserInterval = null, statusPollInterval = null, deliveredInterval = null;
// Throttle для last_seen — не чаще одного раза в 25 секунд.
// Порог «в сети» у собеседника — 45 сек (см. isUserOnline), так что 25 сек безопасно.
const LAST_SEEN_THROTTLE_MS = 25000;
let lastSeenThrottleAt = 0;
// Поиск внутри чата/канала
let chatSearchOpen = false;
let chatSearchMatches = [];
let chatSearchIndex = -1;
let chatSearchDebounce = null;
// Закреплённые сообщения
let currentPinnedList = [];
let currentPinnedIndex = -1;
let pinsChannel = null;
// Ссылки-приглашения
let currentInvitesList = [];
// Race-guard при быстром переключении чатов
let openSeq = 0;
// Пагинация сообщений
let messagesHasMore = false;
let messagesLoadingMore = false;
let messagesOldestTs = null;
const MESSAGES_PAGE_SIZE = 50;
// Заморозка авто-переключения закрепа при jump (мс)
let pinBarFrozenUntil = 0;
// Типы каналов + заявки
let channelCreateVisibility = "public";
let channelEditVisibility = "public";
let currentChannelHasRequest = false;
let currentChannelRequestRejected = false;
let currentChannelRequestId = null; // id активной заявки — для отзыва
let channelRequestsChannel = null;
// Возврат из профиля в окно подарка
let profileFromGiftContext = null;     // { userId, ugId } — куда возвращаться
let currentGiftDetailUserId = null;    // ownerId подарка, открытого в деталях
let currentGiftDetailUgId = null;      // ug.id подарка, открытого в деталях

// ═══════════════════════════════════════════════════════
// E2EE
// ═══════════════════════════════════════════════════════

async function refreshE2eeStatus() {
  const row = document.getElementById("e2ee-status-row");
  if (!row) return;
  if (!currentUser) return;

  try {
    const { data: prof } = await supabase.from("profiles")
      .select("e2ee_enabled, public_key")
      .eq("id", currentUser.id).single();
    const { data: sec } = await supabase.from("user_e2ee_secrets")
      .select("*").eq("user_id", currentUser.id).maybeSingle();

    myE2eeSecret = sec || null;
    if (myProfile && prof) {
      myProfile.e2ee_enabled = prof.e2ee_enabled;
      myProfile.public_key = prof.public_key;
    }

    if (!prof || !prof.e2ee_enabled) {
      row.textContent = t("e2ee.status.off");
    } else if (!sec) {
      const raw = t("e2ee.status.broken");
      row.innerHTML = escapeHtml(raw).replace(
        /(Что-то не так|Something is wrong)/,
        "<b>$1</b>"
      );
    } else if (cryptoUnlocked) {
      const raw = t("e2ee.status.unlocked");
      row.innerHTML = escapeHtml(raw).replace(
        /(Включено и разблокировано|Enabled and unlocked)/,
        "<b>$1</b>"
      );
    } else {
      const raw = t("e2ee.status.locked");
      row.innerHTML = escapeHtml(raw).replace(
        /(Включено|Enabled)/,
        "<b>$1</b>"
      );
    }
  } catch (e) {
    row.textContent = t("e2ee.status.error");
  }
}

async function updateE2eeComposerHint() {
  const hint = document.getElementById("e2ee-composer-hint");
  const txt = document.getElementById("e2ee-composer-hint-text");
  const banner = document.getElementById("e2ee-unlock-banner");
  if (!hint || !txt) return;

  // Не DM (канал, пусто) — прячем всё
  if (!currentOtherUser) {
    hint.classList.add("hidden");
    if (banner) banner.classList.add("hidden");
    return;
  }

  // У собеседника нет E2EE / мы её не включали — прячем всё
  if (!myProfile || !myProfile.e2ee_enabled) {
    hint.classList.add("hidden");
    if (banner) banner.classList.add("hidden");
    return;
  }

  // Тянем публичный ключ собеседника (в кэш, если ещё нет)
  let other = profileCache.get(currentOtherUser.id);
  let otherPubKey = other && other.public_key;
  if (!otherPubKey) {
    try {
      const { data } = await supabase.from("profiles")
        .select("public_key").eq("id", currentOtherUser.id).single();
      if (data && data.public_key) {
        otherPubKey = data.public_key;
        profileCache.set(currentOtherUser.id, { ...(profileCache.get(currentOtherUser.id) || {}), ...data });
      }
    } catch (e) { /* silent */ }
  }
  if (!otherPubKey) {
    hint.classList.add("hidden");
    if (banner) banner.classList.add("hidden");
    return;
  }

  // У собеседника ключ есть. Показываем либо «всё ок», либо баннер разблокировки
  if (cryptoUnlocked) {
    hint.classList.remove("hidden");
    txt.textContent = t("e2ee.composer.hint.full");
    if (banner) banner.classList.add("hidden");
  } else {
    hint.classList.add("hidden");
    if (banner) banner.classList.remove("hidden");
  }
}

async function unlockE2eeWithPassword(password, opts = {}) {
  if (!myE2eeSecret) {
    const { data } = await supabase.from("user_e2ee_secrets")
      .select("*").eq("user_id", currentUser.id).maybeSingle();
    myE2eeSecret = data || null;
  }
  if (!myE2eeSecret) throw new Error(t("e2ee.err.noSavedKeys"));

  const { kek } = await Crypto.deriveKEK(password, myE2eeSecret.private_key_salt);
  const privJwk = await Crypto.unwrapPrivateKey(
    kek,
    myE2eeSecret.private_key_iv,
    myE2eeSecret.encrypted_private_key
  );

  myIdentityPrivateJwk = privJwk;

  // Публичный ключ из профиля
  const { data: prof } = await supabase.from("profiles")
    .select("public_key").eq("id", currentUser.id).single();
  if (prof && prof.public_key) {
    try { myIdentityPublicJwk = JSON.parse(prof.public_key); } catch (e) {}
  }

  cryptoUnlocked = true;
  sharedKeyCache.clear();

  // Сохраняем разблокированный ключ — чтобы не вводить пароль снова
  saveE2eeUnlock(myIdentityPrivateJwk, myIdentityPublicJwk, currentUser.id, !!opts.trustDevice);

  await refreshE2eeStatus();
  updateE2eeComposerHint();
  // Перерисовываем текущий чат, если он открыт, — чтобы уже видимые
  // зашифрованные сообщения и превью расшифровались без перезагрузки.
  if (currentChatId) {
    decryptedCache.clear();
    revokeDecryptedFiles();
    try {
      await loadMessages(currentChatId, openSeq);
      await loadReactionsForVisibleMessages();
    } catch (e) { /* silent */ }
  }
  // Обновляем превью в списке чатов
  try { await loadRecentChats(); } catch (e) { /* silent */ }
}

function lockE2ee() {
  myIdentityPrivateJwk = null;
  cryptoUnlocked = false;
  sharedKeyCache.clear();
  revokeDecryptedFiles();
  resetChannelKeyState();
}

async function openE2eeSetup() {
  const overlay = document.getElementById("e2ee-setup-overlay");
  const body = document.getElementById("e2ee-setup-body");
  const title = document.getElementById("e2ee-setup-title");
  overlay.classList.remove("hidden");
  body.innerHTML = '<div class="empty">Загрузка...</div>';

  await refreshE2eeStatus();

  const enabled = myProfile && myProfile.e2ee_enabled;

  if (enabled && cryptoUnlocked) {
    title.textContent = t("e2ee.title.enabled");
    body.innerHTML = `
      <div class="dialog-text">
        ${escapeHtml(t("e2ee.setup.enabledText"))}
      </div>
      <button class="dialog-btn dialog-primary" id="e2ee-show-safety" style="width:100%;">
        ${escapeHtml(t("e2ee.setup.showSafety"))}
      </button>
      <button class="dialog-btn" id="e2ee-lock-now" style="width:100%;margin-top:8px;">
        ${escapeHtml(t("e2ee.setup.lockNow"))}
      </button>
      <button class="dialog-btn" id="e2ee-disable" style="width:100%;margin-top:8px;
              background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger);">
        ${escapeHtml(t("e2ee.setup.disableBtn"))}
      </button>`;
    document.getElementById("e2ee-show-safety").addEventListener("click", () => {
      if (currentOtherUser) openSafetyNumberDialog(currentOtherUser);
      else showAlertDialog(t("e2ee.setup.noChatTitle"), t("e2ee.setup.noChatText"));
    });
    document.getElementById("e2ee-lock-now").addEventListener("click", async () => {
      const ok = await showConfirmDialog(
        t("e2ee.setup.lockTitle"),
        t("e2ee.setup.lockText"),
        t("e2ee.setup.lockAction")
      );
      if (!ok) return;
      lockE2ee();
      clearE2eeStoredKeys();
      decryptedCache.clear();
      closeE2eeSetup();
      await refreshE2eeStatus();
      if (currentChatId) {
        try {
          await loadMessages(currentChatId, openSeq);
          await loadReactionsForVisibleMessages();
        } catch (e) { /* silent */ }
      }
      try { await loadRecentChats(); } catch (e) { /* silent */ }
      updateE2eeComposerHint();
    });
    document.getElementById("e2ee-disable").addEventListener("click", disableE2ee);
    return;
  }

  if (enabled && !cryptoUnlocked) {
    title.textContent = t("e2ee.title.unlock");
    body.innerHTML = `
      <div class="dialog-text">
        ${escapeHtml(t("e2ee.setup.unlockText"))}
      </div>
      <input type="password" id="e2ee-unlock-pw" placeholder="${escapeHtml(t("e2ee.setup.unlockPassword"))}"
             style="width:100%;padding:14px;background:var(--bg-input);
                    border:1px solid var(--border);border-radius:12px;
                    color:var(--text);font-size:15px;outline:none;margin-bottom:10px;">
      <label class="toggle-row" style="padding:6px 0 12px;">
        <input type="checkbox" id="e2ee-unlock-trust">
        <span>${escapeHtml(t("e2ee.setup.trustDevice"))}</span>
      </label>
      <p class="error" id="e2ee-unlock-err" style="margin-bottom:10px;"></p>
      <button class="dialog-btn dialog-primary" id="e2ee-unlock-btn" style="width:100%;">
        ${escapeHtml(t("e2ee.setup.unlockBtn"))}
      </button>`;
    document.getElementById("e2ee-unlock-btn").addEventListener("click", async () => {
      const pw = document.getElementById("e2ee-unlock-pw").value;
      const trustCb = document.getElementById("e2ee-unlock-trust");
      const err = document.getElementById("e2ee-unlock-err");
      err.textContent = "";
      try {
        await unlockE2eeWithPassword(pw, { trustDevice: !!(trustCb && trustCb.checked) });
        closeE2eeSetup();
        await showAlertDialog(t("mfa.setup.doneTitle"), t("e2ee.setup.unlockDone"));
      } catch (e) {
        err.textContent = t("e2ee.setup.unlockErr");
      }
    });
    return;
  }

  title.textContent = t("e2ee.title.init");
  body.innerHTML = `
    <div class="dialog-text">
      ${t("e2ee.setup.initText")}
    </div>
    <input type="password" id="e2ee-init-pw" placeholder="${escapeHtml(t("e2ee.setup.unlockPassword"))}"
           style="width:100%;padding:14px;background:var(--bg-input);
                  border:1px solid var(--border);border-radius:12px;
                  color:var(--text);font-size:15px;outline:none;margin-bottom:12px;">
    <p class="error" id="e2ee-init-err" style="margin-bottom:10px;"></p>
    <button class="dialog-btn dialog-primary" id="e2ee-init-btn" style="width:100%;">
      ${escapeHtml(t("e2ee.setup.initBtn"))}
    </button>`;

  document.getElementById("e2ee-init-btn").addEventListener("click", async () => {
    const pw = document.getElementById("e2ee-init-pw").value;
    const err = document.getElementById("e2ee-init-err");
    err.textContent = "";
    if (!pw || pw.length < 8) { err.textContent = t("e2ee.setup.pwTooShort"); return; }

    const btn = document.getElementById("e2ee-init-btn");
    btn.disabled = true;
    btn.textContent = t("e2ee.setup.initLoading");

    try {
      const { pubJwk, privJwk } = await Crypto.generateIdentityKeyPair();
      const { kek, saltB64 } = await Crypto.deriveKEK(pw);
      const wrapped = await Crypto.wrapPrivateKey(privJwk, kek);

      const recoveryWords = Crypto.generateRecoveryCode();
      const recoveryKek = await Crypto.deriveRecoveryKEK(recoveryWords);
      const recoveryWrapped = await Crypto.wrapPrivateKey(privJwk, recoveryKek);

      const { error: secErr } = await supabase.from("user_e2ee_secrets").insert({
        user_id: currentUser.id,
        encrypted_private_key: wrapped.ct,
        private_key_salt: saltB64,
        private_key_iv: wrapped.iv,
        recovery_blob: recoveryWrapped.ct,
        recovery_salt: "recovery-v1",
        recovery_iv: recoveryWrapped.iv,
      });
      if (secErr) throw secErr;

      const { error: profErr } = await supabase.from("profiles").update({
        public_key: JSON.stringify(pubJwk),
        public_key_updated_at: new Date().toISOString(),
        e2ee_enabled: true,
        e2ee_enabled_at: new Date().toISOString(),
      }).eq("id", currentUser.id);
      if (profErr) throw profErr;

      myIdentityPrivateJwk = privJwk;
      myIdentityPublicJwk = pubJwk;
      cryptoUnlocked = true;
      myProfile.e2ee_enabled = true;
      myProfile.public_key = JSON.stringify(pubJwk);

      showRecoveryWords(recoveryWords);
    } catch (e) {
      console.error(e);
      btn.disabled = false;
      btn.textContent = t("e2ee.setup.initBtn");
      err.textContent = e.message || t("auth.err.prefix");
    }
  });
}

function showRecoveryWords(words) {
  document.getElementById("e2ee-setup-overlay").classList.add("hidden");
  const overlay = document.getElementById("e2ee-recovery-overlay");
  const wordsEl = document.getElementById("e2ee-recovery-words");
  const confirmCb = document.getElementById("e2ee-recovery-confirm");
  const continueBtn = document.getElementById("e2ee-recovery-continue");
  const backBtn = document.getElementById("e2ee-recovery-back");

  wordsEl.textContent = words.join(" ");
  confirmCb.checked = false;
  continueBtn.disabled = true;

  confirmCb.onchange = () => { continueBtn.disabled = !confirmCb.checked; };
  backBtn.onclick = async () => {
    overlay.classList.add("hidden");
    await disableE2ee();
  };
  continueBtn.onclick = async () => {
    overlay.classList.add("hidden");
    await refreshE2eeStatus();
    await showAlertDialog(t("mfa.setup.doneTitle"), t("e2ee.setup.enabledDone"));
  };

  overlay.classList.remove("hidden");
}

async function disableE2ee() {
  const ok = await showConfirmDialog(
    t("e2ee.disable.title"),
    t("e2ee.disable.text"),
    t("e2ee.disable.action")
  );
  if (!ok) return;

  await supabase.from("profiles").update({ e2ee_enabled: false }).eq("id", currentUser.id);
  if (myProfile) myProfile.e2ee_enabled = false;
  cryptoUnlocked = false;
  myIdentityPrivateJwk = null;
  sharedKeyCache.clear();
  await refreshE2eeStatus();
  closeE2eeSetup();
}

function closeE2eeSetup() {
  document.getElementById("e2ee-setup-overlay").classList.add("hidden");
}

async function getSharedKeyFor(userId) {
  if (sharedKeyCache.has(userId)) return sharedKeyCache.get(userId);
  if (!cryptoUnlocked || !myIdentityPrivateJwk) return null;

  const { data: other } = await supabase.from("profiles")
    .select("public_key").eq("id", userId).single();
  if (!other || !other.public_key) return null;

  try {
    const theirPubJwk = JSON.parse(other.public_key);
    const key = await Crypto.deriveSharedKey(myIdentityPrivateJwk, theirPubJwk);
    sharedKeyCache.set(userId, key);
    return key;
  } catch (e) {
    return null;
  }
}

async function openSafetyNumberDialog(otherUser) {
  if (!cryptoUnlocked) {
    await showAlertDialog(t("e2ee.safety.lockedTitle"), t("e2ee.safety.lockedText"));
    return;
  }
  const { data: other } = await supabase.from("profiles")
    .select("public_key, display_name, username").eq("id", otherUser.id).single();
  if (!other || !other.public_key) {
    await showAlertDialog(t("e2ee.safety.noKeyTitle"), t("e2ee.safety.noKeyText"));
    return;
  }
  let theirPub;
  try { theirPub = JSON.parse(other.public_key); } catch (e) { return; }

  const num = await Crypto.computeSafetyNumber(myIdentityPublicJwk, theirPub);
  const groups = num.match(/.{1,5}/g).join(" ");
  await showAlertDialog(
    t("e2ee.safety.title"),
    tFmt("e2ee.safety.text", { username: other.username, groups })
  );
}

function setupE2eeUI() {
  const manageBtn = document.getElementById("e2ee-manage-btn");
  if (manageBtn) manageBtn.addEventListener("click", openE2eeSetup);
  const closeBtn = document.getElementById("e2ee-setup-close");
  if (closeBtn) closeBtn.addEventListener("click", closeE2eeSetup);

  // Кнопка «Разблокировать» в баннере над сообщениями
  const unlockBtn = document.getElementById("e2ee-unlock-banner-btn");
  if (unlockBtn) unlockBtn.addEventListener("click", openE2eeSetup);
}

// ═══════════════════════════════════════════════════════
// E2EE: шифрование исходящих и расшифровка входящих
// ═══════════════════════════════════════════════════════

// Кэш расшифрованных текстов. Ключ — msgId.
// Инвалидируется при выходе (lockE2ee) и при смене чата (closeCurrentChat).
const decryptedCache = new Map();

// Кэш расшифрованных файлов (Фаза 3). Ключ — msgId, значение — { url } — blob URL.
// Blob URL надо освобождать через URL.revokeObjectURL, чтобы не текла память.
const decryptedFileCache = new Map();

// Фаза 4: E2EE каналов.
// Ключ канала (AES-256 CryptoKey) для шифрования/расшифровки.
const channelKeyCache = new Map();
// Тот же ключ, но в base64 — нужен для раздачи другим участникам
// (CryptoKey нельзя экспортировать, если он был импортирован как неизвлекаемый).
const channelKeyB64Cache = new Map();
// Флаг: можно ли шифровать сообщения в канале (все подписчики с E2EE).
const channelEncryptable = new Map();
// Защита от параллельных sync одного и того же канала.
const syncingChannelIds = new Set();

function resetChannelKeyState() {
  channelKeyCache.clear();
  channelKeyB64Cache.clear();
  channelEncryptable.clear();
  syncingChannelIds.clear();
}

function revokeDecryptedFiles() {
  decryptedFileCache.forEach((entry) => {
    try { URL.revokeObjectURL(entry.url); } catch (e) { /* silent */ }
  });
  decryptedFileCache.clear();
}

// Шифрует исходящий текст. Возвращает {content, encrypted}.
// Если E2EE недоступен (мы не разблокированы / у собеседника нет ключа) — отдаёт как есть.
async function encryptOutgoingText(chatId, text) {
  // Не шифруем: пусто
  if (!text) return { content: text, encrypted: false };
  if (!cryptoUnlocked || !myIdentityPrivateJwk) return { content: text, encrypted: false };

  // Каналы — отдельный путь (Фаза 4)
  if (channelCache.has(chatId)) {
    return await encryptOutgoingChannelText(chatId, text);
  }

  // Нужен собеседник. В DM — currentOtherUser.
  if (!currentOtherUser || !currentOtherUser.id) return { content: text, encrypted: false };

  // Если собеседник не публиковал публичный ключ — не шифруем
  const other = profileCache.get(currentOtherUser.id);
  let otherPubStr = other && other.public_key;
  if (!otherPubStr) {
    const { data } = await supabase.from("profiles")
      .select("public_key").eq("id", currentOtherUser.id).single();
    otherPubStr = data && data.public_key;
    if (other && otherPubStr) other.public_key = otherPubStr;
  }
  if (!otherPubStr) return { content: text, encrypted: false };

  try {
    const sharedKey = await getSharedKeyFor(currentOtherUser.id);
    if (!sharedKey) return { content: text, encrypted: false };
    const cipher = await Crypto.encryptMessage(sharedKey, text);
    return { content: cipher, encrypted: true };
  } catch (e) {
    console.warn("encrypt failed, fallback to plaintext:", e);
    return { content: text, encrypted: false };
  }
}

// ======================================================
// ФАЗА 4 — E2EE каналов
// ======================================================

// Получает ключ канала, расшифрованный моим приватным ключом.
// Кэширует только успешный результат — если ключа нет, при следующем
// вызове снова попробует (чтобы подхватить ключ после раздачи владельцем).
async function getChannelKeyForMe(chatId) {
  if (channelKeyCache.has(chatId)) return channelKeyCache.get(chatId);
  if (!cryptoUnlocked || !myIdentityPrivateJwk) return null;
  try {
    const { data, error } = await supabase.rpc("get_my_channel_key", { p_channel_id: chatId });
    if (error || !data || !data.length) return null;
    const { encrypted_key, wrapped_by } = data[0];
    if (!encrypted_key || !wrapped_by) return null;
    // Расшифровываем ключ канала через ECDH с тем, кто его для нас упаковал
    const sharedKey = await getSharedKeyFor(wrapped_by);
    if (!sharedKey) return null;
    const keyB64 = await Crypto.decryptMessage(sharedKey, encrypted_key);
    // keyB64 — base64 от 32 байт AES-ключа. Импортируем как AES-GCM.
    const key = await Crypto.importFileKey(keyB64);
    channelKeyCache.set(chatId, key);
    channelKeyB64Cache.set(chatId, keyB64);
    return key;
  } catch (e) {
    console.warn("getChannelKeyForMe:", e);
    return null;
  }
}

// Раздаёт текущий ключ канала всем подписчикам (bulk-запросом).
async function shareChannelKeysWithMembers(chatId) {
  const keyB64 = channelKeyB64Cache.get(chatId);
  if (!keyB64) return;

  const { data: subs, error } = await supabase.rpc("get_channel_subscribers", { p_channel_id: chatId });
  if (error || !subs || !subs.length) return;

  const others = subs.filter((s) => s.user_id !== currentUser.id);
  if (!others.length) return;

  // Забираем публичные ключи всех подписчиков одним запросом
  const ids = others.map((s) => s.user_id);
  const { data: profs } = await supabase.from("profiles")
    .select("id, public_key").in("id", ids);
  const pubMap = new Map((profs || []).map((p) => [p.id, p.public_key]));

  // Владелец/админ должен ещё иметь возможность писать, а остальные — читать.
  // Если у кого-то из подписчиков нет public_key — канал целиком НЕ шифруем.
  let allHaveE2ee = true;
  const items = [];

  for (const s of others) {
    const pub = pubMap.get(s.user_id);
    if (!pub) { allHaveE2ee = false; break; }
    try {
      const theirPubJwk = JSON.parse(pub);
      const shared = await Crypto.deriveSharedKey(myIdentityPrivateJwk, theirPubJwk);
      const encKey = await Crypto.encryptMessage(shared, keyB64);
      items.push({ user_id: s.user_id, encrypted_key: encKey });
    } catch (e) {
      allHaveE2ee = false;
      break;
    }
  }

  channelEncryptable.set(chatId, allHaveE2ee);

  if (!items.length) return;
  const { error: e2 } = await supabase.rpc("share_channel_keys_bulk", {
    p_channel_id: chatId,
    p_items: items,
  });
  if (e2) console.warn("share_channel_keys_bulk:", e2);
}

// Синхронизация ключа канала при открытии.
// Владелец: если ключа нет — генерирует и кладёт себе, потом раздаёт всем.
// Админ: если ключ есть — раздаёт; если нет — ничего (не может создать).
async function syncChannelKeys(chatId) {
  if (!cryptoUnlocked || !myIdentityPrivateJwk) return;
  if (syncingChannelIds.has(chatId)) return;
  const ch = channelCache.get(chatId);
  if (!ch) return;
  const isOwner = ch.owner_id === currentUser.id;
  const isAdmin = currentChannelIsAdmin;
  if (!isOwner && !isAdmin) return;

  syncingChannelIds.add(chatId);
  try {
    let myKey = await getChannelKeyForMe(chatId);

    // Если ключа нет и я владелец — генерируем новый
    if (!myKey && isOwner) {
      const rawKey = crypto.getRandomValues(new Uint8Array(32));
      const keyB64 = Crypto.abToB64(rawKey);
      const keyCrypto = await Crypto.importFileKey(keyB64);
      // Шифруем ключ самому себе (ECDH с собственным публичным ключом)
      const sharedSelf = await getSharedKeyFor(currentUser.id);
      if (!sharedSelf) return;
      const encSelf = await Crypto.encryptMessage(sharedSelf, keyB64);
      const { error } = await supabase.rpc("put_my_channel_key", {
        p_channel_id: chatId,
        p_encrypted_key: encSelf,
      });
      if (error) { console.warn("put_my_channel_key:", error); return; }
      channelKeyCache.set(chatId, keyCrypto);
      channelKeyB64Cache.set(chatId, keyB64);
      myKey = keyCrypto;
    }

    if (!myKey) return;
    await shareChannelKeysWithMembers(chatId);
  } finally {
    syncingChannelIds.delete(chatId);
  }
}

// Шифрует исходящий текст для канала.
async function encryptOutgoingChannelText(chatId, text) {
  if (!cryptoUnlocked) return { content: text, encrypted: false };
  if (!channelEncryptable.get(chatId)) return { content: text, encrypted: false };
  const key = await getChannelKeyForMe(chatId);
  if (!key) return { content: text, encrypted: false };

  // Ключ есть — убедимся, что он раздан ВСЕМ подписчикам ДО отправки.
  // Это избавляет от гонки: подписчик может получить realtime-сообщение
  // раньше, чем у него появится своя копия ключа в channel_keys.
  // Ошибки здесь не критичны — если раздача упадёт, отправим как есть.
  try {
    await shareChannelKeysWithMembers(chatId);
  } catch (e) {
    console.warn("shareChannelKeysWithMembers (pre-send):", e);
  }

  try {
    const cipher = await Crypto.encryptMessage(key, text);
    return { content: cipher, encrypted: true };
  } catch (e) {
    console.warn("encryptOutgoingChannelText:", e);
    return { content: text, encrypted: false };
  }
}

// Расшифровывает сообщение канала.
async function getChannelPlaintext(msg) {
  if (!msg || !msg.encrypted) return msg.content || "";
  if (decryptedCache.has(msg.id)) return decryptedCache.get(msg.id);
  if (!cryptoUnlocked || !myIdentityPrivateJwk) {
    return t("e2ee.msg.locked");
  }
  const key = await getChannelKeyForMe(msg.chat_id);
  if (!key) return t("e2ee.msg.noChannelKey");
  try {
    const plain = await Crypto.decryptMessage(key, msg.content);
    decryptedCache.set(msg.id, plain);
    return plain;
  } catch (e) {
    return t("e2ee.msg.decryptFailed");
  }
}

// Расшифровывает сообщение. Возвращает plaintext (или исходный content, если не расшифровать).
async function getPlaintext(msg, otherIdOverride) {
  if (!msg) return "";
  // Для вложений поле content — это подпись. Она НЕ шифруется (шифруется сам файл).
  if (msg.message_type === "attachment") return msg.content || "";
  if (!msg.encrypted) return msg.content || "";
  if (!msg.content) return "";

  // Кэш
  if (decryptedCache.has(msg.id)) return decryptedCache.get(msg.id);

  // Нужен ключ
  if (!cryptoUnlocked || !myIdentityPrivateJwk) {
    return t("e2ee.msg.locked");
  }

  // Если это канал — свой путь расшифровки
  if (channelCache.has(msg.chat_id)) {
    return await getChannelPlaintext(msg);
  }

  // В DM собеседник — sender. Если это моё сообщение — собеседник всё равно противоположная сторона.
  // otherIdOverride передаётся, когда сообщение рендерится вне открытого чата (например, в превью списка).
  const otherId = otherIdOverride || (msg.sender_id === currentUser.id
    ? (currentOtherUser && currentOtherUser.id)
    : msg.sender_id);

  if (!otherId) return t("e2ee.msg.decryptFailed");

  try {
    const sharedKey = await getSharedKeyFor(otherId);
    if (!sharedKey) return t("e2ee.msg.noSharedKey");
    const plain = await Crypto.decryptMessage(sharedKey, msg.content);
    decryptedCache.set(msg.id, plain);
    return plain;
  } catch (e) {
    return t("e2ee.msg.decryptFailed");
  }
}

// ======================================================
// ФАЗА 3 — E2EE для вложений
// ======================================================

// Шифрует бинарник файла. Возвращает:
//   { encryptedBuffer, ivB64, fileKeyEnc, encrypted: true } при успехе
//   { encryptedBuffer: originalBuffer, encrypted: false } если E2EE недоступен
async function encryptOutgoingFile(chatId, arrayBuffer) {
  const plain = { encryptedBuffer: arrayBuffer, encrypted: false };
  if (!cryptoUnlocked || !myIdentityPrivateJwk) return plain;
  if (channelCache.has(chatId)) return plain;
  if (!currentOtherUser || !currentOtherUser.id) return plain;

  // Есть ли у собеседника публичный ключ?
  const other = profileCache.get(currentOtherUser.id);
  let otherPubStr = other && other.public_key;
  if (!otherPubStr) {
    const { data } = await supabase.from("profiles")
      .select("public_key").eq("id", currentOtherUser.id).single();
    otherPubStr = data && data.public_key;
    if (other && otherPubStr) other.public_key = otherPubStr;
  }
  if (!otherPubStr) return plain;

  try {
    const sharedKey = await getSharedKeyFor(currentOtherUser.id);
    if (!sharedKey) return plain;

    // 1. Случайный ключ файла
    const fileKey = await Crypto.generateFileKey();
    // 2. Шифруем данные файла этим ключом
    const { ivB64, ctBuffer } = await Crypto.encryptFileData(fileKey, arrayBuffer);
    // 3. Экспортируем ключ файла в base64
    const fileKeyB64 = await Crypto.exportFileKey(fileKey);
    // 4. Шифруем ключ файла общим ключом чата
    const fileKeyEnc = await Crypto.encryptMessage(sharedKey, fileKeyB64);

    return { encryptedBuffer: ctBuffer, ivB64, fileKeyEnc, encrypted: true };
  } catch (e) {
    console.warn("encryptOutgoingFile failed:", e);
    return plain;
  }
}

// Расшифровывает скачанный blob. Возвращает ArrayBuffer или null.
async function decryptIncomingFile(msg, ctBuffer) {
  if (!msg.file_key_enc || !msg.file_iv) return ctBuffer;
  if (!cryptoUnlocked || !myIdentityPrivateJwk) return null;

  const otherId = msg.sender_id === currentUser.id
    ? (chatOtherUserCache.get(msg.chat_id) || (currentOtherUser && currentOtherUser.id))
    : msg.sender_id;
  if (!otherId) return null;

  try {
    const sharedKey = await getSharedKeyFor(otherId);
    if (!sharedKey) return null;
    const fileKeyB64 = await Crypto.decryptMessage(sharedKey, msg.file_key_enc);
    const fileKey = await Crypto.importFileKey(fileKeyB64);
    return await Crypto.decryptFileData(fileKey, msg.file_iv, ctBuffer);
  } catch (e) {
    console.warn("decryptIncomingFile failed:", e);
    return null;
  }
}

// Возвращает blob URL расшифрованного файла (кэшируется).
// null — если файл зашифрован, но мы не можем расшифровать (крипта заблокирована / нет ключа).
async function getDecryptedFileUrl(msg) {
  if (decryptedFileCache.has(msg.id)) return decryptedFileCache.get(msg.id).url;
  if (!cryptoUnlocked || !myIdentityPrivateJwk) return null;

  const signedUrl = await getSignedUrl(msg.image_url);
  if (!signedUrl) return null;

  let ctBuffer;
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) return null;
    ctBuffer = await res.arrayBuffer();
  } catch (e) {
    console.warn("download encrypted file failed:", e);
    return null;
  }

  const plainBuffer = await decryptIncomingFile(msg, ctBuffer);
  if (!plainBuffer) return null;

  const mime = msg.file_mime || "application/octet-stream";
  const blob = new Blob([plainBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  decryptedFileCache.set(msg.id, { url });
  return url;
}

// Синхронная обёртка для мест, где уже есть расшифрованный текст или нужен фолбэк.
// Если в кэше есть — берём оттуда. Иначе возвращает плейсхолдер.
function getPlaintextSync(msg) {
  if (!msg) return "";
  if (!msg.encrypted) return msg.content || "";
  if (decryptedCache.has(msg.id)) return decryptedCache.get(msg.id);
  return t("preview.encrypted");
}

// Асинхронно расшифровывает превью последнего сообщения в списке чатов
// (заменяет «🔒 Зашифровано» на реальный текст).
async function decryptChatPreview(msg, otherId, chatId, _attempt) {
  if (!msg || !msg.encrypted) return;
  if (!cryptoUnlocked) return;
  const attempt = _attempt || 0;
  try {
    // 1) Сначала пробуем канальный ключ. Это покрывает случай, когда
    // сообщение из канала приходит раньше, чем channelCache заполнится
    // (например, через subscribeToGlobalMessages — канал ещё не открыт).
    try {
      const chanKey = await getChannelKeyForMe(chatId);
      if (chanKey) {
        const plain = await Crypto.decryptMessage(chanKey, msg.content);
        if (plain && plain !== msg.content) {
          decryptedCache.set(msg.id, plain);
          updateChatPreviewText(chatId, msg, plain);
          return;
        }
      }
    } catch (e) { /* не канальное — идём дальше */ }

    // 2) DM-путь
    const plain = await getPlaintext(msg, otherId);
    if (plain && !plain.startsWith("🔒") && plain !== msg.content) {
      updateChatPreviewText(chatId, msg, plain);
      return;
    }

    // 3) Retry: если не удалось расшифровать — попробуем ещё несколько раз
    // с нарастающей задержкой. Это нужно, когда ключ канала ещё не раздан
    // (realtime пришёл раньше, чем владелец разложил ключи в channel_keys).
    // Хватает обычно 1–2 повторов, но до 4 попыток включительно.
    const RETRY_DELAYS = [800, 1600, 3200, 5000];
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(
        () => decryptChatPreview(msg, otherId, chatId, attempt + 1),
        RETRY_DELAYS[attempt]
      );
    }
  } catch (e) {
    console.warn("decryptChatPreview:", e);
  }
}

function updateChatPreviewText(chatId, msg, plain) {
  const data = chatLastMsg.get(chatId);
  if (!data) return;
  // Сверяем по ID сообщения — это надёжнее, чем по time/senderId,
  // потому что между постановкой задачи и её завершением могло прийти
  // новое сообщение (тогда time/senderId уже другие).
  if (data.msgId !== msg.id) return;
  data.text = stripMarkdown(plain);
  chatLastMsg.set(chatId, data);
  updateChatItemPreview(chatId);
}

// ======================= 3. АКЦЕНТ / АВАТАРЫ =======================
function applyAccent(accent) {
  document.documentElement.setAttribute("data-accent", accent || "orange");
  // Синхронизируем цвет системной шапки (PWA/Android/iOS) с цветом --bg-side
  try {
    const sideBg = getComputedStyle(document.documentElement)
      .getPropertyValue("--bg-side").trim();
    if (sideBg) {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", sideBg);
    }
  } catch (e) { /* silent */ }
}
function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
// Первый НЕпробельный символ строки. Возвращает целую графему (эмодзи, букву или составной эмодзи).
// Если строка пустая — "?".
// ВАЖНО: нельзя использовать str[0] — эмодзи занимают 2 кодовые единицы UTF-16,
// и [0] вернёт половину суррогатной пары → на экране «�&».
const graphemeSegmenter = (typeof Intl !== "undefined" && Intl.Segmenter)
  ? new Intl.Segmenter("ru", { granularity: "grapheme" })
  : null;

function firstChar(str) {
  if (!str) return "?";
  const trimmed = String(str).replace(/^\s+/, "");
  if (!trimmed) return "?";
  let first;
  if (graphemeSegmenter) {
    const it = graphemeSegmenter.segment(trimmed)[Symbol.iterator]();
    const firstSeg = it.next();
    first = firstSeg.done ? "?" : firstSeg.value.segment;
  } else {
    // Fallback для старых браузеров без Intl.Segmenter
    const arr = [...trimmed];
    first = arr[0] || "?";
  }
  // .toUpperCase() на эмодзи ничего не сломает — это no-op для символов без регистра
  return first.toUpperCase();
}
// Разбивает строку на графемы, выкидывая чисто-пробельные.
function _nonSpaceGraphemes(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return [];
  if (graphemeSegmenter) {
    return [...graphemeSegmenter.segment(trimmed)]
      .map((s) => s.segment)
      .filter((g) => !/^\s+$/.test(g));
  }
  return [...trimmed].filter((c) => !/\s/.test(c));
}

// Возвращает true, если ВСЁ содержимое сообщения — эмодзи и пробелы
// (без букв, цифр, спецсимволов). Такие сообщения рендерятся без «пузыря».
function isOnlyEmoji(text) {
  if (!text) return false;
  const graphemes = _nonSpaceGraphemes(text);
  if (graphemes.length === 0) return false;
  return graphemes.every((g) => {
    if (/^[\d#*]$/.test(g)) return false;
    return /\p{Extended_Pictographic}/u.test(g) || /\p{Emoji_Presentation}/u.test(g);
  });
}

// Возвращает true, если ровно ОДИН эмодзи (без текста и пробелов).
// Такие сообщения рендерятся крупно.
function isSingleEmoji(text) {
  const graphemes = _nonSpaceGraphemes(text);
  if (graphemes.length !== 1) return false;
  const g = graphemes[0];
  if (/^[\d#*]$/.test(g)) return false;
  return /\p{Extended_Pictographic}/u.test(g) || /\p{Emoji_Presentation}/u.test(g);
}

function paintAvatar(el, user) {
  if (!el) return;
  const av = user && user.avatar_url;
  if (av && av.startsWith("data:")) { el.style.background = `url(${av}) center/cover`; el.textContent = ""; return; }
  if (av && av.startsWith("color:")) {
    const idx = parseInt(av.split(":")[1], 10) || 0;
    const [c1, c2] = BASE_AVATARS[idx % BASE_AVATARS.length];
    el.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
    el.textContent = firstChar(user.display_name); return;
  }
  const seed = user && user.id ? user.id : (user && user.username) || "anon";
  const idx = hashCode(seed) % BASE_AVATARS.length;
  const [c1, c2] = BASE_AVATARS[idx];
  el.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  el.textContent = firstChar(user && user.display_name);
}

function resetAppState() {
  // Закрываем открытый чат/канал: сбрасывает currentChatId, каналы, state
  try { closeCurrentChat(); } catch (e) { /* silent */ }
  // Чистим DOM чата и оверлеи
  const msgs = document.getElementById("messages");
  if (msgs) msgs.innerHTML = "";
  document.querySelectorAll(".dialog-overlay").forEach((el) => el.classList.add("hidden"));
  // Сбрасываем поиск
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  const searchClear = document.getElementById("search-clear");
  if (searchClear) searchClear.classList.add("hidden");
  // Список чатов к дефолту
  const list = document.getElementById("users-list");
  if (list) list.innerHTML = '<div class="empty">Загрузка...</div>';
  document.getElementById("section-title").textContent = t("sidebar.section.chats");
  // Заголовок чата к дефолту
  const title = document.getElementById("chat-title");
  if (title) title.textContent = "Имя";
  const subtitle = document.getElementById("chat-subtitle");
  if (subtitle) subtitle.textContent = "@username";
  paintAvatar(document.getElementById("chat-avatar"), { display_name: "?" });
  // Прячем контент чата, показываем плейсхолдер
  const content = document.getElementById("chat-content");
  if (content) content.classList.add("hidden");
  const placeholder = document.getElementById("chat-placeholder");
  if (placeholder) placeholder.classList.remove("hidden");
  // Кэши
  msgCache.clear(); reactionsCache.clear(); profileCache.clear();
  chatLastMsg.clear(); chatIdByUser.clear(); chatReads.clear();
  chatOtherUserCache.clear();
  channelCache.clear();
  myBlockedIds = new Set(); blockedMeIds = new Set();
  hiddenMsgIds = new Set();
  currentOtherUser = null; pendingOtherUser = null;
  currentChannelObj = null; currentChannelIsAdmin = false;
  currentChannelIsSubscribed = false;
  currentChannelViewsMap = new Map();
  currentChannelTotalViews = 0;
  // Останавливаем таймеры, если были
  [lastSeenInterval, otherUserInterval, statusPollInterval, deliveredInterval].forEach((i) => i && clearInterval(i));
  lastSeenInterval = otherUserInterval = statusPollInterval = deliveredInterval = null;
}

// ======================= 4. ЭКРАНЫ =======================
function showApp(user) {
  // Чистим ВСЁ от предыдущего аккаунта, если был
  resetAppState();
  currentUser = user;
  // В режиме «Бабушка» авто-выход по неактивности не работает —
  // иначе через час простоя бабушку выкинет на экран входа, где
  // она не сможет ввести пароль.
  if (!isGrandmaMode()) resetInactivityTimer();
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  initApp().catch((err) => {
    console.error("initApp failed:", err);
    const listEl = document.getElementById("users-list");
    if (listEl) {
      listEl.innerHTML = '<div class="empty">Ошибка запуска:<br>' +
        escapeHtml(err && err.message ? err.message : String(err)) +
        '<br><br>Открой F12 → Console и покажи ошибку.</div>';
    }
  });
  setTimeout(updateE2eeComposerHint, 500);
}

function showAuth() {
  resetAppState();
  clearTimeout(inactivityTimer);
  inactivityTimer = null;
  pendingMfaUser = null;
  lockE2ee();
  clearE2eeStoredKeys();
  decryptedCache.clear();
  revokeDecryptedFiles();
  resetChannelKeyState();
  currentUser = null; myProfile = null;
  currentChatId = null; currentOtherUser = null; pendingOtherUser = null;
  myBlockedIds = new Set(); blockedMeIds = new Set();
  hiddenMsgIds = new Set(); msgCache.clear(); reactionsCache.clear();
  chatReads.clear(); chatLastMsg.clear(); chatIdByUser.clear(); chatOtherUserCache.clear();
  selectedMsgIds.clear(); forwardSelectedChats.clear(); profileCache.clear();
  cachedProfilesForBirthday = []; replyToMsg = null; editingMsgId = null;
  selectionMode = false; validatedUsername = null;
  contextChatUser = null; contextChatCustomName = null;
  [currentChannel, reactionsChannel, blocksChannel, globalChannel, globalMsgsChannel,
   profilesChannel, membershipChannel, readsChannel].forEach((ch) => ch && supabase.removeChannel(ch));
  currentChannel = reactionsChannel = blocksChannel = globalChannel = globalMsgsChannel =
    profilesChannel = membershipChannel = readsChannel = null;
  [lastSeenInterval, otherUserInterval, statusPollInterval, deliveredInterval].forEach((i) => i && clearInterval(i));
  lastSeenInterval = otherUserInterval = statusPollInterval = deliveredInterval = null;
  lastSeenThrottleAt = 0;
  applyAccent("orange");
  document.getElementById("app-screen").classList.remove("mobile-chat-open");
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

// ======================= 5. ИНИЦИАЛИЗАЦИЯ =======================
async function initApp() {
  setupSidebarMenu();
  setupMobileBackButton();
  setupE2eeUI();
  setupSearch(); setupChatMenu(); setupMessageMenu(); setupSelectionToolbar();
  setupAttachments(); setupMediaViewer(); setupEmojiPicker(); setupAboutDialog();
  setupWheel(); setupCommandPalette(); setupMiniProfile(); setupDateFloat();
  setupSettings(); applyScrollMode();
  setupChatSearch(); setupScrollBottomButton();
  setupMessagesScrollPagination();
  setupVerifiedTooltip();
  setupChatPins(); setupInviteUI();
  setupMessagesDelegates();
  // Предзагружаем иконки паттернов в фоне, чтобы к моменту покупки подарка
  // они уже были в кэше — иначе паттерн появляется с задержкой в несколько секунд.
  setTimeout(preloadPatternIcons, 1500);
  subscribeToPins();
  subscribeToChannelRequests();
  setupForwardDialog(); setupReplyBar(); setupProfilePanel(); setupGiftsUI();
  setupAvatarCropper();
  setupGrandmaEscapeHatch();
  setupBirthdayClose(); setupTokensDialog(); setupChannelCreate(); setupChannelEdit();
  supabase.from("profiles").select("id").limit(1).then(() => {});
  subscribeToBlocks(); subscribeToGlobalChanges(); subscribeToProfiles();
  subscribeToMemberships(); subscribeToReads(); subscribeToGlobalMessages();
  await Promise.all([loadMyProfile(), loadBlocks(), loadChatReads()]);
  // Пробуем автоматически разблокировать E2EE, если ключ был сохранён
  // в этой сессии или на доверенном устройстве.
  tryRestoreE2eeSession();
  // Если уведомления включены — обновляем push-подписку в фоне.
  if (areNotificationsEnabled() && isPushSupported()) {
    setTimeout(() => { subscribeToWebPush().catch(() => {}); }, 1500);
  }
  // Применяем режим «Бабушка» (если он включён) — прячем лишнее.
  applyGrandmaModeUI();
  await loadRecentChats();
  // 🔴 СРАЗУ после первичной загрузки списка — догоняем «потерянные» чаты.
  try { await pollMemberships(); } catch (e) { /* silent */ }

  // Отметить все входящие как доставленные
  try { await supabase.rpc("mark_all_delivered"); } catch (e) {}
  deliveredInterval = setInterval(async () => {
    try { await supabase.rpc("mark_all_delivered"); } catch (e) {}
  }, 30000);

  // Обновлять мой last_seen — с throttle, чтобы не дёргать сервер на каждый чих мыши.
  // Первый вызов — сразу (статус в другом окне появится мгновенно),
  // дальше — не чаще одного раза в LAST_SEEN_THROTTLE_MS (25 сек).
  await updateMyLastSeen();
  lastSeenThrottleAt = Date.now();
  lastSeenInterval = setInterval(throttledLastSeen, LAST_SEEN_THROTTLE_MS);
  document.addEventListener("mousemove", throttledLastSeen, { passive: true });
  document.addEventListener("keydown", throttledLastSeen);
  document.addEventListener("click", throttledLastSeen);

  // Каждые 30 секунд обновляем индикатор «в сети» во всех DM-чатах.
  // Проходимся по DOM и профилям в кэше — дёшево, без запросов к серверу.
  setInterval(() => {
    if (!currentUser) return;
    document.querySelectorAll(`.user-item[data-chat-type="dm"]`).forEach((el) => {
      const uid = el.dataset.userId;
      if (!uid) return;
      const p = profileCache.get(uid);
      const avEl = el.querySelector(".avatar");
      if (!avEl) return;
      avEl.classList.toggle("online", !!(p && isUserOnline(p)));
    });
  }, 30000);

  // Обновлять статус собеседника
  otherUserInterval = setInterval(async () => {
    if (!currentOtherUser) return;
    try {
      const { data } = await supabase.from("profiles")
        .select("last_seen, gender, display_name, username, avatar_url, birthday")
        .eq("id", currentOtherUser.id).single();
      if (data) {
        Object.assign(currentOtherUser, data);
        profileCache.set(currentOtherUser.id, { ...profileCache.get(currentOtherUser.id), ...data });
        renderChatSubtitle();
      }
    } catch (e) {}
  }, 8000);

  // Опрос статусов своих сообщений
  statusPollInterval = setInterval(pollMyMessageStatuses, 5000);
  // Страховочный опрос прав в открытом канале — на случай, если realtime не доставил событие
  setInterval(async () => {
    if (!currentChannelObj || !currentChannelObj.id) return;
    if (!currentUser) return;
    try { await refreshChannelRights(currentChannelObj.id); } catch (e) { /* silent */ }
  }, 8000);

  // Страховочный опрос закрепов — если realtime не доставил событие (раз в 4 сек)
  setInterval(async () => {
    if (!currentChatId || !currentUser) return;
    try {
      const before = currentPinnedList.map((p) => p.id).sort().join(",");
      await loadPinned(currentChatId);
      const after = currentPinnedList.map((p) => p.id).sort().join(",");
      if (before !== after) rerenderPinMarks();
    } catch (e) { /* silent */ }
  }, 4000);

  document.addEventListener("visibilitychange", () => {
    updateMyLastSeen();
    if (document.visibilityState === "visible") {
      pollMyMessageStatuses();
      if (currentChatId) markChatRead(currentChatId);
    }
  });
  // Обработка приглашения из URL (#invite=CODE)
  setTimeout(() => { tryJoinFromInviteUrl(); }, 400);
  // Реакция на смену #invite=... в текущей вкладке
  window.addEventListener("hashchange", () => {
    if (currentUser) tryJoinFromInviteUrl();
  });

  // Страховочный опрос членств — на случай, если realtime не доставил событие
  // (например, при одобрении заявки владельцем канала).
  setInterval(pollMemberships, 4000);
}

// Опрашивает список моих chat_members и подтягивает всё, чего нет в UI
async function pollMemberships() {
  if (!currentUser) return;
  // Не трогаем список, если открыт поиск — там свои результаты
  const searchInput = document.getElementById("search-input");
  if (searchInput && searchInput.value.trim()) return;
  try {
    const { data: myMemberships } = await supabase.from("chat_members")
      .select("chat_id").eq("user_id", currentUser.id);
    if (!myMemberships) return;
    const myIds = new Set(myMemberships.map((m) => m.chat_id));

    // Что сейчас в UI
    const uiIds = new Set();
    document.querySelectorAll(".user-item[data-chat-id]").forEach((el) => {
      uiIds.add(el.dataset.chatId);
    });

    // Что есть в БД, но нет в UI → добавляем
    for (const cid of myIds) {
      if (uiIds.has(cid)) continue;
      const { data: ch } = await supabase.from("channels").select("*").eq("id", cid).maybeSingle();
      if (ch) {
        await addOrUpdateChannelInList(cid, ch);
      } else {
        const { data: others } = await supabase.from("chat_members")
          .select("user_id").eq("chat_id", cid).neq("user_id", currentUser.id);
        if (others && others.length) {
          await addOrUpdateChatInList(cid, others[0].user_id);
        }
      }
    }
  } catch (e) { /* silent */ }
}

async function pollMyMessageStatuses() {
  if (!currentChatId) return;
  const myUnread = [...msgCache.values()].filter((m) => m.sender_id === currentUser.id && !m.read_at && !String(m.id).startsWith("tmp_"));
  if (!myUnread.length) return;
  const ids = myUnread.map((m) => m.id);
  try {
    const { data } = await supabase.from("messages").select("id, delivered_at, read_at").in("id", ids);
    (data || []).forEach((m) => {
      const old = msgCache.get(m.id);
      if (old && (old.read_at !== m.read_at || old.delivered_at !== m.delivered_at)) {
        msgCache.set(m.id, { ...old, ...m });
        updateMessageStatusInUI(m);
      }
    });
  } catch (e) {}
}

async function loadMyProfile() {
  const { data, error } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, accent_color, gender, last_seen, birthday, created_at, imagi_tokens, verified, bio")
    .eq("id", currentUser.id).single();
  if (error) { console.error(error); return; }
  myProfile = data; profileCache.set(currentUser.id, data);
  applyAccent(data.accent_color || "orange");
  paintAvatar(document.getElementById("me-avatar"), data);
  document.getElementById("me-name").innerHTML = escapeHtml(data.display_name) + verifiedBadge(data);
  document.getElementById("me-username").textContent = "@" + data.username;
}

async function loadChatReads() {
  const { data } = await supabase.from("chat_reads").select("chat_id, last_read_at").eq("user_id", currentUser.id);
  chatReads = new Map();
  (data || []).forEach((r) => chatReads.set(r.chat_id, new Date(r.last_read_at).getTime()));
}

function renderChatSubtitle() {
  const el = document.getElementById("chat-subtitle");
  if (!el) return;
  if (!currentOtherUser) { el.textContent = ""; return; }
  el.textContent = formatLastSeen(currentOtherUser);
  el.classList.toggle("online", isUserOnline(currentOtherUser));
}

async function getProfile(id) {
  if (profileCache.has(id)) return profileCache.get(id);
  const { data } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, accent_color, last_seen, gender, created_at, birthday, verified, bio")
    .eq("id", id).single();
  if (data) profileCache.set(id, data);
  return data;
}

// ======================= 6. ДИАЛОГИ =======================
function showAlertDialog(title, text) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const optionsEl = document.getElementById("dialog-options");
    const confirmBtn = document.getElementById("dialog-confirm");
    const cancelBtn = document.getElementById("dialog-cancel");
    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-text").textContent = text || "";
    confirmBtn.textContent = t("dialog.ok"); confirmBtn.disabled = false;
    optionsEl.innerHTML = ""; cancelBtn.style.display = "none";
    overlay.classList.remove("hidden");
    function cleanup() { overlay.classList.add("hidden"); confirmBtn.onclick = null; cancelBtn.onclick = null; cancelBtn.style.display = ""; }
    confirmBtn.onclick = () => { cleanup(); resolve(true); };
  });
}

function showConfirmDialog(title, text, confirmLabel, opts) {
  opts = opts || {};
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const optionsEl = document.getElementById("dialog-options");
    const confirmBtn = document.getElementById("dialog-confirm");
    const cancelBtn = document.getElementById("dialog-cancel");
    document.getElementById("dialog-title").textContent = title;
    // opts.html — разрешает HTML в тексте и на кнопке (для вставки <img> Nectar).
    // Используется ТОЛЬКО с нашими собственными строками — не с пользовательскими.
    if (opts.html) {
      document.getElementById("dialog-text").innerHTML = text || "";
      confirmBtn.innerHTML = confirmLabel || t("dialog.yes");
    } else {
      document.getElementById("dialog-text").textContent = text || "";
      confirmBtn.textContent = confirmLabel || t("dialog.yes");
    }
    confirmBtn.disabled = false;
    optionsEl.innerHTML = ""; cancelBtn.style.display = "";
    overlay.classList.remove("hidden");
    function cleanup() { overlay.classList.add("hidden"); confirmBtn.onclick = null; cancelBtn.onclick = null; }
    confirmBtn.onclick = () => { cleanup(); resolve(true); };
    cancelBtn.onclick = () => { cleanup(); resolve(false); };
  });
}

function showInputDialog(title, text, defaultValue) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("input-overlay");
    const field = document.getElementById("input-field");
    const confirmBtn = document.getElementById("input-confirm");
    const cancelBtn = document.getElementById("input-cancel");
    document.getElementById("input-title").textContent = title;
    document.getElementById("input-text").textContent = text || "";
    field.value = defaultValue || "";
    overlay.classList.remove("hidden");
    setTimeout(() => { field.focus(); field.select(); }, 60);
    function cleanup() { overlay.classList.add("hidden"); confirmBtn.onclick = null; cancelBtn.onclick = null; field.onkeydown = null; }
    confirmBtn.onclick = () => { const v = field.value; cleanup(); resolve(v); };
    cancelBtn.onclick = () => { cleanup(); resolve(null); };
    field.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); confirmBtn.click(); }
      if (e.key === "Escape") { e.preventDefault(); cancelBtn.click(); }
    };
  });
}

function showChoiceDialog(title, text, options, confirmLabel, opts) {
  opts = opts || {};
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const optionsEl = document.getElementById("dialog-options");
    const confirmBtn = document.getElementById("dialog-confirm");
    const cancelBtn = document.getElementById("dialog-cancel");
    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-text").textContent = text;
    confirmBtn.textContent = confirmLabel || t("dialog.confirm");
    confirmBtn.disabled = true;
    cancelBtn.style.display = "";
    optionsEl.innerHTML = "";
    optionsEl.style.flexDirection = "column";

    const searchable = !!opts.searchable;
    const searchPlaceholder = opts.searchPlaceholder || t("dialog.search.placeholder", "Поиск...");
    let selected = null;
    let rendered = options.slice();

    let searchInput = null;
    if (searchable) {
      searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = searchPlaceholder;
      searchInput.className = "dialog-search";
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        rendered = !q ? options.slice() : options.filter((o) => {
          const label = String(o.label || "").toLowerCase();
          const extra = String(o.search || "").toLowerCase();
          return label.indexOf(q) !== -1 || extra.indexOf(q) !== -1;
        });
        renderOptions();
      });
      optionsEl.appendChild(searchInput);
    }

    const listEl = document.createElement("div");
    listEl.className = "dialog-options-list";
    optionsEl.appendChild(listEl);

    function renderOptions() {
      listEl.innerHTML = "";
      if (!rendered.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.style.padding = "10px";
        empty.textContent = "Ничего не найдено";
        listEl.appendChild(empty);
        return;
      }
      rendered.forEach((opt) => {
        const b = document.createElement("button");
        b.className = "dialog-option";
        if (opt.value === selected) b.classList.add("selected");
        b.textContent = opt.label;
        b.addEventListener("click", () => {
          listEl.querySelectorAll(".dialog-option").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          selected = opt.value;
          confirmBtn.disabled = false;
        });
        listEl.appendChild(b);
      });
    }
    renderOptions();

    overlay.classList.remove("hidden");
    if (searchInput) setTimeout(() => searchInput.focus(), 60);

    function cleanup() {
      overlay.classList.add("hidden");
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    }
    confirmBtn.onclick = () => { if (selected === null) return; cleanup(); resolve(selected); };
    cancelBtn.onclick = () => { cleanup(); resolve(null); };
  });
}

// ======================= 7. ПРОФИЛЬ (свой) =======================
let draftProfile = {};

function setupProfilePanel() {
  document.getElementById("me-info-btn").addEventListener("click", openProfilePanel);
  document.getElementById("profile-close").addEventListener("click", () => document.getElementById("profile-overlay").classList.add("hidden"));
  document.getElementById("avatar-upload").addEventListener("change", handleAvatarUpload);

  document.getElementById("profile-username").addEventListener("input", (e) => {
    clearTimeout(usernameCheckTimeout); validatedUsername = null;
    const value = e.target.value;
    usernameCheckTimeout = setTimeout(() => checkUsernameLive(value), 350);
    markProfileDirty();
  });
  document.getElementById("profile-displayname").addEventListener("input", (e) => {
    draftProfile.display_name = e.target.value.trim();
    markProfileDirty();
    // Обновляем букву на превьюшках, чтобы она соответствовала первой букве имени
    renderAvatarGrid();
    // Обновляем счётчик символов
    updateProfileNameCounter();
  });
  document.getElementById("gender-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-gender]"); if (!btn) return;
    draftProfile.gender = btn.dataset.gender; myProfile.gender = btn.dataset.gender;
    updateGenderButtons(); markProfileDirty();
  });
  document.getElementById("profile-birthday").addEventListener("input", (e) => {
    // 🔴 Автоформат ДД.ММ или ДД.ММ.ГГГГ.
    // Пользователь вводит только цифры — точки ставятся сами.
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (digits.length > 0) formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += "." + digits.slice(2, 4);
    if (digits.length > 4) formatted += "." + digits.slice(4);
    if (formatted !== e.target.value) e.target.value = formatted;
    draftProfile.birthday = formatted.trim() || null;
    markProfileDirty();
  });
  document.getElementById("profile-bio").addEventListener("input", (e) => {
    draftProfile.bio = e.target.value; markProfileDirty();
  });

  setupBirthdayCalendar();
  document.getElementById("profile-apply").addEventListener("click", applyProfileChanges);
  document.getElementById("profile-gifts-btn").addEventListener("click", () => openGiftsOverlay(currentUser.id));
}

function markProfileDirty() { const btn = document.getElementById("profile-apply"); if (btn) btn.disabled = false; }

function updateProfileNameCounter() {
  const inp = document.getElementById("profile-displayname");
  const counter = document.getElementById("profile-displayname-counter");
  if (!inp || !counter) return;
  const len = inp.value.length;
  counter.textContent = `${len} / 25`;
  counter.classList.toggle("near-limit", len >= 20);
}

async function applyProfileChanges() {
  const unameInput = document.getElementById("profile-username");
  const unameVal = unameInput.value.trim();
  if (unameVal && unameVal !== myProfile.username && unameVal !== validatedUsername) {
    const hint = document.getElementById("username-hint");
    hint.className = "username-hint err"; hint.textContent = t("username.invalid"); return;
  }
  if (draftProfile.birthday) {
    const normalized = normalizeBirthday(draftProfile.birthday);
    if (!normalized) {
      await showAlertDialog(t("auth.err.prefix"), t("profile.birthday.placeholder"));
      return;
    }
    draftProfile.birthday = normalized; // сохраняем нормализованную
  }
  if (unameVal && unameVal !== myProfile.username) {
    const { error } = await supabase.from("profiles").update({ username: unameVal }).eq("id", currentUser.id);
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    myProfile.username = unameVal; document.getElementById("me-username").textContent = "@" + unameVal;
  }
  const payload = {};
  if (draftProfile.display_name) payload.display_name = draftProfile.display_name;
  if (draftProfile.gender !== undefined) payload.gender = draftProfile.gender;
  if (draftProfile.birthday !== undefined) payload.birthday = draftProfile.birthday;
  if (draftProfile.bio !== undefined) payload.bio = (draftProfile.bio || "").trim() || null;
  if (Object.keys(payload).length) {
    const { error } = await supabase.from("profiles").update(payload).eq("id", currentUser.id);
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    Object.assign(myProfile, payload);
    if (payload.display_name) document.getElementById("me-name").textContent = payload.display_name;
    if (currentOtherUser) renderChatSubtitle();
  }
  draftProfile = {};
  document.getElementById("profile-apply").disabled = true;
  const hint = document.getElementById("username-hint");
  hint.className = "username-hint ok"; hint.textContent = t("username.saved");
}

async function openProfilePanel() {
  if (!myProfile) return;
  document.getElementById("profile-overlay").classList.remove("hidden");
  paintAvatar(document.getElementById("profile-avatar-preview"), myProfile);

  // 🔴 Тап по своему аватару → просмотр фото (если это data URL).
  const myAv = document.getElementById("profile-avatar-preview");
  if (myAv) {
    myAv.onclick = null;
    if (myProfile && typeof myProfile.avatar_url === "string" && myProfile.avatar_url.startsWith("data:")) {
      myAv.style.cursor = "zoom-in";
      myAv.onclick = () => {
        openMediaViewer(myProfile.avatar_url, "image", [{ url: myProfile.avatar_url, kind: "image", msgId: null }], 0);
      };
    } else {
      myAv.style.cursor = "";
    }
  }

  renderAvatarGrid();
  document.getElementById("profile-displayname").value = myProfile.display_name || "";
  document.getElementById("profile-birthday").value = myProfile.birthday || "";
  document.getElementById("profile-bio").value = myProfile.bio || "";
  updateGenderButtons();
  const ui = document.getElementById("profile-username");
  ui.value = myProfile.username; validatedUsername = myProfile.username;
  // Обновляем счётчик после подстановки имени
  updateProfileNameCounter();
  const hint = document.getElementById("username-hint"); hint.className = "username-hint"; hint.textContent = "";
  draftProfile = {}; document.getElementById("profile-apply").disabled = true;
  await refreshMyGiftsCount();
}

function renderAvatarGrid() {
  const grid = document.getElementById("avatar-grid"); grid.innerHTML = "";
  // Букву берём из того, что сейчас в инпуте имени (или из myProfile, если инпут пустой)
  const liveName = (draftProfile.display_name !== undefined && draftProfile.display_name !== "")
    ? draftProfile.display_name
    : (myProfile.display_name || "");
  const letter = firstChar(liveName);

  BASE_AVATARS.forEach((pair, idx) => {
    const el = document.createElement("div");
    el.className = "avatar-option"; el.dataset.idx = idx;
    el.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    el.textContent = letter;
    if (myProfile.avatar_url === "color:" + idx) el.classList.add("selected");
    el.addEventListener("click", async () => {
      const url = "color:" + idx;
      myProfile.avatar_url = url;
      paintAvatar(document.getElementById("profile-avatar-preview"), { display_name: liveName, avatar_url: url });
      paintAvatar(document.getElementById("me-avatar"), { display_name: liveName, avatar_url: url });
      renderAvatarGrid();
      await saveProfileField({ avatar_url: url });
    });
    grid.appendChild(el);
  });

  // Обновляем большую превьюшку
  paintAvatar(document.getElementById("profile-avatar-preview"), { display_name: liveName, avatar_url: myProfile.avatar_url });
}

function updateAccentButtons() {
  const cur = document.documentElement.getAttribute("data-accent") || "orange";
  document.querySelectorAll(".accent-option").forEach((el) => el.classList.toggle("selected", el.dataset.accent === cur));
}

function updateGenderButtons() {
  const cur = (myProfile && myProfile.gender) || "unset";
  document.querySelectorAll("#gender-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.gender === cur));
}

async function saveProfileField(fields) {
  Object.assign(myProfile, fields);
  const { error } = await supabase.from("profiles").update(fields).eq("id", currentUser.id);
  if (error) console.error(error);
}

// ═══════════════════════════════════════════════════════
// КРОП АВАТАРА — универсальный (профиль + каналы)
// ═══════════════════════════════════════════════════════

const CROPPER_CIRCLE_FRACTION = 0.9;  // диаметр круга = 90% от stage (см. CSS)
const CROPPER_OUTPUT_SIZE = 400;      // размер итогового квадрата

const cropperState = {
  img: null,
  naturalW: 0,
  naturalH: 0,
  stageW: 0,
  stageH: 0,
  scale: 1,
  minScale: 1,
  maxScale: 4,
  x: 0,
  y: 0,
  callback: null,
  // drag
  dragStartX: 0,
  dragStartY: 0,
  dragStartTranslateX: 0,
  dragStartTranslateY: 0,
  isDragging: false,
  // pinch
  pinchStartDist: 0,
  pinchStartScale: 1,
  pinchStartPointX: 0,
  pinchStartPointY: 0,
  pinchActive: false,
  pinchEndTimer: null,
};

function cropperUpdateTransform() {
  const imgEl = document.getElementById("cropper-img");
  if (!imgEl) return;
  imgEl.style.transform =
    `translate(-50%, -50%) translate(${cropperState.x}px, ${cropperState.y}px) scale(${cropperState.scale})`;
}

function cropperClampTranslate() {
  const stage = document.getElementById("cropper-stage");
  if (!stage) return;
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const R = Math.min(W, H) * CROPPER_CIRCLE_FRACTION / 2;
  const sw = cropperState.naturalW * cropperState.scale;
  const sh = cropperState.naturalH * cropperState.scale;
  const rangeX = Math.max(0, sw / 2 - R);
  const rangeY = Math.max(0, sh / 2 - R);
  cropperState.x = Math.max(-rangeX, Math.min(rangeX, cropperState.x));
  cropperState.y = Math.max(-rangeY, Math.min(rangeY, cropperState.y));
}

function cropperInit() {
  const stage = document.getElementById("cropper-stage");
  const imgEl = document.getElementById("cropper-img");
  if (!stage || !imgEl || !cropperState.img) return;

  // 🔴 Устанавливаем src DOM-элементу. Без этого тег <img> пустой — отсюда
  // чёрный экран в окне кроппера.
  imgEl.src = cropperState.img.src;

  const W = stage.clientWidth;
  const H = stage.clientHeight;
  cropperState.stageW = W;
  cropperState.stageH = H;

  const diameter = Math.min(W, H) * CROPPER_CIRCLE_FRACTION;
  const minScale = Math.max(
    diameter / cropperState.naturalW,
    diameter / cropperState.naturalH
  );
  cropperState.minScale = minScale;
  cropperState.maxScale = minScale * 4;
  cropperState.scale = minScale;
  cropperState.x = 0;
  cropperState.y = 0;

  imgEl.style.width = cropperState.naturalW + "px";
  imgEl.style.height = cropperState.naturalH + "px";
  cropperUpdateTransform();

  const zoomSlider = document.getElementById("cropper-zoom");
  if (zoomSlider) {
    zoomSlider.min = String(minScale);
    zoomSlider.max = String(cropperState.maxScale);
    zoomSlider.step = String((cropperState.maxScale - minScale) / 100 || 0.01);
    zoomSlider.value = String(minScale);
  }
}

function openAvatarCropper(file, onApply) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      cropperState.img = img;
      cropperState.naturalW = img.naturalWidth;
      cropperState.naturalH = img.naturalHeight;
      cropperState.callback = onApply;

      const overlay = document.getElementById("avatar-cropper-overlay");
      overlay.classList.remove("hidden");

      // Ждём кадр, чтобы stage получил реальные размеры
      requestAnimationFrame(() => cropperInit());
    };
    img.onerror = () => {
      showAlertDialog("Ошибка", "Не удалось открыть изображение");
    };
    img.src = reader.result;
  };
  reader.onerror = () => {
    showAlertDialog("Ошибка", "Не удалось прочитать файл");
  };
  reader.readAsDataURL(file);
}

function closeAvatarCropper() {
  document.getElementById("avatar-cropper-overlay").classList.add("hidden");
  cropperState.img = null;
  cropperState.callback = null;
}

function cropperApply() {
  if (!cropperState.img || !cropperState.callback) return;
  const stage = document.getElementById("cropper-stage");
  if (!stage) return;

  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const diameter = Math.min(W, H) * CROPPER_CIRCLE_FRACTION;
  const k = CROPPER_OUTPUT_SIZE / diameter;

  const OUT = CROPPER_OUTPUT_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = OUT;
  canvas.height = OUT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const dw = cropperState.naturalW * cropperState.scale * k;
  const dh = cropperState.naturalH * cropperState.scale * k;
  const dx = OUT / 2 + cropperState.x * k - dw / 2;
  const dy = OUT / 2 + cropperState.y * k - dh / 2;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, OUT, OUT);
  ctx.drawImage(cropperState.img, dx, dy, dw, dh);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
  const cb = cropperState.callback;
  closeAvatarCropper();
  cb(dataUrl);
}

function setupAvatarCropper() {
  const overlay = document.getElementById("avatar-cropper-overlay");
  const stage = document.getElementById("cropper-stage");
  const applyBtn = document.getElementById("cropper-apply");
  const cancelBtn = document.getElementById("cropper-cancel");
  const zoomSlider = document.getElementById("cropper-zoom");
  if (!overlay || !stage) return;

  applyBtn.addEventListener("click", cropperApply);
  cancelBtn.addEventListener("click", closeAvatarCropper);

  zoomSlider.addEventListener("input", () => {
    const v = parseFloat(zoomSlider.value);
    if (!isNaN(v)) {
      cropperState.scale = v;
      cropperClampTranslate();
      cropperUpdateTransform();
    }
  });

  // ---- Тач: drag + pinch ----
  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      cropperState.pinchActive = true;
      if (cropperState.pinchEndTimer) {
        clearTimeout(cropperState.pinchEndTimer);
        cropperState.pinchEndTimer = null;
      }
      const bodyRect = stage.getBoundingClientRect();
      const cx = bodyRect.left + bodyRect.width / 2;
      const cy = bodyRect.top + bodyRect.height / 2;
      const t0 = e.touches[0], t1 = e.touches[1];
      cropperState.pinchStartDist =
        Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY) || 1;
      cropperState.pinchStartScale = cropperState.scale;
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;
      cropperState.pinchStartPointX =
        (midX - cx - cropperState.x) / cropperState.scale;
      cropperState.pinchStartPointY =
        (midY - cy - cropperState.y) / cropperState.scale;
    } else if (e.touches.length === 1) {
      cropperState.isDragging = true;
      cropperState.dragStartX = e.touches[0].clientX;
      cropperState.dragStartY = e.touches[0].clientY;
      cropperState.dragStartTranslateX = cropperState.x;
      cropperState.dragStartTranslateY = cropperState.y;
    }
  }, { passive: true });

  stage.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const bodyRect = stage.getBoundingClientRect();
      const cx = bodyRect.left + bodyRect.width / 2;
      const cy = bodyRect.top + bodyRect.height / 2;
      const t0 = e.touches[0], t1 = e.touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const ratio = dist / cropperState.pinchStartDist;
      const newScale = Math.max(
        cropperState.minScale,
        Math.min(cropperState.maxScale, cropperState.pinchStartScale * ratio)
      );
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;
      cropperState.scale = newScale;
      cropperState.x = midX - cx - cropperState.pinchStartPointX * newScale;
      cropperState.y = midY - cy - cropperState.pinchStartPointY * newScale;
      // Плавно гасим смещение у нижнего предела — чтобы не «уползало»
      const t = Math.max(0, (newScale - cropperState.minScale) /
        (cropperState.minScale * 0.4));
      if (t < 1) {
        cropperState.x *= t;
        cropperState.y *= t;
      }
      cropperClampTranslate();
      cropperUpdateTransform();
      if (zoomSlider) zoomSlider.value = String(newScale);
    } else if (e.touches.length === 1 && cropperState.isDragging) {
      e.preventDefault();
      cropperState.x = cropperState.dragStartTranslateX +
        (e.touches[0].clientX - cropperState.dragStartX);
      cropperState.y = cropperState.dragStartTranslateY +
        (e.touches[0].clientY - cropperState.dragStartY);
      cropperClampTranslate();
      cropperUpdateTransform();
    }
  }, { passive: false });

  stage.addEventListener("touchend", (e) => {
    if (e.touches.length === 1) {
      // Переход 2→1: пересобираем стартовые точки
      cropperState.isDragging = true;
      cropperState.dragStartX = e.touches[0].clientX;
      cropperState.dragStartY = e.touches[0].clientY;
      cropperState.dragStartTranslateX = cropperState.x;
      cropperState.dragStartTranslateY = cropperState.y;
    }
    if (e.touches.length === 0) {
      cropperState.isDragging = false;
      if (cropperState.pinchActive) {
        if (cropperState.pinchEndTimer) clearTimeout(cropperState.pinchEndTimer);
        cropperState.pinchEndTimer = setTimeout(() => {
          cropperState.pinchActive = false;
          cropperState.pinchEndTimer = null;
        }, 250);
      }
    }
  });

  // ---- Мышь (ПК): drag ----
  stage.addEventListener("mousedown", (e) => {
    cropperState.isDragging = true;
    cropperState.dragStartX = e.clientX;
    cropperState.dragStartY = e.clientY;
    cropperState.dragStartTranslateX = cropperState.x;
    cropperState.dragStartTranslateY = cropperState.y;
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!cropperState.isDragging) return;
    cropperState.x = cropperState.dragStartTranslateX + (e.clientX - cropperState.dragStartX);
    cropperState.y = cropperState.dragStartTranslateY + (e.clientY - cropperState.dragStartY);
    cropperClampTranslate();
    cropperUpdateTransform();
  });
  window.addEventListener("mouseup", () => {
    cropperState.isDragging = false;
  });

  // ---- Колесо (ПК) ----
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const step = 0.08;
    const newScale = Math.max(
      cropperState.minScale,
      Math.min(cropperState.maxScale, cropperState.scale + (e.deltaY > 0 ? -step : step))
    );
    cropperState.scale = newScale;
    cropperClampTranslate();
    cropperUpdateTransform();
    if (zoomSlider) zoomSlider.value = String(newScale);
  }, { passive: false });
}

async function handleAvatarUpload(e) {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  openAvatarCropper(file, async (dataUrl) => {
    myProfile.avatar_url = dataUrl;
    paintAvatar(document.getElementById("profile-avatar-preview"), myProfile);
    paintAvatar(document.getElementById("me-avatar"), myProfile);
    renderAvatarGrid();
    await saveProfileField({ avatar_url: dataUrl });
  });
}

function resizeImage(file, maxSize) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; } }
        else { if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// Возвращает true, если username зарезервирован и НЕ доступен текущему пользователю
async function isUsernameReservedForOther(username) {
  const clean = String(username || "").trim();
  if (!clean) return false;
  const { data, error } = await supabase.rpc("is_username_reserved", { p_username: clean });
  if (error) return false;
  return !!data;
}

async function checkUsernameLive(value) {
  const hint = document.getElementById("username-hint");
  const username = value.trim(); validatedUsername = null;
  if (!username) { hint.className = "username-hint"; hint.textContent = ""; return; }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) { hint.className = "username-hint err"; hint.textContent = t("username.onlyLatin"); return; }
  if (username.length < 3) { hint.className = "username-hint err"; hint.textContent = t("username.tooShort"); return; }
  if (myProfile && username.toLowerCase() === myProfile.username.toLowerCase()) {
    hint.className = "username-hint ok"; hint.textContent = t("username.current"); validatedUsername = username; return;
  }
  hint.className = "username-hint"; hint.textContent = t("username.checking");

  const reserved = await isUsernameReservedForOther(username);
  if (reserved) {
    if (document.getElementById("profile-username").value.trim() !== username) return;
    hint.className = "username-hint err";
    hint.textContent = tFmt("username.reserved", { username });
    validatedUsername = null;
    return;
  }

  const { data, error } = await supabase.from("profiles").select("id").ilike("username", username).neq("id", currentUser.id).limit(1);
  if (document.getElementById("profile-username").value.trim() !== username) return;
  if (error) { hint.className = "username-hint err"; hint.textContent = t("username.error"); return; }
  if (data && data.length > 0) { hint.className = "username-hint err"; hint.textContent = tFmt("username.taken", { username }); validatedUsername = null; }
  else { hint.className = "username-hint ok"; hint.textContent = tFmt("username.free", { username }); validatedUsername = username; }
}

// ======================= 8. ПРОФИЛЬ СОБЕСЕДНИКА =======================
async function openUserProfileDialog(userOverride) {
  const user = userOverride || currentOtherUser || pendingOtherUser;
  if (!user) return;
  const overlay = document.getElementById("user-profile-overlay");
  // Запоминаем, чей профиль открыт — чтобы realtime мог перерисовать
  if (overlay) overlay.dataset.userId = user.id;

  // Стрелка «назад» видна только если мы пришли из окна подарка
  const backBtn = document.getElementById("user-profile-back");
  if (backBtn) backBtn.classList.toggle("hidden", !profileFromGiftContext);
  const { data: freshProfile } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, created_at, last_seen, gender, birthday, verified, bio")
    .eq("id", user.id).single();
  const p = freshProfile || user;
  profileCache.set(user.id, { ...profileCache.get(user.id), ...p });
  paintAvatar(document.getElementById("user-profile-avatar"), p);

  // 🔴 Тап по аватарке → просмотр фото (если это загруженная картинка).
  // Цветные аватары (color:N) не открываем — там нечего смотреть.
  const avatarEl = document.getElementById("user-profile-avatar");
  if (avatarEl) {
    avatarEl.onclick = null;
    if (p && typeof p.avatar_url === "string" && p.avatar_url.startsWith("data:")) {
      avatarEl.style.cursor = "zoom-in";
      avatarEl.onclick = () => {
        openMediaViewer(p.avatar_url, "image", [{ url: p.avatar_url, kind: "image", msgId: null }], 0);
      };
    } else {
      avatarEl.style.cursor = "";
    }
  }
  document.getElementById("user-profile-name").innerHTML = escapeHtml(p.display_name || "—") + verifiedBadge(p);
  const statusEl = document.getElementById("user-profile-status");
  statusEl.textContent = formatLastSeen(p);
  statusEl.classList.toggle("online", isUserOnline(p));
  document.getElementById("user-profile-username").textContent = "@" + (p.username || "");

  // Описание: показываем только если непустое
  const bioEl = document.getElementById("user-profile-bio");
  const bioText = (p.bio || "").trim();
  if (bioText) {
    bioEl.textContent = bioText;
    bioEl.classList.remove("hidden");
  } else {
    bioEl.textContent = "";
    bioEl.classList.add("hidden");
  }

  const bdStr = formatBirthday(p.birthday);
  const todayMD = (new Date().getMonth() + 1) * 100 + new Date().getDate();
  const bdMD = parseBirthdayMD(p.birthday);
  const isBd = bdMD && bdMD === todayMD;
  document.getElementById("user-profile-birthday").innerHTML = escapeHtml(bdStr) + (isBd && bdStr !== "—" ? '<span class="bd-party">🎉</span>' : "");
  document.getElementById("user-profile-created").textContent = p.created_at ? new Date(p.created_at).toLocaleDateString(localeId()) : "—";
  let msgCount = 0;
  if (currentChatId && currentOtherUser && currentOtherUser.id === user.id) {
    const { data: msgs } = await supabase.from("messages").select("id").eq("chat_id", currentChatId);
    msgCount = (msgs || []).filter((m) => !hiddenMsgIds.has(m.id)).length;
  }
  document.getElementById("user-profile-msgcount").textContent = String(msgCount);

  // Себе — все свои подарки. Другому — только те, что владелец выставил в профиль.
  const isMe = user.id === currentUser.id;
  let giftsQ = supabase.from("user_gifts")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  if (!isMe) giftsQ = giftsQ.eq("in_profile", true);
  const { count: totalGifts } = await giftsQ;
  document.getElementById("user-profile-gifts-count").textContent = String(totalGifts || 0);
  document.getElementById("user-profile-gifts-btn").onclick = () => openGiftsOverlay(user.id);
  overlay.classList.remove("hidden");
}

// ======================= 9. БЛОКИРОВКИ =======================
async function loadBlocks() {
  myBlockedIds = new Set(); blockedMeIds = new Set();
  const { data, error } = await supabase.from("blocked_users").select("blocker_id, blocked_id");
  if (error) { console.error(error); return; }
  (data || []).forEach((b) => {
    if (b.blocker_id === currentUser.id) myBlockedIds.add(b.blocked_id);
    if (b.blocked_id === currentUser.id) blockedMeIds.add(b.blocker_id);
  });
}
async function blockUser(userId) {
  const { error } = await supabase.from("blocked_users").insert({ blocker_id: currentUser.id, blocked_id: userId });
  if (error) { await showAlertDialog(t("auth.err.prefix"), t("block.failed") + ": " + error.message); return; }
  await loadBlocks();
}
async function unblockUser(userId) {
  const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", currentUser.id).eq("blocked_id", userId);
  if (error) { await showAlertDialog(t("auth.err.prefix"), t("block.failed") + ": " + error.message); return; }
  await loadBlocks();
}
function isBlockedByMe(id) { return myBlockedIds.has(id); }
function hasBlockedMe(id) { return blockedMeIds.has(id); }

function subscribeToBlocks() {
  if (blocksChannel) return;
  blocksChannel = supabase.channel("blocks-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "blocked_users" }, async () => {
      await loadBlocks();
      if (currentOtherUser) updateBlockUI();
    }).subscribe();
}

function subscribeToGlobalChanges() {
  if (globalChannel) return;
  globalChannel = supabase.channel("global-changes")
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chats" }, (payload) => {
      const id = payload.old && payload.old.id; if (!id) return;
      if (currentChatId === id) closeCurrentChat();
      removeChatFromList(id);
      channelCache.delete(id);
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "channels" }, async (payload) => {
      const ch = payload.new; if (!ch) return;
      channelCache.set(ch.id, ch);
      await refreshChannelRights(ch.id);
    })
    .subscribe();
}

function subscribeToMemberships() {
  if (membershipChannel) return;
  membershipChannel = supabase.channel("membership-changes")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_members" }, async (payload) => {
      await refreshChannelRights(payload.new.chat_id);
      if (payload.new.user_id === currentUser.id) {
        const chatId = payload.new.chat_id;
        // Если это наш открытый канал — перезагружаем сообщения без перезапуска
        if (currentChatId === chatId && currentChannelObj && currentChannelObj.id === chatId) {
          currentChannelHasRequest = false;
          currentChannelIsSubscribed = true;
          await updateChannelComposerState();
          configureChatMenuForChannel(currentChannelObj);
          await loadMessages(chatId, openSeq);
          await loadReactionsForVisibleMessages();
          await markChatRead(chatId);
          return;
        }
        if (document.querySelector(`.user-item[data-chat-id="${chatId}"]`)) return;
        const { data: ch } = await supabase.from("channels").select("*").eq("id", chatId).maybeSingle();
        if (ch) { await addOrUpdateChannelInList(chatId, ch); return; }
        const { data: others } = await supabase.from("chat_members")
          .select("user_id").eq("chat_id", chatId).neq("user_id", currentUser.id);
        if (others && others.length) await addOrUpdateChatInList(chatId, others[0].user_id);
      }
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_members" }, async (payload) => {
      // 🔴 Переименование чата (custom_name) — это UPDATE в chat_members.
      // Без этого обработчика переименование на одном устройстве не
      // подхватывалось на втором (у того же аккаунта) до перезагрузки.
      const row = payload.new;
      if (!row) return;
      // custom_name у КАЖДОГО пользователя свой, поэтому реагируем только
      // на изменение своей строки (у которой user_id === currentUser.id).
      if (row.user_id !== currentUser.id) return;
      const chatId = row.chat_id;
      if (!chatId) return;
      const newCustomName = row.custom_name || "";

      // 1. Обновляем карточку в списке чатов
      const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
      if (el) {
        el.dataset.customName = newCustomName;
        const isChannel = el.dataset.chatType === "channel";
        const nameEl = el.querySelector(".user-item-name");
        if (nameEl) {
          if (isChannel) {
            const ch = channelCache.get(chatId);
            if (ch) {
              nameEl.innerHTML = escapeHtml(newCustomName || ch.name) +
                verifiedBadge(ch) + '<span class="channel-mark">📢</span>';
            }
          } else {
            const uid = el.dataset.userId;
            const p = uid ? profileCache.get(uid) : null;
            if (p) {
              nameEl.innerHTML = escapeHtml(newCustomName || p.display_name) +
                verifiedBadge(p) + (isBlockedByMe(uid) ? " 🚫" : "");
            }
          }
        }
      }

      // 2. Если этот чат открыт — обновляем заголовок в шапке
      if (currentChatId === chatId) {
        if (currentChannelObj && currentChannelObj.id === chatId) {
          document.getElementById("chat-title").innerHTML =
            escapeHtml(newCustomName || currentChannelObj.name) + verifiedBadge(currentChannelObj);
        } else if (currentOtherUser) {
          document.getElementById("chat-title").innerHTML =
            escapeHtml(newCustomName || currentOtherUser.display_name) + verifiedBadge(currentOtherUser);
        }
      }

      // 3. Обновляем контекстное меню (на случай, если открыто на этом чате)
      if (contextChatUser && contextChatUser.id === el?.dataset.userId) {
        contextChatCustomName = newCustomName || null;
      }
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_members" }, async (payload) => {
      const chatId = payload.old && payload.old.chat_id;
      if (!chatId) return;
      await refreshChannelRights(chatId);
      if (payload.old && payload.old.user_id === currentUser.id) {
        const { data: ch } = await supabase.from("channels").select("id").eq("id", chatId).maybeSingle();
        if (ch) {
          // Канал: СРАЗУ убираем из списка чатов
          currentChannelIsSubscribed = false;
          removeChatFromList(chatId);
          if (currentChannelObj && currentChannelObj.id === chatId) {
            await updateChannelComposerState();
            configureChatMenuForChannel(currentChannelObj);
            await loadMessages(chatId, openSeq);
            await loadReactionsForVisibleMessages();
          }
        } else {
          // DM: закрываем и удаляем
          if (currentChatId === chatId) closeCurrentChat();
          removeChatFromList(chatId);
          channelCache.delete(chatId);
        }
      }
    }).subscribe();
}

function subscribeToReads() {
  if (readsChannel) return;
  readsChannel = supabase.channel("reads-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads" }, (payload) => {
      const r = payload.new || payload.old; if (!r) return;
      if (r.user_id === currentUser.id) {
        chatReads.set(r.chat_id, new Date(r.last_read_at).getTime());
        if (r.chat_id === currentChatId) {
          const data = chatLastMsg.get(r.chat_id); if (data) { data.unread = 0; chatLastMsg.set(r.chat_id, data); }
          updateChatItemPreview(r.chat_id);
        }
      }
    }).subscribe();
}

function subscribeToGlobalMessages() {
  if (globalMsgsChannel) return;
  globalMsgsChannel = supabase.channel("global-msgs")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const m = payload.new; if (!m) return;
      const time = new Date(m.created_at).getTime();
      const prev = chatLastMsg.get(m.chat_id) || {};
      const isMine = m.sender_id === currentUser.id;
      let previewText = previewTextForMsg(m, isMine);

      // Если это своё только что отправленное сообщение — сохраняем
      // плейнтекст, который мы уже положили при отправке, и не перетираем
      // его «🔒 Зашифровано» от realtime.
      let finalPreviewText = previewText;
      if (isMine && m.encrypted && prev && prev.msgId === m.id &&
          prev.text && prev.text !== t("preview.encrypted")) {
        finalPreviewText = prev.text;
      }

      chatLastMsg.set(m.chat_id, {
        text: finalPreviewText,
        time, senderId: m.sender_id,
        msgId: m.id,
        unread: isMine ? (prev.unread || 0) : (prev.unread || 0) + 1,
      });

      // Расшифровываем превью, если оно зашифровано и не расшифровано локально.
      if (m.encrypted && m.message_type !== "attachment" && finalPreviewText === t("preview.encrypted")) {
        if (channelCache.has(m.chat_id)) {
          // Для канала otherId не нужен — decryptChatPreview сам возьмёт
          // канальный ключ через getChannelKeyForMe (и для чужих, и для своих).
          decryptChatPreview(m, null, m.chat_id);
        } else {
          const otherId = isMine
            ? (chatOtherUserCache.get(m.chat_id) || (currentOtherUser && currentOtherUser.id))
            : m.sender_id;
          if (otherId) decryptChatPreview(m, otherId, m.chat_id);
        }
      }
      if (!document.getElementById("search-input").value.trim()) {
        updateChatItemPreview(m.chat_id);
        resortChatsList();
      }
      if (currentChatId === m.chat_id && !isMine) {
        const isChannelChat = currentChannelObj && currentChannelObj.id === m.chat_id;
        if (!isChannelChat || currentChannelIsSubscribed) {
          setTimeout(() => markChatRead(m.chat_id), 300);
        }
      }

      // Уведомление о новом входящем сообщении.
      // — не показываем для своих сообщений;
      // — не показываем, если это открытый сейчас чат И окно в фокусе;
      // — не показываем для замьюченных чатов (muted, см. следующий этап);
      // — не показываем для сервисных сообщений (gift/tokens/attachment с пустым текстом).
      // 🔴 Уведомления — в самом конце и в try/catch + setTimeout(0).
      // Даже если что-то упадёт внутри — бейдж и превью в списке чатов
      // уже обновлены выше, realtime-хендлер не сломается.
      if (!isMine) {
        try {
          const chatEl = document.querySelector(`.user-item[data-chat-id="${m.chat_id}"]`);
          const isMuted = chatEl && chatEl.dataset.muted === "1";
          const isCurrentChatVisible =
            currentChatId === m.chat_id &&
            document.visibilityState === "visible";
          if (!isMuted && !isCurrentChatVisible) {
            setTimeout(() => {
              try { showMessageNotification(m); } catch (e) { console.warn("notify failed:", e); }
            }, 0);
          }
        } catch (e) { /* silent */ }
      }
    }).subscribe();
}

// Формирует и показывает уведомление о новом сообщении.
// Логика:
//  — окно в фокусе → красивый in-app тост;
//  — окно свёрнуто/в фоне → системное уведомление (с аватаркой-иконкой).
async function showMessageNotification(m) {
  if (!m) return;

  // Профиль отправителя (для аватарки и имени)
  let senderProfile = profileCache.get(m.sender_id);
  if (!senderProfile) {
    try {
      const { data } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", m.sender_id).maybeSingle();
      if (data) {
        senderProfile = data;
        profileCache.set(m.sender_id, data);
      }
    } catch (e) { /* silent */ }
  }
  const senderName = (senderProfile && senderProfile.display_name) || "Cell";

  // Текст уведомления
  let body = "";
  if (m.message_type === "tokens") body = t("preview.gift");
  else if (m.message_type === "gift") body = t("preview.gift");
  else if (m.message_type === "attachment") {
    if (m.file_kind === "image") body = t("preview.photo");
    else if (m.file_kind === "video") body = t("preview.video");
    else body = t("preview.file");
  } else if (m.encrypted) {
    body = t("preview.encrypted");
  } else {
    body = stripMarkdown(m.content || "").slice(0, 140);
  }
  if (!body) body = t("notif.newMessage");

  // Галочка «Уведомления» в настройках должна глушить ВСЁ —
  // и тост, и системное уведомление. Иначе это выглядит как баг.
  if (!areNotificationsEnabled()) return;

  const onClick = () => { openChatFromNotification(m).catch(() => {}); };

  // 1) Окно видно — in-app тост (без разрешений, всегда работает)
  if (document.visibilityState === "visible") {
    playNotificationSound();
    showInAppToast({
      profile: senderProfile,
      title: senderName,
      body: body,
      tag: "cell-chat-" + m.chat_id,
      onClick,
    });
    return;
  }

  // 2) Окно в фоне — системное уведомление
  const iconUrl = await getNotificationIcon(senderProfile);
  showAppNotification(senderName, {
    body: body,
    tag: "cell-chat-" + m.chat_id,
    icon: iconUrl,
    onClick,
  });
}

// Открывает чат/канал, к которому относится сообщение из уведомления.
async function openChatFromNotification(m) {
  if (!m || !m.chat_id) return;
  await openChatById(m.chat_id);
}

// Универсальный открыватель чата по chat_id (канал или DM).
async function openChatById(chatId) {
  if (!chatId || !currentUser) return;
  // Канал
  if (channelCache.has(chatId)) {
    await openChannel(chatId);
    return;
  }
  // DM — ищем собеседника
  let otherId = chatOtherUserCache.get(chatId);
  if (!otherId) {
    try {
      const { data: others } = await supabase.from("chat_members")
        .select("user_id").eq("chat_id", chatId).neq("user_id", currentUser.id);
      if (others && others[0]) otherId = others[0].user_id;
    } catch (e) { /* silent */ }
  }
  if (!otherId) return;
  const p = profileCache.get(otherId) || await getProfile(otherId);
  if (p) await openChatWith(p);
}

// Приём сообщений от Service Worker (клик по системному уведомлению).
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data && e.data.type === "OPEN_CHAT" && e.data.chatId) {
      openChatById(e.data.chatId).catch(() => {});
    }
  });
}

// Обработка хэша #open-chat=<id> — так открывает окно SW,
// если приложение было полностью закрыто.
async function handleOpenChatHash() {
  const m = /[#&]open-chat=([^&]+)/.exec(window.location.hash || "");
  if (!m) return;
  const chatId = decodeURIComponent(m[1]);
  try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}
  // Ждём, пока прогрузится список чатов и кэши
  await new Promise((r) => setTimeout(r, 800));
  try { await openChatById(chatId); } catch (e) { console.warn("open-chat hash:", e); }
}

function updateUserEverywhere(profile) {
  const itemEl = document.querySelector(`.user-item[data-user-id="${profile.id}"]`);
  if (itemEl) {
    paintAvatar(itemEl.querySelector(".avatar"), profile);
    const nameEl = itemEl.querySelector(".user-item-name");
    if (nameEl) {
      const custom = itemEl.dataset.customName;
      nameEl.innerHTML = escapeHtml(custom || profile.display_name) + verifiedBadge(profile) + (isBlockedByMe(profile.id) ? " 🚫" : "");
    }
  }
  if (currentOtherUser && currentOtherUser.id === profile.id) {
    Object.assign(currentOtherUser, profile);
    paintAvatar(document.getElementById("chat-avatar"), currentOtherUser);
    const custom = document.querySelector(`.user-item[data-user-id="${profile.id}"]`)?.dataset.customName;
    document.getElementById("chat-title").innerHTML = escapeHtml(custom || profile.display_name) + verifiedBadge(profile);
    renderChatSubtitle();
  }
}

function subscribeToProfiles() {
  if (profilesChannel) return;
  profilesChannel = supabase.channel("profiles-changes")
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
      const p = payload.new; profileCache.set(p.id, p);
      if (p.id === currentUser.id) {
        myProfile = { ...myProfile, ...p };
        paintAvatar(document.getElementById("me-avatar"), myProfile);
        document.getElementById("me-name").innerHTML = escapeHtml(p.display_name) + verifiedBadge(p);
        document.getElementById("me-username").textContent = "@" + p.username;
      }
      updateUserEverywhere(p);
      if (currentOtherUser && currentOtherUser.id === p.id) renderChatSubtitle();
      const i = cachedProfilesForBirthday.findIndex((x) => x.id === p.id);
      if (i !== -1) cachedProfilesForBirthday[i] = { ...cachedProfilesForBirthday[i], ...p };
      renderBirthdayBanner();

      // Если этот профиль сейчас открыт у нас — перерисуем его без перезагрузки,
      // чтобы сразу увидеть свежий bio/имя/аватар.
      const overlay = document.getElementById("user-profile-overlay");
      if (overlay && !overlay.classList.contains("hidden") && overlay.dataset.userId === p.id) {
        openUserProfileDialog(p);
      }
    }).subscribe();
}

// ======================= 10. СПИСОК ЧАТОВ =======================
async function loadRecentChats() {
  const listEl = document.getElementById("users-list");
  document.getElementById("section-title").textContent = t("sidebar.section.chats");
  // 🔴 Показываем «Загрузка...» только если список ещё пуст (первичная
  // загрузка). При повторных вызовах оставляем текущий список — иначе
  // при обновлении данных пользователь видит мигание «Загрузка → чаты».
  const hasChatItems = !!listEl.querySelector(".user-item");
  if (!hasChatItems) {
    listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';
  }

  const { data: myChats, error: e1 } = await supabase.from("chat_members").select("chat_id, custom_name, muted").eq("user_id", currentUser.id);
  if (e1 || !myChats || myChats.length === 0) {
    listEl.innerHTML = '<div class="empty">' + t("empty.noChats") + '</div>';
    chatIdByUser.clear(); return;
  }
  const chatIds = myChats.map((c) => c.chat_id);

  // Каналы среди моих chat_id
  const { data: channelsData } = await supabase.from("channels").select("*").in("id", chatIds);
  channelCache = new Map((channelsData || []).map((c) => [c.id, c]));
  const channelIds = new Set(channelCache.keys());

  const [msgsRes, othersRes, readsRes, hidesRes] = await Promise.all([
    supabase.from("messages").select("id, chat_id, sender_id, content, created_at, message_type, tokens_amount, delivered_at, read_at, encrypted, file_iv, file_key_enc")
      .in("chat_id", chatIds).order("created_at", { ascending: false }).limit(500),
    supabase.from("chat_members").select("chat_id, user_id").in("chat_id", chatIds).neq("user_id", currentUser.id),
    supabase.from("chat_reads").select("chat_id, last_read_at").eq("user_id", currentUser.id),
    supabase.from("chat_hides").select("chat_id, hidden_at").eq("user_id", currentUser.id),
  ]);
  const msgs = msgsRes.data || [], others = othersRes.data || [], reads = readsRes.data || [], hides = hidesRes.data || [];
  const hideMap = new Map((hides || []).map((h) => [h.chat_id, new Date(h.hidden_at).getTime()]));
  const readMap = new Map((reads || []).map((r) => [r.chat_id, new Date(r.last_read_at).getTime()]));
  chatReads = readMap;

  const lastMsgPerChat = new Map();
  const unreadCountPerChat = new Map();
  msgs.forEach((m) => {
    if (!lastMsgPerChat.has(m.chat_id)) lastMsgPerChat.set(m.chat_id, m);
    const readAt = readMap.get(m.chat_id) || 0;
    const msgTime = new Date(m.created_at).getTime();
    if (m.sender_id !== currentUser.id && msgTime > readAt) {
      unreadCountPerChat.set(m.chat_id, (unreadCountPerChat.get(m.chat_id) || 0) + 1);
    }
  });

  chatLastMsg = new Map();
  const dmItems = []; const userIds = [];
  const channelItems = [];
  const customNameByChatId = new Map();
  const mutedByChatId = new Map();
  myChats.forEach((c) => {
    if (c.custom_name) customNameByChatId.set(c.chat_id, c.custom_name);
    mutedByChatId.set(c.chat_id, !!c.muted);
  });

  others.forEach((o) => {
    if (channelIds.has(o.chat_id)) return;
    const lastMsg = lastMsgPerChat.get(o.chat_id);
    const hiddenAt = hideMap.get(o.chat_id);
    const lastTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
    if (hiddenAt && hiddenAt > lastTime) return;
    dmItems.push({
      type: "dm",
      chat_id: o.chat_id, user_id: o.user_id, lastMsg, lastTime,
      unread: unreadCountPerChat.get(o.chat_id) || 0,
      customName: customNameByChatId.get(o.chat_id) || null,
      muted: mutedByChatId.get(o.chat_id) || false,
    });
    userIds.push(o.user_id);
  });

  channelIds.forEach((cid) => {
    const ch = channelCache.get(cid);
    const lastMsg = lastMsgPerChat.get(cid);
    const hiddenAt = hideMap.get(cid);
    const lastTime = lastMsg
      ? new Date(lastMsg.created_at).getTime()
      : (ch.created_at ? new Date(ch.created_at).getTime() : 0);
    if (hiddenAt && hiddenAt > lastTime) return;
    channelItems.push({
      type: "channel",
      chat_id: cid, channel: ch, lastMsg, lastTime,
      unread: unreadCountPerChat.get(cid) || 0,
      muted: mutedByChatId.get(cid) || false,
    });
  });

  if (!dmItems.length && !channelItems.length) {
    listEl.innerHTML = '<div class="empty">' + t("empty.noChats") + '</div>';
    chatIdByUser.clear(); return;
  }

  const uniqueUserIds = [...new Set(userIds)];
  let profilesData = [];
  if (uniqueUserIds.length) {
    const { data } = await supabase.from("profiles")
      .select("id, username, display_name, avatar_url, last_seen, gender, birthday, verified").in("id", uniqueUserIds);
    profilesData = data || [];
    profilesData.forEach((p) => profileCache.set(p.id, p));
  }
  const profileMap = new Map(profilesData.map((p) => [p.id, p]));

  chatIdByUser.clear();
  dmItems.forEach((it) => {
    chatIdByUser.set(it.user_id, it.chat_id);
    chatOtherUserCache.set(it.chat_id, it.user_id);
    const previewRaw = it.lastMsg
      ? previewTextForMsg(it.lastMsg, it.lastMsg.sender_id === currentUser.id)
      : "";
    const preview = previewRaw;
    chatLastMsg.set(it.chat_id, {
      text: preview, time: it.lastTime,
      senderId: it.lastMsg ? it.lastMsg.sender_id : null,
      msgId: it.lastMsg ? it.lastMsg.id : null,
      unread: it.unread,
    });
    // Асинхронно расшифровываем превью, если оно encrypted
    if (it.lastMsg && it.lastMsg.encrypted && it.lastMsg.message_type !== "attachment") {
      decryptChatPreview(it.lastMsg, it.user_id, it.chat_id);
    }
  });
  channelItems.forEach((it) => {
    let preview = "";
    if (it.lastMsg) {
      preview = previewTextForMsg(it.lastMsg, false);
    }
    chatLastMsg.set(it.chat_id, {
      text: preview, time: it.lastTime, senderId: null,
      msgId: it.lastMsg ? it.lastMsg.id : null,
      unread: it.unread,
    });
    // Расшифровываем превью канала (если E2EE разблокировано)
    if (it.lastMsg && it.lastMsg.encrypted && it.lastMsg.message_type !== "attachment") {
      decryptChatPreview(it.lastMsg, null, it.chat_id);
    }
  });

  const unified = [...dmItems, ...channelItems].sort((a, b) => b.lastTime - a.lastTime);
  renderChatListUnified(unified, profileMap);
  cachedProfilesForBirthday = profilesData || [];
  renderBirthdayBanner();
}

function renderChatItem(it, user) {
  const blocked = isBlockedByMe(user.id) ? " 🚫" : "";
  const name = it.customName || user.display_name;
  const time = it.lastTime ? formatChatTime(it.lastTime) : "";
  const preview = it.lastMsg
    ? previewTextForMsg(it.lastMsg, it.lastMsg.sender_id === currentUser.id)
    : t("preview.noMessages");
  const unreadHtml = it.unread > 0 ? `<span class="unread-badge">${it.unread}</span>` : "";
  return `
    <div class="user-item" data-user-id="${user.id}" data-chat-id="${it.chat_id}" data-custom-name="${it.customName ? escapeHtml(it.customName) : ""}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1">
          <div class="user-item-name">${escapeHtml(name)}${verifiedBadge(user)}${blocked}</div>
          <div class="user-item-time">${time}</div>
        </div>
        <div class="user-item-row2">
          <div class="user-item-preview ${it.unread > 0 ? "unread" : ""}">${renderPreviewHtml(preview)}</div>
          ${unreadHtml}
        </div>
      </div>
    </div>`;
}

function bindChatItemEvents(el, user) {
  const listEl = document.getElementById("users-list");
  el.addEventListener("click", () => {
    // Погашаем «фантомный» click сразу после long-press
    if (justLongPressed()) return;
    listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
    el.classList.add("active");
    openChatWith(user);
  });
  el.addEventListener("contextmenu", (ev) => { ev.preventDefault(); openChatListContextMenu(ev, user, el); });
  attachLongPress(el, (ev) => openChatListContextMenu(ev, user, el));
}

function renderChatListUnified(items, profileMap) {
  const listEl = document.getElementById("users-list");
  if (!items.length) { listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.noChatsShort")) + '</div>'; refreshWheelLayout(); return; }
  listEl.innerHTML = items.map((it) => {
    if (it.type === "channel") return renderChannelItemHtml(it);
    return renderDmItemHtml(it, profileMap);
  }).join("");

  listEl.querySelectorAll(".user-item").forEach((el) => {
    const chatType = el.dataset.chatType || "dm";
    if (chatType === "channel") {
      const ch = channelCache.get(el.dataset.chatId);
      if (!ch) return;
      paintAvatar(el.querySelector(".avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
      bindChannelItemEvents(el, ch);
    } else {
      const userId = el.dataset.userId;
      const user = profileMap.get(userId) || profileCache.get(userId);
      if (!user) return;
      const avEl = el.querySelector(".avatar");
      paintAvatar(avEl, user);
      if (avEl) avEl.classList.toggle("online", isUserOnline(user));
      bindChatItemEvents(el, user);
    }
  });
  refreshWheelLayout();
}

function renderDmItemHtml(it, profileMap) {
  const user = profileMap.get(it.user_id);
  if (!user) return "";
  const blocked = isBlockedByMe(user.id) ? " 🚫" : "";
  const name = it.customName || user.display_name;
  const time = it.lastTime ? formatChatTime(it.lastTime) : "";
  let preview = "";
  if (it.lastMsg) {
    preview = previewTextForMsg(it.lastMsg, it.lastMsg.sender_id === currentUser.id);
  } else {
    preview = t("preview.noMessages");
  }
  const isMuted = !!it.muted;
  const mutedMark = isMuted ? ' <span class="muted-mark" title="Без звука">🔇</span>' : "";
  const unreadHtml = it.unread > 0 ? `<span class="unread-badge${isMuted ? " muted" : ""}">${it.unread}</span>` : "";
  return `
    <div class="user-item" data-user-id="${user.id}" data-chat-id="${it.chat_id}" data-chat-type="dm" data-muted="${isMuted ? "1" : "0"}" data-custom-name="${it.customName ? escapeHtml(it.customName) : ""}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1">
          <div class="user-item-name">${escapeHtml(name)}${verifiedBadge(user)}${blocked}${mutedMark}</div>
          <div class="user-item-time">${time}</div>
        </div>
        <div class="user-item-row2">
          <div class="user-item-preview ${it.unread > 0 ? "unread" : ""}">${renderPreviewHtml(preview)}</div>
          ${unreadHtml}
        </div>
      </div>
    </div>`;
}

function renderChannelItemHtml(it) {
  const ch = it.channel;
  const time = it.lastTime ? formatChatTime(it.lastTime) : "";
  let preview = "";
  if (it.lastMsg) {
    preview = previewTextForMsg(it.lastMsg, false);
  } else {
    preview = t("preview.noMessages");
  }
  const isMuted = !!it.muted;
  const mutedMark = isMuted ? ' <span class="muted-mark" title="Без звука">🔇</span>' : "";
  const unreadHtml = it.unread > 0 ? `<span class="unread-badge${isMuted ? " muted" : ""}">${it.unread}</span>` : "";
  return `
    <div class="user-item" data-chat-id="${it.chat_id}" data-chat-type="channel" data-muted="${isMuted ? "1" : "0"}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1">
          <div class="user-item-name">${escapeHtml(ch.name)}${verifiedBadge(ch)}<span class="channel-mark">📢</span>${mutedMark}</div>
          <div class="user-item-time">${time}</div>
        </div>
        <div class="user-item-row2">
          <div class="user-item-preview ${it.unread > 0 ? "unread" : ""}">${renderPreviewHtml(preview)}</div>
          ${unreadHtml}
        </div>
      </div>
    </div>`;
}

function bindChannelItemEvents(el, channel) {
  el.addEventListener("click", () => {
    // Погашаем «фантомный» click сразу после long-press
    if (justLongPressed()) return;
    const listEl = document.getElementById("users-list");
    listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
    el.classList.add("active");
    openChannel(channel.id);
  });
  el.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    openChatListContextMenuForChannel(ev, channel);
  });
  attachLongPress(el, (ev) => openChatListContextMenuForChannel(ev, channel));
}

async function checkChannelAdmin(channelId, userId) {
  const ch = channelCache.get(channelId);
  if (ch && ch.owner_id === userId) return true;
  const { data } = await supabase.from("channel_admins")
    .select("user_id").eq("channel_id", channelId).eq("user_id", userId).maybeSingle();
  return !!data;
}

// Полностью пересчитывает права на канал и обновляет UI без перезагрузки.
// Вызывается: при realtime-изменениях channels/channel_admins/chat_members,
// а также сразу после RPC add/remove_channel_admin и transfer_channel_owner.
async function refreshChannelRights(channelId) {
  if (!channelId) return;
  // Если этот канал не открыт — обновим только кэш и карточку в списке.
  const isOpen = currentChannelObj && currentChannelObj.id === channelId;
  const { data: ch } = await supabase.from("channels").select("*").eq("id", channelId).maybeSingle();
  if (ch) channelCache.set(channelId, ch);

  // Обновляем карточку в списке чатов (имя, аватар)
  if (ch) {
    const el = document.querySelector(`.user-item[data-chat-id="${channelId}"][data-chat-type="channel"]`);
    if (el) {
      const nameEl = el.querySelector(".user-item-name");
      if (nameEl) nameEl.innerHTML = escapeHtml(ch.name) + verifiedBadge(ch) + '<span class="channel-mark">📢</span>';
      paintAvatar(el.querySelector(".avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
    }
  }

  if (!isOpen) return;

  // Обновляем шапку открытого канала
  if (ch) {
    Object.assign(currentChannelObj, ch);
    paintAvatar(document.getElementById("chat-avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
    document.getElementById("chat-title").innerHTML = escapeHtml(ch.name) + verifiedBadge(ch);
  }

  // Пересчёт прав
  currentChannelIsAdmin = await checkChannelAdmin(channelId, currentUser.id);
  const { data: mem } = await supabase.from("chat_members")
    .select("chat_id").eq("chat_id", channelId).eq("user_id", currentUser.id).maybeSingle();
  const wasSubscribed = currentChannelIsSubscribed;
  currentChannelIsSubscribed = !!mem;

  await updateChannelSubtitle(channelId);
  await updateChannelComposerState();
  configureChatMenuForChannel(currentChannelObj);

  // Если только что потеряли подписку — принудительно перезагружаем сообщения,
  // чтобы сразу показать заглушку
  if (wasSubscribed && !currentChannelIsSubscribed) {
    await loadMessages(channelId, openSeq);
    await loadReactionsForVisibleMessages();
  }

  // Обновляем открытый профиль канала
  if (channelProfileChannelId === channelId && ch) {
    paintAvatar(document.getElementById("channel-profile-avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
    document.getElementById("channel-profile-name").innerHTML = escapeHtml(ch.name) + verifiedBadge(ch);
    document.getElementById("channel-profile-username").textContent = "@" + (ch.username || "");
    const menuBtn = document.getElementById("channel-profile-menu-btn");
    menuBtn.classList.toggle("hidden", ch.owner_id !== currentUser.id);
  }

  // Если открыт редактор — перерисуем админов/владельца
  const editOverlay = document.getElementById("channel-edit-overlay");
  if (editOverlay && !editOverlay.classList.contains("hidden")) {
    await renderChannelEditAdmins();
  }
}

async function updateChannelSubtitle(chatId) {
  const { data, error } = await supabase.rpc("channel_subscribers_count", { p_chat_id: chatId });
  if (error) { console.error("subscribers_count:", error); return; }
  currentChannelSubscribers = Number(data) || 0;
  const el = document.getElementById("chat-subtitle");
  if (el && currentChannelObj && currentChannelObj.id === chatId) {
    const word = pluralRu(
      currentChannelSubscribers,
      t("channel.subsWord.one"),
      t("channel.subsWord.few"),
      t("channel.subsWord.many")
    );
    el.textContent = `${currentChannelSubscribers} ${word}`;
    el.classList.remove("online");
  }
}

async function updateChannelComposerState() {
  const composer = document.getElementById("composer");
  const actionBar = document.getElementById("channel-action-bar");
  const subBtn = document.getElementById("channel-subscribe-btn");
  if (!currentChannelObj) return;

  const isOwner = currentChannelObj.owner_id === currentUser.id;
  // Писать может только владелец ИЛИ подписанный админ.
  // Админ без подписки писать НЕ может.
  const canWrite = isOwner || (currentChannelIsSubscribed && currentChannelIsAdmin);

  if (canWrite) {
    composer.classList.remove("hidden");
    actionBar.classList.add("hidden");
    subBtn.disabled = false;
    return;
  }

  composer.classList.add("hidden");
  actionBar.classList.remove("hidden");
  subBtn.classList.remove("unsub");
  subBtn.disabled = false;

  if (currentChannelIsSubscribed) {
    subBtn.textContent = t("channel.action.unsubscribe");
    subBtn.classList.add("unsub");
    return;
  }

  const vis = currentChannelObj.visibility || "public";
  if (vis === "request") {
    if (currentChannelRequestRejected) {
      subBtn.textContent = t("channel.action.requestRejected");
      subBtn.disabled = true;
      subBtn.classList.remove("unsub");
    } else if (currentChannelHasRequest) {
      // 🔴 Пока заявка висит — кнопка «Отозвать заявку», а не «Заявка отправлена».
      subBtn.textContent = t("channel.action.requestCancel");
      subBtn.disabled = false;
      subBtn.classList.add("unsub");
    } else {
      subBtn.textContent = t("channel.action.request");
      subBtn.classList.remove("unsub");
    }
  } else if (vis === "private") {
    subBtn.textContent = t("channel.action.private");
    subBtn.disabled = true;
  } else {
    subBtn.textContent = t("channel.action.subscribe");
  }
}

async function openChannel(chatId) {
  const mySeq = ++openSeq;
  // Сохраняем черновик предыдущего чата, если это был DM
  if (currentChatId) saveDraftFor(currentChatId);
  decryptedCache.clear();
  revokeDecryptedFiles();
  // СРАЗУ скрываем composer синхронно, до любых await — иначе мелькнёт
  document.getElementById("composer").classList.add("hidden");
  document.getElementById("channel-action-bar").classList.add("hidden");

  // Чистим поле поиска и крестик — чтобы поиск не оставался активным
  const _sInput = document.getElementById("search-input");
  const _sClear = document.getElementById("search-clear");
  if (_sInput && _sInput.value.trim()) _sInput.value = "";
  if (_sClear) _sClear.classList.add("hidden");

  const { data: ch } = await supabase.from("channels").select("*").eq("id", chatId).maybeSingle();
  if (mySeq !== openSeq) return;
  if (!ch) { await showAlertDialog(t("auth.err.prefix"), t("channel.err.notFound")); return; }
  channelCache.set(chatId, ch);
  currentChannelObj = ch;
  currentOtherUser = null; pendingOtherUser = null;
  currentChannelViewsMap = new Map();
  currentChannelTotalViews = 0;
  closeChatSearch();
  resetPinsUI();
  const sbBtn = document.getElementById("scroll-bottom-btn");
  if (sbBtn) sbBtn.classList.remove("visible");

  exitSelectionMode(); cancelReply(); cancelEdit(); closeReactionPicker();
  document.getElementById("composer").classList.add("hidden");
  document.getElementById("channel-action-bar").classList.add("hidden");

  paintAvatar(document.getElementById("chat-avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
  document.getElementById("chat-title").innerHTML = escapeHtml(ch.name) + verifiedBadge(ch);
  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-content").classList.remove("hidden");
  document.getElementById("chat-menu").classList.add("hidden");

  // Подписан ли я? + админ ли я? — параллельно
  const [memRes, isAdmin] = await Promise.all([
    supabase.from("chat_members").select("chat_id").eq("chat_id", ch.id).eq("user_id", currentUser.id).maybeSingle(),
    checkChannelAdmin(ch.id, currentUser.id),
  ]);
  if (mySeq !== openSeq) return;
  currentChannelIsSubscribed = !!memRes.data;
  currentChannelIsAdmin = !!isAdmin;

  // Проверим, есть ли у нас активная заявка на этот канал
  currentChannelHasRequest = false;
  currentChannelRequestRejected = false;
  currentChannelRequestId = null;
  if (ch.visibility === "request" && !currentChannelIsSubscribed && !currentChannelIsAdmin) {
    const { data: req } = await supabase.from("channel_join_requests")
      .select("id").eq("chat_id", ch.id).eq("user_id", currentUser.id).maybeSingle();
    if (mySeq !== openSeq) return;
    currentChannelHasRequest = !!req;
    currentChannelRequestId = req ? req.id : null;
  }

  // Подписки realtime — как можно раньше
  subscribeToChannelViews(chatId);
  subscribeToChat(chatId);
  subscribeToReactions();

  // Параллельно: подзаголовок, состояние composer, меню
  await Promise.all([
    updateChannelSubtitle(ch.id),
    updateChannelComposerState(),
  ]).catch(() => {});
  configureChatMenuForChannel(ch);
  if (mySeq !== openSeq) return;

  currentChatId = chatId;
  restoreDraftFor(chatId);
  enterMobileChat();
  highlightChatInList(chatId);
  notifySwActiveChat(chatId);

  // Фаза 4: если я владелец/админ и E2EE разблокирована —
  // синхронизируем ключ канала (создание, раздача подписчикам).
  syncChannelKeys(chatId).catch((e) => console.warn("syncChannelKeys:", e));

  await loadMessages(chatId, mySeq);
  if (mySeq !== openSeq) return;
  await loadReactionsForVisibleMessages();
  if (mySeq !== openSeq) return;

  if (currentChannelIsSubscribed) await markChatRead(chatId);

  setWheelSelected(chatId);
  buildChatTimeline();
}

function updateChatItemPreview(chatId) {
  const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`); if (!el) return;
  const data = chatLastMsg.get(chatId); if (!data) return;
  const isChannel = el.dataset.chatType === "channel";
  const previewEl = el.querySelector(".user-item-preview");
  const timeEl = el.querySelector(".user-item-time");
  let preview = stripMarkdown(data.text) || t("preview.noMessages");
  const isSpecialPreview = preview.startsWith("🧩") || preview.startsWith("🎁") || preview.startsWith("📷") || preview.startsWith("🎥") || preview.startsWith("📎");
  if (!isChannel && preview && !isSpecialPreview && data.senderId === currentUser.id) {
    preview = t("preview.you") + preview;
  }
  if (previewEl) { previewEl.innerHTML = renderPreviewHtml(preview); previewEl.classList.toggle("unread", data.unread > 0); }
  if (timeEl) timeEl.textContent = data.time ? formatChatTime(data.time) : "";
  const row2 = el.querySelector(".user-item-row2");
  if (row2) {
    let badge = row2.querySelector(".unread-badge");
    const isMuted = el.dataset.muted === "1";
    if (data.unread > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "unread-badge";
        row2.appendChild(badge);
      }
      badge.textContent = String(data.unread);
      badge.classList.toggle("muted", isMuted);
    } else if (badge) badge.remove();
  }
  updateUnreadTitle();
}

// Обновляет document.title: «(N) Imaginer» при непрочитанных, иначе «Imaginer»
function updateUnreadTitle() {
  let total = 0;
  chatLastMsg.forEach((data) => { if (data && data.unread > 0) total += data.unread; });
  if (total > 0) document.title = `(${total}) Cell`;
  else document.title = "Cell";
}

function resortChatsList() {
  const listEl = document.getElementById("users-list");
  const items = [...listEl.querySelectorAll(".user-item")];
  if (!items.length) return;
  items.sort((a, b) => {
    const aChat = a.dataset.chatId, bChat = b.dataset.chatId;
    const at = (chatLastMsg.get(aChat) || {}).time || 0;
    const bt = (chatLastMsg.get(bChat) || {}).time || 0;
    return bt - at;
  });
  items.forEach((it) => listEl.appendChild(it));
  refreshWheelLayout();
}

// Прокручивает список к самому верху и подсвечивает чат, в который
// только что пришло/ушло сообщение. Нужно, чтобы после отправки
// современный список «пружинил» наверх и активный чат был виден.
function bringChatToTop(chatId) {
  if (!chatId) return;
  const listEl = document.getElementById("users-list");
  if (!listEl) return;
  // Чат уже встал наверх после resortChatsList — просто скроллим.
  listEl.scrollTo({ top: 0, behavior: "smooth" });
  wheelSelectedChatId = chatId;
  if (scrollMode === "wheel") {
    // Снимем подсветку с других и поставим на наш.
    listEl.querySelectorAll(".user-item").forEach((el) => {
      el.classList.toggle("wheel-active", el.dataset.chatId === chatId);
    });
  }
}

async function addOrUpdateChatInList(chatId, otherUserId) {
  if (document.getElementById("search-input").value.trim()) return;
  // Защита: не добавляем канал как DM
  if (channelCache.has(chatId)) return;
  // Дополнительная проверка — вдруг это канал, но кэш не успел обновиться
  const { data: chCheck } = await supabase.from("channels").select("id").eq("id", chatId).maybeSingle();
  if (chCheck) return;
  if (document.querySelector(`.user-item[data-chat-id="${chatId}"]`)) return;
  if (pendingChatAdds.has(chatId)) return;
  pendingChatAdds.add(chatId);

  try {
    const { data: profile } = await supabase.from("profiles")
      .select("id, username, display_name, avatar_url, last_seen, gender, birthday, verified")
      .eq("id", otherUserId).single();
    if (!profile) return;

    // Ещё раз проверяем — пока грузили профиль, могли уже добавить
    if (document.querySelector(`.user-item[data-chat-id="${chatId}"]`)) return;

    profileCache.set(profile.id, profile);
    chatIdByUser.set(otherUserId, chatId);
    chatOtherUserCache.set(chatId, otherUserId);

    const { data: myMembership } = await supabase.from("chat_members")
      .select("custom_name, muted").eq("chat_id", chatId).eq("user_id", currentUser.id).maybeSingle();
    const customName = myMembership ? myMembership.custom_name : null;
    const isMuted = !!(myMembership && myMembership.muted);

    // Если realtime уже успел получить первое сообщение (subscribeToGlobalMessages
    // кладёт сюда превью и unread), НЕ затираем его, а используем.
    const existingPreview = chatLastMsg.get(chatId);
    const fallbackPreview = { text: "", time: Date.now(), senderId: null, msgId: null, unread: 0 };
    if (!existingPreview) chatLastMsg.set(chatId, fallbackPreview);
    const previewData = existingPreview || fallbackPreview;

    const item = {
      chat_id: chatId,
      user_id: otherUserId,
      lastMsg: null,
      lastTime: previewData.time,
      unread: previewData.unread,
      customName,
      muted: isMuted,
    };

    const listEl = document.getElementById("users-list");
    const empty = listEl.querySelector(".empty");
    if (empty) empty.remove();

    const temp = document.createElement("div");
    temp.innerHTML = renderChatItem(item, profile);
    const itemEl = temp.firstElementChild;
    paintAvatar(itemEl.querySelector(".avatar"), profile);
    bindChatItemEvents(itemEl, profile);
    listEl.insertBefore(itemEl, listEl.firstChild);

    // Сразу подтягиваем превью/бейдж из chatLastMsg — там уже может лежать
    // первое входящее сообщение с unread.
    if (existingPreview) updateChatItemPreview(chatId);

    refreshWheelLayout();
  } finally {
    pendingChatAdds.delete(chatId);
  }
}

async function addOrUpdateChannelInList(chatId, channel) {
  if (document.getElementById("search-input").value.trim()) return;
  // Универсальная проверка: и channel, и channel-search
  if (document.querySelector(`.user-item[data-chat-id="${chatId}"]`)) return;

  if (!channel) {
    const { data } = await supabase.from("channels").select("*").eq("id", chatId).maybeSingle();
    if (!data) return;
    channel = data;
  }
  channelCache.set(chatId, channel);

  const listEl = document.getElementById("users-list");
  const empty = listEl.querySelector(".empty");
  if (empty) empty.remove();

  const lastTime = channel.created_at ? new Date(channel.created_at).getTime() : Date.now();
  const item = {
    type: "channel",
    chat_id: chatId,
    channel,
    lastMsg: null,
    lastTime,
    unread: 0,
  };
  chatLastMsg.set(chatId, { text: "", time: lastTime, senderId: null, unread: 0 });

  const temp = document.createElement("div");
  temp.innerHTML = renderChannelItemHtml(item);
  const itemEl = temp.firstElementChild;
  paintAvatar(itemEl.querySelector(".avatar"), { id: channel.id, display_name: channel.name, avatar_url: channel.avatar_url });
  bindChannelItemEvents(itemEl, channel);
  listEl.insertBefore(itemEl, listEl.firstChild);
  refreshWheelLayout();
}

function removeChatFromList(chatId) {
  const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
  if (el) el.remove();
  chatLastMsg.delete(chatId);
  for (const [uid, cid] of chatIdByUser.entries()) if (cid === chatId) chatIdByUser.delete(uid);
  const listEl = document.getElementById("users-list");
  if (listEl.querySelectorAll(".user-item").length === 0) listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.noChatsShort")) + '</div>';
  refreshWheelLayout();
}

// ============ БЫСТРАЯ РЕАКЦИЯ (двойной тап по сообщению) ============
const QUICK_REACTION_KEY = "cell_quick_reaction";
const QUICK_REACTION_DEFAULT = "❤️";

function getSavedQuickReaction() {
  try {
    return localStorage.getItem(QUICK_REACTION_KEY) || QUICK_REACTION_DEFAULT;
  } catch (e) { return QUICK_REACTION_DEFAULT; }
}

// Возвращает эмодзи для двойного тапа по конкретному сообщению.
// — Сначала сохранённая настройка.
// — Если её нет в доступных реакциях этого чата (например, убрали в канале) — ❤️.
// — Если и ❤️ нет — первая доступная.
function getQuickReactionFor(msgId) {
  const msg = msgCache.get(msgId);
  let available = REACTION_EMOJIS;
  if (msg && msg.chat_id && channelCache.has(msg.chat_id)) {
    const ch = channelCache.get(msg.chat_id);
    if (Array.isArray(ch.available_reactions) && ch.available_reactions.length) {
      available = ch.available_reactions;
    }
  }
  const saved = getSavedQuickReaction();
  if (available.includes(saved)) return saved;
  if (available.includes(QUICK_REACTION_DEFAULT)) return QUICK_REACTION_DEFAULT;
  return available[0];
}

function onMessageDoubleTap(e, msgId) {
  // Игнорируем клики по вложенным интерактивным элементам
  if (e.target.closest("a, .reaction-chip, .spoiler, .msg-reply, .msg-fwd-link, .msg-attachment-file")) return;
  const emoji = getQuickReactionFor(msgId);
  if (!emoji) return;
  toggleReaction(msgId, emoji);
}

// Вешает детектор двойного тапа/клика
function attachDoubleTap(el, handler) {
  let lastTapAt = 0;
  let lastX = 0, lastY = 0;

  el.addEventListener("touchend", (e) => {
    if (e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const now = Date.now();
    const dx = Math.abs(t.clientX - lastX);
    const dy = Math.abs(t.clientY - lastY);
    if (now - lastTapAt < 320 && dx < 30 && dy < 30) {
      lastTapAt = 0;
      handler(e);
    } else {
      lastTapAt = now;
      lastX = t.clientX;
      lastY = t.clientY;
    }
  }, { passive: true });

  el.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler(e);
  });
}

// ============ АДАПТАЦИЯ РЕЖИМА СПИСКА К РАЗМЕРУ ЭКРАНА ============
// Если экран стал мобильным — принудительно classic.
// Если пользователь крутил настройку на десктопе и вернулся — восстановим.
(function setupScrollModeWatcher() {
  const mq = window.matchMedia("(max-width: 768px) and (pointer: coarse)");
  const apply = () => {
    if (mq.matches) {
      // Мобильный — всегда classic
      if (scrollMode !== "classic") {
        scrollMode = "classic";
        document.documentElement.dataset.scrollMode = "classic";
        if (typeof applyScrollMode === "function") applyScrollMode();
      }
    } else {
      // Десктоп — восстанавливаем сохранённый режим
      let saved = "classic";
      try { saved = localStorage.getItem(SCROLL_MODE_KEY) || "classic"; } catch (e) {}
      if (saved !== "classic" && saved !== "wheel") saved = "classic";
      if (scrollMode !== saved) {
        scrollMode = saved;
        document.documentElement.dataset.scrollMode = saved;
        if (typeof applyScrollMode === "function") applyScrollMode();
      }
    }
  };
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else if (mq.addListener) mq.addListener(apply);
})();

// ============ ДЕЛЕГИРОВАННЫЕ ОБРАБОТЧИКИ СООБЩЕНИЙ ============
// Все ПКМ/long-press/dblclick ловим на контейнере #messages,
// а не на каждом сообщении. Это разгружает DOM в разы.
function setupMessagesDelegates() {
  const box = document.getElementById("messages");
  if (!box || box.__delegatesBound) return;
  box.__delegatesBound = true;

  let longPressTimer = null;
  let lpStartX = 0, lpStartY = 0;
  let lpTriggered = false;
  let lastTapAt = 0;
  let lastTapEl = null;

  box.addEventListener("touchstart", (e) => {
    const el = e.target.closest(".msg, .msg-system");
    if (!el) return;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    lpStartX = t.clientX; lpStartY = t.clientY;
    lpTriggered = false;
    longPressTimer = setTimeout(() => {
      lpTriggered = true;
      lastLongPressAt = Date.now();
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (ex) {}
      const fake = {
        clientX: lpStartX, clientY: lpStartY, target: el,
        preventDefault: () => {}, stopPropagation: () => {},
      };
      openMsgContextMenu(fake, el.dataset.id);
    }, 500);
  }, { passive: true });

  box.addEventListener("touchmove", (e) => {
    if (!longPressTimer) return;
    const t = e.touches[0];
    if (!t) return;
    if (Math.abs(t.clientX - lpStartX) > 10 || Math.abs(t.clientY - lpStartY) > 10) {
      clearTimeout(longPressTimer); longPressTimer = null;
    }
  }, { passive: true });

  box.addEventListener("touchend", (e) => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (lpTriggered) {
      e.preventDefault();
      lpTriggered = false;
      return;
    }
    const el = e.target.closest(".msg");
    if (!el) return;
    if (e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const now = Date.now();
    if (now - lastTapAt < 320 && lastTapEl === el &&
        Math.abs(t.clientX - lpStartX) < 40) {
      lastTapAt = 0; lastTapEl = null;
      if (e.target.closest("a, .reaction-chip, .spoiler, .msg-reply, .msg-fwd-link, .msg-attachment-file")) return;
      const emoji = getQuickReactionFor(el.dataset.id);
      if (emoji) toggleReaction(el.dataset.id, emoji);
    } else {
      lastTapAt = now; lastTapEl = el;
    }
  }, { passive: false });

  box.addEventListener("contextmenu", (e) => {
    const el = e.target.closest(".msg, .msg-system");
    if (!el) return;
    e.preventDefault();
    openMsgContextMenu(e, el.dataset.id);
  });

  box.addEventListener("dblclick", (e) => {
    const el = e.target.closest(".msg");
    if (!el) return;
    if (e.target.closest("a, .reaction-chip, .spoiler, .msg-reply, .msg-fwd-link, .msg-attachment-file")) return;
    e.preventDefault();
    const emoji = getQuickReactionFor(el.dataset.id);
    if (emoji) toggleReaction(el.dataset.id, emoji);
  });
}

// ============ LONG-PRESS (для тач-устройств) ============
// Удержание пальца ~0.5с → вызываем ту же логику, что и ПКМ.
// Если палец сдвинулся больше чем на 10px — отменяем (это скролл).
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;

// Глобальный timestamp последнего long-press — click-обработчики
// проверяют его, чтобы не сработать «фантомным» кликом сразу после
// отпускания пальца.
let lastLongPressAt = 0;

// 🔴 Флаг: сейчас на экране активен тач (палец не отпущен).
// Нужен, чтобы блокировать pointer-events у открытых меню, пока
// пользователь не отпустит палец. На ПК (мышь) флаг всегда false —
// поэтому ПКМ работает мгновенно, без задержек.
let isTouchActive = false;
document.addEventListener("touchstart", () => { isTouchActive = true; }, true);
document.addEventListener("touchend", () => { isTouchActive = false; }, true);
document.addEventListener("touchcancel", () => { isTouchActive = false; }, true);

// Блокирует взаимодействие с элементом, пока палец не отпущен.
// На мыши (ПКМ) — ничего не делает, всё работает сразу.
function blockUntilTouchRelease(el) {
  if (!el || !isTouchActive) return;
  el.style.pointerEvents = "none";
  const release = () => {
    el.style.pointerEvents = "";
    document.removeEventListener("touchend", release, true);
    document.removeEventListener("touchcancel", release, true);
  };
  document.addEventListener("touchend", release, true);
  document.addEventListener("touchcancel", release, true);
}

function attachLongPress(el, handler) {
  let timer = null;
  let startX = 0, startY = 0;
  let triggered = false;

  el.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    triggered = false;
    timer = setTimeout(() => {
      triggered = true;
      lastLongPressAt = Date.now();
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (ex) {}
      const fake = {
        clientX: startX,
        clientY: startY,
        target: el,
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      handler(fake);
    }, LONG_PRESS_MS);
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
    if (!timer) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - startX);
    const dy = Math.abs(t.clientY - startY);
    if (dx > LONG_PRESS_MOVE_TOLERANCE || dy > LONG_PRESS_MOVE_TOLERANCE) {
      clearTimeout(timer);
      timer = null;
    }
  }, { passive: true });

  el.addEventListener("touchend", (e) => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (triggered) {
      e.preventDefault();
      e.stopPropagation();
      triggered = false;
    }
  });

  el.addEventListener("touchcancel", () => {
    if (timer) { clearTimeout(timer); timer = null; }
    triggered = false;
  });
}

// Хелпер: true, если только что был long-press (в течение 600 мс).
// Click-обработчики проверяют его, чтобы не сработать «фантомным» кликом
// сразу после отпускания пальца.
function justLongPressed() {
  return (Date.now() - lastLongPressAt) < 600;
}

function setupMobileBackButton() {
  const btn = document.getElementById("mobile-back-btn");
  if (!btn) return;
  btn.onclick = () => {
    exitMobileChat();
  };
}

// ============ Меню сайдбара (бургер) ============
function setupSidebarMenu() {
  const btn = document.getElementById("sidebar-menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const drawer = document.getElementById("sidebar-menu-drawer");
  if (!btn || !sidebar || !drawer) return;

  // ✅ onclick (а не addEventListener) — при повторном вызове
  // setupSidebarMenu старый обработчик заменяется, а не наслаивается.
  btn.onclick = (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("menu-open");
  };

  // Закрытие при клике по любому пункту drawer'а — через флаг на самом элементе,
  // чтобы повторный setup не навесил второй такой же обработчик.
  if (!drawer.__closeBound) {
    drawer.__closeBound = true;
    drawer.addEventListener("click", (e) => {
      if (e.target.closest("button")) {
        sidebar.classList.remove("menu-open");
      }
    });
  }
}

// ======================= 11. ПОИСК =======================
function setupSearch() {
  const input = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");

  input.addEventListener("input", () => {
    const hasText = input.value.trim().length > 0;
    clearBtn.classList.toggle("hidden", !hasText);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(input.value.trim()), 250);
  });

  clearBtn.addEventListener("click", async () => {
    input.value = "";
    clearBtn.classList.add("hidden");
    input.focus();
    await loadRecentChats();
  });
}

let searchReqId = 0;

async function performSearch(query) {
  const listEl = document.getElementById("users-list");
  const titleEl = document.getElementById("section-title");
  const clearBtn = document.getElementById("search-clear");
  if (clearBtn) clearBtn.classList.toggle("hidden", !query);
  if (!query) { await loadRecentChats(); return; }
  titleEl.textContent = t("sidebar.section.search");
  const clean = query.replace(/^@+/, "").trim().toLowerCase();
  if (!clean) { listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.search.start")) + '</div>'; return; }
  listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.searching")) + '</div>';
  const reqId = ++searchReqId;

  const [profilesRes, customRes, channelsRes] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url, last_seen, gender, birthday, verified")
      .neq("id", currentUser.id).or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`).limit(20),
    supabase.from("chat_members").select("chat_id, custom_name").eq("user_id", currentUser.id).ilike("custom_name", `%${clean}%`),
    supabase.from("channels").select("*")
      .or(`username.ilike.%${clean}%,name.ilike.%${clean}%`).limit(20),
  ]);

  if (reqId !== searchReqId) return;

  const resultIds = new Set((profilesRes.data || []).map((p) => p.id));
  const customNameByUserId = new Map();
  const customChatIds = (customRes.data || []).map((c) => c.chat_id);
  if (customChatIds.length) {
    const { data: others } = await supabase.from("chat_members")
      .select("chat_id, user_id").in("chat_id", customChatIds).neq("user_id", currentUser.id);
    const customMap = new Map((customRes.data || []).map((c) => [c.chat_id, c.custom_name]));
    (others || []).forEach((o) => {
      resultIds.add(o.user_id);
      customNameByUserId.set(o.user_id, customMap.get(o.chat_id));
    });
  }

  let channels = channelsRes.data || [];
  // Приватные каналы не показываем в поиске (только по ссылке-приглашению),
  // кроме случая, когда текущий пользователь — владелец канала.
  channels = channels.filter((c) =>
    (c.visibility || "public") !== "private" || c.owner_id === currentUser.id
  );
  if (!resultIds.size && !channels.length) {
    listEl.innerHTML = `<div class="empty">${escapeHtml(tFmt("empty.search.notFound", { query }))}</div>`;
    return;
  }

  let allProfiles = [];
  if (resultIds.size) {
    const { data } = await supabase.from("profiles")
      .select("id, username, display_name, avatar_url, last_seen, gender, birthday, verified").in("id", [...resultIds]);
    allProfiles = data || [];
    allProfiles.forEach((p) => profileCache.set(p.id, p));
  }

  const { data: myMemberships } = await supabase.from("chat_members")
    .select("chat_id, custom_name").eq("user_id", currentUser.id).not("custom_name", "is", null);
  const customByChatId = new Map((myMemberships || []).map((m) => [m.chat_id, m.custom_name]));
  if (customByChatId.size) {
    const chatIds = [...customByChatId.keys()];
    const { data: othersInChats } = await supabase.from("chat_members")
      .select("chat_id, user_id").in("chat_id", chatIds).neq("user_id", currentUser.id);
    (othersInChats || []).forEach((o) => {
      if (resultIds.has(o.user_id)) {
        const cname = customByChatId.get(o.chat_id);
        if (cname) customNameByUserId.set(o.user_id, cname);
      }
    });
  }

  allProfiles.forEach((p) => { p._customName = customNameByUserId.get(p.id) || null; });

  // Реально вычисляем «моё» по БД, а не по кэшу:
  // — какие каналы я действительно вижу (chat_id ∈ мои chat_members и есть в channels);
  // — с кем у меня есть DM-чат (общий chat_id, который не канал).
  const { data: myMembershipsAll } = await supabase.from("chat_members")
    .select("chat_id").eq("user_id", currentUser.id);
  const myChatIdSet = new Set((myMembershipsAll || []).map((m) => m.chat_id));

  let myChannelIds = new Set();
  if (myChatIdSet.size) {
    const { data: myChans } = await supabase.from("channels")
      .select("id").in("id", [...myChatIdSet]);
    myChannelIds = new Set((myChans || []).map((c) => c.id));
  }

  const myDmChatIds = [...myChatIdSet].filter((id) => !myChannelIds.has(id));
  const dmPartnerIds = new Set();
  if (myDmChatIds.length) {
    const { data: partners } = await supabase.from("chat_members")
      .select("user_id").in("chat_id", myDmChatIds).neq("user_id", currentUser.id);
    (partners || []).forEach((p) => dmPartnerIds.add(p.user_id));
  }

  renderSearchResultsUnified(allProfiles, channels, myChannelIds, dmPartnerIds);
}

// Строка результата: канал
function renderSearchChannelHtml(ch) {
  return `
    <div class="user-item" data-chat-type="channel-search" data-channel-id="${ch.id}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1"><div class="user-item-name">${escapeHtml(ch.name)}${verifiedBadge(ch)}<span class="channel-mark">📢</span></div></div>
        <div class="user-item-row2"><div class="user-item-preview">@${escapeHtml(ch.username)}</div></div>
      </div>
    </div>`;
}

// Строка результата: пользователь
function renderSearchUserHtml(u) {
  const blocked = isBlockedByMe(u.id) ? " 🚫" : "";
  const displayName = u._customName
    ? `${escapeHtml(u._customName)} <span style="color:var(--text-dim);font-size:12px;">(${escapeHtml(u.display_name)})</span>`
    : escapeHtml(u.display_name);
  return `
    <div class="user-item" data-user-id="${u.id}" data-custom-name="${u._customName ? escapeHtml(u._customName) : ""}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1"><div class="user-item-name">${displayName}${verifiedBadge(u)}${blocked}</div></div>
        <div class="user-item-row2"><div class="user-item-preview">@${escapeHtml(u.username)}</div></div>
      </div>
    </div>`;
}

function renderSearchResultsUnified(users, channels, myChannelIds, dmPartnerIds) {
  const listEl = document.getElementById("users-list");
  myChannelIds = myChannelIds || new Set();
  dmPartnerIds = dmPartnerIds || new Set();

  // Разделяем результаты по РЕАЛЬНОЙ принадлежности:
  const myUsers    = users.filter((u) => dmPartnerIds.has(u.id));
  const myChannels = channels.filter((c) => myChannelIds.has(c.id));
  const newUsers   = users.filter((u) => !dmPartnerIds.has(u.id));
  const newChannels = channels.filter((c) => !myChannelIds.has(c.id));

  // Топ-5 из новых: сначала каналы (поиск по @username/названию), потом юзеры.
  // Ограничим ровно пятью строками.
  const topNew = [
    ...newChannels.slice(0, 5),
    ...newUsers.slice(0, 5),
  ].slice(0, 5);

  // "Ваши чаты и каналы": только то, что уже есть в списке
  const myList = [
    ...myChannels.map((c) => ({ kind: "channel", data: c })),
    ...myUsers.map((u) => ({ kind: "user", data: u })),
  ];

  if (!topNew.length && !myList.length) {
    listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.search.empty")) + '</div>';
    return;
  }

  let html = "";

  if (topNew.length) {
    html += `<div class="search-section-title">${escapeHtml(t("sidebar.search.found"))}</div>`;
    html += topNew.map((item) => {
      if (item && item.username && item.owner_id) return renderSearchChannelHtml(item);
      return renderSearchUserHtml(item);
    }).join("");
  }

  if (myList.length) {
    html += `<div class="search-section-title">${escapeHtml(t("sidebar.search.mine"))}</div>`;
    html += myList.map((item) => {
      if (item.kind === "channel") return renderSearchChannelHtml(item.data);
      return renderSearchUserHtml(item.data);
    }).join("");
  }

  listEl.innerHTML = html;

  // Навешиваем обработчики
  listEl.querySelectorAll(".user-item").forEach((el) => {
    if (el.dataset.chatType === "channel-search") {
      const ch = channels.find((x) => x.id === el.dataset.channelId);
      if (!ch) return;
      paintAvatar(el.querySelector(".avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
      el.addEventListener("click", async () => {
        listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
        el.classList.add("active");
        await joinAndOpenChannel(ch);
      });
    } else {
      const userId = el.dataset.userId;
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      paintAvatar(el.querySelector(".avatar"), user);
      el.addEventListener("click", () => {
        listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
        el.classList.add("active");
        openChatWith(user);
      });
    }
  });
}

// ======================= 12. ПКМ НА ЧАТ =======================
function openChatListContextMenu(ev, user, el) {
  contextChatUser = user;
  contextChatCustomName = el.dataset.customName || null;
  contextChannelForMenu = null;
  const menu = document.getElementById("chat-list-context-menu");
  ["profile", "rename", "mute", "clear", "delete", "block"].forEach((a) => {
    const b = menu.querySelector(`button[data-action="${a}"]`);
    if (b) b.classList.remove("hidden");
  });
  ["channel-profile", "channel-unsubscribe"].forEach((a) => {
    const b = menu.querySelector(`button[data-action="${a}"]`);
    if (b) b.classList.add("hidden");
  });
  const blockBtn = menu.querySelector('button[data-action="block"]');
  blockBtn.textContent = isBlockedByMe(user.id) ? t("ctx.chat.unblock") : t("ctx.chat.block");
  // Кнопка mute — текст по текущему состоянию
  const isMuted = el.dataset.muted === "1";
  const muteBtn = menu.querySelector('button[data-action="mute"]');
  if (muteBtn) muteBtn.textContent = isMuted ? t("ctx.chat.unmute") : t("ctx.chat.mute");
  menu.classList.remove("hidden");
  menu.style.left = "0px"; menu.style.top = "0px";
  const rect = menu.getBoundingClientRect();
  let x = ev.clientX, y = ev.clientY;
  if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
  if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
  menu.style.left = x + "px"; menu.style.top = y + "px";
  blockUntilTouchRelease(menu);
}

function openChatListContextMenuForChannel(ev, channel) {
  contextChannelForMenu = channel;
  contextChatUser = null;
  contextChatCustomName = null;
  const menu = document.getElementById("chat-list-context-menu");
  ["profile", "rename", "clear", "delete", "block"].forEach((a) => {
    const b = menu.querySelector(`button[data-action="${a}"]`);
    if (b) b.classList.add("hidden");
  });
  ["channel-profile", "channel-unsubscribe", "mute"].forEach((a) => {
    const b = menu.querySelector(`button[data-action="${a}"]`);
    if (b) b.classList.remove("hidden");
  });
  // Текст кнопки mute по состоянию чата
  const chatEl = document.querySelector(`.user-item[data-chat-id="${channel.id}"]`);
  const isMuted = chatEl && chatEl.dataset.muted === "1";
  const muteBtn = menu.querySelector('button[data-action="mute"]');
  if (muteBtn) muteBtn.textContent = isMuted ? t("ctx.chat.unmute") : t("ctx.chat.mute");
  menu.classList.remove("hidden");
  menu.style.left = "0px"; menu.style.top = "0px";
  const rect = menu.getBoundingClientRect();
  let x = ev.clientX, y = ev.clientY;
  if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
  if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
  menu.style.left = x + "px"; menu.style.top = y + "px";
  blockUntilTouchRelease(menu);
}

document.addEventListener("pointerdown", (e) => {
  const m = document.getElementById("chat-list-context-menu");
  if (!m || m.classList.contains("hidden")) return;
  if (m.contains(e.target)) return;
  if (justLongPressed()) return;
  m.classList.add("hidden");
  e.preventDefault();
  e.stopPropagation();
}, true);

document.getElementById("chat-list-context-menu").addEventListener("click", async (e) => {
  const btn = e.target.closest("button"); if (!btn) return;
  e.stopPropagation();
  const action = btn.dataset.action;
  document.getElementById("chat-list-context-menu").classList.add("hidden");

  // Отключить/включить звук — работает и для DM, и для каналов.
  if (action === "mute") {
    let chatId = null;
    let itemEl = null;
    if (contextChatUser) {
      chatId = chatIdByUser.get(contextChatUser.id);
      itemEl = document.querySelector(`.user-item[data-user-id="${contextChatUser.id}"]`);
    } else if (contextChannelForMenu) {
      chatId = contextChannelForMenu.id;
      itemEl = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
    }
    if (!chatId) return;
    const isMutedNow = itemEl && itemEl.dataset.muted === "1";
    const newMuted = !isMutedNow;

    const { error } = await supabase.from("chat_members")
      .update({ muted: newMuted })
      .eq("chat_id", chatId).eq("user_id", currentUser.id);
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }

    if (itemEl) {
      itemEl.dataset.muted = newMuted ? "1" : "0";
      // Значок 🔇 рядом с именем
      const nameEl = itemEl.querySelector(".user-item-name");
      if (nameEl) {
        const oldMark = nameEl.querySelector(".muted-mark");
        if (newMuted && !oldMark) {
          const mark = document.createElement("span");
          mark.className = "muted-mark";
          mark.title = "Без звука";
          mark.textContent = "🔇";
          nameEl.appendChild(document.createTextNode(" "));
          nameEl.appendChild(mark);
        } else if (!newMuted && oldMark) {
          // Убираем маркер и лишний пробел перед ним
          const prev = oldMark.previousSibling;
          if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent.trim() === "") {
            prev.remove();
          }
          oldMark.remove();
        }
      }
      // Бейдж непрочитанных — перекрасить
      const badge = itemEl.querySelector(".unread-badge");
      if (badge) badge.classList.toggle("muted", newMuted);
    }
    return;
  }

  if (action === "channel-profile") {
    const ch = contextChannelForMenu;
    if (!ch) return;
    await openChannel(ch.id);
    setTimeout(openChannelProfileDialog, 100);
    return;
  }
  if (action === "channel-unsubscribe") {
    const ch = contextChannelForMenu;
    if (!ch) return;
    const { error } = await supabase.from("chat_members")
      .delete().eq("chat_id", ch.id).eq("user_id", currentUser.id);
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    // СРАЗУ убираем канал из списка чатов
    removeChatFromList(ch.id);
    if (currentChannelObj && currentChannelObj.id === ch.id) {
      currentChannelIsSubscribed = false;
      await updateChannelComposerState();
      await updateChannelSubtitle(ch.id);
      configureChatMenuForChannel(currentChannelObj);
      await loadMessages(ch.id, openSeq);
      await loadReactionsForVisibleMessages();
    }
    return;
  }

  const user = contextChatUser;
  if (!user) return;

  if (action === "profile") {
    await openChatWith(user);
    setTimeout(openUserProfileDialog, 100);
  } else if (action === "rename") {
    const current = contextChatCustomName || user.display_name;
    const newName = await showInputDialog("Переименовать чат", "Отображается только у вас", current);
    if (newName === null) return;
    const trimmed = newName.trim();
    const chatId = chatIdByUser.get(user.id); if (!chatId) return;
    const valueToSave = trimmed === "" || trimmed === user.display_name ? null : trimmed;
    const { error } = await supabase.from("chat_members")
      .update({ custom_name: valueToSave }).eq("chat_id", chatId).eq("user_id", currentUser.id);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    const el = document.querySelector(`.user-item[data-user-id="${user.id}"]`);
    if (el) {
      el.dataset.customName = valueToSave || "";
      const nameEl = el.querySelector(".user-item-name");
      if (nameEl) nameEl.textContent = (valueToSave || user.display_name) + (isBlockedByMe(user.id) ? " 🚫" : "");
    }
    if (currentOtherUser && currentOtherUser.id === user.id) {
      document.getElementById("chat-title").textContent = valueToSave || user.display_name;
    }
    user._customName = valueToSave || null;
  } else if (action === "clear") {
    const choice = await showChoiceDialog(t("delete.clear.title"), t("delete.clear.text"), [
      { label: t("delete.clear.me"), value: "me" },
      { label: t("delete.clear.both"), value: "both" },
    ], t("delete.clear.action"));
    if (!choice) return;
    await openChatWith(user);
    if (choice === "me") await clearChatForMe();
    else if (choice === "both") await clearChatForBoth();
  } else if (action === "delete") {
    const choice = await showChoiceDialog(t("delete.chat.title"), t("delete.chat.text"), [
      { label: t("delete.chat.me"), value: "me" },
      { label: t("delete.chat.both"), value: "both" },
    ], t("delete.chat.action"));
    if (!choice) return;
    await openChatWith(user);
    if (choice === "me") await hideChatFromList();
    else if (choice === "both") await deleteChatForBoth();
  } else if (action === "block") {
    if (isBlockedByMe(user.id)) await unblockUser(user.id);
    else {
      const ok = await showConfirmDialog(
        t("block.confirm.title"),
        tFmt("block.confirm.text", { username: user.username }),
        t("block.confirm.action")
      );
      if (!ok) return; await blockUser(user.id);
    }
    document.querySelectorAll(".user-item").forEach((el) => {
      const uid = el.dataset.userId;
      const nameEl = el.querySelector(".user-item-name");
      if (!nameEl || !uid) return;
      const base = nameEl.textContent.replace(/\s*🚫$/, "");
      nameEl.textContent = base + (isBlockedByMe(uid) ? " 🚫" : "");
    });
    if (currentOtherUser && currentOtherUser.id === user.id) updateBlockUI();
  }
});

// ======================= 13. ОТКРЫТИЕ ЧАТА =======================
async function openChatWith(otherUser) {
  const mySeq = ++openSeq;
  // Сохраняем черновик предыдущего чата ДО любых манипуляций с инпутом
  if (currentChatId) saveDraftFor(currentChatId);
  decryptedCache.clear();
  revokeDecryptedFiles();
  // СРАЗУ сбрасываем текущий чат, чтобы избежать случайной отправки в старый
  currentChatId = null;
  currentOtherUser = otherUser; pendingOtherUser = null;
  currentChannelObj = null; currentChannelIsAdmin = false;
  closeChatSearch();
  resetPinsUI();
  const sbBtn = document.getElementById("scroll-bottom-btn");
  if (sbBtn) sbBtn.classList.remove("visible");
  document.getElementById("message-input").setAttribute("contenteditable", "true");
  document.getElementById("message-input").setAttribute("data-placeholder", t("composer.placeholder"));
  resetChatMenuToDm();
  document.getElementById("composer").classList.remove("hidden");
  document.getElementById("channel-action-bar").classList.add("hidden");
  const _searchInput = document.getElementById("search-input");
  const _searchClear = document.getElementById("search-clear");
  const wasSearch = _searchInput && _searchInput.value.trim().length > 0;
  if (_searchInput) _searchInput.value = "";
  if (_searchClear) _searchClear.classList.add("hidden");
  if (wasSearch) loadRecentChats().catch(() => {});
  const itemEl = document.querySelector(`.user-item[data-user-id="${otherUser.id}"]`);
  const customName = itemEl ? itemEl.dataset.customName : null;
  paintAvatar(document.getElementById("chat-avatar"), otherUser);
  document.getElementById("chat-title").innerHTML = escapeHtml(customName || otherUser.display_name) + verifiedBadge(otherUser);
  renderChatSubtitle();
  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-content").classList.remove("hidden");
  document.getElementById("chat-menu").classList.add("hidden");
  exitSelectionMode(); cancelReply(); cancelEdit(); closeReactionPicker(); updateBlockUI();

  let chatId = chatIdByUser.get(otherUser.id) || null;

  // ВАЖНО: если в кэше лежит ID канала — это не DM, сбрасываем.
  if (chatId && channelCache.has(chatId)) {
    chatId = null;
    chatIdByUser.delete(otherUser.id);
  }

  if (!chatId) {
    const { data: myMemberships } = await supabase.from("chat_members").select("chat_id").eq("user_id", currentUser.id);
    if (mySeq !== openSeq) return;
    const myChatIds = (myMemberships || []).map((m) => m.chat_id);

    // КРИТИЧНО: исключаем каналы — общий канал ≠ общий DM!
    let channelIdsSet = new Set();
    if (myChatIds.length) {
      const { data: myChans } = await supabase.from("channels").select("id").in("id", myChatIds);
      if (mySeq !== openSeq) return;
      channelIdsSet = new Set((myChans || []).map((c) => c.id));
    }
    const myDmChatIds = myChatIds.filter((id) => !channelIdsSet.has(id));

    if (myDmChatIds.length) {
      const { data: shared } = await supabase.from("chat_members")
        .select("chat_id").eq("user_id", otherUser.id).in("chat_id", myDmChatIds).limit(1);
      if (mySeq !== openSeq) return;
      if (shared && shared.length) { chatId = shared[0].chat_id; chatIdByUser.set(otherUser.id, chatId); }
    }
  }
  if (mySeq !== openSeq) return;
  if (!chatId) {
    currentChatId = null; pendingOtherUser = otherUser;
    document.getElementById("messages").innerHTML = '<div class="empty">' + escapeHtml(t("empty.startChat")) + '</div>';
    msgCache.clear(); reactionsCache.clear();
    if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
    if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
    enterMobileChat();
    updateE2eeComposerHint();
    return;
  }
  currentChatId = chatId;
  restoreDraftFor(chatId);
  enterMobileChat();
  highlightChatInList(chatId);
  notifySwActiveChat(chatId);
  await loadMessages(chatId, mySeq);
  if (mySeq !== openSeq) return;
  await loadReactionsForVisibleMessages();
  if (mySeq !== openSeq) return;
  subscribeToChat(chatId); subscribeToReactions();
  await markChatRead(chatId);
  setWheelSelected(chatId);
  buildChatTimeline();
  updateE2eeComposerHint();
}

// Подсвечивает активный чат в списке. Работает независимо от того,
// как чат был открыт — кликом, уведомлением, палитрой.
function highlightChatInList(chatId) {
  if (!chatId) return;
  const listEl = document.getElementById("users-list");
  if (!listEl) return;
  listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
  const el = listEl.querySelector(`.user-item[data-chat-id="${chatId}"]`);
  if (el) el.classList.add("active");
}

async function createChatWith(otherUserId) {
  const { data: newChat, error: chatErr } = await supabase.from("chats").insert({}).select().single();
  if (chatErr) {
    console.error("Ошибка создания chat:", chatErr);
    await showAlertDialog(t("alert.error"), t("alert.createChatFail") + ": " + (chatErr.message || ""));
    return null;
  }
  const { error: membersErr } = await supabase.from("chat_members").insert([
    { chat_id: newChat.id, user_id: currentUser.id },
    { chat_id: newChat.id, user_id: otherUserId },
  ]);
  if (membersErr) {
    console.error("Ошибка добавления участников:", membersErr);
    await showAlertDialog(t("alert.error"), membersErr.message || "");
    // Убираем созданный чат, чтобы не было мусора
    await supabase.from("chats").delete().eq("id", newChat.id);
    return null;
  }
  chatIdByUser.set(otherUserId, newChat.id);
  chatOtherUserCache.set(newChat.id, otherUserId);
  await addOrUpdateChatInList(newChat.id, otherUserId);
  return newChat.id;
}

async function markChatRead(chatId) {
  if (!chatId) return;
  try {
    await supabase.rpc("mark_read", { p_chat_id: chatId });
    chatReads.set(chatId, Date.now());
    const data = chatLastMsg.get(chatId);
    if (data) { data.unread = 0; chatLastMsg.set(chatId, data); }
    updateUnreadTitle();
    const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
    if (el) {
      const badge = el.querySelector(".unread-badge"); if (badge) badge.remove();
      const prev = el.querySelector(".user-item-preview"); if (prev) prev.classList.remove("unread");
    }
  } catch (e) { /* silent */ }
}

// ======================= 14. СООБЩЕНИЯ =======================
async function loadMessages(chatId, mySeq) {
  const box = document.getElementById("messages");
  box.innerHTML = '<div class="empty">Загрузка...</div>';
  msgCache.clear(); hiddenMsgIds = new Set(); reactionsCache.clear();
  currentChannelViewsMap = new Map();
  messagesHasMore = false;
  messagesLoadingMore = false;
  messagesOldestTs = null;

  // 🔴 Параллельно: hides, clears и первая пачка сообщений.
  // Раньше шло последовательно (hides → clears → messages), это +300–500 мс.
  const [hidesRes, clearRes, initialMsgsRes] = await Promise.all([
    supabase.from("message_hides").select("message_id").eq("user_id", currentUser.id),
    supabase.from("chat_clears").select("cleared_at").eq("chat_id", chatId).eq("user_id", currentUser.id).maybeSingle(),
    (() => {
      let q = supabase.from("messages").select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(MESSAGES_PAGE_SIZE);
      return q;
    })(),
  ]);
  if (mySeq !== undefined && mySeq !== openSeq) return;
  if (currentChatId !== chatId) return;

  hiddenMsgIds = new Set((hidesRes.data || []).map((h) => h.message_id));
  const clearRow = clearRes.data;
  const clearedAt = clearRow && clearRow.cleared_at ? clearRow.cleared_at : null;

  const isChannel = currentChannelObj && currentChannelObj.id === chatId;

  // Проверка доступа к чтению: владелец всегда видит, остальные — только если подписаны
  if (isChannel) {
    const isOwner = currentChannelObj.owner_id === currentUser.id;
    const hasReadAccess = isOwner || currentChannelIsSubscribed;
    if (!hasReadAccess) {
      const vis = currentChannelObj.visibility || "public";
      if (vis === "request") {
        box.innerHTML = '<div class="empty">' + t("empty.channelNoRead") + '</div>';
        await loadPinned(chatId);
        return;
      }
      if (vis === "private") {
        box.innerHTML = '<div class="empty">' + t("empty.channelNoReadPrivate") + '</div>';
        await loadPinned(chatId);
        return;
      }
    }
  }

  // Сообщения уже загружены параллельно выше. Но если нужен фильтр по clearedAt —
  // перезапрашиваем (это редкий случай).
  let data, error;
  if (clearedAt) {
    const res = await supabase.from("messages").select("*")
      .eq("chat_id", chatId)
      .gt("created_at", clearedAt)
      .order("created_at", { ascending: false })
      .limit(MESSAGES_PAGE_SIZE);
    data = res.data; error = res.error;
  } else {
    data = initialMsgsRes.data; error = initialMsgsRes.error;
  }
  if (mySeq !== undefined && mySeq !== openSeq) return;
  if (currentChatId !== chatId) return;
  if (error) { box.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }

  box.innerHTML = "";
  const initial = (data || []).slice().reverse(); // хронологический порядок
  initial.forEach((m) => msgCache.set(m.id, m));
  messagesHasMore = initial.length === MESSAGES_PAGE_SIZE;
  messagesOldestTs = initial.length ? initial[0].created_at : null;

  const visible = initial.filter((m) => !hiddenMsgIds.has(m.id));

  if (visible.length === 0) {
    box.innerHTML = isChannel
      ? '<div class="empty">' + escapeHtml(t("empty.noMessagesChannel")) + '</div>'
      : '<div class="empty">' + escapeHtml(t("empty.noMessages")) + '</div>';
    await loadPinned(chatId);
    return;
  }

  // Закрепы — до рендера, чтобы значки сразу были
  await loadPinned(chatId);
  if (mySeq !== undefined && mySeq !== openSeq) return;
  if (currentChatId !== chatId) return;

  // Счётчики просмотров — параллельно
  let viewsPromise = null;
  if (isChannel) {
    const ids = visible.map((m) => m.id);
    viewsPromise = supabase.rpc("get_message_view_counts", { p_message_ids: ids }).then(({ data: views }) => {
      (views || []).forEach((v) => currentChannelViewsMap.set(v.message_id, Number(v.views) || 0));
    }).catch(() => {});
  }

  // 🔴 Оптимизация: предзагружаем пачкой всё, что нужно для рендера.
  // Раньше на каждое сообщение делалось до 2-3 запросов (профиль для reply,
  // signed URL для вложения) — на 100+ сообщениях это десятки секунд.
  // Теперь — 1 запрос на все профили + 1 на все signed URL.

  // 1) Профили авторов reply-сообщений
  const replySenderIds = new Set();
  visible.forEach((m) => {
    if (m.reply_to_id && msgCache.has(m.reply_to_id)) {
      const orig = msgCache.get(m.reply_to_id);
      if (orig.sender_id && !profileCache.has(orig.sender_id)) {
        replySenderIds.add(orig.sender_id);
      }
    }
  });
  if (replySenderIds.size) {
    try {
      const { data } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url, accent_color, last_seen, gender, created_at, birthday, verified, bio")
        .in("id", [...replySenderIds]);
      (data || []).forEach((p) => profileCache.set(p.id, p));
    } catch (e) { /* silent */ }
  }

  // 2) Batch signed URLs для незашифрованных вложений
  const pathsToSign = [];
  visible.forEach((m) => {
    if (m.message_type === "attachment" && m.image_url && !(m.file_key_enc && m.file_iv)) {
      const path = extractStoragePath(m.image_url);
      if (path && !signedUrlCache.has(path)) pathsToSign.push(path);
    }
  });
  if (pathsToSign.length) {
    try {
      const { data } = await supabase.storage.from("attachments").createSignedUrls(pathsToSign, 3600);
      const now = Date.now();
      (data || []).forEach((item, i) => {
        if (item && item.signedUrl) {
          signedUrlCache.set(pathsToSign[i], {
            url: rewriteSupabaseUrl(item.signedUrl),
            expiresAt: now + 55 * 60 * 1000,
          });
        }
      });
    } catch (e) { /* silent */ }
  }

  // Рендерим все сообщения ПАРАЛЛЕЛЬНО и вставляем одним куском —
  // иначе пользователь видит, как сообщения «доезжают» по одному
  // (сначала старые, потом новые), и экран прыгает.
  const renderedElements = await Promise.all(visible.map((m) => createMessageElement(m)));
  if (mySeq !== undefined && mySeq !== openSeq) return;
  if (currentChatId !== chatId) return;
  const frag = document.createDocumentFragment();
  renderedElements.forEach((el) => { if (el) frag.appendChild(el); });
  box.appendChild(frag);
  // Реакции рисуем после вставки в DOM
  visible.forEach((m) => renderReactionsUI(m.id));
  scrollToBottom();
  rerenderPinMarks();
  refreshMessageGroups();
  buildChatTimeline();

  // Если у каких-то вложений URL не отрисовался сразу — повторим попытку
  // через небольшую задержку. Закрывает гонку «realtime INSERT → signed URL ещё не готов».
  setTimeout(() => { refreshAttachmentUrls().catch(() => {}); }, 800);

  if (isChannel) {
    await viewsPromise;
    if (mySeq !== undefined && mySeq !== openSeq) return;
    if (currentChatId !== chatId) return;
    currentChannelViewsMap.forEach((cnt, mid) => updateMessageViewsInUI(mid, cnt));

    const ids = visible.map((m) => m.id);
    (async () => {
      const chunkSize = 20;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (id) => {
          try { await supabase.rpc("mark_message_viewed", { p_message_id: id }); } catch (e) {}
        }));
      }
      try {
        const { data: views } = await supabase.rpc("get_message_view_counts", { p_message_ids: ids });
        (views || []).forEach((v) => {
          const cnt = Number(v.views) || 0;
          currentChannelViewsMap.set(v.message_id, cnt);
          updateMessageViewsInUI(v.message_id, cnt);
        });
      } catch (e) {}
    })();
  }
}

// Подгрузка 50 более старых сообщений, когда пользователь доскроллил вверх
async function loadOlderMessages() {
  if (!messagesHasMore || messagesLoadingMore || !currentChatId || !messagesOldestTs) return;
  const chatId = currentChatId;
  messagesLoadingMore = true;

  const box = document.getElementById("messages");
  if (!box) { messagesLoadingMore = false; return; }

  const loader = document.createElement("div");
  loader.className = "msg-loader";
  loader.textContent = "Загрузка...";
  box.insertBefore(loader, box.firstChild);

  try {
    const { data, error } = await supabase.from("messages").select("*")
      .eq("chat_id", chatId)
      .lt("created_at", messagesOldestTs)
      .order("created_at", { ascending: false })
      .limit(MESSAGES_PAGE_SIZE);
    if (error) { console.warn("loadOlderMessages:", error); loader.remove(); messagesLoadingMore = false; return; }
    if (currentChatId !== chatId) { loader.remove(); messagesLoadingMore = false; return; }

    const older = (data || []).slice().reverse(); // хронологический
    if (!older.length) {
      messagesHasMore = false;
      loader.remove();
      messagesLoadingMore = false;
      return;
    }
    messagesHasMore = older.length === MESSAGES_PAGE_SIZE;
    messagesOldestTs = older[0].created_at;

    loader.remove();
    // Фиксируем высоту ПОСЛЕ удаления индикатора, иначе позиция скролла будет сбита
    const prevHeight = box.scrollHeight;
    const prevTop = box.scrollTop;

    const firstExisting = box.firstChild;
    const visible = older.filter((m) => !hiddenMsgIds.has(m.id));
    visible.forEach((m) => msgCache.set(m.id, m));

    for (const m of visible) {
      if (currentChatId !== chatId) { messagesLoadingMore = false; return; }
      await appendMessageBefore(m, firstExisting);
    }

    // Восстанавливаем позицию скролла — пользователь остаётся на том же сообщении
    box.scrollTop = box.scrollHeight - prevHeight + prevTop;

    await loadReactionsForVisibleMessages();
    rerenderPinMarks();
    refreshMessageGroups();
    buildChatTimeline();
  } catch (e) {
    console.warn("loadOlderMessages catch:", e);
    loader.remove();
  } finally {
    messagesLoadingMore = false;
  }
}

// Вставка сообщения В НАЧАЛО списка (для подгрузки вверх)
async function appendMessageBefore(msg, firstExisting) {
  if (msg.chat_id && currentChatId && msg.chat_id !== currentChatId) return;
  const box = document.getElementById("messages");
  if (document.querySelector(`[data-id="${msg.id}"]`)) return;
  const empty = box.querySelector(".empty");
  if (empty) empty.remove();

  if (msg.message_type === "tokens" || msg.message_type === "gift") {
    const el = document.createElement("div");
    el.className = "msg-system" + (msg.message_type === "gift" ? " gift-msg" : "");
    el.dataset.id = msg.id;
    el.innerHTML = await renderSystemMessage(msg);
    el.addEventListener("click", onMsgClick);
    box.insertBefore(el, firstExisting);
    msgCache.set(msg.id, msg);
    fillGiftPatternsIn(el);
    return;
  }

  const isChannelMsg = currentChannelObj && msg.chat_id === currentChannelObj.id;
  const mine = !isChannelMsg && msg.sender_id === currentUser.id;
  const el = document.createElement("div");
  el.className = "msg " + (mine ? "mine" : "other");
  el.dataset.id = msg.id;
  el.innerHTML = await buildMsgHtml(msg);
  el.addEventListener("click", onMsgClick);
  box.insertBefore(el, firstExisting);
  msgCache.set(msg.id, msg);
  renderReactionsUI(msg.id);
}

// Слушаем скролл вверх — догружаем ещё пачку
function setupMessagesScrollPagination() {
  const box = document.getElementById("messages");
  if (!box) return;
  box.addEventListener("scroll", () => {
    if (box.scrollTop < 80 && messagesHasMore && !messagesLoadingMore) {
      loadOlderMessages();
    }
  }, { passive: true });
}

async function loadReactionsForVisibleMessages() {
  const ids = [...msgCache.keys()]; if (!ids.length) return;
  const { data } = await supabase.from("reactions").select("message_id, user_id, emoji").in("message_id", ids);
  reactionsCache.clear();
  (data || []).forEach((r) => {
    if (!reactionsCache.has(r.message_id)) reactionsCache.set(r.message_id, []);
    reactionsCache.get(r.message_id).push({ user_id: r.user_id, emoji: r.emoji });
  });
  document.querySelectorAll(".msg, .msg-system").forEach((el) => renderReactionsUI(el.dataset.id));
}

function renderMsgStatus(msg) {
  if (currentChannelObj && msg.chat_id === currentChannelObj.id) return "";
  if (msg.sender_id !== currentUser.id) return "";
  if (String(msg.id).startsWith("tmp_")) return '<span class="msg-status sending">⏳</span>';
  if (msg.read_at) return '<span class="msg-status read">✓✓</span>';
  if (msg.delivered_at) return '<span class="msg-status delivered">✓</span>';
  return '<span class="msg-status sent">✓</span>';
}

async function renderSystemMessage(msg) {
  if (msg.message_type === "tokens") {
    const sender = await getProfile(msg.sender_id);
    const senderName = sender ? sender.display_name : "—";
    const isMine = msg.sender_id === currentUser.id;
    const g = sender ? sender.gender : null;
    const gSuffix = (g === "male" || g === "female") ? "." + g : ".other";
    let text;
    if (isMine) {
      text = tFmt("msg.tokens.youSent", {
        amount: `<b>${msg.tokens_amount}</b>`,
        icon: NECTAR_HTML,
      });
    } else {
      text = tFmt("msg.tokens.sent" + gSuffix, {
        name: `<b>${escapeHtml(senderName)}</b>`,
        amount: `<b>${msg.tokens_amount}</b>`,
        icon: NECTAR_HTML,
      });
    }
    return `<span class="msg-system-text">${text}</span>`;
  }
  if (msg.message_type === "gift") {
    const { data: ug } = await supabase.from("user_gifts").select("*").eq("id", msg.gift_ref_id).maybeSingle();
    if (!ug) return `<span class="msg-system-text">${escapeHtml(t("preview.gift"))}</span>`;
    const catalog = await loadGiftCatalog();
    const cat = catalog.find((c) => c.id === ug.gift_id);
    if (!cat) return `<span class="msg-system-text">${escapeHtml(t("preview.gift"))}</span>`;
    const sender = await getProfile(msg.sender_id);
    const senderName = sender ? sender.display_name : "—";
    const isMine = msg.sender_id === currentUser.id;
    const g = sender ? sender.gender : null;
    const gSuffix = (g === "male" || g === "female") ? "." + g : ".other";
    let sentText;
    if (isMine) {
      sentText = tFmt("msg.gift.youSent", {
        price: `<b>${cat.price}</b>`,
        icon: NECTAR_HTML,
      });
    } else {
      sentText = tFmt("msg.gift.sent" + gSuffix, {
        name: `<b>${escapeHtml(senderName)}</b>`,
        price: `<b>${cat.price}</b>`,
        icon: NECTAR_HTML,
      });
    }
    const bg = giftBackgroundStyle(ug.background, ug.background_rarity);
    const patternIcon = cat.rarity === "epic" ? getPatternIcon(ug.pattern_id) : null;
    const displayImg = giftDisplayImage(cat, ug);
    return `
      <span class="msg-system-text">${sentText}</span>
      <div class="gift-card-inline" style="${bg}">
        ${patternIcon ? `<div class="gift-card-inline-pattern" data-icon="${patternIcon}"></div>` : ""}
        <div class="gci-emoji">${renderGiftModel(displayImg, 80)}</div>
        <div class="gci-name">${escapeHtml(cat.name)} #${ug.serial_number}</div>
        <div class="gci-sub gift-rarity-${cat.rarity}">${giftRarityLabel(cat.rarity)}${cat.collection ? " · " + escapeHtml(cat.collection) : ""}</div>
      </div>`;
  }
  return "";
}

async function buildMsgHtml(msg) {
  const time = new Date(msg.created_at).toLocaleTimeString(localeId(), { hour: "2-digit", minute: "2-digit" });
  let html = "";
  if (msg.forwarded_from_name) {
    html += `<div class="msg-fwd-link" data-fwd-username="${escapeHtml(msg.forwarded_from_username || "")}">Переслано от ${escapeHtml(msg.forwarded_from_name)}</div>`;
  }
  if (msg.reply_to_id && msgCache.has(msg.reply_to_id)) {
    const orig = msgCache.get(msg.reply_to_id);
    // 🔴 Без await: профиль уже предзагружен batch-запросом в loadMessages.
    // Если его там нет — это либо наш профиль, либо редкий случай.
    const origProfile = profileCache.get(orig.sender_id) || (orig.sender_id === currentUser.id ? myProfile : null);
    const origName = orig.sender_id === currentUser.id ? t("msg.reply.you") : (origProfile ? origProfile.display_name : "?");
    const origPlain = orig.message_type === "attachment" ? "" : await getPlaintext(orig);
    const origPreview = orig.message_type === "attachment"
      ? (orig.file_kind === "image" ? t("preview.photo") : orig.file_kind === "video" ? t("preview.video") : t("preview.file"))
      : origPlain.slice(0, 60);
    html += `<div class="msg-reply" data-scroll-to="${msg.reply_to_id}">
      <span class="msg-reply-name">${t("msg.reply.answer")} ${escapeHtml(origName)}</span>
      <span class="msg-reply-text">${escapeHtml(origPreview)}</span>
    </div>`;
  }
  if (msg.message_type === "attachment") {
    html += `<div class="msg-attachment">${await buildAttachmentHtml(msg)}</div>`;
    if (msg.content) {
      const plainCap = await getPlaintext(msg);
      html += `<div class="msg-text" style="margin-top:6px;">${replaceFlagsInHtml(applyFormatting(escapeHtml(plainCap)))}</div>`;
    }
  } else {
    const plain = await getPlaintext(msg);
    // 🔴 emoji-only — для ЛЮБОГО числа эмодзи и пробелов (убирает «пузырь»).
    // emoji-single — только для одного эмодзи (делает крупный размер).
    const onlyEmoji = isOnlyEmoji(plain);
    const singleEmoji = onlyEmoji && isSingleEmoji(plain);
    const cls = "msg-text"
      + (onlyEmoji ? " emoji-only" : "")
      + (singleEmoji ? " emoji-single" : "");
    html += `<div class="${cls}">${replaceFlagsInHtml(applyFormatting(escapeHtml(plain)))}</div>`;
  }
  html += `<div class="msg-reactions" data-reactions-for="${msg.id}"></div>`;

  let viewsHtml = "";
  if (currentChannelObj && currentChannelObj.id === msg.chat_id) {
    const vc = currentChannelViewsMap.get(msg.id) || 0;
    if (vc > 0) viewsHtml = `<span class="msg-views">${iconInline("eye")}${vc}</span>`;
  }

  html += `<div class="msg-time">${viewsHtml}${time}${renderMsgStatus(msg)}`;
  if (msg.edited_at) html += `<span class="msg-edited">изменено</span>`;
  html += `</div>`;
  return html;
}

// Создаёт DOM-элемент сообщения, но НЕ вставляет его в DOM.
// Нужна для параллельного рендера пачки сообщений (batch-insert).
async function createMessageElement(msg) {
  try {
    return await _createMessageElementImpl(msg);
  } catch (e) {
    console.error("createMessageElement failed:", e, msg);
    // Аварийный фолбэк — простое текстовое сообщение
    const el = document.createElement("div");
    const isChannelMsg = currentChannelObj && msg.chat_id === currentChannelObj.id;
    const mine = !isChannelMsg && msg.sender_id === currentUser.id;
    el.className = "msg " + (mine ? "mine" : "other");
    el.dataset.id = msg.id;
    el.textContent = msg.content || "(ошибка отображения)";
    el.addEventListener("click", onMsgClick);
    msgCache.set(msg.id, msg);
    return el;
  }
}

async function _createMessageElementImpl(msg) {
  if (msg.message_type === "tokens" || msg.message_type === "gift") {
    const el = document.createElement("div");
    el.className = "msg-system" + (msg.message_type === "gift" ? " gift-msg" : "");
    el.dataset.id = msg.id;
    el.innerHTML = await renderSystemMessage(msg);
    el.addEventListener("click", onMsgClick);
    msgCache.set(msg.id, msg);
    fillGiftPatternsIn(el);
    return el;
  }
  const isChannelMsg = currentChannelObj && msg.chat_id === currentChannelObj.id;
  const mine = !isChannelMsg && msg.sender_id === currentUser.id;
  const el = document.createElement("div");
  el.className = "msg " + (mine ? "mine" : "other");
  el.dataset.id = msg.id;
  el.innerHTML = await buildMsgHtml(msg);
  el.addEventListener("click", onMsgClick);
  msgCache.set(msg.id, msg);
  return el;
}

// Бронь ID на время рендера — защищает от race condition между
// appendMessage (наш путь) и realtime-подпиской (внешний путь).
const pendingMsgRenders = new Set();

async function appendMessage(msg) {
  // Race-guard: не добавляем сообщения из чужого чата
  if (msg.chat_id && currentChatId && msg.chat_id !== currentChatId) return;
  if (document.querySelector(`[data-id="${msg.id}"]`)) return;
  if (pendingMsgRenders.has(msg.id)) return;
  // Синхронная бронь ДО первого await — второй вызов отсеется здесь
  pendingMsgRenders.add(msg.id);
  try {
    const box = document.getElementById("messages");
    const empty = box.querySelector(".empty");
    if (empty) empty.remove();
    const el = await createMessageElement(msg);
    if (!el) return;
    // Финальная проверка: пока мы ждали, кто-то мог уже вставить
    if (document.querySelector(`[data-id="${msg.id}"]`)) return;
    box.appendChild(el);
    renderReactionsUI(msg.id);
    refreshMessageGroups();
  } finally {
    pendingMsgRenders.delete(msg.id);
  }
}

function updateMessageStatusInUI(msg) {
  const el = document.querySelector(`.msg[data-id="${msg.id}"] .msg-time`);
  if (!el) return;
  // Перестроим только статус
  const html = el.innerHTML;
  const newHtml = html.replace(/<span class="msg-status[^"]*">[^<]*<\/span>/, renderMsgStatus(msg));
  if (newHtml !== html) el.innerHTML = newHtml;
}

function updateMessageViewsInUI(msgId, count) {
  const el = document.querySelector(`[data-id="${msgId}"]`);
  if (!el) return;
  const timeEl = el.querySelector(".msg-time");
  if (!timeEl) return;
  let viewsEl = timeEl.querySelector(".msg-views");
  if (count > 0) {
    if (!viewsEl) {
      viewsEl = document.createElement("span");
      viewsEl.className = "msg-views";
      timeEl.insertBefore(viewsEl, timeEl.firstChild);
    }
    viewsEl.innerHTML = iconInline("eye") + count;
  } else if (viewsEl) {
    viewsEl.remove();
  }
}

function subtractViewsForDeletedMessage(msgId) {
  const vc = currentChannelViewsMap.get(msgId) || 0;
  currentChannelViewsMap.delete(msgId);
  if (!vc) return;
  currentChannelTotalViews = Math.max(0, currentChannelTotalViews - vc);
  const viewsEl = document.getElementById("channel-profile-views");
  if (viewsEl) viewsEl.textContent = String(currentChannelTotalViews);
}

function subscribeToChannelViews(chatId) {
  if (currentChannelViewsChannel) { supabase.removeChannel(currentChannelViewsChannel); currentChannelViewsChannel = null; }
  currentChannelViewsChannel = supabase.channel("views-" + chatId)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_views" }, (payload) => {
      const mv = payload.new; if (!mv) return;
      // Свои просмотры уже посчитаны локально в loadMessages/subscribeToChat —
      // не считаем их повторно, иначе цифра будет «прыгать»
      if (mv.user_id === currentUser.id) return;
      const m = msgCache.get(mv.message_id);
      if (!m || m.chat_id !== currentChatId) return;
      const next = (currentChannelViewsMap.get(mv.message_id) || 0) + 1;
      currentChannelViewsMap.set(mv.message_id, next);
      updateMessageViewsInUI(mv.message_id, next);
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_views" }, (payload) => {
      const mv = payload.old; if (!mv) return;
      const m = msgCache.get(mv.message_id);
      if (!m || m.chat_id !== currentChatId) return;
      const next = Math.max(0, (currentChannelViewsMap.get(mv.message_id) || 0) - 1);
      currentChannelViewsMap.set(mv.message_id, next);
      updateMessageViewsInUI(mv.message_id, next);
    })
    .subscribe();
}

// ======================================================
// 38. КОЛЕСО ЧАТОВ
// ======================================================

let wheelIndex = 0;
let wheelSelectedChatId = null;
let wheelScrollLock = false;

function setupWheel() {
  const wrap = document.getElementById("wheel-wrap");
  const listEl = document.getElementById("users-list");
  if (!wrap) return;

  // Навигация по чатам с клавиатуры (Alt+↑/↓).
  // Работает в любом режиме и даже когда чат ещё не открыт —
  // список чатов доступен всегда, если он непустой.
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, [contenteditable]")) return;
    if (e.key === "ArrowUp" && e.altKey) { e.preventDefault(); wheelMove(-1); }
    else if (e.key === "ArrowDown" && e.altKey) { e.preventDefault(); wheelMove(1); }
  });

  // Скролл — нативный. При скролле в колёсном режиме пересчитываем,
  // какой чат сейчас «активный» (верхний в видимой области).
  if (listEl && !listEl.__wheelScrollBound) {
    listEl.__wheelScrollBound = true;
    let rafId = null;
    listEl.addEventListener("scroll", () => {
      if (scrollMode !== "wheel") return;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        refreshWheelLayout();
      });
    }, { passive: true });
  }
}

// Возвращает индекс элемента, чей верх ближе всего к верху видимой области.
function getTopVisibleIndex(items, listEl) {
  if (!items.length) return -1;
  const listTop = listEl.getBoundingClientRect().top;
  let best = 0;
  let bestDiff = Infinity;
  items.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const diff = Math.abs(r.top - listTop);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
}

function wheelMove(dir) {
  const listEl = document.getElementById("users-list");
  if (!listEl) return;
  const items = [...listEl.querySelectorAll(".user-item")];
  if (!items.length) return;
  const cur = getTopVisibleIndex(items, listEl);
  const next = Math.max(0, Math.min(items.length - 1, cur + dir));
  const target = items[next];
  if (!target) return;
  listEl.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  // Открываем выбранный чат — как будто пользователь по нему кликнул.
  // openSeq внутри openChatWith/openChannel отменит предыдущий открытый чат,
  // если пользователь быстро пробежал несколько шагов подряд.
  target.click();
}

function setWheelSelected(chatId) {
  if (!chatId) return;
  wheelSelectedChatId = chatId;
  // Не скроллим — просто перерисовываем активный класс по текущей позиции.
  if (scrollMode === "wheel") refreshWheelLayout();
}

function updateWheelArrows(showTop, showBottom) {
  const top = document.querySelector(".wheel-arrow-top");
  const bottom = document.querySelector(".wheel-arrow-bottom");
  const inWheel = scrollMode === "wheel";
  if (top) top.classList.toggle("hidden", !(inWheel && showTop));
  if (bottom) bottom.classList.toggle("hidden", !(inWheel && showBottom));
}

function refreshWheelLayout() {
  const listEl = document.getElementById("users-list");
  if (!listEl) return;
  const items = [...listEl.querySelectorAll(".user-item")];

  if (scrollMode !== "wheel") {
    // Классический режим: сбрасываем inline-стили и подгонку отступов
    items.forEach((el) => {
      el.classList.remove("wheel-active");
      el.style.removeProperty("--ty");
      el.style.removeProperty("--sc");
      el.style.removeProperty("--chat-hue");
      el.style.removeProperty("opacity");
      el.style.removeProperty("z-index");
    });
    listEl.style.paddingBottom = "";
    updateWheelArrows(false, false);
    return;
  }

  if (!items.length) {
    listEl.style.paddingBottom = "";
    updateWheelArrows(false, false);
    return;
  }

  // Нижний отступ: чтобы последний чат мог встать наверх (снизу будет пустота).
  // Высота = высота видимой области минус высота одного элемента.
  const itemH = items[0].offsetHeight || 66;
  const pad = Math.max(0, listEl.clientHeight - itemH);
  listEl.style.paddingBottom = pad + "px";

  // Активный — верхний в видимой области.
  const activeIdx = getTopVisibleIndex(items, listEl);
  items.forEach((el, i) => el.classList.toggle("wheel-active", i === activeIdx));
  if (activeIdx >= 0) {
    wheelIndex = activeIdx;
    wheelSelectedChatId = items[activeIdx].dataset.chatId;
  }

  // Индикаторы прокрутки: смотрим по фактической видимости крайних чатов,
  // а не по scrollTop/scrollHeight — потому что снизу мы добавляем
  // padding, и последний чат может «висеть» высоко от дна скролла.
  const listRect = listEl.getBoundingClientRect();
  const firstRect = items[0].getBoundingClientRect();
  const lastRect = items[items.length - 1].getBoundingClientRect();
  const firstVisible = firstRect.top >= listRect.top - 2;
  const lastVisible = lastRect.bottom <= listRect.bottom + 2;
  updateWheelArrows(!firstVisible, !lastVisible);
}

function idToHue(id) {
  if (!id) return 35;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

// ======================================================
// 39. ГРУППИРОВКА СООБЩЕНИЙ + ПЛАВАЮЩАЯ ДАТА
// ======================================================

const MSG_GROUP_WINDOW = 5 * 60 * 1000;

function refreshMessageGroups() {
  const box = document.getElementById("messages");
  if (!box) return;
  const msgs = [...box.querySelectorAll(".msg")];
  if (!msgs.length) return;

  msgs.forEach((el, i) => {
    el.classList.remove("group-first", "group-mid", "group-last");
    const cur = msgCache.get(el.dataset.id);
    if (!cur) return;
    const prevEl = msgs[i - 1];
    const nextEl = msgs[i + 1];
    const prev = prevEl ? msgCache.get(prevEl.dataset.id) : null;
    const next = nextEl ? msgCache.get(nextEl.dataset.id) : null;

    const sameAsPrev = prev && prev.sender_id === cur.sender_id &&
      (new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime()) < MSG_GROUP_WINDOW;
    const sameAsNext = next && next.sender_id === cur.sender_id &&
      (new Date(next.created_at).getTime() - new Date(cur.created_at).getTime()) < MSG_GROUP_WINDOW;

    if (!sameAsPrev && sameAsNext)      el.classList.add("group-first");
    else if (sameAsPrev && sameAsNext)  el.classList.add("group-mid");
    else if (sameAsPrev && !sameAsNext) el.classList.add("group-last");
  });
}

function setupDateFloat() {
  const box = document.getElementById("messages");
  const floatEl = document.getElementById("date-float");
  if (!box || !floatEl) return;

  box.addEventListener("scroll", () => updateDateFloat(), { passive: true });
}

function updateDateFloat() {
  const box = document.getElementById("messages");
  const floatEl = document.getElementById("date-float");
  if (!box || !floatEl) return;
  if (!box.querySelector(".msg, .msg-system")) { floatEl.classList.add("hidden"); return; }

  const boxRect = box.getBoundingClientRect();
  let current = null;
  const all = box.querySelectorAll(".msg, .msg-system");
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.top - boxRect.top <= 8) current = el;
    else break;
  }
  if (!current) current = all[0];
  const msg = msgCache.get(current.dataset.id);
  if (!msg) { floatEl.classList.add("hidden"); return; }

  floatEl.textContent = formatDateHeader(new Date(msg.created_at));
  floatEl.classList.remove("hidden");
}

function formatDateHeader(d) {
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("date.today");
  if (d.toDateString() === yest.toDateString()) return t("date.yesterday");
  const monthsRu = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  const monthsEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const months = currentLang === "en" ? monthsEn : monthsRu;
  if (currentLang === "en") {
    if (d.getFullYear() === today.getFullYear()) return months[d.getMonth()] + " " + d.getDate();
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  if (d.getFullYear() === today.getFullYear()) return d.getDate() + " " + months[d.getMonth()];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

// ======================================================
// 40. ТАЙМЛАЙН-СКРАББЕР
// ======================================================

function buildChatTimeline() {
  const box = document.getElementById("messages");
  const tl = document.getElementById("chat-timeline");
  if (!box || !tl) return;

  const all = [...box.querySelectorAll(".msg, .msg-system")];
  if (all.length < 3) { tl.classList.add("hidden"); return; }

  const dayFirst = new Map();
  all.forEach((el) => {
    const m = msgCache.get(el.dataset.id);
    if (!m) return;
    const d = new Date(m.created_at);
    const key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    if (!dayFirst.has(key)) dayFirst.set(key, el.dataset.id);
  });

  const keys = [...dayFirst.keys()];
  tl.innerHTML = keys.map((k) =>
    `<div class="timeline-dot" data-day-key="${k}" data-first-id="${dayFirst.get(k)}" title="${formatDateHeader(new Date(k))}"></div>`
  ).join("");
  tl.classList.remove("hidden");

  tl.querySelectorAll(".timeline-dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = dot.dataset.firstId;
      const target = box.querySelector(`[data-id="${id}"]`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  updateTimelineMarker();
}

function updateTimelineMarker() {
  const box = document.getElementById("messages");
  const tl = document.getElementById("chat-timeline");
  if (!box || !tl || tl.classList.contains("hidden")) return;

  const boxRect = box.getBoundingClientRect();
  let currentId = null;
  const all = box.querySelectorAll(".msg, .msg-system");
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.top - boxRect.top <= 40) currentId = el.dataset.id;
    else break;
  }
  const dots = tl.querySelectorAll(".timeline-dot");
  dots.forEach((d) => d.classList.remove("timeline-current"));
  if (!currentId) return;

  const m = msgCache.get(currentId);
  if (!m) return;
  const d = new Date(m.created_at);
  const key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  const dot = tl.querySelector(`.timeline-dot[data-day-key="${key}"]`);
  if (dot) dot.classList.add("timeline-current");
}

// Навешиваем обновление маркера на скролл
(function attachTimelineScroll() {
  const box = document.getElementById("messages");
  if (!box) return;
  box.addEventListener("scroll", () => updateTimelineMarker(), { passive: true });
})();

// ======================================================
// 41. КОМАНДНАЯ ПАЛИТРА (Ctrl+K)
// ======================================================

let cmdPaletteOpen = false;
let cmdPaletteResults = [];
let cmdPaletteIndex = 0;
let cmdPaletteSearchTimeout = null;

function setupCommandPalette() {
  const input = document.getElementById("cmd-palette-input");
  const overlay = document.getElementById("cmd-palette-overlay");
  if (!input || !overlay) return;

  // ВАЖНО: capture: true — перехватываем раньше браузера
  document.addEventListener("keydown", (e) => {
    // e.code не зависит от раскладки — KeyK везде KeyK
    const isK = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.code === "KeyK";
    if (isK) {
      e.preventDefault();
      e.stopPropagation();
      if (cmdPaletteOpen) closeCmdPalette();
      else openCmdPalette();
      return;
    }
    if (e.key === "Escape" && cmdPaletteOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeCmdPalette();
    }
  }, true);

  // На случай, если focus в самом input — тоже перехватываем
  document.addEventListener("keydown", (e) => {
    if (e.target === input) return;
    const isK = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.code === "KeyK";
    if (isK) {
      e.preventDefault();
      e.stopPropagation();
      if (cmdPaletteOpen) closeCmdPalette();
      else openCmdPalette();
    }
  }, true);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeCmdPalette();
  });

  input.addEventListener("input", () => {
    clearTimeout(cmdPaletteSearchTimeout);
    cmdPaletteSearchTimeout = setTimeout(() => runCmdPaletteSearch(input.value.trim()), 120);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); cmdPaletteMove(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cmdPaletteMove(-1); }
    else if (e.key === "Enter") { e.preventDefault(); cmdPaletteRunSelected(); }
    else if (e.key === "Escape") { e.preventDefault(); closeCmdPalette(); }
  });
}

function openCmdPalette() {
  cmdPaletteOpen = true;
  const overlay = document.getElementById("cmd-palette-overlay");
  const input = document.getElementById("cmd-palette-input");
  overlay.classList.remove("hidden");
  input.value = "";
  runCmdPaletteSearch("");
  setTimeout(() => input.focus(), 40);
}

function closeCmdPalette() {
  cmdPaletteOpen = false;
  document.getElementById("cmd-palette-overlay").classList.add("hidden");
}

async function runCmdPaletteSearch(q) {
  const listEl = document.getElementById("cmd-palette-list");
  listEl.innerHTML = "";

  const commands = [
    { kind: "cmd", title: t("cmd.cmd.create-channel"), sub: t("cmd.cmd.create-channel.sub"), value: "create-channel", icon: "＋" },
    { kind: "cmd", title: t("cmd.cmd.profile"), sub: t("cmd.cmd.profile.sub"), value: "profile", icon: "👤" },
    { kind: "cmd", title: t("cmd.cmd.gifts"), sub: t("cmd.cmd.gifts.sub"), value: "gifts", icon: "🎁" },
    { kind: "cmd", title: t("cmd.cmd.channel-edit"), sub: t("cmd.cmd.channel-edit.sub"), value: "channel-edit", icon: "⚙" },
    { kind: "cmd", title: t("cmd.cmd.about"), sub: t("cmd.cmd.about.sub"), value: "about", icon: "ℹ" },
  ];

  const ql = q.toLowerCase();
  const isCmd = q.startsWith(">");

  const chats = [];
  document.querySelectorAll(".user-item[data-chat-id]").forEach((el) => {
    const chatId = el.dataset.chatId;
    const name = el.querySelector(".user-item-name")?.textContent?.trim() || "";
    const preview = el.querySelector(".user-item-preview")?.textContent?.trim() || "";
    const isChannel = el.dataset.chatType === "channel";
    chats.push({ kind: isChannel ? "channel" : "chat", chatId, title: name, sub: preview, hue: idToHue(chatId) });
  });

  let profiles = [];
  if (q.length >= 2 && !isCmd) {
    const clean = q.replace(/^[@#]+/, "");
    try {
      const { data } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url, last_seen")
        .neq("id", currentUser.id)
        .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
        .limit(8);
      if (data) profiles = data.map((p) => ({
        kind: "profile",
        userId: p.id,
        title: p.display_name,
        sub: "@" + p.username,
        profile: p,
      }));
    } catch (e) {}
  }

  let results = [];
  if (isCmd || !q) {
    const qq = q.replace(/^>\s*/, "").toLowerCase();
    results = commands.filter((c) => !qq || c.title.toLowerCase().includes(qq) || c.sub.toLowerCase().includes(qq));
  } else {
    const qq = ql.replace(/^[@#]+/, "");
    const chatsMatch = chats.filter((c) =>
      c.title.toLowerCase().includes(qq) || c.sub.toLowerCase().includes(qq)
    );
    results = [...chatsMatch, ...profiles].slice(0, 12);
  }

  cmdPaletteResults = results;
  cmdPaletteIndex = results.length ? 0 : -1;
  renderCmdPalette();
}

function renderCmdPalette() {
  const listEl = document.getElementById("cmd-palette-list");
  if (!cmdPaletteResults.length) {
    listEl.innerHTML = '<div class="empty">' + escapeHtml(t("cmd.empty")) + '</div>';
    return;
  }
  listEl.innerHTML = cmdPaletteResults.map((r, i) => {
    const active = i === cmdPaletteIndex ? " active" : "";
    if (r.kind === "cmd") {
      return `<div class="cmd-palette-item${active}" data-idx="${i}">
        <div class="avatar" style="display:flex;align-items:center;justify-content:center;background:var(--bg-input);color:var(--accent);clip-path:none;">${r.icon}</div>
        <div class="cmd-palette-item-body">
          <div class="cmd-palette-item-title">${escapeHtml(r.title)}</div>
          <div class="cmd-palette-item-sub">${escapeHtml(r.sub)}</div>
        </div>
        <span class="cmd-palette-item-kind">${escapeHtml(t("cmd.kind.cmd"))}</span>
      </div>`;
    }
    const kindLabel = r.kind === "channel" ? t("cmd.kind.channel")
      : r.kind === "chat" ? t("cmd.kind.chat")
      : t("cmd.kind.profile");
    const avatarHtml = r.profile
      ? `<div class="avatar" data-avatar-for="${r.userId}">?</div>`
      : `<div class="avatar" style="background: hsl(${r.hue}, 60%, 55%);"></div>`;
    return `<div class="cmd-palette-item${active}" data-idx="${i}">
      ${avatarHtml}
      <div class="cmd-palette-item-body">
        <div class="cmd-palette-item-title">${escapeHtml(r.title)}</div>
        <div class="cmd-palette-item-sub">${escapeHtml(r.sub)}</div>
      </div>
      <span class="cmd-palette-item-kind">${escapeHtml(kindLabel)}</span>
    </div>`;
  }).join("");

  listEl.querySelectorAll(".cmd-palette-item").forEach((el) => {
    el.addEventListener("click", () => {
      cmdPaletteIndex = parseInt(el.dataset.idx, 10);
      cmdPaletteRunSelected();
    });
    el.addEventListener("mouseenter", () => {
      cmdPaletteIndex = parseInt(el.dataset.idx, 10);
      listEl.querySelectorAll(".cmd-palette-item").forEach((x, i) => x.classList.toggle("active", i === cmdPaletteIndex));
    });
  });

  listEl.querySelectorAll(".avatar[data-avatar-for]").forEach((el) => {
    const r = cmdPaletteResults.find((x) => x.userId === el.dataset.avatarFor);
    if (r && r.profile) paintAvatar(el, r.profile);
  });

  const activeEl = listEl.querySelector(".cmd-palette-item.active");
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
}

function cmdPaletteMove(dir) {
  if (!cmdPaletteResults.length) return;
  cmdPaletteIndex = (cmdPaletteIndex + dir + cmdPaletteResults.length) % cmdPaletteResults.length;
  renderCmdPalette();
}

async function cmdPaletteRunSelected() {
  const r = cmdPaletteResults[cmdPaletteIndex];
  if (!r) return;
  closeCmdPalette();

  if (r.kind === "cmd") {
    if (r.value === "create-channel") openChannelCreateDialog();
    else if (r.value === "profile") openProfilePanel();
    else if (r.value === "gifts") openGiftsOverlay(currentUser.id);
    else if (r.value === "channel-edit") { if (currentChannelObj && currentChannelIsAdmin) openChannelEditDialog(); }
    else if (r.value === "about") document.getElementById("about-overlay").classList.remove("hidden");
    return;
  }

  if (r.kind === "chat" || r.kind === "channel") {
    const el = document.querySelector(`.user-item[data-chat-id="${r.chatId}"]`);
    if (el) el.click();
    return;
  }

  if (r.kind === "profile") {
    if (r.profile) await openChatWith(r.profile);
  }
}

// ======================================================
// 42. МИНИ-ПРОФИЛЬ
// ======================================================

let miniProfileTimer = null;
let miniProfileHideTimer = null;

function setupMiniProfile() {
  const mp = document.getElementById("mini-profile");
  if (!mp) return;

  document.addEventListener("mouseover", (e) => {
    const avatar = e.target.closest(".user-item .avatar, #chat-header-text ~ .avatar, .chat-header .avatar");
    if (!avatar) return;
    const item = avatar.closest(".user-item");
    if (!item) return;
    if (item.dataset.chatType === "channel") return;
    const userId = item.dataset.userId;
    if (!userId) return;
    clearTimeout(miniProfileHideTimer);
    miniProfileTimer = setTimeout(() => showMiniProfile(userId, avatar), 550);
  });

  document.addEventListener("mouseout", (e) => {
    const avatar = e.target.closest(".user-item .avatar");
    if (!avatar) return;
    clearTimeout(miniProfileTimer);
    miniProfileHideTimer = setTimeout(() => hideMiniProfile(), 120);
  });
}

async function showMiniProfile(userId, anchor) {
  if (!userId) return;
  const p = profileCache.get(userId) || await getProfile(userId);
  if (!p) return;

  const mp = document.getElementById("mini-profile");
  paintAvatar(document.getElementById("mini-profile-avatar"), p);
  document.getElementById("mini-profile-name").innerHTML = escapeHtml(p.display_name || "—") + verifiedBadge(p);
  document.getElementById("mini-profile-username").textContent = "@" + (p.username || "");
  const st = document.getElementById("mini-profile-status");
  st.textContent = formatLastSeen(p) || "—";
  st.classList.toggle("online", isUserOnline(p));

  const rect = anchor.getBoundingClientRect();
  mp.classList.remove("hidden");
  const mw = mp.offsetWidth, mh = mp.offsetHeight;
  let x = rect.right + 10;
  let y = rect.top;
  if (x + mw > window.innerWidth - 8) x = rect.left - mw - 10;
  if (y + mh > window.innerHeight - 8) y = window.innerHeight - mh - 8;
  mp.style.left = x + "px";
  mp.style.top = y + "px";
}

function hideMiniProfile() {
  document.getElementById("mini-profile").classList.add("hidden");
}

function onMsgClick(e) {
  // Клик по фото вложения → открыть media-viewer
  const img = e.target.closest(".msg-attachment-image");
  if (img) {
    e.stopPropagation();
    const url = img.dataset.mediaUrl || img.src;
    const msgId = img.closest("[data-id]")?.dataset.id || null;
    const media = collectChatMedia();
    const idx = media.findIndex((x) => x.msgId === msgId);
    openMediaViewer(url, "image", media, idx >= 0 ? idx : 0);
    return;
  }
  const giftEl = e.target.closest(".msg-system.gift-msg");
  if (giftEl) {
    const msgId = giftEl.dataset.id;
    const m = msgCache.get(msgId);
    if (m && m.gift_ref_id) {
      openGiftDetailById(m.gift_ref_id);
    }
    return;
  }
  const replyEl = e.target.closest(".msg-reply");
  if (replyEl) { e.stopPropagation(); jumpToMessage(replyEl.dataset.scrollTo); return; }
  const fwdEl = e.target.closest(".msg-fwd-link");
  if (fwdEl) {
    e.stopPropagation();
    const uname = fwdEl.dataset.fwdUsername;
    if (uname) openChatByUsername(uname);
    return;
  }
  const chip = e.target.closest(".reaction-chip");
  if (chip) { e.stopPropagation(); toggleReaction(chip.dataset.messageId, chip.dataset.emoji); return; }
}

function jumpToMessage(id) {
  const box = document.getElementById("messages");
  if (!box) return;
  const target = box.querySelector(`[data-id="${id}"]`);
  if (!target) return;
  // Замораживаем авто-переключение активного закрепа, чтобы не «прыгал»
  pinBarFrozenUntil = Date.now() + 900;

  // Считаем позицию вручную — scrollIntoView умеет тянуть родительские скроллы
  // (body/html), из-за чего экран уезжает «в другую сторону».
  const boxRect = box.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const delta = targetRect.top - boxRect.top;
  const newTop = box.scrollTop + delta - box.clientHeight / 2 + targetRect.height / 2;
  box.scrollTo({ top: Math.max(0, newTop), behavior: "smooth" });

  const prev = target.style.background;
  target.style.transition = "background 0.4s";
  target.style.background = "rgba(255,140,66,0.3)";
  setTimeout(() => { target.style.background = prev; }, 700);
}

async function updateMessageInUI(msg) {
  const el = document.querySelector(`[data-id="${msg.id}"]`);
  if (!el) return;
  msgCache.set(msg.id, msg);
  if (msg.message_type === "tokens" || msg.message_type === "gift") {
    el.innerHTML = await renderSystemMessage(msg);
    fillGiftPatternsIn(el);
  } else {
    el.innerHTML = await buildMsgHtml(msg);
    renderReactionsUI(msg.id);
  }
}

async function openChatByUsername(username) {
  if (!username) return;
  // Сначала профиль
  const { data } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, last_seen, gender, birthday, verified")
    .eq("username", username).maybeSingle();
  if (data) {
    if (data.id === currentUser.id) return;
    document.getElementById("search-input").value = "";
    await openChatWith(data);
    return;
  }
  // 🔴 Не нашли — ищем канал. Нужно, чтобы клик по «Переслано от Football News»
  // открывал канал, а не молчал.
  const { data: ch } = await supabase.from("channels")
    .select("id").eq("username", username).maybeSingle();
  if (ch) {
    document.getElementById("search-input").value = "";
    await openChannel(ch.id);
  }
}

function scrollToBottom() {
  const box = document.getElementById("messages");
  if (!box) return;
  box.scrollTop = box.scrollHeight;
  // Пересчёт после того, как подгрузятся картинки/видео/файлы —
  // без этого чат при перезагрузке остаётся чуть выше низа
  const adjust = () => {
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 220;
    if (nearBottom) box.scrollTop = box.scrollHeight;
  };
  requestAnimationFrame(adjust);
  box.querySelectorAll("img:not([data-scrollbound]), video:not([data-scrollbound])").forEach((el) => {
    el.dataset.scrollbound = "1";
    if (el.tagName === "IMG") {
      if (el.complete) adjust();
      else el.addEventListener("load", adjust, { once: true });
      el.addEventListener("error", adjust, { once: true });
    } else {
      el.addEventListener("loadedmetadata", adjust, { once: true });
      el.addEventListener("loadeddata", adjust, { once: true });
    }
  });
  // Резервные таймеры — на случай очень медленной сети
  setTimeout(adjust, 120);
  setTimeout(adjust, 400);
  setTimeout(adjust, 900);
}

function setupScrollBottomButton() {
  const btn = document.getElementById("scroll-bottom-btn");
  const box = document.getElementById("messages");
  if (!btn || !box) return;

  btn.addEventListener("click", () => {
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  });

  box.addEventListener("scroll", () => {
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    btn.classList.toggle("visible", !nearBottom);
  }, { passive: true });
}

function checkEmptyChat() {
  const box = document.getElementById("messages");
  if (box.children.length === 0) {
    if (currentChannelObj) {
      box.innerHTML = '<div class="empty">' + escapeHtml(t("empty.noMessagesChannel")) + '</div>';
    } else {
      box.innerHTML = '<div class="empty">' + escapeHtml(t("empty.noMessages")) + '</div>';
    }
  }
}

// ======================================================
// 15. КОМПОЗЕР + ВЛОЖЕНИЯ + ЭМОДЗИ
// ======================================================

// ---- Эмодзи-пикер ----
const EMOJI_RECENT_KEY = "cell_emoji_recent";
const EMOJI_MAX_RECENT = 24;

// Windows не умеет показывать цветные эмодзи-флаги — заменяем их на SVG Twemoji
function isFlagEmoji(emoji) {
  if (!emoji) return false;
  const cp = emoji.codePointAt(0);
  // Обычные страны — региональные индикаторы
  if (cp >= 0x1F1E6 && cp <= 0x1F1FF) return true;
  // 🏴 (чёрный флаг + tag-символы) — Шотландия, Уэльс, Англия
  if (cp === 0x1F3F4) return true;
  // 🏳️ — белый флаг (радужный, транс, лесбийский)
  if (cp === 0x1F3F3) return true;
  return false;
}

// Спец-случай: 🏳️‍⚧️ (транс-флаг) в Twemoji есть, но нам нужен лесбийский флаг.
// Сравниваем по нормализованному списку кодпоинтов (без FE0F) — так сработает
// независимо от того, записан ли эмодзи с хвостовым FE0F или без.
const LESBIAN_FLAG_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Lesbian_pride_flag_2018.svg/64px-Lesbian_pride_flag_2018.svg.png";

function twemojiUrl(emoji) {
  const codepoints = [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-");
  if (codepoints === "1f3f3-200d-26a7") return LESBIAN_FLAG_URL;
  // Twemoji 15.0.3 (jdecked/twemoji) — там есть все свежие эмодзи, включая tag-флаги
  // Англии/Шотландии/Уэльса. Старая twitter/twemoji@14 их частично не содержит.
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/${codepoints}.svg`;
}

// Глобальный fallback для эмодзи, которых нет в Twemoji (например 🇨🇶 — Сарк).
// Просто показывает сам эмодзи как текст, чтобы вместо «битой картинки» был символ.
window.__emojiFallback = function (img) {
  if (!img || img.dataset.fallbackDone === "1") return;
  img.dataset.fallbackDone = "1";
  const emoji = img.dataset.emoji || img.alt || "";
  if (!emoji) return;
  const span = document.createElement("span");
  span.className = "emoji-fallback-inline";
  span.textContent = emoji;
  img.replaceWith(span);
};

// Заменяет флаги-эмодзи в готовом HTML на <img>
function replaceFlagsInHtml(html) {
  if (!html) return html;
  return html.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, (match) => {
    return `<img class="emoji-flag" src="${twemojiUrl(match)}" alt="${match}" draggable="false">`;
  });
}

const EMOJI_SETS = {
  smileys: "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 💩 🤡 👹 👺 👻 👽 👾 🤖".split(" "),
  gestures: "👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦵 🦶 👂 🦻 👃 🧠 🦷 🦴 👀 👁️ 👅 👄 💋".split(" "),
  nature: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦟 🦗 🕷️ 🕸️ 🐢 🐍 🦎 🦂 🦀 🦞 🦐 🦑 🐙 🐠 🐟 🐡 🐬 🦈 🐳 🐋 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦦 🦥 🐁 🐀 🐿️ 🦔 🌸 🌺 🌻 🌷 🌹 🥀 🌼 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃".split(" "),
  food: "🍇 🍈 🍉 🍊 🍋 🍌 🍍 🥭 🍎 🍏 🍐 🍑 🍒 🍓 🥝 🍅 🥥 🥑 🍆 🥔 🥕 🌽 🌶️ 🥒 🥬 🥦 🧄 🧅 🍄 🥜 🌰 🍞 🥐 🥖 🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🥙 🧆 🥚 🍳 🥘 🍲 🥣 🥗 🍿 🧈 🧂 🥫 🍱 🍘 🍙 🍚 🍛 🍜 🍝 🍠 🍢 🍣 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🦪 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🍵 🍶 🍾 🍷 🍸 🍹 🍺 🍻 🥂 🥃 🥤 🧃 🧉 🧊".split(" "),
  activities: "⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🏵️ 🎗️ 🎫 🎟️ 🎪 🤹 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🪕 🎻 🎲 ♟️ 🎯 🎳 🎮 🎰 🧩".split(" "),
  objects: "⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 🖲️ 🕹️ 🗜️ 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽️ 🎞️ 📞 ☎️ 📟 📠 📺 📻 🎙️ 🎚️ 🎛️ 🧭 ⏱️ ⏲️ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🔌 💡 🔦 🕯️ 🪔 🧯 🛢️ 💸 💵 💴 💶 💷 💰 💳 💎 ⚖️ 🧰 🔧 🔨 ⚒️ 🛠️ ⛏️ 🔩 ⚙️ 🧱 ⛓️ 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🪦 ⚱️ 🏺 🔮 📿 🧿 💈 ⚗️ 🔭 🔬 🕳️ 🩹 🩺 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡️ 🧹 🪠 🧺 🧻 🚽 🚰 🚿 🛁 🛀 🧼 🪥 🪒 🧽 🪣 🧴 🛎️ 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🛌 🧸 🪆 🖼️ 🪞 🪟 🛍️ 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🎊 🎉 🎎 🏮 🎐 🧧 ✉️ 📩 📨 📧 💌 📥 📤 📦 🏷️ 📪 📫 📬 📭 📮 📯 📜 📃 📄 📑 🧾 📊 📈 📉 🗒️ 🗓️ 📆 📅 🗑️ 📇 🗃️ 🗳️ 🗄️ 📋 📁 📂 🗂️ 🗞️ 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🧷 🔗 📎 🖇️ 📐 📏 🧮 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓".split(" "),
  symbols: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 🈶 🈚 🈸 🈺 🈷️ ✴️ 🆚 💮 🉐 ㊙️ ㊗️ 🈴 🈵 🈹 🈲 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 〽️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿ 🅿️ 🈳 🈂️ 🛂 🛃 🛄 🛅 🚹 🚺 🚼 🚻 🚮 🎦 📶 🈁 🔣 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔢 #️⃣ *️⃣ ⏏️ ▶️ ⏸️ ⏯️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ⏫ ⏬ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️ 🔀 🔁 🔂 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ ♾️ 💲 💱 ™️ ©️ ®️ 〰️ ➰ ➿ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ▪️ ▫️ ◾ ◽ ◼️ ◻️ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 👁️‍🗨️ 💬 💭 🗯️ ♠️ ♣️ ♥️ ♦️ 🃏 🎴 🀄 🕐 🕑 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛".split(" "),
  flags: "🏳️ 🏴 🏴‍☠️ 🏁 🚩 🏳️‍🌈 🇺🇳 🇦🇫 🇦🇽 🇦🇱 🇩🇿 🇦🇸 🇦🇩 🇦🇴 🇦🇮 🇦🇶 🇦🇬 🇦🇷 🇦🇲 🇦🇼 🇦🇺 🇦🇹 🇦🇿 🇧🇸 🇧🇭 🇧🇩 🇧🇧 🇧🇾 🇧🇪 🇧🇿 🇧🇯 🇧🇲 🇧🇹 🇧🇴 🇧🇦 🇧🇼 🇧🇷 🇻🇬 🇧🇳 🇧🇬 🇧🇫 🇧🇮 🇰🇭 🇨🇲 🇨🇦 🇮🇨 🇨🇻 🇧🇶 🇰🇾 🇨🇫 🇹🇩 🇮🇴 🇨🇱 🇨🇳 🇨🇽 🇨🇨 🇨🇴 🇰🇲 🇨🇬 🇨🇩 🇨🇰 🇨🇷 🇨🇮 🇭🇷 🇨🇺 🇨🇼 🇨🇾 🇨🇿 🇩🇰 🇩🇯 🇩🇲 🇩🇴 🇪🇨 🇪🇬 🇸🇻 🇬🇶 🇪🇷 🇪🇪 🇸🇿 🇪🇹 🇪🇺 🇫🇰 🇫🇴 🇫🇯 🇫🇮 🇫🇷 🇬🇫 🇵🇫 🇹🇫 🇬🇦 🇬🇲 🇬🇪 🇩🇪 🇬🇭 🇬🇮 🇬🇷 🇬🇱 🇬🇩 🇬🇵 🇬🇺 🇬🇹 🇬🇬 🇬🇳 🇬🇼 🇬🇾 🇭🇹 🇭🇳 🇭🇰 🇭🇺 🇮🇸 🇮🇳 🇮🇩 🇮🇷 🇮🇶 🇮🇪 🇮🇲 🇮🇱 🇮🇹 🇯🇲 🇯🇵 🎌 🇯🇪 🇯🇴 🇰🇿 🇰🇪 🇰🇮 🇽🇰 🇰🇼 🇰🇬 🇱🇦 🇱🇻 🇱🇧 🇱🇸 🇱🇷 🇱🇾 🇱🇮 🇱🇹 🇱🇺 🇲🇴 🇲🇬 🇲🇼 🇲🇾 🇲🇻 🇲🇱 🇲🇹 🇲🇭 🇲🇶 🇲🇷 🇲🇺 🇾🇹 🇲🇽 🇫🇲 🇲🇩 🇲🇨 🇲🇳 🇲🇪 🇲🇸 🇲🇦 🇲🇿 🇲🇲 🇳🇦 🇳🇷 🇳🇵 🇳🇱 🇳🇨 🇳🇿 🇳🇮 🇳🇪 🇳🇬 🇳🇺 🇳🇫 🇰🇵 🇲🇰 🇲🇵 🇳🇴 🇴🇲 🇵🇰 🇵🇼 🇵🇸 🇵🇦 🇵🇬 🇵🇾 🇵🇪 🇵🇭 🇵🇳 🇵🇱 🇵🇹 🇵🇷 🇶🇦 🇷🇪 🇷🇴 🇷🇺 🇷🇼 🇼🇸 🇸🇲 🇸🇹 🇸🇦 🇸🇳 🇷🇸 🇸🇨 🇸🇱 🇸🇬 🇸🇽 🇸🇰 🇸🇮 🇬🇸 🇸🇧 🇸🇴 🇿🇦 🇰🇷 🇸🇸 🇪🇸 🇱🇰 🇧🇱 🇸🇭 🇰🇳 🇱🇨 🇵🇲 🇻🇨 🇸🇩 🇸🇷 🇸🇪 🇨🇭 🇸🇾 🇹🇼 🇹🇯 🇹🇿 🇹🇭 🇹🇱 🇹🇬 🇹🇰 🇹🇴 🇹🇹 🇹🇳 🇹🇷 🇹🇲 🇹🇨 🇹🇻 🇺🇬 🇺🇦 🇦🇪 🇬🇧 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿 🇺🇸 🇺🇾 🇻🇮 🇺🇿 🇻🇺 🇻🇦 🇻🇪 🇻🇳 🇼🇫 🇪🇭 🇾🇪 🇿🇲 🇿🇼".split(" ")
};

let emojiPickerOpen = false;
let emojiCurrentCategory = "smileys";
let emojiSavedRange = null;

function setupEmojiPicker() {
  const btn = document.getElementById("emoji-btn");
  const picker = document.getElementById("emoji-picker");
  if (!btn || !picker) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (emojiPickerOpen) closeEmojiPicker();
    else openEmojiPicker();
  });

  document.addEventListener("click", (e) => {
    if (!emojiPickerOpen) return;
    if (picker.contains(e.target)) return;
    if (e.target.closest("#emoji-btn")) return;
    closeEmojiPicker();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && emojiPickerOpen) {
      closeEmojiPicker();
    }
  });

  const input = document.getElementById("message-input");
  if (input) {
    input.addEventListener("input", saveEmojiSelection);
    input.addEventListener("keyup", saveEmojiSelection);
    input.addEventListener("mouseup", saveEmojiSelection);
    input.addEventListener("blur", saveEmojiSelection);
  }
}

function saveEmojiSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const input = document.getElementById("message-input");
  if (!input || !input.contains(range.commonAncestorContainer)) return;
  emojiSavedRange = range.cloneRange();
}

function restoreEmojiSelection() {
  const input = document.getElementById("message-input");
  if (!input) return;
  input.focus();
  if (!emojiSavedRange) return;
  try {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(emojiSavedRange);
  } catch (e) { /* silent */ }
}

function openEmojiPicker() {
  emojiPickerOpen = true;
  saveEmojiSelection();
  const picker = document.getElementById("emoji-picker");
  picker.classList.remove("hidden");
  renderEmojiTabs();
  renderEmojiGrid();
}

function closeEmojiPicker() {
  emojiPickerOpen = false;
  const picker = document.getElementById("emoji-picker");
  if (picker) picker.classList.add("hidden");
}

function renderEmojiTabs() {
  const tabsEl = document.getElementById("emoji-picker-tabs");
  if (!tabsEl) return;
  const cats = [
    { id: "recent", label: "🕒" },
    { id: "smileys", label: "😀" },
    { id: "gestures", label: "👍" },
    { id: "nature", label: "🌸" },
    { id: "food", label: "🍔" },
    { id: "activities", label: "⚽" },
    { id: "objects", label: "💡" },
    { id: "symbols", label: "❤️" },
    { id: "flags", label: "🏳️" },
  ];
  tabsEl.innerHTML = cats.map((c) =>
    `<button type="button" class="emoji-tab ${emojiCurrentCategory === c.id ? "active" : ""}" data-cat="${c.id}" title="${c.id}">${c.label}</button>`
  ).join("");
  tabsEl.querySelectorAll(".emoji-tab").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      emojiCurrentCategory = b.dataset.cat;
      renderEmojiTabs();
      renderEmojiGrid();
    });
  });
}

function loadRecentEmojis() {
  try {
    const raw = localStorage.getItem(EMOJI_RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveRecentEmojis(arr) {
  try { localStorage.setItem(EMOJI_RECENT_KEY, JSON.stringify(arr)); } catch (e) { /* silent */ }
}

function addRecentEmoji(emoji) {
  const list = loadRecentEmojis().filter((x) => x !== emoji);
  list.unshift(emoji);
  if (list.length > EMOJI_MAX_RECENT) list.length = EMOJI_MAX_RECENT;
  saveRecentEmojis(list);
}

function renderEmojiGrid() {
  const grid = document.getElementById("emoji-picker-grid");
  if (!grid) return;
  let list;
  if (emojiCurrentCategory === "recent") list = loadRecentEmojis();
  else list = EMOJI_SETS[emojiCurrentCategory] || [];

  if (!list.length) {
    grid.innerHTML = `<div class="emoji-picker-empty">${escapeHtml(t("emoji.recent.empty"))}</div>`;
    return;
  }
  grid.innerHTML = list.map((em) => {
    // Все эмодзи рисуем через Twemoji — так они одинаково выглядят на всех системах
    // (Windows/Linux не имеют глифов для многих новых эмодзи — рисовались «пустые квадраты»).
    // onerror вызывает глобальный fallback, если картинки нет в Twemoji (напр. 🇨🇶 — Сарк).
    const inner = `<img class="emoji-img-inline" src="${twemojiUrl(em)}" alt="${escapeHtml(em)}" data-emoji="${escapeHtml(em)}" draggable="false" onerror="window.__emojiFallback && window.__emojiFallback(this)">`;
    return `<button type="button" class="emoji-item" data-emoji="${escapeHtml(em)}">${inner}</button>`;
  }).join("");
  grid.querySelectorAll(".emoji-item").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      insertEmoji(b.dataset.emoji);
    });
  });
}

function insertEmoji(emoji) {
  const input = document.getElementById("message-input");
  if (!input) return;
  input.focus();
  // Восстанавливаем сохранённое выделение
  if (emojiSavedRange) {
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(emojiSavedRange);
    } catch (e) { /* silent */ }
  }
  // Вставляем символ через Range — без устаревшего execCommand.
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(emoji);
  range.insertNode(node);
  range.setStartAfter(node);
  range.setEndAfter(node);
  sel.removeAllRanges();
  sel.addRange(range);
  emojiSavedRange = range.cloneRange();
  addRecentEmoji(emoji);
}

// (глобальный обработчик убран — используем inline onerror="window.__emojiFallback(this)"
// в renderEmojiGrid, он срабатывает всегда, в отличие от addEventListener("error") в capture-фазе.)

// ---- Вложения ----
const ATTACH_MAX_SIZE = 50 * 1024 * 1024; // 50 МБ
const ATTACH_MAX_FILES = 5;

function setupAttachments() {
  const btn = document.getElementById("attach-btn");
  const input = document.getElementById("attach-input");
  if (!btn || !input) return;

  btn.addEventListener("click", () => input.click());

  input.addEventListener("change", (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    // Открываем диалог предпросмотра — отправка пойдёт оттуда
    openAttachmentDialog(files);
  });

  // Инициализируем диалог предпросмотра
  setupAttachPreviewDialog();
}

function setupAboutDialog() {
  const btn = document.getElementById("about-btn");
  const overlay = document.getElementById("about-overlay");
  const closeBtn = document.getElementById("about-close");
  if (!btn || !overlay) return;

  btn.addEventListener("click", () => overlay.classList.remove("hidden"));
  if (closeBtn) closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
}

let mediaViewerList = [];   // [{ url, kind, msgId }]
let mediaViewerIndex = -1;
// Состояние зума и панорамирования
let mediaScale = 1;
let mediaTranslateX = 0;
let mediaTranslateY = 0;
let mediaIsDragging = false;
let mediaLastTap = 0;

// Панорамирование одним пальцем
let mediaDragStartX = 0;
let mediaDragStartY = 0;
let mediaDragStartTranslateX = 0;
let mediaDragStartTranslateY = 0;

// Пинч-зум
let mediaPinchStartDist = 0;
let mediaPinchStartScale = 1;
let mediaPinchStartMidX = 0;
let mediaPinchStartMidY = 0;
let mediaPinchStartPointX = 0;   // точка контента под midpoint (в координатах контента)
let mediaPinchStartPointY = 0;

// 🔴 Флаг активного pinch-зума. Пока true — обработчики overlay (touchend/pointerup)
// игнорируют события, иначе отпускание пальцев после pinch закрывает просмотрщик.
let mediaPinchActive = false;
let mediaPinchEndTimer = null;

// Ограничивает смещение так, чтобы фото не улетало за экран
function clampMediaTranslate() {
  const content = document.getElementById("media-viewer-content");
  const body = document.getElementById("media-viewer-body");
  if (!content || !body) return;
  const media = content.querySelector("img, video");
  if (!media) return;
  // offsetWidth/Height — размеры БЕЗ учёта transform, то есть натуральные.
  const W = media.offsetWidth || 0;
  const H = media.offsetHeight || 0;
  if (!W || !H) return;
  const vw = body.clientWidth;
  const vh = body.clientHeight;
  const maxTX = Math.max(0, (W * mediaScale - vw) / 2);
  const maxTY = Math.max(0, (H * mediaScale - vh) / 2);
  mediaTranslateX = Math.max(-maxTX, Math.min(maxTX, mediaTranslateX));
  mediaTranslateY = Math.max(-maxTY, Math.min(maxTY, mediaTranslateY));
}

function applyMediaTransform() {
  const content = document.getElementById("media-viewer-content");
  if (!content) return;
  content.style.transform = `translate(${mediaTranslateX}px, ${mediaTranslateY}px) scale(${mediaScale})`;
}

function resetMediaTransform() {
  mediaScale = 1;
  mediaTranslateX = 0;
  mediaTranslateY = 0;
  const content = document.getElementById("media-viewer-content");
  if (content) {
    // Плавный возврат — только для сброса, не для активного жеста.
    content.style.transition = "transform 0.22s ease-out";
    applyMediaTransform();
    clearTimeout(content._resetTimer);
    content._resetTimer = setTimeout(() => {
      if (content) content.style.transition = "";
    }, 240);
  } else {
    applyMediaTransform();
  }
}

function setupMediaViewer() {
  const overlay = document.getElementById("media-viewer");
  const body = document.getElementById("media-viewer-body");
  const closeBtn = document.getElementById("media-viewer-close");
  const prevBtn = document.getElementById("media-viewer-prev");
  const nextBtn = document.getElementById("media-viewer-next");
  if (!overlay || !body) return;

  // --- ЗУМ И ПАНОРАМИРОВАНИЕ ---
  // 1. Ctrl + колесико (ПК). Слушаем на window в capture-фазе:
  //    — так ловим Ctrl+wheel в любой точке экрана, пока открыт просмотрщик
  //      (и над фото, и над чёрным фоном вокруг);
  //    — так гасим браузерный «pinch-zoom страницы» раньше, чем Chrome
  //      успевает его обработать.
  window.addEventListener("wheel", (e) => {
    const overlayEl = document.getElementById("media-viewer");
    if (!overlayEl || overlayEl.classList.contains("hidden")) return;
    if (!e.ctrlKey) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    mediaScale = Math.max(1, Math.min(5, mediaScale + delta));
    applyMediaTransform();
  }, { passive: false, capture: true });

  // 2. Пинч-зум и панорамирование (тач)
  body.addEventListener("touchstart", (e) => {
    const content = document.getElementById("media-viewer-content");
    if (e.touches.length === 2) {
      // Pinch start — запоминаем всё, что нужно для anchor-зума.
      mediaPinchActive = true;
      if (mediaPinchEndTimer) { clearTimeout(mediaPinchEndTimer); mediaPinchEndTimer = null; }
      e.stopPropagation();
      // Отключаем CSS-переход, пока идёт активный жест — иначе лаг и «прыжки».
      if (content) content.style.transition = "none";

      const bodyRect = body.getBoundingClientRect();
      const cx = bodyRect.left + bodyRect.width / 2;
      const cy = bodyRect.top + bodyRect.height / 2;

      const t0 = e.touches[0], t1 = e.touches[1];
      mediaPinchStartDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY) || 1;
      mediaPinchStartScale = mediaScale;
      mediaPinchStartMidX = (t0.clientX + t1.clientX) / 2;
      mediaPinchStartMidY = (t0.clientY + t1.clientY) / 2;
      // Точка контента, которая сейчас под midpoint (в координатах контента
      // относительно его центра). Её мы удержим на месте при зуме.
      mediaPinchStartPointX =
        (mediaPinchStartMidX - cx - mediaTranslateX) / mediaScale;
      mediaPinchStartPointY =
        (mediaPinchStartMidY - cy - mediaTranslateY) / mediaScale;
    } else if (e.touches.length === 1) {
      // Pan start
      if (content) content.style.transition = "none";
      mediaDragStartX = e.touches[0].clientX;
      mediaDragStartY = e.touches[0].clientY;
      mediaDragStartTranslateX = mediaTranslateX;
      mediaDragStartTranslateY = mediaTranslateY;
      mediaIsDragging = true;
    }
  }, { passive: true });

  body.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const bodyRect = body.getBoundingClientRect();
      const cx = bodyRect.left + bodyRect.width / 2;
      const cy = bodyRect.top + bodyRect.height / 2;

      const t0 = e.touches[0], t1 = e.touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const ratio = dist / mediaPinchStartDist;
      const newScale = Math.max(1, Math.min(5, mediaPinchStartScale * ratio));
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      // 🔴 Anchor-зум: точка под пальцами остаётся под пальцами.
      mediaScale = newScale;
      mediaTranslateX = midX - cx - mediaPinchStartPointX * newScale;
      mediaTranslateY = midY - cy - mediaPinchStartPointY * newScale;
      // 🔴 Плавно гасим остаточное смещение при стремлении scale к 1.
      // Иначе при отдалении фото «уползает» от центра (особенно по
      // вертикали), потому что midpoint пальцев обычно не совпадает с
      // центром экрана. При scale ≥ 1.4 коэффициент = 1 (anchor
      // работает полностью), при scale = 1 смещение = 0.
      if (newScale < 1.4) {
        const t = Math.max(0, (newScale - 1) / 0.4);
        mediaTranslateX *= t;
        mediaTranslateY *= t;
      }
      clampMediaTranslate();
      applyMediaTransform();
    } else if (e.touches.length === 1 && mediaIsDragging) {
      if (mediaScale > 1) {
        e.preventDefault();
        e.stopPropagation();
        mediaTranslateX = mediaDragStartTranslateX + (e.touches[0].clientX - mediaDragStartX);
        mediaTranslateY = mediaDragStartTranslateY + (e.touches[0].clientY - mediaDragStartY);
        clampMediaTranslate();
        applyMediaTransform();
      }
    }
  }, { passive: false });

  body.addEventListener("touchend", (e) => {
    if (mediaPinchActive) e.stopPropagation();

    if (e.touches.length === 1) {
      // Переход «2 пальца → 1 палец»: пересобираем стартовые точки, иначе
      // фото «прыгает» на старую позицию.
      mediaDragStartX = e.touches[0].clientX;
      mediaDragStartY = e.touches[0].clientY;
      mediaDragStartTranslateX = mediaTranslateX;
      mediaDragStartTranslateY = mediaTranslateY;
      mediaIsDragging = true;
    }

    if (e.touches.length === 0) {
      mediaIsDragging = false;
      const content = document.getElementById("media-viewer-content");
      if (content) content.style.transition = "transform 0.1s ease-out";

      // Если вернулись к масштабу 1 — плавно центрируем.
      if (mediaScale <= 1.05) {
        resetMediaTransform();
      } else {
        // Иначе — мягко подтягиваем в допустимые границы.
        clampMediaTranslate();
        applyMediaTransform();
      }

      // Снимаем флаг pinch с задержкой, чтобы «хвостовые» touchend/pointerup
      // того же жеста тоже были проигнорированы.
      if (mediaPinchActive) {
        if (mediaPinchEndTimer) clearTimeout(mediaPinchEndTimer);
        mediaPinchEndTimer = setTimeout(() => {
          mediaPinchActive = false;
          mediaPinchEndTimer = null;
        }, 350);
      }
    }
  });

  // 3. Перетаскивание мышью (ПК) при увеличении
  body.addEventListener("mousedown", (e) => {
    if (mediaScale <= 1) return;
    const content = document.getElementById("media-viewer-content");
    if (content) content.style.transition = "none";
    mediaIsDragging = true;
    mediaDragStartX = e.clientX;
    mediaDragStartY = e.clientY;
    mediaDragStartTranslateX = mediaTranslateX;
    mediaDragStartTranslateY = mediaTranslateY;
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!mediaIsDragging || mediaScale <= 1) return;
    mediaTranslateX = mediaDragStartTranslateX + (e.clientX - mediaDragStartX);
    mediaTranslateY = mediaDragStartTranslateY + (e.clientY - mediaDragStartY);
    clampMediaTranslate();
    applyMediaTransform();
  });

  window.addEventListener("mouseup", () => {
    if (mediaIsDragging) {
      mediaIsDragging = false;
      const content = document.getElementById("media-viewer-content");
      if (content) content.style.transition = "transform 0.1s ease-out";
    }
  });

  // 4. Двойной тап/клик — сброс зума
  body.addEventListener("click", (e) => {
    const now = Date.now();
    if (now - mediaLastTap < 300) {
      if (mediaScale > 1) {
        resetMediaTransform();
      } else {
        mediaScale = 2.5;
        applyMediaTransform();
      }
      mediaLastTap = 0;
      return;
    }
    mediaLastTap = now;
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMediaViewer();
  });

  // Тап по свободной зоне (не по картинке/видео) — закрыть.
  // Используем pointerdown/up с проверкой маленького смещения, чтобы
  // не конфликтовать со свайпами.
  let tapStartX = 0, tapStartY = 0, tapStartAt = 0;
  overlay.addEventListener("pointerdown", (e) => {
    tapStartX = e.clientX;
    tapStartY = e.clientY;
    tapStartAt = Date.now();
  });
  overlay.addEventListener("pointerup", (e) => {
    // 🔴 Если активен pinch-зум — не закрываем просмотрщик по pointerup.
    if (mediaPinchActive) return;
    // Тап — только если это не движение и мышь/палец не двигались
    if (Math.abs(e.clientX - tapStartX) > 8) return;
    if (Math.abs(e.clientY - tapStartY) > 8) return;
    if (Date.now() - tapStartAt > 500) return;
    // Клик по кнопкам — не трогаем (у них свои обработчики с stopPropagation)
    if (e.target.closest("button")) return;
    // Клик по содержимому (картинка/видео) — не трогаем
    if (e.target.closest("#media-viewer-body img, #media-viewer-body video")) return;
    closeMediaViewer();
  });

  if (prevBtn) prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    mediaViewerNavigate(-1);
  });
  if (nextBtn) nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    mediaViewerNavigate(1);
  });

  // 🔴 Свайпы: вертикальный — закрыть, горизонтальный — переключить.
  // Работает только на тач-устройствах (pointer: coarse), на ПК
  // остаются стрелки и Esc.
  let touchStartX = 0, touchStartY = 0, touchStartAt = 0;
  let swipeMoved = false;

  overlay.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartAt = Date.now();
    swipeMoved = false;
    // Снимаем возможный остаточный transform с прошлого жеста
    const media = body.querySelector("img, video");
    if (media) {
      media.style.transition = "none";
      media.style.transform = "";
      media.style.opacity = "";
    }
  }, { passive: true });

  overlay.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) swipeMoved = true;

    const media = body.querySelector("img, video");
    if (!media) return;

    // Вертикальный свайп — двигаем и гасим прозрачность (уезжает)
    if (Math.abs(dy) > Math.abs(dx)) {
      media.style.transform = `translateY(${dy}px) scale(${Math.max(0.7, 1 - Math.abs(dy) / 800)})`;
      media.style.opacity = String(Math.max(0.2, 1 - Math.abs(dy) / 400));
    } else {
      // Горизонтальный — лёгкий сдвиг без «прыжка»
      media.style.transform = `translateX(${dx * 0.35}px)`;
      media.style.opacity = "";
    }
  }, { passive: true });

  overlay.addEventListener("touchend", (e) => {
    // 🔴 Если активен pinch-зум — игнорируем touchend полностью,
    // иначе отпускание пальцев после pinch закроет просмотрщик.
    if (mediaPinchActive) return;
    if (e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchStartAt;
    const media = body.querySelector("img, video");
    if (media) {
      media.style.transition = "transform 0.22s ease, opacity 0.22s ease";
      media.style.transform = "";
      media.style.opacity = "";
    }

    // Быстрый тап — не реагируем (пойдёт через pointerup-handler).
    if (!swipeMoved && dt < 300) return;

    const ABS_X = 50;
    const ABS_Y = 100;

    // Свайп вниз/вверх → закрыть
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > ABS_Y) {
      closeMediaViewer();
      return;
    }

    // Свайп влево/вправо → переключить
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > ABS_X) {
      if (dx < 0) mediaViewerNavigate(1);
      else mediaViewerNavigate(-1);
    }
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (overlay.classList.contains("hidden")) return;
    if (e.key === "Escape") { e.preventDefault(); closeMediaViewer(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); mediaViewerNavigate(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); mediaViewerNavigate(1); }
  });
}

// Собирает все медиа текущего открытого чата в порядке следования сообщений
function collectChatMedia() {
  const result = [];
  document.querySelectorAll("#messages .msg").forEach((el) => {
    const m = msgCache.get(el.dataset.id);
    if (!m) return;
    if (m.message_type === "attachment" && (m.file_kind === "image" || m.file_kind === "video")) {
      // Берём РЕАЛЬНЫЙ URL из DOM (там уже signed URL), а не из msgCache (там сырой URL из БД)
      const mediaEl = el.querySelector("[data-media-url]");
      const realUrl = mediaEl
        ? (mediaEl.dataset.mediaUrl || mediaEl.src || mediaEl.getAttribute("src"))
        : m.image_url;
      if (realUrl) {
        result.push({ url: realUrl, kind: m.file_kind, msgId: m.id });
      }
    }
  });
  return result;
}

function openMediaViewer(url, kind, mediaList, startIndex) {
  const overlay = document.getElementById("media-viewer");
  const body = document.getElementById("media-viewer-body");
  if (!overlay || !body) return;

  if (mediaList && mediaList.length) {
    mediaViewerList = mediaList;
    mediaViewerIndex = (startIndex >= 0 && startIndex < mediaList.length) ? startIndex : 0;
  } else {
    mediaViewerList = [{ url, kind, msgId: null }];
    mediaViewerIndex = 0;
  }

  renderMediaViewer();
  overlay.classList.remove("hidden");
}

function renderMediaViewer() {
  const body = document.getElementById("media-viewer-body");
  const content = document.getElementById("media-viewer-content");
  const prevBtn = document.getElementById("media-viewer-prev");
  const nextBtn = document.getElementById("media-viewer-next");
  if (!body || !content) return;

  document.querySelectorAll("#media-viewer video").forEach((v) => {
    try { v.pause(); } catch (e) {}
  });
  content.innerHTML = "";
  resetMediaTransform();

  const cur = mediaViewerList[mediaViewerIndex];
  if (!cur) { closeMediaViewer(); return; }

  if (cur.kind === "video") {
    const v = document.createElement("video");
    v.src = cur.url;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.onerror = () => {
      content.innerHTML = `<div style="color:#fff;font-size:16px;text-align:center;padding:20px;">${escapeHtml(t("media.loadVideoFailed"))}<br><span style="font-size:13px;opacity:0.7;">${escapeHtml(t("media.loadVideoFailedHint"))}</span></div>`;
    };
    content.appendChild(v);
  } else {
    const img = document.createElement("img");
    img.src = cur.url;
    img.alt = "";
    img.onerror = () => {
      content.innerHTML = `<div style="color:#fff;font-size:16px;text-align:center;padding:20px;">${escapeHtml(t("media.loadImageFailed"))}<br><span style="font-size:13px;opacity:0.7;">${escapeHtml(t("media.loadImageFailedHint"))}</span></div>`;
    };
    content.appendChild(img);
  }

  if (prevBtn) prevBtn.classList.toggle("hidden", mediaViewerIndex <= 0);
  if (nextBtn) nextBtn.classList.toggle("hidden", mediaViewerIndex >= mediaViewerList.length - 1);
}

function mediaViewerNavigate(dir) {
  const next = mediaViewerIndex + dir;
  if (next < 0 || next >= mediaViewerList.length) return;
  mediaViewerIndex = next;
  renderMediaViewer();
}

function closeMediaViewer() {
  const overlay = document.getElementById("media-viewer");
  const content = document.getElementById("media-viewer-content");
  if (!overlay || !content) return;
  content.querySelectorAll("video").forEach((v) => {
    try { v.pause(); } catch (e) {}
  });
  // 🔴 Чистим СОДЕРЖИМОЕ контейнера, а не сам контейнер — иначе
  // #media-viewer-content удалится, и при следующем открытии
  // renderMediaViewer не найдёт его и фото не отрисуется.
  content.innerHTML = "";
  overlay.classList.add("hidden");
  mediaViewerList = [];
  mediaViewerIndex = -1;
  resetMediaTransform();
}

function detectFileKind(file) {
  const t = file.type || "";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  return "file";
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " МБ";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " ГБ";
}

// Кэш signed URL: path -> { url, expiresAt }
const signedUrlCache = new Map();

// Извлекает путь файла внутри bucket из публичной URL (старой или новой)
function extractStoragePath(url) {
  if (!url) return null;
  const m = /\/storage\/v1\/object\/(?:public|sign)\/attachments\/([^?]+)/.exec(url);
  return m ? decodeURIComponent(m[1]) : null;
}

// Получает signed URL для пути (с кэшем ~55 минут)
async function getSignedUrl(url) {
  if (!url) return null;
  const path = extractStoragePath(url);
  if (!path) return url; // не наш bucket — отдаём как есть

  const now = Date.now();
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > now + 60 * 1000) return cached.url;

  try {
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(path, 3600); // 1 час
    if (error || !data || !data.signedUrl) return url;
    const signedUrl = rewriteSupabaseUrl(data.signedUrl);
    signedUrlCache.set(path, { url: signedUrl, expiresAt: now + 55 * 60 * 1000 });
    return signedUrl;
  } catch (e) {
    return url;
  }
}

// 🔴 Ленивая загрузка зашифрованного вложения: сначала placeholder,
// потом асинхронно скачиваем + расшифровываем + подменяем в DOM.
// Критично для скорости открытия чата с E2EE-вложениями.
async function lazyLoadEncryptedAttachment(placeholderId, msg) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  let displayUrl = null;
  try {
    displayUrl = await getDecryptedFileUrl(msg);
  } catch (e) {
    displayUrl = null;
  }

  const el = document.getElementById(placeholderId);
  if (!el) return;

  if (!displayUrl) {
    el.outerHTML = `<div class="msg-attachment-uploading" style="max-width:260px;display:block;text-align:center;line-height:1.4;">
      ${t("attach.encryptedBlocked")}
    </div>`;
    return;
  }

  const kind = msg.file_kind || "file";
  const name = msg.file_name || "файл";
  const size = msg.file_size || 0;
  let html;
  if (kind === "image") {
    html = `<img src="${escapeHtml(displayUrl)}" class="msg-attachment-image" alt="" data-media-url="${escapeHtml(displayUrl)}" data-media-kind="image" data-att-msg-id="${msg.id}">`;
  } else if (kind === "video") {
    html = `<video src="${escapeHtml(displayUrl)}" class="msg-attachment-video" controls preload="metadata" data-media-url="${escapeHtml(displayUrl)}" data-media-kind="video" data-att-msg-id="${msg.id}"></video>`;
  } else {
    html = `<a class="msg-attachment-file" href="${escapeHtml(displayUrl)}" target="_blank" rel="noopener" download="${escapeHtml(name)}">
      <span class="maf-icon"><span class="cell-icon" data-icon="attach"></span></span>
      <span style="flex:1;min-width:0;">
        <span class="maf-name">${escapeHtml(name)}</span>
        <span class="maf-size">${escapeHtml(formatFileSize(size))}</span>
      </span>
    </a>`;
  }
  el.outerHTML = html;
}
window.lazyLoadEncryptedAttachment = lazyLoadEncryptedAttachment;

async function buildAttachmentHtml(msg) {
  const url = msg.image_url || "";
  const name = msg.file_name || "файл";
  const size = msg.file_size || 0;
  const kind = msg.file_kind || "file";
  if (!url) {
    return `<div class="msg-attachment-uploading">${escapeHtml(t("attach.loadingShort"))}</div>`;
  }

  const isEncryptedFile = !!(msg.file_key_enc && msg.file_iv);

  // 🔴 Зашифрованные файлы — ленивая загрузка. Не блокируем рендер чата.
  if (isEncryptedFile) {
    const placeholderId = "att-" + msg.id + "-" + Math.random().toString(36).slice(2, 8);
    setTimeout(() => { lazyLoadEncryptedAttachment(placeholderId, msg); }, 0);
    if (kind === "image" || kind === "video") {
      return `<div id="${placeholderId}" class="msg-attachment-uploading" style="width:200px;height:140px;display:flex;align-items:center;justify-content:center;">${escapeHtml(t("attach.encryptedLoading"))}</div>`;
    }
    return `<div id="${placeholderId}" class="msg-attachment-uploading">${escapeHtml(t("attach.encryptedLoadingFile"))}</div>`;
  }

  // Незашифрованные — сразу. Signed URL уже в кэше (batch-prefetch).
  const displayUrl = await getSignedUrl(url);
  if (!displayUrl) {
    return `<div class="msg-attachment-uploading">${escapeHtml(t("attach.loadingShort"))}</div>`;
  }

  if (kind === "image") {
    return `<img src="${escapeHtml(displayUrl)}" class="msg-attachment-image" alt="" data-media-url="${escapeHtml(displayUrl)}" data-media-kind="image" data-att-msg-id="${msg.id}">`;
  }
  if (kind === "video") {
    return `<video src="${escapeHtml(displayUrl)}" class="msg-attachment-video" controls preload="metadata" data-media-url="${escapeHtml(displayUrl)}" data-media-kind="video" data-att-msg-id="${msg.id}"></video>`;
  }
  return `<a class="msg-attachment-file" href="${escapeHtml(displayUrl)}" target="_blank" rel="noopener" download="${escapeHtml(name)}">
    <span class="maf-icon"><span class="cell-icon" data-icon="attach"></span></span>
    <span style="flex:1;min-width:0;">
      <span class="maf-name">${escapeHtml(name)}</span>
      <span class="maf-size">${escapeHtml(formatFileSize(size))}</span>
    </span>
  </a>`;
}

// Перебирает все вложения в текущем чате и обновляет src, если URL протух
// или не загрузился при первом рендере. Вызывается по требованию и после
// восстановления соединения.
async function refreshAttachmentUrls() {
  const nodes = document.querySelectorAll(
    "#messages [data-att-msg-id]"
  );
  for (const el of nodes) {
    const msgId = el.dataset.attMsgId;
    const msg = msgCache.get(msgId);
    if (!msg) continue;
    // Если элемент уже отрисован — но src пустой или равен "#"
    const curSrc = el.tagName === "IMG" ? el.src : (el.src || el.getAttribute("src") || "");
    if (curSrc && curSrc !== "#" && !curSrc.startsWith("data:")) {
      // Уже что-то стоит — проверим, загрузилось ли
      if (el.tagName === "IMG" && el.complete && el.naturalWidth > 0) continue;
    }
    // Готовим URL заново
    let newUrl = null;
    if (msg.file_key_enc && msg.file_iv) {
      newUrl = await getDecryptedFileUrl(msg);
    } else {
      newUrl = await getSignedUrl(msg.image_url);
    }
    if (newUrl && newUrl !== el.src) {
      el.src = newUrl;
      el.dataset.mediaUrl = newUrl;
    }
  }
}
window.refreshAttachmentUrls = refreshAttachmentUrls;

async function handleAttachments(files, caption, asFile) {
  if (currentChannelObj) {
    const isOwner = currentChannelObj.owner_id === currentUser.id;
    const canWrite = isOwner || (currentChannelIsSubscribed && currentChannelIsAdmin);
    if (!canWrite) {
      await showAlertDialog(t("gifts.error"), t("channel.sub.cantWrite"));
      return;
    }
  }
  if (currentOtherUser && (isBlockedByMe(currentOtherUser.id) || hasBlockedMe(currentOtherUser.id))) {
    await showAlertDialog(t("alert.notSent"), t("alert.notSentAttachment"));
    return;
  }
  if (files.length > ATTACH_MAX_FILES) {
    await showAlertDialog(
      t("attach.tooMany"),
      tFmt("attach.tooManyText", { n: ATTACH_MAX_FILES })
    );
    return;
  }
  for (const f of files) {
    if (f.size > ATTACH_MAX_SIZE) {
      await showAlertDialog(
        t("attach.tooBig"),
        tFmt("attach.tooBigText", { name: f.name, size: formatFileSize(ATTACH_MAX_SIZE) })
      );
      return;
    }
  }

  // Если чата ещё нет (новый DM) — создаём
  if (!currentChatId && currentOtherUser) {
    const chatId = await createChatWith(currentOtherUser.id);
    if (!chatId) return;
    currentChatId = chatId;
    pendingOtherUser = null;
    document.getElementById("messages").innerHTML = "";
    subscribeToChat(chatId);
    subscribeToReactions();
  }
  if (!currentChatId) return;

  const cap = (caption || "").trim();
  for (let i = 0; i < files.length; i++) {
    await uploadAndSendAttachment(files[i], currentChatId, i === 0 ? cap : "", !!asFile);
  }
}

async function uploadAndSendAttachment(file, chatId, caption, asFile) {
  const detected = detectFileKind(file);
  const kind = asFile ? "file" : detected;
  caption = caption || "";
  const rawExt = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = rawExt.slice(0, 8) || "bin";
  const path = `${currentUser.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const tempId = "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  const tempMsg = {
    id: tempId, chat_id: chatId, sender_id: currentUser.id,
    content: caption, created_at: new Date().toISOString(),
    message_type: "attachment",
    image_url: null,
    file_name: file.name,
    file_size: file.size,
    file_mime: file.type,
    file_kind: kind,
    delivered_at: null, read_at: null,
  };
  msgCache.set(tempId, tempMsg);
  await appendMessage(tempMsg);
  scrollToBottom();

  // Читаем файл в ArrayBuffer (нужен и для шифрования, и для загрузки как есть)
  let originalBuffer;
  try {
    originalBuffer = await file.arrayBuffer();
  } catch (ex) {
    const tempElRead = document.querySelector(`[data-id="${tempId}"]`);
    if (tempElRead) tempElRead.remove();
    msgCache.delete(tempId);
    await showAlertDialog(t("attach.err.readTitle"), ex.message || String(ex));
    return;
  }

  // Шифруем (если E2EE доступно)
  const enc = await encryptOutgoingFile(chatId, originalBuffer);
  const uploadBuffer = enc.encryptedBuffer;

  let upErr = null;
  try {
    const res = await supabase.storage.from("attachments").upload(path, uploadBuffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: enc.encrypted ? "application/octet-stream" : (file.type || "application/octet-stream"),
    });
    upErr = res.error;
  } catch (ex) {
    upErr = ex;
  }

  const tempEl = document.querySelector(`[data-id="${tempId}"]`);

  if (upErr) {
    if (tempEl) tempEl.remove();
    msgCache.delete(tempId);
    await showAlertDialog(t("attach.err.uploadTitle"), upErr.message || String(upErr));
    return;
  }

  // Для приватного bucket сохраняем "маршрутный" URL без токена.
  // Реальный signed URL генерируется при отображении через getSignedUrl().
  const url = `${SUPABASE_URL}/storage/v1/object/public/attachments/${path}`;

  const payload = {
    chat_id: chatId,
    sender_id: currentUser.id,
    content: caption || "",
    message_type: "attachment",
    image_url: url,
    file_name: file.name,
    file_size: file.size,
    file_mime: file.type,
    file_kind: kind,
  };
  if (enc.encrypted) {
    payload.encrypted = true;
    payload.file_iv = enc.ivB64;
    payload.file_key_enc = enc.fileKeyEnc;
  }
  if (replyToMsg) payload.reply_to_id = replyToMsg.id;
  cancelReply();

  let result;
  try {
    result = await supabase.from("messages").insert(payload).select().single();
  } catch (ex) {
    result = { error: ex };
  }
  const { data, error } = result;

  if (tempEl) tempEl.remove();
  msgCache.delete(tempId);

  if (error) {
    await showAlertDialog(t("attach.err.notSent"), error.message || t("attach.err.network"));
    return;
  }

  await appendMessage(data);
  scrollToBottom();

  let preview = kind === "image" ? t("preview.photo") : kind === "video" ? t("preview.video") : t("preview.file");
  if (caption) preview = caption.slice(0, 60);
  chatLastMsg.set(chatId, {
    text: preview, time: new Date(data.created_at).getTime(),
    senderId: currentUser.id, unread: 0,
  });
  updateChatItemPreview(chatId);
  resortChatsList();
  bringChatToTop(chatId);
}

document.getElementById("composer").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (currentOtherUser && (isBlockedByMe(currentOtherUser.id) || hasBlockedMe(currentOtherUser.id))) {
    await showAlertDialog(t("alert.notSent"), t("alert.notSentBlocked"));
    return;
  }

  const content = getInputText();
  if (!content) return;

  // Режим редактирования
  if (editingMsgId) {
    // E2EE: шифруем отредактированный текст
    const { content: editContent, encrypted: editEnc } = await encryptOutgoingText(currentChatId, content);
    const { error } = await supabase.from("messages")
      .update({ content: editContent, encrypted: editEnc, edited_at: new Date().toISOString() }).eq("id", editingMsgId);
    if (!error) {
      // Обновляем кэш расшифровки
      decryptedCache.set(editingMsgId, content);
    }
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    clearInput();
    cancelEdit();
    return;
  }

  // Если чата ещё нет — создаём при первом сообщении
  if (!currentChatId && currentOtherUser) {
    clearInput();
    const chatId = await createChatWith(currentOtherUser.id);
    if (!chatId) { await showAlertDialog(t("alert.error"), t("alert.createChatFail")); return; }
    currentChatId = chatId;
    pendingOtherUser = null;
    document.getElementById("messages").innerHTML = "";
    subscribeToChat(chatId);
    subscribeToReactions();
    await sendMessage(chatId, content);
    return;
  }

  if (!currentChatId) return;
  clearInput();
  await sendMessage(currentChatId, content);
});

async function sendMessage(chatId, content) {
  // Защита: если chatId — это канал, отправка возможна только когда он открыт
  // и только владельцем или подписанным админом
  const isKnownChannel = channelCache.has(chatId);
  if (isKnownChannel) {
    if (!currentChannelObj || currentChannelObj.id !== chatId) {
      console.error("sendMessage: попытка отправить в канал без его открытия", chatId);
      return;
    }
    const isOwner = currentChannelObj.owner_id === currentUser.id;
    const canWrite = isOwner || (currentChannelIsSubscribed && currentChannelIsAdmin);
    if (!canWrite) {
      await showAlertDialog(t("gifts.error"), t("channel.sub.cantWrite"));
      return;
    }
  }
  const tempId = "tmp_" + Date.now();
  const tempMsg = {
    id: tempId, chat_id: chatId, sender_id: currentUser.id,
    content, created_at: new Date().toISOString(),
    message_type: "text", delivered_at: null, read_at: null,
  };
  msgCache.set(tempId, tempMsg);
  await appendMessage(tempMsg);
  scrollToBottom();

  // E2EE: шифруем текст (если возможно)
  const { content: outContent, encrypted: outEncrypted } = await encryptOutgoingText(chatId, content);

  const payload = {
    chat_id: chatId,
    sender_id: currentUser.id,
    content: outContent,
    encrypted: outEncrypted,
  };
  if (replyToMsg) payload.reply_to_id = replyToMsg.id;
  cancelReply();

  let result;
  try {
    result = await supabase.from("messages").insert(payload).select().single();
  } catch (ex) {
    result = { error: ex };
  }
  const { data, error } = result;

  const tempEl = document.querySelector(`.msg[data-id="${tempId}"]`);
  if (tempEl) tempEl.remove();
  msgCache.delete(tempId);

  if (error) {
    await showAlertDialog(t("attach.err.notSent"), error.message || t("attach.err.network"));
    return;
  }

  await appendMessage(data);
  scrollToBottom();

  // Обновляем превью в списке чатов
  chatLastMsg.set(chatId, {
    text: content, time: new Date(data.created_at).getTime(),
    senderId: currentUser.id, unread: 0,
  });
  updateChatItemPreview(chatId);
  resortChatsList();
  bringChatToTop(chatId);

  // Если это канал — сразу помечаем свой просмотр (баг №1)
  if (currentChannelObj && currentChannelObj.id === chatId) {
    try {
      await supabase.rpc("mark_message_viewed", { p_message_id: data.id });
      const { data: counts } = await supabase.rpc("get_message_view_counts", { p_message_ids: [data.id] });
      const v = (counts && counts[0]) || null;
      const cnt = v ? Number(v.views) || 0 : 1;
      currentChannelViewsMap.set(data.id, cnt);
      updateMessageViewsInUI(data.id, cnt);
    } catch (e) { console.warn("mark own view:", e); }
  }

  const inputEl = document.getElementById("message-input");
  if (inputEl) inputEl.style.height = "auto";
}

// ======================================================
// 16. REALTIME СООБЩЕНИЙ
// ======================================================

function subscribeToChat(chatId) {
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  currentChannel = supabase.channel("chat-" + chatId)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      async (payload) => {
        const m = payload.new;
        if (!m || m.chat_id !== currentChatId) return;
        // Дедуп по DOM и по «брони»: если сообщение уже добавлено или прямо
        // сейчас рендерится — пропускаем.
        if (document.querySelector(`[data-id="${m.id}"]`)) return;
        if (pendingMsgRenders.has(m.id)) return;
        // Скроллим вниз только если пользователь уже был у низа —
        // иначе он читает историю наверху, и не надо его дёргать.
        const box = document.getElementById("messages");
        const wasNearBottom = box
          ? (box.scrollHeight - box.scrollTop - box.clientHeight < 200)
          : true;
        await appendMessage(m);
        if (wasNearBottom) scrollToBottom();
        // Если у сообщения есть вложение — проверим URL ещё раз через полсекунды
        if (m.message_type === "attachment") {
          setTimeout(() => { refreshAttachmentUrls().catch(() => {}); }, 600);
        }
        if (currentChannelObj) {
          if (currentChannelIsSubscribed) markChatRead(chatId);
          if (m.sender_id !== currentUser.id) {
            const { data: total, error: mvErr } = await supabase.rpc("mark_message_viewed", { p_message_id: m.id });
            if (mvErr) console.error("mark_message_viewed (rt):", mvErr);
            if (total !== null && total !== undefined) {
              const cnt = Number(total) || 0;
              currentChannelViewsMap.set(m.id, cnt);
              updateMessageViewsInUI(m.id, cnt);
            }
          }
        } else {
          markChatRead(chatId);
        }
      })
    .on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        const m = payload.new;
        if (!m) return;
        const old = msgCache.get(m.id);
        if (!old) return;
        const contentChanged = old.content !== m.content || old.edited_at !== m.edited_at;
        msgCache.set(m.id, { ...old, ...m });
        if (contentChanged) updateMessageInUI(m);
        else updateMessageStatusInUI(m);
      })
    .on("postgres_changes",
      // 🔴 Без filter: при REPLICA IDENTITY DEFAULT payload.old содержит только id,
      // и filter по chat_id не даёт серверу отсеять — событие не доходит. Поэтому
      // ловим ВСЕ удаления и фильтруем сами по msgCache.
      { event: "DELETE", schema: "public", table: "messages" },
      (payload) => {
        const id = payload.old && payload.old.id;
        if (!id) return;
        const cached = msgCache.get(id);
        // Не наше сообщение — просто пробуем снять DOM (мог остаться от preview)
        if (!cached) {
          const el0 = document.querySelector(`[data-id="${id}"]`);
          if (el0) el0.remove();
          return;
        }
        // Относится к другому чату — игнор
        if (cached.chat_id && cached.chat_id !== currentChatId) return;
        msgCache.delete(id); reactionsCache.delete(id);
        subtractViewsForDeletedMessage(id);
        const pinIdx = currentPinnedList.findIndex((p) => p.message_id === id);
        if (pinIdx !== -1) {
          currentPinnedList.splice(pinIdx, 1);
          if (currentPinnedIndex >= currentPinnedList.length) currentPinnedIndex = currentPinnedList.length - 1;
          renderPinBar();
          updatePinButtonCount(currentPinnedList.length);
        }
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) el.remove();
        checkEmptyChat();
        refreshMessageGroups();
      })
    .subscribe();
}

// ======================================================
// 17. REALTIME РЕАКЦИЙ
// ======================================================

function subscribeToReactions() {
  if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
  reactionsChannel = supabase.channel("reactions-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => {
      clearTimeout(reactionsRefreshTimer);
      reactionsRefreshTimer = setTimeout(() => loadReactionsForVisibleMessages(), 120);
    }).subscribe();
}

function renderReactionsUI(msgId) {
  const container = document.querySelector(`.msg-reactions[data-reactions-for="${msgId}"]`);
  if (!container) return;
  const list = reactionsCache.get(msgId) || [];
  if (!list.length) { container.innerHTML = ""; return; }
  const grouped = new Map();
  list.forEach((r) => {
    if (!grouped.has(r.emoji)) grouped.set(r.emoji, { count: 0, mine: false });
    const g = grouped.get(r.emoji);
    g.count++;
    if (r.user_id === currentUser.id) g.mine = true;
  });
  container.innerHTML = [...grouped.entries()].map(([emoji, g]) =>
    `<button class="reaction-chip ${g.mine ? "mine" : ""}" data-message-id="${msgId}" data-emoji="${emoji}">${emoji} ${g.count}</button>`
  ).join("");
}

function openReactionPickerFor(anchorEl, msgId) {
  const picker = document.getElementById("reaction-picker");
  picker.innerHTML = "";
  let emojis = REACTION_EMOJIS;
  if (currentChannelObj && Array.isArray(currentChannelObj.available_reactions) && currentChannelObj.available_reactions.length) {
    emojis = currentChannelObj.available_reactions;
  }
  emojis.forEach((em) => {
    const b = document.createElement("button");
    b.textContent = em;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleReaction(msgId, em);
      closeReactionPicker();
    });
    picker.appendChild(b);
  });
  picker.classList.remove("hidden");
  const rect = anchorEl.getBoundingClientRect();
  const pw = picker.offsetWidth, ph = picker.offsetHeight;
  let x = rect.left + rect.width / 2 - pw / 2;
  let y = rect.top - ph - 8;
  if (y < 8) y = rect.bottom + 8;
  x = Math.max(8, Math.min(window.innerWidth - pw - 8, x));
  picker.style.left = x + "px";
  picker.style.top = y + "px";
  setTimeout(() => document.addEventListener("click", closeReactionPickerOnClick), 0);
}

function closeReactionPickerOnClick(e) {
  if (!e.target.closest("#reaction-picker")) closeReactionPicker();
}

function closeReactionPicker() {
  const el = document.getElementById("reaction-picker");
  if (el) el.classList.add("hidden");
  document.removeEventListener("click", closeReactionPickerOnClick);
}

async function toggleReaction(msgId, emoji) {
  const list = reactionsCache.get(msgId) || [];
  const mine = list.find((r) => r.user_id === currentUser.id);
  if (mine && mine.emoji === emoji) {
    reactionsCache.set(msgId, list.filter((r) => r.user_id !== currentUser.id));
    renderReactionsUI(msgId);
    await supabase.from("reactions").delete().eq("message_id", msgId).eq("user_id", currentUser.id);
  } else if (mine) {
    reactionsCache.set(msgId, list.map((r) => r.user_id === currentUser.id ? { ...r, emoji } : r));
    renderReactionsUI(msgId);
    await supabase.from("reactions").update({ emoji }).eq("message_id", msgId).eq("user_id", currentUser.id);
  } else {
    reactionsCache.set(msgId, [...list, { user_id: currentUser.id, emoji }]);
    renderReactionsUI(msgId);
    await supabase.from("reactions").insert({ message_id: msgId, user_id: currentUser.id, emoji });
  }
}

// ======================================================
// 18. МЕНЮ ЧАТА
// ======================================================

function setupChatMenu() {
  const menuBtn = document.getElementById("chat-menu-btn");
  const menuEl = document.getElementById("chat-menu");

  const headerText = document.getElementById("chat-header-text");
  if (headerText) {
    headerText.addEventListener("click", (e) => {
      if (e.target.closest("#chat-menu-btn")) return;
      if (currentChannelObj) { openChannelProfileDialog(); return; }
      openUserProfileDialog();
    });
  }

  const upCloseBtn = document.getElementById("user-profile-close");
  if (upCloseBtn) upCloseBtn.addEventListener("click", () => {
    document.getElementById("user-profile-overlay").classList.add("hidden");
    document.getElementById("user-profile-back").classList.add("hidden");
    profileFromGiftContext = null;
  });

  const upBackBtn = document.getElementById("user-profile-back");
  if (upBackBtn) upBackBtn.addEventListener("click", async () => {
    const ctx = profileFromGiftContext;
    profileFromGiftContext = null;
    document.getElementById("user-profile-overlay").classList.add("hidden");
    document.getElementById("user-profile-back").classList.add("hidden");

    if (ctx) {
      // Возвращаемся в окно подарка — именно к тому же подарку
      document.getElementById("gifts-overlay").classList.remove("hidden");
      const { data: ug } = await supabase.from("user_gifts")
        .select("*").eq("id", ctx.ugId).maybeSingle();
      await refreshBalance();
      if (ug) {
        await renderGiftDetail(ctx.userId, ug);
      } else {
        renderGiftsMain(ctx.userId);
      }
    }
  });

  // Открытие/закрытие меню.
  // Используем pointerdown в capture-фазе и гасим bubbling — раньше клик
  // «проскакивал» до document-обработчика и меню сразу же закрывалось.
  let chatMenuIgnoreOutside = false;

  menuBtn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    // Помечаем, что следующий клик по документу надо проглотить.
    chatMenuIgnoreOutside = true;
    setTimeout(() => { chatMenuIgnoreOutside = false; }, 0);
    menuEl.classList.toggle("hidden");
  }, true);

  menuBtn.addEventListener("click", (e) => {
    // Гасим click тоже, чтобы не было двойного toggle.
    e.stopPropagation();
  });

  document.addEventListener("pointerdown", (e) => {
    if (chatMenuIgnoreOutside) return;
    if (menuEl.classList.contains("hidden")) return;
    if (menuEl.contains(e.target)) return;
    if (e.target.closest("#chat-menu-btn")) return;
    menuEl.classList.add("hidden");
  }, true);

  menuEl.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    menuEl.classList.add("hidden");

    if (action === "tokens") {
      openTokensDialog();
    } else if (action === "clear") {
      const choice = await showChoiceDialog(t("delete.clear.title"), t("delete.clear.text"), [
        { label: t("delete.clear.me"), value: "me" },
        { label: t("delete.clear.both"), value: "both" },
      ], t("delete.clear.action"));
      if (choice === "me") await clearChatForMe();
      else if (choice === "both") await clearChatForBoth();
    } else if (action === "delete") {
      const choice = await showChoiceDialog(t("delete.chat.title"), t("delete.chat.text"), [
        { label: t("delete.chat.me"), value: "me" },
        { label: t("delete.chat.both"), value: "both" },
      ], t("delete.chat.action"));
      if (choice === "me") await hideChatFromList();
      else if (choice === "both") await deleteChatForBoth();
    } else if (action === "block") {
      if (!currentOtherUser) return;
      if (isBlockedByMe(currentOtherUser.id)) await unblockUser(currentOtherUser.id);
      else {
        const ok = await showConfirmDialog(
          t("block.confirm.title"),
          tFmt("block.confirm.text", { username: currentOtherUser.username }),
          t("block.confirm.action")
        );
        if (!ok) return;
        await blockUser(currentOtherUser.id);
      }
      updateBlockUI();
    } else if (action === "channel-configure") {
      if (!currentChannelObj) return;
      openChannelEditDialog();
    } else if (action === "channel-delete") {
      await deleteChannelDialog();
    } else if (action === "channel-profile") {
      if (!currentChannelObj) return;
      openChannelProfileDialog();
    } else if (action === "channel-invite") {
      if (!currentChannelObj) return;
      openInviteDialog();
    } else if (action === "channel-unsubscribe") {
      if (!currentChannelObj) return;
      const ok = await showConfirmDialog(
        t("channel.sub.unsubscribeTitle"),
        tFmt("channel.sub.unsubscribeText", { name: currentChannelObj.name }),
        t("channel.sub.unsubscribeAction")
      );
      if (!ok) return;
      const chId = currentChannelObj.id;
      const { error } = await supabase.from("chat_members")
        .delete().eq("chat_id", chId).eq("user_id", currentUser.id);
      if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
      currentChannelIsSubscribed = false;
      // СРАЗУ убираем канал из списка чатов
      removeChatFromList(chId);
      await updateChannelSubtitle(chId);
      await updateChannelComposerState();
      configureChatMenuForChannel(currentChannelObj);
      // Перезагружаем сообщения — для private/request покажется заглушка
      await loadMessages(chId, openSeq);
      await loadReactionsForVisibleMessages();
    }
  });

  const unblockBtn = document.getElementById("unblock-btn");
  if (unblockBtn) unblockBtn.addEventListener("click", async () => {
    if (!currentOtherUser) return;
    await unblockUser(currentOtherUser.id);
    updateBlockUI();
  });

  // Профиль канала — открыть/закрыть
  document.getElementById("channel-profile-close").addEventListener("click", closeChannelProfileDialog);

  // Клик по строке "Подписчиков" в профиле канала
  const subsRow = document.getElementById("channel-profile-subs-row");
  if (subsRow) subsRow.addEventListener("click", openChannelSubscribersDialog);

  // Клик по строке «Заявки» в профиле канала
  const reqRow = document.getElementById("channel-profile-requests-row");
  if (reqRow) reqRow.addEventListener("click", openChannelRequestsDialog);
  // Закрытие оверлея заявок
  const reqClose = document.getElementById("channel-requests-close");
  if (reqClose) reqClose.addEventListener("click", () => {
    document.getElementById("channel-requests-overlay").classList.add("hidden");
  });

  const chMenuBtn = document.getElementById("channel-profile-menu-btn");
  const chMenu = document.getElementById("channel-profile-menu");
  chMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    chMenu.classList.toggle("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!chMenu.classList.contains("hidden") && !chMenu.contains(e.target)) chMenu.classList.add("hidden");
  });
  chMenu.addEventListener("click", async (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    e.stopPropagation();
    const action = btn.dataset.action;
    chMenu.classList.add("hidden");
    if (action === "edit") {
      closeChannelProfileDialog();
      openChannelEditDialog();
    } else if (action === "delete") {
      closeChannelProfileDialog();
      await deleteChannelDialog();
    }
  });
}

function updateBlockUI() {
  if (!currentOtherUser) return;
  const banner = document.getElementById("block-banner");
  const text = document.getElementById("block-banner-text");
  const btn = document.getElementById("unblock-btn");
  const menuBlockBtn = document.getElementById("menu-block");
  const composerInput = document.getElementById("message-input");
  const composerBtn = document.getElementById("send-btn");
  const iBlocked = isBlockedByMe(currentOtherUser.id);
  const theyBlocked = hasBlockedMe(currentOtherUser.id);

  if (iBlocked) {
    text.textContent = tFmt("block.youBlocked", { username: currentOtherUser.username });
    btn.classList.remove("hidden"); banner.classList.remove("hidden");
    composerInput.disabled = true; composerBtn.disabled = true;
    menuBlockBtn.textContent = t("chat.menu.unblock");
  } else if (theyBlocked) {
    text.textContent = tFmt("block.theyBlocked", { username: currentOtherUser.username });
    btn.classList.add("hidden"); banner.classList.remove("hidden");
    composerInput.disabled = true; composerBtn.disabled = true;
    menuBlockBtn.textContent = t("chat.menu.block");
  } else {
    banner.classList.add("hidden"); btn.classList.add("hidden");
    composerInput.disabled = false; composerBtn.disabled = false;
    menuBlockBtn.textContent = t("chat.menu.block");
  }
}

// ======================================================
// 19. ОЧИСТКА / УДАЛЕНИЕ ЧАТА
// ======================================================

async function clearChatForMe() {
  if (!currentChatId) return;
  const { error } = await supabase.from("chat_clears").upsert({
    chat_id: currentChatId, user_id: currentUser.id, cleared_at: new Date().toISOString(),
  });
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  await loadMessages(currentChatId);
  await loadReactionsForVisibleMessages();
}

async function clearChatForBoth() {
  if (!currentChatId) return;
  const chatId = currentChatId;
  // .select("id") — чтобы узнать, сколько строк реально удалилось.
  // Без него Supabase с RLS вернёт error=null даже когда удаление запрещено.
  const { data, error } = await supabase.from("messages").delete().eq("chat_id", chatId).select("id");
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  const deletedCount = (data || []).length;

  // Чистим локально сразу
  document.getElementById("messages").innerHTML = currentChannelObj
    ? '<div class="empty">' + escapeHtml(t("empty.noMessagesChannel")) + '</div>'
    : '<div class="empty">' + escapeHtml(t("empty.noMessages")) + '</div>';
  msgCache.clear(); reactionsCache.clear();

  // Если удалилось меньше, чем было в кэше, — явно предупреждаем.
  // (RLS может резать удаление части сообщений.)
  setTimeout(async () => {
    if (currentChatId !== chatId) return;
    await loadMessages(chatId, openSeq);
    await loadReactionsForVisibleMessages();
    // Если после перезагрузки что-то осталось — сообщаем.
    const box = document.getElementById("messages");
    const left = box ? box.querySelectorAll(".msg, .msg-system").length : 0;
    if (left > 0) {
      await showAlertDialog(
        "Очистка частичная",
        `Удалено ${deletedCount} сообщений, но на сервере осталось ещё ${left}. ` +
        `Скорее всего RLS-политика на messages не разрешает удалять все сообщения. ` +
        `Пришли мне SQL-политики для messages — поправим.`
      );
    }
  }, 600);
}

async function hideChatFromList() {
  if (!currentChatId) return;
  const chatId = currentChatId;
  const { error } = await supabase.from("chat_hides").upsert({
    chat_id: chatId, user_id: currentUser.id, hidden_at: new Date().toISOString(),
  });
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  closeCurrentChat();
  // 🔴 На мобильном нужно явно вернуться к списку чатов — иначе
  // пользователь остаётся в пустой области «выберите чат».
  exitMobileChat();
  removeChatFromList(chatId);
}

async function deleteChatForBoth() {
  if (!currentChatId) return;
  const chatId = currentChatId;
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  closeCurrentChat();
  // 🔴 То же самое — возвращаемся к списку чатов.
  exitMobileChat();
  removeChatFromList(chatId);
}

function closeCurrentChat() {
  openSeq++;
  if (currentChatId) saveDraftFor(currentChatId);
  decryptedCache.clear();
  revokeDecryptedFiles();
  resetChannelKeyState();
  currentChatId = null; currentOtherUser = null; pendingOtherUser = null;
  currentChannelObj = null; currentChannelIsAdmin = false;
  currentChannelIsSubscribed = false;
  currentChannelViewsMap = new Map();
  currentChannelTotalViews = 0;
  if (currentChannelViewsChannel) { supabase.removeChannel(currentChannelViewsChannel); currentChannelViewsChannel = null; }
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
  cancelReply(); cancelEdit(); exitSelectionMode(); closeReactionPicker();
  closeChatSearch();
  notifySwActiveChat(null);
  const sbBtn = document.getElementById("scroll-bottom-btn");
  if (sbBtn) sbBtn.classList.remove("visible");
  document.getElementById("chat-content").classList.add("hidden");
  document.getElementById("chat-placeholder").classList.remove("hidden");
}

// ======================================================
// 20. ПКМ ПО СООБЩЕНИЮ
// ======================================================
async function copyMessageText(id) {
  const msg = msgCache.get(id);
  if (!msg) return;
  const text = await getPlaintext(msg);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  } else {
    const tmp = document.createElement("textarea");
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    document.body.removeChild(tmp);
  }
}

function setupMessageMenu() {
  const menuEl = document.getElementById("msg-context-menu");
  menuEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    e.stopPropagation();
    const action = btn.dataset.action;
    const id = contextMsgId;
    closeMsgContextMenu();
    if (!id) return;
    if (action === "reply") startReply(id);
    else if (action === "pin") await handlePinAction(id);
    else if (action === "copy") copyMessageText(id).catch(() => {});
    else if (action === "edit") startEdit(id);
    else if (action === "fwd") await handleForwardOne(id);
    else if (action === "del") await handleDeleteOne(id);
    else if (action === "sel") enterSelectionMode(id);
  });
  // Закрываем меню тапом/кликом вне его.
  // Используем pointerdown в capture-фазе: срабатывает РАНЬШЕ, чем click —
  // поэтому мы успеваем погасить событие, и кнопка под меню не нажмётся.
  // Плюс проверяем justLongPressed() — «фантомный» click после отпускания
  // пальца не должен закрывать только что открытое меню.
  document.addEventListener("pointerdown", (e) => {
    const menu = document.getElementById("msg-context-menu");
    if (!menu || menu.classList.contains("hidden")) return;
    // Тап внутри меню — не трогаем
    if (menu.contains(e.target)) return;
    // Только что был long-press — не закрываем (это отпускание пальца)
    if (justLongPressed()) return;
    // Закрываем меню и ГАСИМ событие, чтобы клик не дошёл до кнопки под меню
    menu.classList.add("hidden");
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // === Contenteditable-инпут и форматирование ===
  const inputEl = document.getElementById("message-input");
  if (inputEl && inputEl.isContentEditable) {
    inputEl.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        let fmt = null;
        if (e.shiftKey) {
          if (k === "x") fmt = "strike";
          else if (k === "." || k === "ю") fmt = "quote";
          else if (k === "f" || k === "а") fmt = "mono";
          else if (k === "p" || k === "з") fmt = "spoiler";
        } else {
          if (k === "b" || k === "и") fmt = "bold";
          else if (k === "u" || k === "г") fmt = "underline";
          else if (k === "i" || k === "ш") fmt = "italic";
        }
        if (fmt) {
          e.preventDefault();
          wrapSelection(fmt);
          return;
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("composer").dispatchEvent(new Event("submit", { cancelable: true }));
      }
      setTimeout(() => {
        inputEl.style.height = "auto";
        inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + "px";
      }, 0);
    });

    inputEl.addEventListener("input", () => {
      inputEl.style.height = "auto";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + "px";
    });

    // Вставка — только чистый текст
    inputEl.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, text);
    });

    // ПКМ → меню форматирования
    const fmtMenu = document.getElementById("format-context-menu");
    if (fmtMenu) {
      // Общий хелпер: показать меню форматирования в точке (x, y)
      const showFmtMenu = (x, y) => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        fmtMenu.classList.remove("hidden");
        fmtMenu.style.left = "0px"; fmtMenu.style.top = "0px";
        const rect = fmtMenu.getBoundingClientRect();

        // 🔴 visualViewport — единственный способ узнать реальную видимую
        // область на мобильных. window.innerHeight не уменьшается, когда
        // открыта клавиатура, — поэтому меню улетало под неё.
        const vv = window.visualViewport;
        const viewW = vv ? vv.width : window.innerWidth;
        const viewH = vv ? vv.height : window.innerHeight;
        const offsetTop = vv ? vv.offsetTop : 0;
        const offsetLeft = vv ? vv.offsetLeft : 0;

        if (x + rect.width > offsetLeft + viewW - 8) x = offsetLeft + viewW - rect.width - 8;
        if (x < offsetLeft + 8) x = offsetLeft + 8;
        if (y + rect.height > offsetTop + viewH - 8) y = offsetTop + viewH - rect.height - 8;
        if (y < offsetTop + 8) y = offsetTop + 8;
        fmtMenu.style.left = x + "px";
        fmtMenu.style.top = y + "px";
        // 🔴 Ограничиваем высоту меню, чтобы оно скроллилось,
        // если не влезает целиком.
        fmtMenu.style.maxHeight = Math.max(140, viewH - 24) + "px";
        fmtMenu.style.overflowY = "auto";
      };

      inputEl.addEventListener("contextmenu", (e) => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        e.preventDefault();
        showFmtMenu(e.clientX, e.clientY);
      });

      // 🔴 Long-press для мобильных: удерживание пальца на выделенном
      // фрагменте открывает то же меню форматирования (жирный/курсив/...).
      // Без этого на телефоне доступно только системное меню браузера.
      let fmtLpTimer = null, fmtLpX = 0, fmtLpY = 0, fmtLpFired = false;
      inputEl.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        fmtLpX = t.clientX; fmtLpY = t.clientY; fmtLpFired = false;
        fmtLpTimer = setTimeout(() => {
          fmtLpFired = true;
          lastLongPressAt = Date.now();
          try { if (navigator.vibrate) navigator.vibrate(15); } catch (ex) {}
          showFmtMenu(fmtLpX, fmtLpY);
        }, 500);
      }, { passive: true });
      inputEl.addEventListener("touchmove", (e) => {
        if (!fmtLpTimer) return;
        const t = e.touches[0];
        if (!t) return;
        if (Math.abs(t.clientX - fmtLpX) > 10 || Math.abs(t.clientY - fmtLpY) > 10) {
          clearTimeout(fmtLpTimer); fmtLpTimer = null;
        }
      }, { passive: true });
      inputEl.addEventListener("touchend", (e) => {
        if (fmtLpTimer) { clearTimeout(fmtLpTimer); fmtLpTimer = null; }
        if (fmtLpFired) {
          e.preventDefault();
          e.stopPropagation();
          fmtLpFired = false;
        }
      });

      fmtMenu.addEventListener("click", (e) => {
        const btn = e.target.closest("button"); if (!btn) return;
        e.stopPropagation();
        wrapSelection(btn.dataset.format);
        fmtMenu.classList.add("hidden");
      });
      document.addEventListener("click", () => fmtMenu.classList.add("hidden"));

      // 🔴 При изменении visualViewport (открытие/закрытие клавиатуры)
      // перепозиционируем меню, если оно открыто.
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => {
          if (fmtMenu.classList.contains("hidden")) return;
          const rect = fmtMenu.getBoundingClientRect();
          const vv = window.visualViewport;
          const viewH = vv.height;
          const offsetTop = vv.offsetTop;
          if (rect.bottom > offsetTop + viewH - 8) {
            const newTop = Math.max(offsetTop + 8, offsetTop + viewH - rect.height - 8);
            fmtMenu.style.top = newTop + "px";
          }
          fmtMenu.style.maxHeight = Math.max(140, viewH - 24) + "px";
        });
      }
    }
  }

  // Спойлер раскрывается кликом
  document.getElementById("messages").addEventListener("click", (e) => {
    const sp = e.target.closest(".spoiler");
    if (sp) { sp.classList.toggle("revealed"); e.stopPropagation(); }
  }, true);

  // Ссылки-приглашения (#invite=...) открываем в ЭТОЙ ЖЕ вкладке
  document.getElementById("messages").addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const m = /#invite=([A-Za-z0-9_-]+)/.exec(href);
    if (!m) return;
    e.preventDefault();
    e.stopPropagation();
    window.location.hash = "invite=" + m[1];
  }, true);

  document.getElementById("messages").addEventListener("click", (e) => {
    const video = e.target.closest("video.msg-attachment-video");
    if (!video) return;
    if (e.target !== video) return;
    e.preventDefault();
    e.stopPropagation();
    const url = video.dataset.mediaUrl || video.src;
    const msgId = video.closest("[data-id]")?.dataset.id || null;
    const media = collectChatMedia();
    const idx = media.findIndex((x) => x.msgId === msgId);
    openMediaViewer(url, "video", media, idx >= 0 ? idx : 0);
  }, true);
}

// Реакция-панель внутри контекстного меню сообщения.
// Хранит текущее состояние «раскрыто/свёрнуто» между открытиями меню.
let contextReactionsExpanded = false;

function renderMsgReactionsBar(msgId) {
  const bar = document.getElementById("msg-reactions-bar");
  if (!bar) return;
  const msg = msgCache.get(msgId);
  if (!msg) { bar.innerHTML = ""; return; }

  // В канале — свои доступные реакции, в DM — стандартный набор
  let available = REACTION_EMOJIS;
  if (msg.chat_id && channelCache.has(msg.chat_id)) {
    const ch = channelCache.get(msg.chat_id);
    if (Array.isArray(ch.available_reactions) && ch.available_reactions.length) {
      available = ch.available_reactions;
    }
  }

  const main = available.slice(0, 7);
  const rest = available.slice(7);

  let html = `<div class="msg-reactions-main">`;
  html += main.map((em) =>
    `<button type="button" class="reaction-emoji-btn" data-react-emoji="${escapeHtml(em)}" title="${escapeHtml(em)}">${em}</button>`
  ).join("");

  if (rest.length) {
    const arrow = contextReactionsExpanded ? "▴" : "▾";
    html += `<button type="button" class="reaction-emoji-btn expand-btn" data-react-expand="1" title="${escapeHtml(t("msgCtx.expand"))}">${arrow}</button>`;
  }
  html += `</div>`;

  if (contextReactionsExpanded && rest.length) {
    html += `<div class="msg-reactions-bar-expanded">` +
      rest.map((em) =>
        `<button type="button" class="reaction-emoji-btn" data-react-emoji="${escapeHtml(em)}" title="${escapeHtml(em)}">${em}</button>`
      ).join("") + `</div>`;
  }

  bar.innerHTML = html;

  bar.querySelectorAll("[data-react-emoji]").forEach((btn) => {
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const emoji = btn.dataset.reactEmoji;
      closeMsgContextMenu();
      await toggleReaction(msgId, emoji);
    });
  });

  const expandBtn = bar.querySelector("[data-react-expand]");
  if (expandBtn) {
    expandBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      contextReactionsExpanded = !contextReactionsExpanded;
      renderMsgReactionsBar(msgId);
    });
  }
}

// Пока палец не отпущен после long-press, клики по кнопкам меню должны игнорироваться.
let msgMenuOpenedAt = 0;

function openMsgContextMenu(e, msgId) {
  if (selectionMode) return;
  e.preventDefault(); e.stopPropagation();
  contextMsgId = msgId;
  msgMenuOpenedAt = Date.now();
  contextReactionsExpanded = false;
  renderMsgReactionsBar(msgId);
  const msg = msgCache.get(msgId);
  const editBtn  = document.querySelector('#msg-context-menu button[data-action="edit"]');
  const replyBtn = document.querySelector('#msg-context-menu button[data-action="reply"]');
  const fwdBtn   = document.querySelector('#msg-context-menu button[data-action="fwd"]');
  const pinBtn   = document.querySelector('#msg-context-menu button[data-action="pin"]');
  const delBtn   = document.querySelector('#msg-context-menu button[data-action="del"]');
  const isGift = msg && msg.message_type === "gift";
  const isTokens = msg && msg.message_type === "tokens";
  const isChannelMsg = msg && msg.chat_id && channelCache.has(msg.chat_id);

  // Все эти кнопки прячем по умолчанию, потом показываем только нужные
  if (editBtn)  editBtn.classList.add("hidden");
  if (replyBtn) replyBtn.classList.add("hidden");
  if (pinBtn)   pinBtn.classList.add("hidden");
  if (delBtn)   delBtn.classList.add("hidden");

  const isChanAdmin = isChannelMsg && currentChannelIsAdmin;

  if (isChannelMsg) {
    // Пересылать из канала можно всем
    if (fwdBtn) fwdBtn.classList.remove("hidden");

    // Остальное — только админам и владельцу
    if (isChanAdmin) {
      if (replyBtn) replyBtn.classList.remove("hidden");
      if (pinBtn) pinBtn.classList.remove("hidden");
      if (delBtn) delBtn.classList.remove("hidden");
      if (editBtn && msg && msg.sender_id === currentUser.id && !msg.forwarded_from_name) editBtn.classList.remove("hidden");
    }
  } else if (isGift) {
    if (replyBtn) replyBtn.classList.remove("hidden");
    if (delBtn)   delBtn.classList.remove("hidden");
  } else if (isTokens) {
    if (delBtn)   delBtn.classList.remove("hidden");
  } else {
    // Обычный DM
    if (replyBtn) replyBtn.classList.remove("hidden");
    if (fwdBtn)   fwdBtn.classList.remove("hidden");
    if (pinBtn)   pinBtn.classList.remove("hidden");
    if (delBtn)   delBtn.classList.remove("hidden");
    if (editBtn && msg && msg.sender_id === currentUser.id && !msg.forwarded_from_name && msg.message_type !== "attachment") {
      editBtn.classList.remove("hidden");
    }
  }

  // Обновляем подпись кнопки «Закрепить/Открепить» под текущее состояние
  if (pinBtn && !pinBtn.classList.contains("hidden")) updatePinMenuLabel(msgId);

  const menu = document.getElementById("msg-context-menu");
  menu.classList.remove("hidden");
  menu.style.left = "0px"; menu.style.top = "0px";
  const rect = menu.getBoundingClientRect();
  let x = e.clientX, y = e.clientY;
  if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
  if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
  menu.style.left = x + "px"; menu.style.top = y + "px";

  // 🔴 Пока палец не отпущен (long-press на тач-устройстве) — блокируем
  // взаимодействие с меню, чтобы палец не «провалился» в кнопку под собой.
  // На ПКМ (мышь) — блокировка не срабатывает, всё работает сразу.
  blockUntilTouchRelease(menu);
}

function closeMsgContextMenu() {
  const m = document.getElementById("msg-context-menu");
  if (m) m.classList.add("hidden");
}

async function openGiftDetailById(ugId) {
  const { data: ug } = await supabase.from("user_gifts").select("*").eq("id", ugId).maybeSingle();
  if (!ug) { await showAlertDialog(t("gifts.title.detail"), t("gifts.notFound")); return; }
  document.getElementById("gifts-overlay").classList.remove("hidden");
  await refreshBalance();
  await renderGiftDetail(ug.owner_id, ug);
}

function openPickerForContext(msgId) {
  const el = document.querySelector(`.msg[data-id="${msgId}"] .msg-add-reaction`);
  if (el) openReactionPickerFor(el, msgId);
}

// ======================================================
// ПОИСК ВНУТРИ ЧАТА / КАНАЛА
// ======================================================

function setupChatSearch() {
  const btn = document.getElementById("chat-search-btn");
  const bar = document.getElementById("chat-search-bar");
  const input = document.getElementById("chat-search-input");
  const prevBtn = document.getElementById("chat-search-prev");
  const nextBtn = document.getElementById("chat-search-next");
  const closeBtn = document.getElementById("chat-search-close");

  if (btn) btn.addEventListener("click", () => {
    if (chatSearchOpen) closeChatSearch();
    else openChatSearch();
  });
  if (closeBtn) closeBtn.addEventListener("click", closeChatSearch);
  if (prevBtn) prevBtn.addEventListener("click", () => navigateChatSearch(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => navigateChatSearch(1));

  if (input) {
    input.addEventListener("input", () => {
      clearTimeout(chatSearchDebounce);
      const q = input.value;
      chatSearchDebounce = setTimeout(() => applyChatSearch(q), 120);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); closeChatSearch(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        navigateChatSearch(e.shiftKey ? -1 : 1);
      }
    });
  }
}

function openChatSearch() {
  if (!currentChatId) return;
  chatSearchOpen = true;
  const bar = document.getElementById("chat-search-bar");
  const input = document.getElementById("chat-search-input");
  bar.classList.remove("hidden");
  input.value = "";
  chatSearchMatches = [];
  chatSearchIndex = -1;
  updateChatSearchUI();
  setTimeout(() => input.focus(), 60);
}

function closeChatSearch() {
  chatSearchOpen = false;
  const bar = document.getElementById("chat-search-bar");
  if (bar) bar.classList.add("hidden");
  const input = document.getElementById("chat-search-input");
  if (input) input.value = "";
  chatSearchMatches = [];
  chatSearchIndex = -1;
  clearSearchHighlights();
  document.querySelectorAll("#messages .msg.search-current, #messages .msg-system.search-current").forEach((el) => {
    el.classList.remove("search-current");
  });
  updateChatSearchUI();
}

// Очищает все подсветки поиска в сообщениях
function clearSearchHighlights() {
  document.querySelectorAll("#messages mark.search-hl").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

// Подсвечивает все вхождения query в текстовых нодах внутри rootEl.
// Возвращает количество подсветок.
function highlightInElement(rootEl, query) {
  if (!query || !rootEl) return 0;
  const q = query.toLowerCase();
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentNode && node.parentNode.classList &&
        node.parentNode.classList.contains("search-hl")) continue;
    textNodes.push(node);
  }
  let count = 0;
  textNodes.forEach((tn) => {
    const text = tn.nodeValue;
    if (!text) return;
    const lower = text.toLowerCase();
    let idx = lower.indexOf(q);
    if (idx === -1) return;
    const frag = document.createDocumentFragment();
    let lastEnd = 0;
    while (idx !== -1) {
      if (idx > lastEnd) frag.appendChild(document.createTextNode(text.slice(lastEnd, idx)));
      const mark = document.createElement("mark");
      mark.className = "search-hl";
      mark.textContent = text.slice(idx, idx + q.length);
      frag.appendChild(mark);
      lastEnd = idx + q.length;
      count++;
      idx = lower.indexOf(q, lastEnd);
    }
    if (lastEnd < text.length) frag.appendChild(document.createTextNode(text.slice(lastEnd)));
    tn.parentNode.replaceChild(frag, tn);
  });
  return count;
}

function applyChatSearch(query) {
  clearSearchHighlights();
  const q = query.trim().toLowerCase();
  chatSearchMatches = [];

  if (!q) {
    chatSearchIndex = -1;
    updateChatSearchUI();
    return;
  }

  const all = document.querySelectorAll("#messages .msg, #messages .msg-system");
  all.forEach((el) => {
    const textEl = el.querySelector(".msg-text") || el;
    const cnt = highlightInElement(textEl, q);
    if (cnt > 0) chatSearchMatches.push(el);
  });

  chatSearchIndex = chatSearchMatches.length ? 0 : -1;
  if (chatSearchIndex >= 0) jumpToChatSearchMatch();
  updateChatSearchUI();
}

function navigateChatSearch(dir) {
  if (!chatSearchMatches.length) return;
  chatSearchIndex = (chatSearchIndex + dir + chatSearchMatches.length) % chatSearchMatches.length;
  jumpToChatSearchMatch();
  updateChatSearchUI();
}

function jumpToChatSearchMatch() {
  chatSearchMatches.forEach((el, i) => el.classList.toggle("search-current", i === chatSearchIndex));
  const el = chatSearchMatches[chatSearchIndex];
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateChatSearchUI() {
  const countEl = document.getElementById("chat-search-count");
  const prevBtn = document.getElementById("chat-search-prev");
  const nextBtn = document.getElementById("chat-search-next");
  if (!countEl) return;
  const total = chatSearchMatches.length;
  if (!total) {
    countEl.textContent = document.getElementById("chat-search-input").value.trim() ? "0 / 0" : "";
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }
  countEl.textContent = `${chatSearchIndex + 1} / ${total}`;
  if (prevBtn) prevBtn.disabled = false;
  if (nextBtn) nextBtn.disabled = false;
}

// ======================================================
// 21. ОТВЕТ / РЕДАКТИРОВАНИЕ
// ======================================================

function setupReplyBar() {
  document.getElementById("reply-bar-close").addEventListener("click", () => { cancelReply(); cancelEdit(); });
}

async function startReply(msgId) {
  const msg = msgCache.get(msgId);
  if (!msg) return;
  if (msg.message_type === "tokens") return;
  // Сбрасываем ТОЛЬКО режим редактирования, НЕ трогая текст в инпуте —
  // чтобы при переходе «редактирование → ответ» уже набранное не пропало.
  editingMsgId = null;
  replyToMsg = msg;
  const profile = await getProfile(msg.sender_id);
  const name = msg.sender_id === currentUser.id ? t("msg.reply.you") : (profile ? profile.display_name : "?");
  document.getElementById("reply-bar-title").textContent = t("replyBar.answer") + " " + name;
  const replyPlain = await getPlaintext(msg);
  document.getElementById("reply-bar-text").textContent = replyPlain.slice(0, 80);
  document.getElementById("reply-bar-icon").textContent = "↩";
  document.getElementById("reply-bar").classList.remove("hidden");
  document.getElementById("message-input").focus();
}

function cancelReply() {
  replyToMsg = null;
  if (!editingMsgId) document.getElementById("reply-bar").classList.add("hidden");
}

async function startEdit(msgId) {
  const msg = msgCache.get(msgId);
  if (!msg || msg.sender_id !== currentUser.id) return;
  if (msg.forwarded_from_name || msg.message_type === "tokens" || msg.message_type === "gift") return;
  cancelReply();
  editingMsgId = msgId;
  document.getElementById("reply-bar-title").textContent = t("replyBar.edit");
  const editPlain = await getPlaintext(msg);
  document.getElementById("reply-bar-text").textContent = editPlain.slice(0, 80);
  document.getElementById("reply-bar-icon").textContent = "✎";
  document.getElementById("reply-bar").classList.remove("hidden");
  setInputFromMarkdown(editPlain);
  document.getElementById("message-input").focus();
}

function cancelEdit() {
  editingMsgId = null;
  clearInput();
  if (!replyToMsg) document.getElementById("reply-bar").classList.add("hidden");
}

// ======================================================
// 22. УДАЛЕНИЕ ОДНОГО
// ======================================================

async function handleDeleteOne(msgId) {
  // В канале удалять могут только админы/владелец
  if (currentChannelObj) {
    if (!currentChannelIsAdmin) {
      await showAlertDialog(t("gifts.error"), t("channel.sub.onlyAdminsDelete"));
      return;
    }
    await deleteMessageForBoth(msgId);
    return;
  }
  const choice = await showChoiceDialog(t("delete.one.title"), t("delete.one.text"), [
    { label: t("delete.me"), value: "me" },
    { label: t("delete.both"), value: "both" },
  ], t("delete.action"));
  if (choice === "me") await hideMessageForMe(msgId);
  else if (choice === "both") await deleteMessageForBoth(msgId);
}

async function hideMessageForMe(msgId) {
  if (String(msgId).startsWith("tmp_")) return;
  const { error } = await supabase.from("message_hides").insert({ message_id: msgId, user_id: currentUser.id });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    await showAlertDialog(t("auth.err.prefix"), error.message); return;
  }
  hiddenMsgIds.add(msgId); msgCache.delete(msgId);
  const el = document.querySelector(`[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
}

async function deleteMessageForBoth(msgId) {
  if (String(msgId).startsWith("tmp_")) return;
  // 🔴 .select() — критично: Supabase с RLS возвращает error=null даже когда
  // политика не даёт удалить строку. Без select мы не увидим «0 удалено».
  const { data, error } = await supabase.from("messages").delete().eq("id", msgId).select("id");
  if (error) { await showAlertDialog(t("delete.failed.title"), error.message); return; }
  if (!data || data.length === 0) {
    await showAlertDialog(t("delete.failed.title"), t("delete.failed.text"));
    return;
  }
  msgCache.delete(msgId); reactionsCache.delete(msgId);
  subtractViewsForDeletedMessage(msgId);
  const el = document.querySelector(`[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
  refreshMessageGroups();
}

// ======================================================
// 23. РЕЖИМ ВЫБОРА
// ======================================================

function setupSelectionToolbar() {
  document.getElementById("sel-cancel").addEventListener("click", exitSelectionMode);
  document.getElementById("sel-delete").addEventListener("click", handleDeleteSelected);
  document.getElementById("sel-forward").addEventListener("click", handleForwardSelected);
  document.getElementById("messages").addEventListener("click", (e) => {
    if (!selectionMode) return;
    const el = e.target.closest(".msg, .msg-system");
    if (!el) return;
    e.stopPropagation(); e.preventDefault();
    const id = el.dataset.id;
    if (selectedMsgIds.has(id)) {
      selectedMsgIds.delete(id); el.classList.remove("selected");
    } else {
      if (selectedMsgIds.size >= 100) { showAlertDialog(t("delete.limit.title"), t("delete.limit.text")); return; }
      selectedMsgIds.add(id); el.classList.add("selected");
    }
    updateSelectionUI();
  });
}

function enterSelectionMode(initialId) {
  selectionMode = true;
  selectedMsgIds.clear();
  if (initialId) selectedMsgIds.add(initialId);
  document.getElementById("composer").classList.add("hidden");
  document.getElementById("reply-bar").classList.add("hidden");
  document.getElementById("selection-toolbar").classList.remove("hidden");
  document.querySelectorAll(".msg, .msg-system").forEach((el) => {
    if (selectedMsgIds.has(el.dataset.id)) el.classList.add("selected");
  });
  updateSelectionUI();
}

function exitSelectionMode() {
  selectionMode = false;
  selectedMsgIds.clear();
  document.getElementById("selection-toolbar").classList.add("hidden");
  // Composer показываем только если мы НЕ в канале
  if (!currentChannelObj) {
    document.getElementById("composer").classList.remove("hidden");
  }
  document.querySelectorAll(".msg.selected, .msg-system.selected").forEach((el) => el.classList.remove("selected"));
}

function updateSelectionUI() {
  document.getElementById("selection-count").textContent = t("selection.count") + selectedMsgIds.size;
}

async function handleDeleteSelected() {
  const count = selectedMsgIds.size;
  if (!count) return;
  const choice = await showChoiceDialog(
    t("delete.selected.title"),
    tFmt("delete.selected.text", { n: count }),
    [
      { label: t("delete.me"), value: "me" },
      { label: t("delete.both"), value: "both" },
    ],
    t("delete.action")
  );
  if (!choice) return;
  const ids = [...selectedMsgIds].filter((id) => !String(id).startsWith("tmp_"));
  if (choice === "me") {
    for (const id of ids) {
      await supabase.from("message_hides").insert({ message_id: id, user_id: currentUser.id });
      hiddenMsgIds.add(id); msgCache.delete(id);
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el) el.remove();
    }
  } else if (choice === "both") {
    const { data: del, error } = await supabase.from("messages").delete().in("id", ids).select("id");
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    const deletedIds = new Set((del || []).map((r) => r.id));
    ids.forEach((id) => {
      if (!deletedIds.has(id)) return;
      msgCache.delete(id); reactionsCache.delete(id);
      subtractViewsForDeletedMessage(id);
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el) el.remove();
    });
  }
  exitSelectionMode();
  checkEmptyChat();
}

async function handleForwardSelected() {
  const msgs = [...selectedMsgIds].map((id) => msgCache.get(id)).filter(Boolean);
  if (!msgs.length) return;
  await openForwardDialog(msgs);
}

// ======================================================
// 24. ПЕРЕСЫЛКА
// ======================================================

let forwardPlainText = false;
let inviteShareReturnToInvite = false;

async function handleForwardOne(msgId) {
  const msg = msgCache.get(msgId);
  if (!msg) return;
  if (msg.message_type === "tokens" || msg.message_type === "gift") return;
  // Вложения пересылаем как «ссылку на тот же файл в bucket».
  // Копируем image_url, имя, размер, тип — БЕЗ повторной загрузки.
  await openForwardDialog([msg]);
}

async function openForwardDialog(msgs) {
  forwardSourceMsgs = msgs;
  forwardPlainText = false;
  forwardSelectedChats.clear();
  document.getElementById("forward-hide-sender").checked = false;
  const hideRow = document.querySelector("#forward-overlay .toggle-row");
  if (hideRow) hideRow.classList.remove("hidden");
  document.getElementById("forward-overlay").classList.remove("hidden");
  document.getElementById("forward-list").innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';
  await populateForwardList();
  updateForwardInfo();
}

// Диалог «Переслать» для произвольного текста (например, ссылки-приглашения)
async function openInviteShareDialog(text) {
  inviteShareReturnToInvite = true;
  document.getElementById("invite-overlay").classList.add("hidden");
  forwardSourceMsgs = [{ content: text, sender_id: currentUser.id, message_type: "text" }];
  forwardPlainText = true;
  forwardSelectedChats.clear();
  document.getElementById("forward-hide-sender").checked = false;
  const hideRow = document.querySelector("#forward-overlay .toggle-row");
  if (hideRow) hideRow.classList.add("hidden");
  document.getElementById("forward-overlay").classList.remove("hidden");
  document.getElementById("forward-list").innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';
  await populateForwardList();
  document.getElementById("forward-info").textContent = tFmt("forward.info", { n: 0 });
}

async function populateForwardList() {
  const listEl = document.getElementById("forward-list");
  const { data: myChats } = await supabase.from("chat_members").select("chat_id").eq("user_id", currentUser.id);
  const chatIds = (myChats || []).map((c) => c.chat_id);
  if (!chatIds.length) { listEl.innerHTML = '<div class="empty">' + escapeHtml(t("forward.none")) + '</div>'; return; }

  // Каналы (только те, где я owner/admin — иначе отправка упадёт по RLS)
  const { data: myChans } = await supabase.from("channels").select("*").in("id", chatIds);
  const chanMap = new Map((myChans || []).map((c) => [c.id, c]));
  const chanIds = new Set(chanMap.keys());

  const { data: adminsRows } = await supabase.from("channel_admins")
    .select("channel_id").eq("user_id", currentUser.id);
  const adminChanIds = new Set((adminsRows || []).map((r) => r.channel_id));

  const canPostChanIds = new Set();
  chanIds.forEach((cid) => {
    const ch = chanMap.get(cid);
    if (ch && ch.owner_id === currentUser.id) canPostChanIds.add(cid);
    else if (adminChanIds.has(cid)) canPostChanIds.add(cid);
  });

  // DM-партнёры
  const { data: others } = await supabase.from("chat_members")
    .select("chat_id, user_id").in("chat_id", chatIds).neq("user_id", currentUser.id);
  const dmPairs = (others || []).filter((o) => !chanIds.has(o.chat_id));

  const userIds = [...new Set(dmPairs.map((o) => o.user_id))];
  let profiles = [];
  if (userIds.length) {
    const { data } = await supabase.from("profiles")
      .select("id, username, display_name, avatar_url").in("id", userIds);
    profiles = data || [];
  }
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const items = [];
  dmPairs.forEach((o) => {
    const u = profileMap.get(o.user_id);
    if (u) items.push({ type: "dm", chat_id: o.chat_id, user: u });
  });
  canPostChanIds.forEach((cid) => {
    items.push({ type: "channel", chat_id: cid, channel: chanMap.get(cid) });
  });

  if (!items.length) { listEl.innerHTML = '<div class="empty">' + escapeHtml(t("forward.none")) + '</div>'; return; }

  listEl.innerHTML = items.map((x) => {
    const isCh = x.type === "channel";
    const label = isCh
      ? `${escapeHtml(x.channel.name)} <span style="color:var(--text-dim)">📢 @${escapeHtml(x.channel.username)}</span>`
      : `${escapeHtml(x.user.display_name)} <span style="color:var(--text-dim)">@${escapeHtml(x.user.username)}</span>`;
    return `
      <div class="forward-item" data-chat-id="${x.chat_id}">
        <div class="avatar"></div>
        <div class="fname">${label}</div>
        <div class="fcheck hidden">✓</div>
      </div>`;
  }).join("");

  listEl.querySelectorAll(".forward-item").forEach((el) => {
    const chatId = el.dataset.chatId;
    const item = items.find((x) => x.chat_id === chatId);
    if (item.type === "channel") {
      paintAvatar(el.querySelector(".avatar"), { id: item.channel.id, display_name: item.channel.name, avatar_url: item.channel.avatar_url });
    } else {
      paintAvatar(el.querySelector(".avatar"), item.user);
    }
    el.addEventListener("click", () => {
      const id = el.dataset.chatId;
      if (forwardSelectedChats.has(id)) {
        forwardSelectedChats.delete(id);
        el.classList.remove("selected");
        el.querySelector(".fcheck").classList.add("hidden");
      } else {
        if (forwardSelectedChats.size >= 10) { showAlertDialog(t("forward.title"), t("forward.limit")); return; }
        forwardSelectedChats.add(id);
        el.classList.add("selected");
        el.querySelector(".fcheck").classList.remove("hidden");
      }
      updateForwardInfo();
    });
  });
}

function updateForwardInfo() {
  document.getElementById("forward-info").textContent = tFmt("forward.info", { n: forwardSelectedChats.size });
}

function setupForwardDialog() {
  document.getElementById("forward-cancel").addEventListener("click", () => {
    document.getElementById("forward-overlay").classList.add("hidden");
    forwardPlainText = false;
    if (inviteShareReturnToInvite) {
      inviteShareReturnToInvite = false;
      document.getElementById("invite-overlay").classList.remove("hidden");
    }
    if (selectionMode) exitSelectionMode();
  });
  document.getElementById("forward-send").addEventListener("click", sendForward);
}

async function sendForward() {
  if (!forwardSelectedChats.size || !forwardSourceMsgs.length) return;
  const hideSender = document.getElementById("forward-hide-sender").checked;

  // Режим «просто текст» — ссылка-приглашение и т.п.
  if (forwardPlainText) {
    const payloads = [];
    for (const chatId of forwardSelectedChats) {
      for (const m of forwardSourceMsgs) {
        payloads.push({ chat_id: chatId, sender_id: currentUser.id, content: m.content || "" });
      }
    }
    const { error } = await supabase.from("messages").insert(payloads);
    if (error) { await showAlertDialog(t("alert.error"), error.message); return; }
    document.getElementById("forward-overlay").classList.add("hidden");
    forwardPlainText = false;
    if (inviteShareReturnToInvite) {
      inviteShareReturnToInvite = false;
      document.getElementById("invite-overlay").classList.remove("hidden");
    }
    await showAlertDialog(t("forward.done"), t("forward.linkSent"));
    return;
  }

  // Обычная пересылка
  const senderMap = new Map();
  if (!hideSender) {
    for (const m of forwardSourceMsgs) {
      if (senderMap.has(m.sender_id)) continue;
      const p = await getProfile(m.sender_id);
      senderMap.set(m.sender_id, p || { display_name: "?", username: "?" });
    }
  }

  const payloads = [];
  for (const chatId of forwardSelectedChats) {
    // Расшифровываем источник ОДИН раз для этого чата
    const targetOther = channelCache.has(chatId)
      ? null
      : (() => {
          const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
          const uid = el && el.dataset.userId;
          return uid ? profileCache.get(uid) : null;
        })();

    for (const m of forwardSourceMsgs) {
      // 🔴 Вложения — пересылаем как «копию ссылки», без скачивания/перезагрузки.
      if (m.message_type === "attachment" && m.image_url) {
        const payload = {
          chat_id: chatId, sender_id: currentUser.id,
          message_type: "attachment",
          image_url: m.image_url,
          file_name: m.file_name,
          file_size: m.file_size,
          file_mime: m.file_mime,
          file_kind: m.file_kind,
          content: m.content || "",
        };
        if (!hideSender) {
          const sourceChannel = m.chat_id ? channelCache.get(m.chat_id) : null;
          if (sourceChannel) {
            payload.forwarded_from_name = sourceChannel.name;
            payload.forwarded_from_username = sourceChannel.username;
          } else {
            const s = senderMap.get(m.sender_id) || { display_name: "?", username: "?" };
            payload.forwarded_from_name = s.display_name;
            payload.forwarded_from_username = s.username;
          }
        }
        payloads.push(payload);
        continue;
      }

      // Источник — plaintext (расшифровываем на лету)
      const sourcePlain = m.plaintextOverride !== undefined
        ? m.plaintextOverride
        : (m.encrypted ? await getPlaintext(m) : (m.content || ""));

      // Цель — шифруем, если это DM и есть ключ
      let outContent = sourcePlain, outEncrypted = false;
      if (!channelCache.has(chatId) && targetOther && targetOther.id && cryptoUnlocked) {
        try {
          const shared = await getSharedKeyFor(targetOther.id);
          if (shared) {
            outContent = await Crypto.encryptMessage(shared, sourcePlain);
            outEncrypted = true;
          }
        } catch (e) {}
      }

      const payload = {
        chat_id: chatId, sender_id: currentUser.id,
        content: outContent, encrypted: outEncrypted,
      };
      if (!hideSender) {
        const sourceChannel = m.chat_id ? channelCache.get(m.chat_id) : null;
        if (sourceChannel) {
          payload.forwarded_from_name = sourceChannel.name;
          payload.forwarded_from_username = sourceChannel.username;
        } else {
          const s = senderMap.get(m.sender_id) || { display_name: "?", username: "?" };
          payload.forwarded_from_name = s.display_name;
          payload.forwarded_from_username = s.username;
        }
      }
      payloads.push(payload);
    }
  }

  // Запоминаем цель: если переслали ровно в один чат — откроем его.
  const singleTarget = forwardSelectedChats.size === 1
    ? [...forwardSelectedChats][0]
    : null;

  const { error } = await supabase.from("messages").insert(payloads);
  if (error) { await showAlertDialog(t("alert.error"), error.message); return; }

  document.getElementById("forward-overlay").classList.add("hidden");
  if (selectionMode) exitSelectionMode();

  // Если переслали ровно в один чат — сразу переходим в него.
  if (singleTarget) {
    // Небольшая задержка, чтобы insert успел дойти до realtime-подписки
    // и превью в списке обновилось.
    setTimeout(async () => {
      // Это канал?
      if (channelCache.has(singleTarget)) {
        openChannel(singleTarget).catch(() => {});
        return;
      }
      // DM — ищем пользователя по chat_id.
      const itemEl = document.querySelector(`.user-item[data-chat-id="${singleTarget}"][data-chat-type="dm"]`);
      const userId = itemEl && itemEl.dataset.userId;
      if (userId) {
        const u = profileCache.get(userId);
        if (u) { openChatWith(u).catch(() => {}); return; }
      }
      // Фолбэк: если элемент не найден, но это канал — попробуем через channels.
      const { data: ch } = await supabase.from("channels").select("id").eq("id", singleTarget).maybeSingle();
      if (ch) openChannel(ch.id).catch(() => {});
    }, 120);
  }
}

// ======================================================
// 25. ДНИ РОЖДЕНИЯ
// ======================================================

function birthdayDismissKey() {
  const d = new Date();
  return "imaginer_bday_dismissed_" + d.getFullYear() + "_" + (d.getMonth() + 1) + "_" + d.getDate();
}

function setupBirthdayClose() {
  const closeBtn = document.getElementById("birthday-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      try { localStorage.setItem(birthdayDismissKey(), "1"); } catch (ex) {}
      document.getElementById("birthday-banner").classList.add("hidden");
    });
  }
}

function renderBirthdayBanner() {
  const banner = document.getElementById("birthday-banner");
  if (!banner) return;
  let dismissed = false;
  try { dismissed = !!localStorage.getItem(birthdayDismissKey()); } catch (e) {}
  if (dismissed) { banner.classList.add("hidden"); return; }

  const today = new Date();
  const todayMD = (today.getMonth() + 1) * 100 + today.getDate();
  const celebrants = (cachedProfilesForBirthday || []).filter((p) => {
    const md = parseBirthdayMD(p.birthday);
    return md && md === todayMD;
  });
  if (celebrants.length === 0) { banner.classList.add("hidden"); banner.onclick = null; return; }

  const cnt = celebrants.length;
  const word = pluralRu(cnt, "контакта", "контактов", "контактов");
  document.getElementById("birthday-banner-text").textContent = `У ${cnt} вашего ${word} сегодня день рождения 🎉`;
  banner.classList.remove("hidden");
  banner.onclick = async (e) => {
    if (e.target.closest("#birthday-close")) return;
    const lines = celebrants.map((p) => `${p.display_name} (@${p.username})`).join("\n");
    await showAlertDialog("День рождения 🎂", "Сегодня поздравляем:\n\n" + lines);
  };
}

// ======================================================
// 26. ФОРМАТИРОВАНИЕ
// ======================================================

function formatChatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString(localeId(), { hour: "2-digit", minute: "2-digit" });
  const day = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${mo}`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${mo}.${y} ${hh}:${mm}`;
}

function parseBirthdayMD(str) {
  if (!str) return null;
  const m = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/.exec(str);
  if (!m) return null;
  const d = parseInt(m[1], 10), mo = parseInt(m[2], 10);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  return mo * 100 + d;
}

function normalizeBirthday(str) {
  if (!str) return null;
  const m = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/.exec(String(str).trim());
  if (!m) return null;
  const d = parseInt(m[1], 10), mo = parseInt(m[2], 10);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  let res = String(d).padStart(2, "0") + "." + String(mo).padStart(2, "0");
  if (m[3]) res += "." + m[3];
  return res;
}

// ======================================================
// Кастомный календарь для дня рождения
// ======================================================
let bcViewYear = 2000;
let bcViewMonth = 0; // 0..11

function bcUpdateTitle() {
  const monthsRu = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const monthsEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const months = currentLang === "en" ? monthsEn : monthsRu;
  const el = document.getElementById("bc-title");
  if (el) el.textContent = months[bcViewMonth] + " " + bcViewYear;
}

function bcRender() {
  bcUpdateTitle();
  const grid = document.getElementById("bc-days");
  if (!grid) return;
  grid.innerHTML = "";

  const first = new Date(bcViewYear, bcViewMonth, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Пн=0..Вс=6
  const daysInMonth = new Date(bcViewYear, bcViewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(bcViewYear, bcViewMonth, 0).getDate();

  const today = new Date();
  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

  const input = document.getElementById("profile-birthday");
  const norm = input ? normalizeBirthday(input.value.trim()) : null;
  let selDay = null, selMonth = null, selYear = null;
  if (norm) {
    const parts = norm.split(".");
    selDay = parseInt(parts[0], 10);
    selMonth = parseInt(parts[1], 10) - 1;
    if (parts[2]) selYear = parseInt(parts[2].length === 2 ? "20" + parts[2] : parts[2], 10);
  }

  // Сетка: 6 строк * 7 дней
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startWeekday + 1;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bc-day";
    let realY = bcViewYear, realM = bcViewMonth, realD = dayNum;
    if (dayNum < 1) {
      realM = bcViewMonth - 1; realD = prevMonthDays + dayNum;
      if (realM < 0) { realM = 11; realY -= 1; }
      btn.classList.add("other-month");
    } else if (dayNum > daysInMonth) {
      realM = bcViewMonth + 1; realD = dayNum - daysInMonth;
      if (realM > 11) { realM = 0; realY += 1; }
      btn.classList.add("other-month");
    }
    btn.textContent = String(realD);
    if (realY === todayY && realM === todayM && realD === todayD) btn.classList.add("today");
    if (selDay !== null && selMonth !== null && selYear !== null &&
        realY === selYear && realM === selMonth && realD === selDay) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", () => {
      const d = String(realD).padStart(2, "0");
      const m = String(realM + 1).padStart(2, "0");
      const inp = document.getElementById("profile-birthday");
      inp.value = `${d}.${m}.${realY}`;
      draftProfile.birthday = inp.value;
      markProfileDirty();
      bcRender();
    });
    grid.appendChild(btn);
  }
}

function bcOpen() {
  const cal = document.getElementById("birthday-calendar");
  if (!cal) return;
  const input = document.getElementById("profile-birthday");
  const norm = input ? normalizeBirthday(input.value.trim()) : null;
  const today = new Date();
  if (norm) {
    const parts = norm.split(".");
    bcViewMonth = parseInt(parts[1], 10) - 1;
    bcViewYear = parts[2] ? parseInt(parts[2].length === 2 ? "20" + parts[2] : parts[2], 10) : today.getFullYear();
  } else {
    bcViewMonth = today.getMonth();
    bcViewYear = today.getFullYear() - 25;
  }
  bcRender();
  cal.classList.remove("hidden");
}

function bcClose() {
  const cal = document.getElementById("birthday-calendar");
  if (cal) cal.classList.add("hidden");
}

function setupBirthdayCalendar() {
  const btn = document.getElementById("profile-birthday-calendar");
  const cal = document.getElementById("birthday-calendar");
  if (!btn || !cal) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (cal.classList.contains("hidden")) bcOpen();
    else bcClose();
  });

  cal.addEventListener("click", (e) => {
    e.stopPropagation();
    const target = e.target.closest("[data-bc]");
    if (!target) return;
    const act = target.dataset.bc;
    if (act === "prev-month") { bcViewMonth--; if (bcViewMonth < 0) { bcViewMonth = 11; bcViewYear--; } }
    else if (act === "next-month") { bcViewMonth++; if (bcViewMonth > 11) { bcViewMonth = 0; bcViewYear++; } }
    else if (act === "prev-year") { bcViewYear--; }
    else if (act === "next-year") { bcViewYear++; }
    bcRender();
  });

  document.getElementById("bc-today").addEventListener("click", (e) => {
    e.stopPropagation();
    const today = new Date();
    const d = String(today.getDate()).padStart(2, "0");
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const inp = document.getElementById("profile-birthday");
    inp.value = `${d}.${m}`;
    draftProfile.birthday = inp.value;
    markProfileDirty();
    bcViewMonth = today.getMonth();
    bcViewYear = today.getFullYear();
    bcRender();
  });

  document.getElementById("bc-clear").addEventListener("click", (e) => {
    e.stopPropagation();
    const inp = document.getElementById("profile-birthday");
    inp.value = "";
    draftProfile.birthday = null;
    markProfileDirty();
    bcRender();
  });

  document.addEventListener("click", (e) => {
    if (cal.classList.contains("hidden")) return;
    if (e.target.closest(".birthday-input-wrap")) return;
    bcClose();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !cal.classList.contains("hidden")) bcClose();
  });
}

function formatBirthday(str) {
  if (!str) return "—";
  const m = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/.exec(str);
  if (!m) return "—";
  const day = parseInt(m[1], 10), mo = parseInt(m[2], 10), year = m[3];
  const monthsRu = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  const monthsEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const months = currentLang === "en" ? monthsEn : monthsRu;
  let res;
  if (currentLang === "en") {
    // В английском: "January 5" или "January 5, 1990"
    res = months[mo - 1] + " " + day;
    if (year) { let y = year; if (y.length === 2) y = "20" + y; res += ", " + y; }
  } else {
    res = day + " " + months[mo - 1];
    if (year) { let y = year; if (y.length === 2) y = "20" + y; res += " " + y; }
  }
  return res;
}

// Плюрализация с учётом языка. Для EN достаточно "one" vs "many",
// но сохраняем сигнатуру с тремя формами, чтобы не менять вызовы.
function pluralRu(n, one, few, many) {
  if (currentLang === "en") {
    return n === 1 ? one : many;
  }
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

// Склонение по роду (male / female / other). Ключи вида
// "lastSeen.minutes.{gender}" — их и берём.
function genderKey(base, gender) {
  if (gender === "male" || gender === "female") return base + "." + gender;
  return base + ".other";
}

function genderVerb(profile) {
  const g = profile && profile.gender;
  if (g === "female") return "была";
  if (g === "male") return "был";
  return "был(-а)";
}

function formatLastSeen(profile) {
  if (!profile) return "";
  const lastSeen = profile.last_seen ? new Date(profile.last_seen).getTime() : 0;
  if (!lastSeen) return "";
  const diffSec = Math.floor((Date.now() - lastSeen) / 1000);
  if (diffSec < 45) return t("lastSeen.online");

  const g = profile.gender;
  const gk = genderKey("lastSeen", g); // "lastSeen.male" и т.п. — не используем напрямую
  const gSuffix = (g === "male" || g === "female") ? "." + g : ".other";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 1) return t("lastSeen.recently" + gSuffix);
  if (diffMin < 60) {
    const word = pluralRu(
      diffMin,
      t("lastSeen.minWord.one"),
      t("lastSeen.minWord.few"),
      t("lastSeen.minWord.many")
    );
    return tFmt("lastSeen.minutes" + gSuffix, { n: diffMin, word });
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 13) {
    const word = pluralRu(
      diffHours,
      t("lastSeen.hourWord.one"),
      t("lastSeen.hourWord.few"),
      t("lastSeen.hourWord.many")
    );
    return tFmt("lastSeen.hours" + gSuffix, { n: diffHours, word });
  }
  const d = new Date(lastSeen);
  const nowDate = new Date();
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const time = d.toLocaleTimeString(localeId(), { hour: "2-digit", minute: "2-digit" });
  if (d.getTime() >= todayStart) return tFmt("lastSeen.today" + gSuffix, { time });
  if (d.getTime() >= yesterdayStart) return tFmt("lastSeen.yesterday" + gSuffix, { time });
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const date = `${day}/${month}/${year}`;
  return tFmt("lastSeen.date" + gSuffix, { date, time });
}

function isUserOnline(profile) {
  if (!profile || !profile.last_seen) return false;
  return (Date.now() - new Date(profile.last_seen).getTime()) < 45000;
}

async function updateMyLastSeen() {
  if (!currentUser) return;
  try {
    const { error } = await supabase.rpc("heartbeat");
    if (error) throw error;
  } catch (e) {
    // Fallback: прямой UPDATE
    try {
      await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", currentUser.id);
    } catch (e2) { /* silent */ }
  }
}

// Throttled-обёртка над updateMyLastSeen: не чаще одного раза в LAST_SEEN_THROTTLE_MS.
// Вызывается на mousemove / keydown / click / по интервалу — но реально бьёт по серверу
// не чаще указанного интервала. Это убирает сотни лишних запросов при движении мыши.
function throttledLastSeen() {
  if (!currentUser) return;
  resetInactivityTimer();
  const now = Date.now();
  if (now - lastSeenThrottleAt < LAST_SEEN_THROTTLE_MS) return;
  lastSeenThrottleAt = now;
  updateMyLastSeen();
}

// ======================================================
// 27. ПОДАРКИ
// ======================================================

function setupGiftsUI() {
  const giftsCloseBtn = document.getElementById("gifts-close");
  if (giftsCloseBtn) giftsCloseBtn.addEventListener("click", closeGiftsOverlay);

  // Контекстное меню подарка (ПКМ → Закрепить/Открепить)
  const giftMenu = document.getElementById("gift-context-menu");
  if (giftMenu) {
    giftMenu.addEventListener("click", async (e) => {
      const btn = e.target.closest("button"); if (!btn) return;
      e.stopPropagation();
      const ugId = giftMenu.dataset.ugId;
      const action = btn.dataset.action;
      giftMenu.classList.add("hidden");
      if (!ugId) return;

      if (action === "pin") {
        const { data: ug } = await supabase.from("user_gifts").select("pinned_at").eq("id", ugId).maybeSingle();
        const newVal = (ug && ug.pinned_at) ? null : new Date().toISOString();
        const { error } = await supabase.from("user_gifts").update({ pinned_at: newVal }).eq("id", ugId);
        if (error) { await showAlertDialog("Ошибка", error.message); return; }
        renderGiftsMain(currentUser.id);
      } else if (action === "visibility") {
        const { data: ug } = await supabase.from("user_gifts").select("in_profile").eq("id", ugId).maybeSingle();
        const newVal = !(ug && ug.in_profile);
        const { error } = await supabase.from("user_gifts").update({ in_profile: newVal }).eq("id", ugId);
        if (error) { await showAlertDialog("Ошибка", error.message); return; }
        await refreshMyGiftsCount();
        renderGiftsMain(currentUser.id);
      }
    });
    document.addEventListener("pointerdown", (e) => {
      if (giftMenu.classList.contains("hidden")) return;
      if (giftMenu.contains(e.target)) return;
      if (justLongPressed()) return;
      giftMenu.classList.add("hidden");
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  // Клик по имени в «Подарок для X»:
  // закрываем окно подарка → открываем профиль → запоминаем контекст для возврата
  document.addEventListener("click", async (e) => {
    const link = e.target.closest(".gift-recipient-link");
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();

    const uid = link.dataset.uid;
    if (!uid) return;

    // Запоминаем, куда возвращаться
    if (currentGiftDetailUserId && currentGiftDetailUgId) {
      profileFromGiftContext = {
        userId: currentGiftDetailUserId,
        ugId: currentGiftDetailUgId,
      };
    }

    // Закрываем окно подарка
    document.getElementById("gifts-overlay").classList.add("hidden");

    // Открываем профиль
    const p = profileCache.get(uid) || await getProfile(uid);
    if (p) await openUserProfileDialog(p);
  }, true);
}

async function refreshMyGiftsCount() {
  if (!currentUser) return;
  const { count } = await supabase.from("user_gifts")
    .select("id", { count: "exact", head: true }).eq("owner_id", currentUser.id);
  const el = document.getElementById("profile-gifts-count");
  if (el) el.textContent = String(count || 0);
}

async function refreshBalance() {
  const { data } = await supabase.from("profiles").select("imagi_tokens").eq("id", currentUser.id).single();
  if (data) {
    myProfile.imagi_tokens = data.imagi_tokens;
    const el = document.getElementById("gifts-balance");
    if (el) el.textContent = String(data.imagi_tokens);
  }
}

function giftRarityLabel(r) {
  if (r === "common") return t("gifts.rarity.common");
  if (r === "rare") return t("gifts.rarity.rare");
  if (r === "epic") return t("gifts.rarity.epic");
  return r;
}



// ======================================================
// ПАТТЕРНЫ ПОДАРКОВ (только для epic).
// Тир 1 = лучший (🟦), тир 6 = обычный (🟫).
// ======================================================

// Маленькая иконка внутри большого тайла — как в Telegram.
const PATTERN_TILE_SIZE = 100;   // шаг сетки (больше = реже)
const PATTERN_ICON_SIZE = 25;    // размер иконки внутри тайла

const PATTERN_MASK_CACHE = new Map();

// Скачивает иконку через wsrv.nl (обход CORS у i.ibb.co),
// прогоняет через FileReader → base64 и собирает SVG-маску,
// где иконка маленькая в центре большого тайла.
// Настройки паттернов: TILE — размер плитки (иконка + зазор), ICON — размер самой иконки.
// Меняй эти два числа, чтобы управлять размером и промежутком.
const PATTERN_SVG_TILE = 125;   // плитка выросла, чтобы зазор остался тем же
const PATTERN_SVG_ICON = 50;    // иконка в 2 раза больше прежней

async function buildPatternMaskUrl(iconUrl) {
  if (!iconUrl) return null;
  if (PATTERN_MASK_CACHE.has(iconUrl)) return PATTERN_MASK_CACHE.get(iconUrl);

  try {
    // ВАЖНО: SVG внутри data:URI не имеет права грузить внешние картинки —
    // браузер молча рисует «битую иконку». Поэтому сначала качаем картинку
    // через wsrv.nl (обход CORS у i.ibb.co), кодируем в base64 и вставляем в SVG.
    const bare = iconUrl.replace(/^https?:\/\//, "");
    const proxied = `https://wsrv.nl/?url=${encodeURIComponent(bare)}&output=png`;
    const res = await fetch(proxied);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await res.blob();

    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("FileReader"));
      r.readAsDataURL(blob);
    });

    const tile = PATTERN_SVG_TILE;
    const icon = PATTERN_SVG_ICON;
    const off = (tile - icon) / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}"><image href="${dataUrl}" x="${off}" y="${off}" width="${icon}" height="${icon}"/></svg>`;
    const bgUrl = `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}')`;
    PATTERN_MASK_CACHE.set(iconUrl, bgUrl);
    return bgUrl;
  } catch (e) {
    console.warn("pattern build failed:", e);
    PATTERN_MASK_CACHE.set(iconUrl, null);
    return null;
  }
}

// Заполняет все плейсхолдеры паттернов внутри rootEl:
// — плитки в списке подарков и в hero (.gift-tile-pattern / .gift-hero-pattern);
// — карточки подарков в чате (.gift-card-inline-pattern).
function fillGiftPatternsIn(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll(".gift-tile-pattern[data-icon], .gift-hero-pattern[data-icon], .gift-card-inline-pattern[data-icon]")
    .forEach((el) => {
      const iconUrl = el.dataset.icon;
      if (!iconUrl) return;
      buildPatternMaskUrl(iconUrl).then((bgUrl) => {
        if (!bgUrl) return;
        el.style.display = "block";
        el.style.backgroundImage = bgUrl;
        el.style.backgroundRepeat = "repeat";
      });
    });
}

// Предзагрузка всех иконок паттернов в кэш браузера.
// Без этого после покупки подарка паттерн появляется с задержкой —
// браузер только в этот момент начинает скачивать картинку с i.ibb.co.
let patternIconsPreloaded = false;
function preloadPatternIcons() {
  if (patternIconsPreloaded) return;
  patternIconsPreloaded = true;
  // Строим SVG-маски заранее — так после покупки паттерн рисуется мгновенно.
  GIFT_PATTERNS.forEach((p) => {
    if (!p.icon) return;
    buildPatternMaskUrl(p.icon).catch(() => {});
  });
}

// Поле collection:
//   null          — универсальный паттерн (подходит любым подаркам без коллекции)
//   "New Year"    — только для подарков, у которых cat.collection === "New Year"
// Если у подарка есть коллекция, но ни один паттерн ей не назначен —
// система откатится на универсальные (collection: null), чтобы не сломать покупку.
const GIFT_PATTERNS = [
  // Tier 1 — 🟦 (0.75% каждый)
  { id: "Tiger",              icon: "https://i.ibb.co/twqHC62m/icons8-tiger-100.png",            tier: 1, collection: null },
  { id: "Diamond",            icon: "https://i.ibb.co/HpDjsYGW/icons8-100.png",                  tier: 1, collection: null },
  { id: "Lovely Rose",        icon: "https://i.ibb.co/m5wCnxZJ/icons8-100.png",                  tier: 1, collection: null },
  { id: "Honeycomb",          icon: "https://i.ibb.co/VWx1VhTJ/icons8.png",                      tier: 1, collection: null },
  { id: "Avocado",            icon: "https://i.ibb.co/vMsQ6zt/icons8-avocado-100.png",           tier: 1, collection: null },
  { id: "Cow Skull",          icon: "https://i.ibb.co/BK658J03/icons8-cow-skull-100.png",        tier: 1, collection: null },
  // Tier 2 — 🟩 (1% каждый)
  { id: "Dragon",             icon: "https://i.ibb.co/BHmvdSfj/icons8-dragon-100.png",           tier: 2, collection: null },
  { id: "Turtle Fight",       icon: "https://i.ibb.co/LXnkDyqs/icons8-ninja-turtle-100.png",     tier: 2, collection: null },
  { id: "Danger",             icon: "https://i.ibb.co/vxxbbKCc/icons8-poison-100.png",           tier: 2, collection: null },
  { id: "Cybersport",         icon: "https://i.ibb.co/HfW2q7QC/icons8-100.png",                  tier: 2, collection: null },
  { id: "Paw",                icon: "https://i.ibb.co/hJpC0Lk8/icons8-100.png",                  tier: 2, collection: null },
  { id: "Strawberry",         icon: "https://i.ibb.co/pvmhb5xW/icons8-strawberry-100.png",       tier: 2, collection: null },
  { id: "Raspberry",          icon: "https://i.ibb.co/R4MKW7Wg/icons8-raspberry-100.png",        tier: 2, collection: null },
  { id: "Maple Leaves",       icon: "https://i.ibb.co/jkX6gBkf/icons8-autumn-100.png",           tier: 2, collection: null },
  { id: "Poop",               icon: "https://i.ibb.co/jkfgWpPx/icons8-100.png",                  tier: 2, collection: null },
  // Tier 3 — 🟨 (2% каждый)
  { id: "Pizza",              icon: "https://i.ibb.co/35DsZYKS/icons8-salami-pizza-100.png",     tier: 3, collection: null },
  { id: "Champion's Trophey", icon: "https://i.ibb.co/HJ7cKK7/icons8-trophy-100.png",            tier: 3, collection: null },
  { id: "Shimmer",            icon: "https://i.ibb.co/ycRy1zV3/icons8-100-1.png",                tier: 3, collection: null },
  { id: "Knight's Sword",     icon: "https://i.ibb.co/CpVpcNMp/icons8-100.png",                  tier: 3, collection: null },
  { id: "Fire",               icon: "https://i.ibb.co/hxTvMMGK/icons8-90.png",                   tier: 3, collection: null },
  { id: "Get out of here",    icon: "https://i.ibb.co/N635zXNp/icons8-100.png",                  tier: 3, collection: null },
  { id: "Bear Footprint",     icon: "https://i.ibb.co/9kgxhz33/icons8-bear-footprint-100.png",   tier: 3, collection: null },
  { id: "Bull",               icon: "https://i.ibb.co/7NVw2wr7/icons8-bull-100.png",             tier: 3, collection: null },
  { id: "Unicorn",            icon: "https://i.ibb.co/m5zthc0B/icons8-unicorn-100.png",          tier: 3, collection: null },
  { id: "Dirty Prank",        icon: "https://i.ibb.co/0y1HSJvR/icons8-100.png",                  tier: 3, collection: null },
  // Tier 4 — 🟧 (3% каждый)
  { id: "Compass",            icon: "https://i.ibb.co/39JNnHLp/icons8-adventures-100.png",       tier: 4, collection: null },
  { id: "Crescent",           icon: "https://i.ibb.co/zTcHnrst/icons8-crescent-moon-100.png",    tier: 4, collection: null },
  { id: "Crown",              icon: "https://i.ibb.co/hRLv5SNS/icons8-crown-100.png",            tier: 4, collection: null },
  { id: "Laurel Wreath",      icon: "https://i.ibb.co/mVJK3dvW/icons8-laurel-wreath-100.png",    tier: 4, collection: null },
  { id: "Horse",              icon: "https://i.ibb.co/43hjhyr/icons8-year-of-horse-100.png",     tier: 4, collection: null },
  { id: "Thunderbolt",        icon: "https://i.ibb.co/VySF8T3/icons8-100.png",                   tier: 4, collection: null },
  { id: "Hands Up!",          icon: "https://i.ibb.co/vxjzDkvv/icons8-100.png",                  tier: 4, collection: null },
  { id: "Bugs",               icon: "https://i.ibb.co/dnQt6CS/icons8-bug-100.png",               tier: 4, collection: null },
  { id: "Grapes",             icon: "https://i.ibb.co/99dNQQxJ/icons8-grapes-100.png",           tier: 4, collection: null },
  { id: "King's Guard",       icon: "https://i.ibb.co/3mBWW1MD/icons8-queen-s-guard-100.png",    tier: 4, collection: null },
  { id: "Toilet Paper",       icon: "https://i.ibb.co/wrQb3pV8/icons8-100.png",                  tier: 4, collection: null },
  { id: "Toilet",             icon: "https://i.ibb.co/35P7d21m/icons8-100.png",                  tier: 4, collection: null },
  // Tier 5 — 🟥 (4% каждый)
  { id: "Happy Ice Cream",    icon: "https://i.ibb.co/mCJycjJZ/icons8-kawaii-ice-cream-100.png", tier: 5, collection: null },
  { id: "Wolf",               icon: "https://i.ibb.co/cK67rPXt/icons8-wolf-100.png",             tier: 5, collection: null },
  { id: "Box",                icon: "https://i.ibb.co/xtKBvzqv/icons8-100.png",                  tier: 5, collection: null },
  { id: "Flight",             icon: "https://i.ibb.co/BVs0Y9ZB/icons8-100.png",                  tier: 5, collection: null },
  { id: "Special Present",    icon: "https://i.ibb.co/wZwsmk3S/icons8-96.png",                   tier: 5, collection: null },
  { id: "Rocket",             icon: "https://i.ibb.co/CstWw3w9/icons8-100.png",                  tier: 5, collection: null },
  { id: "Citrus",             icon: "https://i.ibb.co/pv1jLytN/icons8-citrus-100.png",           tier: 5, collection: null },
  { id: "Magician",           icon: "https://i.ibb.co/1fQVV2BS/icons8-magician-100.png",         tier: 5, collection: null },
  { id: "Confetti",           icon: "https://i.ibb.co/gMvXFMB1/icons8-confetti-100.png",         tier: 5, collection: null },
  // Tier 6 — 🟫 (5% каждый)
  { id: "Badminton",          icon: "https://i.ibb.co/gZtJJZ2W/icons8-badminton-100.png",        tier: 6, collection: null },
  { id: "Basketball",         icon: "https://i.ibb.co/7NKNK0pw/icons8-basketball-100.png",       tier: 6, collection: null },
  { id: "Kimono",             icon: "https://i.ibb.co/hxnc5b9K/icons8-kimono-100.png",           tier: 6, collection: null },
  { id: "Ping-pong",          icon: "https://i.ibb.co/hRwj1Sh8/icons8-ping-pong-100.png",        tier: 6, collection: null },
  { id: "Volleyball",         icon: "https://i.ibb.co/q3m8ty5z/icons8-volleyball-100.png",       tier: 6, collection: null },
  { id: "Microphone",         icon: "https://i.ibb.co/tP2tK3cw/icons8-100-1.png",                tier: 6, collection: null },
  { id: "Football",           icon: "https://i.ibb.co/ymkH14jy/icons8-100.png",                  tier: 6, collection: null },
  { id: "Hamburger",          icon: "https://i.ibb.co/20RhBX2B/icons8-hamburger-100.png",        tier: 6, collection: null },
  { id: "Hot Dog",            icon: "https://i.ibb.co/zVbSJkj0/icons8-hot-dog-100.png",          tier: 6, collection: null },
  { id: "Cupid on Target",    icon: "https://i.ibb.co/ymqYGfKf/icons8-cupid-target-100.png",     tier: 6, collection: null }
];

const PATTERN_TIER_CHANCE = { 1: 0.75, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };

function getPatternChance(id) {
  if (!id) return null;
  const p = GIFT_PATTERNS.find((x) => x.id === id);
  if (!p) return null;
  return PATTERN_TIER_CHANCE[p.tier] !== undefined ? PATTERN_TIER_CHANCE[p.tier] : null;
}

function getPatternIcon(id) {
  if (!id) return null;
  const p = GIFT_PATTERNS.find((x) => x.id === id);
  return p ? p.icon : null;
}

// Нормализует поле collection паттерна в массив имён коллекций.
// Поддерживает три формата:
//   null                       → []                    (универсальный)
//   "New Year"                 → ["New Year"]          (одна коллекция)
//   ["New Year", "Halloween"]  → ["New Year","Halloween"] (несколько)
function patternCollections(p) {
  const c = p && p.collection;
  if (!c) return [];
  if (Array.isArray(c)) return c.filter(Boolean).map(String);
  return [String(c)];
}

// Возвращает «вес» паттерна для ролла.
// Приоритет: p.chance (если задан явно, в процентах) → иначе вес его тира.
function patternWeight(p) {
  if (p && typeof p.chance === "number" && p.chance > 0) return p.chance;
  return PATTERN_TIER_CHANCE[p.tier] || 1;
}

function rollPatternForEpic(collectionId) {
  let pool = collectionId
    ? GIFT_PATTERNS.filter((p) => patternCollections(p).includes(collectionId))
    : [];
  if (!pool.length) pool = GIFT_PATTERNS.filter((p) => patternCollections(p).length === 0);
  if (!pool.length) pool = GIFT_PATTERNS;

  const totalWeight = pool.reduce((s, p) => s + patternWeight(p), 0);
  let r = Math.random() * totalWeight;
  for (const p of pool) {
    r -= patternWeight(p);
    if (r <= 0) return p.id;
  }
  return pool[pool.length - 1].id;
}

// ======================================================
// МОДЕЛИ ЭПИЧЕСКИХ ПОДАРКОВ
// ======================================================
// Модели хранятся прямо в строке gift_catalog.models — как JSONB-массив:
//   [ { id, name, image, chance }, ... ]
// При покупке эпического подарка роллится одна модель по весам chance.
// id и name сохраняются в user_gifts.model_id / model_name.
//
// Если у подарка нет models — ролл ничего не делает, всё работает как раньше.

// Роллит модель по весам. Возвращает {id, name} или null.
function rollModelForGift(gift) {
  const models = gift && Array.isArray(gift.models) ? gift.models : [];
  if (!models.length) return null;
  const total = models.reduce((s, m) => s + (Number(m.chance) || 0), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const m of models) {
    r -= Number(m.chance) || 0;
    if (r <= 0) return { id: m.id, name: m.name || m.id };
  }
  const last = models[models.length - 1];
  return { id: last.id, name: last.name || last.id };
}

// Возвращает id модели по её id в каталоге подарка (для поиска картинки).
function findGiftModel(cat, modelId) {
  if (!cat || !modelId || !Array.isArray(cat.models)) return null;
  return cat.models.find((m) => m.id === modelId) || null;
}

// Возвращает URL картинки подарка с учётом модели.
// Если модель есть и у неё есть image — берём её. Иначе — базовый cat.emoji.
function giftDisplayImage(cat, ug) {
  if (ug && ug.model_id) {
    const m = findGiftModel(cat, ug.model_id);
    if (m && m.image) return m.image;
  }
  return cat ? cat.emoji : "";
}

// Картинка для каталога (когда ug ещё нет — подарок не куплен).
// Приоритет:
//   1. Если у подарка есть models — берём СЛУЧАЙНУЮ модель.
//   2. Иначе — cat.emoji (emoji-символ или ссылка).
// Кэшируем результат на 5 сек на объекте cat, чтобы при каждом ре-рендере
// каталога картинка не мигала.
function giftCatalogImage(cat) {
  if (!cat) return "";
  if (Array.isArray(cat.models) && cat.models.length) {
    // Если кэш свежий — берём сохранённую
    const now = Date.now();
    if (cat._previewCache && now - cat._previewCache.ts < 5000) {
      return cat._previewCache.url;
    }
    const idx = Math.floor(Math.random() * cat.models.length);
    const url = cat.models[idx].image || cat.emoji || "";
    cat._previewCache = { url, ts: now };
    return url;
  }
  return cat.emoji || "";
}

// Шансы фонов (в %) — должны совпадать с buy_gift в Supabase
const BACKGROUND_CHANCES = {
  // Tier 1 — 0.5%
  "Vantablack": 0.5,

  // Tier 2 — 1.2%
  "Pure Gold": 1.2,
  "Honey": 1.2,
  "Absolute Pure": 1.2,

  // Tier 3 — 2%
  "Onyx": 2,
  "Ice and Fire": 2,
  "Abyss": 2,

  // Tier 4 — 2.9%
  "Boner": 2.9,
  "Frosty Day": 2.9,
  "Aurora": 2.9,
  "Lavender": 2.9,
  "Sapphire": 2.9,

  // Tier 5 — 3.05%
  "Ruby": 3.05,
  "Emerald": 3.05,
  "Amethyst": 3.05,
  "Topaz": 3.05,
  "Aquamarine": 3.05,
  "Rose Quartz": 3.05,
  "Nebula": 3.05,
  "Comet": 3.05,
  "Flame": 3.05,
  "Sunset": 3.05,
  "Scarlet Blood": 3.05,
  "Bronze": 3.05,

  // Tier 6 — 3.527%
  "Steel": 3.527,
  "Obsidian": 3.527,
  "Moss": 3.527,
  "Autumn": 3.527,
  "Bark": 3.527,
  "Mint": 3.527,
  "Swamp": 3.527,
  "Acid": 3.527,
  "Ice": 3.527,
  "Steel Rain": 3.527,
  "Pistachio": 3.527
};

function getBackgroundChance(name) {
  if (!name) return null;
  const v = BACKGROUND_CHANCES[name];
  return v !== undefined ? v : null;
}

function giftBackgroundStyle(bg, bgType) {
  if (!bg) return "background: var(--bg-input);";
  // Все новые фоны — пара "центр|край" → radial-gradient(circle, ...)
  if (bg.includes("|")) {
    const [c1, c2] = bg.split("|");
    return `background: radial-gradient(circle, ${c1} 0%, ${c2} 100%);`;
  }
  return `background: ${bg};`;
}

async function loadGiftCatalog() {
  if (giftCatalogCache.length) return giftCatalogCache;
  const { data } = await supabase.from("gift_catalog")
    .select("*")
    .eq("hidden", false);
  giftCatalogCache = data || [];
  return giftCatalogCache;
}

function openGiftsOverlay(userId) {
  document.getElementById("gifts-overlay").classList.remove("hidden");
  refreshBalance();
  preloadPatternIcons();
  renderGiftsMain(userId);
}

function closeGiftsOverlay() {
  const el = document.getElementById("gifts-overlay");
  if (el) el.classList.add("hidden");
}

async function renderGiftsMain(userId) {
  const content = document.getElementById("gifts-content");
  const title = document.getElementById("gifts-title");
  const backBtn = document.getElementById("gifts-back");
  backBtn.classList.add("hidden");
  content.innerHTML = '<div class="empty">Загрузка...</div>';

  const isMe = userId === currentUser.id;
  if (isMe) {
    title.textContent = t("gifts.title.mine");
  } else {
    const p = profileCache.get(userId);
    title.textContent = tFmt("gifts.title.user", { name: p ? p.display_name : "" });
  }

  let giftsQuery = supabase.from("user_gifts").select("*").eq("owner_id", userId);
  if (!isMe) giftsQuery = giftsQuery.eq("in_profile", true);
  const { data: giftsRaw } = await giftsQuery.order("created_at", { ascending: false });

  // Закреплённые — наверх (свежезакреплённые выше), затем по дате создания
  const allGifts = giftsRaw || [];
  const pinned = allGifts.filter((g) => g.pinned_at)
    .sort((a, b) => new Date(b.pinned_at) - new Date(a.pinned_at));
  const unpinned = allGifts.filter((g) => !g.pinned_at);
  const gifts = [...pinned, ...unpinned];

  const catalog = await loadGiftCatalog();
  const catalogMap = new Map(catalog.map((g) => [g.id, g]));

  let html = "";
  const buyLabel = isMe
    ? t("gifts.buy.button")
    : tFmt("gifts.buy.buttonFor", { name: (profileCache.get(userId) || {}).display_name || "" });
  html += `<button class="gift-card-button" style="width:100%;padding:12px;margin-bottom:12px;" id="open-catalog-btn"><span class="cell-icon cell-icon-sm" data-icon="shop" style="vertical-align:-3px;margin-right:6px;"></span>${escapeHtml(buyLabel)}</button>`;

  if (!gifts.length) {
    html += isMe
      ? `<div class="empty">${escapeHtml(t("gifts.empty.mine"))}</div>`
      : `<div class="empty">${escapeHtml(t("gifts.empty.other"))}</div>`;
  } else {
    html += `<div class="gifts-grid">`;
    gifts.forEach((ug) => {
      const cat = catalogMap.get(ug.gift_id);
      if (!cat) return;
      const bg = giftBackgroundStyle(ug.background, ug.background_rarity);
      const isLimited = cat.max_supply !== null && cat.max_supply !== undefined;
      const ribbon = isLimited ? `<div class="gift-tile-ribbon">#${ug.serial_number}</div>` : "";
      const pinMark = ug.pinned_at
        ? `<div class="gift-tile-pin"><span class="cell-icon cell-icon-sm" data-icon="pin"></span></div>`
        : "";
      const patternIcon = cat.rarity === "epic" ? getPatternIcon(ug.pattern_id) : null;
      const inProfileClass = (isMe && ug.in_profile) ? " in-profile" : "";
      const displayImg = giftDisplayImage(cat, ug);
      html += `
        <div class="gift-tile${inProfileClass}" data-gift-ug-id="${ug.id}" data-pinned="${ug.pinned_at ? "1" : "0"}" data-in-profile="${ug.in_profile ? "1" : "0"}">
          ${ribbon}
          ${pinMark}
          <div class="gift-tile-emoji" style="${bg}">
            ${patternIcon ? `<div class="gift-tile-pattern" data-icon="${patternIcon}"></div>` : ""}
            <span class="gift-tile-emoji-symbol">${renderGiftModel(displayImg, 90)}</span>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  content.innerHTML = html;

  const openBtn = document.getElementById("open-catalog-btn");
  if (openBtn) openBtn.addEventListener("click", () => renderCatalog(userId));

  // Асинхронно дорисовываем паттерны на плитках
  content.querySelectorAll(".gift-tile-pattern[data-icon]").forEach((el) => {
    const iconUrl = el.dataset.icon;
    if (!iconUrl) return;
    buildPatternMaskUrl(iconUrl).then((bgUrl) => {
      if (!bgUrl) return;
      el.style.display = "block";
      el.style.backgroundImage = bgUrl;
      el.style.backgroundRepeat = "repeat";
    });
  });

  // Сброс прокрутки — список всегда открывается с шапки
  content.scrollTop = 0;

  content.querySelectorAll(".gift-tile").forEach((el) => {
    el.addEventListener("click", () => {
      const ugId = el.dataset.giftUgId;
      const ug = gifts.find((g) => g.id === ugId);
      if (ug) renderGiftDetail(userId, ug);
    });
    if (isMe) {
      const ctxHandler = (ev) => {
        if (ev.preventDefault) ev.preventDefault();
        if (ev.stopPropagation) ev.stopPropagation();
        const ug = gifts.find((g) => g.id === el.dataset.giftUgId);
        if (ug) openGiftTileContextMenu(ev, ug.id, !!ug.pinned_at, !!ug.in_profile);
      };
      el.addEventListener("contextmenu", ctxHandler);
      attachLongPress(el, ctxHandler);
    }
  });
}

function openGiftTileContextMenu(ev, ugId, isPinned, inProfile) {
  const menu = document.getElementById("gift-context-menu");
  if (!menu) return;
  const pinBtn = menu.querySelector('button[data-action="pin"]');
  if (pinBtn) pinBtn.textContent = isPinned ? t("gifts.action.unpin") : t("gifts.action.pin");
  const visBtn = menu.querySelector('button[data-action="visibility"]');
  if (visBtn) visBtn.textContent = inProfile ? t("gifts.action.fromProfile") : t("gifts.action.toProfile");
  menu.dataset.ugId = ugId;
  menu.classList.remove("hidden");
  menu.style.left = "0px";
  menu.style.top = "0px";
  const rect = menu.getBoundingClientRect();
  let x = ev.clientX, y = ev.clientY;
  if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
  if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
  menu.style.left = x + "px";
  menu.style.top = y + "px";
  blockUntilTouchRelease(menu);
}

async function renderCatalog(recipientId) {
  const content = document.getElementById("gifts-content");
  const title = document.getElementById("gifts-title");
  const backBtn = document.getElementById("gifts-back");
  backBtn.classList.remove("hidden");
  backBtn.onclick = () => renderGiftsMain(recipientId);
  title.textContent = t("gifts.title.catalog");
  content.innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';

  await refreshBalance();
  const balance = (myProfile && myProfile.imagi_tokens) || 0;

  const catalog = await loadGiftCatalog();
  if (!catalog.length) { content.innerHTML = '<div class="empty">' + escapeHtml(t("gifts.empty.catalog")) + '</div>'; return; }

  // Считаем ВСЕ выпущенные подарки (даже если владелец продал — серийник уже существует и «слот» занят).
  // Считаем ВСЕ выпущенные подарки через SECURITY DEFINER RPC — обходит RLS,
  // и не зависит от owner_id (проданные через sell_gift не «освобождают» слот).
  const { data: sold } = await supabase.rpc("get_gift_sold_counts");
  const soldMap = new Map();
  (sold || []).forEach((s) => soldMap.set(s.gift_id, Number(s.sold_count) || 0));

  content.innerHTML = catalog.map((g) => {
    const soldCount = soldMap.get(g.id) || 0;
    const soldOut = g.max_supply !== null && soldCount >= g.max_supply;
    const canAfford = balance >= g.price;
    const disabled = soldOut || !canAfford;
    const supplyText = g.max_supply !== null ? `${soldCount} / ${g.max_supply}` : `${soldCount}`;
    let btnText;
    if (soldOut) btnText = escapeHtml(t("gifts.soldOut"));
    else if (!canAfford) btnText = `${NECTAR_HTML} ${g.price} · ${escapeHtml(t("gifts.lowBalance"))}`;
    else btnText = `${NECTAR_HTML} ${g.price}`;
    return `
      <div class="gift-card" data-cat-id="${g.id}">
        <div class="gift-card-emoji" style="background: var(--bg-input);">${renderGiftModel(giftCatalogImage(g), 48)}</div>
        <div class="gift-card-body">
          <div class="gift-card-name">${escapeHtml(g.name)}</div>
          <div class="gift-card-sub gift-rarity-${g.rarity}">${giftRarityLabel(g.rarity)}${g.collection ? " · " + escapeHtml(g.collection) : ""} · ${supplyText}</div>
        </div>
        <button class="gift-card-button" ${disabled ? "disabled" : ""} data-buy="${g.id}">
          ${btnText}
        </button>
      </div>`;
  }).join("");

  content.querySelectorAll("button[data-buy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      const gid = btn.dataset.buy;
      const gift = catalog.find((g) => g.id === gid);
      if (gift) openGiftPurchase(gift, recipientId);
    });
  });
}

function openGiftPurchase(gift, recipientId) {
  const overlay = document.getElementById("gift-purchase-overlay");
  const titleEl = document.getElementById("gift-purchase-title");
  const infoEl = document.getElementById("gift-purchase-info");
  const costEl = document.getElementById("gift-purchase-cost");
  const captionInput = document.getElementById("gift-purchase-caption");
  const withNameCb = document.getElementById("gift-purchase-with-name");
  const withNameLabel = document.getElementById("gift-purchase-with-name-label");
  const confirmBtn = document.getElementById("gift-purchase-confirm");
  const cancelBtn = document.getElementById("gift-purchase-cancel");

  const isSelf = recipientId === currentUser.id;
  const recipient = profileCache.get(recipientId);
  const recipientName = recipient ? recipient.display_name : "";

  titleEl.textContent = isSelf
    ? t("gifts.purchase.title.self")
    : tFmt("gifts.purchase.title.other", { name: recipientName });
  infoEl.innerHTML = `${renderGiftModel(gift.emoji, 20)} <span style="vertical-align:middle;">${escapeHtml(gift.name)} — ${giftRarityLabel(gift.rarity)}${gift.collection ? " · " + escapeHtml(gift.collection) : ""}</span>`;
  costEl.innerHTML = tFmt("gifts.purchase.cost", { price: `${NECTAR_HTML} <b>${gift.price}</b>` });
  captionInput.value = "";
  captionInput.placeholder = t("gifts.purchase.caption");
  const captionCounter = document.getElementById("gift-caption-counter");
  if (captionCounter) captionCounter.textContent = "0 / 25";
  captionInput.oninput = () => {
    if (captionCounter) captionCounter.textContent = `${captionInput.value.length} / 25`;
  };
  if (withNameCb) withNameCb.checked = false;
  if (withNameLabel) withNameLabel.textContent = t("gifts.purchase.withName.self");
  overlay.classList.remove("hidden");

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = t("gifts.purchase.buying");
    const caption = captionInput.value.trim() || null;
    const withName = !!(withNameCb && withNameCb.checked);

    const { data: newGiftId, error } = await supabase.rpc("buy_gift", {
      p_gift_id: gift.id, p_recipient_id: recipientId, p_caption: caption,
    });

    if (error) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = t("gifts.purchase.buy");
      await showAlertDialog(t("gifts.error"), error.message);
      return;
    }

    // Роллим модель + паттерн для epic-подарка
    if (gift.rarity === "epic" && newGiftId) {
      const updatePayload = {};
      // Модель — если у подарка заданы models
      const model = rollModelForGift(gift);
      if (model) {
        updatePayload.model_id = model.id;
        updatePayload.model_name = model.name;
      }
      // Паттерн — как было
      const patternId = rollPatternForEpic(gift.collection || null);
      if (patternId) updatePayload.pattern_id = patternId;

      if (Object.keys(updatePayload).length) {
        try {
          await supabase.from("user_gifts")
            .update(updatePayload)
            .eq("id", newGiftId);
        } catch (e) { console.warn("gift roll:", e); }
      }
    }

    // Если отмечена галочка «С моим именем» — сохраняем ИМЯ ПОКУПАТЕЛЯ (моё).
    //    Работает одинаково: и когда покупаешь себе, и когда другому.
    if (withName && newGiftId) {
      const myName = (myProfile && myProfile.display_name || "").trim();
      if (myName) {
        const { error: upErr } = await supabase
          .from("user_gifts")
          .update({ sender_id: currentUser.id, sender_name: myName })
          .eq("id", newGiftId);
        if (upErr) {
          console.error("Не удалось сохранить имя отправителя:", upErr);
          await showAlertDialog(
            t("gifts.error"),
            t("gifts.purchase.saveSenderFail") + ": " + upErr.message
          );
        }
      }
    }

    // Если подарок куплен другому — отправляем системное сообщение в чат
    if (!isSelf) {
      const chatId = chatIdByUser.get(recipientId);
      if (chatId && newGiftId) {
        await supabase.from("messages").insert({
          chat_id: chatId,
          sender_id: currentUser.id,
          content: "",
          message_type: "gift",
          gift_ref_id: newGiftId,
          delivered_at: new Date().toISOString(),
        });
      }
    }

    confirmBtn.disabled = false;
    confirmBtn.textContent = t("gifts.purchase.buy");
    overlay.classList.add("hidden");
    await refreshBalance();
    if (recipientId === currentUser.id) await refreshMyGiftsCount();
    giftCatalogCache = [];
    await loadGiftCatalog();

    // Открываем страницу только что купленного подарка
    if (newGiftId) {
      const { data: created } = await supabase.from("user_gifts").select("*").eq("id", newGiftId).maybeSingle();
      if (created) {
        await renderGiftDetail(recipientId, created);
        return;
      }
    }
    renderGiftsMain(recipientId);
  };
  cancelBtn.onclick = () => overlay.classList.add("hidden");
}

async function renderGiftDetail(ownerId, ug) {
  // Данные уже приходят свежими из списка — не делаем лишний запрос

  // Запоминаем контекст — чтобы вернуться именно к этому подарку
  currentGiftDetailUserId = ownerId;
  currentGiftDetailUgId = ug.id;

  const content = document.getElementById("gifts-content");
  const title = document.getElementById("gifts-title");
  const backBtn = document.getElementById("gifts-back");
  backBtn.classList.remove("hidden");
  backBtn.onclick = () => renderGiftsMain(ownerId);
  title.textContent = t("gifts.title.detail");

  const catalog = await loadGiftCatalog();
  const cat = catalog.find((c) => c.id === ug.gift_id);
  if (!cat) { content.innerHTML = '<div class="empty">' + escapeHtml(t("gifts.notFound")) + '</div>'; return; }

  const bg = giftBackgroundStyle(ug.background, ug.background_rarity);
  const isOwner = ug.owner_id === currentUser.id;
  const isInProfile = ug.in_profile === true;

  // Владелец
  const ownerProfile = profileCache.get(ug.owner_id) || await getProfile(ug.owner_id);
  const ownerName = ownerProfile ? ownerProfile.display_name : "—";

  // Шанс фона
  const bgChance = getBackgroundChance(ug.background_name);
  const bgChanceHtml = bgChance !== null ? `<span class="gir-badge">${bgChance}%</span>` : "";

  // Паттерн
  const patternIcon = getPatternIcon(ug.pattern_id);
  const patternChance = getPatternChance(ug.pattern_id);
  const patternChanceHtml = patternChance !== null ? `<span class="gir-badge">${patternChance}%</span>` : "";
  const patternRow = ug.pattern_id
    ? `<div class="gift-info-row">
        <span class="gir-label">${escapeHtml(t("gifts.detail.pattern"))}</span>
        <span class="gir-value">${escapeHtml(ug.pattern_id)}${patternChanceHtml}</span>
      </div>`
    : "";

  // Модель — только если у подарка есть models и в ug записан model_id
  const currentModel = ug.model_id ? findGiftModel(cat, ug.model_id) : null;
  const modelChance = currentModel && typeof currentModel.chance === "number"
    ? `<span class="gir-badge">${currentModel.chance}%</span>` : "";
  const modelRow = currentModel
    ? `<div class="gift-info-row">
        <span class="gir-label">${escapeHtml(t("gifts.detail.model"))}</span>
        <span class="gir-value">${escapeHtml(ug.model_name || currentModel.name || ug.model_id)}${modelChance}</span>
      </div>`
    : "";

  // Паттерн — рендерим асинхронно, чтобы не блокировать открытие окна
  const patternStyle = "display:none;";

  // Количество
  const maxSupply = (cat.max_supply !== null && cat.max_supply !== undefined) ? cat.max_supply : null;
  const qtyValue = maxSupply !== null
    ? `#${ug.serial_number} · ${tFmt("gifts.detail.limit", { n: maxSupply })}`
    : `#${ug.serial_number}`;

  // Подпись
  const captionHtml = ug.caption
    ? `<div class="gift-info-row"><span class="gir-label">${escapeHtml(t("gifts.detail.caption"))}</span><span class="gir-value">${escapeHtml(ug.caption)}</span></div>`
    : "";

  // Подарок для кого
  const recipientHtml = ug.recipient_name
    ? `<div class="gift-recipient-caption">${tFmt("gifts.detail.recipient", {
        name: ug.recipient_id
          ? `<a href="#" class="gift-recipient-link" data-uid="${ug.recipient_id}">${escapeHtml(ug.recipient_name)}</a>`
          : escapeHtml(ug.recipient_name)
      })}</div>`
    : "";

  // Кто подарил (галочка «С моим именем»)
  const senderHtml = ug.sender_name
    ? `<div class="gift-recipient-caption">${tFmt("gifts.detail.sender", {
        name: ug.sender_id
          ? `<a href="#" class="gift-recipient-link" data-uid="${ug.sender_id}">${escapeHtml(ug.sender_name)}</a>`
          : escapeHtml(ug.sender_name)
      })}</div>`
    : "";

  content.innerHTML = `
    <div class="gift-detail">
      <div class="gift-hero" style="${bg}">
        <div class="gift-hero-pattern" style="${patternStyle}"></div>
        <div class="gift-hero-emoji">${renderGiftModel(giftDisplayImage(cat, ug), 170)}</div>
      </div>

      <div class="gift-detail-name">${escapeHtml(cat.name)} #${ug.serial_number}</div>
      <div class="gift-detail-sub">${escapeHtml(cat.collection || "—")} · ${giftRarityLabel(cat.rarity)}</div>

      ${senderHtml}

      <div class="gift-info-table">
        ${captionHtml}
        <div class="gift-info-row">
          <span class="gir-label">${escapeHtml(t("gifts.detail.owner"))}</span>
          <span class="gir-value"><a href="#" class="gift-recipient-link" data-uid="${ug.owner_id}">${escapeHtml(ownerName)}</a></span>
        </div>
        <div class="gift-info-row">
          <span class="gir-label">${escapeHtml(t("gifts.detail.rarity"))}</span>
          <span class="gir-value">${giftRarityLabel(cat.rarity)}</span>
        </div>
        ${modelRow}
        ${ug.background_name ? `
        <div class="gift-info-row">
          <span class="gir-label">${escapeHtml(t("gifts.detail.background"))}</span>
          <span class="gir-value">${escapeHtml(ug.background_name)}${bgChanceHtml}</span>
        </div>` : ""}
        ${patternRow}
        <div class="gift-info-row">
          <span class="gir-label">${escapeHtml(t("gifts.detail.quantity"))}</span>
          <span class="gir-value">${qtyValue}</span>
        </div>
        <div class="gift-info-row">
          <span class="gir-label">${escapeHtml(t("gifts.detail.value"))}</span>
          <span class="gir-value">${NECTAR_HTML} ${cat.price}</span>
        </div>
      </div>

      <div class="gift-detail-actions">
        ${isOwner ? `
          <button class="dialog-btn ${isInProfile ? "dialog-cancel" : "dialog-primary"}" id="gift-toggle-visible">
            ${escapeHtml(isInProfile ? t("gifts.action.hideFromProfile") : t("gifts.action.addToProfile"))}
          </button>
          <button class="dialog-btn" id="gift-send"><span class="cell-icon cell-icon-sm" data-icon="gift" style="vertical-align:-3px;margin-right:6px;"></span>${escapeHtml(t("gifts.action.gift"))}</button>
          <button class="dialog-btn" id="gift-sell"><span class="cell-icon cell-icon-sm" data-icon="dollarBag" style="vertical-align:-3px;margin-right:6px;"></span>${tFmt("gifts.action.sell", { price: `${NECTAR_HTML} ${Math.floor(cat.price * 0.85)}` })}</button>
        ` : `
          <div class="dialog-text" style="text-align:center;">${escapeHtml(t("gifts.detail.notOwner"))}</div>
        `}
      </div>
    </div>`;

  // Асинхронно дорисовываем паттерн
  if (patternIcon) {
    buildPatternMaskUrl(patternIcon).then((bgUrl) => {
      if (!bgUrl) return;
      const el = content.querySelector(".gift-hero-pattern");
      if (!el) return;
      el.style.display = "block";
      el.style.backgroundImage = bgUrl;
      el.style.backgroundRepeat = "repeat";
    });
  }

  if (isOwner) {
    document.getElementById("gift-toggle-visible").addEventListener("click", async () => {
      const newVal = !isInProfile;
      const { error } = await supabase.from("user_gifts").update({ in_profile: newVal }).eq("id", ug.id);
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      ug.in_profile = newVal;
      await refreshMyGiftsCount();
      renderGiftDetail(ownerId, ug);
    });

    document.getElementById("gift-send").addEventListener("click", () => openGiftSend(ug));

    document.getElementById("gift-sell").addEventListener("click", async () => {
      const ok = await showConfirmDialog(
        t("gifts.sell.title"),
        tFmt("gifts.sell.text", { price: Math.floor(cat.price * 0.85) }),
        t("gifts.sell.confirm")
      );
      if (!ok) return;
      const { error } = await supabase.rpc("sell_gift", { p_user_gift_id: ug.id });
      if (error) { await showAlertDialog(t("gifts.error"), error.message); return; }
      await refreshBalance();
      await refreshMyGiftsCount();
      renderGiftsMain(ownerId);
    });
  }

  // Сбросить прокрутку контейнера — чтобы карточка подарка открывалась с шапки,
  // а не в середине/низу.
  const contentEl = document.getElementById("gifts-content");
  if (contentEl) contentEl.scrollTop = 0;
}

// Отправка подарка — только контактам (тем, с кем есть чат)
async function openGiftSend(ug) {
  const overlay = document.getElementById("gift-send-overlay");
  const listEl = document.getElementById("gift-send-list");
  overlay.classList.remove("hidden");
  listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';

  const { data: myChats } = await supabase.from("chat_members").select("chat_id").eq("user_id", currentUser.id);
  const chatIds = (myChats || []).map((c) => c.chat_id);
  if (!chatIds.length) { listEl.innerHTML = '<div class="empty">' + escapeHtml(t("gifts.empty.contacts")) + '</div>'; return; }

  const { data: others } = await supabase.from("chat_members")
    .select("chat_id, user_id").in("chat_id", chatIds).neq("user_id", currentUser.id);
  const userIds = [...new Set((others || []).map((o) => o.user_id))];
  if (!userIds.length) { listEl.innerHTML = '<div class="empty">' + escapeHtml(t("gifts.empty.contacts")) + '</div>'; return; }

  const { data: profiles } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url").in("id", userIds);

  let selectedId = null;

  listEl.innerHTML = (profiles || []).map((p) => `
    <div class="forward-item" data-uid="${p.id}">
      <div class="avatar"></div>
      <div class="fname">${escapeHtml(p.display_name)} <span style="color:var(--text-dim)">@${escapeHtml(p.username)}</span></div>
      <div class="fcheck hidden">✓</div>
    </div>
  `).join("");

  listEl.querySelectorAll(".forward-item").forEach((el) => {
    const p = profiles.find((x) => x.id === el.dataset.uid);
    paintAvatar(el.querySelector(".avatar"), p);
    el.addEventListener("click", () => {
      listEl.querySelectorAll(".forward-item").forEach((x) => {
        x.classList.remove("selected");
        x.querySelector(".fcheck").classList.add("hidden");
      });
      el.classList.add("selected");
      el.querySelector(".fcheck").classList.remove("hidden");
      selectedId = p.id;
    });
  });

  document.getElementById("gift-send-cancel").onclick = () => overlay.classList.add("hidden");
  document.getElementById("gift-send-confirm").onclick = async () => {
    if (!selectedId) return;

    // Проверяем баланс ПЕРЕД подтверждением
    const balNow = (myProfile && myProfile.imagi_tokens) || 0;
    if (balNow < 25) {
      await showAlertDialog(
        t("gifts.send.notEnough"),
        tFmt("gifts.send.notEnoughText", { need: 25, have: balNow })
      );
      return;
    }

    const priceWithIcon = `25 ${NECTAR_HTML}`;
    const ok = await showConfirmDialog(
      t("gifts.send.confirmTitle"),
      tFmt("gifts.send.confirmText", { price: priceWithIcon }),
      tFmt("gifts.send.confirmAction", { price: priceWithIcon }),
      { html: true }
    );
    if (!ok) return;

    const { error } = await supabase.rpc("transfer_gift", { p_gift_id: ug.id, p_new_owner: selectedId });
    if (error) { await showAlertDialog("Ошибка", error.message); return; }

    // Обновляем баланс в UI — RPC уже списал Nectar
    await refreshBalance();

    // Отправляем системное сообщение о подарке в чат с получателем
    const chatId = chatIdByUser.get(selectedId);
    if (chatId) {
      const catalog = await loadGiftCatalog();
      const cat = catalog.find((c) => c.id === ug.gift_id);
      if (cat) {
        await supabase.from("messages").insert({
          chat_id: chatId,
          sender_id: currentUser.id,
          content: "",
          message_type: "gift",
          gift_ref_id: ug.id,
          delivered_at: new Date().toISOString(),
        });
      }
    }

    overlay.classList.add("hidden");
    await refreshMyGiftsCount();
    closeGiftsOverlay();
  };
}

// ======================================================
// 28. ОТПРАВКА ImagiTokens
// ======================================================

function setupTokensDialog() {
  const overlay = document.getElementById("tokens-send-overlay");
  const amountEl = document.getElementById("tokens-send-amount");
  const confirmBtn = document.getElementById("tokens-send-confirm");

  document.getElementById("tokens-send-cancel").onclick = () => overlay.classList.add("hidden");

  // Проверяем баланс при вводе
  amountEl.addEventListener("input", () => {
    const amount = parseInt(amountEl.value, 10) || 0;
    const balance = (myProfile && myProfile.imagi_tokens) || 0;
    if (amount <= 0 || amount > balance) confirmBtn.disabled = true;
    else confirmBtn.disabled = false;
  });

  confirmBtn.onclick = async () => {
    const amount = parseInt(amountEl.value, 10);
    if (!amount || amount <= 0) return;
    const balance = (myProfile && myProfile.imagi_tokens) || 0;
    if (amount > balance) return;
    if (!currentChatId) return;
    if (!currentOtherUser) return;

    const { error } = await supabase.rpc("send_tokens", {
      p_chat_id: currentChatId,
      p_recipient: currentOtherUser.id,
      p_amount: amount,
    });
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    overlay.classList.add("hidden");
    amountEl.value = "";
    confirmBtn.disabled = true;
    await refreshBalance();
  };
}

async function openTokensDialog() {
  if (!currentOtherUser) return;
  if (!currentChatId) { await showAlertDialog(t("alert.error"), t("alert.noChatYet")); return; }

  const { data } = await supabase.from("profiles").select("imagi_tokens").eq("id", currentUser.id).single();
  const balance = data ? data.imagi_tokens : 0;
  myProfile.imagi_tokens = balance;

  document.getElementById("tokens-send-to").textContent = tFmt("tokens.to", { name: currentOtherUser.display_name });
  document.getElementById("tokens-send-balance").innerHTML = tFmt("tokens.balance", {
    balance: `${NECTAR_HTML} <b>${balance}</b>`,
  });
  const amountEl = document.getElementById("tokens-send-amount");
  amountEl.value = "";
  amountEl.max = balance;
  const confirmBtn = document.getElementById("tokens-send-confirm");
  confirmBtn.disabled = true;
  document.getElementById("tokens-send-overlay").classList.remove("hidden");
  setTimeout(() => amountEl.focus(), 60);
}

// ======================================================
// 29. XSS + автозапуск
// ======================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

// ======================================================
// ЗАПРЕТ PINCH-ZOOM НА МОБИЛЬНЫХ
// ======================================================
// Мета-тег viewport покрывает современные браузеры, но старые iOS Safari
// его игнорируют. Явно гасим жесты двумя пальцами и double-tap zoom.
(function disablePinchZoom() {
  // Жесты двумя пальцами
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // iOS Safari gesture events (pinch)
  ["gesturestart", "gesturechange", "gestureend"].forEach((ev) => {
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  });

  // Double-tap zoom. НЕ трогаем, если тап был по эмодзи-кнопке —
  // иначе на iOS не работает быстрая реакция двойным тапом.
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const el = e.target;
    if (el && el.closest && el.closest(".msg")) return;
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
})();

// ======================================================
// 30. КАНАЛЫ: СОЗДАНИЕ
// ======================================================

function setupChannelCreate() {
  const btn = document.getElementById("create-channel-btn");
  if (btn) btn.addEventListener("click", openChannelCreateDialog);

  document.getElementById("channel-create-cancel").addEventListener("click", closeChannelCreateDialog);
  document.getElementById("channel-create-confirm").addEventListener("click", createChannel);

  document.getElementById("channel-avatar-upload").addEventListener("change", handleChannelAvatarUpload);

  document.getElementById("channel-username-input").addEventListener("input", (e) => {
    clearTimeout(channelUsernameCheckTimeout);
    channelUsernameValidated = null;
    updateChannelCreateButton();
    const value = e.target.value;
    channelUsernameCheckTimeout = setTimeout(() => checkChannelUsernameLive(value), 350);
  });
  document.getElementById("channel-name-input").addEventListener("input", () => {
    updateChannelCreateButton();
    renderChannelAvatarGrid();
  });

  // Кнопка подписки — надёжный вариант через явный select → delete/insert
  const subBtn = document.getElementById("channel-subscribe-btn");
  if (subBtn) subBtn.addEventListener("click", async () => {
    if (!currentChannelObj) return;
    subBtn.disabled = true;
    const chId = currentChannelObj.id;
    const vis = currentChannelObj.visibility || "public";
    try {
      const { data: existing } = await supabase.from("chat_members")
        .select("chat_id").eq("chat_id", chId).eq("user_id", currentUser.id).limit(1);
      const isSubscribed = !!(existing && existing.length);

      if (isSubscribed) {
        const { error } = await supabase.from("chat_members")
          .delete().eq("chat_id", chId).eq("user_id", currentUser.id);
        if (error) { await showAlertDialog(t("channel.sub.errorUnsub"), error.message); return; }
        currentChannelIsSubscribed = false;
        // СРАЗУ убираем канал из списка чатов
        removeChatFromList(chId);
        if (currentChannelObj && currentChannelObj.id === chId) {
          await loadMessages(chId, openSeq);
          await loadReactionsForVisibleMessages();
        }
      } else if (vis === "request") {
        // 🔴 Если заявка уже висит — это отзыв, а не подача.
        if (currentChannelHasRequest) {
          const { error } = await supabase.from("channel_join_requests")
            .delete().eq("chat_id", chId).eq("user_id", currentUser.id);
          if (error) { await showAlertDialog("Ошибка", error.message); return; }
          currentChannelHasRequest = false;
          currentChannelRequestId = null;
        } else {
          const { data: newReqId, error } = await supabase.rpc("submit_join_request", { p_chat_id: chId });
          if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
          currentChannelHasRequest = true;
          currentChannelRequestId = newReqId || null;
        }
      } else if (vis === "private") {
        await showAlertDialog(t("channel.sub.privateTitle"), t("channel.sub.privateText"));
        return;
      } else {
        const { error } = await supabase.from("chat_members").insert({
          chat_id: chId, user_id: currentUser.id,
        });
        if (error && error.code !== "23505") {
          await showAlertDialog(t("channel.sub.errorSub"), error.message);
          return;
        }
        currentChannelIsSubscribed = true;
        await addOrUpdateChannelInList(chId, currentChannelObj);
      }
      await updateChannelSubtitle(chId);
      await updateChannelComposerState();
      configureChatMenuForChannel(currentChannelObj);
      await refreshChannelRights(chId);
    } catch (ex) {
      console.error(ex);
      await showAlertDialog(t("auth.err.prefix"), ex.message || String(ex));
    } finally {
      subBtn.disabled = false;
    }
  });
  // Тип канала при создании
  const visToggle = document.getElementById("channel-visibility-toggle");
  if (visToggle) {
    visToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-vis]"); if (!btn) return;
      channelCreateVisibility = btn.dataset.vis;
      visToggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.vis === channelCreateVisibility));
    });
  }
}

function updateChannelCreateButton() {
  const name = document.getElementById("channel-name-input").value.trim();
  const uname = document.getElementById("channel-username-input").value.trim();
  const btn = document.getElementById("channel-create-confirm");
  btn.disabled = !name || !uname || uname !== channelUsernameValidated;
}

function openChannelCreateDialog() {
  channelCreateAvatarUrl = "color:0";
  channelUsernameValidated = null;
  channelCreateVisibility = "public";
  const visToggle = document.getElementById("channel-visibility-toggle");
  if (visToggle) {
    visToggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.vis === "public"));
  }
  document.getElementById("channel-name-input").value = "";
  document.getElementById("channel-username-input").value = "";
  const hint = document.getElementById("channel-username-hint");
  hint.className = "username-hint"; hint.textContent = "";
  renderChannelAvatarGrid();
  updateChannelCreateButton();
  document.getElementById("channel-create-overlay").classList.remove("hidden");
  setTimeout(() => document.getElementById("channel-name-input").focus(), 60);
}

function closeChannelCreateDialog() {
  document.getElementById("channel-create-overlay").classList.add("hidden");
}

function renderChannelAvatarGrid() {
  const grid = document.getElementById("channel-avatar-grid"); grid.innerHTML = "";
  const nameInput = document.getElementById("channel-name-input");
  const rawName = nameInput ? nameInput.value : "";
  // Если название пустое — оставляем "К" (как было), иначе первую непробельную букву
  const letter = (rawName && rawName.replace(/\s+/g, "")) ? firstChar(rawName) : "К";

  BASE_AVATARS.forEach((pair, idx) => {
    const el = document.createElement("div");
    el.className = "avatar-option"; el.dataset.idx = idx;
    el.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    el.textContent = letter;
    if (channelCreateAvatarUrl === "color:" + idx) el.classList.add("selected");
    el.addEventListener("click", () => {
      channelCreateAvatarUrl = "color:" + idx;
      paintAvatar(document.getElementById("channel-avatar-preview"), { display_name: letter, avatar_url: channelCreateAvatarUrl });
      renderChannelAvatarGrid();
    });
    grid.appendChild(el);
  });

  // Обновляем большую превьюшку
  paintAvatar(document.getElementById("channel-avatar-preview"), { display_name: letter, avatar_url: channelCreateAvatarUrl });
}

async function handleChannelAvatarUpload(e) {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  openAvatarCropper(file, (dataUrl) => {
    channelCreateAvatarUrl = dataUrl;
    paintAvatar(document.getElementById("channel-avatar-preview"), { display_name: "К", avatar_url: dataUrl });
    renderChannelAvatarGrid();
  });
}

async function checkChannelUsernameLive(value) {
  const hint = document.getElementById("channel-username-hint");
  const username = value.trim(); channelUsernameValidated = null; updateChannelCreateButton();
  if (!username) { hint.className = "username-hint"; hint.textContent = ""; return; }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) { hint.className = "username-hint err"; hint.textContent = t("username.onlyLatin"); return; }
  if (username.length < 3) { hint.className = "username-hint err"; hint.textContent = t("username.tooShort"); return; }
  hint.className = "username-hint"; hint.textContent = t("username.checking");

  const reserved = await isUsernameReservedForOther(username);
  if (reserved) {
    if (document.getElementById("channel-username-input").value.trim() !== username) return;
    hint.className = "username-hint err";
    hint.textContent = tFmt("username.reserved", { username });
    channelUsernameValidated = null;
    updateChannelCreateButton();
    return;
  }

  const [pRes, cRes] = await Promise.all([
    supabase.from("profiles").select("id").ilike("username", username).limit(1),
    supabase.from("channels").select("id").ilike("username", username).limit(1),
  ]);

  if (document.getElementById("channel-username-input").value.trim() !== username) return;
  if (pRes.error || cRes.error) { hint.className = "username-hint err"; hint.textContent = t("username.error"); return; }
  if ((pRes.data && pRes.data.length > 0) || (cRes.data && cRes.data.length > 0)) {
    hint.className = "username-hint err"; hint.textContent = tFmt("username.taken", { username }); channelUsernameValidated = null;
  } else {
    hint.className = "username-hint ok"; hint.textContent = tFmt("username.free", { username }); channelUsernameValidated = username;
  }
  updateChannelCreateButton();
}

async function createChannel() {
  const name = document.getElementById("channel-name-input").value.trim();
  const username = document.getElementById("channel-username-input").value.trim();
  if (!name || !username || username !== channelUsernameValidated) return;
  const btn = document.getElementById("channel-create-confirm");
  btn.disabled = true; btn.textContent = t("channel.create.creating");

  try {
    // Двойная проверка username — на всякий случай
    const [pRes, cRes] = await Promise.all([
      supabase.from("profiles").select("id").ilike("username", username).limit(1),
      supabase.from("channels").select("id").ilike("username", username).limit(1),
    ]);
    if ((pRes.data && pRes.data.length) || (cRes.data && cRes.data.length)) {
      await showAlertDialog(t("auth.err.prefix"), t("channel.err.usernameTaken"));
      btn.disabled = false; btn.textContent = t("channel.create.confirm");
      return;
    }

    // 1. Создаём chats
    const { data: newChat, error: chatErr } = await supabase.from("chats").insert({}).select().single();
    if (chatErr || !newChat) {
      await showAlertDialog(t("auth.err.prefix"), tFmt("channel.err.createFail", { msg: chatErr ? chatErr.message : "?" }));
      btn.disabled = false; btn.textContent = t("channel.create.confirm");
      return;
    }

    // 2. Создаём channels
    const { error: chanErr } = await supabase.from("channels").insert({
      id: newChat.id,
      username,
      name,
      avatar_url: channelCreateAvatarUrl,
      owner_id: currentUser.id,
      visibility: channelCreateVisibility,
    });
    if (chanErr) {
      await supabase.from("chats").delete().eq("id", newChat.id);
      await showAlertDialog(t("auth.err.prefix"), tFmt("channel.err.createFail", { msg: chanErr.message }));
      btn.disabled = false; btn.textContent = t("channel.create.confirm");
      return;
    }

    // 3. Добавляем себя в chat_members (подписчиком)
    const { error: memErr } = await supabase.from("chat_members").insert({
      chat_id: newChat.id, user_id: currentUser.id,
    });
    if (memErr) console.error("chat_members insert:", memErr);

    closeChannelCreateDialog();
    btn.disabled = false; btn.textContent = t("channel.create.confirm");

    await addOrUpdateChannelInList(newChat.id, {
      id: newChat.id,
      username,
      name,
      avatar_url: channelCreateAvatarUrl,
      owner_id: currentUser.id,
      created_at: new Date().toISOString(),
    });
  } catch (ex) {
    console.error(ex);
    await showAlertDialog(t("auth.err.prefix"), ex.message || String(ex));
    btn.disabled = false; btn.textContent = t("channel.create.confirm");
  }
}

// ======================================================
// 31. КАНАЛЫ: ПРОФИЛЬ + МЕНЮ + УДАЛЕНИЕ
// ======================================================

function resetChatMenuToDm() {
  const menu = document.getElementById("chat-menu");
  ["tokens", "clear", "delete", "block"].forEach((a) => {
    const b = menu.querySelector(`[data-action="${a}"]`);
    if (b) b.classList.remove("hidden");
  });
  ["channel-profile", "channel-configure", "channel-unsubscribe", "channel-delete", "channel-invite"].forEach((a) => {
    const b = menu.querySelector(`[data-action="${a}"]`);
    if (b) b.classList.add("hidden");
  });
  const menuBtn = document.getElementById("chat-menu-btn");
  if (menuBtn) menuBtn.classList.remove("hidden");
}

function configureChatMenuForChannel(ch) {
  const menu = document.getElementById("chat-menu");
  // Скрываем все DM-опции
  ["tokens", "clear", "delete", "block"].forEach((a) => {
    const b = menu.querySelector(`[data-action="${a}"]`);
    if (b) b.classList.add("hidden");
  });
  const isOwner = ch.owner_id === currentUser.id;
  const isAdmin = currentChannelIsAdmin;
  // Профиль канала — для всех
  const profBtn = menu.querySelector('[data-action="channel-profile"]');
  if (profBtn) profBtn.classList.remove("hidden");
  // Отписаться — для подписанных, но не для владельца
  const unsubBtn = menu.querySelector('[data-action="channel-unsubscribe"]');
  if (unsubBtn) unsubBtn.classList.toggle("hidden", !currentChannelIsSubscribed || isOwner);
  // Настроить — для админов и владельца
  const confBtn = menu.querySelector('[data-action="channel-configure"]');
  if (confBtn) confBtn.classList.toggle("hidden", !isAdmin);
  // Пригласить — только owner/admin
  const invBtn = menu.querySelector('[data-action="channel-invite"]');
  if (invBtn) invBtn.classList.toggle("hidden", !isAdmin);
  // Удалить — только владелец
  const delBtn = menu.querySelector('[data-action="channel-delete"]');
  if (delBtn) delBtn.classList.toggle("hidden", !isOwner);
  // Кнопка меню — всегда видима
  const menuBtn = document.getElementById("chat-menu-btn");
  if (menuBtn) menuBtn.classList.remove("hidden");
}

async function openChannelProfileDialog() {
  if (!currentChannelObj) return;
  channelProfileChannelId = currentChannelObj.id;
  const ch = currentChannelObj;

  paintAvatar(document.getElementById("channel-profile-avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
  document.getElementById("channel-profile-name").innerHTML = escapeHtml(ch.name) + verifiedBadge(ch);
  document.getElementById("channel-profile-username").textContent = "@" + (ch.username || "");

  const { data: cntData } = await supabase.rpc("channel_subscribers_count", { p_chat_id: ch.id });
  const cnt = Number(cntData) || 0;
  const word = pluralRu(cnt, t("channel.subsWord.one"), t("channel.subsWord.few"), t("channel.subsWord.many"));
  document.getElementById("channel-profile-subscribers-status").textContent = `${cnt} ${word}`;
  document.getElementById("channel-profile-subscribers").textContent = String(cnt);

  document.getElementById("channel-profile-created").textContent = ch.created_at
    ? new Date(ch.created_at).toLocaleDateString(localeId())
    : "—";

  const { data: totalViews } = await supabase.rpc("get_channel_total_views", { p_chat_id: ch.id });
  currentChannelTotalViews = Number(totalViews) || 0;
  document.getElementById("channel-profile-views").textContent = String(currentChannelTotalViews);

  const isOwner = ch.owner_id === currentUser.id;
  const isAdmin = currentChannelIsAdmin;
  const menuBtn = document.getElementById("channel-profile-menu-btn");
  menuBtn.classList.toggle("hidden", !isOwner);

  // Вкладка «Заявки» — только для владельца И только для каналов «по заявке»
  const requestsRow = document.getElementById("channel-profile-requests-row");
  if (requestsRow) {
    const visibility = ch.visibility || "public";
    if (isOwner && visibility === "request") {
      requestsRow.classList.remove("hidden");
      await updateChannelRequestsBadge(ch.id);
    } else {
      requestsRow.classList.add("hidden");
    }
  }

  document.getElementById("channel-profile-menu").classList.add("hidden");
  document.getElementById("channel-profile-overlay").classList.remove("hidden");
  subscribeToChannelProfileUpdates(ch.id);
}

function closeChannelProfileDialog() {
  document.getElementById("channel-profile-overlay").classList.add("hidden");
  document.getElementById("channel-profile-menu").classList.add("hidden");
  channelProfileChannelId = null;
  if (channelProfileUpdatesChannel) {
    supabase.removeChannel(channelProfileUpdatesChannel);
    channelProfileUpdatesChannel = null;
  }
}

// Живое обновление счётчиков в открытом профиле канала
function subscribeToChannelProfileUpdates(channelId) {
  if (channelProfileUpdatesChannel) {
    supabase.removeChannel(channelProfileUpdatesChannel);
    channelProfileUpdatesChannel = null;
  }
  channelProfileUpdatesChannel = supabase.channel("channel-profile-" + channelId)
    .on("postgres_changes", { event: "*", schema: "public", table: "chat_members" }, async (payload) => {
      if (channelProfileChannelId !== channelId) return;
      const row = payload.new || payload.old;
      if (!row || row.chat_id !== channelId) return;
      const { data: cntData } = await supabase.rpc("channel_subscribers_count", { p_chat_id: channelId });
      const cnt = Number(cntData) || 0;
      const word = pluralRu(cnt, t("channel.subsWord.one"), t("channel.subsWord.few"), t("channel.subsWord.many"));
      const statusEl = document.getElementById("channel-profile-subscribers-status");
      if (statusEl) statusEl.textContent = `${cnt} ${word}`;
      const subsEl = document.getElementById("channel-profile-subscribers");
      if (subsEl) subsEl.textContent = String(cnt);
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_views" }, async () => {
      if (channelProfileChannelId !== channelId) return;
      const { data: totalViews } = await supabase.rpc("get_channel_total_views", { p_chat_id: channelId });
      currentChannelTotalViews = Number(totalViews) || 0;
      const el = document.getElementById("channel-profile-views");
      if (el) el.textContent = String(currentChannelTotalViews);
    })
    .subscribe();
}

async function deleteChannelDialog() {
  if (!currentChannelObj) return;
  const ch = currentChannelObj;

  const ok1 = await showConfirmDialog(
    t("channel.delete.title"),
    tFmt("channel.delete.text", { name: ch.name }),
    t("channel.delete.continue")
  );
  if (!ok1) return;

  const typed = await showInputDialog(
    t("channel.delete.confirmTitle"),
    tFmt("channel.delete.confirmText", { name: ch.name }),
    ""
  );
  if (typed === null) return;
  if (typed.trim() !== ch.name) {
    await showAlertDialog(t("channel.delete.mismatch"), t("channel.delete.mismatchText"));
    return;
  }

  const chatId = ch.id;
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }

  channelCache.delete(chatId);
  closeCurrentChat();
  removeChatFromList(chatId);
}

async function joinAndOpenChannel(ch) {
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");
  if (searchInput) searchInput.value = "";
  if (clearBtn) clearBtn.classList.add("hidden");
  loadRecentChats().catch(() => {});
  // Просто открываем канал — не подписываем автоматически
  await openChannel(ch.id);
}

// ======================================================
// 32. КАНАЛЫ: РЕДАКТОР
// ======================================================

function setupChannelEdit() {
  document.getElementById("channel-edit-cancel").addEventListener("click", closeChannelEditDialog);
  document.getElementById("channel-edit-save").addEventListener("click", saveChannelEdit);
  document.getElementById("channel-edit-avatar-upload").addEventListener("change", handleChannelEditAvatarUpload);

  document.getElementById("channel-edit-name-input").addEventListener("input", () => {
    updateChannelEditSaveButton();
    renderChannelEditAvatarGrid();
  });

  document.getElementById("channel-edit-username-input").addEventListener("input", (e) => {
    clearTimeout(channelEditUsernameTimeout);
    channelEditUsernameValidated = null;
    updateChannelEditSaveButton();
    const value = e.target.value;
    channelEditUsernameTimeout = setTimeout(() => checkChannelEditUsernameLive(value), 350);
  });

  document.getElementById("channel-edit-add-admin").addEventListener("click", openAddAdminDialog);
  document.getElementById("channel-edit-transfer").addEventListener("click", openTransferOwnerDialog);

  document.getElementById("channel-subs-close").addEventListener("click", () => {
    document.getElementById("channel-subs-overlay").classList.add("hidden");
  });

  // Тип канала при редактировании
  const editVisToggle = document.getElementById("channel-edit-visibility-toggle");
  if (editVisToggle) {
    editVisToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-vis]"); if (!btn) return;
      channelEditVisibility = btn.dataset.vis;
      editVisToggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.vis === channelEditVisibility));
    });
  }

  subscribeToChannelAdmins();
}

function updateChannelEditSaveButton() {
  const name = document.getElementById("channel-edit-name-input").value.trim();
  const uname = document.getElementById("channel-edit-username-input").value.trim();
  const btn = document.getElementById("channel-edit-save");
  // Кнопка активна если есть имя и юзернейм совпадает с валидированным (или с текущим)
  const unameOk = uname && (uname === channelEditUsernameValidated || uname === currentChannelObj.username);
  btn.disabled = !name || !unameOk;
}

function openChannelEditDialog() {
  if (!currentChannelObj) return;
  const ch = currentChannelObj;

  // Аватар: подставляем текущий
  channelEditAvatarUrl = ch.avatar_url || "color:0";
  // Юзернейм: текущий валиден
  channelEditUsernameValidated = ch.username;
  // Реакции: копируем массив
  channelEditReactions = new Set(
    Array.isArray(ch.available_reactions) && ch.available_reactions.length
      ? ch.available_reactions
      : REACTION_EMOJIS
  );

  document.getElementById("channel-edit-name-input").value = ch.name || "";
  document.getElementById("channel-edit-username-input").value = ch.username || "";
  // eslint-disable-next-line no-unused-vars
  const hint = document.getElementById("channel-edit-username-hint");
  hint.className = "username-hint";
  hint.textContent = "";

  channelEditVisibility = ch.visibility || "public";
  const editVisToggle = document.getElementById("channel-edit-visibility-toggle");
  if (editVisToggle) {
    editVisToggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.vis === channelEditVisibility));
  }

  renderChannelEditAvatarGrid();
  renderChannelEditReactions();
  renderChannelEditAdmins();

  // Кнопки назначения/передачи — только владельцу
  const isOwner = ch.owner_id === currentUser.id;
  const addAdminBtn = document.getElementById("channel-edit-add-admin");
  const transferBtn = document.getElementById("channel-edit-transfer");
  if (addAdminBtn) addAdminBtn.classList.toggle("hidden", !isOwner);
  if (transferBtn) transferBtn.classList.toggle("hidden", !isOwner);

  updateChannelEditSaveButton();
  document.getElementById("channel-edit-overlay").classList.remove("hidden");
}

function closeChannelEditDialog() {
  document.getElementById("channel-edit-overlay").classList.add("hidden");
  channelEditUsernameValidated = null;
  channelEditAvatarUrl = null;
}

function renderChannelEditAvatarGrid() {
  const grid = document.getElementById("channel-edit-avatar-grid");
  grid.innerHTML = "";

  const nameInput = document.getElementById("channel-edit-name-input");
  const rawName = nameInput ? nameInput.value : "";
  const letter = (rawName && rawName.replace(/\s+/g, "")) ? firstChar(rawName) : "К";

  BASE_AVATARS.forEach((pair, idx) => {
    const el = document.createElement("div");
    el.className = "avatar-option";
    el.dataset.idx = idx;
    el.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    el.textContent = letter;
    if (channelEditAvatarUrl === "color:" + idx) el.classList.add("selected");
    el.addEventListener("click", () => {
      channelEditAvatarUrl = "color:" + idx;
      paintAvatar(document.getElementById("channel-edit-avatar-preview"), { display_name: letter, avatar_url: channelEditAvatarUrl });
      renderChannelEditAvatarGrid();
    });
    grid.appendChild(el);
  });

  paintAvatar(document.getElementById("channel-edit-avatar-preview"), { display_name: letter, avatar_url: channelEditAvatarUrl });
}

async function handleChannelEditAvatarUpload(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  openAvatarCropper(file, (dataUrl) => {
    channelEditAvatarUrl = dataUrl;
    paintAvatar(document.getElementById("channel-edit-avatar-preview"), { display_name: "К", avatar_url: dataUrl });
    renderChannelAvatarGrid();
  });
}

function renderChannelEditReactions() {
  const grid = document.getElementById("channel-edit-reactions");
  grid.innerHTML = "";
  // Объединяем базовый список с уже добавленными эмодзи канала (могут быть свои)
  const allEmojis = new Set(REACTION_EMOJIS);
  channelEditReactions.forEach((em) => allEmojis.add(em));

  [...allEmojis].forEach((em) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reaction-toggle " + (channelEditReactions.has(em) ? "on" : "off");
    btn.textContent = em;
    btn.addEventListener("click", () => {
      if (channelEditReactions.has(em)) channelEditReactions.delete(em);
      else channelEditReactions.add(em);
      btn.className = "reaction-toggle " + (channelEditReactions.has(em) ? "on" : "off");
    });
    grid.appendChild(btn);
  });
}

async function checkChannelEditUsernameLive(value) {
  if (!currentChannelObj) return;
  const hint = document.getElementById("channel-edit-username-hint");
  const username = value.trim();
  channelEditUsernameValidated = null;
  updateChannelEditSaveButton();

  if (!username) { hint.className = "username-hint"; hint.textContent = ""; return; }
  if (username === currentChannelObj.username) {
    hint.className = "username-hint ok";
    hint.textContent = t("username.current");
    channelEditUsernameValidated = username;
    updateChannelEditSaveButton();
    return;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    hint.className = "username-hint err"; hint.textContent = t("username.onlyLatin"); return;
  }
  if (username.length < 3) {
    hint.className = "username-hint err"; hint.textContent = t("username.tooShort"); return;
  }

  hint.className = "username-hint"; hint.textContent = t("username.checking");

  const reserved = await isUsernameReservedForOther(username);
  if (reserved) {
    if (document.getElementById("channel-edit-username-input").value.trim() !== username) return;
    hint.className = "username-hint err";
    hint.textContent = tFmt("username.reserved", { username });
    channelEditUsernameValidated = null;
    updateChannelEditSaveButton();
    return;
  }

  const [pRes, cRes] = await Promise.all([
    supabase.from("profiles").select("id").ilike("username", username).limit(1),
    supabase.from("channels").select("id").ilike("username", username).neq("id", currentChannelObj.id).limit(1),
  ]);

  if (document.getElementById("channel-edit-username-input").value.trim() !== username) return;
  if (pRes.error || cRes.error) {
    hint.className = "username-hint err"; hint.textContent = t("username.error"); return;
  }
  if ((pRes.data && pRes.data.length > 0) || (cRes.data && cRes.data.length > 0)) {
    hint.className = "username-hint err"; hint.textContent = tFmt("username.taken", { username });
    channelEditUsernameValidated = null;
  } else {
    hint.className = "username-hint ok"; hint.textContent = tFmt("username.free", { username });
    channelEditUsernameValidated = username;
  }
  updateChannelEditSaveButton();
}

async function saveChannelEdit() {
  if (!currentChannelObj) return;
  const ch = currentChannelObj;
  const btn = document.getElementById("channel-edit-save");

  const name = document.getElementById("channel-edit-name-input").value.trim();
  const username = document.getElementById("channel-edit-username-input").value.trim();

  if (!name) { await showAlertDialog(t("auth.err.prefix"), t("channel.err.enterName")); return; }
  if (!username) { await showAlertDialog(t("auth.err.prefix"), t("channel.err.enterUsername")); return; }
  if (username !== channelEditUsernameValidated && username !== ch.username) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.err.checkUsername"));
    return;
  }

  const reactions = [...channelEditReactions];
  if (!reactions.length) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.err.noReactions"));
    return;
  }

  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = t("channel.edit.saving");

  try {
    // Двойная проверка username, если изменился
    if (username !== ch.username) {
      const [pRes, cRes] = await Promise.all([
        supabase.from("profiles").select("id").ilike("username", username).limit(1),
        supabase.from("channels").select("id").ilike("username", username).neq("id", ch.id).limit(1),
      ]);
      if ((pRes.data && pRes.data.length) || (cRes.data && cRes.data.length)) {
        await showAlertDialog(t("auth.err.prefix"), t("channel.err.usernameTaken"));
        btn.disabled = false; btn.textContent = oldText;
        return;
      }
    }

    const payload = {
      name,
      username,
      avatar_url: channelEditAvatarUrl,
      available_reactions: reactions,
      visibility: channelEditVisibility,
    };

    const { error } = await supabase.from("channels").update(payload).eq("id", ch.id);
    if (error) {
      await showAlertDialog(t("auth.err.prefix"), error.message);
      btn.disabled = false; btn.textContent = oldText;
      return;
    }

    // Обновляем локальный кэш
    Object.assign(ch, payload);
    channelCache.set(ch.id, ch);

    // Обновляем UI чата, если он открыт
    if (currentChannelObj && currentChannelObj.id === ch.id) {
      paintAvatar(document.getElementById("chat-avatar"), { id: ch.id, display_name: name, avatar_url: payload.avatar_url });
      document.getElementById("chat-title").innerHTML = escapeHtml(name) + verifiedBadge(ch);
    }

    // Обновляем карточку в списке чатов
    const itemEl = document.querySelector(`.user-item[data-chat-id="${ch.id}"][data-chat-type="channel"]`);
    if (itemEl) {
      const nameEl = itemEl.querySelector(".user-item-name");
      if (nameEl) nameEl.innerHTML = escapeHtml(name) + verifiedBadge(ch) + '<span class="channel-mark">📢</span>';
      paintAvatar(itemEl.querySelector(".avatar"), { id: ch.id, display_name: name, avatar_url: payload.avatar_url });
    }

    // Обновляем профиль канала, если открыт
    if (channelProfileChannelId === ch.id) {
      paintAvatar(document.getElementById("channel-profile-avatar"), { id: ch.id, display_name: name, avatar_url: payload.avatar_url });
      document.getElementById("channel-profile-name").innerHTML = escapeHtml(name) + verifiedBadge(ch);
      document.getElementById("channel-profile-username").textContent = "@" + username;
    }

    closeChannelEditDialog();
    btn.disabled = false; btn.textContent = oldText;
  } catch (ex) {
    console.error(ex);
    await showAlertDialog(t("auth.err.prefix"), ex.message || String(ex));
    btn.disabled = false; btn.textContent = oldText;
  }
}

// ======================================================
// 33. КАНАЛЫ: АДМИНЫ, ВЛАДЕНИЕ, ПОДПИСЧИКИ
// ======================================================

async function renderChannelEditAdmins() {
  if (!currentChannelObj) return;
  const ch = currentChannelObj;
  const listEl = document.getElementById("channel-edit-admins");

  // Владелец всегда один — рендерим в блоке "Владелец канала", здесь только админы
  const { data: admins } = await supabase.rpc("get_channel_admins", { p_channel_id: ch.id });
  const adminIds = (admins || []).map((a) => a.user_id).filter((id) => id !== ch.owner_id);

  const profiles = [];
  for (const id of adminIds) {
    const p = await getProfile(id);
    if (p) profiles.push(p);
  }

  if (!profiles.length) {
    listEl.innerHTML = '<div class="empty" style="padding:10px;font-size:13px;">' + escapeHtml(t("channel.edit.noAdmins")) + '</div>';
  } else {
    listEl.innerHTML = profiles.map((p) => `
      <div class="admin-row" data-user-id="${p.id}">
        <div class="avatar"></div>
        <div class="admin-row-name">
          ${escapeHtml(p.display_name)}
          <div class="admin-row-username">@${escapeHtml(p.username)}</div>
        </div>
        <span class="admin-row-role admin">${escapeHtml(t("channel.edit.adminRole"))}</span>
        <button type="button" class="admin-row-remove" data-remove-admin="${p.id}" title="${escapeHtml(t("channel.edit.removeAdminAction"))}"><span class="cell-icon cell-icon-sm" data-icon="cancel"></span></button>
      </div>
    `).join("");
    listEl.querySelectorAll(".admin-row").forEach((row) => {
      const p = profiles.find((x) => x.id === row.dataset.userId);
      paintAvatar(row.querySelector(".avatar"), p);
    });
    listEl.querySelectorAll("[data-remove-admin]").forEach((btn) => {
      btn.addEventListener("click", () => removeChannelAdmin(btn.dataset.removeAdmin));
    });
  }

  // Владелец
  const ownerProfile = await getProfile(ch.owner_id);
  const ownerEl = document.getElementById("channel-edit-owner");
  ownerEl.innerHTML = `
    <div class="admin-row">
      <div class="avatar"></div>
      <div class="admin-row-name">
        ${escapeHtml(ownerProfile ? ownerProfile.display_name : "—")}
        <div class="admin-row-username">@${escapeHtml(ownerProfile ? ownerProfile.username : "")}</div>
      </div>
      <span class="admin-row-role owner">${escapeHtml(t("channel.edit.ownerRole"))}</span>
    </div>`;
  paintAvatar(ownerEl.querySelector(".avatar"), ownerProfile || { display_name: "?" });

  // Кнопки назначения/передачи + крестики снятия — только владельцу
  const isOwner = ch.owner_id === currentUser.id;
  const addAdminBtn = document.getElementById("channel-edit-add-admin");
  const transferBtn = document.getElementById("channel-edit-transfer");
  if (addAdminBtn) addAdminBtn.classList.toggle("hidden", !isOwner);
  if (transferBtn) transferBtn.classList.toggle("hidden", !isOwner);
  listEl.querySelectorAll("[data-remove-admin]").forEach((btn) => {
    btn.classList.toggle("hidden", !isOwner);
  });
}

async function removeChannelAdmin(userId) {
  if (!currentChannelObj) return;
  if (currentChannelObj.owner_id !== currentUser.id) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.err.noRightsOwner"));
    return;
  }
  const ok = await showConfirmDialog(
    t("channel.edit.removeAdminTitle"),
    t("channel.edit.removeAdminText"),
    t("channel.edit.removeAdminAction")
  );
  if (!ok) return;
  const { error } = await supabase.rpc("remove_channel_admin", {
    p_channel_id: currentChannelObj.id,
    p_user_id: userId,
  });
  if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
  await renderChannelEditAdmins();
  await refreshChannelRights(currentChannelObj.id);
  // «Сохранить» — только для полей канала, сбрасываем её состояние
  updateChannelEditSaveButton();
}

async function openAddAdminDialog() {
  if (!currentChannelObj) return;
  if (currentChannelObj.owner_id !== currentUser.id) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.err.noRightsOwner"));
    return;
  }
  const ch = currentChannelObj;

  const { data: mems } = await supabase.from("chat_members")
    .select("user_id, custom_name").eq("chat_id", ch.id).neq("user_id", currentUser.id);
  const memberIds = (mems || []).map((m) => m.user_id);
  if (!memberIds.length) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.edit.noMembers"));
    return;
  }
  const customByUser = new Map((mems || []).map((m) => [m.user_id, m.custom_name]));

  const { data: admins } = await supabase.rpc("get_channel_admins", { p_channel_id: ch.id });
  const adminSet = new Set((admins || []).map((a) => a.user_id));
  adminSet.add(ch.owner_id);

  const candidates = memberIds.filter((id) => !adminSet.has(id));
  if (!candidates.length) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.edit.allAdmins"));
    return;
  }

  const { data: profiles } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url").in("id", candidates);

  const opts = (profiles || []).map((p) => {
    const custom = customByUser.get(p.id);
    const displayLabel = custom ? `${custom} (${p.display_name})` : p.display_name;
    return {
      label: `${displayLabel} — @${p.username}`,
      value: p.id,
      search: `${p.display_name} ${p.username} ${custom || ""}`,
    };
  });

  const choice = await showChoiceDialog(
    t("channel.edit.confirmAdd"),
    t("channel.edit.confirmAddText"),
    opts,
    t("channel.edit.confirmAddAction"),
    { searchable: true, searchPlaceholder: t("dialog.search.placeholder") }
  );
  if (!choice) return;

  const { error } = await supabase.rpc("add_channel_admin", {
    p_channel_id: ch.id,
    p_user_id: choice,
  });
  if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
  await renderChannelEditAdmins();
  await refreshChannelRights(ch.id);
  updateChannelEditSaveButton();
}

async function openTransferOwnerDialog() {
  if (!currentChannelObj) return;
  if (currentChannelObj.owner_id !== currentUser.id) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.err.noRightsOwner"));
    return;
  }
  const ch = currentChannelObj;

  const { data: mems } = await supabase.from("chat_members")
    .select("user_id, custom_name").eq("chat_id", ch.id).neq("user_id", currentUser.id);
  const memberIds = (mems || []).map((m) => m.user_id);
  if (!memberIds.length) {
    await showAlertDialog(t("auth.err.prefix"), t("channel.edit.noMembers"));
    return;
  }
  const customByUser = new Map((mems || []).map((m) => [m.user_id, m.custom_name]));

  const { data: profiles } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url").in("id", memberIds);

  const opts = (profiles || []).map((p) => {
    const custom = customByUser.get(p.id);
    const displayLabel = custom ? `${custom} (${p.display_name})` : p.display_name;
    return {
      label: `${displayLabel} — @${p.username}`,
      value: p.id,
      search: `${p.display_name} ${p.username} ${custom || ""}`,
    };
  });

  const choice = await showChoiceDialog(
    t("channel.edit.confirmTransfer"),
    t("channel.edit.confirmTransferText"),
    opts,
    t("channel.edit.confirmTransferAction"),
    { searchable: true, searchPlaceholder: t("dialog.search.placeholder") }
  );
  if (!choice) return;

  const confirm = await showConfirmDialog(
    t("channel.delete.confirmTitle"),
    t("channel.edit.confirmTransferConfirm"),
    t("channel.edit.confirmTransferAction")
  );
  if (!confirm) return;

  const { error } = await supabase.rpc("transfer_channel_owner", {
    p_channel_id: ch.id,
    p_new_owner: choice,
  });
  if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }

  // Пересчитываем права мгновенно, до realtime
  await refreshChannelRights(ch.id);

  await showAlertDialog(t("gifts.error"), t("channel.edit.transferSuccess"));
  closeChannelEditDialog();
  closeChannelProfileDialog();
  updateChannelEditSaveButton();
  // Если ты больше не владелец и не админ — канал останется открытым,
  // но composer скроется, а меню перестроится. Если ты и не подписчик — закроем.
  if (!currentChannelIsAdmin && !currentChannelIsSubscribed) {
    closeCurrentChat();
  }
}

// Realtime: админы канала меняются → перерисовываем редактор
function subscribeToChannelAdmins() {
  if (channelAdminsChannel) return;
  channelAdminsChannel = supabase.channel("channel-admins-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "channel_admins" }, async (payload) => {
      const row = payload.new || payload.old;
      if (!row || !row.channel_id) return;
      await refreshChannelRights(row.channel_id);
    })
    .subscribe();
}

// ======================================================
// 34. СПИСОК ПОДПИСЧИКОВ КАНАЛА
// ======================================================

async function openChannelSubscribersDialog() {
  if (!currentChannelObj) return;
  const ch = currentChannelObj;
  const overlay = document.getElementById("channel-subs-overlay");
  const titleEl = document.getElementById("channel-subs-title");
  const listEl = document.getElementById("channel-subs-list");

  titleEl.textContent = t("channel.profile.subsList");
  listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';
  overlay.classList.remove("hidden");

  const { data: subs, error } = await supabase.rpc("get_channel_subscribers", { p_channel_id: ch.id });
  if (error) { listEl.innerHTML = `<div class="empty">${escapeHtml(t("auth.err.prefix"))}: ${escapeHtml(error.message)}</div>`; return; }
  if (!subs || !subs.length) { listEl.innerHTML = '<div class="empty">' + escapeHtml(t("channel.profile.noSubs")) + '</div>'; return; }

  const profiles = [];
  for (const s of subs) {
    const p = await getProfile(s.user_id);
    if (p) profiles.push({ ...p, _role: s.role });
  }

  const roleLabel = (r) => r === "owner"
    ? t("channel.edit.ownerRole")
    : r === "admin"
      ? t("channel.edit.adminRole")
      : t("channel.edit.subscriberRole");

  listEl.innerHTML = profiles.map((p) => `
    <div class="admin-row" data-user-id="${p.id}">
      <div class="avatar"></div>
      <div class="admin-row-name">
        ${escapeHtml(p.display_name)}
        <div class="admin-row-username">@${escapeHtml(p.username)}</div>
      </div>
      <span class="admin-row-role ${p._role}">${roleLabel(p._role)}</span>
    </div>
  `).join("");

  listEl.querySelectorAll(".admin-row").forEach((row) => {
    const p = profiles.find((x) => x.id === row.dataset.userId);
    paintAvatar(row.querySelector(".avatar"), p);
  });
}

// ======================================================
// 35. ЗАКРЕПЛЁННЫЕ СООБЩЕНИЯ
// ======================================================

function setupChatPins() {
  const btn = document.getElementById("chat-pin-btn");
  const bar = document.getElementById("pin-bar");
  const listBtn = document.getElementById("pin-bar-list");
  const closeBtn = document.getElementById("pinned-list-close");

  if (btn) btn.addEventListener("click", openPinnedListDialog);
  if (closeBtn) closeBtn.addEventListener("click", () => {
    document.getElementById("pinned-list-overlay").classList.add("hidden");
  });
  if (listBtn) listBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openPinnedListDialog();
  });
  if (bar) bar.addEventListener("click", () => {
    const pin = currentPinnedList[currentPinnedIndex];
    if (pin) jumpToMessage(pin.message_id);
  });

  const box = document.getElementById("messages");
  if (box) box.addEventListener("scroll", () => updateCurrentPinnedByScroll(), { passive: true });
}

function resetPinsUI() {
  currentPinnedList = [];
  currentPinnedIndex = -1;
  const bar = document.getElementById("pin-bar");
  if (bar) bar.classList.add("hidden");
  updatePinButtonCount(0);
  document.querySelectorAll("#messages .msg-pin-mark").forEach((el) => el.remove());
}

function updatePinButtonCount(n) {
  const badge = document.getElementById("pin-count-badge");
  if (!badge) return;
  if (n > 0) {
    badge.textContent = String(n);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function rerenderPinMarks() {
  const pinnedIds = new Set(currentPinnedList.map((p) => p.message_id));
  document.querySelectorAll("#messages .msg, #messages .msg-system").forEach((msgEl) => {
    const timeEl = msgEl.querySelector(".msg-time");
    if (!timeEl) return;
    const id = msgEl.dataset.id;
    const existing = timeEl.querySelector(".msg-pin-mark");
    if (pinnedIds.has(id) && !existing) {
      const pin = document.createElement("span");
      pin.className = "msg-pin-mark";
      pin.title = "Закреплено";
      pin.innerHTML = '<span class="cell-icon cell-icon-sm" data-icon="pin"></span>';
      timeEl.insertBefore(pin, timeEl.firstChild);
    } else if (!pinnedIds.has(id) && existing) {
      existing.remove();
    }
  });
}

async function loadPinned(chatId) {
  currentPinnedList = [];
  currentPinnedIndex = -1;
  if (!chatId) { resetPinsUI(); return; }
  const { data: pins, error } = await supabase.from("pinned_messages")
    .select("*").eq("chat_id", chatId).order("pinned_at", { ascending: false });
  if (error) { console.warn("loadPinned:", error); resetPinsUI(); return; }
  if (!pins || !pins.length) { resetPinsUI(); return; }

  const msgIds = pins.map((p) => p.message_id);
  const { data: msgs } = await supabase.from("messages").select("*").in("id", msgIds);
  const msgMap = new Map((msgs || []).map((m) => [m.id, m]));

  currentPinnedList = pins
    .filter((p) => msgMap.has(p.message_id))
    .map((p) => ({ ...p, _msg: msgMap.get(p.message_id) }))
    .sort((a, b) => new Date(a._msg.created_at) - new Date(b._msg.created_at));

  updatePinButtonCount(currentPinnedList.length);

  if (!currentPinnedList.length) { resetPinsUI(); return; }
  currentPinnedIndex = 0;
  renderPinBar();
  rerenderPinMarks();
}

async function renderPinBar() {
  const bar = document.getElementById("pin-bar");
  const titleEl = document.getElementById("pin-bar-title");
  const textEl = document.getElementById("pin-bar-text");
  if (!bar) return;
  if (!currentPinnedList.length) { bar.classList.add("hidden"); return; }
  bar.classList.remove("hidden");
  const pin = currentPinnedList[currentPinnedIndex];
  if (!pin) { bar.classList.add("hidden"); return; }
  const msg = pin._msg;
  const plain = await getPlaintext(msg);
  const preview = stripMarkdown(plain || "") || (
    msg.message_type === "gift" ? t("pins.gift")
    : msg.message_type === "tokens" ? t("pins.tokens")
    : ""
  );
  textEl.textContent = preview.slice(0, 80) || t("pins.noText");
  const total = currentPinnedList.length;
  titleEl.textContent = total > 1
    ? tFmt("pins.multi", { i: currentPinnedIndex + 1, total })
    : t("pins.one");
}

function updateCurrentPinnedByScroll() {
  if (!currentPinnedList.length) return;
  if (Date.now() < pinBarFrozenUntil) return;
  const box = document.getElementById("messages");
  if (!box) return;
  const boxRect = box.getBoundingClientRect();
  let bestIdx = 0;
  let found = false;
  for (let i = 0; i < currentPinnedList.length; i++) {
    const el = document.querySelector(`[data-id="${currentPinnedList[i].message_id}"]`);
    if (!el) continue;
    const elTopInBox = el.getBoundingClientRect().top - boxRect.top;
    if (elTopInBox <= 60) { bestIdx = i; found = true; }
    else break;
  }
  if (!found) bestIdx = 0;
  if (bestIdx !== currentPinnedIndex) {
    currentPinnedIndex = bestIdx;
    renderPinBar();
  }
}

function updatePinMenuLabel(msgId) {
  const pinBtn = document.querySelector('#msg-context-menu button[data-action="pin"]');
  if (!pinBtn) return;
  const myPin = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "personal" && p.pinned_by === currentUser.id);
  const sharedPin = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "shared");
  if (myPin || sharedPin) pinBtn.textContent = t("msgCtx.unpin");
  else pinBtn.textContent = t("msgCtx.pin");
}

async function handlePinAction(msgId) {
  if (!currentChatId) return;
  const msg = msgCache.get(msgId);
  if (!msg) return;
  if (msg.message_type === "tokens") return;

  // === КАНАЛ ===
  if (currentChannelObj) {
    if (!currentChannelIsAdmin) {
      await showAlertDialog(t("gifts.error"), t("channel.sub.onlyAdminsPin"));
      return;
    }
    const existing = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "shared");
    if (existing) {
      const ok = await showConfirmDialog(t("msgCtx.unpin"), t("pins.unpinChannel"), t("pins.chooseAction"));
      if (!ok) return;
      const { error } = await supabase.from("pinned_messages").delete().eq("id", existing.id);
      if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    } else {
      const { error } = await supabase.from("pinned_messages").insert({
        chat_id: currentChatId, message_id: msgId, pinned_by: currentUser.id, scope: "shared",
      });
      if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    }
    await loadPinned(currentChatId);
    return;
  }

  // === DM ===
  const myPin = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "personal" && p.pinned_by === currentUser.id);
  const sharedPin = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "shared");

  // Если уже shared — только «открепить»
  if (sharedPin && !myPin) {
    const ok = await showConfirmDialog(t("msgCtx.unpin"), t("pins.unpinShared"), t("pins.chooseAction"));
    if (!ok) return;
    const { error } = await supabase.from("pinned_messages").delete().eq("id", sharedPin.id);
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    await loadPinned(currentChatId);
    return;
  }

  // Если только личный — только «открепить у меня»
  if (myPin && !sharedPin) {
    const ok = await showConfirmDialog(t("msgCtx.unpin"), t("pins.unpinMine"), t("pins.chooseAction"));
    if (!ok) return;
    const { error } = await supabase.from("pinned_messages").delete().eq("id", myPin.id);
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    await loadPinned(currentChatId);
    return;
  }

  // Если оба закрепа — предложить снять любой
  if (myPin && sharedPin) {
    const choice = await showChoiceDialog(t("pins.choose"), t("pins.chooseText"), [
      { label: t("pins.chooseUnpinMe"), value: "unpin_me" },
      { label: t("pins.chooseUnpinBoth"), value: "unpin_both" },
    ], t("pins.chooseAction"));
    if (!choice) return;
    const id = choice === "unpin_me" ? myPin.id : sharedPin.id;
    const { error } = await supabase.from("pinned_messages").delete().eq("id", id);
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
    await loadPinned(currentChatId);
    return;
  }

  // Ничего нет — предлагаем закрепить
  const choice2 = await showChoiceDialog(t("pins.pinTitle"), t("pins.pinText"), [
    { label: t("pins.pinMe"), value: "pin_me" },
    { label: t("pins.pinBoth"), value: "pin_both" },
  ], t("pins.pinAction"));
  if (!choice2) return;

  if (choice2 === "pin_me") {
    const { error } = await supabase.from("pinned_messages").insert({
      chat_id: currentChatId, message_id: msgId, pinned_by: currentUser.id, scope: "personal",
    });
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
  } else {
    const { error } = await supabase.from("pinned_messages").insert({
      chat_id: currentChatId, message_id: msgId, pinned_by: currentUser.id, scope: "shared",
    });
    if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
  }
  await loadPinned(currentChatId);
}

function openPinnedListDialog() {
  if (!currentPinnedList.length) {
    showAlertDialog(t("pins.title"), t("pins.none"));
    return;
  }
  const listEl = document.getElementById("pinned-list");
  listEl.innerHTML = currentPinnedList.map((pin, idx) => {
    const msg = pin._msg;
    const time = new Date(msg.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const preview = stripMarkdown(decryptedCache.get(msg.id) || (msg.encrypted ? t("preview.encrypted") : msg.content) || "") || (
      msg.message_type === "gift" ? t("pins.gift")
      : msg.message_type === "tokens" ? t("pins.tokens")
      : t("pins.noText")
    );
    const sender = profileCache.get(msg.sender_id);
    const senderName = msg.sender_id === currentUser.id ? t("pins.you") : (sender ? sender.display_name : "—");
    const scopeLabel = pin.scope === "shared" ? t("pins.scope.shared") : t("pins.scope.personal");
    return `
      <div class="pinned-list-item" data-pin-idx="${idx}">
        <div class="pinned-list-item-head">
          <span class="pinned-list-item-sender">${escapeHtml(senderName)}</span>
          <span class="pinned-list-item-time">${time}</span>
        </div>
        <div class="pinned-list-item-text">${escapeHtml(preview.slice(0, 120))}</div>
        <div class="pinned-list-item-scope" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>${scopeLabel}</span>
          <button type="button" class="pinned-unpin-btn" data-unpin-idx="${idx}"
                  style="background:transparent;border:none;color:var(--danger);font-size:12px;font-family:inherit;cursor:pointer;padding:2px 6px;border-radius:6px;">
            ${escapeHtml(t("pins.unpin"))}
          </button>
        </div>
      </div>`;
  }).join("");

  listEl.querySelectorAll(".pinned-list-item").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.pinIdx, 10);
      const pin = currentPinnedList[idx];
      document.getElementById("pinned-list-overlay").classList.add("hidden");
      if (pin) jumpToMessage(pin.message_id);
    });
  });

  listEl.querySelectorAll("[data-unpin-idx]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.unpinIdx, 10);
      const pin = currentPinnedList[idx];
      if (!pin) return;
      const label = pin.scope === "shared" ? t("pins.unpinLabelBoth") : t("pins.unpinLabelMine");
      const ok = await showConfirmDialog(
        t("msgCtx.unpin"),
        tFmt("pins.unpinOne", { label }),
        t("pins.chooseAction")
      );
      if (!ok) return;
      const { error } = await supabase.from("pinned_messages").delete().eq("id", pin.id);
      if (error) { await showAlertDialog(t("auth.err.prefix"), error.message); return; }
      await loadPinned(currentChatId);
      if (currentPinnedList.length) openPinnedListDialog();
      else document.getElementById("pinned-list-overlay").classList.add("hidden");
    });
  });

  document.getElementById("pinned-list-overlay").classList.remove("hidden");
}

function subscribeToPins() {
  if (pinsChannel) { supabase.removeChannel(pinsChannel); pinsChannel = null; }
  pinsChannel = supabase.channel("pins-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "pinned_messages" }, async (payload) => {
      const row = payload.new || payload.old;
      if (!row) return;
      // Если chat_id не пришёл (DELETEs без REPLICA IDENTITY), перезагрузим для текущего чата
      const cid = row.chat_id || currentChatId;
      if (currentChatId && cid === currentChatId) {
        await loadPinned(currentChatId);
      }
    })
    .subscribe();
}

// ======================================================
// 36. ССЫЛКИ-ПРИГЛАШЕНИЯ
// ======================================================

function setupInviteUI() {
  const closeBtn = document.getElementById("invite-close-btn");
  const createBtn = document.getElementById("invite-create-btn");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    document.getElementById("invite-overlay").classList.add("hidden");
  });
  if (createBtn) createBtn.addEventListener("click", async () => {
    if (!currentChannelObj) return;
    createBtn.disabled = true;
    const { data: code, error } = await supabase.rpc("create_channel_invite", { p_chat_id: currentChannelObj.id });
    createBtn.disabled = false;
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    await refreshInviteList();
  });
}

async function openInviteDialog() {
  if (!currentChannelObj) return;
  document.getElementById("invite-overlay").classList.remove("hidden");
  await refreshInviteList();
}

async function refreshInviteList() {
  const listEl = document.getElementById("invite-list");
  if (!currentChannelObj) return;
  listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';
  const { data, error } = await supabase.from("channel_invites")
    .select("*").eq("chat_id", currentChannelObj.id).eq("revoked", false)
    .order("created_at", { ascending: false });
  if (error) { listEl.innerHTML = `<div class="empty">${escapeHtml(t("auth.err.prefix"))}: ${escapeHtml(error.message)}</div>`; return; }
  currentInvitesList = data || [];
  if (!currentInvitesList.length) {
    listEl.innerHTML = '<div class="empty">' + escapeHtml(t("invite.empty")) + '</div>';
    return;
  }
  const baseUrl = window.location.origin + window.location.pathname;
  listEl.innerHTML = currentInvitesList.map((inv) => {
    const url = `${baseUrl}#invite=${inv.code}`;
    return `
      <div class="invite-item" data-invite-id="${inv.id}">
        <span class="invite-item-code"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></span>
        <button class="invite-item-open" data-open-code="${inv.code}" title="${escapeHtml(t("invite.open"))}"><span class="cell-icon cell-icon-sm" data-icon="external"></span></button>
        <button class="invite-item-share" data-share-code="${inv.code}" title="${escapeHtml(t("invite.share"))}"><span class="cell-icon cell-icon-sm" data-icon="share"></span></button>
        <button class="invite-item-copy" data-copy-code="${inv.code}" title="${escapeHtml(t("invite.copy"))}"><span class="cell-icon cell-icon-sm" data-icon="copyLink"></span></button>
        <button class="invite-item-revoke" data-revoke-id="${inv.id}" title="${escapeHtml(t("invite.revoke"))}"><span class="cell-icon cell-icon-sm" data-icon="cancel"></span></button>
      </div>`;
  }).join("");

  listEl.querySelectorAll("[data-share-code]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = `${baseUrl}#invite=${btn.dataset.shareCode}`;
      openInviteShareDialog(url);
    });
  });

  listEl.querySelectorAll("[data-copy-code]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = `${baseUrl}#invite=${btn.dataset.copyCode}`;
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
      else {
        const tmp = document.createElement("textarea");
        tmp.value = url; document.body.appendChild(tmp); tmp.select();
        document.execCommand("copy"); document.body.removeChild(tmp);
      }
      const iconEl = btn.querySelector(".cell-icon");
      if (iconEl) iconEl.setAttribute("data-icon", "check");
      setTimeout(() => { if (iconEl) iconEl.setAttribute("data-icon", "copyLink"); }, 1200);
    });
  });
  listEl.querySelectorAll("[data-open-code]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // В этой же вкладке — сессия не потеряется
      window.location.hash = "invite=" + btn.dataset.openCode;
    });
  });
  listEl.querySelectorAll("[data-revoke-id]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await showConfirmDialog(
        t("invite.revokeTitle"),
        t("invite.revokeText"),
        t("invite.revokeAction")
      );
      if (!ok) return;
      const { error } = await supabase.from("channel_invites")
        .update({ revoked: true }).eq("id", btn.dataset.revokeId);
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      await refreshInviteList();
    });
  });
}

async function tryJoinFromInviteUrl() {
  const hash = window.location.hash || "";
  const m = /[#&]invite=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return;
  const code = m[1];
  try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}
  if (!currentUser) return;
  try {
    const { data: chatId, error } = await supabase.rpc("join_channel_by_invite", { p_code: code });
    if (error) { await showAlertDialog("Приглашение", error.message); return; }
    await loadRecentChats();
    if (chatId) await openChannel(chatId);
  } catch (e) {
    console.error(e);
    await showAlertDialog("Ошибка", e.message || String(e));
  }
}

// ======================================================
// 37. ЗАЯВКИ НА ВСТУПЛЕНИЕ В КАНАЛ
// ======================================================

async function openChannelRequestsDialog() {
  if (!currentChannelObj) return;
  const ch = currentChannelObj;
  const overlay = document.getElementById("channel-requests-overlay");
  const listEl = document.getElementById("channel-requests-list");

  listEl.innerHTML = '<div class="empty">' + escapeHtml(t("empty.loading")) + '</div>';
  overlay.classList.remove("hidden");

  const { data: reqs, error } = await supabase.from("channel_join_requests")
    .select("id, user_id, created_at").eq("chat_id", ch.id)
    .order("created_at", { ascending: true });
  if (error) { listEl.innerHTML = `<div class="empty">${escapeHtml(t("auth.err.prefix"))}: ${escapeHtml(error.message)}</div>`; return; }
  if (!reqs || !reqs.length) {
    listEl.innerHTML = '<div class="empty">' + escapeHtml(t("channel.profile.noRequests")) + '</div>';
    updateChannelRequestsBadge(ch.id);
    return;
  }

  const profiles = [];
  for (const r of reqs) {
    const p = await getProfile(r.user_id);
    if (p) profiles.push({ ...p, _requestId: r.id });
  }

  listEl.innerHTML = profiles.map((p) => `
    <div class="admin-row" data-request-id="${p._requestId}">
      <div class="avatar"></div>
      <div class="admin-row-name">
        ${escapeHtml(p.display_name)}
        <div class="admin-row-username">@${escapeHtml(p.username)}</div>
      </div>
      <button type="button" class="request-approve" data-approve="${p._requestId}" title="${escapeHtml(t("request.approve"))}"><span class="cell-icon cell-icon-sm" data-icon="check"></span></button>
      <button type="button" class="request-reject" data-reject="${p._requestId}" title="${escapeHtml(t("request.reject"))}"><span class="cell-icon cell-icon-sm" data-icon="cancel"></span></button>
    </div>
  `).join("");

  listEl.querySelectorAll(".admin-row").forEach((row) => {
    const p = profiles.find((x) => x._requestId === row.dataset.requestId);
    paintAvatar(row.querySelector(".avatar"), p);
  });

  listEl.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const { error } = await supabase.rpc("approve_join_request", { p_request_id: btn.dataset.approve });
      btn.disabled = false;
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      await updateChannelRequestsBadge(ch.id);
      await openChannelRequestsDialog(); // перерисовать
      await refreshChannelRights(ch.id);
    });
  });
  listEl.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const { error } = await supabase.rpc("reject_join_request", { p_request_id: btn.dataset.reject });
      btn.disabled = false;
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      await updateChannelRequestsBadge(ch.id);
      await openChannelRequestsDialog();
    });
  });
}

// Обновляет бейдж «Заявки» в открытом профиле канала
async function updateChannelRequestsBadge(channelId) {
  if (channelProfileChannelId !== channelId) return;
  const requestsRow = document.getElementById("channel-profile-requests-row");
  if (!requestsRow || requestsRow.classList.contains("hidden")) return;
  const { data: cnt } = await supabase.rpc("count_pending_requests", { p_chat_id: channelId });
  const n = Number(cnt) || 0;
  document.getElementById("channel-profile-requests").textContent = String(n);
  const word = pluralRu(n, t("channel.requestWord.one"), t("channel.requestWord.few"), t("channel.requestWord.many"));
  const sub = requestsRow.querySelector(".pir-label");
  if (sub) sub.textContent = tFmt("channel.profile.requestsHintPlural", { n, word });
}

function subscribeToChannelRequests() {
  if (channelRequestsChannel) return;
  channelRequestsChannel = supabase.channel("channel-requests-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "channel_join_requests" }, async (payload) => {
      const row = payload.new || payload.old;
      // Сразу обновляем список заявок у админа (в т.ч. при DELETE без chat_id —
      // тогда используем текущий открытый канал).
      if (currentChannelObj) {
        const rowChatId = row && row.chat_id;
        const isOurChannel = !rowChatId || rowChatId === currentChannelObj.id;
        if (isOurChannel) {
          const overlay = document.getElementById("channel-requests-overlay");
          if (overlay && !overlay.classList.contains("hidden")) {
            await openChannelRequestsDialog();
          }
        }
      }
      if (!row) return;
      // Обновляем бейдж на открытом профиле.
      // ⚠️ Для DELETE payload.old может не содержать chat_id, поэтому
      // используем текущий открытый профиль как fallback. Иначе бейдж
      // у админа не уменьшится при отзыве/удалении заявки.
      if (channelProfileChannelId) {
        await updateChannelRequestsBadge(channelProfileChannelId);
      }

      // 🔴 Обработка удаления МОЕЙ заявки (approve или reject).
      // Так как при REPLICA IDENTITY DEFAULT payload.old не содержит
      // chat_id/user_id, перепроверяем состояние текущего открытого канала.
      if (payload.eventType === "DELETE" && currentChannelObj &&
          currentChannelObj.visibility === "request" && currentChannelHasRequest) {
        const channelId = currentChannelObj.id;
        setTimeout(async () => {
          if (!currentChannelObj || currentChannelObj.id !== channelId) return;
          // Наша заявка ещё висит?
          const { data: myReq } = await supabase.from("channel_join_requests")
            .select("id").eq("chat_id", channelId).eq("user_id", currentUser.id).maybeSingle();
          if (myReq) return; // заявка всё ещё наша — ждём
          // Заявка исчезла: approve или reject?
          const { data: mem } = await supabase.from("chat_members")
            .select("chat_id").eq("chat_id", channelId).eq("user_id", currentUser.id).maybeSingle();
          if (mem) {
            // Approve — обновится через realtime chat_members INSERT
            currentChannelHasRequest = false;
            currentChannelIsSubscribed = true;
          } else {
            // Reject — показываем «Заявка отклонена»
            currentChannelHasRequest = false;
            currentChannelRequestRejected = true;
            await updateChannelComposerState();
          }
        }, 900);
      }
    })
    .subscribe();
}

// ======================================================
// РЕЖИМ «БАБУШКА»
// ======================================================

// Находит секцию в настройках по точному тексту её .profile-label
function findSettingsSectionByLabel(text) {
  const labels = document.querySelectorAll("#settings-overlay .profile-label");
  for (const l of labels) {
    if (l.textContent.trim() === text) {
      return l.closest(".profile-section");
    }
  }
  return null;
}

// Применяет/снимает видимость элементов интерфейса в зависимости от режима
function applyGrandmaModeUI() {
  const on = isGrandmaMode();

  // 1. Кнопки в боковом меню
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.classList.toggle("hidden", on);
  const createChannelBtn = document.getElementById("create-channel-btn");
  if (createChannelBtn) createChannelBtn.classList.toggle("hidden", on);

  // 2. Секции настроек. Ищем по ID, а не по тексту — иначе сломается
  //    при переключении языка.
  const sectionIds = [
    "settings-mfa-section",
    "settings-e2ee-section",
    "settings-quick-reaction-section",
    "settings-app-icon-section",
    "settings-scroll-mode-section",
  ];
  sectionIds.forEach((id) => {
    const sec = document.getElementById(id);
    if (sec) sec.classList.toggle("hidden", on);
  });

  // 3. Сама секция «Режим Бабушка» — когда режим включён, прячем её
  //    (отключение — только через долгое нажатие на аватар).
  const grandmaSection = document.getElementById("settings-grandma-section");
  if (grandmaSection) grandmaSection.classList.toggle("hidden", on);

  // 4. Кнопка-переключатель (если режим всё-таки виден — обновим текст)
  const btn = document.getElementById("grandma-toggle-btn");
  if (btn) btn.textContent = on ? t("settings.grandma.disable") : t("settings.grandma.enable");
}

async function enableGrandmaMode() {
  const ok = await showConfirmDialog(
    t("grandma.enable.title"),
    t("grandma.enable.text"),
    t("grandma.enable.confirm")
  );
  if (!ok) return;

  try { localStorage.setItem(GRANDMA_MODE_KEY, "1"); } catch (e) {}
  applyGrandmaModeUI();
  await showAlertDialog(
    t("grandma.enabled.title"),
    t("grandma.enabled.text")
  );
}

async function disableGrandmaMode() {
  const ok = await showConfirmDialog(
    t("grandma.disable.title"),
    t("grandma.disable.text"),
    t("grandma.disable.confirm")
  );
  if (!ok) return;

  try { localStorage.removeItem(GRANDMA_MODE_KEY); } catch (e) {}
  applyGrandmaModeUI();
  resetInactivityTimer();
  await showAlertDialog(t("grandma.disabled.title"), t("grandma.disabled.text"));
}

// Навешивает 5-тап и long-press на аватар в сайдбаре —
// только для отключения режима Бабушка.
function setupGrandmaEscapeHatch() {
  const avatar = document.getElementById("me-avatar");
  const infoBtn = document.getElementById("me-info-btn");
  if (!avatar || !infoBtn) return;

  // Long-press (1.5 сек) на аватар — отключение режима.
  let lpTimer = null;
  let lpFired = false;
  let startX = 0, startY = 0;

  avatar.addEventListener("touchstart", (e) => {
    if (!isGrandmaMode()) return;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    lpFired = false;
    lpTimer = setTimeout(() => {
      lpFired = true;
      try { if (navigator.vibrate) navigator.vibrate(20); } catch (ex) {}
      disableGrandmaMode();
    }, 1500);
  }, { passive: true });

  avatar.addEventListener("touchmove", (e) => {
    if (!lpTimer) return;
    const t = e.touches[0];
    if (!t) return;
    if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) {
      clearTimeout(lpTimer); lpTimer = null;
    }
  }, { passive: true });

  avatar.addEventListener("touchend", (e) => {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
    if (lpFired) {
      e.preventDefault();
      e.stopPropagation();
      lpFired = false;
    }
  });

  // Mouse long-press (для ПК, если пользователь зашёл через PWA на компьютере)
  avatar.addEventListener("mousedown", (e) => {
    if (!isGrandmaMode()) return;
    lpFired = false;
    lpTimer = setTimeout(() => {
      lpFired = true;
      disableGrandmaMode();
    }, 1500);
    e.preventDefault();
  });
  avatar.addEventListener("mouseup", (e) => {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
    if (lpFired) {
      e.stopPropagation();
      lpFired = false;
    }
  });
  avatar.addEventListener("mouseleave", () => {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
  });

  // Клик по me-info (открывает профиль) — если только что сработал long-press,
  // не открываем профиль.
  infoBtn.addEventListener("click", (e) => {
    if (lpFired) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, true);
}

// ======================================================
// ВЫБОР ИКОНКИ ПРИЛОЖЕНИЯ (только PWA)
// ======================================================

const APP_ICON_KEY = "cell_app_icon";
const APP_ICON_MANIFESTS = {
  classic:    "manifest.json",
  monochrome: "manifest-monochrome.json",
  sea:        "manifest-sea.json",
  fury:       "manifest-fury.json",
  inverse:    "manifest-inverse.json",
  gradient:   "manifest-gradient.json",
};
const APP_ICON_LABELS = {
  classic:    "Классический",
  monochrome: "Монохром",
  sea:        "Море",
  fury:       "Ярость",
  inverse:    "Реверсивный",
  gradient:   "Градиент",
};

function applyAppIcon(key) {
  if (!APP_ICON_MANIFESTS[key]) key = "classic";
  const link = document.getElementById("app-manifest-link");
  if (link) link.setAttribute("href", APP_ICON_MANIFESTS[key]);
  try { localStorage.setItem(APP_ICON_KEY, key); } catch (e) {}
  document.querySelectorAll("[data-app-icon]").forEach((el) => {
    el.classList.toggle("selected", el.dataset.appIcon === key);
  });
}

// Применяем сохранённую иконку при загрузке (сразу, до initApp).
(function initAppIconEarly() {
  // Применяем только в PWA — на сайте иконка не имеет смысла.
  if (!isStandalonePWA) return;
  let saved = "classic";
  try { saved = localStorage.getItem(APP_ICON_KEY) || "classic"; } catch (e) {}
  const link = document.getElementById("app-manifest-link");
  if (link && APP_ICON_MANIFESTS[saved]) {
    link.setAttribute("href", APP_ICON_MANIFESTS[saved]);
  }
})();

function renderAppIconGrid() {
  const grid = document.getElementById("app-icon-grid");
  if (!grid) return;
  const keys = Object.keys(APP_ICON_MANIFESTS);
  let current = "classic";
  try { current = localStorage.getItem(APP_ICON_KEY) || "classic"; } catch (e) {}

  grid.innerHTML = keys.map((k) => `
    <button type="button" class="app-icon-option ${k === current ? "selected" : ""}"
            data-app-icon="${k}" title="${APP_ICON_LABELS[k]}">
      <span class="app-icon-preview app-icon-${k}"></span>
      <span class="app-icon-label">${APP_ICON_LABELS[k]}</span>
    </button>
  `).join("");

  grid.querySelectorAll("[data-app-icon]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const k = btn.dataset.appIcon;
      if (k === current) return;
      current = k;
      applyAppIcon(k);
      if (isStandalonePWA) {
        await showAlertDialog(
          "Иконка изменена",
          "Чтобы увидеть новую иконку, полностью закрой приложение и запусти снова.\n\n" +
          "Если иконка не обновилась — удали PWA и установи заново."
        );
      } else {
        await showAlertDialog(
          "Иконка выбрана",
          "Теперь установи Cell как приложение: значок установки в адресной строке браузера.\n\n" +
          "Выбранная иконка применится при установке."
        );
      }
    });
  });
}

// ======================================================
// 43. НАСТРОЙКИ: РЕЖИМ СПИСКА ЧАТОВ
// ======================================================
// ВАЖНО: SCROLL_MODE_KEY и scrollMode объявлены в самом верху файла,
// сразу после ICONS — чтобы не было TDZ при вызове initApp().

function setupSettings() {
  const btn = document.getElementById("settings-btn");
  const overlay = document.getElementById("settings-overlay");
  const closeBtn = document.getElementById("settings-close");
  const toggle = document.getElementById("settings-scroll-mode");
  if (!btn || !overlay) return;

  // Переключатель языка. Привязываем один раз (защита от двойного
  // вызова setupSettings — например, при повторном входе).
  const langToggle = document.getElementById("settings-language-toggle");
  if (langToggle && !langToggle.__langBound) {
    langToggle.__langBound = true;
    langToggle.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-lang]");
      if (!b) return;
      if (b.dataset.lang === currentLang) return;
      setLanguage(b.dataset.lang);
    });
  }
  // Подсветить актуальную кнопку (на случай, если язык выбирался в прошлой сессии)
  applyLanguage();

  // Секция 2FA
  const mfaManageBtn = document.getElementById("mfa-manage-btn");
  if (mfaManageBtn) mfaManageBtn.addEventListener("click", openMfaSetup);

  const mfaSetupClose = document.getElementById("mfa-setup-close");
  if (mfaSetupClose) mfaSetupClose.addEventListener("click", closeMfaSetup);

  // Секция «Уведомления»
  const notifCb = document.getElementById("settings-notifications-enabled");
  const notifTest = document.getElementById("settings-notifications-test");
  if (notifCb && !notifCb.__bound) {
    notifCb.__bound = true;
    notifCb.checked = areNotificationsEnabled();
    notifCb.addEventListener("change", async () => {
      if (notifCb.checked) {
        const ok = await requestNotificationPermission();
        if (!ok) {
          notifCb.checked = false;
          setNotificationsEnabled(false);
          await showAlertDialog(
            t("settings.notifications.denied"),
            t("settings.notifications.deniedText")
          );
          return;
        }
        setNotificationsEnabled(true);
        // Оформляем push-подписку для фоновых уведомлений.
        const res = await subscribeToWebPush();
        if (!res.ok && res.reason === "unsupported") {
          // Не блокируем пользователя — in-app уведомления всё равно работают.
          console.info("Push not supported, in-app only");
        } else if (!res.ok) {
          console.warn("Push subscription failed:", res.reason);
        }
      } else {
        setNotificationsEnabled(false);
        await unsubscribeFromWebPush();
      }
    });
  }
  if (notifTest && !notifTest.__bound) {
    notifTest.__bound = true;
    notifTest.addEventListener("click", async () => {
      // Тест тоже требует клика — просим разрешение здесь.
      if (!areNotificationsEnabled()) {
        const ok = await requestNotificationPermission();
        if (!ok) {
          await showAlertDialog(
            t("settings.notifications.denied"),
            t("settings.notifications.deniedText")
          );
          return;
        }
        setNotificationsEnabled(true);
        if (notifCb) notifCb.checked = true;
      }
      // Принудительно показываем — игнорируя фокус окна (иначе тест
      // ничего не покажет, ведь пользователь как раз смотрит на экран).
      if (!("Notification" in window) || Notification.permission !== "granted") {
        await showAlertDialog(
          t("settings.notifications.denied"),
          t("settings.notifications.deniedText")
        );
        return;
      }
      try {
        const n = new Notification(t("settings.notifications.testTitle"), {
          body: t("settings.notifications.testBody"),
          icon: "icon-192.png",
        });
        setTimeout(() => { try { n.close(); } catch (e) {} }, 6000);
      } catch (e) {
        await showAlertDialog(t("auth.err.prefix"), String(e.message || e));
      }
    });
  }

  // Кнопка «Режим Бабушка»
  const grandmaBtn = document.getElementById("grandma-toggle-btn");
  if (grandmaBtn) {
    grandmaBtn.addEventListener("click", () => {
      if (isGrandmaMode()) disableGrandmaMode();
      else enableGrandmaMode();
    });
  }

  // Сетка быстрой реакции
  const quickGrid = document.getElementById("quick-reaction-grid");
  if (quickGrid) {
    const renderQuickGrid = () => {
      const current = getSavedQuickReaction();
      quickGrid.innerHTML = REACTION_EMOJIS.map((em) =>
        `<button type="button" class="quick-reaction-option ${em === current ? "selected" : ""}" data-quick-em="${escapeHtml(em)}">${em}</button>`
      ).join("");
      quickGrid.querySelectorAll("[data-quick-em]").forEach((btn) => {
        btn.addEventListener("click", () => {
          try { localStorage.setItem(QUICK_REACTION_KEY, btn.dataset.quickEm); } catch (ex) {}
          renderQuickGrid();
        });
      });
    };
    renderQuickGrid();
  }

  // Акцент-грид живёт в настройках
  const grid = document.getElementById("accent-grid");
  if (grid) {
    grid.innerHTML = "";
    ACCENTS.forEach((a) => {
      const d = document.createElement("div");
      d.className = "accent-option"; d.dataset.accent = a;
      d.style.background = ACCENT_COLORS[a]; d.title = a; grid.appendChild(d);
    });
    grid.addEventListener("click", async (e) => {
      const el = e.target.closest(".accent-option"); if (!el) return;
      applyAccent(el.dataset.accent); updateAccentButtons();
      await saveProfileField({ accent_color: el.dataset.accent });
    });
  }

  btn.addEventListener("click", async () => {
    updateSettingsUI();
    updateAccentButtons();
    const notifCbSync = document.getElementById("settings-notifications-enabled");
    if (notifCbSync) notifCbSync.checked = areNotificationsEnabled();
    await refreshMfaStatus();
    await refreshE2eeStatus();
    // Пересобираем видимость на случай, если режим Бабушка включён.
    applyGrandmaModeUI();
    overlay.classList.remove("hidden");
  });
  if (closeBtn) closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });

  // На мобильном скрываем всю секцию «Режим списка чатов» —
  // там нет клавиатуры, wheel-режим не работает.
  if (window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches) {
    const toggleBlock = document.getElementById("settings-scroll-mode");
    const section = toggleBlock ? toggleBlock.closest(".profile-section") : null;
    if (section) section.style.display = "none";
  }

  // Секция «Иконка приложения». Скрываем только на iOS — Safari не даёт
  // менять иконку после установки на домашний экран. Везде остальное —
  // показываем, чтобы пользователь мог ВЫБРАТЬ иконку ДО установки PWA.
  const iconSection = document.getElementById("settings-app-icon-section");
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iconSection) {
    if (isIOS) {
      iconSection.style.display = "none";
    } else {
      renderAppIconGrid();
    }
  }

  if (toggle) {
    toggle.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-mode]");
      if (!b) return;
      scrollMode = b.dataset.mode;
      try { localStorage.setItem(SCROLL_MODE_KEY, scrollMode); } catch (ex) {}
      updateSettingsUI();
      applyScrollMode();
    });
  }
}

function updateSettingsUI() {
  const toggle = document.getElementById("settings-scroll-mode");
  if (!toggle) return;
  toggle.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === scrollMode);
  });
}

function applyScrollMode() {
  try {
    const saved = localStorage.getItem(SCROLL_MODE_KEY);
    if (saved === "classic" || saved === "wheel") scrollMode = saved;
  } catch (e) {}

  document.documentElement.dataset.scrollMode = scrollMode;

  const list = document.getElementById("users-list");
  if (!list) return;

  // Сбрасываем inline-стили от прежнего колёсного режима
  list.querySelectorAll(".user-item").forEach((el) => {
    el.classList.remove("wheel-active");
    el.style.removeProperty("--ty");
    el.style.removeProperty("--sc");
    el.style.removeProperty("--chat-hue");
    el.style.removeProperty("opacity");
    el.style.removeProperty("z-index");
  });
  list.style.paddingTop = "";
  list.style.paddingBottom = "";
  list.style.scrollSnapType = "";

  if (scrollMode === "classic") {
    list.scrollTop = 0;
    updateWheelArrows(false, false);
  } else {
    refreshWheelLayout();
  }
}

// Сохранить режим при старте — сделать это до initApp.
// На мобильном всегда classic: wheel-режим требует Alt+↑/↓,
// которых на тачскрине нет.
(function initScrollMode() {
  const isMobile = window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches;
  if (isMobile) {
    scrollMode = "classic";
  } else {
    try {
      const saved = localStorage.getItem(SCROLL_MODE_KEY);
      if (saved === "classic" || saved === "wheel") {
        scrollMode = saved;
      } else {
        scrollMode = "classic";
      }
    } catch (e) { scrollMode = "classic"; }
  }
  document.documentElement.dataset.scrollMode = scrollMode;
})();

// ======================================================
// 44. ПРЕДПРОСМОТР ВЛОЖЕНИЙ ПЕРЕД ОТПРАВКОЙ
// ======================================================

let attachPendingFiles = [];

function openAttachmentDialog(files) {
  attachPendingFiles = [...files];
  document.getElementById("attach-caption").value = "";
  document.getElementById("attach-as-file").checked = false;
  updateAttachAsFileIcon();
  renderAttachPreview();
  document.getElementById("attach-preview-overlay").classList.remove("hidden");
  setTimeout(() => document.getElementById("attach-caption").focus(), 60);
}

function updateAttachAsFileIcon() {
  const cb = document.getElementById("attach-as-file");
  const icon = document.getElementById("attach-as-file-icon");
  if (!cb || !icon) return;
  icon.setAttribute("data-icon", cb.checked ? "checkboxOn" : "checkboxOff");
}

function renderAttachPreview() {
  const listEl = document.getElementById("attach-preview-list");
  if (!listEl) return;

  if (!attachPendingFiles.length) {
    document.getElementById("attach-preview-overlay").classList.add("hidden");
    return;
  }

  listEl.innerHTML = attachPendingFiles.map((f, i) => {
    const url = URL.createObjectURL(f);
    const kind = detectFileKind(f);
    let previewHtml;
    if (kind === "image") {
      previewHtml = `<img src="${url}" class="attach-preview-media" alt="">`;
    } else if (kind === "video") {
      previewHtml = `<video src="${url}" class="attach-preview-media" muted preload="metadata"></video>`;
    } else {
      previewHtml = `<div class="attach-preview-file"><span class="maf-icon">📎</span><span class="maf-name" style="font-size:14px;">${escapeHtml(f.name)}</span></div>`;
    }
    return `<div class="attach-preview-item">
      ${previewHtml}
      <button class="attach-preview-remove" data-remove-idx="${i}" title="${escapeHtml(t("attach.remove"))}">✕</button>
    </div>`;
  }).join("");

  // Обновляем заголовок
  const titleEl = document.getElementById("attach-preview-title");
  if (titleEl) {
    const firstKind = detectFileKind(attachPendingFiles[0]);
    if (firstKind === "image") titleEl.textContent = t("attach.title.image");
    else if (firstKind === "video") titleEl.textContent = t("attach.title.video");
    else titleEl.textContent = t("attach.title.file");
  }

  listEl.querySelectorAll("[data-remove-idx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.removeIdx, 10);
      if (isNaN(i)) return;
      attachPendingFiles.splice(i, 1);
      renderAttachPreview();
    });
  });
}

function setupAttachPreviewDialog() {
  const overlay = document.getElementById("attach-preview-overlay");
  const cancelBtn = document.getElementById("attach-preview-cancel");
  const sendBtn = document.getElementById("attach-preview-send");
  const addBtn = document.getElementById("attach-add-btn");
  const moreInput = document.getElementById("attach-more-input");
  const asFileCb = document.getElementById("attach-as-file");
  const captionEl = document.getElementById("attach-caption");
  if (!overlay) return;

  cancelBtn.addEventListener("click", () => {
    attachPendingFiles = [];
    overlay.classList.add("hidden");
    document.getElementById("attach-caption").value = "";
    document.getElementById("attach-as-file").checked = false;
    updateAttachAsFileIcon();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      attachPendingFiles = [];
      overlay.classList.add("hidden");
      document.getElementById("attach-caption").value = "";
      document.getElementById("attach-as-file").checked = false;
      updateAttachAsFileIcon();
    }
  });

  if (asFileCb) asFileCb.addEventListener("change", updateAttachAsFileIcon);

  if (captionEl) {
    captionEl.addEventListener("input", () => {
      captionEl.style.height = "auto";
      captionEl.style.height = Math.min(captionEl.scrollHeight, 120) + "px";
    });
  }

  if (addBtn && moreInput) {
    addBtn.addEventListener("click", () => moreInput.click());
    moreInput.addEventListener("change", (e) => {
      const files = [...e.target.files];
      e.target.value = "";
      if (!files.length) return;
      // Проверяем лимит и размер КАЖДОГО добавленного файла
      for (const f of files) {
        if (f.size > ATTACH_MAX_SIZE) {
          showAlertDialog(
            t("attach.tooBig"),
            tFmt("attach.tooBigText", { name: f.name, size: formatFileSize(ATTACH_MAX_SIZE) })
          );
          return;
        }
      }
      if (attachPendingFiles.length + files.length > ATTACH_MAX_FILES) {
        showAlertDialog(
          t("attach.tooMany"),
          tFmt("attach.tooManyText", { n: ATTACH_MAX_FILES })
        );
        return;
      }
      attachPendingFiles = attachPendingFiles.concat(files);
      renderAttachPreview();
    });
  }

  sendBtn.addEventListener("click", async () => {
    if (!attachPendingFiles.length) return;
    const files = [...attachPendingFiles];
    const caption = (document.getElementById("attach-caption").value || "").trim();
    const asFile = document.getElementById("attach-as-file").checked;

    attachPendingFiles = [];
    overlay.classList.add("hidden");
    document.getElementById("attach-caption").value = "";
    document.getElementById("attach-as-file").checked = false;
    updateAttachAsFileIcon();

    await handleAttachments(files, caption, asFile);
  });
}

// ======================================================
// 44.5. ВОССТАНОВЛЕНИЕ ПАРОЛЯ ПО ПОЧТЕ
// ======================================================

// ======================================================
// WEB PUSH — фоновые уведомления
// ======================================================
// VAPID-ключи. Публичный идёт в браузер — им подписываем запрос
// на push. Приватный лежит ТОЛЬКО в Supabase (env функции push-on-message).
const VAPID_PUBLIC_KEY = "BKu0OUTKndJyQgI4n_MOgLHgCP2aUqpi3tdLBaIpap_JugR2m7qbvbO5Kz_Z5AwgqPULYa9Fkr80OkZcQVEhE0A";

// base64url → Uint8Array. Нужно для pushManager.subscribe().
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

function isPushSupported() {
  return ("serviceWorker" in navigator) && ("PushManager" in window) && ("Notification" in window);
}

// Оформляем push-подписку и сохраняем её в БД.
// Возвращает { ok: true } или { ok: false, reason: "..." }.
async function subscribeToWebPush() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (!currentUser) return { ok: false, reason: "no-user" };
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: currentUser.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: (navigator.userAgent || "").slice(0, 200),
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });
    if (error) {
      console.warn("push_subscriptions upsert:", error);
      return { ok: false, reason: "db" };
    }
    return { ok: true };
  } catch (e) {
    console.warn("subscribeToWebPush failed:", e);
    return { ok: false, reason: (e && e.message) || "unknown" };
  }
}

// Отписываемся и удаляем подписку из БД.
async function unsubscribeFromWebPush() {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      try { await sub.unsubscribe(); } catch (e) {}
      if (currentUser) {
        await supabase.from("push_subscriptions")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("endpoint", endpoint);
      }
    }
  } catch (e) { /* silent */ }
}

// Сообщаем Service Worker'у, какой чат сейчас активен.
// SW не будет показывать push для этого чата, если окно в фокусе —
// клиент сам покажет in-app тост.
function notifySwActiveChat(chatId) {
  try {
    if (!("serviceWorker" in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({ type: "ACTIVE_CHAT", chatId: chatId || null });
    }
  } catch (e) { /* silent */ }
}

// ======================================================
// УВЕДОМЛЕНИЯ О НОВЫХ СООБЩЕНИЯХ
// ======================================================
// Хранится в localStorage: cell_notifications_enabled = "1" | "0".
// По умолчанию выключено — пользователь должен сам включить в настройках
// (иначе браузер будет ругаться на запрос разрешения без клика).
const NOTIFICATIONS_KEY = "cell_notifications_enabled";

function areNotificationsEnabled() {
  try { return localStorage.getItem(NOTIFICATIONS_KEY) === "1"; } catch (e) { return false; }
}

function setNotificationsEnabled(on) {
  try { localStorage.setItem(NOTIFICATIONS_KEY, on ? "1" : "0"); } catch (e) {}
}

// Просит у браузера разрешение. Возвращает true/false.
// НЕ вызывать без клика пользователя — браузер проигнорирует.
async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  } catch (e) {
    return false;
  }
}

// Показывает СИСТЕМНОЕ уведомление. Тихо игнорируется, если:
//  — выключено в настройках,
//  — браузер не поддерживает Notification API,
//  — вкладка/окно в фокусе (пользователь и так видит).
// opts: { body, tag, silent, icon, onClick }.
function showAppNotification(title, opts) {
  opts = opts || {};
  if (!areNotificationsEnabled()) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible" && document.hasFocus()) return;

  try {
    const iconUrl = opts.icon || "icon-192.png";
    const n = new Notification(title, {
      body: opts.body || "",
      tag: opts.tag || "cell-message",
      icon: iconUrl,
      badge: "icon-192.png",
      silent: !!opts.silent,
    });
    n.onclick = () => {
      try { window.focus(); n.close(); } catch (e) {}
      if (opts.onClick) { try { opts.onClick(); } catch (e) {} }
    };
    setTimeout(() => { try { n.close(); } catch (e) {} }, 8000);
  } catch (e) {
    console.warn("Notification failed:", e);
  }
}

// ======================================================
// ЗВУК УВЕДОМЛЕНИЯ
// ======================================================
// Короткий двухнотный «блип» через Web Audio API — без файлов.
// iOS/Android требуют, чтобы AudioContext был создан/разбужен
// после жеста пользователя (тап/клик) — иначе звук молчит.
let _notifAudioCtx = null;
let _notifAudioUnlocked = false;

function unlockNotificationAudio() {
  try {
    if (!_notifAudioCtx) {
      _notifAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_notifAudioCtx.state === "suspended") _notifAudioCtx.resume();
    _notifAudioUnlocked = true;
  } catch (e) { /* silent */ }
}

// Разблокируем звук при первом же клике/тапе в приложении.
document.addEventListener("pointerdown", unlockNotificationAudio, { once: true, passive: true });
document.addEventListener("keydown", unlockNotificationAudio, { once: true });

function playNotificationSound() {
  try {
    if (!_notifAudioCtx) {
      _notifAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_notifAudioCtx.state === "suspended") _notifAudioCtx.resume();

    const now = _notifAudioCtx.currentTime;
    const osc = _notifAudioCtx.createOscillator();
    const gain = _notifAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(_notifAudioCtx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);          // A5
    osc.frequency.setValueAtTime(1245, now + 0.09);   // D#6

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.10);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

    osc.start(now);
    osc.stop(now + 0.32);
  } catch (e) { /* silent */ }
}

// ======================================================
// IN-APP ТОСТЫ — кастомные уведомления внутри страницы
// ======================================================
// Показываются, когда приложение видно (в фокусе или просто на экране).
// Содержат аватарку, имя, текст. Клик — переход в чат.

function showInAppToast(opts) {
  opts = opts || {};
  const cont = document.getElementById("toast-container");
  if (!cont) return;

  // Не плодим одинаковые тосты для одного и того же чата —
  // старый того же tag удаляем перед добавлением нового.
  if (opts.tag) {
    cont.querySelectorAll(`.toast[data-tag="${opts.tag}"]`).forEach((el) => el.remove());
  }

  const el = document.createElement("div");
  el.className = "toast";
  if (opts.tag) el.dataset.tag = opts.tag;

  const av = document.createElement("div");
  av.className = "avatar";
  el.appendChild(av);

  const body = document.createElement("div");
  body.className = "toast-body";
  const titleEl = document.createElement("div");
  titleEl.className = "toast-title";
  titleEl.textContent = opts.title || "";
  const textEl = document.createElement("div");
  textEl.className = "toast-text";
  textEl.textContent = opts.body || "";
  body.appendChild(titleEl);
  body.appendChild(textEl);
  el.appendChild(body);

  // Аватар — через общий paintAvatar (понимает data:, color:, seed)
  const userObj = opts.profile || { display_name: opts.title || "?", avatar_url: opts.avatar_url };
  paintAvatar(av, userObj);

  el.addEventListener("click", () => {
    closeInAppToast(el);
    if (opts.onClick) { try { opts.onClick(); } catch (e) {} }
  });

  cont.appendChild(el);
  // Авто-закрытие через 6 секунд
  setTimeout(() => closeInAppToast(el), 6000);
}

function closeInAppToast(el) {
  if (!el || !el.parentNode) return;
  el.style.opacity = "0";
  el.style.transform = "translateX(28px)";
  setTimeout(() => { try { el.remove(); } catch (e) {} }, 220);
}

// Кэш dataURL-иконок для СИСТЕМНЫХ уведомлений (рисуем аватар в canvas).
const _notifIconCache = new Map();

async function getNotificationIcon(profile) {
  if (!profile) return "icon-192.png";
  if (_notifIconCache.has(profile.id)) return _notifIconCache.get(profile.id);

  let iconUrl = "icon-192.png";
  const av = profile.avatar_url;

  // Загруженная картинка — используем как есть
  if (av && typeof av === "string" && av.startsWith("data:")) {
    iconUrl = av;
  } else {
    // Цветной (color:N) или seed-аватар — рисуем canvas 128×128
    try {
      let c1, c2;
      if (av && av.startsWith("color:")) {
        const idx = parseInt(av.split(":")[1], 10) || 0;
        [c1, c2] = BASE_AVATARS[idx % BASE_AVATARS.length];
      } else {
        const seed = profile.id || profile.username || "anon";
        const idx = hashCode(seed) % BASE_AVATARS.length;
        [c1, c2] = BASE_AVATARS[idx];
      }
      const canvas = document.createElement("canvas");
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 128, 128);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#15110d";
      ctx.font = "bold 60px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(firstChar(profile.display_name || "?"), 64, 68);
      iconUrl = canvas.toDataURL("image/png");
    } catch (e) { /* silent */ }
  }

  _notifIconCache.set(profile.id, iconUrl);
  return iconUrl;
}

// ======================================================
// ЛОКАЛЬНЫЙ ВХОД (anonymous sign-in)
// ======================================================
// Аккаунт создаётся в Supabase как обычный пользователь (auth.uid()
// есть, RLS работает, чаты/сообщения/подарки — всё как у всех),
// но без email и пароля. Войти можно ТОЛЬКО с этого устройства:
// refresh-токен хранится в localStorage.
//
// При выходе мы НЕ отзываем refresh-токен на сервере (scope: "local"),
// а откладываем его в отдельный ключ cell_local_session. При следующем
// «Войти локально» — восстанавливаем сессию через setSession(),
// и все данные на месте.
const LOCAL_SESSION_KEY = "cell_local_session";

async function localLogin() {
  // 1. Пробуем восстановить сохранённую сессию (если был logout)
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && saved.access_token && saved.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: saved.access_token,
          refresh_token: saved.refresh_token,
        });
        if (!error && data && data.session) {
          // Успех — возвращаемся в свой аккаунт
          showApp(data.session.user);
          return;
        }
        // Ошибка сети/времени — токен НЕ чистим, пусть попробует в следующий раз
        if (error && /network|fetch|timeout/i.test(String(error.message || ""))) {
          await showAlertDialog(t("auth.localLoginErr"), String(error.message || ""));
          return;
        }
      }
      // Токены реально отвергнуты сервером (истёк/отозван) — чистим и создаём новый
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch (e) { /* silent */ }

  // 2. Первый вход — создаём анонимный аккаунт в Supabase
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    const msg = String(error.message || "");
    if (/anonymous/i.test(msg) && /disabled|not.*enabled/i.test(msg)) {
      await showAlertDialog(t("auth.err.prefix"), t("auth.localLoginDisabled"));
    } else {
      await showAlertDialog(t("auth.localLoginErr"), msg);
    }
    return;
  }

  // 3. На всякий случай проверяем, что для нового юзера создан профиль.
  //    Обычный триггер on_auth_user_created может пропускать анонимных
  //    пользователей (нет email).
  let isFreshProfile = false;
  try {
    const { data: prof } = await supabase.from("profiles")
      .select("id").eq("id", data.user.id).maybeSingle();
    if (!prof) {
      isFreshProfile = true;
      const rnd = Math.random().toString(36).slice(2, 10);
      await supabase.from("profiles").insert({
        id: data.user.id,
        username: "local_" + rnd,
        display_name: "Локальный",
      });
    }
  } catch (e) { console.warn("local profile bootstrap:", e); }

  // 4. Только что создали аккаунт — сразу дадим пользователю выбрать имя,
  //    юзернейм и аватар. При повторном входе диалог не показываем.
  if (isFreshProfile) {
    await openLocalSetupDialog(data.user.id);
  }

  showApp(data.user);
}

function setupLocalLogin() {
  const btn = document.getElementById("local-login-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try { await localLogin(); }
    finally { btn.disabled = false; }
  });
}

// Показывает диалог первичной настройки локального аккаунта.
// Возвращает Promise<boolean>: true — сохранено, false — не удалось.
function openLocalSetupDialog(userId) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("local-setup-overlay");
    const nameInput = document.getElementById("local-setup-name");
    const unameInput = document.getElementById("local-setup-username");
    const hint = document.getElementById("local-setup-username-hint");
    const saveBtn = document.getElementById("local-setup-save");
    if (!overlay) { resolve(false); return; }

    // Дефолт: имя пустое, юзернейм — сгенерированный local_xxxx
    let avatarUrl = "color:0";
    nameInput.value = "";
    unameInput.value = "local_" + Math.random().toString(36).slice(2, 8);
    hint.className = "username-hint";
    hint.textContent = "";

    // Сетка аватаров — та же логика, что в настройках профиля
    const grid = document.getElementById("local-setup-avatar-grid");
    const preview = document.getElementById("local-setup-avatar-preview");
    function renderGrid() {
      const letter = firstChar(nameInput.value || "?");
      grid.innerHTML = "";
      BASE_AVATARS.forEach((pair, idx) => {
        const el = document.createElement("div");
        el.className = "avatar-option";
        el.dataset.idx = idx;
        el.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
        el.textContent = letter;
        if (avatarUrl === "color:" + idx) el.classList.add("selected");
        el.addEventListener("click", () => {
          avatarUrl = "color:" + idx;
          paintAvatar(preview, { display_name: nameInput.value || "?", avatar_url: avatarUrl });
          renderGrid();
        });
        grid.appendChild(el);
      });
      paintAvatar(preview, { display_name: nameInput.value || "?", avatar_url: avatarUrl });
    }
    renderGrid();
    nameInput.oninput = renderGrid;

    // Проверка юзернейма на занятость (живая, как в обычном профиле)
    let unameCheckTimer = null;
    let unameValidated = unameInput.value;
    unameInput.oninput = () => {
      clearTimeout(unameCheckTimer);
      unameValidated = null;
      const value = unameInput.value.trim();
      hint.className = "username-hint";
      hint.textContent = t("username.checking");

      unameCheckTimer = setTimeout(async () => {
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          hint.className = "username-hint err";
          hint.textContent = t("localSetup.err.usernameFormat");
          return;
        }
        if (value.length < 3) {
          hint.className = "username-hint err";
          hint.textContent = t("username.tooShort");
          return;
        }
        // Резерв (RPC is_username_reserved)
        try {
          const { data: reserved } = await supabase.rpc("is_username_reserved", { p_username: value });
          if (reserved) {
            hint.className = "username-hint err";
            hint.textContent = tFmt("username.reserved", { username: value });
            return;
          }
        } catch (e) { /* silent */ }
        // Занят?
        const { data } = await supabase.from("profiles")
          .select("id").ilike("username", value).neq("id", userId).limit(1);
        if (data && data.length) {
          hint.className = "username-hint err";
          hint.textContent = tFmt("username.taken", { username: value });
        } else {
          hint.className = "username-hint ok";
          hint.textContent = tFmt("username.free", { username: value });
          unameValidated = value;
        }
      }, 350);
    };
    // Стартовая проверка сгенерированного
    unameInput.dispatchEvent(new Event("input"));

    saveBtn.disabled = false;
    saveBtn.onclick = async () => {
      const name = nameInput.value.trim();
      const uname = unameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      if (!uname || uname !== unameValidated) { unameInput.focus(); return; }

      saveBtn.disabled = true;
      const { error } = await supabase.from("profiles").update({
        display_name: name,
        username: uname,
        avatar_url: avatarUrl,
      }).eq("id", userId);
      if (error) {
        await showAlertDialog(t("auth.err.prefix"), error.message);
        saveBtn.disabled = false;
        return;
      }
      overlay.classList.add("hidden");
      resolve(true);
    };

    overlay.classList.remove("hidden");
    setTimeout(() => nameInput.focus(), 80);
  });
}

function setupPasswordReset() {
  const forgotBtn = document.getElementById("forgot-password-btn");
  const reqOverlay = document.getElementById("reset-request-overlay");
  const reqEmail = document.getElementById("reset-email");
  const reqSubmit = document.getElementById("reset-request-submit");
  const reqCancel = document.getElementById("reset-request-cancel");
  const reqErr = document.getElementById("reset-request-error");

  const newOverlay = document.getElementById("reset-new-overlay");
  const newPw = document.getElementById("reset-new-password");
  const newPw2 = document.getElementById("reset-new-password2");
  const newSubmit = document.getElementById("reset-new-submit");
  const newCancel = document.getElementById("reset-new-cancel");
  const newErr = document.getElementById("reset-new-error");

  if (forgotBtn && reqOverlay) {
    forgotBtn.addEventListener("click", () => {
      reqErr.textContent = "";
      // Подставляем email из формы входа, если он уже введён
      const loginEmail = document.getElementById("login-email");
      reqEmail.value = loginEmail ? loginEmail.value.trim() : "";
      reqOverlay.classList.remove("hidden");
      setTimeout(() => reqEmail.focus(), 60);
    });
  }

  if (reqCancel) reqCancel.addEventListener("click", () => reqOverlay.classList.add("hidden"));

  if (reqSubmit) {
    reqSubmit.addEventListener("click", async () => {
      const email = reqEmail.value.trim();
      reqErr.textContent = "";
      if (!email) { reqErr.textContent = t("auth.err.email.required"); return; }
      reqSubmit.disabled = true;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://lu4shiy.github.io/Cell/",
      });
      reqSubmit.disabled = false;
      if (error) { reqErr.textContent = error.message || t("auth.reset.err"); return; }
      reqOverlay.classList.add("hidden");
      await showAlertDialog(t("auth.reset.title"), t("auth.reset.sent"));
    });
  }

  if (newCancel) {
    newCancel.addEventListener("click", async () => {
      try { await supabase.auth.signOut(); } catch (e) {}
      inRecoveryFlow = false;
      newOverlay.classList.add("hidden");
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}
      showAuth();
    });
  }

  if (newSubmit) {
    newSubmit.addEventListener("click", async () => {
      const p1 = newPw.value;
      const p2 = newPw2.value;
      newErr.textContent = "";
      if (!p1 || p1.length < 10) { newErr.textContent = t("auth.err.password.short"); return; }
      if (!/[A-ZА-Я]/.test(p1) || !/[a-zа-я]/.test(p1) || !/\d/.test(p1)) {
        newErr.textContent = t("auth.err.password.complex");
        return;
      }
      if (p1 !== p2) { newErr.textContent = t("auth.reset.mismatch"); return; }

      newSubmit.disabled = true;
      const { error } = await supabase.auth.updateUser({ password: p1 });
      newSubmit.disabled = false;
      if (error) {
        const msg = String(error.message || "");
        if (/different from the old password/i.test(msg)) {
          newErr.textContent = t("auth.reset.sameAsOld");
        } else {
          newErr.textContent = msg || t("auth.reset.saveErr");
        }
        return;
      }

      newOverlay.classList.add("hidden");
      inRecoveryFlow = false;
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}

      // Разлогиниваем — пусть войдёт с новым паролем (чистый сценарий).
      try { await supabase.auth.signOut(); } catch (e) {}
      showAuth();
      await showAlertDialog(t("auth.reset.newTitle"), t("auth.reset.saved"));
    });
  }
}

// ======================================================
// 45. АВТОЗАПУСК (в самом конце — чтобы все переменные,
// включая scrollMode и SCROLL_MODE_KEY, уже были объявлены)
// ======================================================

// ⚠️ ВАЖНО: обработчики 2FA навешиваем ДО первого входа.
// Раньше они вешались только в initApp(), а он вызывался после showApp() —
// т.е. при первой попытке входа с 2FA кнопки на экране были «мёртвые».
setupMfaUI();
setupPasswordReset();
setupLocalLogin();

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // Возврат по ссылке восстановления — сразу показываем форму нового пароля,
    // минуя showApp() (иначе на фоне мелькнут чаты).
    if (inRecoveryFlow) {
      const appEl = document.getElementById("app-screen");
      const authEl = document.getElementById("auth-screen");
      if (appEl) appEl.classList.add("hidden");
      if (authEl) authEl.classList.remove("hidden");
      const overlay = document.getElementById("reset-new-overlay");
      if (overlay) overlay.classList.remove("hidden");
      return;
    }
    showApp(session.user);
    // Если в URL есть #open-chat=<id> (клик по push-уведомлению на закрытом
    // приложении) — открываем нужный чат после загрузки.
    handleOpenChatHash();
  }
})();
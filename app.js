// ======================================================
// Imaginer
// ======================================================

const SUPABASE_URL = "https://uiktqkxfsoewjpgjpizf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3Rxa3hmc29ld2pwZ2pwaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODY5MjksImV4cCI6MjEwNDg2MjkyOX0.2OC3vrfusHK6Lqv1Yh5KfZ42Ypm02sE1XAloTSUxo2k";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    storageKey: "imaginer-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

const ACCENTS = ["orange", "blue", "green", "red", "purple", "pink", "teal", "gray"];
const ACCENT_COLORS = { orange:"#ff8c42",blue:"#2196f3",green:"#4caf50",red:"#f44336",purple:"#9c27b0",pink:"#e91e63",teal:"#009688",gray:"#607d8b" };
const BASE_AVATARS = [["#ff8c42","#ffb37a"],["#2196f3","#64b5f6"],["#4caf50","#81c784"],["#f44336","#ef9a9a"],["#9c27b0","#ce93d8"],["#e91e63","#f48fb1"],["#009688","#4db6ac"],["#607d8b","#90a4ae"]];
const REACTION_EMOJIS = ["👍","👎","❤️","🤣","🤮","🤯","🤬","😡","🎉","😅"];

// ---- Иконки Cell ----
const ICONS = {
  plus:        "https://i.ibb.co/vxd50Lys/icons8-1500.png",
  search:      "https://i.ibb.co/6zRygtc/icons8-1500.png",
  arrowRight:  "https://i.ibb.co/sJ5cRDq5/icons8-100.png",
  arrowUp:     "https://i.ibb.co/4RQ8CxV6/icons8-arrow-up-100.png",
  arrowDown:   "https://i.ibb.co/hx2WcJm1/icons8-100.png",
  miniRight:   "https://i.ibb.co/YFYkyF74/icons8-100.png",
  miniLeft:    "https://i.ibb.co/MxBsK2rf/icons8-100.png",
  arrowLeft:   "https://i.ibb.co/93dShvBP/icons8-100.png",
  undo:        "https://i.ibb.co/W4JjxNdk/icons8-100.png",
  redo:        "https://i.ibb.co/7JkncpWz/icons8-100.png",
  checkboxOff: "https://i.ibb.co/Q7GpR0tj/icons8-unchecked-checkbox-100.png",
  checkboxOn:  "https://i.ibb.co/Xx1gZN2H/icons8-checked-checkbox-100.png",
  upload:      "https://i.ibb.co/pvyKyg4v/icons8-upload-100.png",
  findFile:    "https://i.ibb.co/8L9MNx03/icons8-view-100.png",
  addFile:     "https://i.ibb.co/whVjBfR3/icons8-add-file-100.png",
  addLink:     "https://i.ibb.co/4ZtzJ06c/icons8-add-link-100.png",
  email:       "https://i.ibb.co/ns3L6RZX/icons8-at-sign-100.png",
  calendar:    "https://i.ibb.co/dZjkzXz/icons8-calendar-100.png",
  logout:      "https://i.ibb.co/gbTLc2jJ/icons8-change-user-100.png",
  deleteLink:  "https://i.ibb.co/0y0fG5n2/icons8-delete-link-100.png",
  download:    "https://i.ibb.co/fzzrdz3V/icons8-download-100.png",
  error:       "https://i.ibb.co/GvBQMp9G/icons8-error-sign-100.png",
  features:    "https://i.ibb.co/C5FZd4mj/icons8-features-list-100.png",
  gear:        "https://i.ibb.co/CsBkQMQv/icons8-gear-100.png",
  info:        "https://i.ibb.co/nqcVPKHp/icons8-info-popup-100.png",
  language:    "https://i.ibb.co/5Xr3V3Kv/icons8-language-100.png",
  link:        "https://i.ibb.co/XrqrrXm9/icons8-link-100.png",
  save:        "https://i.ibb.co/Lh0mHcsY/icons8-save-100.png",
  saveAs:      "https://i.ibb.co/MkZN03VX/icons8-save-as-100.png",
  switchOff:   "https://i.ibb.co/0jsYMd1s/icons8-switch-off-100.png",
  switchOn:    "https://i.ibb.co/MDfhc887/icons8-switch-on-100.png",
};

// ======================================================
// РЕЖИМ СПИСКА ЧАТОВ — объявлено ДО initApp, иначе TDZ
// ======================================================
const SCROLL_MODE_KEY = "cell_scroll_mode";
let scrollMode = "classic"; // "classic" | "wheel"
try {
  const savedMode = localStorage.getItem(SCROLL_MODE_KEY);
  if (savedMode === "classic" || savedMode === "wheel") scrollMode = savedMode;
} catch (e) { /* silent */ }
document.documentElement.dataset.scrollMode = scrollMode;

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
  if (!username) { errEl.textContent = "Введите юзернейм"; return; }
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) { errEl.textContent = "Юзернейм: 3-32 символа, a-z, 0-9, _ и -"; return; }
  if (!displayName) { errEl.textContent = "Введите имя"; return; }
  if (!email) { errEl.textContent = "Введите email"; return; }
  if (!password || password.length < 6) { errEl.textContent = "Пароль минимум 6 символов"; return; }
  errEl.style.color = "var(--accent)"; errEl.textContent = "Регистрирую...";
  try {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username, display_name: displayName } } });
    if (error) { errEl.style.color = ""; errEl.textContent = error.message || "Ошибка"; return; }
    if (data.session) showApp(data.session.user);
    else { errEl.style.color = "var(--accent)"; errEl.textContent = "Проверь почту и подтверди email."; }
  } catch (ex) { errEl.style.color = ""; errEl.textContent = "Ошибка: " + (ex.message || ex); }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("login-error"); errEl.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = error.message; return; }
  showApp(data.user);
});

document.getElementById("logout-btn").addEventListener("click", async () => { await supabase.auth.signOut(); showAuth(); });

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
// Заморозка авто-переключения закрепа при jump (мс)
let pinBarFrozenUntil = 0;
// Типы каналов + заявки
let channelCreateVisibility = "public";
let channelEditVisibility = "public";
let currentChannelHasRequest = false;
let channelRequestsChannel = null;
// Возврат из профиля в окно подарка
let profileFromGiftContext = null;     // { userId, ugId } — куда возвращаться
let currentGiftDetailUserId = null;    // ownerId подарка, открытого в деталях
let currentGiftDetailUgId = null;      // ug.id подарка, открытого в деталях

// ======================= 3. АКЦЕНТ / АВАТАРЫ =======================
function applyAccent(accent) { document.documentElement.setAttribute("data-accent", accent || "orange"); }
function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function paintAvatar(el, user) {
  if (!el) return;
  const av = user && user.avatar_url;
  if (av && av.startsWith("data:")) { el.style.background = `url(${av}) center/cover`; el.textContent = ""; return; }
  if (av && av.startsWith("color:")) {
    const idx = parseInt(av.split(":")[1], 10) || 0;
    const [c1, c2] = BASE_AVATARS[idx % BASE_AVATARS.length];
    el.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
    el.textContent = ((user.display_name || "?")[0] || "?").toUpperCase(); return;
  }
  const seed = user && user.id ? user.id : (user && user.username) || "anon";
  const idx = hashCode(seed) % BASE_AVATARS.length;
  const [c1, c2] = BASE_AVATARS[idx];
  el.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  el.textContent = ((user && user.display_name || "?")[0] || "?").toUpperCase();
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
  document.getElementById("section-title").textContent = "Чаты";
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
}

function showAuth() {
  resetAppState();
  currentUser = null; myProfile = null;
  currentChatId = null; currentOtherUser = null; pendingOtherUser = null;
  myBlockedIds = new Set(); blockedMeIds = new Set();
  hiddenMsgIds = new Set(); msgCache.clear(); reactionsCache.clear();
  chatReads.clear(); chatLastMsg.clear(); chatIdByUser.clear();
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
  applyAccent("orange");
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

// ======================= 5. ИНИЦИАЛИЗАЦИЯ =======================
async function initApp() {
  setupSearch(); setupChatMenu(); setupMessageMenu(); setupSelectionToolbar();
  setupAttachments(); setupMediaViewer(); setupEmojiPicker(); setupAboutDialog();
  setupWheel(); setupCommandPalette(); setupMiniProfile(); setupDateFloat();
  setupSettings(); applyScrollMode();
  setupChatSearch(); setupScrollBottomButton();
  setupChatPins(); setupInviteUI();
  subscribeToPins();
  subscribeToChannelRequests();
  setupForwardDialog(); setupReplyBar(); setupProfilePanel(); setupGiftsUI();
  setupBirthdayClose(); setupTokensDialog(); setupChannelCreate(); setupChannelEdit();
  supabase.from("profiles").select("id").limit(1).then(() => {});
  subscribeToBlocks(); subscribeToGlobalChanges(); subscribeToProfiles();
  subscribeToMemberships(); subscribeToReads(); subscribeToGlobalMessages();
  await Promise.all([loadMyProfile(), loadBlocks(), loadChatReads()]);
  await loadRecentChats();

  // Отметить все входящие как доставленные
  try { await supabase.rpc("mark_all_delivered"); } catch (e) {}
  deliveredInterval = setInterval(async () => {
    try { await supabase.rpc("mark_all_delivered"); } catch (e) {}
  }, 30000);

  // Обновлять мой last_seen
  await updateMyLastSeen();
  // Пингуем всегда, вне зависимости от видимости — иначе статус в другом окне не обновляется
  lastSeenInterval = setInterval(updateMyLastSeen, 8000);
  document.addEventListener("mousemove", updateMyLastSeen, { passive: true });
  document.addEventListener("keydown", updateMyLastSeen);
  document.addEventListener("click", updateMyLastSeen);

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
  // (например, при одобрении заявки владельцем канала)
  setInterval(pollMemberships, 4000);
  setTimeout(pollMemberships, 1000);
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
    .select("id, username, display_name, avatar_url, accent_color, gender, last_seen, birthday, created_at, imagi_tokens")
    .eq("id", currentUser.id).single();
  if (error) { console.error(error); return; }
  myProfile = data; profileCache.set(currentUser.id, data);
  applyAccent(data.accent_color || "orange");
  paintAvatar(document.getElementById("me-avatar"), data);
  document.getElementById("me-name").textContent = data.display_name;
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
    .select("id, username, display_name, avatar_url, accent_color, last_seen, gender, created_at, birthday")
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
    confirmBtn.textContent = "ОК"; confirmBtn.disabled = false;
    optionsEl.innerHTML = ""; cancelBtn.style.display = "none";
    overlay.classList.remove("hidden");
    function cleanup() { overlay.classList.add("hidden"); confirmBtn.onclick = null; cancelBtn.onclick = null; cancelBtn.style.display = ""; }
    confirmBtn.onclick = () => { cleanup(); resolve(true); };
  });
}

function showConfirmDialog(title, text, confirmLabel) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const optionsEl = document.getElementById("dialog-options");
    const confirmBtn = document.getElementById("dialog-confirm");
    const cancelBtn = document.getElementById("dialog-cancel");
    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-text").textContent = text || "";
    confirmBtn.textContent = confirmLabel || "Да"; confirmBtn.disabled = false;
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
    confirmBtn.textContent = confirmLabel || "Подтвердить";
    confirmBtn.disabled = true;
    cancelBtn.style.display = "";
    optionsEl.innerHTML = "";
    optionsEl.style.flexDirection = "column";

    const searchable = !!opts.searchable;
    const searchPlaceholder = opts.searchPlaceholder || "Поиск...";
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
    draftProfile.display_name = e.target.value.trim(); markProfileDirty();
  });
  document.getElementById("gender-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-gender]"); if (!btn) return;
    draftProfile.gender = btn.dataset.gender; myProfile.gender = btn.dataset.gender;
    updateGenderButtons(); markProfileDirty();
  });
  document.getElementById("profile-birthday").addEventListener("input", (e) => {
    draftProfile.birthday = e.target.value.trim() || null; markProfileDirty();
  });

  setupBirthdayCalendar();
  document.getElementById("profile-apply").addEventListener("click", applyProfileChanges);
  document.getElementById("profile-gifts-btn").addEventListener("click", () => openGiftsOverlay(currentUser.id));
}

function markProfileDirty() { const btn = document.getElementById("profile-apply"); if (btn) btn.disabled = false; }

async function applyProfileChanges() {
  const unameInput = document.getElementById("profile-username");
  const unameVal = unameInput.value.trim();
  if (unameVal && unameVal !== myProfile.username && unameVal !== validatedUsername) {
    const hint = document.getElementById("username-hint");
    hint.className = "username-hint err"; hint.textContent = "Проверьте юзернейм"; return;
  }
  if (draftProfile.birthday) {
    const normalized = normalizeBirthday(draftProfile.birthday);
    if (!normalized) {
      await showAlertDialog("Ошибка", "Дата рождения в формате ДД.ММ или ДД.ММ.ГГГГ");
      return;
    }
    draftProfile.birthday = normalized; // сохраняем нормализованную
  }
  if (unameVal && unameVal !== myProfile.username) {
    const { error } = await supabase.from("profiles").update({ username: unameVal }).eq("id", currentUser.id);
    if (error) { await showAlertDialog("Ошибка", "Не удалось сохранить юзернейм"); return; }
    myProfile.username = unameVal; document.getElementById("me-username").textContent = "@" + unameVal;
  }
  const payload = {};
  if (draftProfile.display_name) payload.display_name = draftProfile.display_name;
  if (draftProfile.gender !== undefined) payload.gender = draftProfile.gender;
  if (draftProfile.birthday !== undefined) payload.birthday = draftProfile.birthday;
  if (Object.keys(payload).length) {
    const { error } = await supabase.from("profiles").update(payload).eq("id", currentUser.id);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    Object.assign(myProfile, payload);
    if (payload.display_name) document.getElementById("me-name").textContent = payload.display_name;
    if (currentOtherUser) renderChatSubtitle();
  }
  draftProfile = {};
  document.getElementById("profile-apply").disabled = true;
  const hint = document.getElementById("username-hint");
  hint.className = "username-hint ok"; hint.textContent = "Сохранено";
}

async function openProfilePanel() {
  if (!myProfile) return;
  document.getElementById("profile-overlay").classList.remove("hidden");
  paintAvatar(document.getElementById("profile-avatar-preview"), myProfile);
  renderAvatarGrid();
  document.getElementById("profile-displayname").value = myProfile.display_name || "";
  document.getElementById("profile-birthday").value = myProfile.birthday || "";
  updateGenderButtons();
  const ui = document.getElementById("profile-username");
  ui.value = myProfile.username; validatedUsername = myProfile.username;
  const hint = document.getElementById("username-hint"); hint.className = "username-hint"; hint.textContent = "";
  draftProfile = {}; document.getElementById("profile-apply").disabled = true;
  await refreshMyGiftsCount();
}

function renderAvatarGrid() {
  const grid = document.getElementById("avatar-grid"); grid.innerHTML = "";
  BASE_AVATARS.forEach((pair, idx) => {
    const el = document.createElement("div");
    el.className = "avatar-option"; el.dataset.idx = idx;
    el.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    el.textContent = ((myProfile.display_name || "?")[0] || "?").toUpperCase();
    if (myProfile.avatar_url === "color:" + idx) el.classList.add("selected");
    el.addEventListener("click", async () => {
      const url = "color:" + idx;
      myProfile.avatar_url = url;
      paintAvatar(document.getElementById("profile-avatar-preview"), myProfile);
      paintAvatar(document.getElementById("me-avatar"), myProfile);
      renderAvatarGrid();
      await saveProfileField({ avatar_url: url });
    });
    grid.appendChild(el);
  });
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

async function handleAvatarUpload(e) {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  const dataUrl = await resizeImage(file, 200); if (!dataUrl) return;
  myProfile.avatar_url = dataUrl;
  paintAvatar(document.getElementById("profile-avatar-preview"), myProfile);
  paintAvatar(document.getElementById("me-avatar"), myProfile);
  renderAvatarGrid();
  await saveProfileField({ avatar_url: dataUrl });
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

async function checkUsernameLive(value) {
  const hint = document.getElementById("username-hint");
  const username = value.trim(); validatedUsername = null;
  if (!username) { hint.className = "username-hint"; hint.textContent = ""; return; }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) { hint.className = "username-hint err"; hint.textContent = "Только английские буквы, цифры, _ и -"; return; }
  if (username.length < 3) { hint.className = "username-hint err"; hint.textContent = "Минимум 3 символа"; return; }
  if (myProfile && username.toLowerCase() === myProfile.username.toLowerCase()) {
    hint.className = "username-hint ok"; hint.textContent = "Это ваш текущий юзернейм"; validatedUsername = username; return;
  }
  hint.className = "username-hint"; hint.textContent = "Проверяю...";
  const { data, error } = await supabase.from("profiles").select("id").ilike("username", username).neq("id", currentUser.id).limit(1);
  if (document.getElementById("profile-username").value.trim() !== username) return;
  if (error) { hint.className = "username-hint err"; hint.textContent = "Ошибка проверки"; return; }
  if (data && data.length > 0) { hint.className = "username-hint err"; hint.textContent = `@${username} уже занят`; validatedUsername = null; }
  else { hint.className = "username-hint ok"; hint.textContent = `@${username} свободен`; validatedUsername = username; }
}

// ======================= 8. ПРОФИЛЬ СОБЕСЕДНИКА =======================
async function openUserProfileDialog(userOverride) {
  const user = userOverride || currentOtherUser || pendingOtherUser;
  if (!user) return;
  const overlay = document.getElementById("user-profile-overlay");

  // Стрелка «назад» видна только если мы пришли из окна подарка
  const backBtn = document.getElementById("user-profile-back");
  if (backBtn) backBtn.classList.toggle("hidden", !profileFromGiftContext);
  const { data: freshProfile } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, created_at, last_seen, gender, birthday")
    .eq("id", user.id).single();
  const p = freshProfile || user;
  profileCache.set(user.id, { ...profileCache.get(user.id), ...p });
  paintAvatar(document.getElementById("user-profile-avatar"), p);
  document.getElementById("user-profile-name").textContent = p.display_name || "—";
  const statusEl = document.getElementById("user-profile-status");
  statusEl.textContent = formatLastSeen(p);
  statusEl.classList.toggle("online", isUserOnline(p));
  document.getElementById("user-profile-username").textContent = "@" + (p.username || "");
  const bdStr = formatBirthday(p.birthday);
  const todayMD = (new Date().getMonth() + 1) * 100 + new Date().getDate();
  const bdMD = parseBirthdayMD(p.birthday);
  const isBd = bdMD && bdMD === todayMD;
  document.getElementById("user-profile-birthday").innerHTML = escapeHtml(bdStr) + (isBd && bdStr !== "—" ? '<span class="bd-party">🎉</span>' : "");
  document.getElementById("user-profile-created").textContent = p.created_at ? new Date(p.created_at).toLocaleDateString("ru-RU") : "—";
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
  if (error) { await showAlertDialog("Ошибка", "Не удалось: " + error.message); return; }
  await loadBlocks();
}
async function unblockUser(userId) {
  const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", currentUser.id).eq("blocked_id", userId);
  if (error) { await showAlertDialog("Ошибка", "Не удалось: " + error.message); return; }
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
      chatLastMsg.set(m.chat_id, {
        text: m.message_type === "tokens" ? `🧩 +${m.tokens_amount}`
             : m.message_type === "gift" ? "🎁 Подарок"
             : m.message_type === "attachment" ? (m.file_kind === "image" ? "📷 Фото" : m.file_kind === "video" ? "🎥 Видео" : "📎 Файл")
             : (m.content || ""),
        time, senderId: m.sender_id,
        unread: isMine ? (prev.unread || 0) : (prev.unread || 0) + 1,
      });
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
    }).subscribe();
}

function updateUserEverywhere(profile) {
  const itemEl = document.querySelector(`.user-item[data-user-id="${profile.id}"]`);
  if (itemEl) {
    paintAvatar(itemEl.querySelector(".avatar"), profile);
    const nameEl = itemEl.querySelector(".user-item-name");
    if (nameEl) {
      const custom = itemEl.dataset.customName;
      nameEl.textContent = (custom || profile.display_name) + (isBlockedByMe(profile.id) ? " 🚫" : "");
    }
  }
  if (currentOtherUser && currentOtherUser.id === profile.id) {
    Object.assign(currentOtherUser, profile);
    paintAvatar(document.getElementById("chat-avatar"), currentOtherUser);
    const custom = document.querySelector(`.user-item[data-user-id="${profile.id}"]`)?.dataset.customName;
    document.getElementById("chat-title").textContent = custom || profile.display_name;
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
        document.getElementById("me-name").textContent = p.display_name;
        document.getElementById("me-username").textContent = "@" + p.username;
      }
      updateUserEverywhere(p);
      if (currentOtherUser && currentOtherUser.id === p.id) renderChatSubtitle();
      const i = cachedProfilesForBirthday.findIndex((x) => x.id === p.id);
      if (i !== -1) cachedProfilesForBirthday[i] = { ...cachedProfilesForBirthday[i], ...p };
      renderBirthdayBanner();
    }).subscribe();
}

// ======================= 10. СПИСОК ЧАТОВ =======================
async function loadRecentChats() {
  const listEl = document.getElementById("users-list");
  document.getElementById("section-title").textContent = "Чаты";
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';

  const { data: myChats, error: e1 } = await supabase.from("chat_members").select("chat_id, custom_name").eq("user_id", currentUser.id);
  if (e1 || !myChats || myChats.length === 0) {
    listEl.innerHTML = '<div class="empty">У вас пока нет чатов.<br>Введи @username выше, чтобы найти человека.</div>';
    chatIdByUser.clear(); return;
  }
  const chatIds = myChats.map((c) => c.chat_id);

  // Каналы среди моих chat_id
  const { data: channelsData } = await supabase.from("channels").select("*").in("id", chatIds);
  channelCache = new Map((channelsData || []).map((c) => [c.id, c]));
  const channelIds = new Set(channelCache.keys());

  const [msgsRes, othersRes, readsRes, hidesRes] = await Promise.all([
    supabase.from("messages").select("id, chat_id, sender_id, content, created_at, message_type, tokens_amount, delivered_at, read_at")
      .in("chat_id", chatIds).order("created_at", { ascending: false }).limit(1000),
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
  myChats.forEach((c) => { if (c.custom_name) customNameByChatId.set(c.chat_id, c.custom_name); });

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
    });
  });

  if (!dmItems.length && !channelItems.length) {
    listEl.innerHTML = '<div class="empty">У вас пока нет чатов.<br>Введи @username выше, чтобы найти человека.</div>';
    chatIdByUser.clear(); return;
  }

  const uniqueUserIds = [...new Set(userIds)];
  let profilesData = [];
  if (uniqueUserIds.length) {
    const { data } = await supabase.from("profiles")
      .select("id, username, display_name, avatar_url, last_seen, gender, birthday").in("id", uniqueUserIds);
    profilesData = data || [];
    profilesData.forEach((p) => profileCache.set(p.id, p));
  }
  const profileMap = new Map(profilesData.map((p) => [p.id, p]));

  chatIdByUser.clear();
  dmItems.forEach((it) => {
    chatIdByUser.set(it.user_id, it.chat_id);
    const preview = it.lastMsg
      ? (it.lastMsg.message_type === "tokens" ? `🧩 +${it.lastMsg.tokens_amount}`
        : it.lastMsg.message_type === "gift" ? "🎁 Подарок"
        : it.lastMsg.message_type === "attachment" ? (it.lastMsg.file_kind === "image" ? "📷 Фото" : it.lastMsg.file_kind === "video" ? "🎥 Видео" : "📎 Файл")
        : stripMarkdown(it.lastMsg.content || ""))
      : "";
    chatLastMsg.set(it.chat_id, { text: preview, time: it.lastTime, senderId: it.lastMsg ? it.lastMsg.sender_id : null, unread: it.unread });
  });
  channelItems.forEach((it) => {
    const preview = it.lastMsg
      ? (it.lastMsg.message_type === "tokens" ? `🧩 +${it.lastMsg.tokens_amount}`
        : it.lastMsg.message_type === "gift" ? "🎁 Подарок"
        : it.lastMsg.message_type === "attachment" ? (it.lastMsg.file_kind === "image" ? "📷 Фото" : it.lastMsg.file_kind === "video" ? "🎥 Видео" : "📎 Файл")
        : stripMarkdown(it.lastMsg.content || ""))
      : "";
    chatLastMsg.set(it.chat_id, { text: preview, time: it.lastTime, senderId: null, unread: it.unread });
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
    ? (it.lastMsg.message_type === "tokens" ? `🧩 +${it.lastMsg.tokens_amount}`
      : it.lastMsg.message_type === "gift" ? "🎁 Подарок"
      : ((it.lastMsg.sender_id === currentUser.id ? "Вы: " : "") + stripMarkdown(it.lastMsg.content || "")))
    : "Нет сообщений";
  const unreadHtml = it.unread > 0 ? `<span class="unread-badge">${it.unread}</span>` : "";
  return `
    <div class="user-item" data-user-id="${user.id}" data-chat-id="${it.chat_id}" data-custom-name="${it.customName ? escapeHtml(it.customName) : ""}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1">
          <div class="user-item-name">${escapeHtml(name)}${blocked}</div>
          <div class="user-item-time">${time}</div>
        </div>
        <div class="user-item-row2">
          <div class="user-item-preview ${it.unread > 0 ? "unread" : ""}">${escapeHtml(preview.slice(0, 60))}</div>
          ${unreadHtml}
        </div>
      </div>
    </div>`;
}

function bindChatItemEvents(el, user) {
  const listEl = document.getElementById("users-list");
  el.addEventListener("click", () => {
    listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
    el.classList.add("active");
    // openSeq++ произойдёт внутри openChatWith — это отменит все висящие загрузки
    openChatWith(user);
  });
  el.addEventListener("contextmenu", (ev) => { ev.preventDefault(); openChatListContextMenu(ev, user, el); });
}

function renderChatListUnified(items, profileMap) {
  const listEl = document.getElementById("users-list");
  if (!items.length) { listEl.innerHTML = '<div class="empty">У вас пока нет чатов.</div>'; refreshWheelLayout(); return; }
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
      paintAvatar(el.querySelector(".avatar"), user);
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
    const m = it.lastMsg;
    if (m.message_type === "tokens") preview = `🧩 +${m.tokens_amount}`;
    else if (m.message_type === "gift") preview = "🎁 Подарок";
    else if (m.message_type === "attachment") preview = m.file_kind === "image" ? "📷 Фото" : m.file_kind === "video" ? "🎥 Видео" : "📎 Файл";
    else preview = (m.sender_id === currentUser.id ? "Вы: " : "") + stripMarkdown(m.content || "");
  } else {
    preview = "Нет сообщений";
  }
  const unreadHtml = it.unread > 0 ? `<span class="unread-badge">${it.unread}</span>` : "";
  return `
    <div class="user-item" data-user-id="${user.id}" data-chat-id="${it.chat_id}" data-chat-type="dm" data-custom-name="${it.customName ? escapeHtml(it.customName) : ""}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1">
          <div class="user-item-name">${escapeHtml(name)}${blocked}</div>
          <div class="user-item-time">${time}</div>
        </div>
        <div class="user-item-row2">
          <div class="user-item-preview ${it.unread > 0 ? "unread" : ""}">${escapeHtml(preview.slice(0, 60))}</div>
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
    const m = it.lastMsg;
    if (m.message_type === "tokens") preview = `🧩 +${m.tokens_amount}`;
    else if (m.message_type === "gift") preview = "🎁 Подарок";
    else if (m.message_type === "attachment") preview = m.file_kind === "image" ? "📷 Фото" : m.file_kind === "video" ? "🎥 Видео" : "📎 Файл";
    else preview = stripMarkdown(m.content || "");
  } else {
    preview = "Нет сообщений";
  }
  const unreadHtml = it.unread > 0 ? `<span class="unread-badge">${it.unread}</span>` : "";
  return `
    <div class="user-item" data-chat-id="${it.chat_id}" data-chat-type="channel">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1">
          <div class="user-item-name">${escapeHtml(ch.name)}<span class="channel-mark">📢</span></div>
          <div class="user-item-time">${time}</div>
        </div>
        <div class="user-item-row2">
          <div class="user-item-preview ${it.unread > 0 ? "unread" : ""}">${escapeHtml(preview.slice(0, 60))}</div>
          ${unreadHtml}
        </div>
      </div>
    </div>`;
}

function bindChannelItemEvents(el, channel) {
  el.addEventListener("click", () => {
    const listEl = document.getElementById("users-list");
    listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
    el.classList.add("active");
    openChannel(channel.id);
  });
  el.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    openChatListContextMenuForChannel(ev, channel);
  });
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
      if (nameEl) nameEl.innerHTML = escapeHtml(ch.name) + '<span class="channel-mark">📢</span>';
      paintAvatar(el.querySelector(".avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
    }
  }

  if (!isOpen) return;

  // Обновляем шапку открытого канала
  if (ch) {
    Object.assign(currentChannelObj, ch);
    paintAvatar(document.getElementById("chat-avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
    document.getElementById("chat-title").textContent = ch.name;
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
    document.getElementById("channel-profile-name").textContent = ch.name;
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
    el.textContent = `${currentChannelSubscribers} ${pluralRu(currentChannelSubscribers, "подписчик", "подписчика", "подписчиков")}`;
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
    subBtn.textContent = "Отписаться";
    subBtn.classList.add("unsub");
    return;
  }

  const vis = currentChannelObj.visibility || "public";
  if (vis === "request") {
    if (currentChannelHasRequest) {
      subBtn.textContent = "Заявка отправлена";
      subBtn.disabled = true;
    } else {
      subBtn.textContent = "Подать заявку";
    }
  } else if (vis === "private") {
    subBtn.textContent = "Только по ссылке-приглашению";
    subBtn.disabled = true;
  } else {
    subBtn.textContent = "Подписаться";
  }
}

async function openChannel(chatId) {
  const mySeq = ++openSeq;
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
  if (!ch) { await showAlertDialog("Ошибка", "Канал не найден"); return; }
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
  document.getElementById("chat-title").textContent = ch.name;
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
  if (ch.visibility === "request" && !currentChannelIsSubscribed && !currentChannelIsAdmin) {
    const { data: req } = await supabase.from("channel_join_requests")
      .select("id").eq("chat_id", ch.id).eq("user_id", currentUser.id).maybeSingle();
    if (mySeq !== openSeq) return;
    currentChannelHasRequest = !!req;
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
  let preview = stripMarkdown(data.text) || "Нет сообщений";
  const isSpecialPreview = preview.startsWith("🧩") || preview.startsWith("🎁") || preview.startsWith("📷") || preview.startsWith("🎥") || preview.startsWith("📎");
  if (!isChannel && preview && !isSpecialPreview && data.senderId === currentUser.id) {
    preview = "Вы: " + preview;
  }
  if (previewEl) { previewEl.textContent = preview.slice(0, 60); previewEl.classList.toggle("unread", data.unread > 0); }
  if (timeEl) timeEl.textContent = data.time ? formatChatTime(data.time) : "";
  const row2 = el.querySelector(".user-item-row2");
  if (row2) {
    let badge = row2.querySelector(".unread-badge");
    if (data.unread > 0) {
      if (!badge) { badge = document.createElement("span"); badge.className = "unread-badge"; row2.appendChild(badge); }
      badge.textContent = String(data.unread);
    } else if (badge) badge.remove();
  }
  updateUnreadTitle();
}

// Обновляет document.title: «(N) Imaginer» при непрочитанных, иначе «Imaginer»
function updateUnreadTitle() {
  let total = 0;
  chatLastMsg.forEach((data) => { if (data && data.unread > 0) total += data.unread; });
  if (total > 0) document.title = `(${total}) Imaginer`;
  else document.title = "Imaginer";
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
      .select("id, username, display_name, avatar_url, last_seen, gender, birthday")
      .eq("id", otherUserId).single();
    if (!profile) return;

    // Ещё раз проверяем — пока грузили профиль, могли уже добавить
    if (document.querySelector(`.user-item[data-chat-id="${chatId}"]`)) return;

    profileCache.set(profile.id, profile);
    chatIdByUser.set(otherUserId, chatId);

    const { data: myMembership } = await supabase.from("chat_members")
      .select("custom_name").eq("chat_id", chatId).eq("user_id", currentUser.id).maybeSingle();
    const customName = myMembership ? myMembership.custom_name : null;

    const item = {
      chat_id: chatId,
      user_id: otherUserId,
      lastMsg: null,
      lastTime: Date.now(),
      unread: 0,
      customName,
    };
    chatLastMsg.set(chatId, { text: "", time: Date.now(), senderId: null, unread: 0 });

    const listEl = document.getElementById("users-list");
    const empty = listEl.querySelector(".empty");
    if (empty) empty.remove();

    const temp = document.createElement("div");
    temp.innerHTML = renderChatItem(item, profile);
    const itemEl = temp.firstElementChild;
    paintAvatar(itemEl.querySelector(".avatar"), profile);
    bindChatItemEvents(itemEl, profile);
    listEl.insertBefore(itemEl, listEl.firstChild);
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
  if (listEl.querySelectorAll(".user-item").length === 0) listEl.innerHTML = '<div class="empty">У вас пока нет чатов.</div>';
  refreshWheelLayout();
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
  titleEl.textContent = "Поиск";
  const clean = query.replace(/^@+/, "").trim().toLowerCase();
  if (!clean) { listEl.innerHTML = '<div class="empty">Начни вводить имя или @username</div>'; return; }
  listEl.innerHTML = '<div class="empty">Ищу...</div>';
  const reqId = ++searchReqId;

  const [profilesRes, customRes, channelsRes] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url, last_seen, gender, birthday")
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
    listEl.innerHTML = `<div class="empty">Никого не найдено по «${escapeHtml(query)}»</div>`;
    return;
  }

  let allProfiles = [];
  if (resultIds.size) {
    const { data } = await supabase.from("profiles")
      .select("id, username, display_name, avatar_url, last_seen, gender, birthday").in("id", [...resultIds]);
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
        <div class="user-item-row1"><div class="user-item-name">${escapeHtml(ch.name)}<span class="channel-mark">📢</span></div></div>
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
        <div class="user-item-row1"><div class="user-item-name">${displayName}${blocked}</div></div>
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
    listEl.innerHTML = '<div class="empty">Пусто</div>';
    return;
  }

  let html = "";

  if (topNew.length) {
    html += `<div class="search-section-title">Найденные</div>`;
    html += topNew.map((item) => {
      if (item && item.username && item.owner_id) return renderSearchChannelHtml(item);
      return renderSearchUserHtml(item);
    }).join("");
  }

  if (myList.length) {
    html += `<div class="search-section-title">Ваши чаты и каналы</div>`;
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
  ["profile", "rename", "clear", "delete", "block"].forEach((a) => {
    const b = menu.querySelector(`button[data-action="${a}"]`);
    if (b) b.classList.remove("hidden");
  });
  ["channel-profile", "channel-unsubscribe"].forEach((a) => {
    const b = menu.querySelector(`button[data-action="${a}"]`);
    if (b) b.classList.add("hidden");
  });
  const blockBtn = menu.querySelector('button[data-action="block"]');
  blockBtn.textContent = isBlockedByMe(user.id) ? "Разблокировать" : "Заблокировать";
  menu.classList.remove("hidden");
  menu.style.left = "0px"; menu.style.top = "0px";
  const rect = menu.getBoundingClientRect();
  let x = ev.clientX, y = ev.clientY;
  if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
  if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
  menu.style.left = x + "px"; menu.style.top = y + "px";
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
  ["channel-profile", "channel-unsubscribe"].forEach((a) => {
    const b = menu.querySelector(`button[data-action="${a}"]`);
    if (b) b.classList.remove("hidden");
  });
  menu.classList.remove("hidden");
  menu.style.left = "0px"; menu.style.top = "0px";
  const rect = menu.getBoundingClientRect();
  let x = ev.clientX, y = ev.clientY;
  if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
  if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
  menu.style.left = x + "px"; menu.style.top = y + "px";
}

document.addEventListener("click", () => {
  const m = document.getElementById("chat-list-context-menu"); if (m) m.classList.add("hidden");
});

document.getElementById("chat-list-context-menu").addEventListener("click", async (e) => {
  const btn = e.target.closest("button"); if (!btn) return;
  e.stopPropagation();
  const action = btn.dataset.action;
  document.getElementById("chat-list-context-menu").classList.add("hidden");

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
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
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
    const choice = await showChoiceDialog("Очистить чат", "Выбери, что очистить:", [
      { label: "Только у меня", value: "me" }, { label: "У обоих", value: "both" },
    ], "Очистить");
    if (!choice) return;
    await openChatWith(user);
    if (choice === "me") await clearChatForMe();
    else if (choice === "both") await clearChatForBoth();
  } else if (action === "delete") {
    const choice = await showChoiceDialog("Удалить чат", "Что удалить?", [
      { label: "У меня (вернётся при новом сообщении)", value: "me" },
      { label: "У обоих (безвозвратно)", value: "both" },
    ], "Удалить");
    if (!choice) return;
    await openChatWith(user);
    if (choice === "me") await hideChatFromList();
    else if (choice === "both") await deleteChatForBoth();
  } else if (action === "block") {
    if (isBlockedByMe(user.id)) await unblockUser(user.id);
    else {
      const ok = await showConfirmDialog("Блокировка", "Заблокировать @" + user.username + "?", "Заблокировать");
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
  // СРАЗУ сбрасываем текущий чат, чтобы избежать случайной отправки в старый
  currentChatId = null;
  currentOtherUser = otherUser; pendingOtherUser = null;
  currentChannelObj = null; currentChannelIsAdmin = false;
  closeChatSearch();
  resetPinsUI();
  const sbBtn = document.getElementById("scroll-bottom-btn");
  if (sbBtn) sbBtn.classList.remove("visible");
  document.getElementById("message-input").setAttribute("contenteditable", "true");
  document.getElementById("message-input").setAttribute("data-placeholder", "Написать сообщение...");
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
  document.getElementById("chat-title").textContent = customName || otherUser.display_name;
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
    document.getElementById("messages").innerHTML = '<div class="empty">Здесь пока нет сообщений. Напишите первым!</div>';
    msgCache.clear(); reactionsCache.clear();
    if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
    if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
    return;
  }
  currentChatId = chatId;
  await loadMessages(chatId, mySeq);
  if (mySeq !== openSeq) return;
  await loadReactionsForVisibleMessages();
  if (mySeq !== openSeq) return;
  subscribeToChat(chatId); subscribeToReactions();
  await markChatRead(chatId);
  setWheelSelected(chatId);
  buildChatTimeline();
}

async function createChatWith(otherUserId) {
  const { data: newChat, error: chatErr } = await supabase.from("chats").insert({}).select().single();
  if (chatErr) {
    console.error("Ошибка создания chat:", chatErr);
    await showAlertDialog("Ошибка", "Не удалось создать чат: " + (chatErr.message || ""));
    return null;
  }
  const { error: membersErr } = await supabase.from("chat_members").insert([
    { chat_id: newChat.id, user_id: currentUser.id },
    { chat_id: newChat.id, user_id: otherUserId },
  ]);
  if (membersErr) {
    console.error("Ошибка добавления участников:", membersErr);
    await showAlertDialog("Ошибка", "Не удалось добавить участников: " + (membersErr.message || ""));
    // Убираем созданный чат, чтобы не было мусора
    await supabase.from("chats").delete().eq("id", newChat.id);
    return null;
  }
  chatIdByUser.set(otherUserId, newChat.id);
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

  const [hidesRes, clearRes] = await Promise.all([
    supabase.from("message_hides").select("message_id").eq("user_id", currentUser.id),
    supabase.from("chat_clears").select("cleared_at").eq("chat_id", chatId).eq("user_id", currentUser.id).maybeSingle(),
  ]);
  // Race-guard: если за это время переключились на другой чат — прерываемся
  if (mySeq !== undefined && mySeq !== openSeq) return;
  if (currentChatId !== chatId) return;

  hiddenMsgIds = new Set((hidesRes.data || []).map((h) => h.message_id));
  const clearRow = clearRes.data;

  let query = supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
  if (clearRow && clearRow.cleared_at) query = query.gt("created_at", clearRow.cleared_at);
  const { data, error } = await query;
  if (mySeq !== undefined && mySeq !== openSeq) return;
  if (currentChatId !== chatId) return;
  if (error) { box.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }

  box.innerHTML = "";
  const isChannel = currentChannelObj && currentChannelObj.id === chatId;

  // Проверка доступа к чтению: владелец всегда видит, остальные — только если подписаны
  if (isChannel) {
    const isOwner = currentChannelObj.owner_id === currentUser.id;
    const hasReadAccess = isOwner || currentChannelIsSubscribed;
    if (!hasReadAccess) {
      const vis = currentChannelObj.visibility || "public";
      if (vis === "request") {
        box.innerHTML = '<div class="empty">Вы не являетесь подписчиком.<br>Подайте заявку, чтобы читать сообщения.</div>';
        await loadPinned(chatId);
        return;
      }
      if (vis === "private") {
        box.innerHTML = '<div class="empty">Этот канал приватный.<br>Читать сообщения могут только подписчики.</div>';
        await loadPinned(chatId);
        return;
      }
      // Для публичных каналов без подписки оставляем возможность читать (как в Телеграме),
      // но писать нельзя — это отдельно проверяется в updateChannelComposerState.
    }
  }

  const all = data || [];
  all.forEach((m) => msgCache.set(m.id, m));
  const visible = all.filter((m) => !hiddenMsgIds.has(m.id));

  if (visible.length === 0) {
    box.innerHTML = isChannel
      ? '<div class="empty">В этом канале пока что нет сообщений.</div>'
      : '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
    await loadPinned(chatId);
    return;
  }

  // Закрепы ЗАГРУЖАЕМ ДО рендера — чтобы значки 📌 сразу были
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

  for (const m of visible) {
    if (mySeq !== undefined && mySeq !== openSeq) return;
    if (currentChatId !== chatId) return;
    await appendMessage(m);
  }
  scrollToBottom();
  rerenderPinMarks();

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
    const senderName = msg.sender_id === currentUser.id ? "Вы" : (sender ? sender.display_name : "Кто-то");
    let text;
    if (msg.sender_id === currentUser.id) {
      text = `<b>Вы</b> отправили <b>${msg.tokens_amount}</b> ${NECTAR_HTML}`;
    } else {
      const g = sender ? sender.gender : null;
      let v;
      if (g === "female") v = "отправила вам";
      else if (g === "male") v = "отправил вам";
      else v = "отправил(а) вам";
      text = `<b>${escapeHtml(senderName)}</b> ${v} <b>${msg.tokens_amount}</b> ${NECTAR_HTML} Nectar`;
    }
    return `<span class="msg-system-text">${text}</span>`;
  }
  if (msg.message_type === "gift") {
    const { data: ug } = await supabase.from("user_gifts").select("*").eq("id", msg.gift_ref_id).maybeSingle();
    if (!ug) return `<span class="msg-system-text">🎁 Подарок</span>`;
    const catalog = await loadGiftCatalog();
    const cat = catalog.find((c) => c.id === ug.gift_id);
    if (!cat) return `<span class="msg-system-text">🎁 Подарок</span>`;
    const sender = await getProfile(msg.sender_id);
    const senderName = msg.sender_id === currentUser.id ? "Вы" : (sender ? sender.display_name : "Кто-то");
    let verb;
    if (msg.sender_id === currentUser.id) {
      verb = "отправили";
    } else {
      const g = sender ? sender.gender : null;
      if (g === "female") verb = "отправила вам";
      else if (g === "male") verb = "отправил вам";
      else verb = "отправил(а) вам";
    }
    const bg = giftBackgroundStyle(ug.background, ug.background_rarity);
    return `
      <span class="msg-system-text">${senderName} ${verb} подарок за <b>${cat.price}</b> ${NECTAR_HTML}</span>
      <div class="gift-card-inline">
        <div class="gci-emoji" style="${bg}">${cat.emoji}</div>
        <div class="gci-name">${escapeHtml(cat.name)} #${ug.serial_number}</div>
        <div class="gci-sub gift-rarity-${cat.rarity}">${giftRarityLabel(cat.rarity)}${cat.collection ? " · " + escapeHtml(cat.collection) : ""}</div>
      </div>`;
  }
  return "";
}

async function buildMsgHtml(msg) {
  const time = new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  let html = "";
  if (msg.forwarded_from_name) {
    html += `<div class="msg-fwd-link" data-fwd-username="${escapeHtml(msg.forwarded_from_username || "")}">Переслано от ${escapeHtml(msg.forwarded_from_name)}</div>`;
  }
  if (msg.reply_to_id && msgCache.has(msg.reply_to_id)) {
    const orig = msgCache.get(msg.reply_to_id);
    const origProfile = await getProfile(orig.sender_id);
    const origName = orig.sender_id === currentUser.id ? "Ты" : (origProfile ? origProfile.display_name : "?");
    const origPreview = orig.message_type === "attachment"
      ? (orig.file_kind === "image" ? "📷 Фото" : orig.file_kind === "video" ? "🎥 Видео" : "📎 Файл")
      : (orig.content || "").slice(0, 60);
    html += `<div class="msg-reply" data-scroll-to="${msg.reply_to_id}">
      <span class="msg-reply-name">В ответ ${escapeHtml(origName)}</span>
      <span class="msg-reply-text">${escapeHtml(origPreview)}</span>
    </div>`;
  }
  if (msg.message_type === "attachment") {
    html += `<div class="msg-attachment">${buildAttachmentHtml(msg)}</div>`;
    if (msg.content) {
      html += `<div class="msg-text" style="margin-top:6px;">${replaceFlagsInHtml(applyFormatting(escapeHtml(msg.content || "")))}</div>`;
    }
  } else {
    html += `<div class="msg-text">${replaceFlagsInHtml(applyFormatting(escapeHtml(msg.content || "")))}</div>`;
  }
  html += `<div class="msg-reactions" data-reactions-for="${msg.id}"></div>`;

  let viewsHtml = "";
  if (currentChannelObj && currentChannelObj.id === msg.chat_id) {
    const vc = currentChannelViewsMap.get(msg.id) || 0;
    if (vc > 0) viewsHtml = `<span class="msg-views">👁 ${vc}</span>`;
  }

  html += `<div class="msg-time">${viewsHtml}${time}${renderMsgStatus(msg)}`;
  if (msg.edited_at) html += `<span class="msg-edited">изменено</span>`;
  html += `</div>`;
  html += `<button class="msg-add-reaction" data-add-reaction="${msg.id}" title="Реакция">😊</button>`;
  return html;
}

async function appendMessage(msg) {
  // Race-guard: не добавляем сообщения из чужого чата
  if (msg.chat_id && currentChatId && msg.chat_id !== currentChatId) return;
  const box = document.getElementById("messages");
  if (document.querySelector(`[data-id="${msg.id}"]`)) return;
  const empty = box.querySelector(".empty");
  if (empty) empty.remove();

  // Системные сообщения (токены, подарки) — по центру, без галочек
  if (msg.message_type === "tokens" || msg.message_type === "gift") {
    const el = document.createElement("div");
    el.className = "msg-system" + (msg.message_type === "gift" ? " gift-msg" : "");
    el.dataset.id = msg.id;
    el.innerHTML = await renderSystemMessage(msg);
    el.addEventListener("contextmenu", (e) => openMsgContextMenu(e, msg.id));
    el.addEventListener("click", onMsgClick);
    box.appendChild(el);
    msgCache.set(msg.id, msg);
    refreshMessageGroups();
    return;
  }

  const isChannelMsg = currentChannelObj && msg.chat_id === currentChannelObj.id;
  const mine = !isChannelMsg && msg.sender_id === currentUser.id;
  const el = document.createElement("div");
  el.className = "msg " + (mine ? "mine" : "other");
  el.dataset.id = msg.id;
  el.innerHTML = await buildMsgHtml(msg);
  el.addEventListener("contextmenu", (e) => openMsgContextMenu(e, msg.id));
  el.addEventListener("click", onMsgClick);
  box.appendChild(el);
  msgCache.set(msg.id, msg);
  renderReactionsUI(msg.id);
  refreshMessageGroups();
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
    viewsEl.textContent = `👁 ${count}`;
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
  if (!wrap) return;

  wrap.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (wheelScrollLock) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    wheelScrollLock = true;
    setTimeout(() => { wheelScrollLock = false; }, 180);
    wheelMove(dir);
  }, { passive: false });

  let touchStartY = 0;
  wrap.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  wrap.addEventListener("touchend", (e) => {
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 30) wheelMove(dy > 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("chat-placeholder")?.classList.contains("hidden")) return;
    if (e.target.matches("input, textarea, [contenteditable]")) return;
    if (e.key === "ArrowUp" && e.altKey) { e.preventDefault(); wheelMove(-1); }
    else if (e.key === "ArrowDown" && e.altKey) { e.preventDefault(); wheelMove(1); }
  });
}

function wheelMove(dir) {
  const listEl = document.getElementById("users-list");
  const items = [...listEl.querySelectorAll(".user-item")];
  if (!items.length) return;
  let idx = items.findIndex((el) => el.dataset.chatId === wheelSelectedChatId);
  if (idx === -1) idx = 0;
  idx = Math.max(0, Math.min(items.length - 1, idx + dir));
  wheelSelectedChatId = items[idx].dataset.chatId;
  wheelIndex = idx;
  refreshWheelLayout();
}

function setWheelSelected(chatId) {
  if (!chatId) return;
  wheelSelectedChatId = chatId;
  refreshWheelLayout();
}

function refreshWheelLayout() {
  const listEl = document.getElementById("users-list");
  if (!listEl) return;
  const items = [...listEl.querySelectorAll(".user-item")];
  if (!items.length) return;

  let idx = items.findIndex((el) => el.dataset.chatId === wheelSelectedChatId);
  if (idx === -1) {
    idx = 0;
    wheelSelectedChatId = items[0].dataset.chatId;
  }
  wheelIndex = idx;

  const SLOT = 82;
  items.forEach((el, i) => {
    const offset = i - idx;
    const abs = Math.abs(offset);
    let scale = 1, opacity = 1, ty = 0;
    if (abs === 0)      { scale = 1.00; opacity = 1.00; }
    else if (abs === 1) { scale = 0.86; opacity = 0.58; }
    else if (abs === 2) { scale = 0.72; opacity = 0.30; }
    else if (abs === 3) { scale = 0.60; opacity = 0.12; }
    else                { scale = 0.55; opacity = 0.00; }
    ty = offset * SLOT;
    el.style.setProperty("--ty", ty + "px");
    el.style.setProperty("--sc", String(scale));
    el.style.opacity = String(opacity);
    el.style.zIndex = String(100 - abs);
    el.classList.toggle("wheel-active", abs === 0 && scrollMode === "wheel");

    const hue = idToHue(el.dataset.chatId || "x");
    el.style.setProperty("--chat-hue", String(hue));
  });
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
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yest.toDateString()) return "Вчера";
  const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
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
    { kind: "cmd", title: "Создать канал", sub: "Открывает диалог создания канала", value: "create-channel", icon: "＋" },
    { kind: "cmd", title: "Профиль", sub: "Свой профиль", value: "profile", icon: "👤" },
    { kind: "cmd", title: "Подарки", sub: "Открыть мои подарки", value: "gifts", icon: "🎁" },
    { kind: "cmd", title: "Настройки канала", sub: "Только для владельца/админа открытого канала", value: "channel-edit", icon: "⚙" },
    { kind: "cmd", title: "О приложении", sub: "Cell · credits", value: "about", icon: "ℹ" },
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
    listEl.innerHTML = '<div class="empty">Ничего не найдено</div>';
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
        <span class="cmd-palette-item-kind">cmd</span>
      </div>`;
    }
    const kindLabel = r.kind === "channel" ? "канал" : r.kind === "chat" ? "чат" : "профиль";
    const avatarHtml = r.profile
      ? `<div class="avatar" data-avatar-for="${r.userId}">?</div>`
      : `<div class="avatar" style="background: hsl(${r.hue}, 60%, 55%);"></div>`;
    return `<div class="cmd-palette-item${active}" data-idx="${i}">
      ${avatarHtml}
      <div class="cmd-palette-item-body">
        <div class="cmd-palette-item-title">${escapeHtml(r.title)}</div>
        <div class="cmd-palette-item-sub">${escapeHtml(r.sub)}</div>
      </div>
      <span class="cmd-palette-item-kind">${kindLabel}</span>
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
  document.getElementById("mini-profile-name").textContent = p.display_name || "—";
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
  const addBtn = e.target.closest(".msg-add-reaction");
  if (addBtn) { e.stopPropagation(); openReactionPickerFor(addBtn, addBtn.dataset.addReaction); return; }
  const chip = e.target.closest(".reaction-chip");
  if (chip) { e.stopPropagation(); toggleReaction(chip.dataset.messageId, chip.dataset.emoji); return; }
}

function jumpToMessage(id) {
  const target = document.querySelector(`[data-id="${id}"]`);
  if (!target) return;
  // Замораживаем авто-переключение активного закрепа, чтобы не «прыгал»
  pinBarFrozenUntil = Date.now() + 900;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
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
  } else {
    el.innerHTML = await buildMsgHtml(msg);
    renderReactionsUI(msg.id);
  }
}

async function openChatByUsername(username) {
  const { data } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, last_seen, gender, birthday").eq("username", username).single();
  if (!data) return;
  if (data.id === currentUser.id) return;
  document.getElementById("search-input").value = "";
  await openChatWith(data);
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
      box.innerHTML = '<div class="empty">В этом канале пока что нет сообщений.</div>';
    } else {
      box.innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
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

// Подмена эмодзи на собственные URL (лесбийский флаг вместо транс-флага)
const FLAG_URL_OVERRIDES = {
  "\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Lesbian_pride_flag_2018.svg/64px-Lesbian_pride_flag_2018.svg.png"
};

function twemojiUrl(emoji) {
  if (FLAG_URL_OVERRIDES[emoji]) return FLAG_URL_OVERRIDES[emoji];
  const codepoints = [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
}

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
  flags: "🏳️ 🏴 🏴‍☠️ 🏁 🚩 🏳️‍🌈 🏳️‍⚧️ 🇺🇳 🇦🇫 🇦🇽 🇦🇱 🇩🇿 🇦🇸 🇦🇩 🇦🇴 🇦🇮 🇦🇶 🇦🇬 🇦🇷 🇦🇲 🇦🇼 🇦🇺 🇦🇹 🇦🇿 🇧🇸 🇧🇭 🇧🇩 🇧🇧 🇧🇾 🇧🇪 🇧🇿 🇧🇯 🇧🇲 🇧🇹 🇧🇴 🇧🇦 🇧🇼 🇧🇷 🇻🇬 🇧🇳 🇧🇬 🇧🇫 🇧🇮 🇰🇭 🇨🇲 🇨🇦 🇮🇨 🇨🇻 🇧🇶 🇰🇾 🇨🇫 🇹🇩 🇮🇴 🇨🇱 🇨🇳 🇨🇽 🇨🇨 🇨🇴 🇰🇲 🇨🇬 🇨🇩 🇨🇰 🇨🇷 🇨🇮 🇭🇷 🇨🇺 🇨🇼 🇨🇾 🇨🇿 🇩🇰 🇩🇯 🇩🇲 🇩🇴 🇪🇨 🇪🇬 🇸🇻 🇬🇶 🇪🇷 🇪🇪 🇸🇿 🇪🇹 🇪🇺 🇫🇰 🇫🇴 🇫🇯 🇫🇮 🇫🇷 🇬🇫 🇵🇫 🇹🇫 🇬🇦 🇬🇲 🇬🇪 🇩🇪 🇬🇭 🇬🇮 🇬🇷 🇬🇱 🇬🇩 🇬🇵 🇬🇺 🇬🇹 🇬🇬 🇬🇳 🇬🇼 🇬🇾 🇭🇹 🇭🇳 🇭🇰 🇭🇺 🇮🇸 🇮🇳 🇮🇩 🇮🇷 🇮🇶 🇮🇪 🇮🇲 🇮🇱 🇮🇹 🇯🇲 🇯🇵 🎌 🇯🇪 🇯🇴 🇰🇿 🇰🇪 🇰🇮 🇽🇰 🇰🇼 🇰🇬 🇱🇦 🇱🇻 🇱🇧 🇱🇸 🇱🇷 🇱🇾 🇱🇮 🇱🇹 🇱🇺 🇲🇴 🇲🇬 🇲🇼 🇲🇾 🇲🇻 🇲🇱 🇲🇹 🇲🇭 🇲🇶 🇲🇷 🇲🇺 🇾🇹 🇲🇽 🇫🇲 🇲🇩 🇲🇨 🇲🇳 🇲🇪 🇲🇸 🇲🇦 🇲🇿 🇲🇲 🇳🇦 🇳🇷 🇳🇵 🇳🇱 🇳🇨 🇳🇿 🇳🇮 🇳🇪 🇳🇬 🇳🇺 🇳🇫 🇰🇵 🇲🇰 🇲🇵 🇳🇴 🇴🇲 🇵🇰 🇵🇼 🇵🇸 🇵🇦 🇵🇬 🇵🇾 🇵🇪 🇵🇭 🇵🇳 🇵🇱 🇵🇹 🇵🇷 🇶🇦 🇷🇪 🇷🇴 🇷🇺 🇷🇼 🇼🇸 🇸🇲 🇸🇹 🇨🇶 🇸🇦 🇸🇳 🇷🇸 🇸🇨 🇸🇱 🇸🇬 🇸🇽 🇸🇰 🇸🇮 🇬🇸 🇸🇧 🇸🇴 🇿🇦 🇰🇷 🇸🇸 🇪🇸 🇱🇰 🇧🇱 🇸🇭 🇰🇳 🇱🇨 🇵🇲 🇻🇨 🇸🇩 🇸🇷 🇸🇪 🇨🇭 🇸🇾 🇹🇼 🇹🇯 🇹🇿 🇹🇭 🇹🇱 🇹🇬 🇹🇰 🇹🇴 🇹🇹 🇹🇳 🇹🇷 🇹🇲 🇹🇨 🇹🇻 🇺🇬 🇺🇦 🇦🇪 🇬🇧 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿 🇺🇸 🇺🇾 🇻🇮 🇺🇿 🇻🇺 🇻🇦 🇻🇪 🇻🇳 🇼🇫 🇪🇭 🇾🇪 🇿🇲 🇿🇼".split(" ")
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
    grid.innerHTML = `<div class="emoji-picker-empty">Здесь появятся недавно использованные эмодзи</div>`;
    return;
  }
  grid.innerHTML = list.map((em) => {
    const inner = isFlagEmoji(em)
      ? `<img class="emoji-flag-inline" src="${twemojiUrl(em)}" alt="${escapeHtml(em)}" draggable="false">`
      : em;
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
  restoreEmojiSelection();
  document.execCommand("insertText", false, emoji);
  addRecentEmoji(emoji);
  saveEmojiSelection();
  // Пикер не закрываем — можно накликать несколько, как в Телеграме
}

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

function setupMediaViewer() {
  const overlay = document.getElementById("media-viewer");
  const body = document.getElementById("media-viewer-body");
  const closeBtn = document.getElementById("media-viewer-close");
  const prevBtn = document.getElementById("media-viewer-prev");
  const nextBtn = document.getElementById("media-viewer-next");
  if (!overlay || !body) return;

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMediaViewer();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMediaViewer();
  });
  if (prevBtn) prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    mediaViewerNavigate(-1);
  });
  if (nextBtn) nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    mediaViewerNavigate(1);
  });

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
    if (m.message_type === "attachment" && m.image_url && (m.file_kind === "image" || m.file_kind === "video")) {
      result.push({ url: m.image_url, kind: m.file_kind, msgId: m.id });
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
  const prevBtn = document.getElementById("media-viewer-prev");
  const nextBtn = document.getElementById("media-viewer-next");
  if (!body) return;

  document.querySelectorAll("#media-viewer video").forEach((v) => {
    try { v.pause(); } catch (e) {}
  });
  body.innerHTML = "";

  const cur = mediaViewerList[mediaViewerIndex];
  if (!cur) { closeMediaViewer(); return; }

  if (cur.kind === "video") {
    const v = document.createElement("video");
    v.src = cur.url;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    body.appendChild(v);
  } else {
    const img = document.createElement("img");
    img.src = cur.url;
    img.alt = "";
    body.appendChild(img);
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
  const body = document.getElementById("media-viewer-body");
  if (!overlay || !body) return;
  body.querySelectorAll("video").forEach((v) => {
    try { v.pause(); } catch (e) {}
  });
  body.innerHTML = "";
  overlay.classList.add("hidden");
  mediaViewerList = [];
  mediaViewerIndex = -1;
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

function buildAttachmentHtml(msg) {
  const url = msg.image_url || "";
  const name = msg.file_name || "файл";
  const size = msg.file_size || 0;
  const kind = msg.file_kind || "file";
  if (!url) {
    return `<div class="msg-attachment-uploading">⏳ Загрузка…</div>`;
  }
  if (kind === "image") {
    return `<img src="${escapeHtml(url)}" class="msg-attachment-image" alt="" data-media-url="${escapeHtml(url)}" data-media-kind="image">`;
  }
  if (kind === "video") {
    return `<video src="${escapeHtml(url)}" class="msg-attachment-video" controls preload="metadata" data-media-url="${escapeHtml(url)}" data-media-kind="video"></video>`;
  }
  return `<a class="msg-attachment-file" href="${escapeHtml(url)}" target="_blank" rel="noopener" download="${escapeHtml(name)}">
    <span class="maf-icon">📎</span>
    <span style="flex:1;min-width:0;">
      <span class="maf-name">${escapeHtml(name)}</span>
      <span class="maf-size">${escapeHtml(formatFileSize(size))}</span>
    </span>
  </a>`;
}

async function handleAttachments(files, caption, asFile) {
  if (currentChannelObj) {
    const isOwner = currentChannelObj.owner_id === currentUser.id;
    const canWrite = isOwner || (currentChannelIsSubscribed && currentChannelIsAdmin);
    if (!canWrite) {
      await showAlertDialog("Нельзя", "Вы не являетесь подписчиком канала");
      return;
    }
  }
  if (currentOtherUser && (isBlockedByMe(currentOtherUser.id) || hasBlockedMe(currentOtherUser.id))) {
    await showAlertDialog("Не отправлено", "Есть блокировка — вложение не отправлено.");
    return;
  }
  if (files.length > ATTACH_MAX_FILES) {
    await showAlertDialog("Слишком много файлов", `Максимум ${ATTACH_MAX_FILES} файлов за раз.`);
    return;
  }
  for (const f of files) {
    if (f.size > ATTACH_MAX_SIZE) {
      await showAlertDialog("Файл слишком большой", `«${f.name}» больше ${formatFileSize(ATTACH_MAX_SIZE)}.`);
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
    content: "", created_at: new Date().toISOString(),
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

  let upErr = null;
  try {
    const res = await supabase.storage.from("attachments").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    upErr = res.error;
  } catch (ex) {
    upErr = ex;
  }

  const tempEl = document.querySelector(`[data-id="${tempId}"]`);

  if (upErr) {
    if (tempEl) tempEl.remove();
    msgCache.delete(tempId);
    await showAlertDialog("Ошибка загрузки", upErr.message || String(upErr));
    return;
  }

  const pub = supabase.storage.from("attachments").getPublicUrl(path);
  const url = pub && pub.data ? pub.data.publicUrl : null;

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
    await showAlertDialog("Не отправлено", error.message || "Ошибка сети");
    return;
  }

  await appendMessage(data);
  scrollToBottom();

  let preview = kind === "image" ? "📷 Фото" : kind === "video" ? "🎥 Видео" : "📎 Файл";
  if (caption) preview = caption.slice(0, 60);
  chatLastMsg.set(chatId, {
    text: preview, time: new Date(data.created_at).getTime(),
    senderId: currentUser.id, unread: 0,
  });
  updateChatItemPreview(chatId);
  resortChatsList();
}

document.getElementById("composer").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (currentOtherUser && (isBlockedByMe(currentOtherUser.id) || hasBlockedMe(currentOtherUser.id))) {
    await showAlertDialog("Не отправлено", "Сообщение не отправлено: есть блокировка.");
    return;
  }

  const content = getInputText();
  if (!content) return;

  // Режим редактирования
  if (editingMsgId) {
    const { error } = await supabase.from("messages")
      .update({ content, edited_at: new Date().toISOString() }).eq("id", editingMsgId);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    clearInput();
    cancelEdit();
    return;
  }

  // Если чата ещё нет — создаём при первом сообщении
  if (!currentChatId && currentOtherUser) {
    clearInput();
    const chatId = await createChatWith(currentOtherUser.id);
    if (!chatId) { await showAlertDialog("Ошибка", "Не удалось создать чат"); return; }
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
      await showAlertDialog("Нельзя", "Вы не являетесь подписчиком канала");
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

  const payload = { chat_id: chatId, sender_id: currentUser.id, content };
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
    await showAlertDialog("Не отправлено", error.message || "Ошибка сети");
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
        if (m.sender_id === currentUser.id && m.message_type !== "tokens" && m.message_type !== "gift") return;
        if (document.querySelector(`[data-id="${m.id}"]`)) return;
        await appendMessage(m);
        scrollToBottom();
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
      { event: "DELETE", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        const id = payload.old && payload.old.id;
        if (!id) return;
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

  menuBtn.addEventListener("click", (e) => { e.stopPropagation(); menuEl.classList.toggle("hidden"); });
  document.addEventListener("click", (e) => {
    if (!menuEl.classList.contains("hidden") && !menuEl.contains(e.target)) menuEl.classList.add("hidden");
  });

  menuEl.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    menuEl.classList.add("hidden");

    if (action === "tokens") {
      openTokensDialog();
    } else if (action === "clear") {
      const choice = await showChoiceDialog("Очистить чат", "Выбери, что очистить:", [
        { label: "Только у меня", value: "me" },
        { label: "У обоих", value: "both" },
      ], "Очистить");
      if (choice === "me") await clearChatForMe();
      else if (choice === "both") await clearChatForBoth();
    } else if (action === "delete") {
      const choice = await showChoiceDialog("Удалить чат", "Что удалить?", [
        { label: "У меня (вернётся при новом сообщении)", value: "me" },
        { label: "У обоих (безвозвратно)", value: "both" },
      ], "Удалить");
      if (choice === "me") await hideChatFromList();
      else if (choice === "both") await deleteChatForBoth();
    } else if (action === "block") {
      if (!currentOtherUser) return;
      if (isBlockedByMe(currentOtherUser.id)) await unblockUser(currentOtherUser.id);
      else {
        const ok = await showConfirmDialog("Блокировка", "Заблокировать @" + currentOtherUser.username + "?", "Заблокировать");
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
      const ok = await showConfirmDialog("Отписаться", `Отписаться от канала «${currentChannelObj.name}»?`, "Отписаться");
      if (!ok) return;
      const chId = currentChannelObj.id;
      const { error } = await supabase.from("chat_members")
        .delete().eq("chat_id", chId).eq("user_id", currentUser.id);
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
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
    text.textContent = "Ты заблокировал(а) @" + currentOtherUser.username + ".";
    btn.classList.remove("hidden"); banner.classList.remove("hidden");
    composerInput.disabled = true; composerBtn.disabled = true;
    menuBlockBtn.textContent = "Разблокировать";
  } else if (theyBlocked) {
    text.textContent = "@" + currentOtherUser.username + " заблокировал(а) тебя.";
    btn.classList.add("hidden"); banner.classList.remove("hidden");
    composerInput.disabled = true; composerBtn.disabled = true;
    menuBlockBtn.textContent = "Заблокировать";
  } else {
    banner.classList.add("hidden"); btn.classList.add("hidden");
    composerInput.disabled = false; composerBtn.disabled = false;
    menuBlockBtn.textContent = "Заблокировать";
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
  const { error } = await supabase.from("messages").delete().eq("chat_id", currentChatId);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  document.getElementById("messages").innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
  msgCache.clear(); reactionsCache.clear();
}

async function hideChatFromList() {
  if (!currentChatId) return;
  const chatId = currentChatId;
  const { error } = await supabase.from("chat_hides").upsert({
    chat_id: chatId, user_id: currentUser.id, hidden_at: new Date().toISOString(),
  });
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  closeCurrentChat();
  removeChatFromList(chatId);
}

async function deleteChatForBoth() {
  if (!currentChatId) return;
  const chatId = currentChatId;
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  closeCurrentChat();
  removeChatFromList(chatId);
}

function closeCurrentChat() {
  openSeq++;
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
  const sbBtn = document.getElementById("scroll-bottom-btn");
  if (sbBtn) sbBtn.classList.remove("visible");
  document.getElementById("chat-content").classList.add("hidden");
  document.getElementById("chat-placeholder").classList.remove("hidden");
}

// ======================================================
// 20. ПКМ ПО СООБЩЕНИЮ
// ======================================================
function copyMessageText(id) {
  const msg = msgCache.get(id);
  if (!msg) return;
  const text = msg.content || "";
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
    else if (action === "copy") copyMessageText(id);
    else if (action === "edit") startEdit(id);
    else if (action === "react") openPickerForContext(id);
    else if (action === "fwd") await handleForwardOne(id);
    else if (action === "del") await handleDeleteOne(id);
    else if (action === "sel") enterSelectionMode(id);
  });
  document.addEventListener("click", () => closeMsgContextMenu());

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
      inputEl.addEventListener("contextmenu", (e) => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        e.preventDefault();
        fmtMenu.classList.remove("hidden");
        fmtMenu.style.left = "0px"; fmtMenu.style.top = "0px";
        const rect = fmtMenu.getBoundingClientRect();
        let x = e.clientX, y = e.clientY;
        if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
        if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
        fmtMenu.style.left = x + "px";
        fmtMenu.style.top = y + "px";
      });
      fmtMenu.addEventListener("click", (e) => {
        const btn = e.target.closest("button"); if (!btn) return;
        e.stopPropagation();
        wrapSelection(btn.dataset.format);
        fmtMenu.classList.add("hidden");
      });
      document.addEventListener("click", () => fmtMenu.classList.add("hidden"));
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

function openMsgContextMenu(e, msgId) {
  if (selectionMode) return;
  e.preventDefault(); e.stopPropagation();
  contextMsgId = msgId;
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

  const menu = document.getElementById("msg-context-menu");
  menu.classList.remove("hidden");
  menu.style.left = "0px"; menu.style.top = "0px";
  const rect = menu.getBoundingClientRect();
  let x = e.clientX, y = e.clientY;
  if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
  if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
  menu.style.left = x + "px"; menu.style.top = y + "px";
}

function closeMsgContextMenu() {
  const m = document.getElementById("msg-context-menu");
  if (m) m.classList.add("hidden");
}

async function openGiftDetailById(ugId) {
  const { data: ug } = await supabase.from("user_gifts").select("*").eq("id", ugId).maybeSingle();
  if (!ug) { await showAlertDialog("Подарок", "Подарок не найден"); return; }
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
  cancelEdit();
  replyToMsg = msg;
  const profile = await getProfile(msg.sender_id);
  const name = msg.sender_id === currentUser.id ? "Ты" : (profile ? profile.display_name : "?");
  document.getElementById("reply-bar-title").textContent = "Ответ " + name;
  document.getElementById("reply-bar-text").textContent = (msg.content || "").slice(0, 80);
  document.getElementById("reply-bar-icon").textContent = "↩";
  document.getElementById("reply-bar").classList.remove("hidden");
  document.getElementById("message-input").focus();
}

function cancelReply() {
  replyToMsg = null;
  if (!editingMsgId) document.getElementById("reply-bar").classList.add("hidden");
}

function startEdit(msgId) {
  const msg = msgCache.get(msgId);
  if (!msg || msg.sender_id !== currentUser.id) return;
  if (msg.forwarded_from_name || msg.message_type === "tokens" || msg.message_type === "gift") return;
  cancelReply();
  editingMsgId = msgId;
  document.getElementById("reply-bar-title").textContent = "Редактирование";
  document.getElementById("reply-bar-text").textContent = (msg.content || "").slice(0, 80);
  document.getElementById("reply-bar-icon").textContent = "✎";
  document.getElementById("reply-bar").classList.remove("hidden");
  setInputFromMarkdown(msg.content || "");
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
      await showAlertDialog("Нельзя", "Только администраторы могут удалять сообщения в канале");
      return;
    }
    await deleteMessageForBoth(msgId);
    return;
  }
  const choice = await showChoiceDialog("Удалить сообщение", "У кого удалить?", [
    { label: "У меня", value: "me" },
    { label: "У обоих", value: "both" },
  ], "Удалить");
  if (choice === "me") await hideMessageForMe(msgId);
  else if (choice === "both") await deleteMessageForBoth(msgId);
}

async function hideMessageForMe(msgId) {
  if (String(msgId).startsWith("tmp_")) return;
  const { error } = await supabase.from("message_hides").insert({ message_id: msgId, user_id: currentUser.id });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    await showAlertDialog("Ошибка", error.message); return;
  }
  hiddenMsgIds.add(msgId); msgCache.delete(msgId);
  const el = document.querySelector(`[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
}

async function deleteMessageForBoth(msgId) {
  if (String(msgId).startsWith("tmp_")) return;
  const { error } = await supabase.from("messages").delete().eq("id", msgId);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  msgCache.delete(msgId); reactionsCache.delete(msgId);
  subtractViewsForDeletedMessage(msgId);
  const el = document.querySelector(`[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
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
      if (selectedMsgIds.size >= 100) { showAlertDialog("Лимит", "Максимум 100 сообщений"); return; }
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
  document.getElementById("selection-count").textContent = "Выбрано: " + selectedMsgIds.size;
}

async function handleDeleteSelected() {
  const count = selectedMsgIds.size;
  if (!count) return;
  const choice = await showChoiceDialog("Удалить сообщения", `Будет удалено: ${count}`, [
    { label: "У меня", value: "me" },
    { label: "У обоих", value: "both" },
  ], "Удалить");
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
    const { error } = await supabase.from("messages").delete().in("id", ids);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    ids.forEach((id) => {
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
  if (msg.message_type === "attachment") {
    await showAlertDialog("Пересылка", "Вложения пока нельзя пересылать.");
    return;
  }
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
  document.getElementById("forward-list").innerHTML = '<div class="empty">Загрузка...</div>';
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
  document.getElementById("forward-list").innerHTML = '<div class="empty">Загрузка...</div>';
  await populateForwardList();
  document.getElementById("forward-info").textContent = `Выбрано чатов: 0 / 10`;
}

async function populateForwardList() {
  const listEl = document.getElementById("forward-list");
  const { data: myChats } = await supabase.from("chat_members").select("chat_id").eq("user_id", currentUser.id);
  const chatIds = (myChats || []).map((c) => c.chat_id);
  if (!chatIds.length) { listEl.innerHTML = '<div class="empty">Нет чатов</div>'; return; }

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

  if (!items.length) { listEl.innerHTML = '<div class="empty">Нет чатов</div>'; return; }

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
        if (forwardSelectedChats.size >= 10) { showAlertDialog("Лимит", "Максимум 10 чатов"); return; }
        forwardSelectedChats.add(id);
        el.classList.add("selected");
        el.querySelector(".fcheck").classList.remove("hidden");
      }
      updateForwardInfo();
    });
  });
}

function updateForwardInfo() {
  document.getElementById("forward-info").textContent = `Выбрано чатов: ${forwardSelectedChats.size} / 10`;
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
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    document.getElementById("forward-overlay").classList.add("hidden");
    forwardPlainText = false;
    if (inviteShareReturnToInvite) {
      inviteShareReturnToInvite = false;
      document.getElementById("invite-overlay").classList.remove("hidden");
    }
    await showAlertDialog("Готово", "Ссылка отправлена.");
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
    for (const m of forwardSourceMsgs) {
      const payload = { chat_id: chatId, sender_id: currentUser.id, content: m.content || "" };
      if (!hideSender) {
        const s = senderMap.get(m.sender_id) || { display_name: "?", username: "?" };
        payload.forwarded_from_name = s.display_name;
        payload.forwarded_from_username = s.username;
      }
      payloads.push(payload);
    }
  }

  const { error } = await supabase.from("messages").insert(payloads);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }

  document.getElementById("forward-overlay").classList.add("hidden");
  if (selectionMode) exitSelectionMode();
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
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
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
  const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const t = document.getElementById("bc-title");
  if (t) t.textContent = months[bcViewMonth] + " " + bcViewYear;
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
  const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  let res = day + " " + months[mo - 1];
  if (year) { let y = year; if (y.length === 2) y = "20" + y; res += " " + y; }
  return res;
}

function pluralRu(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
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
  if (diffSec < 45) return "в сети";
  const wasVerb = genderVerb(profile);
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 1) return wasVerb + " недавно";
  if (diffMin < 60) return wasVerb + " " + diffMin + " " + pluralRu(diffMin, "минуту", "минуты", "минут") + " назад";
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 13) return wasVerb + " " + diffHours + " " + pluralRu(diffHours, "час", "часа", "часов") + " назад";
  const d = new Date(lastSeen);
  const nowDate = new Date();
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (d.getTime() >= todayStart) return wasVerb + " сегодня в " + time;
  if (d.getTime() >= yesterdayStart) return wasVerb + " вчера в " + time;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return wasVerb + " " + day + "/" + month + "/" + year + " в " + time;
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
      giftMenu.classList.add("hidden");
      if (!ugId || btn.dataset.action !== "pin") return;
      const { data: ug } = await supabase.from("user_gifts").select("pinned_at").eq("id", ugId).maybeSingle();
      const newVal = (ug && ug.pinned_at) ? null : new Date().toISOString();
      const { error } = await supabase.from("user_gifts").update({ pinned_at: newVal }).eq("id", ugId);
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      renderGiftsMain(currentUser.id);
    });
    document.addEventListener("click", () => giftMenu.classList.add("hidden"));
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
  if (r === "common") return "Обычный";
  if (r === "rare") return "Редкий";
  if (r === "epic") return "Эпический";
  return r;
}



// ======================================================
// ПАТТЕРНЫ ПОДАРКОВ (только для epic).
// Тир 1 = лучший (🟦), тир 6 = обычный (🟫).
// ======================================================

// Маленькая иконка внутри большого тайла — как в Telegram.
const PATTERN_TILE_SIZE = 130;   // шаг сетки (больше = реже)
const PATTERN_ICON_SIZE = 20;    // размер иконки внутри тайла

const PATTERN_MASK_CACHE = new Map();

// Скачивает иконку через wsrv.nl (обход CORS у i.ibb.co),
// прогоняет через FileReader → base64 и собирает SVG-маску,
// где иконка маленькая в центре большого тайла.
async function buildPatternMaskUrl(iconUrl) {
  if (!iconUrl) return null;
  if (PATTERN_MASK_CACHE.has(iconUrl)) return PATTERN_MASK_CACHE.get(iconUrl);

  try {
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

    const tile = PATTERN_TILE_SIZE;
    const icon = PATTERN_ICON_SIZE;
    const off = (tile - icon) / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}"><image href="${dataUrl}" x="${off}" y="${off}" width="${icon}" height="${icon}"/></svg>`;
    // encodeURIComponent закодирует все " как %22, поэтому внутри style="..." безопасно использовать url('...')
    const maskUrl = `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}')`;
    PATTERN_MASK_CACHE.set(iconUrl, maskUrl);
    return maskUrl;
  } catch (e) {
    console.warn("pattern mask build failed:", e);
    PATTERN_MASK_CACHE.set(iconUrl, null);
    return null;
  }
}

const GIFT_PATTERNS = [
  // Tier 1 — 🟦 (0.75% каждый)
  { id: "Tiger",              icon: "https://i.ibb.co/twqHC62m/icons8-tiger-100.png",           tier: 1 },
  { id: "Diamond",            icon: "https://i.ibb.co/HpDjsYGW/icons8-100.png",                  tier: 1 },
  { id: "Lovely Rose",        icon: "https://i.ibb.co/m5wCnxZJ/icons8-100.png",                  tier: 1 },
  { id: "Honeycomb",          icon: "https://i.ibb.co/VWx1VhTJ/icons8.png",                      tier: 1 },
  // Tier 2 — 🟩 (1% каждый)
  { id: "Dragon",             icon: "https://i.ibb.co/BHmvdSfj/icons8-dragon-100.png",           tier: 2 },
  { id: "Turtle Fight",       icon: "https://i.ibb.co/LXnkDyqs/icons8-ninja-turtle-100.png",     tier: 2 },
  { id: "Danger",             icon: "https://i.ibb.co/vxxbbKCc/icons8-poison-100.png",           tier: 2 },
  { id: "Cybersport",         icon: "https://i.ibb.co/HfW2q7QC/icons8-100.png",                  tier: 2 },
  { id: "Paw",                icon: "https://i.ibb.co/hJpC0Lk8/icons8-100.png",                  tier: 2 },
  // Tier 3 — 🟨 (2% каждый)
  { id: "Pizza",              icon: "https://i.ibb.co/35DsZYKS/icons8-salami-pizza-100.png",     tier: 3 },
  { id: "Champion's Trophey", icon: "https://i.ibb.co/HJ7cKK7/icons8-trophy-100.png",            tier: 3 },
  { id: "Shimmer",            icon: "https://i.ibb.co/ycRy1zV3/icons8-100-1.png",                tier: 3 },
  { id: "Knight's Sword",     icon: "https://i.ibb.co/CpVpcNMp/icons8-100.png",                  tier: 3 },
  { id: "Fire",               icon: "https://i.ibb.co/hxTvMMGK/icons8-90.png",                   tier: 3 },
  { id: "Get out of here",    icon: "https://i.ibb.co/N635zXNp/icons8-100.png",                  tier: 3 },
  // Tier 4 — 🟧 (3% каждый)
  { id: "Compass",            icon: "https://i.ibb.co/39JNnHLp/icons8-adventures-100.png",       tier: 4 },
  { id: "Crescent",           icon: "https://i.ibb.co/zTcHnrst/icons8-crescent-moon-100.png",    tier: 4 },
  { id: "Crown",              icon: "https://i.ibb.co/hRLv5SNS/icons8-crown-100.png",            tier: 4 },
  { id: "Laurel Wreath",      icon: "https://i.ibb.co/mVJK3dvW/icons8-laurel-wreath-100.png",    tier: 4 },
  { id: "Horse",              icon: "https://i.ibb.co/43hjhyr/icons8-year-of-horse-100.png",     tier: 4 },
  { id: "Thunderbolt",        icon: "https://i.ibb.co/VySF8T3/icons8-100.png",                   tier: 4 },
  { id: "Hands Up!",          icon: "https://i.ibb.co/vxjzDkvv/icons8-100.png",                  tier: 4 },
  // Tier 5 — 🟥 (4% каждый)
  { id: "Happy Ice Cream",    icon: "https://i.ibb.co/mCJycjJZ/icons8-kawaii-ice-cream-100.png", tier: 5 },
  { id: "Wolf",               icon: "https://i.ibb.co/cK67rPXt/icons8-wolf-100.png",             tier: 5 },
  { id: "Box",                icon: "https://i.ibb.co/xtKBvzqv/icons8-100.png",                  tier: 5 },
  { id: "Flight",             icon: "https://i.ibb.co/BVs0Y9ZB/icons8-100.png",                  tier: 5 },
  { id: "Special Present",    icon: "https://i.ibb.co/wZwsmk3S/icons8-96.png",                   tier: 5 },
  { id: "Rocket",             icon: "https://i.ibb.co/CstWw3w9/icons8-100.png",                  tier: 5 },
  // Tier 6 — 🟫 (5% каждый)
  { id: "Badminton",          icon: "https://i.ibb.co/gZtJJZ2W/icons8-badminton-100.png",        tier: 6 },
  { id: "Basketball",         icon: "https://i.ibb.co/7NKNK0pw/icons8-basketball-100.png",       tier: 6 },
  { id: "Kimono",             icon: "https://i.ibb.co/hxnc5b9K/icons8-kimono-100.png",           tier: 6 },
  { id: "Ping-pong",          icon: "https://i.ibb.co/hRwj1Sh8/icons8-ping-pong-100.png",        tier: 6 },
  { id: "Volleyball",         icon: "https://i.ibb.co/q3m8ty5z/icons8-volleyball-100.png",       tier: 6 },
  { id: "Microphone",         icon: "https://i.ibb.co/tP2tK3cw/icons8-100-1.png",                tier: 6 },
  { id: "Football",           icon: "https://i.ibb.co/ymkH14jy/icons8-100.png",                  tier: 6 }
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

function rollPatternForEpic() {
  const totalWeight = GIFT_PATTERNS.reduce((s, p) => s + PATTERN_TIER_CHANCE[p.tier], 0);
  let r = Math.random() * totalWeight;
  for (const p of GIFT_PATTERNS) {
    r -= PATTERN_TIER_CHANCE[p.tier];
    if (r <= 0) return p.id;
  }
  return GIFT_PATTERNS[GIFT_PATTERNS.length - 1].id;
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
    title.textContent = "Мои подарки";
  } else {
    const p = profileCache.get(userId);
    title.textContent = "Подарки " + (p ? p.display_name : "");
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
  html += `<button class="gift-card-button" style="width:100%;padding:12px;margin-bottom:12px;" id="open-catalog-btn">🛍️ Купить подарок${!isMe ? " для " + escapeHtml((profileCache.get(userId) || {}).display_name || "") : ""}</button>`;

  if (!gifts.length) {
    html += isMe
      ? `<div class="empty">У вас пока нет подарков.</div>`
      : `<div class="empty">У этого пользователя нет подарков.</div>`;
  } else {
    html += `<div class="gifts-grid">`;
    gifts.forEach((ug) => {
      const cat = catalogMap.get(ug.gift_id);
      if (!cat) return;
      const bg = giftBackgroundStyle(ug.background, ug.background_rarity);
      const isLimited = cat.max_supply !== null && cat.max_supply !== undefined;
      const ribbon = isLimited ? `<div class="gift-tile-ribbon">#${ug.serial_number}</div>` : "";
      const pinMark = ug.pinned_at
        ? `<div class="gift-tile-pin"><img class="gift-pin-icon" src="https://i.ibb.co/W4YMJWPd/icons8-94.png" alt=""></div>`
        : "";
      html += `
        <div class="gift-tile" data-gift-ug-id="${ug.id}" data-pinned="${ug.pinned_at ? "1" : "0"}">
          ${ribbon}
          ${pinMark}
          <div class="gift-tile-emoji" style="${bg}">${cat.emoji}</div>
        </div>`;
    });
    html += `</div>`;
  }

  content.innerHTML = html;

  const openBtn = document.getElementById("open-catalog-btn");
  if (openBtn) openBtn.addEventListener("click", () => renderCatalog(userId));

  content.querySelectorAll(".gift-tile").forEach((el) => {
    el.addEventListener("click", () => {
      const ugId = el.dataset.giftUgId;
      const ug = gifts.find((g) => g.id === ugId);
      if (ug) renderGiftDetail(userId, ug);
    });
    if (isMe) {
      el.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const ug = gifts.find((g) => g.id === el.dataset.giftUgId);
        if (ug) openGiftTileContextMenu(ev, ug.id, !!ug.pinned_at);
      });
    }
  });
}

function openGiftTileContextMenu(ev, ugId, isPinned) {
  const menu = document.getElementById("gift-context-menu");
  if (!menu) return;
  const btn = menu.querySelector('button[data-action="pin"]');
  if (btn) btn.textContent = isPinned ? "Открепить" : "Закрепить";
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
}

async function renderCatalog(recipientId) {
  const content = document.getElementById("gifts-content");
  const title = document.getElementById("gifts-title");
  const backBtn = document.getElementById("gifts-back");
  backBtn.classList.remove("hidden");
  backBtn.onclick = () => renderGiftsMain(recipientId);
  title.textContent = "Каталог подарков";
  content.innerHTML = '<div class="empty">Загрузка...</div>';

  await refreshBalance();
  const balance = (myProfile && myProfile.imagi_tokens) || 0;

  const catalog = await loadGiftCatalog();
  if (!catalog.length) { content.innerHTML = '<div class="empty">Каталог пуст</div>'; return; }

  const { data: sold } = await supabase.from("user_gifts").select("gift_id");
  const soldMap = new Map();
  (sold || []).forEach((s) => soldMap.set(s.gift_id, (soldMap.get(s.gift_id) || 0) + 1));

  content.innerHTML = catalog.map((g) => {
    const soldCount = soldMap.get(g.id) || 0;
    const soldOut = g.max_supply !== null && soldCount >= g.max_supply;
    const canAfford = balance >= g.price;
    const disabled = soldOut || !canAfford;
    const supplyText = g.max_supply !== null ? `${soldCount} / ${g.max_supply}` : `${soldCount}`;
    let btnText;
    if (soldOut) btnText = "Распродано";
    else if (!canAfford) btnText = `${NECTAR_HTML} ${g.price} · мало`;
    else btnText = `${NECTAR_HTML} ${g.price}`;
    return `
      <div class="gift-card" data-cat-id="${g.id}">
        <div class="gift-card-emoji" style="background: var(--bg-input);">${g.emoji}</div>
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
  const recipientName = isSelf ? "себе" : (recipient ? recipient.display_name : "пользователю");

  titleEl.textContent = "Купить подарок " + recipientName;
  infoEl.textContent = `${gift.emoji} ${gift.name} — ${giftRarityLabel(gift.rarity)}${gift.collection ? " · " + gift.collection : ""}`;
  costEl.innerHTML = `Стоимость: ${NECTAR_HTML} <b>${gift.price}</b>`;
  captionInput.value = "";
  if (withNameCb) withNameCb.checked = false;
  if (withNameLabel) withNameLabel.textContent = isSelf ? "С моим именем" : "С тем именем";
  overlay.classList.remove("hidden");

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Покупаю...";
    const caption = captionInput.value.trim() || null;
    const withName = !!(withNameCb && withNameCb.checked);

    const { data: newGiftId, error } = await supabase.rpc("buy_gift", {
      p_gift_id: gift.id, p_recipient_id: recipientId, p_caption: caption,
    });

    if (error) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Купить";
      await showAlertDialog("Ошибка", error.message);
      return;
    }

    // Роллим паттерн для epic-подарка
    if (gift.rarity === "epic" && newGiftId) {
      const patternId = rollPatternForEpic();
      if (patternId) {
        try {
          await supabase.from("user_gifts")
            .update({ pattern_id: patternId })
            .eq("id", newGiftId);
        } catch (e) { console.warn("pattern roll:", e); }
      }
    }

    // Замораживаем имя получателя на момент покупки
    if (withName && newGiftId) {
      const rp = isSelf
        ? myProfile
        : (profileCache.get(recipientId) || await getProfile(recipientId));
      const freezeName = rp ? (rp.display_name || "").trim() : "";
      if (freezeName) {
        const { error: upErr } = await supabase
          .from("user_gifts")
          .update({ recipient_id: recipientId, recipient_name: freezeName })
          .eq("id", newGiftId);
        if (upErr) {
          console.error("Не удалось сохранить 'Подарок для':", upErr);
          await showAlertDialog("Внимание", "Подарок куплен, но имя получателя сохранить не удалось: " + upErr.message);
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
    confirmBtn.textContent = "Купить";
    overlay.classList.add("hidden");
    await refreshBalance();
    if (recipientId === currentUser.id) await refreshMyGiftsCount();
    giftCatalogCache = [];
    await loadGiftCatalog();
    renderGiftsMain(recipientId);
  };
  cancelBtn.onclick = () => overlay.classList.add("hidden");
}

async function renderGiftDetail(ownerId, ug) {
  const { data: fresh } = await supabase.from("user_gifts").select("*").eq("id", ug.id).single();
  if (fresh) ug = fresh;

  // Запоминаем контекст — чтобы вернуться именно к этому подарку
  currentGiftDetailUserId = ownerId;
  currentGiftDetailUgId = ug.id;

  const content = document.getElementById("gifts-content");
  const title = document.getElementById("gifts-title");
  const backBtn = document.getElementById("gifts-back");
  backBtn.classList.remove("hidden");
  backBtn.onclick = () => renderGiftsMain(ownerId);
  title.textContent = "Подарок";

  const catalog = await loadGiftCatalog();
  const cat = catalog.find((c) => c.id === ug.gift_id);
  if (!cat) { content.innerHTML = '<div class="empty">Не найдено</div>'; return; }

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
        <span class="gir-label">Паттерн</span>
        <span class="gir-value">${escapeHtml(ug.pattern_id)}${patternChanceHtml}</span>
      </div>`
    : "";

  // Паттерн — всегда чёрный с прозрачностью, читается на любом фоне
  const maskUrl = patternIcon ? await buildPatternMaskUrl(patternIcon) : null;
  const patternStyle = maskUrl
    ? `background-color:#000;-webkit-mask-image:${maskUrl};mask-image:${maskUrl};`
    : "display:none;";

  // Количество
  const maxSupply = (cat.max_supply !== null && cat.max_supply !== undefined) ? cat.max_supply : null;
  const qtyValue = maxSupply !== null
    ? `#${ug.serial_number} · выпущено ${maxSupply}`
    : `#${ug.serial_number}`;

  // Подпись
  const captionHtml = ug.caption
    ? `<div class="gift-info-row"><span class="gir-label">Подпись</span><span class="gir-value">${escapeHtml(ug.caption)}</span></div>`
    : "";

  // Подарок для кого
  const recipientHtml = ug.recipient_name
    ? `<div class="gift-recipient-caption">Подарок для ${ug.recipient_id
        ? `<a href="#" class="gift-recipient-link" data-uid="${ug.recipient_id}">${escapeHtml(ug.recipient_name)}</a>`
        : escapeHtml(ug.recipient_name)}</div>`
    : "";

  content.innerHTML = `
    <div class="gift-detail">
      <div class="gift-hero" style="${bg}">
        <div class="gift-hero-pattern" style="${patternStyle}"></div>
        <div class="gift-hero-emoji">${cat.emoji}</div>
      </div>

      <div class="gift-detail-name">${escapeHtml(cat.name)} #${ug.serial_number}</div>
      <div class="gift-detail-sub">${escapeHtml(cat.collection || "—")} · ${giftRarityLabel(cat.rarity)}</div>

      ${recipientHtml}

      <div class="gift-info-table">
        <div class="gift-info-row">
          <span class="gir-label">Владелец</span>
          <span class="gir-value">${escapeHtml(ownerName)}</span>
        </div>
        <div class="gift-info-row">
          <span class="gir-label">Редкость</span>
          <span class="gir-value">${giftRarityLabel(cat.rarity)}</span>
        </div>
        ${ug.background_name ? `
        <div class="gift-info-row">
          <span class="gir-label">Фон</span>
          <span class="gir-value">${escapeHtml(ug.background_name)}${bgChanceHtml}</span>
        </div>` : ""}
        ${patternRow}
        <div class="gift-info-row">
          <span class="gir-label">Количество</span>
          <span class="gir-value">${qtyValue}</span>
        </div>
        <div class="gift-info-row">
          <span class="gir-label">Ценность</span>
          <span class="gir-value">${NECTAR_HTML} ${cat.price}</span>
        </div>
        ${captionHtml}
      </div>

      <div class="gift-detail-actions">
        ${isOwner ? `
          <button class="dialog-btn ${isInProfile ? "dialog-cancel" : "dialog-primary"}" id="gift-toggle-visible">
            ${isInProfile ? "Скрыть из профиля" : "Добавить в профиль"}
          </button>
          <button class="dialog-btn" id="gift-send">🎁 Подарить</button>
          <button class="dialog-btn" id="gift-sell">💰 Продать за ${NECTAR_HTML} ${Math.floor(cat.price * 0.85)}</button>
        ` : `
          <div class="dialog-text" style="text-align:center;">Подарок принадлежит другому пользователю</div>
        `}
      </div>
    </div>`;

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
      const ok = await showConfirmDialog("Продать подарок",
        `Продать за ${Math.floor(cat.price * 0.85)} Nectar (комиссия 15%)?`, "Продать");
      if (!ok) return;
      const { error } = await supabase.rpc("sell_gift", { p_user_gift_id: ug.id });
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      await refreshBalance();
      await refreshMyGiftsCount();
      renderGiftsMain(ownerId);
    });
  }
}

// Отправка подарка — только контактам (тем, с кем есть чат)
async function openGiftSend(ug) {
  const overlay = document.getElementById("gift-send-overlay");
  const listEl = document.getElementById("gift-send-list");
  overlay.classList.remove("hidden");
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';

  const { data: myChats } = await supabase.from("chat_members").select("chat_id").eq("user_id", currentUser.id);
  const chatIds = (myChats || []).map((c) => c.chat_id);
  if (!chatIds.length) { listEl.innerHTML = '<div class="empty">У вас пока нет контактов</div>'; return; }

  const { data: others } = await supabase.from("chat_members")
    .select("chat_id, user_id").in("chat_id", chatIds).neq("user_id", currentUser.id);
  const userIds = [...new Set((others || []).map((o) => o.user_id))];
  if (!userIds.length) { listEl.innerHTML = '<div class="empty">У вас пока нет контактов</div>'; return; }

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
    const { error } = await supabase.rpc("transfer_gift", { p_gift_id: ug.id, p_new_owner: selectedId });
    if (error) { await showAlertDialog("Ошибка", error.message); return; }

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
  if (!currentChatId) { await showAlertDialog("Ошибка", "Сначала напишите сообщение собеседнику — тогда создастся чат"); return; }

  const { data } = await supabase.from("profiles").select("imagi_tokens").eq("id", currentUser.id).single();
  const balance = data ? data.imagi_tokens : 0;
  myProfile.imagi_tokens = balance;

  document.getElementById("tokens-send-to").textContent = "Кому: " + currentOtherUser.display_name;
  document.getElementById("tokens-send-balance").innerHTML = `У вас: ${NECTAR_HTML} <b>${balance}</b>`;
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
  document.getElementById("channel-name-input").addEventListener("input", updateChannelCreateButton);

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
        if (error) { await showAlertDialog("Ошибка отписки", error.message); return; }
        currentChannelIsSubscribed = false;
        // СРАЗУ убираем канал из списка чатов
        removeChatFromList(chId);
        if (currentChannelObj && currentChannelObj.id === chId) {
          await loadMessages(chId, openSeq);
          await loadReactionsForVisibleMessages();
        }
      } else if (vis === "request") {
        const { error } = await supabase.rpc("submit_join_request", { p_chat_id: chId });
        if (error) { await showAlertDialog("Ошибка", error.message); return; }
        currentChannelHasRequest = true;
      } else if (vis === "private") {
        await showAlertDialog("Приватный канал", "В этот канал можно попасть только по ссылке-приглашению.");
        return;
      } else {
        const { error } = await supabase.from("chat_members").insert({
          chat_id: chId, user_id: currentUser.id,
        });
        if (error && error.code !== "23505") {
          await showAlertDialog("Ошибка подписки", error.message);
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
      await showAlertDialog("Ошибка", ex.message || String(ex));
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
  paintAvatar(document.getElementById("channel-avatar-preview"), { display_name: "К", avatar_url: channelCreateAvatarUrl });
  updateChannelCreateButton();
  document.getElementById("channel-create-overlay").classList.remove("hidden");
  setTimeout(() => document.getElementById("channel-name-input").focus(), 60);
}

function closeChannelCreateDialog() {
  document.getElementById("channel-create-overlay").classList.add("hidden");
}

function renderChannelAvatarGrid() {
  const grid = document.getElementById("channel-avatar-grid"); grid.innerHTML = "";
  BASE_AVATARS.forEach((pair, idx) => {
    const el = document.createElement("div");
    el.className = "avatar-option"; el.dataset.idx = idx;
    el.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    el.textContent = "К";
    if (channelCreateAvatarUrl === "color:" + idx) el.classList.add("selected");
    el.addEventListener("click", () => {
      channelCreateAvatarUrl = "color:" + idx;
      paintAvatar(document.getElementById("channel-avatar-preview"), { display_name: "К", avatar_url: channelCreateAvatarUrl });
      renderChannelAvatarGrid();
    });
    grid.appendChild(el);
  });
}

async function handleChannelAvatarUpload(e) {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  const dataUrl = await resizeImage(file, 200); if (!dataUrl) return;
  channelCreateAvatarUrl = dataUrl;
  paintAvatar(document.getElementById("channel-avatar-preview"), { display_name: "К", avatar_url: dataUrl });
  renderChannelAvatarGrid();
}

async function checkChannelUsernameLive(value) {
  const hint = document.getElementById("channel-username-hint");
  const username = value.trim(); channelUsernameValidated = null; updateChannelCreateButton();
  if (!username) { hint.className = "username-hint"; hint.textContent = ""; return; }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) { hint.className = "username-hint err"; hint.textContent = "Только английские буквы, цифры, _ и -"; return; }
  if (username.length < 3) { hint.className = "username-hint err"; hint.textContent = "Минимум 3 символа"; return; }
  hint.className = "username-hint"; hint.textContent = "Проверяю...";

  const [pRes, cRes] = await Promise.all([
    supabase.from("profiles").select("id").ilike("username", username).limit(1),
    supabase.from("channels").select("id").ilike("username", username).limit(1),
  ]);

  if (document.getElementById("channel-username-input").value.trim() !== username) return;
  if (pRes.error || cRes.error) { hint.className = "username-hint err"; hint.textContent = "Ошибка проверки"; return; }
  if ((pRes.data && pRes.data.length > 0) || (cRes.data && cRes.data.length > 0)) {
    hint.className = "username-hint err"; hint.textContent = `@${username} уже занят`; channelUsernameValidated = null;
  } else {
    hint.className = "username-hint ok"; hint.textContent = `@${username} свободен`; channelUsernameValidated = username;
  }
  updateChannelCreateButton();
}

async function createChannel() {
  const name = document.getElementById("channel-name-input").value.trim();
  const username = document.getElementById("channel-username-input").value.trim();
  if (!name || !username || username !== channelUsernameValidated) return;
  const btn = document.getElementById("channel-create-confirm");
  btn.disabled = true; btn.textContent = "Создаю...";

  try {
    // Двойная проверка username — на всякий случай
    const [pRes, cRes] = await Promise.all([
      supabase.from("profiles").select("id").ilike("username", username).limit(1),
      supabase.from("channels").select("id").ilike("username", username).limit(1),
    ]);
    if ((pRes.data && pRes.data.length) || (cRes.data && cRes.data.length)) {
      await showAlertDialog("Ошибка", "Юзернейм уже занят");
      btn.disabled = false; btn.textContent = "Создать канал";
      return;
    }

    // 1. Создаём chats
    const { data: newChat, error: chatErr } = await supabase.from("chats").insert({}).select().single();
    if (chatErr || !newChat) {
      await showAlertDialog("Ошибка", "Не удалось создать канал: " + (chatErr ? chatErr.message : "?"));
      btn.disabled = false; btn.textContent = "Создать канал";
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
      await showAlertDialog("Ошибка", "Не удалось создать канал: " + chanErr.message);
      btn.disabled = false; btn.textContent = "Создать канал";
      return;
    }

    // 3. Добавляем себя в chat_members (подписчиком)
    const { error: memErr } = await supabase.from("chat_members").insert({
      chat_id: newChat.id, user_id: currentUser.id,
    });
    if (memErr) console.error("chat_members insert:", memErr);

    closeChannelCreateDialog();
    btn.disabled = false; btn.textContent = "Создать канал";

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
    await showAlertDialog("Ошибка", ex.message || String(ex));
    btn.disabled = false; btn.textContent = "Создать канал";
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
  document.getElementById("channel-profile-name").textContent = ch.name;
  document.getElementById("channel-profile-username").textContent = "@" + (ch.username || "");

  const { data: cntData } = await supabase.rpc("channel_subscribers_count", { p_chat_id: ch.id });
  const cnt = Number(cntData) || 0;
  const word = pluralRu(cnt, "подписчик", "подписчика", "подписчиков");
  document.getElementById("channel-profile-subscribers-status").textContent = `${cnt} ${word}`;
  document.getElementById("channel-profile-subscribers").textContent = String(cnt);

  document.getElementById("channel-profile-created").textContent = ch.created_at
    ? new Date(ch.created_at).toLocaleDateString("ru-RU")
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
      const word = pluralRu(cnt, "подписчик", "подписчика", "подписчиков");
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
    "Удалить канал",
    `Канал «${ch.name}» будет удалён у всех подписчиков безвозвратно. Продолжить?`,
    "Продолжить"
  );
  if (!ok1) return;

  const typed = await showInputDialog(
    "Подтверждение",
    `Введите название канала «${ch.name}» для подтверждения`,
    ""
  );
  if (typed === null) return;
  if (typed.trim() !== ch.name) {
    await showAlertDialog("Отменено", "Название не совпало. Канал не удалён.");
    return;
  }

  const chatId = ch.id;
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }

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

  document.getElementById("channel-edit-name-input").addEventListener("input", updateChannelEditSaveButton);

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

  // Кнопка "Свой цвет" из BASE_AVATARS
  BASE_AVATARS.forEach((pair, idx) => {
    const el = document.createElement("div");
    el.className = "avatar-option";
    el.dataset.idx = idx;
    el.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
    el.textContent = (currentChannelObj && currentChannelObj.name ? currentChannelObj.name[0] : "К").toUpperCase();
    if (channelEditAvatarUrl === "color:" + idx) el.classList.add("selected");
    el.addEventListener("click", () => {
      channelEditAvatarUrl = "color:" + idx;
      paintAvatar(document.getElementById("channel-edit-avatar-preview"), { display_name: "К", avatar_url: channelEditAvatarUrl });
      renderChannelEditAvatarGrid();
    });
    grid.appendChild(el);
  });

  paintAvatar(document.getElementById("channel-edit-avatar-preview"), { display_name: "К", avatar_url: channelEditAvatarUrl });
}

async function handleChannelEditAvatarUpload(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const dataUrl = await resizeImage(file, 200);
  if (!dataUrl) return;
  channelEditAvatarUrl = dataUrl;
  paintAvatar(document.getElementById("channel-edit-avatar-preview"), { display_name: "К", avatar_url: dataUrl });
  renderChannelEditAvatarGrid();
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
    hint.textContent = "Это текущий юзернейм";
    channelEditUsernameValidated = username;
    updateChannelEditSaveButton();
    return;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    hint.className = "username-hint err"; hint.textContent = "Только a-z, 0-9, _ и -"; return;
  }
  if (username.length < 3) {
    hint.className = "username-hint err"; hint.textContent = "Минимум 3 символа"; return;
  }

  hint.className = "username-hint"; hint.textContent = "Проверяю...";

  const [pRes, cRes] = await Promise.all([
    supabase.from("profiles").select("id").ilike("username", username).limit(1),
    supabase.from("channels").select("id").ilike("username", username).neq("id", currentChannelObj.id).limit(1),
  ]);

  if (document.getElementById("channel-edit-username-input").value.trim() !== username) return;
  if (pRes.error || cRes.error) {
    hint.className = "username-hint err"; hint.textContent = "Ошибка проверки"; return;
  }
  if ((pRes.data && pRes.data.length > 0) || (cRes.data && cRes.data.length > 0)) {
    hint.className = "username-hint err"; hint.textContent = `@${username} уже занят`;
    channelEditUsernameValidated = null;
  } else {
    hint.className = "username-hint ok"; hint.textContent = `@${username} свободен`;
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

  if (!name) { await showAlertDialog("Ошибка", "Введите название"); return; }
  if (!username) { await showAlertDialog("Ошибка", "Введите юзернейм"); return; }
  if (username !== channelEditUsernameValidated && username !== ch.username) {
    await showAlertDialog("Ошибка", "Проверьте юзернейм");
    return;
  }

  const reactions = [...channelEditReactions];
  if (!reactions.length) {
    await showAlertDialog("Ошибка", "Выберите хотя бы одну реакцию");
    return;
  }

  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = "Сохраняю...";

  try {
    // Двойная проверка username, если изменился
    if (username !== ch.username) {
      const [pRes, cRes] = await Promise.all([
        supabase.from("profiles").select("id").ilike("username", username).limit(1),
        supabase.from("channels").select("id").ilike("username", username).neq("id", ch.id).limit(1),
      ]);
      if ((pRes.data && pRes.data.length) || (cRes.data && cRes.data.length)) {
        await showAlertDialog("Ошибка", "Юзернейм уже занят");
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
      await showAlertDialog("Ошибка", error.message);
      btn.disabled = false; btn.textContent = oldText;
      return;
    }

    // Обновляем локальный кэш
    Object.assign(ch, payload);
    channelCache.set(ch.id, ch);

    // Обновляем UI чата, если он открыт
    if (currentChannelObj && currentChannelObj.id === ch.id) {
      paintAvatar(document.getElementById("chat-avatar"), { id: ch.id, display_name: name, avatar_url: payload.avatar_url });
      document.getElementById("chat-title").textContent = name;
    }

    // Обновляем карточку в списке чатов
    const itemEl = document.querySelector(`.user-item[data-chat-id="${ch.id}"][data-chat-type="channel"]`);
    if (itemEl) {
      const nameEl = itemEl.querySelector(".user-item-name");
      if (nameEl) nameEl.innerHTML = escapeHtml(name) + '<span class="channel-mark">📢</span>';
      paintAvatar(itemEl.querySelector(".avatar"), { id: ch.id, display_name: name, avatar_url: payload.avatar_url });
    }

    // Обновляем профиль канала, если открыт
    if (channelProfileChannelId === ch.id) {
      paintAvatar(document.getElementById("channel-profile-avatar"), { id: ch.id, display_name: name, avatar_url: payload.avatar_url });
      document.getElementById("channel-profile-name").textContent = name;
      document.getElementById("channel-profile-username").textContent = "@" + username;
    }

    closeChannelEditDialog();
    btn.disabled = false; btn.textContent = oldText;
  } catch (ex) {
    console.error(ex);
    await showAlertDialog("Ошибка", ex.message || String(ex));
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
    listEl.innerHTML = '<div class="empty" style="padding:10px;font-size:13px;">Нет администраторов</div>';
  } else {
    listEl.innerHTML = profiles.map((p) => `
      <div class="admin-row" data-user-id="${p.id}">
        <div class="avatar"></div>
        <div class="admin-row-name">
          ${escapeHtml(p.display_name)}
          <div class="admin-row-username">@${escapeHtml(p.username)}</div>
        </div>
        <span class="admin-row-role admin">Админ</span>
        <button type="button" class="admin-row-remove" data-remove-admin="${p.id}" title="Снять">✕</button>
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
      <span class="admin-row-role owner">Владелец</span>
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
    await showAlertDialog("Нет прав", "Только владелец канала может снимать администраторов");
    return;
  }
  const ok = await showConfirmDialog("Снять администратора", "Снять с должности администратора?", "Снять");
  if (!ok) return;
  const { error } = await supabase.rpc("remove_channel_admin", {
    p_channel_id: currentChannelObj.id,
    p_user_id: userId,
  });
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  await renderChannelEditAdmins();
  await refreshChannelRights(currentChannelObj.id);
  // «Сохранить» — только для полей канала, сбрасываем её состояние
  updateChannelEditSaveButton();
}

async function openAddAdminDialog() {
  if (!currentChannelObj) return;
  if (currentChannelObj.owner_id !== currentUser.id) {
    await showAlertDialog("Нет прав", "Только владелец канала может назначать администраторов");
    return;
  }
  const ch = currentChannelObj;

  const { data: mems } = await supabase.from("chat_members")
    .select("user_id, custom_name").eq("chat_id", ch.id).neq("user_id", currentUser.id);
  const memberIds = (mems || []).map((m) => m.user_id);
  if (!memberIds.length) {
    await showAlertDialog("Пусто", "В канале нет других подписчиков");
    return;
  }
  const customByUser = new Map((mems || []).map((m) => [m.user_id, m.custom_name]));

  const { data: admins } = await supabase.rpc("get_channel_admins", { p_channel_id: ch.id });
  const adminSet = new Set((admins || []).map((a) => a.user_id));
  adminSet.add(ch.owner_id);

  const candidates = memberIds.filter((id) => !adminSet.has(id));
  if (!candidates.length) {
    await showAlertDialog("Пусто", "Все подписчики уже администраторы");
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
    "Выбрать администратора",
    "Кого назначить админом канала? Можно искать по имени или @username.",
    opts,
    "Назначить",
    { searchable: true, searchPlaceholder: "Поиск по имени или @username" }
  );
  if (!choice) return;

  const { error } = await supabase.rpc("add_channel_admin", {
    p_channel_id: ch.id,
    p_user_id: choice,
  });
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  await renderChannelEditAdmins();
  await refreshChannelRights(ch.id);
  updateChannelEditSaveButton();
}

async function openTransferOwnerDialog() {
  if (!currentChannelObj) return;
  if (currentChannelObj.owner_id !== currentUser.id) {
    await showAlertDialog("Нет прав", "Только владелец канала может передать владение");
    return;
  }
  const ch = currentChannelObj;

  const { data: mems } = await supabase.from("chat_members")
    .select("user_id, custom_name").eq("chat_id", ch.id).neq("user_id", currentUser.id);
  const memberIds = (mems || []).map((m) => m.user_id);
  if (!memberIds.length) {
    await showAlertDialog("Пусто", "Нет других подписчиков");
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
    "Передать владение",
    "Выберите нового владельца. Можно искать по имени или @username. Вы потеряете права владельца.",
    opts,
    "Передать",
    { searchable: true, searchPlaceholder: "Поиск по имени или @username" }
  );
  if (!choice) return;

  const confirm = await showConfirmDialog(
    "Подтверждение",
    "Точно передать владение? Действие необратимо.",
    "Передать"
  );
  if (!confirm) return;

  const { error } = await supabase.rpc("transfer_channel_owner", {
    p_channel_id: ch.id,
    p_new_owner: choice,
  });
  if (error) { await showAlertDialog("Ошибка", error.message); return; }

  // Пересчитываем права мгновенно, до realtime
  await refreshChannelRights(ch.id);

  await showAlertDialog("Готово", "Владение передано.");
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

  titleEl.textContent = "Подписчики";
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';
  overlay.classList.remove("hidden");

  const { data: subs, error } = await supabase.rpc("get_channel_subscribers", { p_channel_id: ch.id });
  if (error) { listEl.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }
  if (!subs || !subs.length) { listEl.innerHTML = '<div class="empty">Нет подписчиков</div>'; return; }

  const profiles = [];
  for (const s of subs) {
    const p = await getProfile(s.user_id);
    if (p) profiles.push({ ...p, _role: s.role });
  }

  const roleLabel = (r) => r === "owner" ? "Владелец" : r === "admin" ? "Админ" : "Подписчик";

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
      pin.textContent = "📌";
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

function renderPinBar() {
  const bar = document.getElementById("pin-bar");
  const titleEl = document.getElementById("pin-bar-title");
  const textEl = document.getElementById("pin-bar-text");
  if (!bar) return;
  if (!currentPinnedList.length) { bar.classList.add("hidden"); return; }
  bar.classList.remove("hidden");
  const pin = currentPinnedList[currentPinnedIndex];
  if (!pin) { bar.classList.add("hidden"); return; }
  const msg = pin._msg;
  const preview = stripMarkdown(msg.content || "") || (msg.message_type === "gift" ? "🎁 Подарок" : msg.message_type === "tokens" ? "🧩 ImagiTokens" : "");
  textEl.textContent = preview.slice(0, 80) || "(сообщение)";
  const total = currentPinnedList.length;
  titleEl.textContent = total > 1
    ? `Закреплённое сообщение · ${currentPinnedIndex + 1} из ${total}`
    : "Закреплённое сообщение";
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
  if (myPin || sharedPin) pinBtn.textContent = "Открепить";
  else pinBtn.textContent = "Закрепить";
}

async function handlePinAction(msgId) {
  if (!currentChatId) return;
  const msg = msgCache.get(msgId);
  if (!msg) return;
  if (msg.message_type === "tokens") return;

  // === КАНАЛ ===
  if (currentChannelObj) {
    if (!currentChannelIsAdmin) {
      await showAlertDialog("Нельзя", "Только администраторы могут закреплять сообщения в канале");
      return;
    }
    const existing = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "shared");
    if (existing) {
      const ok = await showConfirmDialog("Открепить", "Открепить это сообщение в канале?", "Открепить");
      if (!ok) return;
      const { error } = await supabase.from("pinned_messages").delete().eq("id", existing.id);
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
    } else {
      const { error } = await supabase.from("pinned_messages").insert({
        chat_id: currentChatId, message_id: msgId, pinned_by: currentUser.id, scope: "shared",
      });
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
    }
    await loadPinned(currentChatId);
    return;
  }

  // === DM ===
  const myPin = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "personal" && p.pinned_by === currentUser.id);
  const sharedPin = currentPinnedList.find((p) => p.message_id === msgId && p.scope === "shared");

  // Если уже shared — только «открепить»
  if (sharedPin && !myPin) {
    const ok = await showConfirmDialog("Открепить", "Открепить это сообщение у обоих?", "Открепить");
    if (!ok) return;
    const { error } = await supabase.from("pinned_messages").delete().eq("id", sharedPin.id);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    await loadPinned(currentChatId);
    return;
  }

  // Если только личный — только «открепить у меня»
  if (myPin && !sharedPin) {
    const ok = await showConfirmDialog("Открепить", "Открепить это сообщение у себя?", "Открепить");
    if (!ok) return;
    const { error } = await supabase.from("pinned_messages").delete().eq("id", myPin.id);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    await loadPinned(currentChatId);
    return;
  }

  // Если оба закрепа — предложить снять любой
  if (myPin && sharedPin) {
    const choice = await showChoiceDialog("Открепление", "Что снять?", [
      { label: "У меня", value: "unpin_me" },
      { label: "У обоих", value: "unpin_both" },
    ], "Открепить");
    if (!choice) return;
    const id = choice === "unpin_me" ? myPin.id : sharedPin.id;
    const { error } = await supabase.from("pinned_messages").delete().eq("id", id);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    await loadPinned(currentChatId);
    return;
  }

  // Ничего нет — предлагаем закрепить
  const choice2 = await showChoiceDialog("Закрепление", "Как закрепить?", [
    { label: "У меня", value: "pin_me" },
    { label: "У обоих", value: "pin_both" },
  ], "Закрепить");
  if (!choice2) return;

  if (choice2 === "pin_me") {
    const { error } = await supabase.from("pinned_messages").insert({
      chat_id: currentChatId, message_id: msgId, pinned_by: currentUser.id, scope: "personal",
    });
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
  } else {
    const { error } = await supabase.from("pinned_messages").insert({
      chat_id: currentChatId, message_id: msgId, pinned_by: currentUser.id, scope: "shared",
    });
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
  }
  await loadPinned(currentChatId);
}

function openPinnedListDialog() {
  if (!currentPinnedList.length) {
    showAlertDialog("Закреплённые", "Пока нет закреплённых сообщений.");
    return;
  }
  const listEl = document.getElementById("pinned-list");
  listEl.innerHTML = currentPinnedList.map((pin, idx) => {
    const msg = pin._msg;
    const time = new Date(msg.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const preview = stripMarkdown(msg.content || "") || (msg.message_type === "gift" ? "🎁 Подарок" : msg.message_type === "tokens" ? "🧩 ImagiTokens" : "(без текста)");
    const sender = profileCache.get(msg.sender_id);
    const senderName = msg.sender_id === currentUser.id ? "Вы" : (sender ? sender.display_name : "—");
    const scopeLabel = pin.scope === "shared" ? "Общий" : "Личный";
    return `
      <div class="pinned-list-item" data-pin-idx="${idx}">
        <div class="pinned-list-item-head">
          <span class="pinned-list-item-sender">${escapeHtml(senderName)}</span>
          <span class="pinned-list-item-time">${time}</span>
        </div>
        <div class="pinned-list-item-text">${escapeHtml(preview.slice(0, 120))}</div>
        <div class="pinned-list-item-scope">${scopeLabel}</div>
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
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';
  const { data, error } = await supabase.from("channel_invites")
    .select("*").eq("chat_id", currentChannelObj.id).eq("revoked", false)
    .order("created_at", { ascending: false });
  if (error) { listEl.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }
  currentInvitesList = data || [];
  if (!currentInvitesList.length) {
    listEl.innerHTML = '<div class="empty">Пока нет ссылок</div>';
    return;
  }
  const baseUrl = window.location.origin + window.location.pathname;
  listEl.innerHTML = currentInvitesList.map((inv) => {
    const url = `${baseUrl}#invite=${inv.code}`;
    return `
      <div class="invite-item" data-invite-id="${inv.id}">
        <span class="invite-item-code"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></span>
        <button class="invite-item-open" data-open-code="${inv.code}" title="Открыть в этой вкладке">↗</button>
        <button class="invite-item-share" data-share-code="${inv.code}" title="Переслать">↪️</button>
        <button class="invite-item-copy" data-copy-code="${inv.code}" title="Скопировать">📋</button>
        <button class="invite-item-revoke" data-revoke-id="${inv.id}" title="Отозвать">✕</button>
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
      btn.textContent = "✓";
      setTimeout(() => { btn.textContent = "📋"; }, 1200);
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
      const ok = await showConfirmDialog("Отозвать ссылку", "Ссылка перестанет работать. Продолжить?", "Отозвать");
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

  listEl.innerHTML = '<div class="empty">Загрузка...</div>';
  overlay.classList.remove("hidden");

  const { data: reqs, error } = await supabase.from("channel_join_requests")
    .select("id, user_id, created_at").eq("chat_id", ch.id)
    .order("created_at", { ascending: true });
  if (error) { listEl.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }
  if (!reqs || !reqs.length) {
    listEl.innerHTML = '<div class="empty">Нет активных заявок</div>';
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
      <button type="button" class="request-approve" data-approve="${p._requestId}" title="Одобрить">✓</button>
      <button type="button" class="request-reject" data-reject="${p._requestId}" title="Отклонить">✕</button>
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
  const word = pluralRu(n, "заявка", "заявки", "заявок");
  const sub = requestsRow.querySelector(".pir-label");
  if (sub) sub.textContent = `${n} ${word} · нажми, чтобы посмотреть`;
}

function subscribeToChannelRequests() {
  if (channelRequestsChannel) return;
  channelRequestsChannel = supabase.channel("channel-requests-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "channel_join_requests" }, async (payload) => {
      const row = payload.new || payload.old;
      if (!row) return;
      // Обновляем бейдж на открытом профиле
      if (channelProfileChannelId === row.chat_id) {
        await updateChannelRequestsBadge(row.chat_id);
      }
      // Если открыт список заявок — перерисовать
      if (currentChannelObj && currentChannelObj.id === row.chat_id) {
        const overlay = document.getElementById("channel-requests-overlay");
        if (overlay && !overlay.classList.contains("hidden")) {
          await openChannelRequestsDialog();
        }
      }
    })
    .subscribe();
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

  btn.addEventListener("click", () => {
    updateSettingsUI();
    updateAccentButtons();
    overlay.classList.remove("hidden");
  });
  if (closeBtn) closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });

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

  if (scrollMode === "classic") {
    // Убираем отступы, добавленные колесом
    list.style.paddingTop = "";
    list.style.paddingBottom = "";
    // Прокручиваем наверх
    list.scrollTop = 0;
  } else {
    // Колёсный режим — пересчитаем отступы (setPadding вызовется из setupWheel)
    if (typeof refreshWheelLayout === "function") refreshWheelLayout();
    if (typeof updateWheelFromScroll === "function") updateWheelFromScroll();
  }
}

// Сохранить режим при старте — сделать это до initApp
(function initScrollMode() {
  try {
    const saved = localStorage.getItem(SCROLL_MODE_KEY);
    if (saved === "classic" || saved === "wheel") {
      scrollMode = saved;
    } else {
      scrollMode = "classic"; // по умолчанию — классический
    }
  } catch (e) { scrollMode = "classic"; }
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
  icon.src = cb.checked ? ICONS.checkboxOn : ICONS.checkboxOff;
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
      <button class="attach-preview-remove" data-remove-idx="${i}" title="Убрать">✕</button>
    </div>`;
  }).join("");

  // Обновляем заголовок
  const titleEl = document.getElementById("attach-preview-title");
  if (titleEl) {
    const firstKind = detectFileKind(attachPendingFiles[0]);
    if (firstKind === "image") titleEl.textContent = "Отправить изображение";
    else if (firstKind === "video") titleEl.textContent = "Отправить видео";
    else titleEl.textContent = "Отправить файл";
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
// 45. АВТОЗАПУСК (в самом конце — чтобы все переменные,
// включая scrollMode и SCROLL_MODE_KEY, уже были объявлены)
// ======================================================

const { data: { session } } = await supabase.auth.getSession();
if (session) showApp(session.user);
// ======================================================
// Imaginer
// ======================================================

const SUPABASE_URL = "https://uiktqkxfsoewjpgjpizf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3Rxa3hmc29ld2pwZ2pwaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODY5MjksImV4cCI6MjEwNDg2MjkyOX0.2OC3vrfusHK6Lqv1Yh5KfZ42Ypm02sE1XAloTSUxo2k";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ACCENTS = ["orange", "blue", "green", "red", "purple", "pink", "teal", "gray"];
const ACCENT_COLORS = { orange:"#ff8c42",blue:"#2196f3",green:"#4caf50",red:"#f44336",purple:"#9c27b0",pink:"#e91e63",teal:"#009688",gray:"#607d8b" };
const BASE_AVATARS = [["#ff8c42","#ffb37a"],["#2196f3","#64b5f6"],["#4caf50","#81c784"],["#f44336","#ef9a9a"],["#9c27b0","#ce93d8"],["#e91e63","#f48fb1"],["#009688","#4db6ac"],["#607d8b","#90a4ae"]];
const REACTION_EMOJIS = ["👍","👎","❤️","🤣","🤮","🤯","🤬","😡","🎉","😅"];

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
let channelUsernameCheckTimeout = null;
let channelUsernameValidated = null;
let channelProfileChannelId = null;
let currentChannelIsSubscribed = false;
let currentChannelViewsMap = new Map();
let currentChannelTotalViews = 0;
let currentChannelViewsChannel = null;
let contextChannelForMenu = null;
let usernameCheckTimeout = null, validatedUsername = null, reactionsRefreshTimer = null;
let giftCatalogCache = [];
let lastSeenInterval = null, otherUserInterval = null, statusPollInterval = null, deliveredInterval = null;

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
  initApp();
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
  setupForwardDialog(); setupReplyBar(); setupProfilePanel(); setupGiftsUI();
  setupBirthdayClose(); setupTokensDialog(); setupChannelCreate();
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

  document.addEventListener("visibilitychange", () => {
    updateMyLastSeen();
    if (document.visibilityState === "visible") {
      pollMyMessageStatuses();
      if (currentChatId) markChatRead(currentChatId);
    }
  });
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

function showChoiceDialog(title, text, options, confirmLabel) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const optionsEl = document.getElementById("dialog-options");
    const confirmBtn = document.getElementById("dialog-confirm");
    const cancelBtn = document.getElementById("dialog-cancel");
    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-text").textContent = text;
    confirmBtn.textContent = confirmLabel || "Подтвердить"; confirmBtn.disabled = true;
    cancelBtn.style.display = "";
    let selected = null; optionsEl.innerHTML = "";
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "dialog-option"; b.textContent = opt.label;
      b.addEventListener("click", () => {
        optionsEl.querySelectorAll(".dialog-option").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected"); selected = opt.value; confirmBtn.disabled = false;
      });
      optionsEl.appendChild(b);
    });
    overlay.classList.remove("hidden");
    function cleanup() { overlay.classList.add("hidden"); confirmBtn.onclick = null; cancelBtn.onclick = null; }
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

  const grid = document.getElementById("accent-grid");
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

  document.getElementById("profile-username").addEventListener("input", (e) => {
    clearTimeout(usernameCheckTimeout); validatedUsername = null;
    const value = e.target.value;
    usernameCheckTimeout = setTimeout(() => checkUsernameLive(value), 350);
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

  // Календарик: открывает нативный date-picker и подставляет выбранную дату
  const bdCalendarBtn = document.getElementById("profile-birthday-calendar");
  const bdPicker = document.getElementById("profile-birthday-picker");
  if (bdCalendarBtn && bdPicker) {
    bdCalendarBtn.addEventListener("click", () => {
      // Синхронизируем с текущим текстом, если он в валидном формате
      const cur = document.getElementById("profile-birthday").value.trim();
      const norm = normalizeBirthday(cur);
      if (norm) {
        const parts = norm.split(".");
        if (parts.length === 3) {
          const y = parts[2].length === 2 ? "20" + parts[2] : parts[2];
          bdPicker.value = `${y}-${parts[1]}-${parts[0]}`;
        } else if (parts.length === 2) {
          bdPicker.value = `2000-${parts[1]}-${parts[0]}`;
        }
      }
      if (bdPicker.showPicker) bdPicker.showPicker();
      else bdPicker.click();
    });
    bdPicker.addEventListener("change", () => {
      const v = bdPicker.value; if (!v) return;
      const [y, m, d] = v.split("-");
      const inp = document.getElementById("profile-birthday");
      inp.value = `${d}.${m}.${y}`;
      draftProfile.birthday = inp.value;
      markProfileDirty();
    });
  }
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
  updateAccentButtons(); renderAvatarGrid();
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
async function openUserProfileDialog() {
  const user = currentOtherUser || pendingOtherUser;
  if (!user) return;
  const overlay = document.getElementById("user-profile-overlay");
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
  if (currentChatId) {
    const { data: msgs } = await supabase.from("messages").select("id").eq("chat_id", currentChatId);
    msgCount = (msgs || []).filter((m) => !hiddenMsgIds.has(m.id)).length;
  }
  document.getElementById("user-profile-msgcount").textContent = String(msgCount);
  const { count: totalGifts } = await supabase.from("user_gifts")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id).eq("in_profile", true);
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
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "channels" }, (payload) => {
      const ch = payload.new; if (!ch) return;
      channelCache.set(ch.id, ch);
      const el = document.querySelector(`.user-item[data-chat-id="${ch.id}"][data-chat-type="channel"]`);
      if (el) {
        const nameEl = el.querySelector(".user-item-name");
        if (nameEl) nameEl.innerHTML = escapeHtml(ch.name) + '<span class="channel-mark">📢</span>';
        paintAvatar(el.querySelector(".avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
      }
    })
    .subscribe();
}

function subscribeToMemberships() {
  if (membershipChannel) return;
  membershipChannel = supabase.channel("membership-changes")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_members" }, async (payload) => {
      if (currentChannelObj && currentChannelObj.id === payload.new.chat_id) {
        await updateChannelSubtitle(payload.new.chat_id);
        if (payload.new.user_id === currentUser.id) {
          currentChannelIsSubscribed = true;
          await updateChannelComposerState();
        }
      }
      if (payload.new.user_id === currentUser.id) {
        const chatId = payload.new.chat_id;
        if (document.querySelector(`.user-item[data-chat-id="${chatId}"]`)) return;
        const { data: ch } = await supabase.from("channels").select("*").eq("id", chatId).maybeSingle();
        if (ch) { await addOrUpdateChannelInList(chatId, ch); return; }
        const { data: others } = await supabase.from("chat_members")
          .select("user_id").eq("chat_id", chatId).neq("user_id", currentUser.id);
        if (others && others.length) await addOrUpdateChatInList(chatId, others[0].user_id);
      }
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_members" }, (payload) => {
      if (currentChannelObj && currentChannelObj.id === payload.old.chat_id) {
        updateChannelSubtitle(payload.old.chat_id);
        if (payload.old.user_id === currentUser.id) {
          currentChannelIsSubscribed = false;
          updateChannelComposerState();
        }
      }
      if (payload.old && payload.old.user_id === currentUser.id) {
        const chatId = payload.old.chat_id;
        if (currentChatId === chatId) closeCurrentChat();
        removeChatFromList(chatId);
        channelCache.delete(chatId);
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
             : (m.content || ""),
        time, senderId: m.sender_id,
        unread: isMine ? (prev.unread || 0) : (prev.unread || 0) + 1,
      });
      if (!document.getElementById("search-input").value.trim()) {
        updateChatItemPreview(m.chat_id);
        resortChatsList();
      }
      if (currentChatId === m.chat_id && !isMine) {
        setTimeout(() => markChatRead(m.chat_id), 300);
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
        : stripMarkdown(it.lastMsg.content || ""))
      : "";
    chatLastMsg.set(it.chat_id, { text: preview, time: it.lastTime, senderId: it.lastMsg ? it.lastMsg.sender_id : null, unread: it.unread });
  });
  channelItems.forEach((it) => {
    const preview = it.lastMsg
      ? (it.lastMsg.message_type === "tokens" ? `🧩 +${it.lastMsg.tokens_amount}`
        : it.lastMsg.message_type === "gift" ? "🎁 Подарок"
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
    openChatWith(user);
  });
  el.addEventListener("contextmenu", (ev) => { ev.preventDefault(); openChatListContextMenu(ev, user, el); });
}

function renderChatListUnified(items, profileMap) {
  const listEl = document.getElementById("users-list");
  if (!items.length) { listEl.innerHTML = '<div class="empty">У вас пока нет чатов.</div>'; return; }
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
}

function renderDmItemHtml(it, profileMap) {
  const user = profileMap.get(it.user_id);
  if (!user) return "";
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
  const preview = it.lastMsg
    ? (it.lastMsg.message_type === "tokens" ? `🧩 +${it.lastMsg.tokens_amount}`
      : it.lastMsg.message_type === "gift" ? "🎁 Подарок"
      : stripMarkdown(it.lastMsg.content || ""))
    : "Нет сообщений";
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
  if (currentChannelIsAdmin) {
    composer.classList.remove("hidden");
    actionBar.classList.add("hidden");
  } else {
    composer.classList.add("hidden");
    actionBar.classList.remove("hidden");
    if (currentChannelIsSubscribed) {
      subBtn.textContent = "Отписаться";
      subBtn.classList.add("unsub");
    } else {
      subBtn.textContent = "Подписаться";
      subBtn.classList.remove("unsub");
    }
  }
}

async function openChannel(chatId) {
  // СРАЗУ скрываем composer синхронно, до любых await — иначе мелькнёт
  document.getElementById("composer").classList.add("hidden");
  document.getElementById("channel-action-bar").classList.add("hidden");

  // Чистим поле поиска и крестик — чтобы поиск не оставался активным
  const _sInput = document.getElementById("search-input");
  const _sClear = document.getElementById("search-clear");
  if (_sInput && _sInput.value.trim()) _sInput.value = "";
  if (_sClear) _sClear.classList.add("hidden");

  const { data: ch } = await supabase.from("channels").select("*").eq("id", chatId).maybeSingle();
  if (!ch) { await showAlertDialog("Ошибка", "Канал не найден"); return; }
  channelCache.set(chatId, ch);
  currentChannelObj = ch;
  currentOtherUser = null; pendingOtherUser = null;
  currentChannelViewsMap = new Map();
  currentChannelTotalViews = 0;

  // ВАЖНО: сброс состояний ДО скрытия composer, потому что exitSelectionMode() его показывает
  exitSelectionMode(); cancelReply(); cancelEdit(); closeReactionPicker();
  document.getElementById("composer").classList.add("hidden");
  document.getElementById("channel-action-bar").classList.add("hidden");

  paintAvatar(document.getElementById("chat-avatar"), { id: ch.id, display_name: ch.name, avatar_url: ch.avatar_url });
  document.getElementById("chat-title").textContent = ch.name;
  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-content").classList.remove("hidden");
  document.getElementById("chat-menu").classList.add("hidden");

  // Подписан ли я?
  const { data: mem } = await supabase.from("chat_members")
    .select("chat_id").eq("chat_id", ch.id).eq("user_id", currentUser.id).maybeSingle();
  currentChannelIsSubscribed = !!mem;

  currentChannelIsAdmin = await checkChannelAdmin(ch.id, currentUser.id);
  await updateChannelSubtitle(ch.id);
  await updateChannelComposerState();
  configureChatMenuForChannel(ch);

  currentChatId = chatId;
  // Подписку на просмотры — ДО loadMessages, чтобы catch-нуть чужие просмотры,
  // которые могут прийти пока мы рендерим сообщения
  subscribeToChannelViews(chatId);
  await loadMessages(chatId);
  await loadReactionsForVisibleMessages();
  subscribeToChat(chatId);
  subscribeToReactions();

  if (currentChannelIsSubscribed) await markChatRead(chatId);
}

function updateChatItemPreview(chatId) {
  const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`); if (!el) return;
  const data = chatLastMsg.get(chatId); if (!data) return;
  const isChannel = el.dataset.chatType === "channel";
  const previewEl = el.querySelector(".user-item-preview");
  const timeEl = el.querySelector(".user-item-time");
  let preview = stripMarkdown(data.text) || "Нет сообщений";
  if (!isChannel && preview && !preview.startsWith("🧩") && !preview.startsWith("🎁") && data.senderId === currentUser.id) {
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
}

async function addOrUpdateChatInList(chatId, otherUserId) {
  if (document.getElementById("search-input").value.trim()) return;
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
}

function removeChatFromList(chatId) {
  const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
  if (el) el.remove();
  chatLastMsg.delete(chatId);
  for (const [uid, cid] of chatIdByUser.entries()) if (cid === chatId) chatIdByUser.delete(uid);
  const listEl = document.getElementById("users-list");
  if (listEl.querySelectorAll(".user-item").length === 0) listEl.innerHTML = '<div class="empty">У вас пока нет чатов.</div>';
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

  const channels = channelsRes.data || [];
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
  renderSearchResultsUnified(allProfiles, channels);
}

function renderSearchResultsUnified(users, channels) {
  const listEl = document.getElementById("users-list");
  if (!users.length && !channels.length) { listEl.innerHTML = '<div class="empty">Пусто</div>'; return; }

  const channelsHtml = channels.map((ch) => `
    <div class="user-item" data-chat-type="channel-search" data-channel-id="${ch.id}">
      <div class="avatar"></div>
      <div class="user-item-body">
        <div class="user-item-row1"><div class="user-item-name">${escapeHtml(ch.name)}<span class="channel-mark">📢</span></div></div>
        <div class="user-item-row2"><div class="user-item-preview">@${escapeHtml(ch.username)}</div></div>
      </div>
    </div>`).join("");

  const usersHtml = users.map((u) => {
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
  }).join("");

  listEl.innerHTML = channelsHtml + usersHtml;

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
    removeChatFromList(ch.id);
    channelCache.delete(ch.id);
    if (currentChannelObj && currentChannelObj.id === ch.id) {
      currentChannelIsSubscribed = false;
      await updateChannelComposerState();
      await updateChannelSubtitle(ch.id);
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
  currentOtherUser = otherUser; pendingOtherUser = null;
  currentChannelObj = null; currentChannelIsAdmin = false;
  document.getElementById("message-input").setAttribute("contenteditable", "true");
  document.getElementById("message-input").setAttribute("data-placeholder", "Написать сообщение...");
  resetChatMenuToDm();
  document.getElementById("composer").classList.remove("hidden");
  document.getElementById("channel-action-bar").classList.add("hidden");
  const searchInput = document.getElementById("search-input");
  if (searchInput && searchInput.value.trim()) {
    searchInput.value = "";
    setTimeout(() => { if (!currentOtherUser) loadRecentChats(); }, 50);
  }
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
  if (!chatId) {
    const { data: myMemberships } = await supabase.from("chat_members").select("chat_id").eq("user_id", currentUser.id);
    const myChatIds = (myMemberships || []).map((m) => m.chat_id);
    if (myChatIds.length) {
      const { data: shared } = await supabase.from("chat_members")
        .select("chat_id").eq("user_id", otherUser.id).in("chat_id", myChatIds).limit(1);
      if (shared && shared.length) { chatId = shared[0].chat_id; chatIdByUser.set(otherUser.id, chatId); }
    }
  }
  if (!chatId) {
    currentChatId = null; pendingOtherUser = otherUser;
    document.getElementById("messages").innerHTML = '<div class="empty">Здесь пока нет сообщений. Напишите первым!</div>';
    msgCache.clear(); reactionsCache.clear();
    if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
    if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
    return;
  }
  currentChatId = chatId;
  await loadMessages(chatId);
  await loadReactionsForVisibleMessages();
  subscribeToChat(chatId); subscribeToReactions();
  await markChatRead(chatId);
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
    const el = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
    if (el) {
      const badge = el.querySelector(".unread-badge"); if (badge) badge.remove();
      const prev = el.querySelector(".user-item-preview"); if (prev) prev.classList.remove("unread");
    }
  } catch (e) { /* silent */ }
}

// ======================= 14. СООБЩЕНИЯ =======================
async function loadMessages(chatId) {
  const box = document.getElementById("messages");
  box.innerHTML = '<div class="empty">Загрузка...</div>';
  msgCache.clear(); hiddenMsgIds = new Set(); reactionsCache.clear();
  currentChannelViewsMap = new Map();

  const { data: hides } = await supabase.from("message_hides").select("message_id").eq("user_id", currentUser.id);
  hiddenMsgIds = new Set((hides || []).map((h) => h.message_id));
  const { data: clearRow } = await supabase.from("chat_clears").select("cleared_at")
    .eq("chat_id", chatId).eq("user_id", currentUser.id).maybeSingle();

  let query = supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
  if (clearRow && clearRow.cleared_at) query = query.gt("created_at", clearRow.cleared_at);
  const { data, error } = await query;
  if (error) { box.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }

  box.innerHTML = "";
  const all = data || [];
  all.forEach((m) => msgCache.set(m.id, m));
  const visible = all.filter((m) => !hiddenMsgIds.has(m.id));

  // ВАЖНО: используем currentChannelObj, а не channelCache
  const isChannel = currentChannelObj && currentChannelObj.id === chatId;

  if (visible.length === 0) {
    box.innerHTML = isChannel
      ? '<div class="empty">В этом канале пока что нет сообщений.</div>'
      : '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
    return;
  }

  // Счётчики просмотров — только для канала
  if (isChannel) {
    const ids = visible.map((m) => m.id);
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { data: views } = await supabase.rpc("get_message_view_counts", { p_message_ids: chunk });
      (views || []).forEach((v) => currentChannelViewsMap.set(v.message_id, Number(v.views) || 0));
    }
  }

  for (const m of visible) await appendMessage(m);
  scrollToBottom();

  // Отправляем свои просмотры — только для канала, только для чужих сообщений.
  // Если запись реально создалась — локально +1, чтобы сразу увидеть свой просмотр.
  // Чужие просмотры прилетят через realtime (subscribeToChannelViews).
  if (isChannel) {
    const nonMyMsgs = visible.filter((m) => m.sender_id !== currentUser.id);
    for (const m of nonMyMsgs) {
      const { data: wasInserted, error: mvErr } = await supabase.rpc("mark_message_viewed", { p_message_id: m.id });
      if (mvErr) {
        console.error("mark_message_viewed FAILED:", mvErr, "msgId:", m.id);
        continue;
      }
      console.log("[views] msg", m.id, "inserted:", wasInserted);
      if (wasInserted) {
        const cur = currentChannelViewsMap.get(m.id) || 0;
        currentChannelViewsMap.set(m.id, cur + 1);
        updateMessageViewsInUI(m.id, cur + 1);
      }
    }
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
      text = `<b>Вы</b> отправили <b>${msg.tokens_amount}</b> 🧩`;
    } else {
      const g = sender ? sender.gender : null;
      let v;
      if (g === "female") v = "отправила вам";
      else if (g === "male") v = "отправил вам";
      else v = "отправил(а) вам";
      text = `<b>${escapeHtml(senderName)}</b> ${v} <b>${msg.tokens_amount}</b> 🧩 ImagiTokens`;
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
      <span class="msg-system-text">${senderName} ${verb} подарок за <b>${cat.price}</b> 🧩</span>
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
    const preview = (orig.content || "").slice(0, 60);
    html += `<div class="msg-reply" data-scroll-to="${msg.reply_to_id}">
      <span class="msg-reply-name">В ответ ${escapeHtml(origName)}</span>
      <span class="msg-reply-text">${escapeHtml(preview)}</span>
    </div>`;
  }
  html += `<div class="msg-text">${applyFormatting(escapeHtml(msg.content || ""))}</div>`;
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
  const target = document.querySelector(`.msg[data-id="${id}"]`);
  if (!target) return;
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
  box.scrollTop = box.scrollHeight;
}

function checkEmptyChat() {
  const box = document.getElementById("messages");
  if (box.children.length === 0) {
    box.innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
  }
}

// ======================================================
// 15. КОМПОЗЕР
// ======================================================

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
  if (currentChannelObj && currentChannelObj.id === chatId && !currentChannelIsAdmin) {
    await showAlertDialog("Нельзя", "Только администраторы могут писать в этом канале");
    return;
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
            const { data: wasInserted, error: mvErr } = await supabase.rpc("mark_message_viewed", { p_message_id: m.id });
            if (mvErr) console.error("mark_message_viewed (rt):", mvErr);
            if (wasInserted) {
              const cur = currentChannelViewsMap.get(m.id) || 0;
              currentChannelViewsMap.set(m.id, cur + 1);
              updateMessageViewsInUI(m.id, cur + 1);
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
      // Этап 4 — редактирование. Пока заглушка.
      await showAlertDialog("Настройки канала", "Редактирование канала — следующий этап");
    } else if (action === "channel-delete") {
      await deleteChannelDialog();
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
      await showAlertDialog("Изменить канал", "Редактирование канала — следующий этап");
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
  currentChatId = null; currentOtherUser = null; pendingOtherUser = null;
  currentChannelObj = null; currentChannelIsAdmin = false;
  currentChannelIsSubscribed = false;
  currentChannelViewsMap = new Map();
  currentChannelTotalViews = 0;
  if (currentChannelViewsChannel) { supabase.removeChannel(currentChannelViewsChannel); currentChannelViewsChannel = null; }
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
  cancelReply(); cancelEdit(); exitSelectionMode(); closeReactionPicker();
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
}

function openMsgContextMenu(e, msgId) {
  if (selectionMode) return;
  e.preventDefault(); e.stopPropagation();
  contextMsgId = msgId;
  const msg = msgCache.get(msgId);
  const editBtn = document.querySelector('#msg-context-menu button[data-action="edit"]');
  const replyBtn = document.querySelector('#msg-context-menu button[data-action="reply"]');
  const fwdBtn = document.querySelector('#msg-context-menu button[data-action="fwd"]');
  const isGift = msg && msg.message_type === "gift";
  const isTokens = msg && msg.message_type === "tokens";
  const isChannelMsg = msg && msg.chat_id && channelCache.has(msg.chat_id);

  if (editBtn) editBtn.classList.add("hidden");

  if (isChannelMsg) {
    if (replyBtn) replyBtn.classList.remove("hidden");
    if (fwdBtn) fwdBtn.classList.add("hidden");
    if (editBtn && msg && msg.sender_id === currentUser.id && !msg.forwarded_from_name) editBtn.classList.remove("hidden");
  } else if (isGift) {
    if (replyBtn) replyBtn.classList.remove("hidden");
    if (fwdBtn) fwdBtn.classList.add("hidden");
  } else if (isTokens) {
    if (replyBtn) replyBtn.classList.add("hidden");
    if (fwdBtn) fwdBtn.classList.add("hidden");
  } else {
    if (replyBtn) replyBtn.classList.remove("hidden");
    if (fwdBtn) fwdBtn.classList.remove("hidden");
    if (editBtn && msg && msg.sender_id === currentUser.id && !msg.forwarded_from_name) editBtn.classList.remove("hidden");
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
  // В канале — только "удалить у всех"
  if (currentChannelObj) {
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

async function handleForwardOne(msgId) {
  const msg = msgCache.get(msgId);
  if (!msg) return;
  if (msg.message_type === "tokens" || msg.message_type === "gift") return;
  await openForwardDialog([msg]);
}

async function openForwardDialog(msgs) {
  forwardSourceMsgs = msgs;
  forwardSelectedChats.clear();
  document.getElementById("forward-hide-sender").checked = false;
  document.getElementById("forward-overlay").classList.remove("hidden");
  document.getElementById("forward-list").innerHTML = '<div class="empty">Загрузка...</div>';
  await populateForwardList();
  updateForwardInfo();
}

async function populateForwardList() {
  const listEl = document.getElementById("forward-list");
  const { data: myChats } = await supabase.from("chat_members").select("chat_id").eq("user_id", currentUser.id);
  const chatIds = (myChats || []).map((c) => c.chat_id);
  if (!chatIds.length) { listEl.innerHTML = '<div class="empty">Нет чатов</div>'; return; }

  const { data: others } = await supabase.from("chat_members")
    .select("chat_id, user_id").in("chat_id", chatIds).neq("user_id", currentUser.id);
  const userIds = [...new Set((others || []).map((o) => o.user_id))];
  const { data: profiles } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url").in("id", userIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const items = (others || []).map((o) => ({ chat_id: o.chat_id, user: profileMap.get(o.user_id) })).filter((x) => x.user);
  if (!items.length) { listEl.innerHTML = '<div class="empty">Нет чатов</div>'; return; }

  listEl.innerHTML = items.map((x) =>
    `<div class="forward-item" data-chat-id="${x.chat_id}">
      <div class="avatar"></div>
      <div class="fname">${escapeHtml(x.user.display_name)}</div>
      <div class="fcheck hidden">✓</div>
    </div>`
  ).join("");

  listEl.querySelectorAll(".forward-item").forEach((el) => {
    const chatId = el.dataset.chatId;
    const item = items.find((x) => x.chat_id === chatId);
    paintAvatar(el.querySelector(".avatar"), item.user);
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
    if (selectionMode) exitSelectionMode();
  });
  document.getElementById("forward-send").addEventListener("click", sendForward);
}

async function sendForward() {
  if (!forwardSelectedChats.size || !forwardSourceMsgs.length) return;
  const hideSender = document.getElementById("forward-hide-sender").checked;
  const senderMap = new Map();
  if (!hideSender) {
    for (const m of forwardSourceMsgs) {
      if (senderMap.has(m.sender_id)) continue;
      const p = await getProfile(m.sender_id);
      senderMap.set(m.sender_id, p || { display_name: "?", username: "?" });
    }
  }
  for (const chatId of forwardSelectedChats) {
    for (const m of forwardSourceMsgs) {
      const payload = { chat_id: chatId, sender_id: currentUser.id, content: m.content };
      if (!hideSender) {
        const s = senderMap.get(m.sender_id) || { display_name: "?", username: "?" };
        payload.forwarded_from_name = s.display_name;
        payload.forwarded_from_username = s.username;
      }
      await supabase.from("messages").insert(payload);
    }
  }
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

function giftBackgroundStyle(bg, bgType) {
  if (!bg) return "background: var(--bg-input);";
  if (bgType === "gradient") {
    const [c1, c2] = bg.split("|");
    return `background: linear-gradient(135deg, ${c1}, ${c2});`;
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
  const { data: gifts } = await giftsQuery.order("created_at", { ascending: false });

  const catalog = await loadGiftCatalog();
  const catalogMap = new Map(catalog.map((g) => [g.id, g]));

  let html = "";
  // Кнопка покупки — и для себя, и для собеседника
  html += `<button class="gift-card-button" style="width:100%;padding:12px;margin-bottom:12px;" id="open-catalog-btn">🛍️ Купить подарок${!isMe ? " для " + escapeHtml((profileCache.get(userId) || {}).display_name || "") : ""}</button>`;

  if (!gifts || gifts.length === 0) {
    html += isMe
      ? `<div class="empty">У вас пока нет подарков.</div>`
      : `<div class="empty">У этого пользователя нет подарков.</div>`;
  } else {
    gifts.forEach((ug) => {
      const cat = catalogMap.get(ug.gift_id);
      if (!cat) return;
      const bg = giftBackgroundStyle(ug.background, ug.background_rarity);
      // Кто изначально купил
      const originalOwner = ug.original_owner_id ? profileCache.get(ug.original_owner_id) : null;
      const origLabel = originalOwner ? ` · от ${escapeHtml(originalOwner.display_name)}` : "";
      html += `
        <div class="gift-card" data-gift-ug-id="${ug.id}">
          <div class="gift-card-emoji" style="${bg}">${cat.emoji}</div>
          <div class="gift-card-body">
            <div class="gift-card-name">${escapeHtml(cat.name)} #${ug.serial_number}</div>
            <div class="gift-card-sub gift-rarity-${cat.rarity}">${giftRarityLabel(cat.rarity)}${cat.collection ? " · " + escapeHtml(cat.collection) : ""}${origLabel}</div>
          </div>
          <div class="gift-card-price">🧩 ${cat.price}</div>
        </div>`;
    });
  }

  content.innerHTML = html;

  const openBtn = document.getElementById("open-catalog-btn");
  if (openBtn) openBtn.addEventListener("click", () => renderCatalog(userId));

  content.querySelectorAll(".gift-card").forEach((el) => {
    el.addEventListener("click", () => {
      const ugId = el.dataset.giftUgId;
      const ug = gifts.find((g) => g.id === ugId);
      if (ug) renderGiftDetail(userId, ug);
    });
  });
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
    else if (!canAfford) btnText = `🧩 ${g.price} · мало`;
    else btnText = `🧩 ${g.price}`;
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
  const confirmBtn = document.getElementById("gift-purchase-confirm");
  const cancelBtn = document.getElementById("gift-purchase-cancel");

  const isSelf = recipientId === currentUser.id;
  const recipient = profileCache.get(recipientId);
  const recipientName = isSelf ? "себе" : (recipient ? recipient.display_name : "пользователю");

  titleEl.textContent = "Купить подарок " + recipientName;
  infoEl.textContent = `${gift.emoji} ${gift.name} — ${giftRarityLabel(gift.rarity)}${gift.collection ? " · " + gift.collection : ""}`;
  costEl.textContent = `Стоимость: 🧩 ${gift.price}`;
  captionInput.value = "";
  overlay.classList.remove("hidden");

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Покупаю...";
    const caption = captionInput.value.trim() || null;
    const { error } = await supabase.rpc("buy_gift", {
      p_gift_id: gift.id, p_recipient_id: recipientId, p_caption: caption,
    });
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Купить";
    if (error) { await showAlertDialog("Ошибка", error.message); return; }

    // Если подарок куплен другому — отправляем системное сообщение в чат
    if (!isSelf) {
      const chatId = chatIdByUser.get(recipientId);
      if (chatId) {
        // Найдём последний купленный подарок
        const { data: lastGift } = await supabase.from("user_gifts")
          .select("id").eq("owner_id", recipientId).eq("gift_id", gift.id)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (lastGift) {
          await supabase.from("messages").insert({
            chat_id: chatId,
            sender_id: currentUser.id,
            content: "",
            message_type: "gift",
            gift_ref_id: lastGift.id,
            delivered_at: new Date().toISOString(),
          });
        }
      }
    }

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

  // Кто изначально купил
  let originalOwnerHtml = "";
  if (ug.original_owner_id) {
    const op = profileCache.get(ug.original_owner_id) || await getProfile(ug.original_owner_id);
    if (op) originalOwnerHtml = `<div class="gift-detail-row"><span class="gdr-label">Купил(а)</span><span class="gdr-value">${escapeHtml(op.display_name)}</span></div>`;
  }
  let giftedFromHtml = "";
  if (ug.gifted_from && ug.gifted_from !== ug.original_owner_id) {
    const gp = profileCache.get(ug.gifted_from) || await getProfile(ug.gifted_from);
    if (gp) giftedFromHtml = `<div class="gift-detail-row"><span class="gdr-label">Подарил(а)</span><span class="gdr-value">${escapeHtml(gp.display_name)}</span></div>`;
  }
  let bgRow = "";
  if (ug.background_name) {
    bgRow = `<div class="gift-detail-row"><span class="gdr-label">Фон</span><span class="gdr-value">${escapeHtml(ug.background_name)}${ug.background_rarity === "gradient" ? " · градиент" : ""}</span></div>`;
  }

  content.innerHTML = `
    <div class="gift-detail">
      <div class="gift-detail-emoji" style="${bg}">${cat.emoji}</div>
      <div class="gift-detail-name">${escapeHtml(cat.name)} #${ug.serial_number}</div>
      <div class="gift-detail-sub gift-rarity-${cat.rarity}">${giftRarityLabel(cat.rarity)}${cat.collection ? " · " + escapeHtml(cat.collection) : ""}</div>
      <div class="gift-detail-rows">
        ${originalOwnerHtml}
        ${giftedFromHtml}
        ${bgRow}
        <div class="gift-detail-row"><span class="gdr-label">Стоимость</span><span class="gdr-value">🧩 ${cat.price}</span></div>
        <div class="gift-detail-row"><span class="gdr-label">Дата получения</span><span class="gdr-value">${formatDateTime(ug.created_at)}</span></div>
        ${ug.caption ? `<div class="gift-detail-row"><span class="gdr-label">Подпись</span><span class="gdr-value">${escapeHtml(ug.caption)}</span></div>` : ""}
      </div>
      <div class="gift-detail-actions">
        ${isOwner ? `
          <button class="dialog-btn ${isInProfile ? "dialog-cancel" : "dialog-primary"}" id="gift-toggle-visible">
            ${isInProfile ? "Скрыть из профиля" : "Добавить в профиль"}
          </button>
          <button class="dialog-btn" id="gift-send">🎁 Подарить</button>
          <button class="dialog-btn" id="gift-sell">💰 Продать за 🧩 ${Math.floor(cat.price * 0.85)}</button>
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
        `Продать за 🧩 ${Math.floor(cat.price * 0.85)} (комиссия 15%)?`, "Продать");
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
  document.getElementById("tokens-send-balance").textContent = `У вас: 🧩 ${balance}`;
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

const { data: { session } } = await supabase.auth.getSession();
if (session) showApp(session.user);

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
  // Кнопка подписки
  const subBtn = document.getElementById("channel-subscribe-btn");
  if (subBtn) subBtn.addEventListener("click", async () => {
    if (!currentChannelObj) return;
    subBtn.disabled = true;
    if (currentChannelIsSubscribed) {
      const { error } = await supabase.from("chat_members")
        .delete().eq("chat_id", currentChannelObj.id).eq("user_id", currentUser.id);
      subBtn.disabled = false;
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      currentChannelIsSubscribed = false;
      removeChatFromList(currentChannelObj.id);
    } else {
      // upsert с ignoreDuplicates — не упадёт, если запись уже есть
      const { error } = await supabase.from("chat_members").upsert(
        { chat_id: currentChannelObj.id, user_id: currentUser.id },
        { ignoreDuplicates: true }
      );
      subBtn.disabled = false;
      if (error) { await showAlertDialog("Ошибка", error.message); return; }
      currentChannelIsSubscribed = true;
      await addOrUpdateChannelInList(currentChannelObj.id, currentChannelObj);
    }
    await updateChannelSubtitle(currentChannelObj.id);
    await updateChannelComposerState();
  });
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
  ["channel-configure", "channel-delete"].forEach((a) => {
    const b = menu.querySelector(`[data-action="${a}"]`);
    if (b) b.classList.add("hidden");
  });
  const menuBtn = document.getElementById("chat-menu-btn");
  if (menuBtn) menuBtn.classList.remove("hidden");
}

function configureChatMenuForChannel(ch) {
  const menu = document.getElementById("chat-menu");
  ["tokens", "clear", "delete", "block"].forEach((a) => {
    const b = menu.querySelector(`[data-action="${a}"]`);
    if (b) b.classList.add("hidden");
  });
  const isOwner = ch.owner_id === currentUser.id;
  ["channel-configure", "channel-delete"].forEach((a) => {
    const b = menu.querySelector(`[data-action="${a}"]`);
    if (b) b.classList.toggle("hidden", !isOwner);
  });
  const menuBtn = document.getElementById("chat-menu-btn");
  if (menuBtn) menuBtn.classList.toggle("hidden", !isOwner);
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

  const menuBtn = document.getElementById("channel-profile-menu-btn");
  menuBtn.classList.toggle("hidden", ch.owner_id !== currentUser.id);
  document.getElementById("channel-profile-menu").classList.add("hidden");

  document.getElementById("channel-profile-overlay").classList.remove("hidden");
}

function closeChannelProfileDialog() {
  document.getElementById("channel-profile-overlay").classList.add("hidden");
  document.getElementById("channel-profile-menu").classList.add("hidden");
  channelProfileChannelId = null;
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
  // Очищаем поле поиска и крестик — чтобы поиск не оставался активным
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");
  if (searchInput) searchInput.value = "";
  if (clearBtn) clearBtn.classList.add("hidden");
  // Список чатов догружаем ФОНОМ, не блокируя открытие канала
  loadRecentChats().catch(() => {});
  await openChannel(ch.id);
}
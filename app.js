// ======================================================
// Imaginer
// ======================================================

const SUPABASE_URL = "https://uiktqkxfsoewjpgjpizf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3Rxa3hmc29ld2pwZ2pwaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODY5MjksImV4cCI6MjEwNDg2MjkyOX0.2OC3vrfusHK6Lqv1Yh5KfZ42Ypm02sE1XAloTSUxo2k";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ACCENTS = ["orange", "blue", "green", "red", "purple", "pink", "teal", "gray"];
const ACCENT_COLORS = {
  orange: "#ff8c42", blue: "#2196f3", green: "#4caf50", red: "#f44336",
  purple: "#9c27b0", pink: "#e91e63", teal: "#009688", gray: "#607d8b"
};

const BASE_AVATARS = [
  ["#ff8c42", "#ffb37a"],
  ["#2196f3", "#64b5f6"],
  ["#4caf50", "#81c784"],
  ["#f44336", "#ef9a9a"],
  ["#9c27b0", "#ce93d8"],
  ["#e91e63", "#f48fb1"],
  ["#009688", "#4db6ac"],
  ["#607d8b", "#90a4ae"],
];

const REACTION_EMOJIS = ["👍", "👎", "❤️", "🤣", "🤮", "🤯", "🤬", "😡", "🎉", "😅"];

// ======================================================
// 1. ВХОД / РЕГИСТРАЦИЯ
// ======================================================

const tabs = document.querySelectorAll(".tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const which = tab.dataset.tab;
    if (which === "login") {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    } else {
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    }
  });
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("register-error");
  errEl.textContent = "";
  const username = document.getElementById("reg-username").value.trim();
  const displayName = document.getElementById("reg-displayname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username, display_name: displayName } },
  });
  if (error) { errEl.textContent = error.message; return; }
  if (data.session) showApp(data.session.user);
  else {
    errEl.style.color = "var(--accent)";
    errEl.textContent = "Проверь почту и подтверди email.";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  errEl.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = error.message; return; }
  showApp(data.user);
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showAuth();
});

// ======================================================
// 2. СОСТОЯНИЕ
// ======================================================

let currentUser = null;
let myProfile = null;
let currentChatId = null;
let currentOtherUser = null;
let currentChannel = null;
let reactionsChannel = null;
let blocksChannel = null;
let globalChannel = null;
let profilesChannel = null;
let searchTimeout = null;
let myBlockedIds = new Set();
let blockedMeIds = new Set();
let hiddenMsgIds = new Set();
let msgCache = new Map();
let reactionsCache = new Map();
let replyToMsg = null;
let editingMsgId = null;
let selectionMode = false;
let selectedMsgIds = new Set();
let contextMsgId = null;
let contextChatUser = null;
let contextChatCustomName = null;
let forwardSourceMsgs = [];
let forwardSelectedChats = new Set();
let profileCache = new Map();
let cachedProfilesForBirthday = [];

let usernameCheckTimeout = null;
let validatedUsername = null;
let reactionsRefreshTimer = null;

// ======================================================
// 3. АКЦЕНТ / АВАТАРКИ
// ======================================================

function applyAccent(accent) {
  document.documentElement.setAttribute("data-accent", accent || "orange");
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function paintAvatar(el, user) {
  if (!el) return;
  const av = user && user.avatar_url;

  if (av && av.startsWith("data:")) {
    el.style.background = `url(${av}) center/cover`;
    el.textContent = "";
    return;
  }
  if (av && av.startsWith("color:")) {
    const idx = parseInt(av.split(":")[1], 10) || 0;
    const [c1, c2] = BASE_AVATARS[idx % BASE_AVATARS.length];
    el.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
    el.textContent = ((user.display_name || "?")[0] || "?").toUpperCase();
    return;
  }
  // Нет аватара — берём стабильный цвет по id, чтобы не зависел от акцента
  const seed = user && user.id ? user.id : (user && user.username) || "anon";
  const idx = hashCode(seed) % BASE_AVATARS.length;
  const [c1, c2] = BASE_AVATARS[idx];
  el.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  el.textContent = ((user && user.display_name || "?")[0] || "?").toUpperCase();
}

// ======================================================
// 4. ЭКРАНЫ
// ======================================================

function showApp(user) {
  currentUser = user;
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  initApp();
}

function showAuth() {
  currentUser = null; myProfile = null;
  currentChatId = null; currentOtherUser = null;
  myBlockedIds = new Set(); blockedMeIds = new Set();
  hiddenMsgIds = new Set(); msgCache.clear(); reactionsCache.clear();
  selectedMsgIds.clear(); forwardSelectedChats.clear(); profileCache.clear();
  cachedProfilesForBirthday = [];
  replyToMsg = null; editingMsgId = null; selectionMode = false;
  validatedUsername = null; contextChatUser = null; contextChatCustomName = null;
  [currentChannel, reactionsChannel, blocksChannel, globalChannel, profilesChannel]
    .forEach((ch) => ch && supabase.removeChannel(ch));
  currentChannel = reactionsChannel = blocksChannel = globalChannel = profilesChannel = null;
  applyAccent("orange");
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

// ======================================================
// 5. ИНИЦИАЛИЗАЦИЯ
// ======================================================

async function initApp() {
  await loadMyProfile();
  await loadBlocks();
  setupSearch();
  setupChatMenu();
  setupMessageMenu();
  setupSelectionToolbar();
  setupForwardDialog();
  setupReplyBar();
  setupProfilePanel();
  subscribeToBlocks();
  subscribeToGlobalChanges();
  subscribeToProfiles();
  await loadRecentChats();
  await checkBirthdays();

  await updateMyLastSeen();
  setInterval(() => {
    updateMyLastSeen();
    if (currentOtherUser) renderChatSubtitle();
  }, 30000);
}

async function loadMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, accent_color, gender, last_seen, birthday, created_at")
    .eq("id", currentUser.id).single();
  if (error) { console.error(error); return; }
  myProfile = data;
  profileCache.set(currentUser.id, data);

  applyAccent(data.accent_color || "orange");

  paintAvatar(document.getElementById("me-avatar"), data);
  document.getElementById("me-name").textContent = data.display_name;
  document.getElementById("me-username").textContent = "@" + data.username;
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

// ======================================================
// 6. УНИВЕРСАЛЬНЫЕ ДИАЛОГИ (замена alert / confirm / prompt)
// ======================================================

function showAlertDialog(title, text) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const optionsEl = document.getElementById("dialog-options");
    const confirmBtn = document.getElementById("dialog-confirm");
    const cancelBtn = document.getElementById("dialog-cancel");

    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-text").textContent = text || "";
    confirmBtn.textContent = "ОК";
    confirmBtn.disabled = false;
    optionsEl.innerHTML = "";
    cancelBtn.style.display = "none";

    overlay.classList.remove("hidden");

    function cleanup() {
      overlay.classList.add("hidden");
      confirmBtn.onclick = null; cancelBtn.onclick = null;
      cancelBtn.style.display = "";
    }
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
    confirmBtn.textContent = confirmLabel || "Да";
    confirmBtn.disabled = false;
    optionsEl.innerHTML = "";
    cancelBtn.style.display = "";

    overlay.classList.remove("hidden");

    function cleanup() {
      overlay.classList.add("hidden");
      confirmBtn.onclick = null; cancelBtn.onclick = null;
    }
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

    function cleanup() {
      overlay.classList.add("hidden");
      confirmBtn.onclick = null; cancelBtn.onclick = null; field.onkeydown = null;
    }
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
    confirmBtn.textContent = confirmLabel || "Подтвердить";
    confirmBtn.disabled = true;
    cancelBtn.style.display = "";

    let selected = null;
    optionsEl.innerHTML = "";
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "dialog-option";
      b.textContent = opt.label;
      b.addEventListener("click", () => {
        optionsEl.querySelectorAll(".dialog-option").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        selected = opt.value;
        confirmBtn.disabled = false;
      });
      optionsEl.appendChild(b);
    });

    overlay.classList.remove("hidden");

    function cleanup() {
      overlay.classList.add("hidden");
      confirmBtn.onclick = null; cancelBtn.onclick = null;
    }
    confirmBtn.onclick = () => { if (selected === null) return; cleanup(); resolve(selected); };
    cancelBtn.onclick = () => { cleanup(); resolve(null); };
  });
}

// ======================================================
// 7. ПРОФИЛЬ (свой)
// ======================================================

function setupProfilePanel() {
  document.getElementById("me-info-btn").addEventListener("click", openProfilePanel);
  document.getElementById("profile-close").addEventListener("click", () => {
    document.getElementById("profile-overlay").classList.add("hidden");
  });

  document.getElementById("avatar-upload").addEventListener("change", handleAvatarUpload);

  // Сетка акцентов
  const grid = document.getElementById("accent-grid");
  grid.innerHTML = "";
  ACCENTS.forEach((a) => {
    const d = document.createElement("div");
    d.className = "accent-option";
    d.dataset.accent = a;
    d.style.background = ACCENT_COLORS[a];
    d.title = a;
    grid.appendChild(d);
  });
  grid.addEventListener("click", async (e) => {
    const el = e.target.closest(".accent-option");
    if (!el) return;
    const accent = el.dataset.accent;
    applyAccent(accent);
    updateAccentButtons();
    await saveProfileField({ accent_color: accent });
  });

  // Username — живая проверка
  const usernameInput = document.getElementById("profile-username");
  usernameInput.addEventListener("input", (e) => {
    clearTimeout(usernameCheckTimeout);
    validatedUsername = null;
    const value = e.target.value;
    usernameCheckTimeout = setTimeout(() => checkUsernameLive(value), 350);
  });
  usernameInput.addEventListener("blur", trySaveUsername);
  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); trySaveUsername(); }
  });

  // Смена имени
  const dispInput = document.getElementById("profile-displayname");
  dispInput.addEventListener("blur", async () => {
    const newName = dispInput.value.trim();
    if (!newName || newName === myProfile.display_name) return;
    await saveProfileField({ display_name: newName });
    document.getElementById("me-name").textContent = newName;
  });
  dispInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); dispInput.blur(); }
  });

  // Пол
  document.getElementById("gender-toggle").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-gender]");
    if (!btn) return;
    const g = btn.dataset.gender;
    myProfile.gender = g;
    updateGenderButtons();
    await saveProfileField({ gender: g });
    if (currentOtherUser) renderChatSubtitle();
  });

  // День рождения
  const bdInput = document.getElementById("profile-birthday");
  bdInput.addEventListener("change", async () => {
    const val = bdInput.value || null;
    myProfile.birthday = val;
    await saveProfileField({ birthday: val });
  });
}

async function openProfilePanel() {
  if (!myProfile) return;
  document.getElementById("profile-overlay").classList.remove("hidden");

  paintAvatar(document.getElementById("profile-avatar-preview"), myProfile);
  updateAccentButtons();
  renderAvatarGrid();

  document.getElementById("profile-displayname").value = myProfile.display_name || "";
  document.getElementById("profile-birthday").value = myProfile.birthday || "";
  updateGenderButtons();

  const usernameInput = document.getElementById("profile-username");
  usernameInput.value = myProfile.username;
  validatedUsername = myProfile.username;
  const hint = document.getElementById("username-hint");
  hint.className = "username-hint";
  hint.textContent = "";
}

function renderAvatarGrid() {
  const grid = document.getElementById("avatar-grid");
  grid.innerHTML = "";
  BASE_AVATARS.forEach((pair, idx) => {
    const el = document.createElement("div");
    el.className = "avatar-option";
    el.dataset.idx = idx;
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
  document.querySelectorAll(".accent-option").forEach((el) => {
    el.classList.toggle("selected", el.dataset.accent === cur);
  });
}

function updateGenderButtons() {
  const cur = (myProfile && myProfile.gender) || "unset";
  document.querySelectorAll("#gender-toggle button").forEach((b) => {
    b.classList.toggle("active", b.dataset.gender === cur);
  });
}

async function saveProfileField(fields) {
  Object.assign(myProfile, fields);
  const { error } = await supabase.from("profiles")
    .update(fields).eq("id", currentUser.id);
  if (error) console.error("Не удалось сохранить профиль:", error);
}

async function handleAvatarUpload(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;

  const dataUrl = await resizeImage(file, 200);
  if (!dataUrl) return;

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
        if (width > height) {
          if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
        }
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
  const username = value.trim();
  validatedUsername = null;

  if (!username) { hint.className = "username-hint"; hint.textContent = ""; return; }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    hint.className = "username-hint err";
    hint.textContent = "Только английские буквы, цифры, _ и -";
    return;
  }
  if (username.length < 3) {
    hint.className = "username-hint err";
    hint.textContent = "Минимум 3 символа";
    return;
  }
  if (myProfile && username.toLowerCase() === myProfile.username.toLowerCase()) {
    hint.className = "username-hint ok";
    hint.textContent = "Это ваш текущий юзернейм";
    validatedUsername = username;
    return;
  }

  hint.className = "username-hint";
  hint.textContent = "Проверяю...";

  const { data, error } = await supabase
    .from("profiles").select("id")
    .ilike("username", username).neq("id", currentUser.id).limit(1);

  if (document.getElementById("profile-username").value.trim() !== username) return;

  if (error) {
    hint.className = "username-hint err";
    hint.textContent = "Ошибка проверки";
    return;
  }
  if (data && data.length > 0) {
    hint.className = "username-hint err";
    hint.textContent = `@${username} уже занят`;
    validatedUsername = null;
  } else {
    hint.className = "username-hint ok";
    hint.textContent = `@${username} свободен`;
    validatedUsername = username;
  }
}

async function trySaveUsername() {
  const input = document.getElementById("profile-username");
  const username = input.value.trim();
  if (!username) return;
  if (username === myProfile.username) return;
  if (username !== validatedUsername) return;

  const hint = document.getElementById("username-hint");
  const { error } = await supabase.from("profiles")
    .update({ username }).eq("id", currentUser.id);

  if (error) {
    const msg = String(error.message || "");
    if (msg.toLowerCase().includes("duplicate") || error.code === "23505") {
      hint.className = "username-hint err";
      hint.textContent = `@${username} уже занят`;
    } else {
      hint.className = "username-hint err";
      hint.textContent = "Не удалось сохранить";
    }
    return;
  }
  myProfile.username = username;
  document.getElementById("me-username").textContent = "@" + username;
  hint.className = "username-hint ok";
  hint.textContent = "Сохранено";
}

// ======================================================
// 8. ПРОФИЛЬ СОБЕСЕДНИКА
// ======================================================

async function openUserProfileDialog() {
  if (!currentOtherUser || !currentChatId) return;
  const overlay = document.getElementById("user-profile-overlay");
  const user = currentOtherUser;

  const { data: freshProfile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at, last_seen, gender, birthday")
    .eq("id", user.id).single();

  const p = freshProfile || user;

  paintAvatar(document.getElementById("user-profile-avatar"), p);
  document.getElementById("user-profile-name").textContent = p.display_name || "—";

  const statusEl = document.getElementById("user-profile-status");
  statusEl.textContent = formatLastSeen(p);
  statusEl.classList.toggle("online", isUserOnline(p));

  document.getElementById("user-profile-username").textContent = "@" + (p.username || "");

  if (p.birthday) {
    const d = new Date(p.birthday);
    document.getElementById("user-profile-birthday").textContent =
      d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) +
      " " + d.getFullYear();
  } else {
    document.getElementById("user-profile-birthday").textContent = "—";
  }

  document.getElementById("user-profile-created").textContent =
    p.created_at ? new Date(p.created_at).toLocaleDateString("ru-RU") : "—";

  // Считаем ВСЕ видимые мне сообщения в чате
  const { data: msgs } = await supabase
    .from("messages").select("id").eq("chat_id", currentChatId);
  const visibleMsgs = (msgs || []).filter((m) => !hiddenMsgIds.has(m.id));
  document.getElementById("user-profile-msgcount").textContent = String(visibleMsgs.length);

  overlay.classList.remove("hidden");
}

// ======================================================
// 9. БЛОКИРОВКИ
// ======================================================

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
  const { error } = await supabase.from("blocked_users")
    .insert({ blocker_id: currentUser.id, blocked_id: userId });
  if (error) { await showAlertDialog("Ошибка", "Не удалось: " + error.message); return; }
  await loadBlocks();
}

async function unblockUser(userId) {
  const { error } = await supabase.from("blocked_users").delete()
    .eq("blocker_id", currentUser.id).eq("blocked_id", userId);
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
      document.querySelectorAll(".user-item").forEach((el) => {
        const uid = el.dataset.userId;
        const nameEl = el.querySelector(".user-item-name");
        if (!nameEl || !uid) return;
        const base = nameEl.textContent.replace(/\s*🚫$/, "");
        nameEl.textContent = base + (isBlockedByMe(uid) ? " 🚫" : "");
      });
    }).subscribe();
}

function subscribeToGlobalChanges() {
  if (globalChannel) return;
  globalChannel = supabase.channel("global-changes")
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chats" }, (payload) => {
      const id = payload.old && payload.old.id;
      if (!id) return;
      if (currentChatId === id) closeCurrentChat();
      if (!document.getElementById("search-input").value.trim()) loadRecentChats();
    }).subscribe();
}

function updateUserEverywhere(profile) {
  const itemEl = document.querySelector(`.user-item[data-user-id="${profile.id}"]`);
  if (itemEl) {
    paintAvatar(itemEl.querySelector(".avatar"), profile);
    const nameEl = itemEl.querySelector(".user-item-name");
    const unameEl = itemEl.querySelector(".user-item-username");
    const custom = itemEl.dataset.customName;
    if (nameEl) nameEl.textContent = (custom || profile.display_name) + (isBlockedByMe(profile.id) ? " 🚫" : "");
    if (unameEl) unameEl.textContent = "@" + profile.username;
  }

  if (currentOtherUser && currentOtherUser.id === profile.id) {
    currentOtherUser = { ...currentOtherUser, ...profile };
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
      const p = payload.new;
      profileCache.set(p.id, p);

      if (p.id === currentUser.id) {
        myProfile = { ...myProfile, ...p };
        paintAvatar(document.getElementById("me-avatar"), myProfile);
        document.getElementById("me-name").textContent = p.display_name;
        document.getElementById("me-username").textContent = "@" + p.username;
      }

      updateUserEverywhere(p);
      if (currentOtherUser && currentOtherUser.id === p.id) renderChatSubtitle();

      // Обновим кэш для дня рождения
      const i = cachedProfilesForBirthday.findIndex((x) => x.id === p.id);
      if (i !== -1) cachedProfilesForBirthday[i] = { ...cachedProfilesForBirthday[i], ...p };
      renderBirthdayBanner();
    }).subscribe();
}

// ======================================================
// 10. НЕДАВНИЕ ЧАТЫ
// ======================================================

async function loadRecentChats() {
  const listEl = document.getElementById("users-list");
  document.getElementById("section-title").textContent = "Недавние чаты";
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';

  const { data: myChats, error: e1 } = await supabase
    .from("chat_members").select("chat_id, custom_name").eq("user_id", currentUser.id);
  if (e1 || !myChats || myChats.length === 0) {
    listEl.innerHTML = '<div class="empty">Введи @username выше, чтобы найти человека</div>';
    return;
  }

  const chatIds = myChats.map((c) => c.chat_id);

  const { data: hides } = await supabase
    .from("chat_hides").select("chat_id, hidden_at").eq("user_id", currentUser.id);
  const hideMap = new Map((hides || []).map((h) => [h.chat_id, new Date(h.hidden_at).getTime()]));

  const { data: recentMsgs } = await supabase
    .from("messages").select("chat_id, created_at").in("chat_id", chatIds)
    .order("created_at", { ascending: false }).limit(500);
  const lastMsgMap = new Map();
  (recentMsgs || []).forEach((m) => {
    if (!lastMsgMap.has(m.chat_id)) lastMsgMap.set(m.chat_id, new Date(m.created_at).getTime());
  });

  const { data: others, error: e2 } = await supabase
    .from("chat_members").select("chat_id, user_id")
    .in("chat_id", chatIds).neq("user_id", currentUser.id);
  if (e2 || !others || others.length === 0) {
    listEl.innerHTML = '<div class="empty">Введи @username выше, чтобы найти человека</div>';
    return;
  }

  const visible = others.filter((o) => {
    const hiddenAt = hideMap.get(o.chat_id);
    const lastMsg = lastMsgMap.get(o.chat_id) || 0;
    return !(hiddenAt && hiddenAt > lastMsg);
  });

  if (visible.length === 0) {
    listEl.innerHTML = '<div class="empty">Введи @username выше, чтобы найти человека</div>';
    return;
  }

  const userIds = [...new Set(visible.map((o) => o.user_id))];
  const { data: profiles } = await supabase
    .from("profiles").select("id, username, display_name, avatar_url, last_seen, gender, birthday")
    .in("id", userIds);
  (profiles || []).forEach((p) => profileCache.set(p.id, p));

  const customNamesByChatId = new Map();
  (myChats || []).forEach((c) => {
    if (c.custom_name) customNamesByChatId.set(c.chat_id, c.custom_name);
  });
  const byUser = new Map();
  others.forEach((o) => {
    const nm = customNamesByChatId.get(o.chat_id);
    if (nm) byUser.set(o.user_id, nm);
  });
  (profiles || []).forEach((p) => { p._customName = byUser.get(p.id) || null; });

  cachedProfilesForBirthday = profiles || [];
  renderBirthdayBanner();

  renderUsers(profiles || []);
}

// ======================================================
// 11. ПОИСК
// ======================================================

function setupSearch() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(input.value.trim()), 250);
  });
}

async function performSearch(query) {
  const listEl = document.getElementById("users-list");
  const titleEl = document.getElementById("section-title");
  if (!query) { await loadRecentChats(); return; }
  titleEl.textContent = "Поиск";
  const clean = query.replace(/^@+/, "").trim().toLowerCase();
  if (!clean) { listEl.innerHTML = '<div class="empty">Начни вводить @username</div>'; return; }
  listEl.innerHTML = '<div class="empty">Ищу...</div>';

  const { data, error } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, last_seen, gender")
    .neq("id", currentUser.id).ilike("username", `%${clean}%`)
    .order("username").limit(20);
  if (error) { listEl.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }
  if (!data || data.length === 0) {
    listEl.innerHTML = `<div class="empty">Никого не найдено по «${escapeHtml(query)}»</div>`;
    return;
  }
  data.forEach((p) => profileCache.set(p.id, p));
  renderUsers(data);
}

// ======================================================
// 12. СПИСОК ЛЮДЕЙ
// ======================================================

function renderUsers(users) {
  const listEl = document.getElementById("users-list");
  if (!users.length) { listEl.innerHTML = '<div class="empty">Пусто</div>'; return; }

  listEl.innerHTML = users.map((u) => {
    const blocked = isBlockedByMe(u.id) ? " 🚫" : "";
    const name = u._customName || u.display_name;
    return `
      <div class="user-item" data-user-id="${u.id}" data-custom-name="${u._customName ? escapeHtml(u._customName) : ""}">
        <div class="avatar"></div>
        <div class="user-item-info">
          <div class="user-item-name">${escapeHtml(name)}${blocked}</div>
          <div class="user-item-username">@${escapeHtml(u.username)}</div>
        </div>
      </div>`;
  }).join("");

  listEl.querySelectorAll(".user-item").forEach((el) => {
    const userId = el.dataset.userId;
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    paintAvatar(el.querySelector(".avatar"), user);

    el.addEventListener("click", () => {
      listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");
      openChatWith(user);
    });

    el.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      openChatListContextMenu(ev, user, el);
    });
  });
}

// ======================================================
// 13. ПКМ НА ЧАТ В СПИСКЕ
// ======================================================

function openChatListContextMenu(ev, user, el) {
  contextChatUser = user;
  contextChatCustomName = el.dataset.customName || null;

  const menu = document.getElementById("chat-list-context-menu");
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

document.addEventListener("click", () => {
  const m = document.getElementById("chat-list-context-menu");
  if (m) m.classList.add("hidden");
});

document.getElementById("chat-list-context-menu").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  e.stopPropagation();
  const action = btn.dataset.action;
  const user = contextChatUser;
  document.getElementById("chat-list-context-menu").classList.add("hidden");
  if (!user) return;

  if (action === "profile") {
    await openChatWith(user);
    setTimeout(openUserProfileDialog, 100);

  } else if (action === "rename") {
    const current = contextChatCustomName || user.display_name;
    const newName = await showInputDialog(
      "Переименовать чат",
      "Отображается только у вас",
      current
    );
    if (newName === null) return;
    const trimmed = newName.trim();

    // Ищем chat_id с этим пользователем
    const { data: myMemberships } = await supabase
      .from("chat_members").select("chat_id").eq("user_id", currentUser.id);
    const myChatIds = (myMemberships || []).map((m) => m.chat_id);
    if (!myChatIds.length) return;
    const { data: sharedRow } = await supabase
      .from("chat_members").select("chat_id")
      .eq("user_id", user.id).in("chat_id", myChatIds).limit(1);
    if (!sharedRow || !sharedRow.length) return;
    const chatId = sharedRow[0].chat_id;

    const valueToSave = trimmed === "" || trimmed === user.display_name ? null : trimmed;

    const { error } = await supabase.from("chat_members")
      .update({ custom_name: valueToSave })
      .eq("chat_id", chatId).eq("user_id", currentUser.id);

    if (error) {
      await showAlertDialog("Ошибка", error.message);
      return;
    }

    // Обновляем в UI без перезагрузки
    const el = document.querySelector(`.user-item[data-user-id="${user.id}"]`);
    if (el) {
      el.dataset.customName = valueToSave || "";
      const nameEl = el.querySelector(".user-item-name");
      if (nameEl) {
        const base = valueToSave || user.display_name;
        nameEl.textContent = base + (isBlockedByMe(user.id) ? " 🚫" : "");
      }
    }
    if (currentOtherUser && currentOtherUser.id === user.id) {
      document.getElementById("chat-title").textContent = valueToSave || user.display_name;
    }
    user._customName = valueToSave || null;

  } else if (action === "clear") {
    await openChatWith(user);
    const choice = await showChoiceDialog("Очистить чат", "Выбери, что очистить:", [
      { label: "Только у меня", value: "me" },
      { label: "У обоих", value: "both" },
    ], "Очистить");
    if (choice === "me") await clearChatForMe();
    else if (choice === "both") await clearChatForBoth();

  } else if (action === "delete") {
    await openChatWith(user);
    const choice = await showChoiceDialog("Удалить чат", "Что удалить?", [
      { label: "У меня (вернётся при новом сообщении)", value: "me" },
      { label: "У обоих (безвозвратно)", value: "both" },
    ], "Удалить");
    if (choice === "me") await hideChatFromList();
    else if (choice === "both") await deleteChatForBoth();

  } else if (action === "block") {
    if (isBlockedByMe(user.id)) {
      await unblockUser(user.id);
    } else {
      const ok = await showConfirmDialog("Блокировка",
        "Заблокировать @" + user.username + "?", "Заблокировать");
      if (!ok) return;
      await blockUser(user.id);
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

// ======================================================
// 14. ОТКРЫТИЕ ЧАТА
// ======================================================

async function openChatWith(otherUser) {
  currentOtherUser = otherUser;

  const itemEl = document.querySelector(`.user-item[data-user-id="${otherUser.id}"]`);
  const customName = itemEl ? itemEl.dataset.customName : null;

  paintAvatar(document.getElementById("chat-avatar"), otherUser);
  document.getElementById("chat-title").textContent = customName || otherUser.display_name;
  renderChatSubtitle();
  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-content").classList.remove("hidden");
  document.getElementById("chat-menu").classList.add("hidden");

  exitSelectionMode();
  cancelReply();
  cancelEdit();
  closeReactionPicker();
  updateBlockUI();

  const chatId = await getOrCreateChat(otherUser.id);
  if (!chatId) {
    document.getElementById("messages").innerHTML = '<div class="empty">Не удалось открыть чат</div>';
    return;
  }
  currentChatId = chatId;
  await loadMessages(chatId);
  await loadReactionsForVisibleMessages();
  subscribeToChat(chatId);
  subscribeToReactions();
}

async function getOrCreateChat(otherUserId) {
  const { data: myMemberships, error: err1 } = await supabase
    .from("chat_members").select("chat_id").eq("user_id", currentUser.id);
  if (err1) { console.error(err1); return null; }
  const myChatIds = (myMemberships || []).map((m) => m.chat_id);
  if (myChatIds.length > 0) {
    const { data: shared } = await supabase.from("chat_members")
      .select("chat_id").eq("user_id", otherUserId).in("chat_id", myChatIds);
    if (shared && shared.length > 0) return shared[0].chat_id;
  }
  const { data: newChat, error: chatErr } = await supabase
    .from("chats").insert({}).select().single();
  if (chatErr) { console.error(chatErr); return null; }
  const { error: membersErr } = await supabase.from("chat_members").insert([
    { chat_id: newChat.id, user_id: currentUser.id },
    { chat_id: newChat.id, user_id: otherUserId },
  ]);
  if (membersErr) { console.error(membersErr); return null; }
  return newChat.id;
}

// ======================================================
// 15. СООБЩЕНИЯ
// ======================================================

async function loadMessages(chatId) {
  const box = document.getElementById("messages");
  box.innerHTML = '<div class="empty">Загрузка...</div>';
  msgCache.clear();
  hiddenMsgIds = new Set();
  reactionsCache.clear();

  const { data: hides } = await supabase
    .from("message_hides").select("message_id").eq("user_id", currentUser.id);
  hiddenMsgIds = new Set((hides || []).map((h) => h.message_id));

  const { data: clearRow } = await supabase
    .from("chat_clears").select("cleared_at")
    .eq("chat_id", chatId).eq("user_id", currentUser.id).maybeSingle();

  let query = supabase.from("messages").select("*")
    .eq("chat_id", chatId).order("created_at", { ascending: true });
  if (clearRow && clearRow.cleared_at) query = query.gt("created_at", clearRow.cleared_at);

  const { data, error } = await query;
  if (error) { box.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }

  box.innerHTML = "";
  const all = data || [];
  all.forEach((m) => msgCache.set(m.id, m));
  const visible = all.filter((m) => !hiddenMsgIds.has(m.id));

  if (visible.length === 0) {
    box.innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
    return;
  }
  for (const m of visible) await appendMessage(m);
  scrollToBottom();
}

async function loadReactionsForVisibleMessages() {
  const ids = [...msgCache.keys()];
  if (!ids.length) return;
  const { data } = await supabase.from("reactions")
    .select("message_id, user_id, emoji").in("message_id", ids);
  reactionsCache.clear();
  (data || []).forEach((r) => {
    if (!reactionsCache.has(r.message_id)) reactionsCache.set(r.message_id, []);
    reactionsCache.get(r.message_id).push({ user_id: r.user_id, emoji: r.emoji });
  });
  document.querySelectorAll(".msg").forEach((el) => {
    renderReactionsUI(el.dataset.id);
  });
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

  html += `<div class="msg-text">${escapeHtml(msg.content || "")}</div>`;
  html += `<div class="msg-reactions" data-reactions-for="${msg.id}"></div>`;
  html += `<div class="msg-time">${time}`;
  if (msg.edited_at) html += `<span class="msg-edited">изменено</span>`;
  html += `</div>`;
  html += `<button class="msg-add-reaction" data-add-reaction="${msg.id}" title="Реакция">😊</button>`;

  return html;
}

async function appendMessage(msg) {
  const box = document.getElementById("messages");
  if (document.querySelector(`.msg[data-id="${msg.id}"]`)) return;
  const empty = box.querySelector(".empty");
  if (empty) empty.remove();

  const mine = msg.sender_id === currentUser.id;
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

function onMsgClick(e) {
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
  if (addBtn) {
    e.stopPropagation();
    openReactionPickerFor(addBtn, addBtn.dataset.addReaction);
    return;
  }

  const chip = e.target.closest(".reaction-chip");
  if (chip) {
    e.stopPropagation();
    toggleReaction(chip.dataset.messageId, chip.dataset.emoji);
    return;
  }
}

function jumpToMessage(id) {
  const target = document.querySelector(`.msg[data-id="${id}"]`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.style.transition = "background 0.4s";
  const prev = target.style.background;
  target.style.background = "rgba(255,140,66,0.3)";
  setTimeout(() => { target.style.background = prev; }, 700);
}

async function updateMessageInUI(msg) {
  const el = document.querySelector(`.msg[data-id="${msg.id}"]`);
  if (!el) return;
  msgCache.set(msg.id, msg);
  el.innerHTML = await buildMsgHtml(msg);
  renderReactionsUI(msg.id);
}

async function openChatByUsername(username) {
  const { data } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url, last_seen, gender").eq("username", username).single();
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

document.getElementById("composer").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentChatId) return;

  if (currentOtherUser && (isBlockedByMe(currentOtherUser.id) || hasBlockedMe(currentOtherUser.id))) {
    await showAlertDialog("Не отправлено", "Сообщение не отправлено: есть блокировка.");
    return;
  }

  const input = document.getElementById("message-input");
  const content = input.value.trim();
  if (!content) return;

  if (editingMsgId) {
    const { error } = await supabase.from("messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", editingMsgId);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    input.value = "";
    cancelEdit();
    return;
  }

  const payload = { chat_id: currentChatId, sender_id: currentUser.id, content };
  if (replyToMsg) payload.reply_to_id = replyToMsg.id;

  input.value = "";
  cancelReply();

  const { error } = await supabase.from("messages").insert(payload);
  if (error) { console.error(error); await showAlertDialog("Не отправлено", error.message); }
});

// ======================================================
// 16. REALTIME сообщений
// ======================================================

function subscribeToChat(chatId) {
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  currentChannel = supabase.channel("chat-" + chatId)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => { if (payload.new.chat_id === currentChatId) appendMessage(payload.new).then(scrollToBottom); }
    )
    .on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => { updateMessageInUI(payload.new); }
    )
    .on("postgres_changes",
      { event: "DELETE", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        const id = payload.old && payload.old.id;
        if (!id) return;
        msgCache.delete(id); reactionsCache.delete(id);
        const el = document.querySelector(`.msg[data-id="${id}"]`);
        if (el) el.remove();
        checkEmptyChat();
      }
    )
    .subscribe();
}

// ======================================================
// 17. REALTIME реакций
// ======================================================

function subscribeToReactions() {
  if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
  reactionsChannel = supabase.channel("reactions-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => {
      clearTimeout(reactionsRefreshTimer);
      reactionsRefreshTimer = setTimeout(() => loadReactionsForVisibleMessages(), 120);
    }).subscribe();
}

async function refreshReactionsFor(msgId) {
  const { data } = await supabase.from("reactions")
    .select("user_id, emoji").eq("message_id", msgId);
  reactionsCache.set(msgId, (data || []).map((r) => ({ user_id: r.user_id, emoji: r.emoji })));
  renderReactionsUI(msgId);
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

// ======================================================
// 18. ПИКЕР РЕАКЦИЙ
// ======================================================

function openReactionPickerFor(anchorEl, msgId) {
  const picker = document.getElementById("reaction-picker");
  picker.innerHTML = "";
  REACTION_EMOJIS.forEach((em) => {
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
  const pw = picker.offsetWidth;
  const ph = picker.offsetHeight;
  let x = rect.left + rect.width / 2 - pw / 2;
  let y = rect.top - ph - 8;
  if (y < 8) y = rect.bottom + 8;
  x = Math.max(8, Math.min(window.innerWidth - pw - 8, x));
  picker.style.left = x + "px";
  picker.style.top = y + "px";

  setTimeout(() => {
    document.addEventListener("click", closeReactionPickerOnClick);
  }, 0);
}

function closeReactionPickerOnClick(e) {
  if (!e.target.closest("#reaction-picker")) closeReactionPicker();
}

function closeReactionPicker() {
  document.getElementById("reaction-picker").classList.add("hidden");
  document.removeEventListener("click", closeReactionPickerOnClick);
}

async function toggleReaction(msgId, emoji) {
  const list = reactionsCache.get(msgId) || [];
  const mine = list.find((r) => r.user_id === currentUser.id);

  if (mine && mine.emoji === emoji) {
    reactionsCache.set(msgId, list.filter((r) => r.user_id !== currentUser.id));
    renderReactionsUI(msgId);
    const { error } = await supabase.from("reactions").delete()
      .eq("message_id", msgId).eq("user_id", currentUser.id);
    if (error) { console.error(error); refreshReactionsFor(msgId); }
  } else if (mine) {
    const newList = list.map((r) => r.user_id === currentUser.id ? { ...r, emoji } : r);
    reactionsCache.set(msgId, newList);
    renderReactionsUI(msgId);
    const { error } = await supabase.from("reactions").update({ emoji })
      .eq("message_id", msgId).eq("user_id", currentUser.id);
    if (error) { console.error(error); refreshReactionsFor(msgId); }
  } else {
    const newList = [...list, { user_id: currentUser.id, emoji }];
    reactionsCache.set(msgId, newList);
    renderReactionsUI(msgId);
    const { error } = await supabase.from("reactions").insert({
      message_id: msgId, user_id: currentUser.id, emoji,
    });
    if (error) { console.error(error); refreshReactionsFor(msgId); }
  }
}

// ======================================================
// 19. МЕНЮ ЧАТА (⋮)
// ======================================================

function setupChatMenu() {
  const menuBtn = document.getElementById("chat-menu-btn");
  const menuEl = document.getElementById("chat-menu");

  const headerText = document.getElementById("chat-header-text");
  if (headerText) {
    headerText.addEventListener("click", (e) => {
      if (e.target.closest("#chat-menu-btn")) return;
      openUserProfileDialog();
    });
  }

  const upCloseBtn = document.getElementById("user-profile-close");
  if (upCloseBtn) {
    upCloseBtn.addEventListener("click", () => {
      document.getElementById("user-profile-overlay").classList.add("hidden");
    });
  }

  menuBtn.addEventListener("click", (e) => { e.stopPropagation(); menuEl.classList.toggle("hidden"); });
  document.addEventListener("click", (e) => {
    if (!menuEl.classList.contains("hidden") && !menuEl.contains(e.target)) menuEl.classList.add("hidden");
  });

  menuEl.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    menuEl.classList.add("hidden");

    if (action === "clear") {
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
        const ok = await showConfirmDialog("Блокировка",
          "Заблокировать @" + currentOtherUser.username + "?", "Заблокировать");
        if (!ok) return;
        await blockUser(currentOtherUser.id);
      }
      updateBlockUI();
      if (!document.getElementById("search-input").value.trim()) await loadRecentChats();
    }
  });

  document.getElementById("unblock-btn").addEventListener("click", async () => {
    if (!currentOtherUser) return;
    await unblockUser(currentOtherUser.id);
    updateBlockUI();
    if (!document.getElementById("search-input").value.trim()) await loadRecentChats();
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
    text.textContent = "@" + currentOtherUser.username + " заблокировал(а) тебя. Сообщения не отправляются.";
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
// 20. ОЧИСТКА / УДАЛЕНИЕ ЧАТА
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
  const { error } = await supabase.from("chat_hides").upsert({
    chat_id: currentChatId, user_id: currentUser.id, hidden_at: new Date().toISOString(),
  });
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  closeCurrentChat();
  await loadRecentChats();
}

async function deleteChatForBoth() {
  if (!currentChatId) return;
  const { error } = await supabase.from("chats").delete().eq("id", currentChatId);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  closeCurrentChat();
  await loadRecentChats();
}

function closeCurrentChat() {
  currentChatId = null; currentOtherUser = null;
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  if (reactionsChannel) { supabase.removeChannel(reactionsChannel); reactionsChannel = null; }
  cancelReply(); cancelEdit(); exitSelectionMode(); closeReactionPicker();
  document.getElementById("chat-content").classList.add("hidden");
  document.getElementById("chat-placeholder").classList.remove("hidden");
}

// ======================================================
// 21. ПКМ ПО СООБЩЕНИЮ
// ======================================================

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
    else if (action === "edit") startEdit(id);
    else if (action === "react") openPickerForContext(id);
    else if (action === "fwd") await handleForwardOne(id);
    else if (action === "del") await handleDeleteOne(id);
    else if (action === "sel") enterSelectionMode(id);
  });

  document.addEventListener("click", () => closeMsgContextMenu());
}

function openMsgContextMenu(e, msgId) {
  if (selectionMode) return;
  e.preventDefault(); e.stopPropagation();
  contextMsgId = msgId;

  const msg = msgCache.get(msgId);
  const editBtn = document.querySelector('#msg-context-menu button[data-action="edit"]');
  if (msg && msg.sender_id === currentUser.id && !msg.forwarded_from_name) {
    editBtn.classList.remove("hidden");
  } else {
    editBtn.classList.add("hidden");
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
  document.getElementById("msg-context-menu").classList.add("hidden");
}

function openPickerForContext(msgId) {
  const el = document.querySelector(`.msg[data-id="${msgId}"] .msg-add-reaction`);
  if (el) openReactionPickerFor(el, msgId);
}

// ======================================================
// 22. ОТВЕТ / РЕДАКТИРОВАНИЕ
// ======================================================

function setupReplyBar() {
  document.getElementById("reply-bar-close").addEventListener("click", () => {
    cancelReply(); cancelEdit();
  });
}

async function startReply(msgId) {
  const msg = msgCache.get(msgId);
  if (!msg) return;
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
  if (msg.forwarded_from_name) return;
  cancelReply();
  editingMsgId = msgId;

  document.getElementById("reply-bar-title").textContent = "Редактирование";
  document.getElementById("reply-bar-text").textContent = (msg.content || "").slice(0, 80);
  document.getElementById("reply-bar-icon").textContent = "✎";
  document.getElementById("reply-bar").classList.remove("hidden");

  const input = document.getElementById("message-input");
  input.value = msg.content || "";
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function cancelEdit() {
  editingMsgId = null;
  document.getElementById("message-input").value = "";
  if (!replyToMsg) document.getElementById("reply-bar").classList.add("hidden");
}

// ======================================================
// 23. УДАЛЕНИЕ ОДНОГО
// ======================================================

async function handleDeleteOne(msgId) {
  const choice = await showChoiceDialog("Удалить сообщение", "У кого удалить?", [
    { label: "У меня", value: "me" },
    { label: "У обоих", value: "both" },
  ], "Удалить");
  if (choice === "me") await hideMessageForMe(msgId);
  else if (choice === "both") await deleteMessageForBoth(msgId);
}

async function hideMessageForMe(msgId) {
  const { error } = await supabase.from("message_hides").insert({
    message_id: msgId, user_id: currentUser.id,
  });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    await showAlertDialog("Ошибка", error.message); return;
  }
  hiddenMsgIds.add(msgId); msgCache.delete(msgId);
  const el = document.querySelector(`.msg[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
}

async function deleteMessageForBoth(msgId) {
  const { error } = await supabase.from("messages").delete().eq("id", msgId);
  if (error) { await showAlertDialog("Ошибка", error.message); return; }
  msgCache.delete(msgId); reactionsCache.delete(msgId);
  const el = document.querySelector(`.msg[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
}

// ======================================================
// 24. РЕЖИМ ВЫБОРА
// ======================================================

function setupSelectionToolbar() {
  document.getElementById("sel-cancel").addEventListener("click", exitSelectionMode);
  document.getElementById("sel-delete").addEventListener("click", handleDeleteSelected);
  document.getElementById("sel-forward").addEventListener("click", handleForwardSelected);

  document.getElementById("messages").addEventListener("click", (e) => {
    if (!selectionMode) return;
    const el = e.target.closest(".msg");
    if (!el) return;
    e.stopPropagation(); e.preventDefault();
    const id = el.dataset.id;
    if (selectedMsgIds.has(id)) {
      selectedMsgIds.delete(id);
      el.classList.remove("selected");
    } else {
      if (selectedMsgIds.size >= 100) {
        showAlertDialog("Лимит", "Максимум 100 сообщений");
        return;
      }
      selectedMsgIds.add(id);
      el.classList.add("selected");
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

  document.querySelectorAll(".msg").forEach((el) => {
    if (selectedMsgIds.has(el.dataset.id)) el.classList.add("selected");
  });
  updateSelectionUI();
}

function exitSelectionMode() {
  selectionMode = false;
  selectedMsgIds.clear();
  document.getElementById("selection-toolbar").classList.add("hidden");
  document.getElementById("composer").classList.remove("hidden");
  document.querySelectorAll(".msg.selected").forEach((el) => el.classList.remove("selected"));
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

  const ids = [...selectedMsgIds];
  if (choice === "me") {
    for (const id of ids) {
      await supabase.from("message_hides").insert({ message_id: id, user_id: currentUser.id });
      hiddenMsgIds.add(id); msgCache.delete(id);
      const el = document.querySelector(`.msg[data-id="${id}"]`);
      if (el) el.remove();
    }
  } else if (choice === "both") {
    const { error } = await supabase.from("messages").delete().in("id", ids);
    if (error) { await showAlertDialog("Ошибка", error.message); return; }
    ids.forEach((id) => {
      msgCache.delete(id); reactionsCache.delete(id);
      const el = document.querySelector(`.msg[data-id="${id}"]`);
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
// 25. ПЕРЕСЫЛКА
// ======================================================

async function handleForwardOne(msgId) {
  const msg = msgCache.get(msgId);
  if (!msg) return;
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
  const { data: myChats } = await supabase.from("chat_members")
    .select("chat_id").eq("user_id", currentUser.id);
  const chatIds = (myChats || []).map((c) => c.chat_id);
  if (!chatIds.length) { listEl.innerHTML = '<div class="empty">Нет чатов</div>'; return; }

  const { data: others } = await supabase.from("chat_members")
    .select("chat_id, user_id").in("chat_id", chatIds).neq("user_id", currentUser.id);
  const userIds = [...new Set((others || []).map((o) => o.user_id))];
  const { data: profiles } = await supabase.from("profiles")
    .select("id, username, display_name, avatar_url").in("id", userIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const items = (others || []).map((o) => ({
    chat_id: o.chat_id, user: profileMap.get(o.user_id),
  })).filter((x) => x.user);

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
        if (forwardSelectedChats.size >= 10) {
          showAlertDialog("Лимит", "Максимум 10 чатов");
          return;
        }
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
// 26. ДНИ РОЖДЕНИЯ
// ======================================================

function renderBirthdayBanner() {
  const banner = document.getElementById("birthday-banner");
  if (!banner) return;

  const today = new Date();
  const todayMD = (today.getMonth() + 1) * 100 + today.getDate();

  const celebrants = (cachedProfilesForBirthday || []).filter((p) => {
    if (!p.birthday) return false;
    const d = new Date(p.birthday);
    return (d.getMonth() + 1) * 100 + d.getDate() === todayMD;
  });

  if (celebrants.length === 0) {
    banner.classList.add("hidden");
    banner.onclick = null;
    return;
  }

  const cnt = celebrants.length;
  const word = pluralRu(cnt, "контакта", "контактов", "контактов");
  document.getElementById("birthday-banner-text").textContent =
    `У ${cnt} вашего ${word} сегодня день рождения 🎉`;

  banner.classList.remove("hidden");
  banner.onclick = async () => {
    const lines = celebrants.map((p) => `${p.display_name} (@${p.username})`).join("\n");
    await showAlertDialog("День рождения 🎂", "Сегодня поздравляем:\n\n" + lines);
  };
}

// ======================================================
// 27. ПОЛ, ПАДЕЖИ, ПОСЛЕДНИЙ ВХОД
// ======================================================

function pluralRu(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
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
  const now = Date.now();
  const lastSeen = profile.last_seen ? new Date(profile.last_seen).getTime() : 0;
  if (!lastSeen) return "";

  const diffSec = Math.floor((now - lastSeen) / 1000);
  if (diffSec < 45) return "в сети";

  const wasVerb = genderVerb(profile);
  const diffMin = Math.floor(diffSec / 60);

  if (diffMin < 1) return wasVerb + " недавно";
  if (diffMin < 60) {
    return wasVerb + " " + diffMin + " " + pluralRu(diffMin, "минуту", "минуты", "минут") + " назад";
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 13) {
    return wasVerb + " " + diffHours + " " + pluralRu(diffHours, "час", "часа", "часов") + " назад";
  }

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
  await supabase.from("profiles")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", currentUser.id);
}

// ======================================================
// 28. XSS + автопроверка сессии
// ======================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const { data: { session } } = await supabase.auth.getSession();
if (session) showApp(session.user);
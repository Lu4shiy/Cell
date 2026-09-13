// ======================================================
// Imaginer — точка входа
// ======================================================

const SUPABASE_URL = "https://uiktqkxfsoewjpgjpizf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3Rxa3hmc29ld2pwZ2pwaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODY5MjksImV4cCI6MjEwNDg2MjkyOX0.2OC3vrfusHK6Lqv1Yh5KfZ42Ypm02sE1XAloTSUxo2k";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    errEl.style.color = "#ff8c42";
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
let blocksChannel = null;
let globalChannel = null;
let searchTimeout = null;
let myBlockedIds = new Set();
let blockedMeIds = new Set();
let hiddenMsgIds = new Set();
let msgCache = new Map();
let replyToMsg = null;
let editingMsgId = null;
let selectionMode = false;
let selectedMsgIds = new Set();
let contextMsgId = null;
let forwardSourceMsgs = [];
let forwardSelectedChats = new Set();
let profileCache = new Map();

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
  hiddenMsgIds = new Set(); msgCache.clear();
  selectedMsgIds.clear(); forwardSelectedChats.clear();
  replyToMsg = null; editingMsgId = null; selectionMode = false;
  profileCache.clear();
  [currentChannel, blocksChannel, globalChannel].forEach((ch) => ch && supabase.removeChannel(ch));
  currentChannel = blocksChannel = globalChannel = null;
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

// ======================================================
// 3. ИНИЦИАЛИЗАЦИЯ
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
  subscribeToBlocks();
  subscribeToGlobalChanges();
  await loadRecentChats();
}

async function loadMyProfile() {
  const { data, error } = await supabase
    .from("profiles").select("username, display_name")
    .eq("id", currentUser.id).single();
  if (error) { console.error(error); return; }
  myProfile = data;
  profileCache.set(currentUser.id, data);
  document.getElementById("me-name").textContent = data.display_name;
  document.getElementById("me-username").textContent = "@" + data.username;
  document.getElementById("me-avatar").textContent = (data.display_name || "?")[0].toUpperCase();
}

async function getProfile(id) {
  if (profileCache.has(id)) return profileCache.get(id);
  const { data } = await supabase.from("profiles")
    .select("username, display_name").eq("id", id).single();
  if (data) profileCache.set(id, data);
  return data;
}

// ======================================================
// 4. БЛОКИРОВКИ
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
  if (error) { alert("Не удалось: " + error.message); return; }
  await loadBlocks();
}

async function unblockUser(userId) {
  const { error } = await supabase.from("blocked_users").delete()
    .eq("blocker_id", currentUser.id).eq("blocked_id", userId);
  if (error) { alert("Не удалось: " + error.message); return; }
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
      if (!document.getElementById("search-input").value.trim()) await loadRecentChats();
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

// ======================================================
// 5. НЕДАВНИЕ ЧАТЫ
// ======================================================

async function loadRecentChats() {
  const listEl = document.getElementById("users-list");
  document.getElementById("section-title").textContent = "Недавние чаты";
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';

  const { data: myChats, error: e1 } = await supabase
    .from("chat_members").select("chat_id").eq("user_id", currentUser.id);
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
    .from("profiles").select("id, username, display_name").in("id", userIds);
  (profiles || []).forEach((p) => profileCache.set(p.id, p));
  renderUsers(profiles || []);
}

// ======================================================
// 6. ПОИСК
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
    .select("id, username, display_name")
    .neq("id", currentUser.id).ilike("username", `%${clean}%`)
    .order("username").limit(20);
  if (error) { listEl.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }
  if (!data || data.length === 0) {
    listEl.innerHTML = `<div class="empty">Никого не найдено по «${escapeHtml(query)}»</div>`;
    return;
  }
  renderUsers(data);
}

// ======================================================
// 7. СПИСОК ЛЮДЕЙ
// ======================================================

function renderUsers(users) {
  const listEl = document.getElementById("users-list");
  if (!users.length) { listEl.innerHTML = '<div class="empty">Пусто</div>'; return; }
  listEl.innerHTML = users.map((u) => {
    const initial = (u.display_name || "?")[0].toUpperCase();
    const blocked = isBlockedByMe(u.id) ? " 🚫" : "";
    return `
      <div class="user-item" data-user-id="${u.id}">
        <div class="avatar">${initial}</div>
        <div class="user-item-info">
          <div class="user-item-name">${escapeHtml(u.display_name)}${blocked}</div>
          <div class="user-item-username">@${escapeHtml(u.username)}</div>
        </div>
      </div>`;
  }).join("");

  listEl.querySelectorAll(".user-item").forEach((el) => {
    el.addEventListener("click", () => {
      const userId = el.dataset.userId;
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");
      openChatWith(user);
    });
  });
}

// ======================================================
// 8. ОТКРЫТИЕ ЧАТА
// ======================================================

async function openChatWith(otherUser) {
  currentOtherUser = otherUser;
  document.getElementById("chat-avatar").textContent = (otherUser.display_name || "?")[0].toUpperCase();
  document.getElementById("chat-title").textContent = otherUser.display_name;
  document.getElementById("chat-subtitle").textContent = "@" + otherUser.username;
  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-content").classList.remove("hidden");
  document.getElementById("chat-menu").classList.add("hidden");

  exitSelectionMode();
  cancelReply();
  cancelEdit();
  updateBlockUI();

  const chatId = await getOrCreateChat(otherUser.id);
  if (!chatId) {
    document.getElementById("messages").innerHTML = '<div class="empty">Не удалось открыть чат</div>';
    return;
  }
  currentChatId = chatId;
  await loadMessages(chatId);
  subscribeToChat(chatId);
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
// 9. СООБЩЕНИЯ
// ======================================================

async function loadMessages(chatId) {
  const box = document.getElementById("messages");
  box.innerHTML = '<div class="empty">Загрузка...</div>';
  msgCache.clear();
  hiddenMsgIds = new Set();

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
  visible.forEach(appendMessage);
  scrollToBottom();
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
  html += `<div class="msg-time">${time}`;
  if (msg.edited_at) html += `<span class="msg-edited">изменено</span>`;
  html += `</div>`;

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
  el.addEventListener("click", (e) => {
    const replyEl = e.target.closest(".msg-reply");
    if (replyEl) {
      e.stopPropagation();
      const targetId = replyEl.dataset.scrollTo;
      const target = document.querySelector(`.msg[data-id="${targetId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.style.transition = "background 0.4s";
        const oldBg = target.style.background;
        target.style.background = "rgba(255,140,66,0.3)";
        setTimeout(() => { target.style.background = oldBg; }, 700);
      }
      return;
    }
    const fwdEl = e.target.closest(".msg-fwd-link");
    if (fwdEl) {
      e.stopPropagation();
      const uname = fwdEl.dataset.fwdUsername;
      if (uname) openChatByUsername(uname);
    }
  });

  box.appendChild(el);
  msgCache.set(msg.id, msg);
}

async function updateMessageInUI(msg) {
  const el = document.querySelector(`.msg[data-id="${msg.id}"]`);
  if (!el) return;
  msgCache.set(msg.id, msg);
  el.innerHTML = await buildMsgHtml(msg);
}

async function openChatByUsername(username) {
  const { data } = await supabase.from("profiles")
    .select("id, username, display_name").eq("username", username).single();
  if (!data) return;
  if (data.id === currentUser.id) return;
  document.getElementById("search-input").value = "";
  await openChatWith(data);
  await loadRecentChats();
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

// Composer: отправка / сохранение изменений
document.getElementById("composer").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentChatId) return;

  if (currentOtherUser && (isBlockedByMe(currentOtherUser.id) || hasBlockedMe(currentOtherUser.id))) {
    alert("Сообщение не отправлено: есть блокировка.");
    return;
  }

  const input = document.getElementById("message-input");
  const content = input.value.trim();
  if (!content) return;

  // Режим редактирования
  if (editingMsgId) {
    const { error } = await supabase.from("messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", editingMsgId);
    if (error) { alert(error.message); return; }
    input.value = "";
    cancelEdit();
    return;
  }

  // Обычная отправка (с reply, если есть)
  const payload = {
    chat_id: currentChatId,
    sender_id: currentUser.id,
    content: content,
  };
  if (replyToMsg) payload.reply_to_id = replyToMsg.id;

  input.value = "";
  cancelReply();

  const { error } = await supabase.from("messages").insert(payload);
  if (error) { console.error(error); alert("Не удалось отправить: " + error.message); }
});

// ======================================================
// 10. REALTIME
// ======================================================

function subscribeToChat(chatId) {
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  currentChannel = supabase.channel("chat-" + chatId)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        if (payload.new.chat_id !== currentChatId) return;
        appendMessage(payload.new).then(scrollToBottom);
      }
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
        msgCache.delete(id);
        const el = document.querySelector(`.msg[data-id="${id}"]`);
        if (el) el.remove();
        checkEmptyChat();
      }
    )
    .subscribe();
}

// ======================================================
// 11. ДИАЛОГ ВЫБОРА (с подтверждением)
// ======================================================

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
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    }
    confirmBtn.onclick = () => { if (selected === null) return; cleanup(); resolve(selected); };
    cancelBtn.onclick = () => { cleanup(); resolve(null); };
  });
}

// ======================================================
// 12. МЕНЮ ЧАТА
// ======================================================

function setupChatMenu() {
  const menuBtn = document.getElementById("chat-menu-btn");
  const menuEl = document.getElementById("chat-menu");

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
        if (!confirm("Заблокировать @" + currentOtherUser.username + "?")) return;
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
// 13. ОЧИСТКА / УДАЛЕНИЕ ЧАТА
// ======================================================

async function clearChatForMe() {
  if (!currentChatId) return;
  const { error } = await supabase.from("chat_clears").upsert({
    chat_id: currentChatId, user_id: currentUser.id, cleared_at: new Date().toISOString(),
  });
  if (error) { alert(error.message); return; }
  await loadMessages(currentChatId);
}

async function clearChatForBoth() {
  if (!currentChatId) return;
  const { error } = await supabase.from("messages").delete().eq("chat_id", currentChatId);
  if (error) { alert(error.message); return; }
  document.getElementById("messages").innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
}

async function hideChatFromList() {
  if (!currentChatId) return;
  const { error } = await supabase.from("chat_hides").upsert({
    chat_id: currentChatId, user_id: currentUser.id, hidden_at: new Date().toISOString(),
  });
  if (error) { alert(error.message); return; }
  closeCurrentChat();
  await loadRecentChats();
}

async function deleteChatForBoth() {
  if (!currentChatId) return;
  const { error } = await supabase.from("chats").delete().eq("id", currentChatId);
  if (error) { alert(error.message); return; }
  closeCurrentChat();
  await loadRecentChats();
}

function closeCurrentChat() {
  currentChatId = null; currentOtherUser = null;
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  cancelReply(); cancelEdit(); exitSelectionMode();
  document.getElementById("chat-content").classList.add("hidden");
  document.getElementById("chat-placeholder").classList.remove("hidden");
}

// ======================================================
// 14. ПКМ МЕНЮ СООБЩЕНИЯ
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

  // Кнопка "Изменить" только для своих непересланных сообщений
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

// ======================================================
// 15. ОТВЕТ / РЕДАКТИРОВАНИЕ
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
  if (!msg) return;
  if (msg.sender_id !== currentUser.id) return;
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
// 16. УДАЛЕНИЕ ОДНОГО СООБЩЕНИЯ
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
  if (error && !String(error.message).toLowerCase().includes("duplicate")) { alert(error.message); return; }
  hiddenMsgIds.add(msgId);
  msgCache.delete(msgId);
  const el = document.querySelector(`.msg[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
}

async function deleteMessageForBoth(msgId) {
  const { error } = await supabase.from("messages").delete().eq("id", msgId);
  if (error) { alert(error.message); return; }
  msgCache.delete(msgId);
  const el = document.querySelector(`.msg[data-id="${msgId}"]`);
  if (el) el.remove();
  checkEmptyChat();
}

// ======================================================
// 17. РЕЖИМ ВЫБОРА
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
      if (selectedMsgIds.size >= 100) { alert("Максимум 100 сообщений"); return; }
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
  const choice = await showChoiceDialog("Удалить сообщения",
    `Будет удалено: ${count}`, [
      { label: "У меня", value: "me" },
      { label: "У обоих", value: "both" },
    ], "Удалить");
  if (!choice) return;

  const ids = [...selectedMsgIds];
  if (choice === "me") {
    for (const id of ids) {
      await supabase.from("message_hides").insert({ message_id: id, user_id: currentUser.id });
      hiddenMsgIds.add(id);
      msgCache.delete(id);
      const el = document.querySelector(`.msg[data-id="${id}"]`);
      if (el) el.remove();
    }
  } else if (choice === "both") {
    const { error } = await supabase.from("messages").delete().in("id", ids);
    if (error) { alert(error.message); return; }
    ids.forEach((id) => {
      msgCache.delete(id);
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
// 18. ПЕРЕСЫЛКА
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
    .select("id, username, display_name").in("id", userIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const items = (others || []).map((o) => ({
    chat_id: o.chat_id, user: profileMap.get(o.user_id),
  })).filter((x) => x.user);

  if (!items.length) { listEl.innerHTML = '<div class="empty">Нет чатов</div>'; return; }

  listEl.innerHTML = items.map((x) => {
    const initial = (x.user.display_name || "?")[0].toUpperCase();
    return `
      <div class="forward-item" data-chat-id="${x.chat_id}">
        <div class="avatar">${initial}</div>
        <div class="fname">${escapeHtml(x.user.display_name)}</div>
        <div class="fcheck hidden">✓</div>
      </div>`;
  }).join("");

  listEl.querySelectorAll(".forward-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.chatId;
      if (forwardSelectedChats.has(id)) {
        forwardSelectedChats.delete(id);
        el.classList.remove("selected");
        el.querySelector(".fcheck").classList.add("hidden");
      } else {
        if (forwardSelectedChats.size >= 10) { alert("Максимум 10 чатов"); return; }
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
  if (!forwardSelectedChats.size) return;
  if (!forwardSourceMsgs.length) return;

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
      const payload = {
        chat_id: chatId,
        sender_id: currentUser.id,
        content: m.content,
      };
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
// 19. XSS + автопроверка сессии
// ======================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const { data: { session } } = await supabase.auth.getSession();
if (session) showApp(session.user);
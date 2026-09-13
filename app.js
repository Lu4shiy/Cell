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
let currentChatId = null;
let currentOtherUser = null;
let currentChannel = null;
let blocksChannel = null;
let searchTimeout = null;
let myBlockedIds = new Set();
let blockedMeIds = new Set();

function showApp(user) {
  currentUser = user;
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  initApp();
}

function showAuth() {
  currentUser = null;
  currentChatId = null;
  currentOtherUser = null;
  myBlockedIds = new Set();
  blockedMeIds = new Set();
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  if (blocksChannel) { supabase.removeChannel(blocksChannel); blocksChannel = null; }
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
  subscribeToBlocks();
  await loadRecentChats();
}

async function loadMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", currentUser.id)
    .single();
  if (error) { console.error(error); return; }
  document.getElementById("me-name").textContent = data.display_name;
  document.getElementById("me-username").textContent = "@" + data.username;
  document.getElementById("me-avatar").textContent = (data.display_name || "?")[0].toUpperCase();
}

// ======================================================
// 4. БЛОКИРОВКИ
// ======================================================

async function loadBlocks() {
  myBlockedIds = new Set();
  blockedMeIds = new Set();

  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_id");
  if (error) { console.error(error); return; }

  (data || []).forEach((b) => {
    if (b.blocker_id === currentUser.id) myBlockedIds.add(b.blocked_id);
    if (b.blocked_id === currentUser.id) blockedMeIds.add(b.blocker_id);
  });
}

async function blockUser(userId) {
  const { error } = await supabase
    .from("blocked_users")
    .insert({ blocker_id: currentUser.id, blocked_id: userId });
  if (error) { alert("Не удалось заблокировать: " + error.message); return; }
  await loadBlocks();
}

async function unblockUser(userId) {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", currentUser.id)
    .eq("blocked_id", userId);
  if (error) { alert("Не удалось разблокировать: " + error.message); return; }
  await loadBlocks();
}

function isBlockedByMe(userId) { return myBlockedIds.has(userId); }
function hasBlockedMe(userId) { return blockedMeIds.has(userId); }

// Realtime на блокировки — чтобы оба аккаунта узнавали мгновенно
function subscribeToBlocks() {
  if (blocksChannel) return;
  blocksChannel = supabase
    .channel("blocks-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "blocked_users" },
      async () => {
        await loadBlocks();
        if (currentOtherUser) updateBlockUI();
        if (!document.getElementById("search-input").value.trim()) {
          await loadRecentChats();
        }
      }
    )
    .subscribe();
}

// ======================================================
// 5. НЕДАВНИЕ ЧАТЫ
// ======================================================

async function loadRecentChats() {
  const listEl = document.getElementById("users-list");
  document.getElementById("section-title").textContent = "Недавние чаты";
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';

  const { data: myChats, error: e1 } = await supabase
    .from("chat_members")
    .select("chat_id")
    .eq("user_id", currentUser.id);

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
  if (!clean) {
    listEl.innerHTML = '<div class="empty">Начни вводить @username</div>';
    return;
  }
  listEl.innerHTML = '<div class="empty">Ищу...</div>';

  const { data, error } = await supabase
    .from("profiles").select("id, username, display_name")
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
    const { data: shared } = await supabase
      .from("chat_members").select("chat_id")
      .eq("user_id", otherUserId).in("chat_id", myChatIds);
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

  const { data: clearRow } = await supabase
    .from("chat_clears").select("cleared_at")
    .eq("chat_id", chatId).eq("user_id", currentUser.id).maybeSingle();

  let query = supabase
    .from("messages").select("id, sender_id, content, created_at")
    .eq("chat_id", chatId).order("created_at", { ascending: true });
  if (clearRow && clearRow.cleared_at) query = query.gt("created_at", clearRow.cleared_at);

  const { data, error } = await query;
  if (error) { box.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`; return; }

  box.innerHTML = "";
  if (!data || data.length === 0) {
    box.innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
    return;
  }
  data.forEach(appendMessage);
  scrollToBottom();
}

function appendMessage(msg) {
  const box = document.getElementById("messages");
  const empty = box.querySelector(".empty");
  if (empty) empty.remove();

  const mine = msg.sender_id === currentUser.id;
  const el = document.createElement("div");
  el.className = "msg " + (mine ? "mine" : "other");
  el.dataset.id = msg.id;

  const time = new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  el.innerHTML = `<div class="msg-text">${escapeHtml(msg.content || "")}</div><div class="msg-time">${time}</div>`;
  box.appendChild(el);
}

function scrollToBottom() {
  const box = document.getElementById("messages");
  box.scrollTop = box.scrollHeight;
}

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
  input.value = "";

  const { error } = await supabase.from("messages").insert({
    chat_id: currentChatId, sender_id: currentUser.id, content: content,
  });
  if (error) { console.error(error); alert("Не удалось отправить: " + error.message); }
});

// ======================================================
// 10. REALTIME (события в чате: новые, удалённые)
// ======================================================

function subscribeToChat(chatId) {
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }

  currentChannel = supabase
    .channel("chat-" + chatId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        if (payload.new.chat_id !== currentChatId) return;
        if (document.querySelector(`.msg[data-id="${payload.new.id}"]`)) return;
        appendMessage(payload.new);
        scrollToBottom();
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        const id = payload.old && payload.old.id;
        if (!id) return;
        const el = document.querySelector(`.msg[data-id="${id}"]`);
        if (el) el.remove();
        const box = document.getElementById("messages");
        if (box.children.length === 0) {
          box.innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
        }
      }
    )
    .subscribe();
}

// ======================================================
// 11. ДИАЛОГ ВЫБОРА
// ======================================================

function showDialog(title, text, opt1Label, opt2Label) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const btn1 = document.getElementById("dialog-opt1");
    const btn2 = document.getElementById("dialog-opt2");
    const btnCancel = document.getElementById("dialog-cancel");

    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-text").textContent = text;
    btn1.textContent = opt1Label;
    btn2.textContent = opt2Label;
    overlay.classList.remove("hidden");

    function cleanup() {
      overlay.classList.add("hidden");
      btn1.onclick = null;
      btn2.onclick = null;
      btnCancel.onclick = null;
    }

    btn1.onclick = () => { cleanup(); resolve("opt1"); };
    btn2.onclick = () => { cleanup(); resolve("opt2"); };
    btnCancel.onclick = () => { cleanup(); resolve(null); };
  });
}

// ======================================================
// 12. МЕНЮ ЧАТА
// ======================================================

function setupChatMenu() {
  const menuBtn = document.getElementById("chat-menu-btn");
  const menuEl = document.getElementById("chat-menu");

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menuEl.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!menuEl.classList.contains("hidden") && !menuEl.contains(e.target)) {
      menuEl.classList.add("hidden");
    }
  });

  menuEl.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    menuEl.classList.add("hidden");

    if (action === "clear") {
      const choice = await showDialog(
        "Очистить чат",
        "Сообщения будут удалены. Выбери, что именно очистить:",
        "Только у меня",
        "У обоих"
      );
      if (choice === "opt1") await clearChatForMe();
      else if (choice === "opt2") await clearChatForBoth();

    } else if (action === "delete") {
      const choice = await showDialog(
        "Удалить чат",
        "Что удалить?",
        "У меня (чат вернётся при новом сообщении)",
        "У обоих (безвозвратно)"
      );
      if (choice === "opt1") await hideChatFromList();
      else if (choice === "opt2") await deleteChatForBoth();

    } else if (action === "block") {
      if (!currentOtherUser) return;
      if (isBlockedByMe(currentOtherUser.id)) {
        await unblockUser(currentOtherUser.id);
      } else {
        const ok = confirm("Заблокировать @" + currentOtherUser.username + "?");
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
  const composerBtn = document.querySelector(".send-btn");

  const iBlocked = isBlockedByMe(currentOtherUser.id);
  const theyBlocked = hasBlockedMe(currentOtherUser.id);

  if (iBlocked) {
    text.textContent = "Ты заблокировал(а) @" + currentOtherUser.username + ".";
    btn.classList.remove("hidden");
    banner.classList.remove("hidden");
    composerInput.disabled = true;
    composerBtn.disabled = true;
    menuBlockBtn.textContent = "Разблокировать";
  } else if (theyBlocked) {
    text.textContent = "@" + currentOtherUser.username + " заблокировал(а) тебя. Сообщения не отправляются.";
    btn.classList.add("hidden");
    banner.classList.remove("hidden");
    composerInput.disabled = true;
    composerBtn.disabled = true;
    menuBlockBtn.textContent = "Заблокировать";
  } else {
    banner.classList.add("hidden");
    btn.classList.add("hidden");
    composerInput.disabled = false;
    composerBtn.disabled = false;
    menuBlockBtn.textContent = "Заблокировать";
  }
}

// ======================================================
// 13. ДЕЙСТВИЯ: ОЧИСТКА / УДАЛЕНИЕ
// ======================================================

async function clearChatForMe() {
  if (!currentChatId) return;
  const { error } = await supabase
    .from("chat_clears")
    .upsert({ chat_id: currentChatId, user_id: currentUser.id, cleared_at: new Date().toISOString() });
  if (error) { alert("Ошибка: " + error.message); return; }
  await loadMessages(currentChatId);
}

async function clearChatForBoth() {
  if (!currentChatId) return;
  const { error } = await supabase.from("messages").delete().eq("chat_id", currentChatId);
  if (error) { alert("Ошибка: " + error.message); return; }
  // Realtime сам удалит сообщения у обоих, но подстрахуемся локально:
  const box = document.getElementById("messages");
  box.innerHTML = '<div class="empty">Пока сообщений нет. Напиши первым!</div>';
}

async function hideChatFromList() {
  if (!currentChatId) return;
  const { error } = await supabase
    .from("chat_hides")
    .upsert({ chat_id: currentChatId, user_id: currentUser.id, hidden_at: new Date().toISOString() });
  if (error) { alert("Ошибка: " + error.message); return; }
  closeCurrentChat();
  await loadRecentChats();
}

async function deleteChatForBoth() {
  if (!currentChatId) return;
  const { error } = await supabase.from("chats").delete().eq("id", currentChatId);
  if (error) { alert("Ошибка: " + error.message); return; }
  closeCurrentChat();
  await loadRecentChats();
}

function closeCurrentChat() {
  currentChatId = null;
  currentOtherUser = null;
  if (currentChannel) { supabase.removeChannel(currentChannel); currentChannel = null; }
  document.getElementById("chat-content").classList.add("hidden");
  document.getElementById("chat-placeholder").classList.remove("hidden");
}

// ======================================================
// 14. XSS + автопроверка сессии
// ======================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const { data: { session } } = await supabase.auth.getSession();
if (session) showApp(session.user);
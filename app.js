// ======================================================
// Imaginer — точка входа
// ======================================================

const SUPABASE_URL = "https://uiktqkxfsoewjpgjpizf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3Rxa3hmc29ld2pwZ2pwaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODY5MjksImV4cCI6MjEwNDg2MjkyOX0.2OC3vrfusHK6Lqv1Yh5KfZ42Ypm02sE1XAloTSUxo2k";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================================================
// 1. ЭКРАНЫ ВХОДА / РЕГИСТРАЦИИ
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
    email,
    password,
    options: { data: { username, display_name: displayName } },
  });

  if (error) { errEl.textContent = error.message; return; }

  if (data.session) showApp(data.session.user);
  else {
    errEl.style.color = "#3ea6ff";
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
// 2. ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ======================================================

let currentUser = null;
let currentChatId = null;
let currentOtherUser = null;
let currentChannel = null;
let searchTimeout = null;

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
  if (currentChannel) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

// ======================================================
// 3. ИНИЦИАЛИЗАЦИЯ
// ======================================================

async function initApp() {
  await loadMyProfile();
  setupSearch();
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
// 4. НЕДАВНИЕ ЧАТЫ (показываются, когда поиск пустой)
// ======================================================

async function loadRecentChats() {
  const listEl = document.getElementById("users-list");
  document.getElementById("section-title").textContent = "Недавние чаты";
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';

  // 1) Все мои чаты
  const { data: myChats, error: e1 } = await supabase
    .from("chat_members")
    .select("chat_id")
    .eq("user_id", currentUser.id);

  if (e1 || !myChats || myChats.length === 0) {
    listEl.innerHTML = '<div class="empty">Введи @username выше, чтобы найти человека</div>';
    return;
  }

  const chatIds = myChats.map((c) => c.chat_id);

  // 2) Другие участники этих чатов
  const { data: others, error: e2 } = await supabase
    .from("chat_members")
    .select("chat_id, user_id")
    .in("chat_id", chatIds)
    .neq("user_id", currentUser.id);

  if (e2 || !others || others.length === 0) {
    listEl.innerHTML = '<div class="empty">Введи @username выше, чтобы найти человека</div>';
    return;
  }

  const userIds = [...new Set(others.map((o) => o.user_id))];

  // 3) Профили этих людей
  const { data: profiles, error: e3 } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  if (e3 || !profiles || profiles.length === 0) {
    listEl.innerHTML = '<div class="empty">Введи @username выше, чтобы найти человека</div>';
    return;
  }

  renderUsers(profiles);
}

// ======================================================
// 5. ПОИСК ПО @USERNAME
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

  // Пусто — возвращаемся к недавним
  if (!query) {
    await loadRecentChats();
    return;
  }

  titleEl.textContent = "Поиск";
  const clean = query.replace(/^@+/, "").trim().toLowerCase();

  if (!clean) {
    listEl.innerHTML = '<div class="empty">Начни вводить @username</div>';
    return;
  }

  listEl.innerHTML = '<div class="empty">Ищу...</div>';

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .neq("id", currentUser.id)
    .ilike("username", `%${clean}%`)
    .order("username")
    .limit(20);

  if (error) {
    listEl.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = `<div class="empty">Никого не найдено по «${escapeHtml(query)}»</div>`;
    return;
  }

  renderUsers(data);
}

// ======================================================
// 6. ОТРИСОВКА СПИСКА ЛЮДЕЙ
// ======================================================

function renderUsers(users) {
  const listEl = document.getElementById("users-list");

  if (!users.length) {
    listEl.innerHTML = '<div class="empty">Пусто</div>';
    return;
  }

  listEl.innerHTML = users.map((u) => {
    const initial = (u.display_name || "?")[0].toUpperCase();
    return `
      <div class="user-item" data-user-id="${u.id}">
        <div class="avatar">${initial}</div>
        <div class="user-item-info">
          <div class="user-item-name">${escapeHtml(u.display_name)}</div>
          <div class="user-item-username">@${escapeHtml(u.username)}</div>
        </div>
      </div>
    `;
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
// 7. ОТКРЫТИЕ ЧАТА
// ======================================================

async function openChatWith(otherUser) {
  currentOtherUser = otherUser;

  document.getElementById("chat-avatar").textContent = (otherUser.display_name || "?")[0].toUpperCase();
  document.getElementById("chat-title").textContent = otherUser.display_name;
  document.getElementById("chat-subtitle").textContent = "@" + otherUser.username;

  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-content").classList.remove("hidden");
  document.getElementById("messages").innerHTML = '<div class="empty">Загрузка сообщений...</div>';

  const chatId = await getOrCreateChat(otherUser.id);
  if (!chatId) {
    document.getElementById("messages").innerHTML = '<div class="empty">Не удалось открыть чат</div>';
    return;
  }

  currentChatId = chatId;
  await loadMessages(chatId);
  subscribeToChat(chatId);

  // Обновим список недавних — на случай, если чат новый
  if (!document.getElementById("search-input").value.trim()) {
    loadRecentChats();
  }
}

async function getOrCreateChat(otherUserId) {
  const { data: myMemberships, error: err1 } = await supabase
    .from("chat_members")
    .select("chat_id")
    .eq("user_id", currentUser.id);

  if (err1) { console.error(err1); return null; }

  const myChatIds = (myMemberships || []).map((m) => m.chat_id);

  if (myChatIds.length > 0) {
    const { data: shared, error: err2 } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", otherUserId)
      .in("chat_id", myChatIds);

    if (err2) { console.error(err2); }
    if (shared && shared.length > 0) return shared[0].chat_id;
  }

  const { data: newChat, error: chatErr } = await supabase
    .from("chats")
    .insert({})
    .select()
    .single();

  if (chatErr) { console.error(chatErr); return null; }

  const { error: membersErr } = await supabase
    .from("chat_members")
    .insert([
      { chat_id: newChat.id, user_id: currentUser.id },
      { chat_id: newChat.id, user_id: otherUserId },
    ]);

  if (membersErr) { console.error(membersErr); return null; }
  return newChat.id;
}

// ======================================================
// 8. СООБЩЕНИЯ
// ======================================================

async function loadMessages(chatId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  const box = document.getElementById("messages");

  if (error) {
    box.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`;
    return;
  }

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

  const time = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ВАЖНО: без пробелов между тегами — иначе pre-wrap их покажет
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

  const input = document.getElementById("message-input");
  const content = input.value.trim();
  if (!content) return;

  input.value = "";

  const { error } = await supabase.from("messages").insert({
    chat_id: currentChatId,
    sender_id: currentUser.id,
    content: content,
  });

  if (error) {
    console.error(error);
    alert("Не удалось отправить: " + error.message);
  }
});

// ======================================================
// 9. REALTIME
// ======================================================

function subscribeToChat(chatId) {
  if (currentChannel) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }

  currentChannel = supabase
    .channel("chat-" + chatId)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        if (payload.new.chat_id !== currentChatId) return;
        if (document.querySelector(`.msg[data-id="${payload.new.id}"]`)) return;
        appendMessage(payload.new);
        scrollToBottom();
      }
    )
    .subscribe((status) => console.log("Realtime:", status));
}

// ======================================================
// 10. XSS-защита и автопроверка сессии
// ======================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const { data: { session } } = await supabase.auth.getSession();
if (session) showApp(session.user);
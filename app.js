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
let allUsersCache = [];

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
  await loadUsers();
}

async function loadMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", currentUser.id)
    .single();

  if (error) { console.error("Не удалось загрузить профиль:", error); return; }

  document.getElementById("me-name").textContent = data.display_name;
  document.getElementById("me-username").textContent = "@" + data.username;
  document.getElementById("me-avatar").textContent = (data.display_name || "?")[0].toUpperCase();
}

async function loadUsers() {
  const listEl = document.getElementById("users-list");
  listEl.innerHTML = '<div class="empty">Загрузка...</div>';

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .neq("id", currentUser.id)
    .order("display_name");

  if (error) {
    listEl.innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`;
    return;
  }

  allUsersCache = data || [];

  if (allUsersCache.length === 0) {
    listEl.innerHTML = '<div class="empty">Пока никого нет. Позови друзей!</div>';
    return;
  }

  renderUsers(allUsersCache);
  setupSearch();
}

function renderUsers(users) {
  const listEl = document.getElementById("users-list");
  if (!users.length) {
    listEl.innerHTML = '<div class="empty">Никого не найдено</div>';
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
      const user = allUsersCache.find((u) => u.id === userId);
      if (!user) return;

      listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");

      openChatWith(user);
    });
  });
}

function setupSearch() {
  const input = document.getElementById("search-input");
  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    const filtered = allUsersCache.filter((u) =>
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
    renderUsers(filtered);
  };
}

// ======================================================
// 4. ОТКРЫТИЕ ЧАТА
// ======================================================

async function openChatWith(otherUser) {
  currentOtherUser = otherUser;

  // Заголовок
  document.getElementById("chat-avatar").textContent = (otherUser.display_name || "?")[0].toUpperCase();
  document.getElementById("chat-title").textContent = otherUser.display_name;
  document.getElementById("chat-subtitle").textContent = "@" + otherUser.username;

  // Переключаем заглушку на чат
  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-content").classList.remove("hidden");
  document.getElementById("messages").innerHTML = '<div class="empty">Загрузка сообщений...</div>';

  // Ищем или создаём чат
  const chatId = await getOrCreateChat(otherUser.id);
  if (!chatId) {
    document.getElementById("messages").innerHTML = '<div class="empty">Не удалось открыть чат</div>';
    return;
  }

  currentChatId = chatId;

  // Загружаем сообщения и подписываемся на новые
  await loadMessages(chatId);
  subscribeToChat(chatId);
}

// Находит существующий 1-на-1 чат между нами или создаёт новый
async function getOrCreateChat(otherUserId) {
  // Мои чаты
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

    if (shared && shared.length > 0) {
      return shared[0].chat_id;
    }
  }

  // Создаём новый чат
  const { data: newChat, error: chatErr } = await supabase
    .from("chats")
    .insert({})
    .select()
    .single();

  if (chatErr) { console.error("Не удалось создать чат:", chatErr); return null; }

  const { error: membersErr } = await supabase
    .from("chat_members")
    .insert([
      { chat_id: newChat.id, user_id: currentUser.id },
      { chat_id: newChat.id, user_id: otherUserId },
    ]);

  if (membersErr) { console.error("Не удалось добавить участников:", membersErr); return null; }

  return newChat.id;
}

// ======================================================
// 5. СООБЩЕНИЯ
// ======================================================

async function loadMessages(chatId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    document.getElementById("messages").innerHTML = `<div class="empty">Ошибка: ${error.message}</div>`;
    return;
  }

  const box = document.getElementById("messages");
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

  // Если есть заглушка «Загрузка...» или «Пока сообщений нет» — убираем
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

  el.innerHTML = `
    <div class="msg-text">${escapeHtml(msg.content || "")}</div>
    <div class="msg-time">${time}</div>
  `;

  box.appendChild(el);
}

function scrollToBottom() {
  const box = document.getElementById("messages");
  box.scrollTop = box.scrollHeight;
}

// Отправка сообщения
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
    console.error("Не удалось отправить:", error);
    alert("Не удалось отправить сообщение: " + error.message);
  }
  // Realtime сам пришлёт событие и отрисует сообщение — ничего не делаем вручную,
  // чтобы не было дублирования.
});

// ======================================================
// 6. REALTIME — подписка на новые сообщения
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
        // Не рисуем дважды
        if (document.querySelector(`.msg[data-id="${payload.new.id}"]`)) return;
        appendMessage(payload.new);
        scrollToBottom();
      }
    )
    .subscribe((status) => {
      console.log("Realtime-канал:", status);
    });
}

// ======================================================
// 7. XSS-защита и автопроверка сессии
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
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

  if (error) {
    errEl.textContent = error.message;
    return;
  }

  if (data.session) {
    showApp(data.session.user);
  } else {
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
  if (error) {
    errEl.textContent = error.message;
    return;
  }
  showApp(data.user);
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showAuth();
});

// ======================================================
// 2. ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
// ======================================================

let currentUser = null;

function showApp(user) {
  currentUser = user;
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  initApp();
}

function showAuth() {
  currentUser = null;
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

// ======================================================
// 3. ИНИЦИАЛИЗАЦИЯ ГЛАВНОГО ЭКРАНА
// ======================================================

async function initApp() {
  await loadMyProfile();
  await loadUsers();
}

// Загружаем свой профиль (имя, @username, аватарку)
async function loadMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error("Не удалось загрузить профиль:", error);
    return;
  }

  document.getElementById("me-name").textContent = data.display_name;
  document.getElementById("me-username").textContent = "@" + data.username;
  document.getElementById("me-avatar").textContent = (data.display_name || "?")[0].toUpperCase();
}

// Загружаем список всех пользователей, кроме себя
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

  if (!data || data.length === 0) {
    listEl.innerHTML = '<div class="empty">Пока никого нет. Позови друзей зарегистрироваться!</div>';
    return;
  }

  renderUsers(data);
  setupSearch(data);
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

  // Клик по человеку — пока просто выводим в консоль.
  // В следующем шаге откроем чат.
  listEl.querySelectorAll(".user-item").forEach((el) => {
    el.addEventListener("click", () => {
      const userId = el.dataset.userId;
      const userName = el.querySelector(".user-item-name").textContent;
      console.log("Открыть чат с:", userName, userId);

      listEl.querySelectorAll(".user-item").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");

      // Показываем заглушку в правой части
      const chatArea = document.getElementById("chat-area");
      chatArea.innerHTML = `
        <div class="chat-placeholder">
          <div class="chat-placeholder-icon">💬</div>
          <p>Чат с <b style="color:#e6ebf0">${escapeHtml(userName)}</b></p>
          <p style="font-size:13px">Отправка сообщений появится в следующем шаге.</p>
        </div>
      `;
    });
  });
}

function setupSearch(allUsers) {
  const input = document.getElementById("search-input");
  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    const filtered = allUsers.filter((u) =>
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
    renderUsers(filtered);
    // Перепривязываем обработчик поиска после перерендера
    setupSearch(allUsers);
  };
}

// Простая защита от XSS при выводе имён
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ======================================================
// 4. АВТОПРОВЕРКА СЕССИИ
// ======================================================

const { data: { session } } = await supabase.auth.getSession();
if (session) {
  showApp(session.user);
}
// ======================================================
// Imaginer — точка входа
// ======================================================

// --- 1. Ключи от Supabase ---
// ВСТАВЬ СЮДА свои значения из блокнота
const SUPABASE_URL = "https://uiktqkxfsoewjpgjpizf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3Rxa3hmc29ld2pwZ2pwaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODY5MjksImV4cCI6MjEwNDg2MjkyOX0.2OC3vrfusHK6Lqv1Yh5KfZ42Ypm02sE1XAloTSUxo2k";

// --- 2. Подключаем Supabase ---
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 3. Переключение между «Вход» и «Регистрация» ---
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

// --- 4. Регистрация ---
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
    options: {
      data: {
        username: username,
        display_name: displayName,
      },
    },
  });

  if (error) {
    errEl.textContent = error.message;
    return;
  }

  // Если в Supabase выключено подтверждение по email — сразу пускаем внутрь
  if (data.session) {
    showApp(data.session.user);
  } else {
    errEl.style.color = "#3ea6ff";
    errEl.textContent = "Проверь почту и подтверди email.";
  }
});

// --- 5. Вход ---
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  errEl.textContent = "";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errEl.textContent = error.message;
    return;
  }

  showApp(data.user);
});

// --- 6. Выход ---
document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showAuth();
});

// --- 7. Показ экранов ---
function showApp(user) {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  console.log("Вошёл:", user);
}

function showAuth() {
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

// --- 8. Проверка: если уже вошёл — сразу в приложение ---
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  showApp(session.user);
}
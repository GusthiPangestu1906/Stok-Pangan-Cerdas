/**
 * Login Controller
 * Part of Clean Architecture refactor for Stok Pangan Cerdas
 */

const el = {
  form: document.getElementById('form-login'),
  email: document.getElementById('input-email'),
  password: document.getElementById('input-password'),
  error: document.getElementById('login-error'),
  submit: document.getElementById('btn-login'),
};

/**
 * Redirects to dashboard if a valid session exists.
 */
async function checkAuth() {
  const token = getToken();
  if (!token) return;

  try {
    // Verify token with backend
    await fetchMe();
    window.location.href = 'index.html';
  } catch (err) {
    // Token expired or invalid
    console.warn("Session invalid, clearing token.");
    clearToken();
  }
}

/**
 * Handles the login form submission.
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = el.email.value.trim();
  const password = el.password.value;

  if (!email || !password) return;

  el.error.classList.add('hidden');
  el.submit.disabled = true;
  el.submit.textContent = 'Memproses...';

  try {
    await login(email, password);
    window.location.href = 'index.html';
  } catch (err) {
    el.error.textContent = err.message || 'Gagal masuk. Periksa email dan kata sandi.';
    el.error.classList.remove('hidden');
    el.submit.disabled = false;
    el.submit.textContent = 'Masuk';
  }
}

/**
 * Initialize Login Page
 */
function init() {
  checkAuth();

  if (el.form) {
    el.form.addEventListener('submit', handleLogin);
  }
}

// Start the app
init();

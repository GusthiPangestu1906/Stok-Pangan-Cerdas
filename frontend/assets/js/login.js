const el = {
  form: document.getElementById('form-login'),
  email: document.getElementById('input-email'),
  password: document.getElementById('input-password'),
  error: document.getElementById('login-error'),
  submit: document.getElementById('btn-login'),
};

// Sudah punya token yang valid? Langsung ke dashboard, tidak perlu login ulang.
(async function redirectIfAuthenticated() {
  if (!getToken()) return;
  try {
    await fetchMe();
    window.location.href = 'index.html';
  } catch {
    clearToken();
  }
})();

el.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.error.classList.add('hidden');
  el.submit.disabled = true;
  el.submit.textContent = 'Memproses...';

  try {
    await login(el.email.value.trim(), el.password.value);
    window.location.href = 'index.html';
  } catch (err) {
    el.error.textContent = err.message || 'Gagal masuk. Periksa email dan kata sandi.';
    el.error.classList.remove('hidden');
    el.submit.disabled = false;
    el.submit.textContent = 'Masuk';
  }
});

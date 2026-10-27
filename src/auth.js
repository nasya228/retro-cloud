import { supabase } from './supabase.js';
import { LOGO } from './utils.js';

// Понятные сообщения об ошибках на русском
function friendlyError(error) {
  const m = (error?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Неверная почта или пароль';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Пользователь с такой почтой уже существует';
  }
  if (m.includes('database error')) return 'Пользователь с таким именем уже существует';
  if (m.includes('password')) return 'Пароль должен содержать не менее 6 символов';
  if (m.includes('invalid') && m.includes('email')) return 'Введите корректный адрес почты';
  if (m.includes('rate limit')) return 'Слишком много попыток. Подождите немного';
  if (m.includes('fetch') || m.includes('network')) return 'Нет связи с сервером. Проверьте интернет';
  return 'Не удалось выполнить действие. Повторите попытку';
}

export async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('username, created_at')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export function renderAuth(app) {
  let mode = 'login';

  app.innerHTML = `
    <div class="auth-shell">
      <aside class="hero">
        <div class="brand">${LOGO}<span>Retro Cloud</span></div>
        <div class="hero__body">
          <h1>Ретро-игры<br />в облаке</h1>
          <p>Веб-приложение для облачной эмуляции игр. Войдите или создайте аккаунт, чтобы продолжить.</p>
        </div>
        <p class="hero__foot">Курсовой проект · 2026</p>
      </aside>

      <main class="auth-panel">
        <div class="card auth-card">
          <div class="brand brand--mobile">${LOGO}<span>Retro Cloud</span></div>

          <div class="seg" data-mode="login" role="tablist">
            <span class="seg__thumb"></span>
            <button class="seg__btn is-active" data-mode="login" role="tab" type="button">Вход</button>
            <button class="seg__btn" data-mode="register" role="tab" type="button">Регистрация</button>
          </div>

          <h2 id="title">С возвращением</h2>
          <p class="muted" id="subtitle">Войдите в свой аккаунт</p>

          <form class="form" novalidate>
            <label class="field" data-only="register" hidden>
              <span>Имя пользователя</span>
              <input name="username" type="text" autocomplete="username" maxlength="30" placeholder="Например, anastasia" />
            </label>
            <label class="field">
              <span>Электронная почта</span>
              <input name="email" type="email" autocomplete="email" placeholder="name@example.com" />
            </label>
            <label class="field">
              <span>Пароль</span>
              <div class="input-wrap">
                <input name="password" type="password" autocomplete="current-password" placeholder="Не менее 6 символов" />
                <button class="input-wrap__btn" type="button" id="toggle">Показать</button>
              </div>
            </label>
            <p class="alert" role="alert" hidden></p>
            <button class="btn btn--primary btn--block" type="submit">Войти</button>
          </form>
        </div>
      </main>
    </div>`;

  const seg = app.querySelector('.seg');
  const form = app.querySelector('form');
  const alertBox = app.querySelector('.alert');
  const submitBtn = form.querySelector('button[type="submit"]');
  const usernameField = form.querySelector('[data-only="register"]');
  const passwordInput = form.elements.password;
  const title = app.querySelector('#title');
  const subtitle = app.querySelector('#subtitle');

  const showError = (text) => {
    alertBox.textContent = text;
    alertBox.hidden = !text;
  };

  seg.querySelectorAll('.seg__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      seg.dataset.mode = mode;
      seg.querySelectorAll('.seg__btn').forEach((b) => b.classList.toggle('is-active', b === btn));
      const register = mode === 'register';
      usernameField.hidden = !register;
      title.textContent = register ? 'Создание аккаунта' : 'С возвращением';
      subtitle.textContent = register ? 'Это займёт меньше минуты' : 'Войдите в свой аккаунт';
      submitBtn.textContent = register ? 'Создать аккаунт' : 'Войти';
      passwordInput.autocomplete = register ? 'new-password' : 'current-password';
      showError('');
    });
  });

  app.querySelector('#toggle').addEventListener('click', (e) => {
    const hidden = passwordInput.type === 'password';
    passwordInput.type = hidden ? 'text' : 'password';
    e.currentTarget.textContent = hidden ? 'Скрыть' : 'Показать';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const username = form.elements.username.value.trim();

    if (!email || !password || (mode === 'register' && !username)) {
      return showError('Заполните обязательные поля');
    }
    if (mode === 'register' && password.length < 6) {
      return showError('Пароль должен содержать не менее 6 символов');
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        if (!data.session) {
          showError('Аккаунт создан. Подтвердите почту по письму и затем войдите.');
        }
      }
      // дальше всё делает main.js: он следит за входом в систему
    } catch (err) {
      console.error(err);
      showError(friendlyError(err));
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
    }
  });
}

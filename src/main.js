import './style.css';
import { supabase, configured } from './supabase.js';
import { renderAuth, fetchProfile } from './auth.js';
import { renderAccount } from './account.js';

const app = document.getElementById('app');

const state = { userId: null };
let started = false;

function showAuth() {
  window.scrollTo(0, 0);
  renderAuth(app);
}

function showAccount(user, profile) {
  window.scrollTo(0, 0);
  renderAccount(app, { user, profile, onLogout: () => supabase.auth.signOut() });
}

async function applySession(session) {
  const user = session?.user ?? null;
  const id = user?.id ?? null;
  if (started && id === state.userId) return; // например, обновился токен — экран не трогаем
  started = true;
  state.userId = id;

  if (!user) return showAuth();
  const profile = await fetchProfile(user.id);
  showAccount(user, profile);
}

if (!configured) {
  app.innerHTML = `
    <div class="center">
      <div class="card notice">
        <h2>База данных не подключена</h2>
        <p class="muted">
          Создайте в корне проекта файл <code>.env</code> и впишите адрес проекта и ключ Supabase
          (образец — файл <code>.env.example</code>). Затем перезапустите сайт командой
          <code>npm run dev</code>.
        </p>
      </div>
    </div>`;
} else {
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => applySession(session), 0);
  });
  supabase.auth.getSession().then(({ data }) => applySession(data.session));
}

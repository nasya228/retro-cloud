import { LOGO, escapeHtml, formatDate } from './utils.js';

// ---------- значки (простые линии) ----------
const svg = (body) =>
  `<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICONS = {
  library: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  play: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  saves: svg('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  controls: svg('<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="11" r="1"/><circle cx="18" cy="13" r="1"/>'),
  profile: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  upload: svg('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>'),
};

const SECTIONS = [
  { id: 'library', label: 'Библиотека' },
  { id: 'play', label: 'Игра' },
  { id: 'saves', label: 'Сохранения' },
  { id: 'controls', label: 'Управление' },
  { id: 'profile', label: 'Профиль' },
];

const SOON = 'Эта функция появится на следующем этапе разработки';

// Кнопка-заглушка: выглядит как обычная, но ничего не делает (только показывает подсказку)
const soonBtn = (label, cls = '', icon = '') =>
  `<button class="btn ${cls} is-soon" data-soon type="button" aria-disabled="true">${icon}${label}</button>`;

// Клавиши по умолчанию (только для показа)
const KEYS = [
  ['Вверх', '↑', 'Кнопка 12'],
  ['Вниз', '↓', 'Кнопка 13'],
  ['Влево', '←', 'Кнопка 14'],
  ['Вправо', '→', 'Кнопка 15'],
  ['Кнопка A', 'X', 'Кнопка 1'],
  ['Кнопка B', 'Z', 'Кнопка 0'],
  ['Select', 'Shift', 'Кнопка 8'],
  ['Start', 'Enter', 'Кнопка 9'],
];

export function renderAccount(app, { user, profile, onLogout }) {
  const username = profile?.username ?? user.email.split('@')[0];
  const initial = escapeHtml(username.charAt(0).toUpperCase());
  const created = profile?.created_at ?? user.created_at;

  // ---------- содержимое разделов ----------
  const views = {
    library: () => `
      <div class="page-head">
        <div>
          <h1>Библиотека</h1>
          <p class="muted">Здесь будут храниться ваши игры для NES.</p>
        </div>
        ${soonBtn('Загрузить игру', 'btn--primary', ICONS.upload)}
      </div>
      <div class="empty">
        <div class="empty__icon">${ICONS.library}</div>
        <h3>Библиотека пуста</h3>
        <p>Загрузите файл игры в формате .nes, чтобы начать.</p>
      </div>`,

    play: () => `
      <div class="page-head">
        <div>
          <h1>Игра</h1>
          <p class="muted">Здесь откроется встроенный эмулятор NES.</p>
        </div>
      </div>
      <div class="player-grid">
        <div class="screen">
          <div class="screen__inner">
            ${ICONS.play}
            <p class="screen__title">Игра не выбрана</p>
            <p class="screen__sub">Выберите игру в библиотеке</p>
          </div>
        </div>
        <aside class="card side">
          <h3>Управление игрой</h3>
          ${soonBtn('Сохранить состояние', 'btn--block')}
          ${soonBtn('Загрузить состояние', 'btn--block btn--ghost')}
          ${soonBtn('Настроить управление', 'btn--block btn--ghost')}
          ${soonBtn('Звук: включён', 'btn--block btn--ghost')}
          <div class="side__keys">
            <h3>Клавиши</h3>
            <ul>
              ${KEYS.map(([name, key]) => `<li><span>${name}</span><kbd>${key}</kbd></li>`).join('')}
            </ul>
          </div>
        </aside>
      </div>`,

    saves: () => `
      <div class="page-head">
        <div>
          <h1>Сохранения</h1>
          <p class="muted">Сохранённые состояния игр хранятся в облаке.</p>
        </div>
      </div>
      <div class="empty">
        <div class="empty__icon">${ICONS.saves}</div>
        <h3>Сохранений пока нет</h3>
        <p>Они появятся здесь, когда вы сохраните состояние игры.</p>
      </div>`,

    controls: () => `
      <div class="page-head">
        <div>
          <h1>Управление</h1>
          <p class="muted">Раскладка клавиатуры и геймпада для кнопок NES.</p>
        </div>
        ${soonBtn('Сбросить по умолчанию', 'btn--ghost')}
      </div>
      <section class="card table-card">
        <table class="table">
          <thead><tr><th>Кнопка NES</th><th>Клавиатура</th><th>Геймпад</th><th></th></tr></thead>
          <tbody>
            ${KEYS.map(
              ([name, key, pad]) => `<tr>
                <td>${name}</td>
                <td><kbd>${key}</kbd></td>
                <td><kbd>${pad}</kbd></td>
                <td class="table__act">${soonBtn('Изменить', 'btn--small btn--ghost')}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>
      </section>`,

    profile: () => `
      <div class="page-head">
        <div>
          <h1>Профиль</h1>
          <p class="muted">Вы успешно вошли в систему.</p>
        </div>
      </div>
      <section class="card info">
        <div class="info__row"><span class="info__label">Имя пользователя</span><span class="info__value">${escapeHtml(username)}</span></div>
        <div class="info__row"><span class="info__label">Электронная почта</span><span class="info__value">${escapeHtml(user.email)}</span></div>
        <div class="info__row"><span class="info__label">Дата регистрации</span><span class="info__value">${escapeHtml(formatDate(created))}</span></div>
        <div class="info__row"><span class="info__label">Идентификатор</span><span class="info__value info__value--mono">${escapeHtml(user.id)}</span></div>
      </section>
      <p class="note"><span class="dot"></span>Данные профиля получены из базы данных (таблица profiles)</p>`,
  };

  // ---------- каркас страницы ----------
  app.innerHTML = `
    <div class="app-shell">
      <header class="nav">
        <div class="brand">${LOGO}<span>Retro Cloud</span></div>
        <div class="nav__right">
          <span class="chip"><span class="chip__avatar">${initial}</span>${escapeHtml(username)}</span>
          <button class="btn btn--ghost" id="logout" type="button">Выйти</button>
        </div>
      </header>
      <div class="layout">
        <nav class="sidebar" aria-label="Разделы">
          ${SECTIONS.map(
            (s) => `<button class="side-link" data-section="${s.id}" type="button">${ICONS[s.id]}<span>${s.label}</span></button>`
          ).join('')}
          <p class="sidebar__foot">Прототип · этап 1</p>
        </nav>
        <main class="content" id="content"></main>
      </div>
      <div class="toasts" id="toasts" aria-live="polite"></div>
    </div>`;

  const content = app.querySelector('#content');

  function show(id) {
    content.innerHTML = `<div class="fade">${views[id]()}</div>`;
    app.querySelectorAll('.side-link').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.section === id)
    );
  }

  function toast(text) {
    const box = app.querySelector('#toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  app.addEventListener('click', (e) => {
    const link = e.target.closest('[data-section]');
    if (link) return show(link.dataset.section);
    if (e.target.closest('[data-soon]')) toast(SOON);
  });
  app.querySelector('#logout').addEventListener('click', onLogout);

  show('library');
}
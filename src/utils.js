export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Логотип: скруглённый квадрат с треугольником «play»
export const LOGO = `
  <svg class="logo" width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="currentColor"></rect>
    <path d="M12 9.5v13l11-6.5z" fill="var(--bg)"></path>
  </svg>`;

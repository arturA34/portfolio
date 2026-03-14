import { createClient } from '@supabase/supabase-js';

// Cursor
const cursor = document.getElementById('cursor');
const dot = document.getElementById('cursor-dot');
let mx = 0; let my = 0; let cx = 0; let cy = 0;

document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

function animCursor() {
  cx += (mx - cx) * 0.15;
  cy += (my - cy) * 0.15;
  cursor.style.left = `${cx}px`;
  cursor.style.top = `${cy}px`;
  dot.style.left = `${mx}px`;
  dot.style.top = `${my}px`;
  requestAnimationFrame(animCursor);
}
animCursor();

document.querySelectorAll('a, button, .project-card, .contact-item').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '36px';
    cursor.style.height = '36px';
    cursor.style.background = 'rgba(0,255,65,0.1)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '18px';
    cursor.style.height = '18px';
    cursor.style.background = '';
  });
});

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// Clock
function updateTime() {
  const now = new Date();
  document.getElementById('time').textContent = now.toLocaleTimeString('ru-RU', { hour12: false });
}
updateTime();
setInterval(updateTime, 1000);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const form = document.getElementById('contact-form');
const nameInput = document.getElementById('contact-name');
const telegramInput = document.getElementById('telegram-input');
const messageInput = document.getElementById('contact-message');
const telegramValidation = document.getElementById('telegram-validation');
const formSubmitStatus = document.getElementById('form-submit-status');

function setSubmitStatus(type, message) {
  if (!formSubmitStatus) return;

  formSubmitStatus.classList.remove('status-error', 'status-success', 'status-pending');
  formSubmitStatus.textContent = message;

  if (type === 'error') formSubmitStatus.classList.add('status-error');
  if (type === 'success') formSubmitStatus.classList.add('status-success');
  if (type === 'pending') formSubmitStatus.classList.add('status-pending');
}

function setTelegramValidationState(type, message) {
  if (!telegramInput || !telegramValidation) return;

  telegramInput.classList.remove('input-invalid', 'input-valid');
  telegramValidation.classList.remove('is-error', 'is-success');
  telegramValidation.textContent = message;

  if (type === 'error') {
    telegramInput.classList.add('input-invalid');
    telegramValidation.classList.add('is-error');
  }

  if (type === 'success') {
    telegramInput.classList.add('input-valid');
    telegramValidation.classList.add('is-success');
  }
}

function parseTelegramUsername(rawValue) {
  const value = rawValue.trim();
  if (!value) return { valid: false, message: 'Укажите Telegram username или ссылку t.me' };

  let username = '';

  if (value.startsWith('@')) {
    username = value.slice(1);
  } else if (value.includes('t.me') || value.includes('telegram.me')) {
    let normalized = value;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    try {
      const url = new URL(normalized);
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      if (host !== 't.me' && host !== 'telegram.me') {
        return { valid: false, message: 'Разрешены только ссылки t.me или telegram.me' };
      }
      username = url.pathname.replace(/^\/+/, '').split('/')[0];
    } catch (_error) {
      return { valid: false, message: 'Некорректная ссылка Telegram' };
    }
  } else {
    return { valid: false, message: 'Введите @username или ссылку вида https://t.me/username' };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(username)) {
    return { valid: false, message: 'Username: 5-32 символа, латиница/цифры/_, с буквы' };
  }

  return { valid: true, username: `@${username}` };
}

if (telegramInput) {
  telegramInput.addEventListener('input', () => {
    if (!telegramInput.value.trim()) {
      setTelegramValidationState('idle', '');
      return;
    }

    const result = parseTelegramUsername(telegramInput.value);
    if (!result.valid) {
      setTelegramValidationState('error', result.message);
      return;
    }

    setTelegramValidationState('success', `Будет использован ${result.username}`);
  });
}

// Form submit
async function handleSubmit(btn) {
  const name = nameInput ? nameInput.value.trim() : '';
  const message = messageInput ? messageInput.value.trim() : '';
  const telegramResult = parseTelegramUsername(telegramInput ? telegramInput.value : '');

  setSubmitStatus('idle', '');

  if (name.length < 2 || name.length > 100) {
    setSubmitStatus('error', 'Имя должно быть от 2 до 100 символов');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!telegramResult.valid) {
    setTelegramValidationState('error', telegramResult.message);
    setSubmitStatus('error', 'Проверьте поле Telegram username');
    if (telegramInput) telegramInput.focus();
    return;
  }

  if (message.length < 10 || message.length > 3000) {
    setSubmitStatus('error', 'Сообщение должно быть от 10 до 3000 символов');
    if (messageInput) messageInput.focus();
    return;
  }

  if (!supabase) {
    setSubmitStatus('error', 'Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY');
    return;
  }

  if (telegramInput) telegramInput.value = telegramResult.username;
  setTelegramValidationState('success', `Будет использован ${telegramResult.username}`);

  btn.disabled = true;
  btn.textContent = 'sending...';
  btn.style.opacity = '0.6';
  setSubmitStatus('pending', 'Отправляем сообщение в базу...');

  const { error } = await supabase.from('contact_messages').insert({
    name,
    telegram_username: telegramResult.username,
    message,
  });

  if (error) {
    setSubmitStatus('error', `Ошибка отправки: ${error.message}`);
    btn.disabled = false;
    btn.textContent = './send.sh';
    btn.style.opacity = '1';
    return;
  }

  setSubmitStatus('success', 'Сообщение сохранено в базе данных');
  btn.textContent = '[200 OK] Sent!';
  btn.style.background = 'transparent';
  btn.style.color = 'var(--green)';

  if (form) form.reset();
  setTelegramValidationState('idle', '');

  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = './send.sh';
    btn.style.opacity = '1';
    btn.style.background = '';
    btn.style.color = '';
  }, 2200);
}

// Keep compatibility with inline onclick in HTML.
window.handleSubmit = handleSubmit;

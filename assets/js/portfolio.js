  // Cursor
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  let mx = 0, my = 0, cx = 0, cy = 0;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function animCursor() {
    cx += (mx - cx) * 0.15;
    cy += (my - cy) * 0.15;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();

  document.querySelectorAll('a, button, .project-card, .contact-item').forEach(el => {
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
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Clock
  function updateTime() {
    const now = new Date();
    document.getElementById('time').textContent =
      now.toLocaleTimeString('ru-RU', { hour12: false });
  }
  updateTime();
  setInterval(updateTime, 1000);

  const formSubmitButton = document.querySelector('.form-submit');
  if (formSubmitButton) {
    formSubmitButton.addEventListener('click', () => handleSubmit(formSubmitButton));
  }

  // Form submit
  function handleSubmit(btn) {
    btn.textContent = 'sending...';
    btn.style.opacity = '0.6';
    setTimeout(() => {
      btn.textContent = '[200 OK] Sent!';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--green)';
    }, 1500);
  }

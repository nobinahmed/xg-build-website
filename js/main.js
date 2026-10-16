(() => {
  'use strict';

  /* ---------- Mobile menu ---------- */
  const menu = document.getElementById('mobile-menu');
  const toggle = document.querySelector('.header__toggle');

  const setMenu = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    if (open) menu.querySelector('.menu__close').focus();
  };

  toggle.addEventListener('click', () => setMenu(true));
  menu.querySelector('.menu__close').addEventListener('click', () => { setMenu(false); toggle.focus(); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Carousels: drag to scroll + arrow buttons ---------- */
  document.querySelectorAll('[data-carousel]').forEach((track) => {
    const prev = document.querySelector(`[data-carousel-prev="${track.id}"]`);
    const next = document.querySelector(`[data-carousel-next="${track.id}"]`);

    const step = () => {
      const first = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    };

    const update = () => {
      if (!prev || !next) return;
      const max = track.scrollWidth - track.clientWidth - 1;
      prev.disabled = track.scrollLeft <= 0;
      next.disabled = track.scrollLeft >= max;
    };

    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') track.scrollBy({ left: step(), behavior: 'smooth' });
      if (e.key === 'ArrowLeft') track.scrollBy({ left: -step(), behavior: 'smooth' });
    });

    // Mouse drag (touch devices already scroll natively)
    let startX = 0, startScroll = 0, lastX = 0, velocity = 0, dragging = false, raf = 0;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      startX = lastX = e.clientX;
      startScroll = track.scrollLeft;
      velocity = 0;
      cancelAnimationFrame(raf);
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) track.classList.add('is-dragging');
      velocity = e.clientX - lastX;
      lastX = e.clientX;
      track.scrollLeft = startScroll - dx;
    });

    const release = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      const glide = () => {
        if (Math.abs(velocity) < 0.5) return;
        track.scrollLeft -= velocity;
        velocity *= 0.94;
        raf = requestAnimationFrame(glide);
      };
      glide();
    };

    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
  });

  /* ---------- Reel lightbox ---------- */
  const dialog = document.getElementById('reel-dialog');
  const reel = dialog.querySelector('video');

  document.querySelectorAll('[data-reel-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dialog.showModal();
      reel.play().catch(() => {});
    });
  });
  dialog.querySelector('.reel-dialog__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => reel.pause());

  /* ---------- Contact form ----------
     Posts to contact.php, which emails the enquiry to enquiries@xgbuild.com.au. */
  const form = document.getElementById('contact-form');
  const status = form.querySelector('.contact__status');
  const submit = form.querySelector('[type="submit"]');

  const showStatus = (text, ok) => {
    status.textContent = text;
    status.classList.toggle('is-error', !ok);
  };

  const sent = new URLSearchParams(location.search).get('sent');
  if (sent !== null) {
    showStatus(sent === '1' ? 'Thanks — we’ll be in touch soon.' : 'Sorry, your message couldn’t be sent. Please call us on +61 424 204 690.', sent === '1');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submit.disabled = true;
    showStatus('Sending…', true);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'fetch' },
      });
      const data = await res.json();
      showStatus(data.message, data.ok);
      if (data.ok) form.reset();
    } catch {
      showStatus('Sorry, your message couldn’t be sent. Please call us on +61 424 204 690.', false);
    } finally {
      submit.disabled = false;
    }
  });

  /* ---------- Scroll reveal ---------- */
  const targets = document.querySelectorAll(
    '.about__head, .about__photo, .about__reel, .about__copy, .card, .slide, .tile, .contact__form'
  );
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -5% 0px' });
    targets.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
  }
})();

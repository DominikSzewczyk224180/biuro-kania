/* ═══════════════════════════════════════════════
   Biuro Rachunkowe Dagmara Kania — main.js
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nawigacja: cień po przewinięciu ───────── */
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ── Scroll reveal ─────────────────────────── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.service-card, .stat-box').forEach((el, i) => {
        el.style.transition = 'opacity .6s ease, transform .6s ease';
        el.style.transitionDelay = (i * 0.09) + 's';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.reveal').forEach(el => {
    el.querySelectorAll('.service-card, .stat-box').forEach(child => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(16px)';
    });
    revealObserver.observe(el);
  });

  /* ── Aktywny link w nawigacji ──────────────── */
  document.querySelectorAll('section[id]').forEach(section => {
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.nav-links a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' }).observe(section);
  });

  /* ── Płynne przewijanie ────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── Animowany licznik ─────────────────────── */
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / 1400, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(ease * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

});

/* ═══════════════════════════════════════════════
   Biuro Rachunkowe Dagmara Kania — main.js
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nawigacja: cień po przewinięciu ─────────── */
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });


  /* ── Scroll reveal ───────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');

      // staggered children (karty, stat-boxy)
      entry.target.querySelectorAll('.service-card, .stat-box, .reveal-child')
        .forEach((el, i) => {
          el.style.transitionDelay = `${i * 0.09}s`;
          el.classList.add('visible');
        });

      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.07 });

  revealEls.forEach(el => revealObserver.observe(el));


  /* ── Aktywny link w nawigacji ────────────────── */
  const sections   = document.querySelectorAll('section[id]');
  const navLinks   = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => sectionObserver.observe(s));


  /* ── Płynne przewijanie do sekcji ───────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });


  /* ── Animacja licznika w statystykach ────────── */
  function animateCount(el, target, suffix = '') {
    let start = 0;
    const duration = 1400;
    const step = timestamp => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const raw = el.dataset.count;
      const suffix = el.dataset.suffix || '';
      if (raw) animateCount(el, parseInt(raw, 10), suffix);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

});

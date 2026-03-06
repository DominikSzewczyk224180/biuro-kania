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
        el.style.transitionDelay = `${i * 0.09}s`;
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.reveal').forEach(el => {
    // inicjalnie ukryj dzieci kart
    el.querySelectorAll('.service-card, .stat-box').forEach(child => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(16px)';
      child.style.transition = 'opacity .6s ease, transform .6s ease';
    });
    revealObserver.observe(el);
  });


  /* ── Aktywny link w nawigacji ──────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' }).observe;

  sections.forEach(s => {
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' }).observe(s);
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
  function animateCount(el, target, suffix) {
    let start = null;
    const duration = 1400;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const raw = el.dataset.count;
      if (raw) animateCount(el, parseInt(raw, 10), el.dataset.suffix || '');
    });
  }, { threshold: 0.6 }).observe(
    ...Array.from(document.querySelectorAll('[data-count]'))
  );

  // Bezpieczna wersja observe dla wielu elementów
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const raw = el.dataset.count;
      if (raw) animateCount(el, parseInt(raw, 10), el.dataset.suffix || '');
      counterObs.unobserve(el);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

});

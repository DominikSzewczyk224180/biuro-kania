/* ═══════════════════════════════════════════════
   Biuro Rachunkowe Dagmara Kania — main.js
═══════════════════════════════════════════════ */

// ⚠️ ZMIEŃ na URL Railway po deployu (np. https://biuro-kania-api.up.railway.app)
// Po migracji na seohost zmień na https://api.biuro-kania.pl
const API_URL = 'https://biuro-kania-production.up.railway.app';

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


  /* ═══════════════════════════════════════════
     AKTUALNOŚCI — pobieranie z API
  ═══════════════════════════════════════════ */

  const newsGrid = document.getElementById('news-grid');
  const modal = document.getElementById('news-modal');
  const modalBody = document.getElementById('news-modal-body');
  const modalClose = document.getElementById('news-modal-close');

  const categoryClass = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('ciekawost')) return 'news-category--ciekawostka';
    if (c.includes('zmiana') || c.includes('przepis')) return 'news-category--zmiana';
    if (c.includes('ogłosz') || c.includes('biur')) return 'news-category--ogloszenie';
    return 'news-category--ciekawostka';
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
                    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const truncate = (text, max = 180) => {
    if (!text || text.length <= max) return text || '';
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return cut.slice(0, lastSpace > 0 ? lastSpace : max) + '…';
  };

  async function loadPosts() {
    try {
      const res = await fetch(`${API_URL}/news`, { cache: 'no-store' });
      if (!res.ok) throw new Error('API error: ' + res.status);
      const data = await res.json();
      return data.posts || [];
    } catch (e) {
      console.warn('Błąd ładowania aktualności:', e);
      // Fallback do news.json jeśli API nie odpowiada
      try {
        const fallback = await fetch('news.json', { cache: 'no-store' });
        if (fallback.ok) {
          const data = await fallback.json();
          return data.posts || [];
        }
      } catch (_) {}
      return [];
    }
  }

  function renderPosts(posts) {
    if (!newsGrid) return;
    if (!posts || posts.length === 0) {
      newsGrid.innerHTML = '<div class="news-empty">Brak aktualności do wyświetlenia.</div>';
      return;
    }

    const sorted = [...posts].sort((a, b) =>
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );

    newsGrid.innerHTML = sorted.map(post => `
      <article class="news-card" data-id="${post.id}">
        <span class="news-category ${categoryClass(post.category)}">${escapeHtml(post.category)}</span>
        <h3 class="news-title">${escapeHtml(post.title)}</h3>
        <p class="news-excerpt">${escapeHtml(truncate(post.content))}</p>
        <div class="news-footer">
          <span class="news-date">${formatDate(post.date)}</span>
          <span class="news-readmore">Czytaj więcej →</span>
        </div>
      </article>
    `).join('');

    newsGrid.querySelectorAll('.news-card').forEach(card => {
      card.addEventListener('click', () => {
        const post = sorted.find(p => p.id === card.dataset.id);
        if (post) openModal(post);
      });
    });
  }

  function openModal(post) {
    modalBody.innerHTML = `
      <span class="news-category ${categoryClass(post.category)}">${escapeHtml(post.category)}</span>
      <h2 class="news-title">${escapeHtml(post.title)}</h2>
      <span class="news-date">${formatDate(post.date)}</span>
      <div class="news-content">${escapeHtml(post.content)}</div>
    `;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  if (newsGrid) {
    loadPosts().then(renderPosts);
  }
});

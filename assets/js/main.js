/* Embedded Linux Blog - JS nhỏ, không phụ thuộc thư viện. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------- theme sáng / tối (mặc định tối) ---------------- */
  const root = document.documentElement;
  $('#theme-toggle')?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------------- sidebar mobile + dropdown Boards ---------------- */
  const body = document.body, toggle = $('#sidebar-toggle'), backdrop = $('#sidebar-backdrop');
  const openSidebar = (o) => { body.classList.toggle('sidebar-open', o); backdrop.hidden = !o; toggle?.setAttribute('aria-expanded', o); };
  toggle?.addEventListener('click', () => openSidebar(!body.classList.contains('sidebar-open')));
  backdrop?.addEventListener('click', () => openSidebar(false));
  $$('.side-nav .caret').forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const sub = btn.closest('.nav-item').querySelector('.sub-nav');
    const open = sub.hidden; sub.hidden = !open; btn.setAttribute('aria-expanded', open);
  }));

  /* ---------------- copy code ---------------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn'); if (!btn) return;
    const code = btn.closest('.code-block')?.querySelector('pre code, pre');
    if (!code) return;
    const clone = code.cloneNode(true);
    clone.querySelectorAll('.t-p').forEach(p => {              // không copy prompt user@host:~$
      const t = p.nextSibling; if (t?.nodeType === 3) t.data = t.data.replace(/^ /, '');
      p.remove();
    });
    navigator.clipboard.writeText(clone.innerText.replace(/\n$/, '')).then(() => {
      const label = btn.querySelector('span'); const old = label.textContent;
      label.textContent = btn.dataset.copied; btn.classList.add('done');
      setTimeout(() => { label.textContent = old; btn.classList.remove('done'); }, 1600);
    });
  });

  /* ---------------- TOC: highlight mục đang đọc ----------------
     `article` = phạm vi tìm heading (infinite scroll: chỉ trong bài đang đọc). */
  let tocObs = null;
  function watchToc(article) {
    tocObs?.disconnect(); tocObs = null;
    const toc = $('#toc'); if (!toc) return;
    const links = $$('a[href^="#"]', toc); if (!links.length) return;
    const scope = article || document, byHead = new Map();
    links.forEach(a => {
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      const h = scope.querySelector('#' + CSS.escape(id)); if (h) byHead.set(h, a);
    });
    tocObs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const cur = byHead.get(en.target);
        links.forEach(a => a.classList.toggle('active', a === cur));
      });
    }, { rootMargin: '-70px 0px -70% 0px', threshold: 0 });
    byHead.forEach((_, h) => tocObs.observe(h));
  }
  watchToc();

  /* ---------------- dải board: rê chuột -> khung xem trước bài trên board ----------------
     Popup gắn vào <body> (dải có overflow:hidden nên không đặt bên trong được); mở thì dừng marquee.
     Chỉ bật cho thiết bị có chuột; màn cảm ứng bấm thẳng vào trang board. */
  const strip = $('.hero-boards');
  if (strip && matchMedia('(hover: hover)').matches) {
    const pop = document.createElement('div');
    pop.className = 'board-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog');
    document.body.appendChild(pop);
    let current = null, hideTimer = null;
    const place = (card) => {
      const r = card.getBoundingClientRect(), w = pop.offsetWidth, vw = document.documentElement.clientWidth;
      const left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, vw - w - 12));
      pop.style.left = (left + scrollX) + 'px';
      pop.style.top = (r.bottom + 8 + scrollY) + 'px';
    };
    const show = (card) => {
      const tpl = document.getElementById('bp-' + card.dataset.preview); if (!tpl) return;
      clearTimeout(hideTimer);
      if (current !== card) { pop.replaceChildren(tpl.content.cloneNode(true)); current = card; }
      pop.hidden = false; strip.classList.add('paused'); place(card);
    };
    const hide = (now) => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { pop.hidden = true; current = null; strip.classList.remove('paused'); }, now ? 0 : 180);
    };
    strip.addEventListener('mouseover', (e) => { const c = e.target.closest('.hero-board'); if (c) show(c); });
    strip.addEventListener('mouseleave', () => hide());
    strip.addEventListener('focusin', (e) => { const c = e.target.closest('.hero-board'); if (c) show(c); });
    strip.addEventListener('focusout', () => hide());
    pop.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    pop.addEventListener('mouseleave', () => hide());
    addEventListener('scroll', () => { if (!pop.hidden) hide(true); }, { passive: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) hide(true); });
  }

  /* ---------------- slideshow (người đóng góp) ----------------
     [data-slider] > .author-slides > .author-slide*; data-auto = ms tự chuyển; rê chuột / focus thì dừng. */
  $$('[data-slider]').forEach(sl => {
    const track = $('.author-slides', sl), n = $$('.author-slide', sl).length; if (n < 2 || !track) return;
    const dots = $$('.dot', sl); let i = 0, timer = null;
    const go = (k) => { i = (k + n) % n; track.style.transform = `translateX(-${i * 100}%)`; dots.forEach((d, j) => d.classList.toggle('active', j === i)); };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => { stop(); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go(i + 1), +sl.dataset.auto || 6000); };
    $('.prev', sl)?.addEventListener('click', () => { go(i - 1); start(); });
    $('.next', sl)?.addEventListener('click', () => { go(i + 1); start(); });
    dots.forEach((d, j) => d.addEventListener('click', () => { go(j); start(); }));
    sl.addEventListener('mouseenter', stop); sl.addEventListener('mouseleave', start);
    sl.addEventListener('focusin', stop); sl.addEventListener('focusout', start);
    if (sl.dataset.auto) start();
  });

  /* ---------------- search (Pagefind JS API) ----------------
     Kết quả gọn: thumbnail + tiêu đề + tối đa 2 mục con (heading) có từ khoá, xếp theo thứ tự trong bài. */
  const modal = $('#search-modal'), openBtn = $('#search-open');
  if (modal) {
    const input = $('#search-input'), list = $('#search-results'), status = $('#search-status'), moreBtn = $('#search-more');
    const t = (k, v = {}) => (modal.dataset['t' + k] || '').replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
    const PAGE = 8, MAX_SUBS = 2;
    let pagefind = null, results = [], shown = 0, seq = 0, timer = null;

    const loadPagefind = async () => {
      if (!pagefind) { pagefind = await import('/pagefind/pagefind.js'); await pagefind.options({ excerptLength: 16 }); pagefind.init(); }
      return pagefind;
    };
    const esc = (x) => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // excerpt của Pagefind là HTML có <mark>: parse trong document trơ, chỉ giữ text + <mark>
    // `skip`: bỏ phần đầu đoạn trích nếu nó lặp lại tên heading (Pagefind gộp heading vào excerpt của mục con)
    const safeExcerpt = (html, skip = '') => {
      const doc = new DOMParser().parseFromString('<p>' + (html || '') + '</p>', 'text/html');
      const nodes = Array.from(doc.body.firstChild.childNodes).map(n => ({ mark: n.nodeName === 'MARK', text: n.textContent }));
      const plain = nodes.map(n => n.text).join(''), low = plain.toLowerCase();
      const full = skip.trim().toLowerCase();
      let cut = 0;
      // heading nguyên văn (có hoặc không có số mục) ở đầu, hoặc đoạn trích bắt đầu giữa chừng heading
      for (const h of [full, full.replace(/^[\d.]+\s*/, '')]) {
        const at = h.length > 2 ? low.indexOf(h) : -1;
        if (at >= 0 && at < 4) { cut = at + h.length; break; }
      }
      if (!cut) for (let k = full.length - 1; k >= 6; k--) { if (low.startsWith(full.slice(-k))) { cut = k; break; } }
      if (cut) {
        while (cut < plain.length && /[\s.:?!]/.test(plain[cut])) cut++;
        for (const n of nodes) { const k = Math.min(cut, n.text.length); n.text = n.text.slice(k); cut -= k; if (!cut) break; }
      }
      return nodes.filter(n => n.text).map(n => n.mark ? '<mark>' + esc(n.text) + '</mark>' : esc(n.text)).join('');
    };
    const markTitle = (title, q) => {
      const words = q.trim().split(/\s+/).filter(w => w.length > 1).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      let out = esc(title);
      if (words.length) out = out.replace(new RegExp('(' + words.map(esc).join('|') + ')', 'gi'), '<mark>$1</mark>');
      return out;
    };
    const weight = (sub) => (sub.weighted_locations || []).reduce((n, l) => n + (l.weight || 1), 0);
    function pickSubs(d) {
      const root = (d.url || '').split('#')[0];
      let subs = (d.sub_results || []).filter(x => (x.locations || []).length && x.url.split('#')[0] === root && x.url.includes('#'));
      subs = subs.sort((x, y) => weight(y) - weight(x)).slice(0, MAX_SUBS).sort((x, y) => x.locations[0] - y.locations[0]);
      return subs;
    }
    function render(d, q) {
      const li = document.createElement('li'); li.className = 'sr-item';
      const img = d.meta?.image;
      const subs = pickSubs(d);
      li.innerHTML =
        '<a class="sr-thumb sr-link" href="' + esc(d.url) + '" tabindex="-1" aria-hidden="true">' +
          (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '<span class="sr-noimg"></span>') + '</a>' +
        '<div class="sr-body">' +
          '<a class="sr-title sr-link" href="' + esc(d.url) + '">' + markTitle(d.meta?.title || d.url, q) + '</a>' +
          (subs.length
            ? '<ul class="sr-subs">' + subs.map(x => '<li><a class="sr-link" href="' + esc(x.url) + '"><span class="sr-sub-title">' + esc(x.title) + '</span><span class="sr-excerpt">' + safeExcerpt(x.excerpt, x.title) + '</span></a></li>').join('') + '</ul>'
            : '<p class="sr-excerpt">' + safeExcerpt(d.excerpt) + '</p>') +
        '</div>';
      return li;
    }
    async function showMore(q, mySeq) {
      const batch = results.slice(shown, shown + PAGE);
      const data = await Promise.all(batch.map(r => r.data()));
      if (mySeq !== seq) return;
      data.forEach(d => list.appendChild(render(d, q)));
      shown += batch.length;
      moreBtn.hidden = shown >= results.length;
    }
    async function runSearch() {
      const q = input.value.trim(), mySeq = ++seq;
      if (!q) { list.innerHTML = ''; status.textContent = ''; moreBtn.hidden = true; return; }
      status.textContent = t('Loading');
      try {
        const pf = await loadPagefind();
        const res = await pf.search(q);
        if (mySeq !== seq) return;
        results = res.results; shown = 0; list.innerHTML = '';
        status.textContent = results.length ? t('Results', { n: results.length, q }) : t('None', { q });
        await showMore(q, mySeq);
      } catch (e) { status.textContent = t('Unavailable'); moreBtn.hidden = true; }
    }
    function openSearch() {
      modal.hidden = false; document.body.classList.add('search-open');
      setTimeout(() => { input.focus(); input.select(); }, 20);
      loadPagefind().catch(() => { status.textContent = t('Unavailable'); });
    }
    function closeSearch() { modal.hidden = true; document.body.classList.remove('search-open'); openBtn?.focus(); }

    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(runSearch, 180); });
    moreBtn.addEventListener('click', () => showMore(input.value.trim(), seq));
    openBtn?.addEventListener('click', openSearch);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeSearch(); });
    list.addEventListener('click', (e) => { if (e.target.closest('a')) closeSearch(); });   // bấm anchor cùng trang cũng đóng hộp
    // ↑ ↓ di chuyển giữa ô nhập và các link kết quả
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const links = [input, ...$$('.sr-title, .sr-subs a', list)];
      const i = links.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      links[Math.max(0, Math.min(links.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); modal.hidden ? openSearch() : closeSearch(); }
      if (e.key === 'Escape' && !modal.hidden) closeSearch();
    });
  }

  /* ---------------- infinite scroll trong series ----------------
     Hết bài -> fetch bài kế tiếp (data-next) và nối <article> vào dưới.
     Bài đang chiếm phần trên màn hình = bài "đang đọc": đổi URL (replaceState,
     không reload), <title>, canonical, breadcrumb trên topbar, cột phải
     (TOC + tác giả) và bắn `elb:pageview` để analytics đếm như một lần mở trang
     (script analytics chỉ tự đếm lúc load trang, không thấy replaceState). */
  const stream = $('#post-stream');
  if (stream && stream.dataset.infinite === '1') {
    const status = $('#infinite-status'), crumbs = $('.crumbs'), side = $('#post-side'), canonical = $('link[rel="canonical"]');
    const siteName = document.title.split(' · ').pop();
    const articles = $$('.post', stream);            // theo thứ tự trong stream
    const seen = new Set(articles.map(a => a.dataset.url));
    const counted = new Set(seen);                   // bài đã đếm view (bài đầu: script analytics tự đếm lúc load)
    let loading = false, done = false, active = articles[0];

    // phần "chrome" (breadcrumb, cột phải) của từng bài, swap khi bài đó thành active
    const remember = (a, doc) => { a._chrome = { crumbs: doc.querySelector('.crumbs')?.innerHTML, side: doc.querySelector('#post-side')?.innerHTML }; };
    remember(active, document);

    // hai bài trong cùng stream có thể trùng id heading (vd. #cài-đặt) -> thêm tiền tố cho bài fetch về
    function prefixIds(art, sideEl, prefix) {
      const map = new Map();
      art.querySelectorAll('[id]').forEach(el => { if (el === art) return; map.set(el.id, prefix + el.id); el.id = prefix + el.id; });
      [art, sideEl].forEach(root => root && root.querySelectorAll('a[href^="#"]').forEach(a => {
        const id = decodeURIComponent(a.getAttribute('href').slice(1));
        if (map.has(id)) a.setAttribute('href', '#' + map.get(id));
      }));
    }

    // gửi "virtual pageview" tới analytics nếu có (GoatCounter / Umami / GA4 / Plausible) + sự kiện chung
    function trackPageview(path, title) {
      try {
        if (window.goatcounter?.count) window.goatcounter.count({ path, title, event: false });
        if (window.umami?.track) window.umami.track(p => ({ ...p, url: path, title }));
        if (typeof window.gtag === 'function') window.gtag('event', 'page_view', { page_path: path, page_title: title, page_location: location.href });
        if (typeof window.plausible === 'function') window.plausible('pageview', { u: location.href });
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('elb:pageview', { detail: { path, title } }));
    }

    function activate(a) {
      if (!a || a === active) return; active = a;
      const url = a.dataset.url, title = a.dataset.title;
      if (location.pathname !== url) history.replaceState(null, '', url);
      document.title = title + ' · ' + siteName;
      if (canonical) canonical.href = new URL(url, canonical.href).href;
      if (crumbs && a._chrome?.crumbs != null) crumbs.innerHTML = a._chrome.crumbs;
      if (side && a._chrome?.side != null) { side.innerHTML = a._chrome.side; side.scrollTop = 0; watchToc(a); }
      if (!counted.has(url)) { counted.add(url); trackPageview(url, document.title); }   // mỗi bài đếm 1 lần / lần mở trang
    }

    // bài đang đọc = bài cuối cùng có mép trên nằm trên vạch 35% màn hình
    function currentArticle() {
      const line = innerHeight * 0.35; let cur = articles[0];
      for (const a of articles) if (a.getBoundingClientRect().top <= line) cur = a;
      return cur;
    }
    let ticking = false;
    function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; activate(currentArticle()); }); }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);

    async function loadNext() {
      const last = articles[articles.length - 1], next = last?.dataset.next;
      if (loading || done || !next || seen.has(next)) { if (!next) done = true; return; }
      loading = true; status.hidden = false;
      try {
        const res = await fetch(next, { headers: { 'X-Requested-With': 'fetch' } });
        if (!res.ok) throw new Error(res.status);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const art = doc.querySelector('#post-stream .post');
        if (!art) { done = true; return; }
        seen.add(next);
        prefixIds(art, doc.querySelector('#post-side'), 'p' + articles.length + '-');
        remember(art, doc);
        art.querySelectorAll('img[loading]').forEach(i => i.loading = 'lazy');
        status.before(art);
        articles.push(art);
        watchEnd(art);
        onScroll();
      } catch (e) { done = true; }
      finally { loading = false; status.hidden = true; }
    }

    // sentinel: khi phần cuối của bài cuối vào tầm nhìn -> tải tiếp
    const endObs = new IntersectionObserver((en) => { if (en.some(x => x.isIntersecting)) loadNext(); }, { rootMargin: '600px 0px' });
    function watchEnd(a) { endObs.disconnect(); endObs.observe(a.querySelector('.post-foot') || a); }
    watchEnd(active);
  }
})();

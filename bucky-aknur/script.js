/* ============================================================
   CLASSIFIED ARCHIVE — BUCKY & AKNUR
   particles · HUD telemetry · heart meter · memory logs · dossier
   ============================================================ */
(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. FLOATING GLOW PARTICLES
     --------------------------------------------------------- */
  const canvas = $('#particles');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, particles = [], raf = null, running = true;

    const PALETTE = [
      { r: 230, g: 5,   b: 5   },  // marvel red
      { r: 192, g: 192, b: 192 },  // vibranium silver
      { r: 120, g: 160, b: 255 }   // night blue
    ];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const count = Math.round(Math.min(96, Math.max(30, (w * h) / 26000)));
      particles = [];
      for (let i = 0; i < count; i++) {
        const c = PALETTE[Math.random() < .58 ? 0 : Math.random() < .6 ? 1 : 2];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2.1 + .6,
          vx: (Math.random() - .5) * .22,
          vy: -(Math.random() * .34 + .06),
          a: Math.random() * .5 + .18,
          tw: Math.random() * Math.PI * 2,
          c: c
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += .02;
        if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 10;
        if (p.x > w + 12) p.x = -10;

        const alpha = p.a * (.68 + Math.sin(p.tw) * .32);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grad.addColorStop(0, `rgba(${p.c.r},${p.c.g},${p.c.b},${alpha})`);
        grad.addColorStop(1, `rgba(${p.c.r},${p.c.g},${p.c.b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${alpha * .7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * .5, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = running ? requestAnimationFrame(frame) : null;
    }

    resize();
    frame();
    window.addEventListener('resize', () => { resize(); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running && !raf) frame();
    });
  }

  /* ---------------------------------------------------------
     2. CURSOR GLOW
     --------------------------------------------------------- */
  const glow = $('#cursorGlow');
  if (glow && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      cx += (tx - cx) * .12;
      cy += (ty - cy) * .12;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(follow);
    })();
  }

  /* ---------------------------------------------------------
     3. CLOCK + SCROLL PROGRESS
     --------------------------------------------------------- */
  const clock = $('#clock');
  const clockDate = $('#clockDate');
  const footSync = $('#footSync');
  function tickClock() {
    const now = new Date();
    const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (clock) clock.textContent = t;
    if (clockDate) clockDate.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    if (footSync) footSync.textContent = t;
  }
  tickClock();
  setInterval(tickClock, 1000);

  const scrollBar = $('#scrollBar');
  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    if (scrollBar) scrollBar.style.width = pct.toFixed(2) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     4. NAV — active link + mobile menu
     --------------------------------------------------------- */
  const burger = $('#burger');
  const links = $('#links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const navLinks = $$('#links a');
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => navObs.observe(s));
  }

  /* ---------------------------------------------------------
     5. REVEAL ON SCROLL + COUNTERS + HUD METERS + OBJECTIVES
     --------------------------------------------------------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  let hudArmed = false;
  function armHud() {
    if (hudArmed) return;
    hudArmed = true;
    const panel = $('.hud-panel');
    if (panel) panel.classList.add('armed');
    $$('#objectives [data-obj]').forEach((li, i) => {
      setTimeout(() => li.classList.add('done'), 260 * i + 160);
    });
  }

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');

      $$('[data-count]', el).forEach(countUp);
      if (el.hasAttribute('data-count')) countUp(el);
      if (el.id === 'mission') armHud();

      revealObs.unobserve(el);
    });
  }, { threshold: .18, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal, #mission').forEach((el) => revealObs.observe(el));

  /* ---------------------------------------------------------
     6. VIBRANIUM HEART METER
     --------------------------------------------------------- */
  const gaugeFill = $('#gaugeFill');
  const meterValue = $('#meterValue');
  const meterTarget = $('#meterTarget');
  const meterState = $('#meterState');
  const heartLog = $('#heartLog');

  const READINGS = {
    'AKNUR':     { value: 100, state: 'SOLE TARGET · LOCKED', note: 'Affection ceiling reached. Hydra-grade alloy, Brooklyn-grade heart.' },
    'THE WORLD': { value: 12,  state: 'CIVILIAN BASELINE',    note: 'Enough to save it. Not enough to move in with it.' },
    'HYDRA':     { value: 0,   state: 'ZEROED OUT',           note: 'Gauge refuses to register. Calibration error: none. Sentiment: correct.' }
  };

  if (gaugeFill) gaugeFill.setAttribute('pathLength', '100');
  let currentTarget = 'AKNUR';
  let meterRaf = null;

  function setGauge(value) {
    if (gaugeFill) gaugeFill.style.strokeDashoffset = String(100 - value);
  }

  function animateMeter(value) {
    if (!meterValue) return;
    if (meterRaf) cancelAnimationFrame(meterRaf);
    const from = parseFloat((meterValue.firstChild && meterValue.firstChild.nodeValue) || '0') || 0;
    if (reduceMotion) {
      meterValue.innerHTML = Math.round(value) + '<i>%</i>';
      return;
    }
    const dur = 1100;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (value - from) * eased;
      meterValue.innerHTML = Math.round(v) + '<i>%</i>';
      if (p < 1) meterRaf = requestAnimationFrame(step);
    }
    meterRaf = requestAnimationFrame(step);
  }

  function applyTarget(name, animate) {
    const data = READINGS[name] || READINGS['AKNUR'];
    currentTarget = name;
    if (meterTarget) meterTarget.textContent = 'TARGET: ' + name;
    if (meterState) meterState.textContent = data.state;
    setGauge(data.value);
    animateMeter(data.value);
    if (animate && heartLog) {
      const li = document.createElement('li');
      li.innerHTML = '<b>SCAN · ' + name + '</b><span>' + data.note + '</span>';
      heartLog.prepend(li);
      while (heartLog.children.length > 5) heartLog.lastElementChild.remove();
    }
  }

  const meterPanel = $('#heartmeter');
  if (meterPanel && gaugeFill) {
    const meterObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        applyTarget(currentTarget, false);
        meterObs.unobserve(en.target);
      });
    }, { threshold: .35 });
    meterObs.observe(meterPanel);
  }

  $$('.target').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.target').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyTarget(btn.dataset.target, true);
    });
  });

  const meterScan = $('#meterScan');
  if (meterScan) {
    meterScan.addEventListener('click', () => {
      const active = $('.target.active');
      setGauge(0);
      animateMeter(0);
      setTimeout(() => applyTarget(active ? active.dataset.target : 'AKNUR', true), 220);
    });
  }

  /* ---------------------------------------------------------
     7. INTERACTIVE QUOTES
     --------------------------------------------------------- */
  const QUOTES = [
    { text: 'You are my peace after a hundred years of war.', cite: '— Bucky Barnes' },
    { text: 'I have been a weapon, a ghost, a name on a file. With you I am just Bucky.', cite: '— Bucky Barnes' },
    { text: 'They took seventy years. They never took your face.', cite: '— Bucky Barnes' },
    { text: 'Come home, soldier. I left the light on.', cite: '— Serik Aknur' },
    { text: 'Wherever you are is the mission.', cite: '— Bucky Barnes' },
    { text: 'You were the only thing in my head that was never theirs.', cite: '— Bucky Barnes' }
  ];
  const quoteText = $('#quoteText');
  const quoteCite = $('#quoteCite');
  const quoteDots = $('#quoteDots');
  const quoteNext = $('#quoteNext');
  let quoteIndex = 0;

  function renderQuote(i) {
    quoteIndex = (i + QUOTES.length) % QUOTES.length;
    const q = QUOTES[quoteIndex];
    if (quoteText) {
      quoteText.classList.remove('swap');
      void quoteText.offsetWidth;
      quoteText.textContent = q.text;
      quoteText.classList.add('swap');
    }
    if (quoteCite) quoteCite.textContent = q.cite;
    $$('button', quoteDots).forEach((d, idx) => d.classList.toggle('on', idx === quoteIndex));
  }

  if (quoteDots) {
    QUOTES.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Recovered quote ' + (i + 1));
      b.addEventListener('click', () => renderQuote(i));
      quoteDots.appendChild(b);
    });
    renderQuote(0);
  }
  if (quoteNext) quoteNext.addEventListener('click', () => renderQuote(quoteIndex + 1));

  /* ---------------------------------------------------------
     8. MEMORY RECOVERY ARCHIVE — video logs
     --------------------------------------------------------- */
  function typeInto(el) {
    const full = (el.dataset.typing || '').replace(/\|\|/g, '\n');
    if (reduceMotion) { el.textContent = full; return; }
    el.textContent = '';
    let i = 0;
    if (el._typer) clearInterval(el._typer);
    el._typer = setInterval(() => {
      i += 2;
      el.textContent = full.slice(0, i) + (i < full.length ? '▌' : '');
      if (i >= full.length) {
        clearInterval(el._typer);
        el._typer = null;
        el.textContent = full;
      }
    }, 14);
  }

  $$('.tlog').forEach((card) => {
    const play = () => {
      const open = card.classList.toggle('open');
      const transcript = $('.transcript', card);
      card.setAttribute('aria-expanded', String(open));
      if (card._node) card._node.classList.toggle('on', open);
      if (open) {
        card.classList.add('playing');
        if (transcript) typeInto(transcript);
        setTimeout(() => card.classList.remove('playing'), 6200);
      } else {
        card.classList.remove('playing');
        if (transcript && transcript._typer) {
          clearInterval(transcript._typer);
          transcript._typer = null;
        }
      }
    };
    card.addEventListener('click', play);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  });

  /* timeline spine fill + node markers follow scroll position */
  const timeline = $('#timeline');
  const spineFill = $('#spineFill');
  if (timeline && spineFill) {
    const cards = $$('.tlog', timeline);

    const nodes = cards.map((card) => {
      const node = document.createElement('span');
      node.className = 'tl-node';
      node.setAttribute('aria-hidden', 'true');
      card._node = node;
      card.classList.contains('open') && node.classList.add('on');
      timeline.appendChild(node);
      return node;
    });

    const placeNodes = () => {
      const top = timeline.getBoundingClientRect().top;
      cards.forEach((card, i) => {
        nodes[i].style.top = (card.getBoundingClientRect().top - top + 30) + 'px';
      });
    };

    const syncSpine = () => {
      const rect = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      const seen = Math.min(Math.max(vh * .72 - rect.top, 0), total);
      spineFill.style.height = ((seen / total) * 100).toFixed(1) + '%';
    };

    const syncAll = () => { placeNodes(); syncSpine(); };
    window.addEventListener('scroll', syncSpine, { passive: true });
    window.addEventListener('resize', syncAll, { passive: true });
    window.addEventListener('load', syncAll);
    syncAll();
  }

  /* ---------------------------------------------------------
     9. MISSION HUD — engage + live telemetry
     --------------------------------------------------------- */
  const engage = $('#engage');
  const engageMsg = $('#engageMsg');
  const ENGAGE_STEPS = [
    'Operator authorisation accepted.',
    'Hydra trigger protocol — disarmed. All 25 wipes invalidated.',
    'Vibranium arm: powered down. It is not needed where she is.',
    'Perimeters locked · comms open · exit route: remain.',
    'PROTOCOL ENGAGED. Anything that targets Aknur answers to the Winter Soldier.'
  ];
  let engaging = false;

  if (engage) {
    engage.addEventListener('click', () => {
      if (engaging) return;
      engaging = true;
      engage.classList.remove('pulse');
      void engage.offsetWidth;
      engage.classList.add('pulse');
      armHud();
      let i = 0;
      if (engageMsg) engageMsg.textContent = ENGAGE_STEPS[0];
      const id = setInterval(() => {
        i++;
        if (i >= ENGAGE_STEPS.length) { clearInterval(id); engaging = false; return; }
        if (engageMsg) engageMsg.textContent = ENGAGE_STEPS[i];
      }, 900);
    });
  }

  const teleHr = $('#teleHr');
  const teleDist = $('#teleDist');
  const teleThreat = $('#teleThreat');
  const THREATS = ['ELEVATED NEAR HER', 'SCANNING…', 'MONITORED · 24/7', 'NONE WITHIN RANGE'];
  if (teleHr || teleDist) {
    let t = 0;
    setInterval(() => {
      t++;
      if (teleHr) teleHr.textContent = (58 + Math.round(Math.sin(t / 3) * 3 + 2)) + ' BPM · CALM';
      if (teleDist) teleDist.textContent = (0.4 + Math.abs(Math.sin(t / 7)) * 2.4).toFixed(1) + ' M · IN RANGE';
      if (teleThreat && t % 5 === 0) teleThreat.textContent = THREATS[t % THREATS.length];
    }, 1600);
  }

  /* ---------------------------------------------------------
     10. S.H.I.E.L.D. SCAN FRAMES — rescan
     --------------------------------------------------------- */
  const scanTargets = $$('[data-scan-target]');
  function rescan(root) {
    const beams = $$('.scanbeam', root);
    beams.forEach((b) => {
      b.style.animation = 'none';
      void b.offsetWidth;
      b.style.animation = '';
    });
    root.classList.remove('is-scanned');
    void root.offsetWidth;
    root.classList.add('is-scanned');
  }
  $$('[data-rescan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const frame = btn.closest('.scanframe') || document;
      scanTargets.forEach((t) => { if (frame.contains(t) || frame === document) rescan(t); });
      const label = $('#aknurScan');
      if (label) {
        label.textContent = 'RESCANNING…';
        setTimeout(() => { label.textContent = 'SCAN 100%'; }, 1400);
      }
    });
  });

  /* per-frame scanning status flicker */
  const buckyScan = $('#buckyScan');
  if (buckyScan && !reduceMotion) {
    const STATES = ['BIOMETRIC LOCK', 'VIBRANIUM ACTIVE', 'ANCHOR CONFIRMED', 'SCANNING…'];
    let s = 0;
    setInterval(() => { s++; buckyScan.textContent = STATES[s % STATES.length]; }, 2600);
  }

  /* ---------------------------------------------------------
     11. DOSSIER MODAL
     --------------------------------------------------------- */
  const modal = $('#modal');
  const openBtn = $('#openDossier');
  let lastFocus = null;

  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('locked');
    const close = $('.modal-close', modal);
    if (close) close.focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('locked');
    if (lastFocus) lastFocus.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (modal) {
    $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------------------------------------------------------
     12. SMOOTH ANCHORS (fallback for browsers without CSS support)
     --------------------------------------------------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();

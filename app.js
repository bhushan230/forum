/* ═══════════════════════════════════════════════
   AIGNITE — Vanilla JS port of the React app
   ═══════════════════════════════════════════════ */

const ASSETS = 'assets/';

/* ─────────────────────────────
   PARTICLES BACKGROUND
   ───────────────────────────── */
function initParticles() {
  const container = document.getElementById('particlesBg');
  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * 8;
    const size = 1 + Math.random() * 2;
    const duration = 6 + Math.random() * 6;
    p.style.left = `${left}%`;
    p.style.top = `${top}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDelay = `${delay}s`;
    p.style.animationDuration = `${duration}s`;
    container.appendChild(p);
  }
}

/* ─────────────────────────────
   SCROLL PROGRESS BAR
   ───────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    bar.style.transform = `scaleX(${progress})`;
    bar.setAttribute('aria-valuenow', Math.round(progress * 100));
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─────────────────────────────
   COUNTDOWN TIMER
   ───────────────────────────── */
function initCountdown(targetDateStr) {
  const mount = document.getElementById('countdownTimer');

  // targetDateStr should include an explicit UTC offset (e.g. "+05:30" for IST)
  // so the countdown reads the same for every visitor, regardless of their
  // own device timezone. If no offset is present, fall back to treating it
  // as IST (the event's local timezone) instead of the browser's timezone.
  const hasOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(targetDateStr.trim());
  const normalized = hasOffset ? targetDateStr : `${targetDateStr}+05:30`;
  const target = new Date(normalized).getTime();

  const padZero = (n) => String(n).padStart(2, '0');

  function calc() {
    const difference = target - Date.now();
    if (difference > 0) {
      return {
        days: Math.floor(difference / 86400000),
        hours: Math.floor((difference / 3600000) % 24),
        minutes: Math.floor((difference / 60000) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  }

  // Build the DOM once — ticking only ever touches text content afterwards,
  // so there's no flicker/re-flow every second like a full innerHTML replace.
  mount.innerHTML = `
    <div class="countdown-container">
      <div class="countdown-title">TIME REMAINING</div>
      <div class="countdown-grid">
        <div class="countdown-item">
          <span class="countdown-value" id="cdDays">00</span>
          <span class="countdown-label">DAYS</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-item">
          <span class="countdown-value" id="cdHours">00</span>
          <span class="countdown-label">HRS</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-item">
          <span class="countdown-value" id="cdMinutes">00</span>
          <span class="countdown-label">MINS</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-item">
          <span class="countdown-value" id="cdSeconds">00</span>
          <span class="countdown-label">SECS</span>
        </div>
      </div>
    </div>`;

  const els = {
    days: document.getElementById('cdDays'),
    hours: document.getElementById('cdHours'),
    minutes: document.getElementById('cdMinutes'),
    seconds: document.getElementById('cdSeconds'),
  };

  let timerId = null;

  function renderCompleted() {
    if (timerId) clearInterval(timerId);
    mount.innerHTML = `
      <div class="countdown-completed">
        <span class="completed-dot"></span>
        EVENT IS LIVE / IN PROGRESS
      </div>`;
  }

  function tick() {
    const t = calc();
    if (!t) {
      renderCompleted();
      return;
    }
    els.days.textContent = padZero(t.days);
    els.hours.textContent = padZero(t.hours);
    els.minutes.textContent = padZero(t.minutes);
    els.seconds.textContent = padZero(t.seconds);
  }

  tick();
  // Align subsequent ticks to the actual second boundary instead of just
  // firing setInterval(1000) from whenever the page happened to load —
  // this keeps it accurate and prevents visible drift over time.
  const msIntoSecond = Date.now() % 1000;
  setTimeout(() => {
    tick();
    timerId = setInterval(tick, 1000);
  }, 1000 - msIntoSecond);
}

/* ─────────────────────────────
   SCROLL-DRIVEN RING CAROUSEL
   ───────────────────────────── */
function initCarousel(items, onSelect) {
  const wrapper = document.getElementById('scrollRingWrapper');
  const ring = document.getElementById('ring');
  const roleEl = document.getElementById('ringRole');
  const nameEl = document.getElementById('ringName');
  const btnEl = document.getElementById('ringBtn');

  const count = items.length;
  const spacingAngle = 45;
  const FRONT_ANGLE = 180;

  wrapper.style.height = `${count * 55 + 50}vh`;

  // Build ring item DOM nodes once
  const itemEls = items.map((item, i) => {
    const div = document.createElement('div');
    div.className = 'ring-item';

    const img = document.createElement('img');
    img.src = ASSETS + item.imageSrc;
    img.alt = item.name;
    img.onerror = () => {
      img.style.display = 'none';
      fallback.style.display = 'flex';
    };

    const fallback = document.createElement('div');
    fallback.className = 'ring-fallback';
    fallback.style.display = 'none';
    fallback.textContent = item.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    div.appendChild(img);
    div.appendChild(fallback);
    ring.appendChild(div);
    return div;
  });

  let rotation = 180;
  let currentRot = 180;
  let targetRot = 180;
  let frontIndex = 0;

  function handleScroll() {
    const rect = wrapper.getBoundingClientRect();
    const viewH = window.innerHeight;
    const scrollDist = rect.height - viewH;
    let progress = 0;
    if (scrollDist > 0) {
      progress = -rect.top / scrollDist;
    }
    progress = Math.max(0, Math.min(1, progress));
    targetRot = 180 - progress * ((count - 1) * spacingAngle);
  }

  function renderRing() {
    let minDiff = Infinity;
    let newFrontIndex = 0;

    items.forEach((item, i) => {
      const angle = i * spacingAngle;
      const posAngle = angle + currentRot;
      const linearDiff = Math.abs(posAngle - FRONT_ANGLE);

      if (linearDiff < minDiff) {
        minDiff = linearDiff;
        newFrontIndex = i;
      }

      const stepsAway = linearDiff / spacingAngle;
      const maxStepsVisible = 3.0;

      let opacity = 0;
      let scale = 0.5;
      let zIndex = 0;

      if (stepsAway <= maxStepsVisible) {
        const t = Math.max(0, 1 - (stepsAway / maxStepsVisible));
        opacity = Math.pow(t, 1.3);
        scale = 0.5 + 0.5 * t;
        zIndex = Math.round(opacity * 100);
      }

      const el = itemEls[i];
      el.style.opacity = opacity;
      el.style.zIndex = zIndex;
      el.style.visibility = opacity > 0 ? 'visible' : 'hidden';
      el.style.transform = `rotate(${posAngle}deg) translate(var(--ring-radius)) rotate(${-posAngle}deg) scale(${scale})`;
    });

    if (newFrontIndex !== frontIndex) {
      frontIndex = newFrontIndex;
      itemEls.forEach((el, i) => el.classList.toggle('ring-item--active', i === frontIndex));
      roleEl.textContent = items[frontIndex].title;
      nameEl.textContent = items[frontIndex].name;
    }
  }

  function update() {
    currentRot += (targetRot - currentRot) * 0.08;
    if (Math.abs(targetRot - currentRot) > 0.01) {
      renderRing();
    }
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // initial paint
  roleEl.textContent = items[frontIndex].title;
  nameEl.textContent = items[frontIndex].name;
  itemEls[frontIndex].classList.add('ring-item--active');
  renderRing();
  update();

  btnEl.addEventListener('click', () => onSelect(items[frontIndex]));
}

/* ─────────────────────────────
   TYPEWRITER helper
   ───────────────────────────── */
function typeDuration(text, startDelay, wordDelay = 70) {
  return startDelay + text.split(' ').length * wordDelay + 200;
}

function renderTypewriterSpans(container, text) {
  const words = text.split(' ');
  container.innerHTML = '';
  words.forEach((word) => {
    const span = document.createElement('span');
    span.textContent = word;
    span.style.display = 'inline-block';
    span.style.marginRight = '0.28em';
    span.style.opacity = '0';
    span.style.transform = 'translateY(6px)';
    span.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    container.appendChild(span);
  });
  return container.children;
}

function startTypewriter(container, text, startDelay, wordDelay = 70) {
  const spans = renderTypewriterSpans(container, text);
  setTimeout(() => {
    let count = 0;
    const interval = setInterval(() => {
      if (spans[count]) {
        spans[count].style.opacity = '1';
        spans[count].style.transform = 'translateY(0)';
      }
      count++;
      if (count >= spans.length) clearInterval(interval);
    }, wordDelay);
  }, startDelay);
}

/* ─────────────────────────────
   ENVELOPE INTRO ANIMATION
   Plays before the invitation card opens: envelope drops in,
   wax seal cracks, flap folds open, letter slides out — then
   hands off to the named invitation card.
   ───────────────────────────── */
function playEnvelopeIntro(invitation, onDone) {
  const root = document.getElementById('invitationPortalRoot');
  document.body.style.overflow = 'hidden';

  const displayName = invitation.name.replace(/^Hon'ble\.\s*/i, '');

  const overlay = document.createElement('div');
  overlay.className = 'envelope-overlay';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('aria-label', 'Open invitation');

  overlay.innerHTML = `
    <div class="envelope-glow"></div>
    <div class="envelope-scene">
      <p class="envelope-tag">A SPECIAL INVITATION FOR</p>
      <p class="envelope-tag-name">${displayName}</p>

      <div class="envelope" id="envelopeEl">
        <div class="envelope-letter">
          <div class="envelope-letter-inner">
            <img src="${ASSETS}logo.png" class="envelope-letter-logo" alt="" onerror="this.style.display='none'" />
            <p class="envelope-letter-title">AIGNITE</p>
            <p class="envelope-letter-sub">You're Invited</p>
          </div>
        </div>
        <div class="envelope-back"></div>
        <div class="envelope-front"></div>
        <div class="envelope-flap" id="envelopeFlap">
          <span class="envelope-seal">✦</span>
        </div>
      </div>

      <p class="envelope-hint" id="envelopeHint">Opening invitation…</p>
    </div>
  `;

  root.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('envelope-overlay--in'));

  const envelopeEl = overlay.querySelector('#envelopeEl');
  const flap = overlay.querySelector('#envelopeFlap');
  const hint = overlay.querySelector('#envelopeHint');

  let finished = false;
  const timeouts = [];

  function finish() {
    if (finished) return;
    finished = true;
    timeouts.forEach(clearTimeout);
    overlay.classList.add('envelope-overlay--out');
    setTimeout(() => {
      overlay.remove();
      onDone();
    }, 450);
  }

  // Animation sequence
  timeouts.push(setTimeout(() => envelopeEl.classList.add('envelope--dropped'), 150));
  timeouts.push(setTimeout(() => flap.classList.add('envelope-flap--open'), 950));
  timeouts.push(setTimeout(() => envelopeEl.classList.add('envelope--letter-out'), 1600));
  timeouts.push(setTimeout(() => { hint.textContent = 'Tap to continue'; }, 2500));
  timeouts.push(setTimeout(finish, 3100));

  // Let people skip ahead with a tap/click anywhere on the overlay
  overlay.addEventListener('click', finish);
}

/* ─────────────────────────────
   INVITATION PORTAL
   ───────────────────────────── */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyZfRCLejc0ir6WmG6P6P2y2P5doSrlMIUql3o60qxfamm--Ftg0FLTQb4sy2QOxU8x/exec';
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_KEY = '5b563a3f-cd3d-4b17-8f01-8b2dd99813ae';

function logResponse(invitation, status) {
  fetch(SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: invitation.name,
      title: invitation.title,
      status,
      time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    }),
  }).catch((e) => console.error('Sheet logging failed:', e));

  fetch(WEB3FORMS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `AIGNITE Invitation ${status}: ${invitation.name}`,
      from_name: 'AIGNITE Portal',
      message: `Dear Team,\n\n${invitation.name} (${invitation.title}) has ${status === 'Accepted' ? 'accepted' : 'closed/declined'} the invitation to the AIGNITE Reinstallation Ceremony 2K26.`,
    }),
  }).catch((e) => console.error(`Error sending ${status} email:`, e));
}

/* ─────────────────────────────
   3D TILT — real pointer/touch/gyroscope-driven card tilt
   Sets --rx / --ry / --tz / --glare-x / --glare-y / --glare-o custom
   properties on the card element; the CSS in .inv-card consumes them.
   Works with mouse movement on desktop and touch-drag + device
   orientation on mobile, and degrades to a static card when neither
   is available or the user prefers reduced motion.
   ───────────────────────────── */
function initCardTilt(card) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return () => {};

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const MAX_TILT = isCoarsePointer ? 10 : 14; // degrees
  const MAX_TZ = 22; // px lift toward viewer
  const EASE = 0.14; // smoothing factor per animation frame

  let currentRx = 0, currentRy = 0, currentTz = 0;
  let targetRx = 0, targetRy = 0, targetTz = 0;
  let glareX = 50, glareY = 50, glareO = 0;
  let rafId = null;
  let active = true;

  function apply() {
    currentRx += (targetRx - currentRx) * EASE;
    currentRy += (targetRy - currentRy) * EASE;
    currentTz += (targetTz - currentTz) * EASE;
    card.style.setProperty('--rx', `${currentRx.toFixed(2)}deg`);
    card.style.setProperty('--ry', `${currentRy.toFixed(2)}deg`);
    card.style.setProperty('--tz', `${currentTz.toFixed(1)}px`);
    card.style.setProperty('--glare-x', `${glareX}%`);
    card.style.setProperty('--glare-y', `${glareY}%`);
    card.style.setProperty('--glare-o', glareO);

    if (active) {
      rafId = requestAnimationFrame(apply);
    }
  }
  rafId = requestAnimationFrame(apply);

  function updateFromPoint(clientX, clientY) {
    const rect = card.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;  // 0..1
    const py = (clientY - rect.top) / rect.height;  // 0..1
    const nx = px * 2 - 1; // -1..1
    const ny = py * 2 - 1;

    // Tilt away from the pointer position — pointer top-left tilts the
    // top-left corner toward the viewer, like a real reflective card.
    targetRy = nx * MAX_TILT;
    targetRx = -ny * MAX_TILT;
    targetTz = MAX_TZ;

    glareX = px * 100;
    glareY = py * 100;
    glareO = 1;
  }

  function reset() {
    targetRx = 0;
    targetRy = 0;
    targetTz = 0;
    glareO = 0;
  }

  // ── Desktop: mouse movement over the card ──
  function onMouseMove(e) {
    updateFromPoint(e.clientX, e.clientY);
  }
  function onMouseLeave() {
    reset();
  }

  // ── Mobile: touch-drag across the card (works everywhere, no
  //    permission prompt needed) ──
  function onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    updateFromPoint(e.touches[0].clientX, e.touches[0].clientY);
  }
  function onTouchEnd() {
    reset();
  }

  // ── Mobile: device orientation (gyroscope) tilt, layered on top when
  //    available and permitted — lets the card react to physically
  //    tilting the phone, not just dragging a finger ──
  let orientationBase = null;
  function onDeviceOrientation(e) {
    if (e.beta === null || e.gamma === null) return;
    // beta: front-back tilt (-180..180), gamma: left-right tilt (-90..90)
    if (orientationBase === null) {
      orientationBase = { beta: e.beta, gamma: e.gamma };
    }
    const dBeta = e.beta - orientationBase.beta;
    const dGamma = e.gamma - orientationBase.gamma;
    targetRx = Math.max(-MAX_TILT, Math.min(MAX_TILT, dBeta * 0.6));
    targetRy = Math.max(-MAX_TILT, Math.min(MAX_TILT, dGamma * 0.6));
    targetTz = MAX_TZ * 0.6;
    glareX = 50 + (dGamma / 45) * 50;
    glareY = 50 + (dBeta / 45) * 50;
    glareO = 0.6;
  }

  function enableOrientation() {
    if (typeof DeviceOrientationEvent === 'undefined') return;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ requires an explicit user gesture to grant this, which
      // we get from the touchstart handler below.
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', onDeviceOrientation);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener('deviceorientation', onDeviceOrientation);
    }
  }

  function onFirstTouch() {
    enableOrientation();
    card.removeEventListener('touchstart', onFirstTouch);
  }

  card.addEventListener('mousemove', onMouseMove);
  card.addEventListener('mouseleave', onMouseLeave);
  card.addEventListener('touchmove', onTouchMove, { passive: true });
  card.addEventListener('touchend', onTouchEnd);
  card.addEventListener('touchcancel', onTouchEnd);
  card.addEventListener('touchstart', onFirstTouch, { passive: true });

  return function destroy() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    card.removeEventListener('mousemove', onMouseMove);
    card.removeEventListener('mouseleave', onMouseLeave);
    card.removeEventListener('touchmove', onTouchMove);
    card.removeEventListener('touchend', onTouchEnd);
    card.removeEventListener('touchcancel', onTouchEnd);
    card.removeEventListener('touchstart', onFirstTouch);
    window.removeEventListener('deviceorientation', onDeviceOrientation);
  };
}

function openInvitationPortal(invitation, onClose) {
  const root = document.getElementById('invitationPortalRoot');
  document.body.style.overflow = 'hidden';

  const displayName = invitation.name.replace(/^Hon'ble\.\s*/i, '');
  const greetText = 'Dear Respected,';
  const bodyText = `You are cordially invited to the Reinstallation Ceremony of "AIGNITE" — The AIML Departmental Forum of TGPCET.`;
  const regardsText = 'With warm regards & respect, Department of Artificial Intelligence & Machine Learning, TGPCET, Nagpur.';

  const t0 = 350;
  const t1 = t0 + 400;
  const t2 = typeDuration(greetText, t1, 80);
  const t3 = typeDuration(displayName, t2, 90);
  const t4 = typeDuration(bodyText, t3, 65);
  const t5 = typeDuration(regardsText, t4, 55);

  let accepted = false;
  let closed = false;

  const overlay = document.createElement('div');
  overlay.className = 'inv-overlay';
  overlay.id = 'invitationPortal';

  overlay.innerHTML = `
    <div class="inv-bg-glow"></div>
    <div class="inv-particles">
      ${Array.from({ length: 18 }, (_, i) => `<div class="inv-particle" style="--i:${i}"></div>`).join('')}
    </div>
    <button class="portal-close-btn" aria-label="Close">&times;</button>

    <div class="inv-card" id="invCard">
      <div class="inv-card-glare" aria-hidden="true"></div>
      <div class="inv-header" id="invHeader">
        <img src="${ASSETS}logo.png" alt="AIGNITE" class="inv-logo" onerror="this.style.display='none'" />
        <div class="inv-event-info">
          <span class="inv-event-name">AIGNITE</span>
          <span class="inv-event-sub">Reinstallation Ceremony · 2K26</span>
        </div>
      </div>

      <div class="inv-portrait-frame-wrapper" id="invPortraitWrapper">
        <div class="inv-portrait-ring-glow"></div>
        <div class="inv-portrait-circular-frame">
          <img id="invPortraitImg" src="${ASSETS}${invitation.imageSrc}" alt="${invitation.name}" />
        </div>
      </div>

      <div class="inv-tw-body">
        <div class="inv-tw-greeting-container">
          <p class="inv-tw-greeting" id="invGreeting"></p>
        </div>
        <div class="inv-tw-name-container">
          <h2 class="inv-tw-name" id="invName"></h2>
        </div>
        <div class="inv-tw-message-container">
          <p class="inv-tw-message" id="invMessage"></p>
        </div>

        <div class="inv-details-grid" id="invDetails" style="opacity:0; transform:translateY(10px); transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);">
          <div class="inv-detail">
            <span class="inv-detail-label">📅 DATE</span>
            <span class="inv-detail-value">24th July, 2026</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">⏰ TIME</span>
            <span class="inv-detail-value">11:00 AM</span>
          </div>
          <div class="inv-detail" style="grid-column: span 2">
            <span class="inv-detail-label">📍 VENUE</span>
            <span class="inv-detail-value">L&amp;D Hall, First Building, TGPCET Campus</span>
          </div>
        </div>

        <div class="inv-tw-regards-container">
          <p class="inv-tw-regards" id="invRegards"></p>
        </div>
      </div>

      <div class="inv-actions" id="invActions" style="opacity:0; transform:translateY(12px); transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s; margin-top:2rem;">
        <button class="inv-btn-accept" id="invAcceptBtn">
          <span class="inv-btn-icon">✓</span>
          Accept Invitation
        </button>
        <button class="inv-btn-decline" id="invDeclineBtn">
          Close
        </button>
      </div>
    </div>
  `;

  root.appendChild(overlay);

  const invPortraitImg = overlay.querySelector('#invPortraitImg');
  invPortraitImg.onerror = () => { invPortraitImg.src = `${ASSETS}difault.jpg`; };

  const invCard = overlay.querySelector('#invCard');
  const invHeader = overlay.querySelector('#invHeader');
  const invPortraitWrapper = overlay.querySelector('#invPortraitWrapper');
  const invDetails = overlay.querySelector('#invDetails');
  const invActions = overlay.querySelector('#invActions');
  const closeBtn = overlay.querySelector('.portal-close-btn');
  const acceptBtn = overlay.querySelector('#invAcceptBtn');
  const declineBtn = overlay.querySelector('#invDeclineBtn');

  // Real 3D tilt: mouse on desktop, touch-drag + gyroscope on mobile
  const destroyTilt = initCardTilt(invCard);

  // card enters
  setTimeout(() => {
    invCard.classList.add('inv-card--in');
    invHeader.classList.add('inv-el--in');
    invPortraitWrapper.classList.add('inv-portrait-frame--in');
  }, t0);

  // typewriters
  startTypewriter(overlay.querySelector('#invGreeting'), greetText, t1, 80);
  startTypewriter(overlay.querySelector('#invName'), displayName, t2, 90);
  startTypewriter(overlay.querySelector('#invMessage'), bodyText, t3, 65);
  startTypewriter(overlay.querySelector('#invRegards'), regardsText, t4, 55);

  // buttons & details reveal
  const btnTimeout = setTimeout(() => {
    invDetails.style.opacity = '1';
    invDetails.style.transform = 'translateY(0)';
    invActions.style.opacity = '1';
    invActions.style.transform = 'translateY(0)';
  }, t5);

  function cleanup(wasAccepted) {
    if (closed) return;
    closed = true;
    clearTimeout(btnTimeout);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeyDown);
    destroyTilt();
    overlay.remove();
    onClose(wasAccepted);
  }

  function handleDecline() {
    if (!accepted) {
      logResponse(invitation, 'Declined');
    }
    cleanup(false);
  }

  function spawnSparkles() {
    const burst = document.createElement('div');
    burst.className = 'inv-sparkles';
    const rect = invCard.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    burst.innerHTML = Array.from({ length: 14 }, (_, i) =>
      `<div class="inv-sparkle" style="--i:${i}; left:${cx}px; top:${cy}px;"></div>`
    ).join('');
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 1400);
  }

  function showThankYou() {
    // Freeze the tilt in place so the thank-you content doesn't jitter,
    // then swap the card's body for a dedicated thank-you view.
    destroyTilt();
    invCard.classList.add('inv-card--accepted');
    spawnSparkles();

    const displayNameLocal = invitation.name.replace(/^Hon'ble\.\s*/i, '');

    invCard.innerHTML = `
      <div class="inv-card-glare" aria-hidden="true"></div>
      <div class="inv-thankyou" id="invThankYou">
        <div class="inv-thankyou-check">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <p class="inv-thankyou-eyebrow">RSVP Confirmed</p>
        <h2 class="inv-thankyou-title">Thank You!</h2>
        <p class="inv-thankyou-name">${displayNameLocal}</p>
        <p class="inv-thankyou-body">
          Your acceptance has been recorded. We're honoured to have you join us
          for the <strong>AIGNITE Reinstallation Ceremony</strong>.
        </p>
        <div class="inv-thankyou-details">
          <div class="inv-detail">
            <span class="inv-detail-label">📅 DATE</span>
            <span class="inv-detail-value">24th July, 2026</span>
          </div>
          <div class="inv-detail">
            <span class="inv-detail-label">⏰ TIME</span>
            <span class="inv-detail-value">11:00 AM</span>
          </div>
          <div class="inv-detail" style="grid-column: span 2">
            <span class="inv-detail-label">📍 VENUE</span>
            <span class="inv-detail-value">L&amp;D Hall, First Building, TGPCET Campus</span>
          </div>
        </div>
        <p class="inv-thankyou-footer">
          See you there! — Department of Artificial Intelligence &amp; Machine Learning, TGPCET
        </p>
        <button class="inv-btn-accept inv-thankyou-close" id="invThankYouClose">
          Done
        </button>
      </div>
    `;

    requestAnimationFrame(() => {
      invCard.querySelector('#invThankYou').classList.add('inv-thankyou--in');
    });

    invCard.querySelector('#invThankYouClose').addEventListener('click', () => cleanup(true));
  }

  function handleAccept() {
    accepted = true;
    logResponse(invitation, 'Accepted');
    showThankYou();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (accepted) cleanup(true);
      else handleDecline();
    }
  }

  document.addEventListener('keydown', onKeyDown);
  closeBtn.addEventListener('click', () => {
    if (accepted) cleanup(true);
    else handleDecline();
  });
  declineBtn.addEventListener('click', handleDecline);
  acceptBtn.addEventListener('click', handleAccept);
}

/* ─────────────────────────────
   APP INIT
   ───────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initParticles();
  initCountdown('2026-07-24T11:00:00+05:30');

  const allItems = tiersData.reduce((acc, tier) => [...acc, ...tier.items], []);

  initCarousel(allItems, (item) => {
    playEnvelopeIntro(item, () => {
      openInvitationPortal(item, (wasAccepted) => {
        if (wasAccepted) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  });
});
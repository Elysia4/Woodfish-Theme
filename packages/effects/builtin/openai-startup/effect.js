/*
 * 按用户提供的启动演示重建：黑幕 → 技术档案与两步确认 → 核验 → 角色第二幕。
 * 版式参考 dsh-startup-screen (MIT, 沈宏宏)，来源与许可见 README.md。
 * OpenAI SVG path: Simple Icons 13.21.0 (CC0)。所有时钟和事件由 Woodfish 托管。
 */
module.exports = function openaiStartup(ctx) {
  const root = document.documentElement;
  if (root.dataset.woodfishOpenaiStartupSeen || ctx.reducedMotion()) return {};
  if (!ctx.simplified()) return playStartup(ctx);

  // The watcher can inject before Codex's new window receives focus.
  let playback;
  let disposed = false;
  function startWhenActive() {
    if (disposed || root.dataset.woodfishOpenaiStartupSeen || ctx.simplified()) return;
    playback = playStartup(ctx);
  }
  ctx.on(window, 'focus', startWhenActive);
  ctx.on(document, 'visibilitychange', startWhenActive);
  return {
    dispose() {
      disposed = true;
      playback?.dispose();
    },
  };
};

function playStartup(ctx) {
  document.documentElement.dataset.woodfishOpenaiStartupSeen = 'true';

  const seconds = Number.isFinite(ctx.params.duration) ? ctx.params.duration : 26;
  const scale = Math.max(12, Math.min(40, seconds)) / 26;
  const interactive = ctx.params.requireInteraction !== false;
  const displayName =
    typeof ctx.params.displayName === 'string'
      ? Array.from(ctx.params.displayName.trim()).slice(0, 48).join('') || '访客'
      : '访客';
  const previousFocus = document.activeElement;
  const cancels = new Set();
  let pendingStep;
  let stageIndex = -1;
  let leaving = false;
  let removed = false;

  const stages = [
    ['boot', 2200],
    ['wash', 700],
    [
      'permission',
      2000,
      '需要访问许可',
      'ACCESS PERMISSION REQUIRED',
      '等待用户授权…',
      'AWAITING OPERATOR CONSENT',
    ],
    [
      'identity',
      2300,
      '身份资料确认',
      'IDENTITY VERIFICATION',
      '核对身份资料…',
      'MATCHING OPERATOR RECORD',
    ],
    [
      'request',
      1500,
      '接收访问需求',
      'ACCESS REQUEST RECEIVED',
      '接收访问需求，建立会话通道…',
      'HANDSHAKE ESTABLISHED',
    ],
    [
      'read',
      2200,
      '开始读取权限',
      'PERMISSION READ STARTED',
      '开始读取权限，准备工作区…',
      'READING PERMISSION SET',
    ],
    [
      'verified',
      2800,
      '读取完毕 · 核验通过',
      'READ COMPLETE · VERIFIED',
      '读取完毕，核验通过',
      'PERMISSION AUTHORIZED',
    ],
    [
      'welcome',
      2600,
      '',
      '',
      `欢迎回来，${displayName}。工作区已就绪。`,
      'WELCOME TO OPENAI CODEX',
    ],
    ['glitch', 600],
    ['cinema', 9100],
  ];
  const markPath =
    'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

  function element(tag, name, text) {
    const node = document.createElement(tag);
    node.className = `wos-${name}`;
    if (text) node.textContent = text;
    return node;
  }
  function svgElement(tag, attributes) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }
  function mark() {
    const svg = svgElement('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' });
    svg.append(svgElement('path', { d: markPath }));
    return svg;
  }
  function typeLine(node, text) {
    node.replaceChildren();
    Array.from(text || '').forEach((character, index) => {
      const glyph = element('span', 'glyph', character === ' ' ? '\u00a0' : character);
      glyph.style.setProperty('--wos-delay', `${index * 22 * scale}ms`);
      node.append(glyph);
    });
  }
  function later(ms, fn) {
    const cancel = ctx.later(ms, () => {
      cancels.delete(cancel);
      if (!removed) fn();
    });
    cancels.add(cancel);
    return () => {
      cancel();
      cancels.delete(cancel);
    };
  }
  function cancelPending() {
    for (const cancel of cancels) cancel();
    cancels.clear();
  }

  const screen = element('section', 'screen');
  screen.classList.add('woodfish-openai-startup');
  screen.dataset.woodfishOpenaiStartup = '';
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.setAttribute('aria-label', 'OpenAI / Codex 启动画面');
  screen.style.setProperty('--wos-scale', scale);

  const plate = element('div', 'plate');
  const panels = element('div', 'panels');
  for (let i = 0; i < 4; i++) panels.append(element('i', 'panel'));
  const brand = element('header', 'brand');
  brand.append(
    element('strong', 'brand-name', 'OPENAI'),
    element('span', 'brand-sub', 'SYNTHESIZE INTELLIGENCE'),
    element('b', 'brand-os', 'CODEX OS')
  );
  const revision = element('div', 'revision', 'REV 0.2.0 · LOCAL PROFILE');
  const ticks = element('div', 'ticks');
  for (let i = 0; i < 6; i++) ticks.append(element('i', 'tick'));
  revision.append(ticks);

  const center = element('div', 'center');
  const title = element('h1', 'status');
  const subtitle = element('p', 'subtitle');
  const logo = element('div', 'logo');
  logo.append(mark(), element('span', 'logo-label', 'O P E N A I'), element('i', 'dots'));
  center.append(title, subtitle, element('div', 'rule'), logo);

  const actionArea = element('div', 'action-area');
  const card = element('dl', 'card');
  for (const [label, value] of [
    ['身份名称', displayName],
    ['身份编号', '0001'],
    ['访问级别', 'L3'],
  ]) {
    const row = element('div', 'card-row');
    row.append(element('dt', 'card-key', label), element('dd', 'card-value', value));
    card.append(row);
  }
  const action = element('button', 'action');
  action.type = 'button';
  action.dataset.startupAction = '';
  const actionZh = element('span', 'action-zh');
  const actionEn = element('span', 'action-en');
  action.append(actionZh, actionEn);
  actionArea.append(card, action, element('span', 'hint', '点击按钮 / 按 Enter 或空格继续'));

  const reticle = element('div', 'reticle');
  reticle.setAttribute('aria-hidden', 'true');
  const rings = svgElement('svg', { viewBox: '0 0 500 500' });
  const rim = svgElement('g', { class: 'wos-ring-rim' });
  for (let index = 0; index < 72; index++) {
    const angle = (index * Math.PI) / 36;
    const inner = index % 6 === 0 ? 235 : 240;
    rim.append(
      svgElement('path', {
        d: `M${250 + Math.sin(angle) * inner} ${250 + Math.cos(angle) * inner}L${250 + Math.sin(angle) * 246} ${250 + Math.cos(angle) * 246}`,
        class: index % 6 === 0 ? 'wos-rim-major' : 'wos-rim-minor',
      })
    );
  }
  rings.append(rim);
  for (const [radius, name] of [
    [226, 'outer'],
    [157, 'middle'],
    [93, 'inner'],
  ]) {
    const group = svgElement('g', { class: `wos-ring-${name}` });
    group.append(
      svgElement('circle', {
        cx: '250',
        cy: '250',
        r: String(radius),
        'stroke-dasharray': `${radius * 5} ${radius * 1.284}`,
      }),
      svgElement('circle', {
        cx: String(250 + radius),
        cy: '250',
        r: name === 'outer' ? '5' : '2.5',
        class: 'wos-ring-dot',
      })
    );
    rings.append(group);
  }
  for (const [x, y] of [
    [198, 174],
    [312, 201],
    [289, 321],
  ])
    rings.append(svgElement('path', { d: `M${x - 4} ${y}h8M${x} ${y - 4}v8`, class: 'wos-cross' }));
  reticle.append(rings);
  const hex = element(
    'pre',
    'hex',
    '3F 0A A1 8E 07 9C 12 34\nEE A1 1A 70 8D B5 15 12\n6A CA 8F 49 B7 93 40 51\nD2 4F CF CA 83 85 1A FD\n1C 51 89 E1 D1 68 BF 8C\n34 0F 67 9D 03 1B 27 44'
  );
  hex.setAttribute('aria-hidden', 'true');
  const welcome = element('div', 'welcome');
  welcome.append(
    element('strong', 'welcome-to', 'WELCOME TO'),
    element('b', 'welcome-box', 'OPENAI CODEX'),
    mark(),
    element('span', 'welcome-sub', 'E X P L O R E   ·   C R E A T E   ·   B U I L D')
  );
  const footer = element('footer', 'footer');
  const badge = element('span', 'badge');
  const log = element('div', 'log');
  const logZh = element('p', 'log-zh');
  const logEn = element('p', 'log-en');
  log.append(logZh, logEn);
  const progress = element('div', 'progress');
  const progressBar = element('i', 'progress-bar');
  progress.append(progressBar);
  footer.append(badge, log, element('span', 'powered', 'POWERED BY OPENAI ▰'), progress);
  const waveform = element('div', 'waveform');
  waveform.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 12; i++) {
    const bar = element('i', 'wave-bar');
    bar.style.setProperty('--wos-bar', i);
    waveform.append(bar);
  }
  plate.append(element('div', 'archive-scan'), waveform);
  plate.append(
    panels,
    brand,
    revision,
    center,
    actionArea,
    reticle,
    hex,
    welcome,
    element('span', 'idline', '· ID CONFIRMED : 0001'),
    footer
  );

  const boot = element('div', 'boot');
  const bootInner = element('div', 'boot-inner');
  bootInner.append(
    mark(),
    element('strong', 'boot-name', 'OpenAI'),
    element('span', 'boot-sub', 'CODEX / INTELLIGENCE IN ACTION')
  );
  boot.append(bootInner, element('i', 'boot-sweep'));
  const bootTelemetry = element(
    'div',
    'boot-telemetry',
    'NEURAL ENGINE  /  INITIALIZING\nOPENAI · CODEX   //   LOCAL SESSION'
  );
  bootTelemetry.setAttribute('aria-hidden', 'true');
  boot.append(bootTelemetry);

  const cinema = element('div', 'cinema');
  cinema.append(element('div', 'portrait'), element('div', 'wire'), element('div', 'scan'));
  const hudTop = element('div', 'hud-top');
  hudTop.append(
    element('span', 'hud-name', 'OpenAI ━━━━━ +'),
    element('span', 'hud-caption', 'AI ASSISTANT\nFOR A BETTER TOMORROW')
  );
  const hero = element('div', 'hero');
  const heroTitle = element('h2', 'hero-title', 'OpenAI');
  heroTitle.dataset.text = 'OpenAI';
  hero.append(
    element('p', 'hero-eyebrow', 'CODEX / INTELLIGENT WORKSPACE'),
    heroTitle,
    element('p', 'hero-zh', '欢迎来到专业工作模式'),
    element('p', 'hero-en', 'PROFESSIONAL WORK MODE'),
    element(
      'p',
      'terminal',
      '> neural interface ........ ONLINE\n> workspace channel ....... LINKED\n> initializing codex_  ▮'
    )
  );
  cinema.append(
    hudTop,
    hero,
    element('span', 'hud-right', 'CODEX\nSYSTEM ONLINE\nSIGNAL : 100%'),
    element('span', 'hud-bottom', 'YOUR AI COMPANION\nBUILD A SMARTER FUTURE ━━━━━'),
    element('div', 'cinema-progress')
  );
  const hudReticle = element('div', 'hud-reticle');
  const orbitLines = svgElement('svg', { viewBox: '0 0 600 220', 'aria-hidden': 'true' });
  orbitLines.append(
    svgElement('path', {
      d: 'M15 175C140 125 230 15 455 32S555 108 525 148M35 195C150 150 235 52 460 52',
      fill: 'none',
    })
  );
  orbitLines.append(svgElement('circle', { cx: '455', cy: '32', r: '3' }));
  hudReticle.append(orbitLines);
  hudReticle.setAttribute('aria-hidden', 'true');
  cinema.append(hudReticle, element('div', 'hud-dust'));
  const enter = element('button', 'enter', '进入工作区 ↗');
  enter.type = 'button';
  enter.hidden = true;
  cinema.append(enter);

  const skip = element('button', 'skip', 'SKIP ▸ / Esc');
  skip.type = 'button';
  skip.dataset.startupSkip = '';
  screen.append(cinema, plate, boot, element('div', 'wash'), skip);

  function remove() {
    if (removed) return;
    removed = true;
    cancelPending();
    const restore = screen.contains(document.activeElement);
    screen.remove();
    if (restore && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function leave() {
    if (leaving || removed) return;
    leaving = true;
    cancelPending();
    screen.dataset.leaving = 'true';
    screen.toggleAttribute('data-workspace-reveal', !ctx.simplified());
    screen.style.pointerEvents = 'none';
    // 淡出时立即归还键盘焦点，避免透明按钮继续截获输入。
    if (screen.contains(document.activeElement) && previousFocus?.isConnected)
      previousFocus.focus({ preventScroll: true });
    later(900, remove);
  }
  function next() {
    if (leaving || removed) return;
    pendingStep?.();
    stageIndex += 1;
    if (stageIndex >= stages.length) {
      leave();
      return;
    }
    const [stage, ms, zh, en, message, messageEn] = stages[stageIndex];
    screen.dataset.stage = stage;
    plate.setAttribute('aria-hidden', String(stage === 'boot' || stage === 'cinema'));
    boot.setAttribute('aria-hidden', String(stage !== 'boot'));
    cinema.setAttribute('aria-hidden', String(stage !== 'cinema'));
    screen.style.setProperty('--wos-scene-duration', `${ms * scale}ms`);
    typeLine(title, zh);
    typeLine(subtitle, en);
    logZh.textContent = message || '';
    logEn.textContent = messageEn || '';
    const step = Math.max(0, Math.min(5, stageIndex - 2));
    badge.textContent = `[ 0${step + 1} / 06 ] ${['AUTHORIZATION', 'IDENTITY', 'REQUEST', 'READ', 'VERIFY', 'WELCOME'][step]}`;
    progressBar.style.transform = `scaleX(${(step + 1) / 6})`;
    Array.from(ticks.children).forEach((tick, index) =>
      tick.classList.toggle('wos-current', index === step)
    );
    const waiting = stage === 'permission' || stage === 'identity';
    actionArea.hidden = !waiting;
    card.hidden = stage !== 'identity';
    action.hidden = !waiting;
    enter.hidden = stage !== 'cinema';
    actionZh.textContent = stage === 'permission' ? '授予访问权限' : '确认身份';
    actionEn.textContent = stage === 'permission' ? 'GRANT ACCESS' : 'CONFIRM IDENTITY';
    if (waiting && interactive) action.focus({ preventScroll: true });
    else if (screen.contains(document.activeElement) && document.activeElement !== skip)
      skip.focus({ preventScroll: true });
    if (!waiting || !interactive) pendingStep = later(ms * scale, next);
  }
  function confirm() {
    if (screen.dataset.stage === 'permission' || screen.dataset.stage === 'identity') next();
  }
  ctx.on(skip, 'click', leave);
  ctx.on(enter, 'click', leave);
  ctx.on(action, 'click', confirm);
  ctx.on(document, 'visibilitychange', () => {
    if (ctx.simplified()) leave();
  });
  if (typeof window.matchMedia === 'function') {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    ctx.on(motion, 'change', () => {
      if (motion.matches) leave();
    });
  }
  ctx.on(
    document,
    'keydown',
    (event) => {
      if (removed || leaving) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        leave();
      } else if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault();
        event.stopPropagation();
        if (document.activeElement === skip) leave();
        else if (screen.dataset.stage === 'cinema') leave();
        else confirm();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const buttons = [skip, action, enter].filter((button) => !button.hidden);
        const index = buttons.indexOf(document.activeElement);
        buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length].focus({
          preventScroll: true,
        });
      }
    },
    true
  );
  ctx.layer.append(screen);
  skip.focus({ preventScroll: true });
  next();
  later(120000, leave);
  return { dispose: remove };
}

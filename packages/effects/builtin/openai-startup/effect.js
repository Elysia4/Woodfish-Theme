/* OpenAI 开场只在当前页面第一次启用时出现，效果热更新不会再次挡住聊天。 */
module.exports = function openaiStartup(ctx) {
  const root = document.documentElement;
  if (root.dataset.woodfishOpenaiStartupSeen || ctx.simplified()) return {};
  root.dataset.woodfishOpenaiStartupSeen = 'true';

  const seconds = Number.isFinite(ctx.params.duration) ? ctx.params.duration : 4;
  const duration = Math.max(2, Math.min(8, seconds)) * 1000;
  const cancels = [];
  let leaving = false;
  let removed = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  const screen = element('section', 'woodfish-openai-startup');
  screen.dataset.woodfishOpenaiStartup = '';
  screen.dataset.stage = 'intro';
  screen.setAttribute('aria-label', 'OpenAI / Codex 启动画面');
  screen.style.setProperty('--woodfish-openai-startup-runtime', `${duration}ms`);

  const header = element('header', 'woodfish-openai-startup-header');
  const signature = element('div', 'woodfish-openai-startup-signature');
  signature.append(element('strong', '', 'OpenAI'), element('span', '', 'CODEX / WORKSPACE'));
  const skip = element('button', 'woodfish-openai-startup-skip', '跳过 · Esc');
  skip.type = 'button';
  header.append(signature, skip);

  const center = element('div', 'woodfish-openai-startup-center');
  const orbit = element('div', 'woodfish-openai-startup-orbit');
  orbit.setAttribute('aria-hidden', 'true');
  const title = element('h1', 'woodfish-openai-startup-title', 'OpenAI');
  const subtitle = element('p', 'woodfish-openai-startup-subtitle', '让想法，从这里开始。');
  const enter = element('button', 'woodfish-openai-startup-enter', '进入工作区 ↗');
  enter.type = 'button';
  center.append(
    orbit,
    element('p', 'woodfish-openai-startup-eyebrow', 'A SPACE FOR IDEAS'),
    title,
    subtitle,
    enter
  );

  const footer = element('footer', 'woodfish-openai-startup-footer');
  const progress = element('div', 'woodfish-openai-startup-progress');
  progress.setAttribute('aria-hidden', 'true');
  progress.append(element('span', ''));
  footer.append(
    element('span', '', 'CREATE. EXPLORE. BUILD.'),
    progress,
    element('span', '', 'OPENAI / CODEX')
  );
  screen.append(header, center, footer);

  function cancelPending() {
    while (cancels.length) cancels.pop()();
  }

  function remove() {
    if (removed) return;
    removed = true;
    cancelPending();
    screen.remove();
  }

  function leave() {
    if (leaving || removed) return;
    leaving = true;
    cancelPending();
    screen.dataset.leaving = 'true';
    screen.style.pointerEvents = 'none';
    cancels.push(ctx.later(450, remove));
  }

  ctx.on(skip, 'click', leave);
  ctx.on(enter, 'click', leave);
  ctx.on(document, 'keydown', (event) => {
    if (event.key === 'Escape') leave();
  });
  // 字幕和图层只改变几次；不逐帧计算，不读取聊天内容或修改宿主节点。
  cancels.push(
    ctx.later(duration * 0.4, () => {
      screen.dataset.stage = 'ready';
      title.textContent = 'CODEX';
      subtitle.textContent = '把灵感，变成眼前的世界。';
    })
  );
  cancels.push(
    ctx.later(duration * 0.68, () => {
      screen.dataset.stage = 'reveal';
    })
  );
  cancels.push(ctx.later(duration, leave));
  ctx.layer.append(screen);

  return { dispose: remove };
};

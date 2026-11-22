/** @jest-environment jsdom */
/// <reference lib="dom" />

interface StartupContext {
  layer: HTMLElement;
  params: { duration: number; requireInteraction: boolean; displayName?: string };
  simplified: () => boolean;
  reducedMotion: () => boolean;
  on: (target: EventTarget, type: string, listener: EventListener, options?: boolean) => void;
  later: (ms: number, fn: () => void) => () => void;
}

type StartupFactory = (ctx: StartupContext) => { dispose?: () => void };
let layer: HTMLElement;
let context: StartupContext;
let factory: StartupFactory;
let cleanups: Array<() => void>;

beforeEach(() => {
  jest.useFakeTimers();
  delete document.documentElement.dataset.woodfishOpenaiStartupSeen;
  document.body.replaceChildren();
  layer = document.createElement('div');
  document.body.append(layer);
  cleanups = [];
  context = {
    layer,
    params: { duration: 26, requireInteraction: true, displayName: 'Elysia' },
    simplified: () => false,
    reducedMotion: () => false,
    on: (target, type, listener, options) => {
      target.addEventListener(type, listener, options);
      cleanups.push(() => target.removeEventListener(type, listener, options));
    },
    later: (ms, fn) => {
      const timer = setTimeout(fn, ms);
      const cancel = (): void => clearTimeout(timer);
      cleanups.push(cancel);
      return cancel;
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  factory = require('../../builtin/openai-startup/effect.js') as StartupFactory;
});

afterEach(() => {
  cleanups.forEach((cleanup) => cleanup());
  jest.useRealTimers();
});

function overlay(): HTMLElement | null {
  return layer.querySelector('[data-woodfish-openai-startup]');
}
function action(): HTMLButtonElement | null {
  return layer.querySelector('[data-startup-action]');
}
function key(key: string, repeat = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, repeat, cancelable: true, bubbles: true });
  document.dispatchEvent(event);
  return event;
}

describe('OpenAI startup reference sequence', () => {
  it('uses the configured name as text in both the identity card and welcome', () => {
    context.params.displayName = '<b>龙娘</b>';
    factory(context);
    expect(layer.querySelector('.wos-card')?.textContent).toContain('<b>龙娘</b>');
    expect(layer.querySelector('.wos-card b')).toBeNull();
    jest.advanceTimersByTime(2900);
    action()?.click();
    action()?.click();
    jest.advanceTimersByTime(6500);
    expect(layer.querySelector('.wos-log-zh')?.textContent).toContain('<b>龙娘</b>');
  });

  it('uses a generic name when no name is configured', () => {
    delete context.params.displayName;
    factory(context);
    expect(layer.querySelector('.wos-card')?.textContent).toContain('访客');
    expect(layer.querySelector('.wos-card')?.textContent).not.toContain('Elysia');
  });
  it('starts with a black OpenAI mark and washes into the authorization plate', () => {
    factory(context);
    expect(overlay()?.dataset.stage).toBe('boot');
    expect(overlay()?.querySelector('svg')).not.toBeNull();
    jest.advanceTimersByTime(2900);
    expect(overlay()?.dataset.stage).toBe('permission');
    expect(action()?.textContent).toContain('授予访问权限');
  });

  it('waits for each confirmation, then runs verification, welcome and the character scene', () => {
    factory(context);
    jest.advanceTimersByTime(7000);
    expect(overlay()?.dataset.stage).toBe('permission');
    action()?.click();
    expect(overlay()?.dataset.stage).toBe('identity');
    expect(overlay()?.textContent).toContain('Elysia');
    jest.advanceTimersByTime(7000);
    expect(overlay()?.dataset.stage).toBe('identity');
    key('Enter');
    expect(overlay()?.dataset.stage).toBe('request');
    jest.advanceTimersByTime(1500);
    expect(overlay()?.dataset.stage).toBe('read');
    jest.advanceTimersByTime(2200);
    expect(overlay()?.dataset.stage).toBe('verified');
    jest.advanceTimersByTime(2800);
    expect(overlay()?.dataset.stage).toBe('welcome');
    jest.advanceTimersByTime(2600);
    expect(overlay()?.dataset.stage).toBe('glitch');
    jest.advanceTimersByTime(600);
    expect(overlay()?.dataset.stage).toBe('cinema');
    jest.advanceTimersByTime(10100);
    expect(overlay()).toBeNull();
  });

  it('can play automatically without confirmation and leaves no timers after fading', () => {
    context.params.requireInteraction = false;
    factory(context);
    jest.advanceTimersByTime(26000);
    expect(overlay()?.hasAttribute('data-workspace-reveal')).toBe(true);
    jest.advanceTimersByTime(900);
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('reveals the workspace when entering it from the final scene', () => {
    context.params.requireInteraction = false;
    factory(context);
    jest.advanceTimersByTime(20000);
    expect(overlay()?.dataset.stage).toBe('cinema');
    expect(overlay()?.hasAttribute('data-workspace-reveal')).toBe(false);
    layer.querySelector<HTMLButtonElement>('.wos-enter')?.click();
    expect(overlay()?.hasAttribute('data-workspace-reveal')).toBe(true);
    jest.advanceTimersByTime(900);
    expect(overlay()).toBeNull();
  });

  it.each(['boot', 'permission', 'identity', 'cinema'])('can skip during %s', (stage) => {
    factory(context);
    if (stage !== 'boot') jest.advanceTimersByTime(2900);
    if (stage === 'identity' || stage === 'cinema') action()?.click();
    if (stage === 'cinema') {
      action()?.click();
      jest.advanceTimersByTime(9700);
    }
    expect(overlay()?.dataset.stage).toBe(stage);
    layer.querySelector<HTMLButtonElement>('[data-startup-skip]')?.click();
    jest.advanceTimersByTime(1000);
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('handles Space, ignores repeated keys and consumes only the startup controls', () => {
    factory(context);
    jest.advanceTimersByTime(2900);
    expect(key('a').defaultPrevented).toBe(false);
    key('Enter', true);
    expect(overlay()?.dataset.stage).toBe('permission');
    expect(key(' ').defaultPrevented).toBe(true);
    expect(overlay()?.dataset.stage).toBe('identity');
    key(' ', true);
    expect(overlay()?.dataset.stage).toBe('identity');
    key('Escape');
    key('Escape');
    jest.advanceTimersByTime(1000);
    expect(overlay()).toBeNull();
  });

  it('confines focus to the startup and restores the composer when disposed', () => {
    const editor = document.createElement('textarea');
    document.body.prepend(editor);
    editor.focus();
    const instance = factory(context);
    expect(overlay()?.contains(document.activeElement)).toBe(true);
    jest.advanceTimersByTime(2900);
    expect(document.activeElement).toBe(action());
    key('Tab');
    expect(overlay()?.contains(document.activeElement)).toBe(true);
    instance.dispose?.();
    expect(document.activeElement).toBe(editor);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not restart on reinjection in the same page', () => {
    factory(context).dispose?.();
    factory(context);
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each(['focus', 'visibilitychange'])('starts once when %s makes the window active', (type) => {
    let active = false;
    context.simplified = () => !active;
    const target = type === 'focus' ? window : document;
    factory(context);
    target.dispatchEvent(new Event(type));
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);

    active = true;
    target.dispatchEvent(new Event(type));
    const screen = overlay();
    expect(screen?.dataset.stage).toBe('boot');
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(overlay()).toBe(screen);
    expect(layer.querySelectorAll('[data-woodfish-openai-startup]')).toHaveLength(1);
  });

  it('cancels deferred playback when the effect is disposed', () => {
    context.simplified = () => true;
    const instance = factory(context);
    instance.dispose?.();
    context.simplified = () => false;
    window.dispatchEvent(new Event('focus'));
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('skips when reduced motion is requested', () => {
    context.simplified = () => true;
    context.reducedMotion = () => true;
    factory(context);
    context.simplified = () => false;
    context.reducedMotion = () => false;
    window.dispatchEvent(new Event('focus'));
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('has a safety timeout even when a confirmation is never supplied', () => {
    factory(context);
    jest.advanceTimersByTime(121000);
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('returns focus immediately while fading and no longer consumes typing', () => {
    const editor = document.createElement('textarea');
    document.body.prepend(editor);
    editor.focus();
    factory(context);
    key('Escape');
    expect(document.activeElement).toBe(editor);
    expect(key(' ').defaultPrevented).toBe(false);
    jest.advanceTimersByTime(1000);
    expect(overlay()).toBeNull();
  });

  it('leaves when the window switches to simplified motion during playback', () => {
    factory(context);
    context.simplified = () => true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(overlay()?.hasAttribute('data-workspace-reveal')).not.toBe(true);
    jest.advanceTimersByTime(1000);
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([Number.NaN, -20, 200])('bounds an invalid duration %s', (duration) => {
    context.params = { duration, requireInteraction: false };
    factory(context);
    jest.advanceTimersByTime(42000);
    expect(overlay()).toBeNull();
  });
});

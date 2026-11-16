/** @jest-environment jsdom */
/// <reference lib="dom" />

interface StartupContext {
  layer: HTMLElement;
  params: { duration: number };
  simplified: () => boolean;
  on: (target: EventTarget, type: string, listener: EventListener) => void;
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
    params: { duration: 4 },
    simplified: () => false,
    on: (target, type, listener) => {
      target.addEventListener(type, listener);
      cleanups.push(() => target.removeEventListener(type, listener));
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

describe('OpenAI startup', () => {
  it('shows OpenAI and Codex, then removes the overlay after fading out', () => {
    factory(context);
    expect(overlay()?.textContent).toContain('OpenAI');
    expect(overlay()?.textContent).toContain('CODEX');
    jest.advanceTimersByTime(4000);
    expect(overlay()?.dataset.leaving).toBe('true');
    jest.advanceTimersByTime(500);
    expect(overlay()).toBeNull();
  });

  it('allows skipping immediately by button', () => {
    factory(context);
    layer.querySelector<HTMLButtonElement>('button')?.click();
    jest.advanceTimersByTime(500);
    expect(overlay()).toBeNull();
  });

  it('allows Escape to leave without intercepting normal typing', () => {
    factory(context);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(overlay()?.dataset.leaving).toBeUndefined();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    jest.advanceTimersByTime(500);
    expect(overlay()).toBeNull();
  });

  it('does not cover the chat again on reinjection in the same page', () => {
    const first = factory(context);
    first.dispose?.();
    factory(context);
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('skips the startup when simplified motion is requested', () => {
    context.simplified = () => true;
    factory(context);
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('disposes immediately and cancels every pending timer', () => {
    const instance = factory(context);
    instance.dispose?.();
    expect(overlay()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('safely handles repeated requests to leave', () => {
    factory(context);
    const button = layer.querySelector<HTMLButtonElement>('button');
    button?.click();
    button?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(jest.getTimerCount()).toBe(1);
    jest.advanceTimersByTime(500);
    expect(overlay()).toBeNull();
  });

  it('bounds an invalid duration so a bad setting cannot trap the chat', () => {
    context.params.duration = Number.NaN;
    factory(context);
    jest.advanceTimersByTime(4500);
    expect(overlay()).toBeNull();
  });
});

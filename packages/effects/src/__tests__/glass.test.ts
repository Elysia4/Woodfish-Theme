/** @jest-environment jsdom */
/// <reference lib="dom" />

interface GlassContext {
  lib: object;
  params: { mode: string; opacity: number; blur: number; saturate: number };
  selectors: { floatingLayer: string; composerMenuHeader: string };
  style: (css: string) => void;
  on: (target: EventTarget, type: string, listener: EventListener, capture?: boolean) => void;
}

const marker = 'data-woodfish-preview-position';
const anchorProperty = '--woodfish-preview-anchor';

function popover(anchor: string, kind: 'hint' | 'manual' = 'hint'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('popover', kind);
  if (kind === 'manual') wrapper.setAttribute('role', 'dialog');
  wrapper.innerHTML =
    '<div data-anchor-positioning="native" data-placement="inline-end-start"></div>';
  const card = wrapper.firstElementChild as HTMLElement;
  jest.spyOn(card.style, 'getPropertyValue').mockReturnValue(anchor);
  document.body.append(wrapper);
  return wrapper;
}

function toggle(wrapper: HTMLElement, newState: 'open' | 'closed'): void {
  const event = new Event('beforetoggle');
  Object.defineProperty(event, 'newState', { value: newState });
  wrapper.dispatchEvent(event);
}

describe('sidebar preview positioning', () => {
  const listeners: Array<() => void> = [];
  let dispose: () => void;
  const style = jest.fn<void, [string]>();

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const glass = require('../../builtin/glass/effect.js') as (ctx: GlassContext) => {
      dispose: () => void;
    };
    dispose = glass({
      lib: {},
      params: { mode: 'blur', opacity: 0.4, blur: 24, saturate: 150 },
      selectors: { floatingLayer: '[role="menu"]', composerMenuHeader: '.menu-header' },
      style,
      on: (target, type, listener, capture) => {
        target.addEventListener(type, listener, capture);
        listeners.push(() => target.removeEventListener(type, listener, capture));
      },
    }).dispose;
  });

  afterEach(() => {
    dispose();
    listeners.splice(0).forEach((remove) => remove());
    jest.restoreAllMocks();
    style.mockClear();
    document.body.replaceChildren();
  });

  it('anchors only the opening chat hint and clears positioning when it closes', () => {
    const wrapper = popover('--chat-preview-example');
    const unrelated = popover('--other-preview');
    expect(wrapper.hasAttribute(marker)).toBe(false);
    toggle(unrelated, 'open');
    expect(unrelated.hasAttribute(marker)).toBe(false);

    toggle(wrapper, 'open');
    expect(wrapper.hasAttribute(marker)).toBe(true);
    expect(wrapper.style.getPropertyValue(anchorProperty)).toBe('--chat-preview-example');
    expect(style).toHaveBeenCalledWith(
      expect.stringContaining('position-anchor: var(--woodfish-preview-anchor)')
    );

    toggle(wrapper, 'closed');
    expect(wrapper.hasAttribute(marker)).toBe(false);
    expect(wrapper.style.getPropertyValue(anchorProperty)).toBe('');
  });

  it('cleans up an open hint when the effect is disposed', () => {
    const wrapper = popover('--chat-preview-example');
    toggle(wrapper, 'open');
    expect(wrapper.hasAttribute(marker)).toBe(true);
    dispose();
    expect(wrapper.hasAttribute(marker)).toBe(false);
    expect(wrapper.style.getPropertyValue(anchorProperty)).toBe('');
  });

  it('anchors only the manual dialog that belongs to a project row', () => {
    const anchor = document.createElement('div');
    Object.defineProperty(anchor.style, 'anchorName', { value: '--native-popover-project' });
    anchor.innerHTML = '<div data-app-action-sidebar-project-row></div>';
    document.body.append(anchor);
    const wrapper = popover('--native-popover-project', 'manual');
    const unrelated = popover('--native-popover-other', 'manual');
    toggle(unrelated, 'open');
    expect(unrelated.hasAttribute(marker)).toBe(false);
    toggle(wrapper, 'open');
    expect(wrapper.hasAttribute(marker)).toBe(true);
    expect(wrapper.style.getPropertyValue(anchorProperty)).toBe('--native-popover-project');
    toggle(wrapper, 'closed');
    expect(wrapper.hasAttribute(marker)).toBe(false);
    expect(wrapper.style.getPropertyValue(anchorProperty)).toBe('');
  });
});

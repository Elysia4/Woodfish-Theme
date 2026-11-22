import { EffectValues } from '@woodfish/theme-core';
import {
  CODEX_DEFAULT_BACKGROUND_ID,
  CODEX_GRADIENT_BACKGROUND_ID,
  DEFAULT_CODEX_SETTINGS,
  applyCodexSettingsPatch,
  buildBackgroundCss,
  composeCodexCoreView,
  isCodexBackgroundId,
  normalizeCodexSettings,
} from '../index';

/** The background effect at its defaults (its values come from effects/background). */
const ON = { enabled: true } as EffectValues;

function view(image = CODEX_DEFAULT_BACKGROUND_ID, values: EffectValues | null = ON) {
  return composeCodexCoreView(normalizeCodexSettings({ backgroundImage: image }), {
    background: values,
  });
}

describe('Codex background settings', () => {
  it("uses 《彩云》 and the owner's defaults when the effect is on", () => {
    expect(view().background).toMatchObject({
      enabled: true,
      image: CODEX_DEFAULT_BACKGROUND_ID,
      opacity: 0.15,
      blur: 10,
      mask: 0.35,
      saturate: 150,
    });
  });

  it('accepts only built-in ids and 12-hex saved ids', () => {
    expect(isCodexBackgroundId('caiyun')).toBe(true);
    expect(isCodexBackgroundId('gradient')).toBe(true);
    expect(isCodexBackgroundId('0123456789ab')).toBe(true);
    expect(isCodexBackgroundId('../../secret')).toBe(false);
    expect(isCodexBackgroundId('0123456789AB')).toBe(false);
    expect(normalizeCodexSettings({ backgroundImage: 'x.png' }).backgroundImage).toBe(
      CODEX_DEFAULT_BACKGROUND_ID
    );
  });

  it('lets the panel pick a picture, nothing else', () => {
    const next = applyCodexSettingsPatch(DEFAULT_CODEX_SETTINGS, {
      backgroundImage: 'abcdefabcdef',
    });
    expect(next.backgroundImage).toBe('abcdefabcdef');
    expect(applyCodexSettingsPatch(next, { backgroundImage: 'javascript:1' }).backgroundImage).toBe(
      'abcdefabcdef'
    );
  });
});

describe('buildBackgroundCss', () => {
  it('emits nothing when the effect is off', () => {
    expect(buildBackgroundCss(view(CODEX_DEFAULT_BACKGROUND_ID, null))).toBe('');
  });

  it('clears the thread and draws panels and bands as static copies of the layer', () => {
    const css = buildBackgroundCss(view());
    expect(css.startsWith('@media not (prefers-reduced-transparency: reduce) {')).toBe(true);
    expect(css).toContain('body::before {');
    expect(css).toContain('--woodfish-codex-surface: var(--color-surface);');
    expect(css).toContain(
      'main.bg-surface,\n[data-app-shell-main-surface],\n[data-codex-history-swipe-page] > .electron\\:bg-surface {\n  background-color: transparent !important;'
    );
    expect(css).toContain('--composer-layout-surface-backdrop-filter: none !important;');
    const footer = css.slice(css.indexOf('[data-thread-scroll-footer]'));
    expect(footer.slice(0, footer.indexOf('}'))).toContain(
      'background-attachment: fixed !important;'
    );
    expect(css).toContain('mask-image: linear-gradient(to bottom, #000, transparent);');
    // Live blur stays on grouped surfaces, away from streaming replies.
    const blurRules = css.split('}').filter((block) => block.includes('backdrop-filter: blur'));
    expect(blurRules).toHaveLength(1);
    expect(blurRules[0]).not.toContain('[data-app-action-timeline-scroll]');
    expect(blurRules[0]).not.toContain('[data-codex-composer-root]');
    expect(css).toContain('var(--woodfish-background-image, none)');
  });

  it('paints the fill gradient instead of a picture', () => {
    const css = buildBackgroundCss(view(CODEX_GRADIENT_BACKGROUND_ID));
    expect(css).toContain('linear-gradient(180deg, #2990bd, #e2ab5b, #e384be)');
    expect(css).not.toContain('--woodfish-background-image');
  });

  it.each([
    '[data-app-shell-surface-backing]',
    '[data-app-shell-frame]',
    '[data-sidebar-navigation-root]',
    '[data-app-shell-inline-page-header] [data-sticky]:has(#plugins-store-page-search)::before',
    '[data-app-shell-inline-page-header] [data-sticky]:has(#plugins-page-search)::before',
  ])('draws the same unblurred window background on %s', (selector) => {
    const css = buildBackgroundCss(view());
    const rule = css.split('}').find((block) => block.includes(selector)) ?? '';
    expect(rule).toContain('var(--woodfish-background-image, none)');
    expect(rule).not.toContain('--woodfish-background-image-soft');
    expect(rule).not.toContain('--woodfish-background-luminosity');
    expect(rule).toContain('background-attachment: fixed !important;');
  });

  it('uses the wallpaper for the current thread top fade while keeping its mask', () => {
    const css = buildBackgroundCss(view());
    const fade =
      '[data-app-shell-main-surface] [aria-hidden="true"][class*="bg-[image:var(--app-shell-content-fade,"]';
    const rules = css.split('}').filter((block) => block.includes(fade));
    expect(rules.some((rule) => rule.includes('var(--woodfish-background-image, none)'))).toBe(
      true
    );
    expect(
      rules.some((rule) =>
        rule.includes('mask-image: linear-gradient(to bottom, #000, transparent)')
      )
    ).toBe(true);
  });

  it('paints a small frosted layer and a rounded outline behind grouped settings rows', () => {
    const css = buildBackgroundCss(view());
    const card =
      '[data-settings-panel] [class*="]:after:bg-border"]:is([class~="[--settings-row-padding-inline:initial]"]:has(> *), :has(> [class~="@container/settings-row"]))';
    const fixture = document.createElement('div');
    fixture.innerHTML = `
      <div data-settings-panel>
        <div class="flex flex-col [&>*:not(:last-child)]:after:bg-border [--settings-row-padding-inline:initial]">
          <div class="@container/settings-row"></div>
        </div>
      </div>`;
    expect(fixture.querySelector(card)).not.toBeNull();
    const layer = css.split('}').find((block) => block.includes(`${card}::before`)) ?? '';
    expect(layer).toContain('backdrop-filter: blur(6px);');
    expect(layer).toContain('box-shadow: inset 0 0 0 1px');
    expect(layer).toContain('border-radius: inherit;');
    expect(layer).toContain('pointer-events: none;');
  });

  it('shares one decorative layer across settings, catalog and project groups', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div data-settings-panel>
        <div id="settings" class="[&>*:not(:last-child)]:after:bg-border [--settings-row-padding-inline:initial]">
          <div id="setting-row"></div>
        </div>
        <div id="settings-legacy" class="[&>*:not(:last-child)]:after:bg-border">
          <div class="@container/settings-row"></div>
        </div>
        <section><div id="permissions"><table data-page-size></table></div></section>
        <fieldset><section><div id="pets" class="grid"><div class="rounded-2xl bg-surface text-center"></div></div></section></fieldset>
      </div>
      <main data-app-shell-main-surface>
        <input id="plugins-store-page-search">
        <section id="plugins-communication">
          <div id="category-heading" data-slot="section-header">Communication</div>
          <div><div id="category" class="grid @min-[581px]/skills-grid:grid-cols-2"><button id="plugin-row"></button></div></div>
        </section>
        <div id="plugin-search" class="grid @min-[581px]/skills-grid:grid-cols-2"><button></button></div>
      </main>
      <main data-app-shell-main-surface>
        <input id="plugins-page-search">
        <section id="skills-installed">
          <div data-slot="section-header">Installed</div>
          <div id="installed" class="grid @min-[581px]/skills-grid:grid-cols-2"><button></button></div>
        </section>
        <div id="skill-tab" class="grid @min-[581px]/skills-grid:grid-cols-2"><button></button></div>
        <div id="empty-grid" class="grid @min-[581px]/skills-grid:grid-cols-2"></div>
      </main>
      <main data-app-shell-main-surface>
        <div class="grid @min-[581px]/skills-grid:grid-cols-2" id="unrelated-grid"><button></button></div>
        <div id="projects">
          <div data-projects-header></div>
          <div data-projects-rows><div id="project-row" data-project-row-wrapper></div></div>
        </div>
      </main>`;
    const css = buildBackgroundCss(view());
    const decorations = css.match(/([^{}]+)\{[^{}]*backdrop-filter: blur\(6px\);[^{}]*\}/g) ?? [];
    expect(decorations).toHaveLength(1);
    const layer = decorations[0] ?? '';
    const selectors = layer.slice(0, layer.indexOf('{')).replace(/::before/g, '');
    expect([...root.querySelectorAll(selectors)].map((element) => element.id)).toEqual([
      'settings',
      'settings-legacy',
      'permissions',
      'pets',
      'category',
      'plugin-search',
      'installed',
      'skill-tab',
      'projects',
    ]);
  });

  it.each(['default', 'opaque'])(
    'paints the rounded body of an overflowing %s home composer, keeping its wrapper clear',
    (variant) => {
      const fixture = document.createElement('div');
      fixture.innerHTML = `
        <div data-codex-composer-root data-composer-placement="home">
          <div id="home-layout" data-composer-surface-variant="${variant}" data-composer-surface-overflow="visible">
            <div id="home-body" data-composer-body></div>
            <div id="home-menu" role="listbox"></div>
          </div>
        </div>
        <div data-codex-composer-root data-composer-placement="thread">
          <div id="thread-layout" data-composer-surface-variant="${variant}" data-composer-surface-overflow="auto">
            <div id="thread-body" data-composer-body></div>
          </div>
        </div>`;
      const style = document.createElement('style');
      style.textContent = buildBackgroundCss(view());
      document.head.append(style);
      try {
        const media = style.sheet!.cssRules[0] as CSSMediaRule;
        const painted = Array.from(media.cssRules).filter(
          (rule): rule is CSSStyleRule =>
            'style' in rule &&
            (rule as CSSStyleRule).style.getPropertyValue('background-attachment') === 'fixed'
        );
        const paints = (id: string): boolean =>
          painted.some((rule) => fixture.querySelector(`#${id}`)!.matches(rule.selectorText));
        expect(paints('home-layout')).toBe(false);
        expect(paints('home-body')).toBe(true);
        expect(paints('home-menu')).toBe(false);
        expect(paints('thread-layout')).toBe(true);
        expect(paints('thread-body')).toBe(false);
        // Keep menus, focus rings and the attached project rail free to overflow.
        expect(painted.every((rule) => !rule.style.getPropertyValue('overflow'))).toBe(true);
      } finally {
        style.remove();
      }
    }
  );

  it('covers the current footer pseudo-elements with aligned background copies', () => {
    const css = buildBackgroundCss(view());
    const footer = '[data-request-input-activity-root] :has(> [data-thread-scroll-footer])';
    for (const pseudo of ['::before', '::after']) {
      const start = css.indexOf(`${footer}${pseudo}`);
      expect(start).toBeGreaterThan(-1);
      expect(css.slice(start, css.indexOf('}', start))).toContain(
        'background-attachment: fixed !important;'
      );
    }
    expect(css).toContain(
      `${footer}::before {\n  mask-image: linear-gradient(to top, #000, transparent);`
    );
    expect(buildBackgroundCss(view('caiyun', null))).not.toContain(footer);
  });
});

import {
  buildBackgroundCopyDeclarations,
  buildBackgroundFillImage,
  buildBackgroundLayerCss,
} from '@woodfish/renderer-runtime';
import { CODEX_SELECTORS, selectorOf } from '../selectors';
import { CODEX_GRADIENT_BACKGROUND_ID, CodexCoreView } from '../settings';

/** Codex's surface color, read at the root before Woodfish clears it inside the thread. */
const SURFACE = '--woodfish-codex-surface';

function rule(selector: string, declarations: string[]): string {
  return [`${selector} {`, ...declarations, '}'].join('\n');
}

/**
 * The window background in Codex. The layer sits under the whole window; the thread, the
 * window frame and pages like Settings share that background. The composer uses a
 * frosted copy. Codex's fades and the strip behind the composer (content scrolls under
 * them) use the original. Every one of them is a static
 * image pinned to the window, no backdrop-filter: measured in a streaming reply, live
 * filters on these areas roughly doubled the frame time (the running indicator, the caret
 * and the text scrolling under the composer force a recompute every frame).
 */
export function buildBackgroundCss(settings: CodexCoreView): string {
  const background = settings.background;
  if (!background.enabled) {
    return '';
  }
  const surface = `var(${SURFACE})`;
  const fill =
    background.image === CODEX_GRADIENT_BACKGROUND_ID
      ? buildBackgroundFillImage(background.fill)
      : undefined;
  const windowBackground = buildBackgroundCopyDeclarations(background, {
    base: surface,
    image: fill,
  });
  const topFade = selectorOf('mainTopFade');
  const pluginPageHeaderBackdrop = CODEX_SELECTORS.pluginPageHeader.selectors
    .map((selector) => `${selector}::before`)
    .join(',\n');
  const settingsPanel = selectorOf('settingsPanel');
  const paddedCards = [
    ...CODEX_SELECTORS.settingsCard.selectors,
    ...CODEX_SELECTORS.settingsGallery.selectors,
    ...CODEX_SELECTORS.catalogGroup.selectors,
  ];
  const groupCards = [...paddedCards, ...CODEX_SELECTORS.projectListCard.selectors];
  const groupCardBackdrops = groupCards.map((selector) => `${selector}::before`).join(',\n');
  const footerFade = `${selectorOf('timeline')} .from-surface.pointer-events-none`;
  const footer = selectorOf('threadFooter');
  // Current Codex paints the lower fade and inset on the footer parent's pseudo-elements.
  // Match the stable data attribute instead of its generated footer-xxxx class.
  const footerContainer = selectorOf('threadFooterContainer');
  const composer = CODEX_SELECTORS.composerLayout.selectors.join(',\n');
  // An overflowing layout is a square positioning wrapper: Codex puts its rounded
  // surface on the direct body instead. Paint that body without clipping its menus.
  const composerPanels = CODEX_SELECTORS.composerPanel.selectors.join(',\n');
  const composerSurface =
    'var(--color-background-composer-surface, var(--color-surface-elevated-secondary))';

  const css = [
    rule(':root', [`  ${SURFACE}: var(--color-surface);`]),
    buildBackgroundLayerCss(background, {
      layerSelector: 'body::before',
      base: surface,
      lightScope: '[data-theme="light"]',
      image: fill,
    }),
    // The thread, the window frame and pages like Settings (Tailwind `electron:bg-surface`).
    rule(`main.bg-surface,\n${selectorOf('appShell')},\n${selectorOf('page')}`, [
      '  background-color: transparent !important;',
    ]),
    rule(selectorOf('appShellFrame'), windowBackground),
    // Newer Codex draws a separate backing behind the transparent main surface.
    rule(selectorOf('appShellSurfaceBacking'), windowBackground),
    rule(selectorOf('sidebar'), windowBackground),
    rule(pluginPageHeaderBackdrop, windowBackground),
    rule(settingsPanel, [
      '  --color-border: color-mix(in oklab, var(--color-text) 9%, transparent);',
      '  --color-border-subtle: color-mix(in oklab, var(--color-text) 6%, transparent);',
    ]),
    rule(paddedCards.join(',\n'), ['  padding-inline: 12px;']),
    rule(`${selectorOf('catalogGroup')},\n${selectorOf('settingsGallery')}`, [
      '  padding-block: 8px;',
    ]),
    rule(groupCards.join(',\n'), [
      '  position: relative;',
      '  isolation: isolate;',
      '  border-radius: 14px;',
    ]),
    // Isolate the blur on a decorative layer so controls keep their positioning and hit areas.
    rule(groupCardBackdrops, [
      '  content: "";',
      '  position: absolute;',
      '  inset: 0;',
      '  z-index: -1;',
      '  pointer-events: none;',
      '  border-radius: inherit;',
      '  background-color: color-mix(in oklab, var(--color-surface) 30%, transparent);',
      '  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-text) 12%, transparent);',
      '  backdrop-filter: blur(6px);',
    ]),
    // The pet tiles already have a border and selection ring. Let the group tint show through.
    rule(`${selectorOf('settingsGallery')} > .bg-surface`, ['  background-color: transparent;']),
    rule(
      `${topFade},\n${footerFade},\n${footer},\n${footerContainer}::before,\n${footerContainer}::after`,
      windowBackground
    ),
    rule(topFade, ['  mask-image: linear-gradient(to bottom, #000, transparent);']),
    rule(footerFade, ['  mask-image: linear-gradient(to top, #000, transparent);']),
    rule(`${footerContainer}::before`, [
      '  mask-image: linear-gradient(to top, #000, transparent);',
    ]),
    rule(composer, [
      '  --composer-layout-surface-background: transparent !important;',
      '  --composer-layout-surface-backdrop-filter: none !important;',
    ]),
    rule(
      composerPanels,
      buildBackgroundCopyDeclarations(background, {
        base: surface,
        image: fill,
        soft: true,
        tint: composerSurface,
      })
    ),
  ].join('\n\n');
  return `@media not (prefers-reduced-transparency: reduce) {\n${css}\n}`;
}

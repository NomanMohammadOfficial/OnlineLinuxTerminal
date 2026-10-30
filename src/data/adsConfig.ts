/**
 * Central advertising configuration.
 *
 * The site is monetised with the Yandex Advertising Network (YAN / РСЯ).
 *
 * By default we use Yandex *Automatic Placement* (автоматическое размещение):
 * only the `pageId` from the Yandex Partner dashboard is required and Yandex
 * injects ad units itself at positions it considers non-intrusive. This is the
 * mode that works with the page-id we already have and needs no extra setup.
 *
 * If you want full control over where an ad appears, create an RTB block in the
 * Yandex dashboard (its id looks like `R-A-1234567-1`), set `placement` to
 * `'manual'` and fill `manualBlocks` below. The <YandexAd /> component will then
 * render those blocks at the exact slot positions instead of Yandex auto-filling.
 *
 * UX guard-rail: ad scripts are never loaded on the dedicated full-screen
 * `/terminal` workspace or on legal/compliance pages (see `excludePaths`).
 */

export const YANDEX_AD_SLOTS = ['top', 'in-article', 'bottom'] as const;
export type YandexAdSlotKey = (typeof YANDEX_AD_SLOTS)[number];

export interface YandexAdsConfig {
  /** Yandex Partner "automatic placement" page id (data-page-id). */
  pageId: string;
  /** `auto` = Yandex autoplacement, `manual` = explicit RTB blocks below. */
  placement: 'auto' | 'manual';
  /** RTB block ids per slot (only used when `placement === 'manual'`). */
  manualBlocks: Record<YandexAdSlotKey, string>;
  /** Paths (locale-stripped) that must never load ad scripts. */
  excludePaths: string[];
}

export interface AntiAdblockConfig {
  /** Master switch for anti-adblock detection modal. */
  enabled: boolean;
  /** Log detection scores and signals to console. */
  debug: boolean;
}

export const ADS_CONFIG: {
  enabled: boolean;
  antiAdblock: AntiAdblockConfig;
  yandex: YandexAdsConfig;
} = {
  enabled: true,
  antiAdblock: {
    enabled: true,
    debug: false,
  },
  yandex: {
    pageId: '19789036',
    placement: 'auto',
    manualBlocks: {
      top: '',
      'in-article': '',
      bottom: '',
    },
    // Keep the interactive workspace and compliance pages 100% ad-free so the
    // terminal UX and Yandex policy review are never compromised.
    excludePaths: [
      '/terminal',
      '/privacy',
      '/disclaimer',
      '/terms',
      '/cookies',
      '/editorial-guidelines',
      '/dmca',
    ],
  },
};

/** Strip locale prefix and trailing slashes so rules match every language. */
const normalizePath = (pathname: string): string => {
  const clean = (pathname || '/').replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
};

export function isManualPlacement(): boolean {
  return ADS_CONFIG.enabled && ADS_CONFIG.yandex.placement === 'manual';
}

export function getYandexManualBlock(slot: YandexAdSlotKey): string | undefined {
  return ADS_CONFIG.yandex.manualBlocks[slot]?.trim() || undefined;
}

/** Whether Yandex ad scripts should be injected for the given clean path. */
export function shouldLoadYandexAds(pathname: string): boolean {
  if (!ADS_CONFIG.enabled || !ADS_CONFIG.yandex.pageId) return false;
  const path = normalizePath(pathname);
  return !ADS_CONFIG.yandex.excludePaths.some(
    (excluded) => path === excluded || path.startsWith(excluded + '/')
  );
}

/** Whether anti-adblock detection should run for the given clean path. */
export function shouldShowAntiAdblock(pathname: string): boolean {
  if (!ADS_CONFIG.enabled || !ADS_CONFIG.antiAdblock.enabled) return false;
  return shouldLoadYandexAds(pathname);
}

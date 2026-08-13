import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const screenshotDir = path.join(process.cwd(), 'artifacts', 'pm-execution-screenshots');
const publicRoutes = ['/', '/login', '/signup', '/server-down', '/start-server'];
const extraRoutes = (process.env.E2E_EXTRA_CONTRAST_ROUTES || '')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);
const routesToCheck = Array.from(new Set([...publicRoutes, ...extraRoutes]));

async function setTheme(page: any, theme: 'light' | 'dark') {
  await page.addInitScript((value: 'light' | 'dark') => {
    window.localStorage.setItem('theme', value);
  }, theme);
}

async function attachAxeResults(testInfo: any, name: string, results: unknown) {
  await testInfo.attach(name, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
}

async function getLowContrastFormControls(page: any) {
  return page.evaluate(() => {
    const parseColor = (value: string): [number, number, number, number] | null => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(',').map((part) => part.trim());
      const r = Number(parts[0]);
      const g = Number(parts[1]);
      const b = Number(parts[2]);
      const a = parts[3] === undefined ? 1 : Number(parts[3]);
      if ([r, g, b, a].some((part) => Number.isNaN(part))) return null;
      return [r, g, b, a];
    };

    const blend = (
      fg: [number, number, number, number],
      bg: [number, number, number, number]
    ): [number, number, number, number] => {
      const alpha = fg[3] + bg[3] * (1 - fg[3]);
      if (alpha === 0) return [255, 255, 255, 1];
      return [
        (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / alpha,
        (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / alpha,
        (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / alpha,
        alpha,
      ];
    };

    const luminance = ([r, g, b]: [number, number, number, number]) => {
      const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : Math.pow((normalized + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const contrastRatio = (
      fg: [number, number, number, number],
      bg: [number, number, number, number]
    ) => {
      const fgLum = luminance(fg);
      const bgLum = luminance(bg);
      const lighter = Math.max(fgLum, bgLum);
      const darker = Math.min(fgLum, bgLum);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const effectiveBackground = (element: Element): [number, number, number, number] => {
      let current: Element | null = element;
      let color: [number, number, number, number] = [255, 255, 255, 1];
      const layers: [number, number, number, number][] = [];

      while (current) {
        const parsed = parseColor(window.getComputedStyle(current).backgroundColor);
        if (parsed && parsed[3] > 0) layers.push(parsed);
        current = current.parentElement;
      }

      for (let index = layers.length - 1; index >= 0; index -= 1) {
        color = blend(layers[index], color);
      }
      return color;
    };

    const selector = [
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]):not([type="color"])',
      'textarea',
      'select',
      '[contenteditable="true"]',
    ].join(',');

    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          style.opacity !== '0' &&
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-hidden') !== 'true'
        );
      })
      .map((element) => {
        const style = window.getComputedStyle(element);
        const fg = parseColor(style.color) || [0, 0, 0, 1];
        const bg = effectiveBackground(element);
        const ratio = contrastRatio(fg, bg);
        return {
          tag: element.tagName.toLowerCase(),
          type: element.getAttribute('type') || '',
          name: element.getAttribute('name') || '',
          placeholder: element.getAttribute('placeholder') || '',
          className: element.getAttribute('class') || '',
          color: style.color,
          backgroundColor: style.backgroundColor,
          effectiveBackground: `rgb(${Math.round(bg[0])}, ${Math.round(bg[1])}, ${Math.round(bg[2])})`,
          ratio: Number(ratio.toFixed(2)),
        };
      })
      .filter((result) => result.ratio < 4.5);
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const route of routesToCheck) {
    const routeLabel = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');

    test(`public UI has sufficient computed contrast in ${theme} mode on ${routeLabel}`, async ({ page, browserName }, testInfo) => {
      test.skip(browserName !== 'chromium', 'Computed contrast guardrails run once in Chromium; flow tests cover all browsers.');
      test.setTimeout(45_000);
      await setTheme(page, theme);
      await fs.mkdir(screenshotDir, { recursive: true });

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => undefined);

      if (route === '/login' || route === '/signup') {
        await expect(page.locator('form').first()).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
      }

      const htmlClass = (await page.locator('html').getAttribute('class')) || '';
      if (theme === 'dark') {
        expect(htmlClass).toContain('dark');
      } else {
        expect(htmlClass).not.toContain('dark');
      }

      const contrastResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();
      await attachAxeResults(
        testInfo,
        `axe-color-contrast-${theme}-${routeLabel}.json`,
        contrastResults
      );
      expect(contrastResults.violations).toEqual([]);

      const lowContrastControls = await getLowContrastFormControls(page);
      await attachAxeResults(
        testInfo,
        `form-control-contrast-${theme}-${routeLabel}.json`,
        lowContrastControls
      );
      expect(lowContrastControls).toEqual([]);

      await page.screenshot({
        path: path.join(screenshotDir, `${routeLabel}-${theme}.png`),
        fullPage: true,
      });
    });
  }
}

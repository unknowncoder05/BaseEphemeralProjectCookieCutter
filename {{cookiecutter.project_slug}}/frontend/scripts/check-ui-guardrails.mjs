import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const allowedColorFiles = [
  `${path.sep}theme${path.sep}`,
  `${path.sep}context${path.sep}ThemeContext`,
  `${path.sep}index.css`,
  `${path.sep}App.css`,
];
const ignoredFragments = [
  `${path.sep}i18n${path.sep}`,
  `${path.sep}locales${path.sep}`,
  `${path.sep}pages${path.sep}debug${path.sep}`,
  '.test.',
  '.spec.',
  `${path.sep}e2e${path.sep}`,
  `${path.sep}scripts${path.sep}`,
  'reportWebVitals',
  'react-app-env.d.ts',
];
const genericQualityIgnoredFragments = [
  `${path.sep}components${path.sep}shared${path.sep}`,
  `${path.sep}pages${path.sep}ServerStartPage`,
  `${path.sep}pages${path.sep}ServerDown`,
  `${path.sep}pages${path.sep}NotFoundPage`,
];
const filePattern = /\.(tsx|ts|jsx|js|css)$/;
const colorPattern = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\(|hsla?\(/g;
const literalTextPattern = />\s*([A-Za-z][^<{}`]{2,})\s*</g;
const allowedTextSnippets = ['http://', 'https://'];
const classNamePattern = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|{`([^`]*)`})/g;
const brightSurfacePattern = /(?:^|\s)(bg-white(?:\/(?:4\d|5\d|6\d|7\d|8\d|9\d|100))?|bg-(?:stone|neutral|zinc|slate|gray)-(?:50|100|200)(?:\/\d+)?)(?=\s|$)/;
const genericGradientPattern = /\bbg-gradient-to-(?:r|l|t|b|tr|tl|br|bl)\b/;
const oversizedRoundPattern = /\brounded-(?:3xl|4xl|\[2rem\]|\[2\.5rem\]|\[3rem\])\b/;
const heavyShadowPattern = /\bshadow-(?:xl|2xl|\[[^\]]+\])\b/;
const numberedFeatureTripletPattern = /\b(?:icon|label)\s*:\s*['"]0[123]['"]/g;
const genericFeatureKeyPattern = /\bkey\s*:\s*['"](?:fast|secure|simple|powerful|modern|smart|supported|collaborative|analytics|realtime)['"]/g;
const templateMetadataPattern = /(?:Web site created using create-react-app|\{\{\s*cookiecutter\.project_name\s*\}\}|React App)/i;
const intentionalQualityExceptionPattern = /data-ui-quality\s*=\s*(?:"(?:intentional-gradient|hero-art-direction|brand-showcase)"|'(?:intentional-gradient|hero-art-direction|brand-showcase)'|{\s*"(?:intentional-gradient|hero-art-direction|brand-showcase)"\s*}|{\s*'(?:intentional-gradient|hero-art-direction|brand-showcase)'\s*})/;
const semanticContrastTokenPattern = /\b(?:pm-surface-(?:page|panel|muted|inset)|pm-text(?:-(?:strong|muted|soft|inverse))?)\b/;
const contrastSensitiveBackgroundPattern = /^bg-(white|black|primary|secondary|success|danger|warning|info|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-(\d{2,3}))?(?:\/\d+)?$/;
const contrastSensitiveTextPattern = /^text-(white|black|primary|secondary|success|danger|warning|info|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-(\d{2,3}))?(?:\/\d+)?$/;
const darkVariantPattern = /^dark:(.+)$/;
const largeSurfaceTagPattern = /^(div|section|article|aside|main|form|dialog)$/;
const explicitExceptionPattern = /data-theme-exception\s*=\s*(?:"inverted-surface"|'inverted-surface'|{\s*"inverted-surface"\s*}|{\s*'inverted-surface'\s*})/;
const smallControlClassPattern = /\b(?:inline-flex|inline-block|btn|button|badge|chip|pill|tab|toggle|icon-button|text-(?:xs|sm)|px-[123]\b|py-(?:0(?:\.5)?|1(?:\.5)?|2)\b|h-(?:6|7|8|9|10)\b|min-h-(?:6|7|8|9|10)\b)\b/;
const largeSurfaceClassPattern = /\b(?:rounded-\[|rounded-(?:xl|2xl|3xl|4xl)|shadow(?:-[a-z]+)?|backdrop-blur|border|p-[45689]\b|p-10\b|px-[45689]\b|px-10\b|py-[45689]\b|py-10\b|min-h-|w-full\b|max-w-|grid\b|flex\b|space-y-|gap-[34]|overflow-hidden\b)\b/;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return [fullPath];
  }));
  return nested.flat();
}

function shouldIgnore(filePath) {
  return ignoredFragments.some((fragment) => filePath.includes(fragment));
}

function shouldIgnoreGenericQuality(filePath) {
  return genericQualityIgnoredFragments.some((fragment) => filePath.includes(fragment));
}

function allowsColorLiterals(filePath) {
  return allowedColorFiles.some((fragment) => filePath.includes(fragment));
}

function formatIssue(filePath, lineNumber, message) {
  return `${path.relative(root, filePath)}:${lineNumber} ${message}`;
}

function lineNumberAt(raw, index) {
  return raw.slice(0, index).split('\n').length;
}

function nearestTagBefore(raw, index) {
  const start = raw.lastIndexOf('<', index);
  if (start === -1) return null;
  const snippet = raw.slice(start, index);
  const match = snippet.match(/<([A-Za-z][\w.]*)[^>]*$/);
  return match ? match[1] : null;
}

function hasExplicitSurfaceException(context) {
  return explicitExceptionPattern.test(context);
}

function hasIntentionalQualityException(context) {
  return intentionalQualityExceptionPattern.test(context);
}

function isLikelySmallControl(tag, classValue, context) {
  if (tag === 'button') return true;
  if (smallControlClassPattern.test(classValue)) return true;
  if (/data-ui-surface\s*=\s*(?:"(?:button|badge|chip|pill|tab|toggle)"|'(?:button|badge|chip|pill|tab|toggle)'|{\s*"(?:button|badge|chip|pill|tab|toggle)"\s*}|{\s*'(?:button|badge|chip|pill|tab|toggle)'\s*})/.test(context)) {
    return true;
  }
  return false;
}

function isLikelyLargeSurface(tag, classValue, context) {
  if (tag && largeSurfaceTagPattern.test(tag)) return true;
  if (largeSurfaceClassPattern.test(classValue)) return true;
  if (/data-ui-surface\s*=\s*(?:"(?:page|section|panel|card|modal|table|form)"|'(?:page|section|panel|card|modal|table|form)'|{\s*"(?:page|section|panel|card|modal|table|form)"\s*}|{\s*'(?:page|section|panel|card|modal|table|form)'\s*})/.test(context)) {
    return true;
  }
  return false;
}

function toneForBackground(color, shade) {
  if (color === 'white') return 'light';
  if (color === 'black') return 'dark';
  if (!shade) return null;
  const value = Number(shade);
  if (value <= 200) return 'light';
  if (value >= 700) return 'dark';
  return 'mid';
}

function toneForText(color, shade) {
  if (color === 'white') return 'light';
  if (color === 'black') return 'dark';
  if (!shade) return null;
  const value = Number(shade);
  if (value <= 300) return 'light';
  if (value >= 600) return 'dark';
  return 'mid';
}

function splitThemeClass(token) {
  const darkMatch = token.match(darkVariantPattern);
  if (darkMatch) {
    return { mode: 'dark', className: darkMatch[1] };
  }
  return { mode: 'light', className: token };
}

function collectContrastTokens(classValue) {
  const tokensByMode = {
    light: { backgrounds: [], texts: [] },
    dark: { backgrounds: [], texts: [] },
  };

  classValue.split(/\s+/).filter(Boolean).forEach((token) => {
    const { mode, className } = splitThemeClass(token);
    const bgMatch = className.match(contrastSensitiveBackgroundPattern);
    if (bgMatch) {
      tokensByMode[mode].backgrounds.push({ token, color: bgMatch[1], shade: bgMatch[2] });
      return;
    }

    const textMatch = className.match(contrastSensitiveTextPattern);
    if (textMatch) {
      tokensByMode[mode].texts.push({ token, color: textMatch[1], shade: textMatch[2] });
    }
  });

  return tokensByMode;
}

function hasDarkBackgroundVariant(classValue) {
  const tokensByMode = collectContrastTokens(classValue);
  return tokensByMode.dark.backgrounds.length > 0;
}

function findLowContrastPairs(classValue) {
  if (semanticContrastTokenPattern.test(classValue)) {
    return [];
  }

  const tokensByMode = collectContrastTokens(classValue);
  const issues = [];

  for (const mode of ['light', 'dark']) {
    for (const background of tokensByMode[mode].backgrounds) {
      const backgroundTone = toneForBackground(background.color, background.shade);
      if (!backgroundTone || backgroundTone === 'mid') {
        continue;
      }

      for (const text of tokensByMode[mode].texts) {
        const textTone = toneForText(text.color, text.shade);
        if (!textTone || textTone === 'mid') {
          continue;
        }
        if (backgroundTone === textTone) {
          issues.push(`${mode} ${background.token} with ${text.token}`);
        }
      }
    }
  }

  return issues;
}

async function main() {
  const files = (await walk(srcDir)).filter((filePath) => filePattern.test(filePath));
  const issues = [];

  for (const metadataPath of [
    path.join(root, 'public', 'index.html'),
    path.join(root, 'public', 'manifest.json'),
  ]) {
    try {
      const raw = await fs.readFile(metadataPath, 'utf8');
      raw.split('\n').forEach((line, index) => {
        if (templateMetadataPattern.test(line)) {
          issues.push(formatIssue(metadataPath, index + 1, 'template/default public metadata; replace with product-specific title, description, and manifest naming'));
        }
      });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  for (const filePath of files) {
    if (shouldIgnore(filePath)) {
      continue;
    }

    const raw = await fs.readFile(filePath, 'utf8');
    const lines = raw.split('\n');

    if (!allowsColorLiterals(filePath)) {
      lines.forEach((line, index) => {
        if (colorPattern.test(line)) {
          issues.push(formatIssue(filePath, index + 1, 'hard-coded color literal; route colors through theme tokens or CSS variables'));
        }
        colorPattern.lastIndex = 0;
      });
    }

    if (/\.(tsx|jsx)$/.test(filePath)) {
      const enforceGenericQuality = !shouldIgnoreGenericQuality(filePath);
      if (enforceGenericQuality) {
        const numberedFeatureTriplets = [...raw.matchAll(numberedFeatureTripletPattern)];
        if (numberedFeatureTriplets.length >= 3) {
          issues.push(
            formatIssue(
              filePath,
              lineNumberAt(raw, numberedFeatureTriplets[0].index ?? 0),
              'generic numbered feature triplet; use product-specific signals, workflow states, real domain objects, or an explicit visual system instead of 01/02/03 cards'
            )
          );
        }

        const genericFeatureKeys = [...raw.matchAll(genericFeatureKeyPattern)];
        if (genericFeatureKeys.length >= 3) {
          issues.push(
            formatIssue(
              filePath,
              lineNumberAt(raw, genericFeatureKeys[0].index ?? 0),
              'generic feature key cluster; replace template feature labels with domain-specific concepts that describe this product and its users'
            )
          );
        }
      }

      lines.forEach((line, index) => {
        const matches = [...line.matchAll(literalTextPattern)];
        for (const match of matches) {
          const text = (match[1] || '').trim();
          if (!text) {
            continue;
          }
          if (allowedTextSnippets.some((snippet) => text.includes(snippet))) {
            continue;
          }
          if (text.includes('t(') || text.includes('{') || text.includes('}')) {
            continue;
          }
          issues.push(formatIssue(filePath, index + 1, `hard-coded JSX text "${text}"`));
        }
      });

      for (const match of raw.matchAll(classNamePattern)) {
        const classValue = match[1] || match[2] || match[3] || '';
        const matchIndex = match.index ?? 0;
        const contextStart = Math.max(0, matchIndex - 220);
        const contextEnd = Math.min(raw.length, matchIndex + match[0].length + 220);
        const context = raw.slice(contextStart, contextEnd);
        const tag = nearestTagBefore(raw, matchIndex);

        if (
          enforceGenericQuality
          && genericGradientPattern.test(classValue)
          && isLikelyLargeSurface(tag, classValue, context)
          && !hasIntentionalQualityException(context)
        ) {
          issues.push(
            formatIssue(
              filePath,
              lineNumberAt(raw, matchIndex),
              'generic gradient on a large surface; use product-specific media, data, layout, or mark a deliberate art direction with data-ui-quality="intentional-gradient"'
            )
          );
        }

        if (
          enforceGenericQuality
          && (oversizedRoundPattern.test(classValue) || heavyShadowPattern.test(classValue))
          && isLikelyLargeSurface(tag, classValue, context)
          && !hasIntentionalQualityException(context)
        ) {
          issues.push(
            formatIssue(
              filePath,
              lineNumberAt(raw, matchIndex),
              'AI-default large rounded/shadowed surface; prefer flatter domain-specific composition or mark an intentional brand showcase with data-ui-quality="brand-showcase"'
            )
          );
        }

        const lowContrastPairs = findLowContrastPairs(classValue);
        if (lowContrastPairs.length > 0) {
          issues.push(
            formatIssue(
              filePath,
              lineNumberAt(raw, match.index ?? 0),
              `likely low-contrast class pairing (${lowContrastPairs.join(', ')}); use pm-surface-* with pm-text-* utilities or a verified light/dark pair`
            )
          );
        }

        if (!brightSurfacePattern.test(classValue)) {
          continue;
        }
        brightSurfacePattern.lastIndex = 0;
        if (hasDarkBackgroundVariant(classValue)) {
          continue;
        }

        if (hasExplicitSurfaceException(context)) {
          continue;
        }

        if (isLikelySmallControl(tag, classValue, context)) {
          continue;
        }
        if (!isLikelyLargeSurface(tag, classValue, context)) {
          continue;
        }

        issues.push(
          formatIssue(
            filePath,
            lineNumberAt(raw, matchIndex),
            'bright background utility on a likely large surface; use theme-safe surface tokens/primitives or mark an intentional exception with data-theme-exception="inverted-surface"'
          )
        );
      }
    }
  }

  if (issues.length > 0) {
    console.error('UI guardrail violations found:\n');
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  console.log('UI guardrails passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

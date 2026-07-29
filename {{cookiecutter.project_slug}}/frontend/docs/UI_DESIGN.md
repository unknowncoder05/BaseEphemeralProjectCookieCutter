# UI Design Guardrails

## Contrast-safe surfaces

Use the generated semantic utilities for normal application UI:

- `pm-surface-page` for page shells.
- `pm-surface-panel` for cards, modals, tables, sidebars, and forms.
- `pm-surface-muted` for secondary panels, list rows, inputs, and quiet controls.
- `pm-surface-inset` for selected rows, nested fields, and contained highlights.
- `pm-text-strong`, `pm-text`, `pm-text-muted`, and `pm-text-soft` for text placed on those surfaces.

These utilities are backed by CSS variables in `src/index.css` and switch with the `.dark` class. Prefer them over hand-pairing `bg-*` and `text-*` classes.

## Brand and status colors

Use brand or status colors for accents, small badges, icons, focus rings, and primary actions. Do not use a color scale as both the text and the large surface unless the light and dark mode contrast has been verified.

Safe examples:

- `bg-primary-600 text-white`
- `bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300`
- `pm-surface-panel pm-text`

Risky examples:

- `bg-primary-100 text-primary-200`
- `dark:bg-secondary-900 dark:text-secondary-800`
- `bg-white text-secondary-100`

## Required checks

Run `npm run ui:guardrails` before completing frontend work. It blocks raw color literals, likely large bright surfaces in dark mode, hard-coded JSX copy, and common low-contrast `bg-*` plus `text-*` class pairings.

## Product-specific composition

The guardrail also blocks common generic AI/template UI patterns. A generated app should not ship with:

- unchanged Create React App or cookiecutter metadata in `public/index.html` or `public/manifest.json`;
- gradient hero sections as the default first impression;
- numbered `01 / 02 / 03` feature-card triplets;
- clusters of generic feature keys such as `fast`, `secure`, `simple`, `modern`, or `smart`;
- large rounded `3xl/4xl` panels or heavy `xl/2xl` shadow stacks used as the main visual system.

Replace those patterns with domain-specific composition. The first viewport should expose the product's actual object, workflow state, operational queue, map, editor, intake, marketplace, report, or other core decision surface. If the product truly needs a gradient or large showcase treatment, add an explicit marker such as `data-ui-quality="intentional-gradient"` or `data-ui-quality="brand-showcase"` on the relevant element and document why that choice is part of the product's visual direction in this file.

Run `npm run test:contrast` for the reliable rendered check. It uses Playwright and axe-core's `color-contrast` rule on public pages in light and dark mode, then runs a computed-style scan over visible `input`, `textarea`, `select`, and `contenteditable` controls. The computed scan catches cases axe can miss, such as white input text on a white or transparent input background.

Add product-specific workflow routes with `E2E_EXTRA_CONTRAST_ROUTES=/assessment,/settings npm run test:contrast`. Use this for the main authenticated or demo flow before shipping.

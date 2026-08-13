# UI Design

This file describes the visual and interaction contract for the Base Ephemeral template UI.

## View or Component: HomePage
- Purpose: public landing page that introduces the starter app and funnels users into auth or dashboard.
- Location: `frontend/src/pages/HomePage.tsx`
- Layout structure: slim top header, centered hero, feature grid beneath.
- Visual style: airy spacing, rounded buttons, neutral background with primary accent CTAs.
- States: authenticated variant swaps auth CTAs for a dashboard CTA.
- Interactions: theme toggle, auth navigation, dashboard navigation.
- Responsive behavior: header compresses actions horizontally; feature grid collapses down to single-column.
- Accessibility notes: icon buttons require labels; CTA hierarchy should remain obvious.
- Reuse constraints: keep this page marketing-oriented and lighter than authenticated screens.
- Last updated: 2026-05-03

## View or Component: AuthPage
- Purpose: route wrapper that switches between login and signup experiences.
- Location: `frontend/src/pages/AuthPage.tsx`
- Layout structure: delegates full rendering to `LoginForm` or `SignUpForm`.
- Visual style: form-centric and distraction-free.
- States: login mode, signup mode.
- Interactions: pathname changes determine which form renders.
- Responsive behavior: inherited from the child auth forms.
- Accessibility notes: form headings and switch links must remain explicit.
- Reuse constraints: do not add mixed multi-step auth content here; keep it a clean switcher.
- Last updated: 2026-05-03

## View or Component: Dashboard
- Purpose: authenticated welcome surface with quick links into the app.
- Location: `frontend/src/pages/Dashboard.tsx`
- Layout structure: shared navbar, breadcrumbs, centered hero block, three-column-capable feature grid.
- Visual style: white cards on neutral background, small badge above a large heading.
- States: standard authenticated view only.
- Interactions: CTA buttons route to items and settings.
- Responsive behavior: hero stays centered; feature cards collapse from 3 to 1 column.
- Accessibility notes: CTA buttons should stay keyboard-accessible and clearly labeled.
- Reuse constraints: do not overload with dense tables or sidebars; this view is intentionally simple.
- Last updated: 2026-05-03

## View or Component: ItemsPage
- Purpose: removable scaffold showing item list, item detail, create, and edit modes. This is an example implementation pattern, not a product-specific surface.
- Location: `frontend/src/pages/ItemsPage.tsx`
- Layout structure: shared navbar/breadcrumbs, then route-driven content block that swaps by mode.
- Visual style: card-based CRUD layout with gentle borders, skeleton loaders, and inline action bars.
- States: list, create, edit, detail, loading, missing item.
- Interactions: create, view, edit, archive, activate, delete, back.
- Responsive behavior: list grid and action groups wrap on small screens.
- Accessibility notes: destructive actions rely on explicit confirmation dialogs.
- Reuse constraints: remove, rename, or replace this page when the product domain is defined; do not preserve visible `Items` navigation in generated apps unless the user explicitly asks for a generic item manager.
- Last updated: 2026-05-03

## View or Component: SettingsPage
- Purpose: account and integration management, especially GitHub OAuth connection.
- Location: `frontend/src/pages/SettingsPage.tsx`
- Layout structure: lightweight page header with back button, breadcrumbs, stacked settings cards.
- Visual style: segmented cards with labeled sections and strong button affordances for connect/disconnect.
- States: connected, disconnected, connecting, disconnecting, callback-processing.
- Interactions: back navigation, OAuth connect, OAuth disconnect.
- Responsive behavior: stacked card layout remains single-column and readable on mobile.
- Accessibility notes: external auth actions need clear status feedback and focusable controls.
- Reuse constraints: keep third-party integration controls inside section cards, not inline in navbar menus.
- Last updated: 2026-05-03

## View or Component: ServerStartPage
- Purpose: communicate sleeping/on-demand backend state and guide recovery.
- Location: `frontend/src/pages/ServerStartPage.tsx`
- Layout structure: centered operational status panel.
- Visual style: full-screen utility state with concise explanation and a primary recovery action.
- States: waiting to start, starting, recoverable failure.
- Interactions: start/wake backend flow.
- Responsive behavior: single centered column.
- Accessibility notes: keep status messaging legible and action button obvious.
- Reuse constraints: this is an operational screen, not a generic empty state.
- Last updated: 2026-05-03

## View or Component: ServerDown
- Purpose: communicate server error with retry and fallback navigation.
- Location: `frontend/src/pages/ServerDown.tsx`
- Layout structure: centered alert card with stacked actions.
- Visual style: caution icon, high-contrast headline, primary retry plus secondary home button.
- States: server unavailable.
- Interactions: retry by full reload, go home by client navigation.
- Responsive behavior: fixed-width centered card that fills narrow viewports gracefully.
- Accessibility notes: action order should favor retry first.
- Reuse constraints: preserve the operational-error tone and avoid marketing copy here.
- Last updated: 2026-05-03

## View or Component: NotFoundPage
- Purpose: unmatched-route fallback.
- Location: `frontend/src/pages/NotFoundPage.tsx`
- Layout structure: centered 404 card with one action.
- Visual style: calm empty-state treatment with icon, title, body, and single CTA.
- States: 404 only.
- Interactions: return home.
- Responsive behavior: narrow centered column.
- Accessibility notes: maintain semantic heading and obvious escape route.
- Reuse constraints: keep this simpler than operational-error pages.
- Last updated: 2026-05-03

## View or Component: ItemList
- Purpose: list and filter all items before deeper CRUD actions.
- Location: `frontend/src/components/items/ItemList.tsx`
- Layout structure: page header row, optional error banner, status filter bar, responsive card grid.
- Visual style: neutral cards with primary create CTA and restrained filter controls.
- States: initial skeleton load, populated list, filtered list, empty state, error state.
- Interactions: filter by status, create item, item card actions.
- Responsive behavior: header stacks on small screens; grid shifts from 3 to 1 columns.
- Accessibility notes: filter label and error dismissal must stay keyboard reachable.
- Reuse constraints: keep action density moderate so cards remain scannable.
- Last updated: 2026-05-03

## View or Component: ItemCard
- Purpose: summary card for one item plus lifecycle actions.
- Location: `frontend/src/components/items/ItemCard.tsx`
- Layout structure: title/status row, metadata block, action row.
- Visual style: compact card, bold title, colored status badge, small action buttons.
- States: draft, active, archived.
- Interactions: view, archive, activate, delete.
- Responsive behavior: action buttons wrap instead of shrinking unreadably.
- Accessibility notes: action labels should stay textual, not icon-only.
- Reuse constraints: card actions should remain shallow and not expand inline details.
- Last updated: 2026-05-03

## View or Component: ItemForm
- Purpose: shared create/edit form for items.
- Location: `frontend/src/components/items/ItemForm.tsx`
- Layout structure: heading, error block, vertical fields, footer actions.
- Visual style: straightforward form layout with inline validation and standard inputs.
- States: create, edit, loading submit, validation error, API error.
- Interactions: submit, cancel, field editing.
- Responsive behavior: single-column form.
- Accessibility notes: required fields and errors should remain explicit.
- Reuse constraints: keep the form simple enough to fit inline inside `ItemsPage`.
- Last updated: 2026-05-03

## View or Component: Navbar
- Purpose: authenticated/global navigation shell used by major pages.
- Location: `frontend/src/components/shared/Navbar.tsx`
- Layout structure: brand area, nav links, utility actions.
- Visual style: compact top navigation with theme-aware surfaces.
- States: authenticated vs anonymous variants where applicable.
- Interactions: navigation, language switching, theme toggle, user actions.
- Responsive behavior: collapses utility density before content density.
- Accessibility notes: menus need focus handling and clear labels.
- Reuse constraints: keep nav height stable across pages.
- Last updated: 2026-05-03

## View or Component: Breadcrumbs
- Purpose: lightweight route context under the navbar.
- Location: `frontend/src/components/shared/Breadcrumbs.tsx`
- Layout structure: horizontal crumb trail above page content.
- Visual style: subtle, low-contrast secondary text.
- States: hidden/minimal on shallow routes depending on implementation.
- Interactions: optional route backtracking links.
- Responsive behavior: allow wrapping rather than truncating key labels aggressively.
- Accessibility notes: should expose breadcrumb semantics.
- Reuse constraints: breadcrumbs supplement, not replace, page headings.
- Last updated: 2026-05-03

## View or Component: Shared Foundation
- Purpose: shared primitives for visual consistency across the template.
- Location:
  - `frontend/src/components/shared/Button.tsx`
  - `frontend/src/components/shared/Card.tsx`
  - `frontend/src/components/shared/Badge.tsx`
  - `frontend/src/components/shared/Input.tsx`
  - `frontend/src/components/shared/Modal.tsx`
  - `frontend/src/components/shared/EmptyState.tsx`
  - `frontend/src/components/shared/Loading.tsx`
  - `frontend/src/components/shared/Skeleton.tsx`
  - `frontend/src/components/shared/Sidebar.tsx`
  - `frontend/src/components/shared/SmartImage.tsx`
  - `frontend/src/components/shared/CommandPalette.tsx`
  - `frontend/src/components/shared/ThemeInitializer.tsx`
- Layout structure: primitives rather than full views.
- Visual style: rounded corners, soft borders, primary-accent action language, dark-mode compatibility.
- States: variant-based per primitive.
- Interactions: depend on primitive role.
- Responsive behavior: primitives should adapt without page-specific hacks.
- Accessibility notes: primitives are the baseline for accessible patterns across the app.
- Reuse constraints: extend variants carefully instead of forking one-off local versions.
- Last updated: 2026-05-03

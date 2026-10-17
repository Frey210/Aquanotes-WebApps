---
name: Aquanotes
description: Blue Aquanotes–Aerasea identity for a precise, readable aquaculture workspace.
colors:
  navy: "#074590"
  primary: "#147fe2"
  primary-hover: "#0d6fc9"
  cyan: "#26a9e0"
  sidebar: "#063a78"
  sidebar-text: "#c6daef"
  text: "#102033"
  muted: "#506176"
  border: "#d9e3ed"
  page: "#f4f7fb"
  surface: "#fff"
  surface-muted: "#eef3f8"
  selected: "#edf6ff"
  selected-border: "#9ec9ee"
  online: "#087d78"
  stale: "#9a5800"
  offline: "#b42318"
  maintenance: "#5b4db7"
  online-tint: "#e1f5f1"
  stale-tint: "#fff2d8"
  offline-tint: "#ffebe9"
  maintenance-tint: "#efedff"
  chart-user: "#198AFF"
  sensor-selected: "#0b65bd"
  sensor-border: "#dae7f2"
  sensor-unavailable: "#eef2f6"
  ring-online: "#65ded2"
  ring-late: "#ffd17c"
  ring-offline: "#ffa89e"
  ring-unknown: "#96b8dc"
  activity-blue: "#e6f2ff"
  activity-amber: "#fff5e3"
  activity-violet: "#efedff"
  activity-slate: "#eaf0f6"
typography:
  headline:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.12rem"
  body:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: ".85rem"
    lineHeight: 1.55
  label:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: ".72rem"
    fontWeight: 600
  reading:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.35rem"
    fontWeight: 650
    letterSpacing: "-.02em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  navigation: "8px"
  monitoring: "12px"
  feature: "16px"
  pill: "999px"
spacing:
  control-gap: "8px"
  compact: "12px"
  detail: "16px"
  workspace: "20px"
  page-block: "24px"
  page-inline: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "9px 15px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "#183a61"
    rounded: "{rounded.md}"
    padding: "9px 15px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  navigation-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.navigation}"
    padding: "10px 12px"
  status-online:
    backgroundColor: "{colors.online-tint}"
    textColor: "{colors.online}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  sensor-choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.monitoring}"
    padding: "13px"
  sensor-choice-selected:
    backgroundColor: "{colors.sensor-selected}"
    textColor: "{colors.surface}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "22px"
---

# Design System: Aquanotes

## Overview

**Creative North Star: "Clean Aquaculture Operations"**

Aquanotes uses its established blue identity as the stable frame around a light, precise workspace. White surfaces, navy text, soft activity tiles, duotone icons, and tabular readings keep operational information easy to scan without overloading mobile screens. Aquanotes is the primary product identity; Aerasea remains a smaller endorsement using official assets.

This is an extraction of the implemented system, not a replacement style proposal. The normative values above reflect `src/styles.css` and the current shell and monitoring components. `design_gudie.md` remains a historical direction document; where it differs, this code-derived specification describes the current implementation. Route-specific composition belongs in `.impeccable/surfaces/monitoring.md` and `.impeccable/surfaces/overview.md`.

**Key Characteristics:**

- Blue navigation frame with soft tiles and restrained depth.
- Compact labels, explicit state text, and tabular sensor values.
- Purposeful page, drawer, and chart transitions with visible keyboard focus.

## Colors

### Primary

Navy anchors brand and emphasis; primary blue identifies actions and active navigation. The selected tint and selected border distinguish device selection without filling the whole workspace with blue. Cyan is the supporting brand accent. Sensor selection uses a stronger blue with white content. Activity tints group shortcuts without replacing labeled status colors. Fleet rings use a categorical palette on navy with real API counts and an explicit legend. No synthesized palette ramps are normative.

The user chart currently uses the separate chart-user blue; the admin chart uses primary blue. Preserve that distinction when reproducing the current implementation rather than silently treating the colors as identical.

### Neutral

Page is the cool workspace background; surface is white; surface-muted provides tonal grouping. Text is the main reading color, muted supports metadata, and border separates containers.

### Status

Online uses teal, stale uses amber, offline uses red, and maintenance uses violet, with matching pale tints. Connectivity and operational mode are separate facts.

**The Explicit Status Rule.** Pair status color with readable status text; timestamps remain visible beside the data they qualify.

## Typography

The UI uses the Segoe UI Variable Text stack in the frontmatter, not the Inter family proposed in the historical guide. General dashboard metrics additionally use Segoe UI Variable Display with Segoe UI fallback.

Headlines identify pages; titles identify the selected device; compact labels name parameters. Readings use tabular numerals. The monitoring chart title is smaller than the device title (1rem); units sit beside values at a smaller size. On narrow screens, ordinary page headlines become (1.4rem), monitoring headlines become (1.22rem), and readings become (1.15rem). Redundant device headings are hidden while the native select retains context.

**The Honest Reading Rule.** Preserve units and local timestamps, show missing sensor-tile readings as an em dash (—) and measurement-table readings as N/A, and never turn a real zero into missing data.

## Layout

The desktop shell uses a sticky sidebar (224px), a white sticky topbar with minimum height (58px), and content capped at (1800px). Main padding is (24px 28px 36px); page sections have (20px) gaps. At viewport widths up to (1280px), the sidebar becomes (204px) and content inline padding becomes (20px). At (860px) and below, navigation becomes a drawer (248px).

All page grids use `minmax(0, 1fr)`; route, panel, and table wrappers permit shrinking with `min-width: 0`. Fix overflow at its source rather than hiding it on the body. Tables retain horizontal overflow inside their own containers.

At (860px) and below, the shell adds a four-item bottom dock, with safe-area bottom padding and matching content clearance. At (620px) and below, main padding is (20px 16px) with bottom clearance `calc(92px + env(safe-area-inset-bottom))`; page gaps become (18px).

Overview uses a connectivity graphic, activity tiles, and short priority cards instead of a wide table. Monitoring retains the navigator/detail workspace with three-column sensor tiles on smaller screens and a native device select below the desktop navigator breakpoint. Exact route compositions remain in the surface briefs.

## Elevation & Depth

General panels and primary buttons remain restrained; the topbar is opaque without blur. Separate parameter tiles replace inset separators. Chart cards use a very soft shadow, priority cards gain a small hover shadow, and activity tiles rise slightly on hover. Input focus halos, tooltips, and modal dialogs retain contextual depth.

**The Restrained Depth Rule.** Keep primary buttons and sidebar links steady; reserve gentle lift for implemented activity tiles and priority-card treatment.

Route entry and drawer movement use (260ms), chart context changes crossfade over (220ms), and fleet ring changes transition over (400ms). Chart series reveal and data updates use (750ms) ease-out. Reduced motion removes spatial transitions and series animation via Recharts' `isAnimationActive="auto"`.

## Shapes

General panels use the large radius token, fields and buttons use the medium radius, and navigation/device rows use the navigation radius. Monitoring navigator and separate sensor tiles use the monitoring radius. Chart and fleet-health containers use the feature radius. Sensor groups have transparent backgrounds and gaps rather than a shared clipped perimeter. Status badges are pill-shaped. Use one-pixel separators rather than nested decorative containers.

## Components

### Buttons

Default buttons are compact, bold, and at least (42px) high. Primary uses blue on white text; secondary uses white with a cool border; ghost is transparent until hover; danger uses a red tint. Small variants are (34px) high. Primary hover changes color without translation or scale. Disabled buttons reduce opacity and use a not-allowed cursor. Keyboard focus uses a (2px) blue outline offset by (2px).

### Inputs / Fields

Visible labels sit above standard fields. Inputs and selects are at least (44px) high with a cool border and medium corners. Hover strengthens the border; focus changes it to primary and adds a (3px) blue halo. The desktop navigator intentionally uses denser search and filter controls (40px and 36px).

### Navigation

Sidebar items combine a (20px) icon and text, minimum height (44px). Muted blue-white text becomes white on hover; active links use solid primary. Use official Aquanotes and Aerasea images without altering their proportions. Mobile adds a safe-area-aware bottom dock: Ringkasan, Monitoring, Perangkat, and Menu, each with icon and label. The drawer closes on Escape or route change; the shell provides a skip link and focuses main content after navigation.

### Status badges

Use a tinted pill with a compact icon and explicit label. Never use a colored dot alone. Monitoring freshness labels may be text-only; connectivity badges and maintenance indicators remain distinct.

### Cards / Containers

General panels use surface, a one-pixel border, and (22px) padding without shadow. Monitoring chart containers use the feature radius, a very soft shadow, and no outer padding; their internal header, plot, and optional data table own their spacing.

### Sensor choices and charts

Parameter controls are real buttons with `aria-pressed`, label, current value, unit, and reading state. Separate tiles use duotone icons and a one-pixel border. Selected controls use solid sensor-selected blue and white content; keyboard focus uses a cyan outline (3px) offset by (2px). Unavailable unselected tiles use a muted surface. Previous visible reading-state and meter rows are hidden. Charts show one parameter at a time, a local-time axis, and a native disclosure containing the numeric measurements. Use monotone-X curves with round strokes, preserve null gaps (`connectNulls=false`), and animate series entrance and data updates with reduced-motion support; wrapper context changes crossfade. Keep stale notices visible rather than implying live data.

### Fleet health, activities, and priorities

The connectivity ring uses actual API counts, a four-item text legend, the online count in its center, and a monitoring link. Activity tiles pair duotone icons, counts, and labels. Priority cards preserve device identity, state text, and last-seen context without a dense overview table. Do not substitute decorative progress or invented counts.

## Do's and Don'ts

### Do:

- Do preserve the blue Aquanotes identity and smaller Aerasea endorsement.
- Do use soft surfaces, restrained depth, and tabular sensor values.
- Do retain state labels, units, local timestamps, and keyboard focus.
- Do keep missing readings distinct from real zero values.

### Don't:

- Don't replace official logos with invented marks or distort their proportions.
- Don't add sidebar translation or primary-button scaling; keep gentle lift scoped to activity tiles.
- Don't present stale or offline readings as live telemetry.
- Don't use the historical guide's proposed font, palette, or breakpoints as if they were the shipped values.


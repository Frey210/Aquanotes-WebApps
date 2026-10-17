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
typography:
  headline:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.65rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.2rem"
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
    fontSize: "1.25rem"
    fontWeight: 650
    letterSpacing: "-.02em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  navigation: "8px"
  monitoring: "12px"
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
    padding: "14px 10px"
  sensor-choice-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.text}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "22px"
---

# Design System: Aquanotes

## Overview

**Creative North Star: "Clean Aquaculture Operations"**

Aquanotes uses its established blue identity as the stable frame around a light, precise workspace. White surfaces, navy text, quiet dividers, and tabular readings keep operational information easy to scan. Aquanotes is the primary product identity; Aerasea remains a smaller endorsement using official assets.

This is an extraction of the implemented system, not a replacement style proposal. The normative values above reflect `src/styles.css` and the current shell and monitoring components. `design_gudie.md` remains a historical direction document; where it differs, this code-derived specification describes the current implementation. Route-specific composition belongs in `.impeccable/surfaces/monitoring.md`.

**Key Characteristics:**

- Blue navigation frame with white, flat working surfaces.
- Compact labels, explicit state text, and tabular sensor values.
- Restrained interaction motion with visible keyboard focus.

## Colors

### Primary

Navy anchors brand and emphasis; primary blue identifies actions and active navigation. The selected tint and selected border distinguish device selection without filling the whole workspace with blue. Cyan is the supporting brand accent.

The user chart currently uses the separate chart-user blue; the admin chart uses primary blue. Preserve that distinction when reproducing the current implementation rather than silently treating the colors as identical.

### Neutral

Page is the cool workspace background; surface is white; surface-muted provides tonal grouping. Text is the main reading color, muted supports metadata, and border separates containers.

### Status

Online uses teal, stale uses amber, offline uses red, and maintenance uses violet, with matching pale tints. Connectivity and operational mode are separate facts.

**The Explicit Status Rule.** Pair status color with readable status text; timestamps remain visible beside the data they qualify.

## Typography

The UI uses the Segoe UI Variable Text stack in the frontmatter, not the Inter family proposed in the historical guide. General dashboard metrics additionally use Segoe UI Variable Display with Segoe UI fallback.

Headlines identify pages; titles identify the selected device; compact labels name parameters. Readings use tabular numerals. The monitoring chart title is smaller than the device title (1rem); units sit beside values at a smaller size. On narrow screens, page headlines become 1.4rem and monitoring readings become 1.1rem.

**The Honest Reading Rule.** Preserve units and local timestamps, show missing readings as N/A, and never turn a real zero into missing data.

## Layout

The desktop shell uses a sticky sidebar (224px), a white sticky topbar with minimum height (58px), and content capped at (1800px). Main padding is (24px 28px 36px); page sections have (20px) gaps. At viewport widths up to (1280px), the sidebar becomes (204px) and content inline padding becomes (20px). At (860px) and below, navigation becomes a drawer (248px).

The monitoring workspace uses a navigator column (248px) and flexible detail column with a (20px) gap. At (1280px) and below, the navigator is (220px), the gap is (16px), and six parameter controls become three columns. At (1024px) and below, the navigator becomes a native select above the detail. At (620px) and below, main padding is (18px 14px 28px), detail gaps become (12px), and parameter controls remain three columns. Chart height is (320px), reducing to (270px) on that narrow breakpoint.

Keep these monitoring arrangements scoped to the monitoring surface, not a compulsory layout for every screen. Tables retain horizontal overflow inside their own containers.

## Elevation & Depth

Working panels and primary buttons are flat: the final workspace overrides remove their shadows and movement transforms. Borders and tonal grouping provide structure. The topbar is opaque, without backdrop blur. Inset separators divide parameter controls.

Depth remains contextual: input focus uses a blue halo, chart tooltips use a compact shadow, and confirmation dialogs use a stronger modal shadow and dimmed backdrop. Shadow values, easing, and breakpoints are recorded in the sidecar.

**The Flat Workspace Rule.** Do not restore decorative lift or hover translation to working panels, primary buttons, or sidebar links.

## Shapes

General panels use the large radius token, fields and buttons use the medium radius, and navigation/device rows use the navigation radius. Monitoring navigator, parameter group, and chart containers use the monitoring radius. Parameter controls have square internal edges within the clipped rounded group. Status badges are pill-shaped. Use one-pixel separators rather than nested decorative containers.

## Components

### Buttons

Default buttons are compact, bold, and at least (42px) high. Primary uses blue on white text; secondary uses white with a cool border; ghost is transparent until hover; danger uses a red tint. Small variants are (34px) high. Primary hover changes color without translation or scale. Disabled buttons reduce opacity and use a not-allowed cursor. Keyboard focus uses a (2px) blue outline offset by (2px).

### Inputs / Fields

Visible labels sit above standard fields. Inputs and selects are at least (44px) high with a cool border and medium corners. Hover strengthens the border; focus changes it to primary and adds a (3px) blue halo. The desktop navigator intentionally uses denser search and filter controls (40px and 36px).

### Navigation

Sidebar items combine a (20px) icon and text, minimum height (44px). Muted blue-white text becomes white on hover; active links use solid primary. Use official Aquanotes and Aerasea images without altering their proportions. The drawer closes on route change; the shell provides a skip link and focuses main content after navigation.

### Status badges

Use a tinted pill with a compact icon and explicit label. Never use a colored dot alone. Monitoring freshness labels may be text-only; connectivity badges and maintenance indicators remain distinct.

### Cards / Containers

General panels use surface, a one-pixel border, and (22px) padding without shadow. Monitoring chart containers use the monitoring radius and no outer padding; their internal header, plot, and optional data table own their spacing.

### Sensor choices and charts

Parameter controls are real buttons with `aria-pressed`, label, current value, unit, and reading state. Selected controls use a pale blue background and inset primary outline (2px); keyboard focus strengthens this to navy (3px). Charts show one parameter at a time, a local-time axis, and a native disclosure containing the numeric measurements. Preserve null gaps (`connectNulls=false`) and disabled entrance animation. Keep stale notices visible rather than implying live data.

## Do's and Don'ts

### Do:

- Do preserve the blue Aquanotes identity and smaller Aerasea endorsement.
- Do use flat working surfaces, subtle borders, and tabular sensor values.
- Do retain state labels, units, local timestamps, and keyboard focus.
- Do keep missing readings distinct from real zero values.

### Don't:

- Don't replace official logos with invented marks or distort their proportions.
- Don't restore card lift, sidebar translation, or primary-button scaling in the workspace.
- Don't present stale or offline readings as live telemetry.
- Don't use the historical guide's proposed font, palette, or breakpoints as if they were the shipped values.


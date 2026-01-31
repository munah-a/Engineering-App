# Material Design 3 Style Guide

## Overview
This document defines the design system for the Coastal Engineering App, adhering to Google's **Material Design 3 (Material You)** principles.

**Key Color**: Ocean Blue (`#0061A4`)
**Theme Strategy**: Adaptive Light & Dark Modes

---

## 1. Color System
The palette is derived from the source blue color using Material 3 tonal logic.

### Light Theme
| Role | Token Name | Hex Value | Usage |
|------|------------|-----------|-------|
| **Primary** | `--md-sys-color-primary` | `#0061A4` | Key actions, FABs, active states |
| **On Primary** | `--md-sys-color-on-primary` | `#FFFFFF` | Text on Primary |
| **Primary Container** | `--md-sys-color-primary-container` | `#D1E4FF` | Low-emphasis active states |
| **On Prim. Container** | `--md-sys-color-on-primary-container` | `#001D36` | Text on Primary Container |
| **Secondary** | `--md-sys-color-secondary` | `#535F70` | Secondary actions, filter chips |
| **On Secondary** | `--md-sys-color-on-secondary` | `#FFFFFF` | Text on Secondary |
| **Tertiary** | `--md-sys-color-tertiary` | `#6B5778` | Expressive accents |
| **Background** | `--md-sys-color-background` | `#FDFCFF` | Page background |
| **On Background** | `--md-sys-color-on-background` | `#1A1C1E` | Primary body text |
| **Surface** | `--md-sys-color-surface` | `#FDFCFF` | Cards, Dialogs, Sheets |
| **On Surface** | `--md-sys-color-on-surface` | `#1A1C1E` | Text on Surface |
| **Outline** | `--md-sys-color-outline` | `#73777F` | Borders, Dividers |
| **Error** | `--md-sys-color-error` | `#BA1A1A` | Error states |

### Dark Theme
| Role | Token Name | Hex Value | Usage |
|------|------------|-----------|-------|
| **Primary** | `--md-sys-color-primary` | `#9ECAFF` | High-contrast actions |
| **On Primary** | `--md-sys-color-on-primary` | `#003258` | Text on Primary |
| **Primary Container** | `--md-sys-color-primary-container` | `#00497D` | Tonal buttons |
| **On Prim. Container** | `--md-sys-color-on-primary-container` | `#D1E4FF` | Text on Primary Container |
| **Secondary** | `--md-sys-color-secondary` | `#BBC7DB` | Accents |
| **On Secondary** | `--md-sys-color-on-secondary` | `#253140` | Text on Secondary |
| **Tertiary** | `--md-sys-color-tertiary` | `#D3BFE6` | Expressive accents |
| **Background** | `--md-sys-color-background` | `#1A1C1E` | App background |
| **On Background** | `--md-sys-color-on-background` | `#E2E2E6` | Body text |
| **Surface** | `--md-sys-color-surface` | `#1A1C1E` | Dark card surface |
| **On Surface** | `--md-sys-color-on-surface` | `#E2E2E6` | Text on Surface |
| **Outline** | `--md-sys-color-outline` | `#8C9199` | Lighter borders |
| **Error** | `--md-sys-color-error` | `#FFB4AB` | Error states |

---

## 2. Typography
**Font Family**: `Roboto`, `Inter`, or `system-ui`.

| Style | Token Variable | Size / Line Height |
|-------|----------------|--------------------|
| **Headline Medium** | `--md-sys-typescale-headline-medium` | 28px / 36px |
| **Title Medium** | `--md-sys-typescale-title-medium` | 16px / 24px (Medium Weight) |
| **Body Large** | `--md-sys-typescale-body-large` | 16px / 24px (Regular) |
| **Label Large** | `--md-sys-typescale-label-large` | 14px / 20px (Medium Weight) |

---

## 3. Implementation Guide
To use these styles, add the following CSS to your `styles.css` file.

```css
:root {
  /* Light Theme Tokens */
  --md-sys-color-primary: #0061A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #D1E4FF;
  --md-sys-color-on-primary-container: #001D36;
  --md-sys-color-secondary: #535F70;
  --md-sys-color-on-secondary: #FFFFFF;
  --md-sys-color-tertiary: #6B5778;
  --md-sys-color-background: #FDFCFF;
  --md-sys-color-on-background: #1A1C1E;
  --md-sys-color-surface: #FDFCFF;
  --md-sys-color-on-surface: #1A1C1E;
  --md-sys-color-outline: #73777F;
  --md-sys-color-error: #BA1A1A;

  /* Typography & Shape */
  --md-sys-typescale-body-large: 400 16px/24px 'Roboto', sans-serif;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-full: 9999px;
  
  /* Elevation */
  --md-sys-elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Theme Tokens */
    --md-sys-color-primary: #9ECAFF;
    --md-sys-color-on-primary: #003258;
    --md-sys-color-primary-container: #00497D;
    --md-sys-color-on-primary-container: #D1E4FF;
    --md-sys-color-secondary: #BBC7DB;
    --md-sys-color-on-secondary: #253140;
    --md-sys-color-tertiary: #D3BFE6;
    --md-sys-color-background: #1A1C1E;
    --md-sys-color-on-background: #E2E2E6;
    --md-sys-color-surface: #1A1C1E;
    --md-sys-color-on-surface: #E2E2E6;
    --md-sys-color-outline: #8C9199;
    --md-sys-color-error: #FFB4AB;
  }
}

/* Example Component Usage */
.btn-primary {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-radius: var(--md-sys-shape-corner-full);
  padding: 10px 24px;
  border: none;
  font-weight: 500;
  font-family: inherit;
}

.card {
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-1);
  padding: 16px;
}
```

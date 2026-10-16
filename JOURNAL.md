# 📓 Scribble — Development Journal

A personal log of design decisions, challenges encountered, and lessons learned while building the Scribble pastel sticky notes app.

---

## Entry 1 — Project Kickoff
**Date:** 12 October 2026

### What I Set Out to Build

I wanted a simple, beautiful sticky notes web app that lives entirely in the browser — no backend, no frameworks, no build tools. Just three files: `index.html`, `style.css`, and `script.js`. The core idea was to make something that feels joyful to use, with pastel colours and a satisfying card-flip interaction.

**Goals for v1:**
- Create, edit, and delete sticky notes
- Smooth 3D card-flip animation (front preview / back full content)
- Instant search/filter
- Persistent storage via `localStorage`
- Fully responsive from mobile to desktop
- Clean, modern, accessible UI

### Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Language | Vanilla JavaScript | No overhead, no dependencies, full browser API access |
| Styling | Vanilla CSS | Maximum control; CSS custom properties for design tokens |
| Storage | `localStorage` | Zero backend; data stays in the user's browser |
| Font | Roboto (Google Fonts) | Clean, readable at small sizes, widely trusted |
| No framework | Intentional | Kept the codebase minimal and focused |

---

## Entry 2 — Building the Foundation
**Date:** 12 October 2026

### HTML Structure

Designed the HTML with semantic elements from the start:
- `<header>` for the app bar with branding, search, and the *New note* button
- `<main>` containing the notes grid, empty state, and search-no-results state
- Two `<dialog>`-style `<div>` modals: one for creating/editing notes, one for delete confirmation
- An accessible toast container for feedback notifications

### CSS Design System

Set up CSS custom properties (variables) as the design foundation:

```css
--bg-app: #FAF8F5;           /* Warm off-white background */
--text-main: #1F2421;        /* Near-black for strong contrast */
--shadow-card: 0 6px 16px rgba(0,0,0,0.06);
--flip-duration: 0.5s;
--radius-lg: 14px;
```

Defining everything as tokens upfront meant colour changes and spacing adjustments later required editing a single place.

### The 3D Card Flip

The flip was the most technically interesting part of the project. The key CSS properties:

```css
.note-card { perspective: 1000px; }
.note-card-inner { transform-style: preserve-3d; transition: transform 0.5s; }
.note-card.is-flipped .note-card-inner { transform: rotateY(180deg); }
.note-face { backface-visibility: hidden; }
.note-card-back { transform: rotateY(180deg); }
```

JavaScript toggles the `is-flipped` class on click. Edit and Delete button clicks use `stopPropagation()` to prevent the flip from triggering.

---

## Entry 3 — Bug: Empty State & "No Notes Found" Persisting After Save
**Date:** 12 October 2026

### The Problem

After saving a note, the *"Your canvas is empty"* and *"No notes found"* messages remained visible on screen even though the note had been created and was stored in `localStorage`.

### Root Cause

This was a CSS cascade precedence issue:

1. The HTML `hidden` attribute is set by the browser's user-agent stylesheet as `[hidden] { display: none; }`.
2. The author stylesheet (my `style.css`) defined `.state-message { display: flex; }`.
3. **Author stylesheets always override user-agent stylesheets.** So `display: flex` from the class was winning over `display: none` from the `hidden` attribute — keeping the state messages visible even when they shouldn't be.

### Fix

Three-layer defence:

**Layer 1 — CSS explicit `!important` rules:**
```css
[hidden], .is-hidden { display: none !important; }
#empty-state[hidden], #no-results-state[hidden] { display: none !important; }
```

**Layer 2 — Inline `style="display: none;"` on state elements in HTML:**
```html
<div id="empty-state" style="display: none;" hidden>
```
This means even before JavaScript runs, the elements are hidden at the highest specificity level.

**Layer 3 — JavaScript uses `style.setProperty()` with `!important`:**
```js
el.style.setProperty('display', 'none', 'important');
el.style.setProperty('display', 'flex', 'important'); // when showing
```

Combining all three layers ensures that no stylesheet rule, cascade order, or inherited display property can override the visibility state.

### Lesson Learned

> The HTML `hidden` attribute alone is not reliable when an author CSS class sets a `display` value. Always pair `hidden` with `style="display: none;"` on elements that have a CSS class overriding their display type, or use `!important` in your stylesheet rule.

---

## Entry 4 — localStorage Normalization
**Date:** 12 October 2026

### Problem

Early validation in `loadNotesFromStorage()` used strict type checks. Any note missing optional fields (like `updatedAt`) would be silently filtered out. This meant notes could disappear from the canvas after a page reload if they had been created with slightly different data shapes.

### Fix

Replaced strict filtering with **safe normalization** — every field gets a fallback value rather than the whole note being discarded:

```js
return parsed.map(item => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: String(item.id || generateId()),
    title: String(item.title ?? ''),
    content: String(item.content ?? ''),
    color: String(item.color || DEFAULT_COLOUR),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
  };
}).filter(Boolean);
```

### Lesson Learned

> When reading persisted data, normalize rather than reject. Users shouldn't lose notes because of a missing timestamp field.

---

## Entry 5 — Accessibility Pass
**Date:** 12 October 2026

Quick audit before wrapping up v1:

- ✅ All form inputs have explicit `<label>` elements with `for` attributes
- ✅ Colour swatches are radio inputs with `visually-hidden` text labels ("Yellow", "Pink", etc.)
- ✅ Modals have `role="dialog"` / `role="alertdialog"` and `aria-labelledby`
- ✅ Notes grid has `aria-label`; each card has a descriptive `aria-label`
- ✅ `Escape` key closes open modals
- ✅ Cards support keyboard flip via `Enter` / `Space` when focused
- ✅ `@media (prefers-reduced-motion: reduce)` disables all animations for users who need it
- ✅ All interactive controls have `:focus-visible` outlines

---

## Entry 6 — Documentation & Repository Cleanup
**Date:** 13 October 2026

Committed and pushed all three source files to GitHub. The working tree was clean before adding documentation.

### README Created — 15 October 2026

Wrote a full `README.md` covering:
- Feature list
- Pastel colour palette table
- Getting started (open directly or with Python's local server)
- Project structure
- Data model (JSON shape stored in `localStorage`)
- How the 3D flip works (CSS explanation)
- Tested behaviours checklist
- Browser support

### Journal Created — 15 October 2026

This file. Documents the *why* behind the decisions, not just the *what*.

---

## Entry 7 — Light / Dark Mode Toggle
**Date:** 16 October 2026

### What I Built

A smooth, animated light/dark mode toggle in the header — a pill switch with a sliding thumb, sun/moon icons, and a text label. The preference persists in `localStorage` (`scribble-theme`) and falls back to the OS `prefers-color-scheme` on first visit. An inline `<head>` script applies the stored theme before the first paint so there's no flash-of-wrong-theme.

### Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Toggle style | Pill switch (track + sliding thumb) | Familiar, tactile, and visually distinct from icon-only buttons |
| Theme scope | `data-theme` attribute on `<html>` | Allows `[data-theme="dark"]` to override CSS custom properties cleanly |
| No-flash strategy | Inline `<head>` script | Runs before body renders; avoids a visible light→dark flash |
| System sync | `matchMedia('(prefers-color-scheme: dark)')` | Follows OS setting until the user makes a manual choice |
| Transition | `0.35s ease` on body, header, modals, and toggle | Smooth crossfade without being sluggish |

### CSS Architecture

All colours were already tokens (`--bg-app`, `--text-main`, etc.), so adding dark mode meant only defining an override block:

```css
[data-theme="dark"] {
  --bg-app: #121514;
  --bg-surface: #1A1F1D;
  --text-main: #F4F2EE;
  --primary-btn-bg: #F4F2EE;
  --primary-btn-text: #121514;
  /* ... */
}
```

Sticky notes keep their pastel colours in dark mode (like physical stickies on a dark desk), so I introduced `--note-text-main` and `--note-text-muted` that always stay dark for readability on pastel backgrounds.

### The Editor Modal Problem

The editor modal card gets a pastel background colour set via JS. In dark mode, `--text-main` becomes light — making it unreadable on pastel. Fixed by forcing dark ink on all elements inside `#modal-card-preview`:

```css
#modal-card-preview .modal-title,
#modal-card-preview .form-label { color: #1F2421; }
#modal-card-preview .form-input  { color: #1F2421; background: rgba(255,255,255,0.55); }
```

### Lesson Learned

> Design tokens pay dividends. Because every colour was already a CSS variable, the entire dark theme was ~40 lines of overrides — no need to touch individual component rules.

---

## Entry 8 — Note Categories
**Date:** 16 October 2026

### What I Built

An optional `category` field on each note. Users can assign a short label (e.g. "Work", "Personal", "Project X") in the editor. Notes display a colour-coded pill badge on the front and a chip on the back. A filter dropdown in the meta bar lets users view only notes in a selected category.

### Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Data shape | Single `category` string per note | Simpler than an array of tags; matches "group by" use case |
| Category colour | Deterministic hash → pastel palette | Same category always gets the same colour; no extra storage needed |
| Filter UI | Native `<select>` dropdown | Accessible, keyboard-navigable, no custom component overhead |
| Editor input | `<input>` with `<datalist>` | Free-text entry with autocomplete suggestions from existing categories |
| Empty category | Stored as `""` | Notes without a category simply don't show a badge or chip |

### Backward Compatibility

Existing notes in `localStorage` don't have a `category` field. The normalizer in `loadNotesFromStorage()` adds one:

```js
category: String(item.category || ''),
```

This means old notes load cleanly without a category, and new categories can be added to them later via edit.

### The Filter + Search Interaction

Category filtering and text search work together (AND logic). The counter updates to show *"Showing X of Y notes"* whenever either filter is active. When a category is deleted from all its notes, the filter dropdown resets to "All categories" and hides itself if no categories remain.

### Lesson Learned

> Deriving UI state from the data (categories are always computed from existing notes) avoids sync bugs. There's no separate "categories list" to keep in `localStorage` — if a category has no notes, it simply doesn't exist.

---

## What I'd Add in a Future Version

| Feature | Notes | Status |
|---------|-------|--------|
| ~~Pin notes~~ | ~~Allow certain notes to float to the top of the grid~~ | Planned |
| ~~Note categories / tags~~ | ~~Group notes by project or topic~~ | ✅ Done (Entry 8) |
| ~~Light/dark mode toggle~~ | ~~Auto-detect `prefers-color-scheme`~~ | ✅ Done (Entry 7) |
| Export notes | Download notes as a `.txt` or `.json` file | Planned |
| Note ordering | Drag to reorder notes within the grid | Planned |
| Character count | Show remaining characters in the textarea | Planned |

---

*Scribble is intentionally simple. The constraints — no framework, no backend, three files — made the project more interesting, not less.*

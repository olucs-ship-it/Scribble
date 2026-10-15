# 🗒️ Scribble — Pastel Sticky Notes

A minimalist, beautifully designed sticky notes web app built with pure HTML, CSS, and Vanilla JavaScript. Create, flip, search, edit, and delete pastel-coloured notes — all saved directly in your browser.

![Scribble App](https://img.shields.io/badge/Status-Live-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Features

- **Create Notes** — Open a simple editor with a title, content area, and pastel colour picker. Notes are saved instantly to `localStorage`.
- **3D Card Flip** — Every note flips with a smooth CSS 3D animation. The front shows a preview; the back shows the full content with Edit and Delete controls.
- **Edit Notes** — Update a note's title, content, or colour at any time without creating a duplicate.
- **Delete Notes** — A confirmation dialog prevents accidental deletions.
- **Instant Search** — Filter notes in real-time by title or content. Case-insensitive.
- **Persistent Storage** — Notes survive page refreshes via `localStorage` under the key `scribble-notes`.
- **Responsive Layout** — CSS Grid adapts from a multi-column desktop view to a single column on mobile.
- **Accessible** — Keyboard navigable, visible focus indicators, `Escape` key closes modals, and `prefers-reduced-motion` is respected.

---

## 🎨 Pastel Colour Palette

| Name | Hex |
|------|-----|
| Yellow | `#FFF2B2` |
| Pink | `#FFDCE5` |
| Blue | `#D9ECFF` |
| Mint | `#D8F5DF` |
| Lavender | `#E9DFFF` |
| Peach | `#FFE2CC` |

---

## 🚀 Getting Started

No build tools, no dependencies, no installation required.

### Option 1 — Open directly in your browser

```bash
# Clone the repository
git clone https://github.com/olucs-ship-it/Scribble.git

# Open index.html in any modern browser
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

### Option 2 — Serve locally (recommended for full feature support)

```bash
# Using Python (built-in)
python -m http.server 3000

# Then open in your browser
http://localhost:3000
```

---

## 🗂️ Project Structure

```
Scribble/
├── index.html   # Semantic HTML5 structure — header, grid, modals, state messages
├── style.css    # All styling — design tokens, pastel palette, 3D flip cards, responsive grid
└── script.js    # Vanilla JS — CRUD operations, localStorage, search, modals, flip interactions
```

---

## 🔧 How It Works

### Data Model

Each note is stored as a JSON object in `localStorage`:

```json
{
  "id": "unique-uuid",
  "title": "Weekend Groceries",
  "content": "Oat milk, avocados, sourdough bread",
  "color": "#D9ECFF",
  "createdAt": "2026-10-12T20:00:00.000Z",
  "updatedAt": "2026-10-12T21:30:00.000Z"
}
```

### Storage

- **Key:** `scribble-notes`
- Notes are loaded on startup and validated. Corrupted or missing fields are gracefully normalized.
- Storage quota errors are caught and reported to the user via a toast notification.

### Card Flip Interaction

The flip is achieved using CSS `perspective`, `transform-style: preserve-3d`, and `rotateY(180deg)`. Both card faces use `backface-visibility: hidden` so only one side is visible at a time. Click or tap on a card to flip it; use the **Flip back** button, or click again to return to the front.

---

## 🧪 Tested Behaviours

| Behaviour | Status |
|-----------|--------|
| Empty state displayed on first load | ✅ |
| Validation prevents saving blank notes | ✅ |
| Note creation saves to `localStorage` | ✅ |
| Card flip animation works on click/tap | ✅ |
| Edit updates note in-place (no duplicate) | ✅ |
| Delete requires confirmation | ✅ |
| Search filters notes in real-time | ✅ |
| "No results" state shown on 0 search matches | ✅ |
| Notes persist after page refresh | ✅ |
| Colours preserved on both card faces | ✅ |
| `Escape` key closes open modals | ✅ |
| Keyboard card flip via `Enter` / `Space` | ✅ |

---

## 🌐 Browser Support

Works in all modern browsers:

- Google Chrome 90+
- Mozilla Firefox 90+
- Microsoft Edge 90+
- Safari 14+

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Built with 💛 using plain HTML, CSS, and Vanilla JavaScript. No frameworks. No build tools. Just the web.

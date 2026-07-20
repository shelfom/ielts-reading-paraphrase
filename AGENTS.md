# AGENTS.md

## Project Overview

**ielts-reading-para** — An interactive IELTS reading paraphrase-pair matching application. Displays paraphrase pairs from Cambridge IELTS 11–20 in a card-matching interface. Users match "Question" side phrases with their "Passage" side equivalents.

**v13 — Books 11–20 release**: 120 passages, 2,200 unique pairs, 485 rounds. Book 20 adds 12 passages and 247 pairs.

## Tech Stack

- **Build**: Vite 5 + vanilla TypeScript config
- **Styling**: Custom CSS (no framework)
- **Language**: Vanilla JavaScript (ES modules)
- **Package Manager**: pnpm (only)

## Directory Structure

```
├── index.html              # HTML entry point
├── styles.css              # All styles (light/dark theme via CSS vars)
├── app.js                  # Application logic (matching, scoring, navigation)
├── sections.js             # Exercise data (window.__SECTIONS__)
├── book20-source.mjs       # Book 20 raw pair data
├── build-data.mjs          # Data build pipeline
├── scripts/
│   ├── build.sh            # Coze deploy build script
│   ├── start.sh            # Coze deploy start script
│   └── integrate-book20.mjs # Book 20 data integration script
├── tests/
│   └── data.test.mjs       # Data integrity tests (node --test)
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies & scripts
├── .coze                   # Sandbox build/run configuration
└── dist/                   # Production build output (gitignored)
```

## Commands

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `pnpm dev`               | Start dev server (HMR)                   |
| `pnpm test`              | Run data integrity tests (node --test)   |
| `pnpm build`             | Build for production                     |
| `pnpm preview`           | Preview production build                 |
| `pnpm build:data:book20` | Re-integrate Book 20 data into sections  |

## Data Contract

Exercise data lives in `sections.js` as `window.__SECTIONS__` — an array of 120 section objects:

```ts
interface Section {
  book: number;      // Cambridge IELTS book number (11–20)
  test: number;      // Test number within the book
  passage: number;   // Passage number within the test
  title: string;     // Passage title
  pairs: Array<{
    w: string;       // "Question" side (word/phrase to paraphrase)
    p: string;       // "Passage" side (paraphrased equivalent)
  }>;
}
```

## Key Behaviors

- **Theme toggle**: Light/dark via `data-theme="dark"` on `<html>`, persisted in localStorage
- **Progress tracking**: Score per passage, round-based progression
- **Passage completion overlay**: Stays open until user clicks its own Next button
- **Navigation guard (v12)**: Carried-input guard prevents accidental navigation during active matching
- **Pep talks**: All 120 passages receive distinct completion messages
- **Mobile**: 375×667 viewport fixed with zero page scroll

## Coding Conventions

- Vanilla JS with ES modules; no framework
- CSS custom properties for theming
- Do not alter learning data, interaction patterns, or branding

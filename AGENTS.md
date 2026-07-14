# AGENTS.md

## Project Overview

**ielts-reading-para** — An interactive IELTS reading paraphrase-pair matching application. Displays paraphrase pairs from Cambridge IELTS 11–19 in a card-matching interface. Users match "Question" side phrases with their "Passage" side equivalents.

## Tech Stack

- **Build**: Vite 5 + vanilla TypeScript config
- **Styling**: Custom CSS (no framework)
- **Language**: Vanilla JavaScript (ES modules)
- **Package Manager**: pnpm (only)

## Directory Structure

```
├── index.html          # HTML entry point
├── styles.css          # All styles (light/dark theme via CSS vars)
├── app.js              # Application logic (matching, scoring, navigation)
├── sections.js         # Exercise data (window.__SECTIONS__)
├── vite.config.ts      # Vite configuration
├── package.json        # Dependencies & scripts
├── .coze               # Sandbox build/run configuration
└── dist/               # Production build output (gitignored)
```

## Commands

| Command         | Description                   |
| --------------- | ----------------------------- |
| `pnpm dev`      | Start dev server (HMR)        |
| `pnpm build`    | Build for production          |
| `pnpm preview`  | Preview production build      |

## Data Contract

Exercise data lives in `sections.js` as `window.__SECTIONS__` — an array of section objects:

```ts
interface Section {
  book: number;      // Cambridge IELTS book number (11–19)
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

## Coding Conventions

- Vanilla JS with ES modules; no framework
- CSS custom properties for theming
- All function parameters should be typed where practical
- Do not alter learning data, interaction patterns, or branding

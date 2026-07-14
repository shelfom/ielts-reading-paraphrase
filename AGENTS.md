# AGENTS.md

## Project Overview

**ielts-reading-para** — An interactive IELTS reading comprehension web application. Displays reading passages with associated multiple-choice questions. Content is loaded from static JSON files.

## Tech Stack

- **Build**: Vite 7 + TypeScript
- **Server**: Express (serves API + static files)
- **Styling**: Tailwind CSS 3
- **Package Manager**: pnpm (only)

## Directory Structure

```
├── public/data/          # Reading passage JSON files + manifest
├── server/
│   ├── routes/index.ts   # API routes (health check)
│   ├── server.ts         # Express entry point
│   └── vite.ts           # Vite middleware integration
├── src/
│   ├── index.css         # Global styles (Tailwind + CSS vars)
│   ├── index.ts          # Client entry
│   ├── main.ts           # App initialization & shell layout
│   ├── types.ts          # TypeScript interfaces for passage data
│   └── utils/
│       └── data-loader.ts # Fetches passage JSON from /data/
├── index.html            # HTML entry
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Commands

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Start dev server (HMR)        |
| `pnpm build`      | Build for production          |
| `pnpm start`      | Start production server       |
| `pnpm ts-check`   | TypeScript type check         |
| `pnpm lint`       | ESLint check                  |
| `pnpm validate`   | Run ts-check + lint in parallel |

## Data Contract

Content is loaded from `public/data/`:
- `manifest.json` — array of passage metadata (id, title, filename, difficulty, topic)
- `<filename>.json` — individual passage with content + questions

See `src/types.ts` for full TypeScript interfaces (`ReadingPassage`, `Question`, `QuestionOption`).

## Coding Conventions

- TypeScript strict mode; no implicit `any`
- All function parameters must be typed
- Use Tailwind utility classes for styling; CSS variables for theming
- Prefer `const` over `let`; avoid `as any`

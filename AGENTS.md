# AGENTS.md

## Project overview

Markdown Notes — a Next.js 16 (App Router) static-export site for Obsidian-style note-taking. Content lives in `content/notes/*.md` and `content/templates/*.md` (not in git). The build produces fully static HTML in `out/` — no Node.js runtime ships to users.

Stack: Next.js 16, React 19, Tailwind CSS v4, Vitest, Fuse.js, gray-matter, remark.

## Setup and build

```bash
npm install
npm run dev            # starts dev server (predev seeds content/ if empty)
npm run build          # full Next.js build — enables server actions (/notes/new, delete)
npm run build:static   # static export to out/ — no server features
npm test               # run all tests once
npm run lint           # eslint
```

Node.js >=20.6.0 is required (`node --env-file` support).

## Testing

Tests live in `tests/` and use Vitest with jsdom + React Testing Library. Run with `npm test`.

- Tests depend on `content/` existing. After a fresh clone, run `npm run init-content` before `npm test`.
- Tests use real `content/` files, not mocked fixtures (except `init-content.test.ts` which uses a temp dir).
- Server actions (`"use server"` modules) cannot be imported directly in Vitest — always `vi.mock()` them and dynamic-import the component after mock registration.
- `tests/link-integrity.test.ts` requires a prior `npm run build` — it auto-skips if `out/` is missing.

When adding a new component test:
1. Mock server actions with `vi.mock("@/app/.../actions", () => ({ ... }))`.
2. Mock `next/navigation` when the component uses `useRouter`: `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))`.
3. Dynamic-import the component *after* mock registration: `const { default: Comp } = await import(...)`.
4. Use `afterEach(cleanup)` and reset mocks between tests.
5. `vi.clearAllMocks()` clears default implementations set via `mockResolvedValue` — prefer `vi.restoreAllMocks()` or re-set the default mock in `beforeEach`.

Reference tests: `tests/new-note.test.tsx` (form + server action pattern), `tests/delete-note.test.tsx` (useRouter + confirmation flow).

## Code style and conventions

- TypeScript strict mode. Path alias `@/*` maps to project root.
- Tailwind CSS v4 (PostCSS plugin, no tailwind.config — uses CSS-based config in `app/globals.css`).
- No Prettier configured — match surrounding formatting.
- No pre-commit hooks.
- Prefer editing existing files over creating new ones.
- Do not add comments, docstrings, or type annotations to unchanged code.

## Key entry points

When starting a task, read these first to orient:
- `lib/notes.ts` — data layer, all content types and access functions
- `app/` directory — page structure mirrors the URL routes
- `package.json` — all npm scripts and dependencies
- `tests/` — existing test files show established patterns and mocking strategies

## Architecture

### Dual build modes
`npm run build` produces a full Next.js server with server actions enabled (required for `/notes/new` save and `/notes/[slug]` delete). `npm run build:static` produces a static export to `out/` with no server features — server actions will not work. The switch is controlled by `NEXT_EXPORT=true` in `next.config.ts`. New features that need server-side behavior (forms, mutations) only work under `npm run build`.

### Data layer — `lib/notes.ts`
All file I/O, markdown parsing, frontmatter handling, tag normalization, wiki-link resolution, and backlink computation. This is the single source of truth for content access. Components never read the filesystem directly.

### App Router pages — `app/`
- `/` — home, searchable index via `<SearchableDocs>` (client component, Fuse.js).
- `/notes/new` — client form with tag pills. Server action `saveNote` writes to inbox then runs `npm run ingest`.
- `/notes/[slug]` — note detail (server component) with `<DeleteNoteButton>` (client). Server action `deleteNote` validates slug and removes the file.
- `/templates/`, `/templates/[slug]` — template listing and detail.
- `/tags/`, `/tags/[tag]` — tag index and filtered view.

### Server actions
Located next to the page that uses them (e.g., `app/notes/[slug]/actions.ts`). Pattern: `"use server"` module exporting async functions that return `{ success: boolean; error?: string }`.

### Adding a new interactive page
Follow the established pattern: server component `page.tsx` for data fetching + colocated `actions.ts` for mutations + colocated client component (`"use client"`) for interactivity. See `app/notes/[slug]/` for the canonical example (page.tsx + actions.ts + DeleteNoteButton.tsx).

### Slug validation
Slugs must match `/^[a-z0-9][a-z0-9-_]*$/i`. This regex is used in `lib/notes.ts` (`isValidSlug`) and duplicated in `app/notes/[slug]/actions.ts`. Keep them in sync.

### Content seeding
`scripts/init-content.mjs` runs as `predev`/`prebuild` hooks. It creates `content/{inbox,notes,templates}/` and seeds starter files if directories are empty. It is idempotent — never overwrites existing files.

### Inbox ingestion pipeline
`scripts/watch-inbox.mjs` + `scripts/lib/{inbox-processor,note-generator,llm-client}.mjs`. Processes dropped files through a configured LLM provider and writes formatted notes to `content/notes/`. Supports OpenAI, Anthropic, Gemini, OpenRouter, and Ollama. Requires `.env` configuration — see `.env.example`. Scripts use `node --env-file=.env` and will fail without it.

### Wiki links
Notes support Obsidian-style `[[slug]]` and `[[slug|label]]` syntax. Resolution order: `content/notes/` first, then `content/templates/`. Backlinks are computed at render time by scanning all docs for `[[slug]]` references. Both rendering and backlink logic live in `lib/notes.ts`.

## Security

- Never commit `.env` files or API keys.
- Slug validation prevents path traversal — always validate slugs before filesystem operations.
- Markdown HTML is rendered with `remark-html` sanitization enabled (`{ sanitize: true }`).
- `npm run audit:prod` checks production deps only (meaningful for static sites where devDependencies never ship).
- See `SECURITY.md` for accepted risks and audit procedures.

## Commit and PR guidelines

- Write concise commit messages focused on "why" not "what".
- Keep PRs focused — one feature or fix per PR.
- All tests must pass (`npm test`) before committing.
- Run `npm run lint` to check for linting issues.

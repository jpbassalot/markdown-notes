# Markdown Notes Static Site

Next.js App Router static-export project for Obsidian-style note-taking with markdown files, tags, templates, and Fuse.js search.

## Stack

- Next.js (App Router + static export)
- Tailwind CSS v4
- Fuse.js for client-side fuzzy search
- gray-matter + remark for markdown parsing

## Local development

```bash
npm install
npm run dev
```

On the first run, `predev` automatically creates `content/notes/` and
`content/templates/` and seeds starter files if they are empty.
It also ensures `content/inbox/README.md` exists for inbox ingestion setup.
You can also trigger this manually at any time:

```bash
npm run init-content
```

## Build static output

```bash
npm run build
```

Static files are generated to `out/`. The `prebuild` hook runs the same
content-init step automatically.

## Content structure

- `content/inbox/`: drop-zone for LLM ingestion input files
- `content/notes/*.md`: note files
- `content/templates/*.md`: reusable templates

Each markdown file supports frontmatter:

```md
---
title: Note title
tags:
  - tag-one
  - tag-two
date: 2026-02-18
---
```

Both `date` and `updatedAt` are accepted (`updatedAt` takes precedence if both are present).

## Inbox ingestion (LLM)

You can auto-convert dropped inbox files into structured notes.

```bash
npm run watch   # watch content/inbox continuously
npm run ingest  # process pending files once and exit
```

Expected flow:
- Drop `.txt`, `.md`, or `.markdown` files in `content/inbox/`
- Files are sent to the configured LLM provider and converted into note markdown
- Output is written to `content/notes/<slug>.md`
- Originals are archived to `content/inbox/.processed/` on success
- Failures are archived to `content/inbox/.failed/` with `.error` logs

Guardrails included:
- Serialized processing queue in watch mode to avoid race conditions
- Unsupported extension and likely-binary file filtering
- Input size limit of 100KB before LLM submission
- Provider response validation for OpenAI-compatible, Anthropic, and Gemini clients

## LLM configuration

Create `.env` from `.env.example` and set:
- `LLM_PROVIDER` (`openai`, `anthropic`, `gemini`, `openrouter`, `ollama`)
- `LLM_API_KEY` (not required for local `ollama`)
- Optional `LLM_MODEL`, `LLM_BASE_URL`, `INBOX_DIR`

Node.js `>=20.6.0` is required (used by `node --env-file` scripts).

## Prompt and format customization

- `docs/note-format.md`: note schema and formatting guide used at generation time
- `content/inbox/README.md`: operator-facing inbox workflow instructions
- `README.md`, `docs/note-format.md`, and recent notes are used as live generation context

## Testing

```bash
npm test          # run all tests once
npm run test:watch # run in watch mode
```

Tests use Vitest and cover:

- **`tests/notes.test.ts`** — `lib/notes.ts` data layer (slug listing, doc fetching, tag queries, date parsing, path traversal rejection)
- **`tests/searchable-docs.test.tsx`** — SearchableDocs component (rendering, fuzzy search filtering, clear button, tag links, type badges)
- **`tests/init-content.test.ts`** — `scripts/init-content.mjs` (directory creation, seed-file generation, no-overwrite safety, idempotency)
- **`tests/inbox-processor.test.ts`** — inbox slug/title helpers and markdown fence stripping behavior
- **`tests/llm-client.test.ts`** — LLM response extraction guards across providers
- **`tests/link-integrity.test.ts`** — verifies every slug/tag has a corresponding HTML file in `out/` and all internal links in `index.html` resolve (requires `npm run build` first)

## Wiki links and backlinks

Notes and templates can link to each other using Obsidian-style wiki link syntax:

```md
[[other-note]]            links to content/notes/other-note.md
[[other-note|label]]      same link with custom display text
[[my-template]]           links to content/templates/my-template.md (if no note matches first)
```

Wiki links are rendered as clickable HTML links. The app resolves the slug against
`content/notes/` first, then `content/templates/`.

Each note and template page shows a **Backlinks** section listing every other note or
template that contains a `[[slug]]` reference to it — mirroring Obsidian's backlinks panel.

## Routes

- `/`: searchable index (notes + templates)
- `/notes/[slug]`: note pages
- `/templates`: template list
- `/templates/[slug]`: template page
- `/tags`: tag index
- `/tags/[tag]`: docs under a tag

## Security

Run `npm run audit:prod` to check production dependencies for vulnerabilities.
See [SECURITY.md](SECURITY.md) for the full security policy, audit process, and
accepted dev-only risks.

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
`content/templates/` and seeds each with a starter file if they are empty.
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

## Testing

```bash
npm test          # run all tests once
npm run test:watch # run in watch mode
```

Tests use Vitest and cover:

- **`tests/notes.test.ts`** — `lib/notes.ts` data layer (slug listing, doc fetching, tag queries, date parsing, path traversal rejection)
- **`tests/searchable-docs.test.tsx`** — SearchableDocs component (rendering, fuzzy search filtering, clear button, tag links, type badges)
- **`tests/init-content.test.ts`** — `scripts/init-content.mjs` (directory creation, seed-file generation, no-overwrite safety, idempotency)
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

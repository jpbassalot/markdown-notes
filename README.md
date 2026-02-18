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

## Build static output

```bash
npm run build
```

Static files are generated to `out/`.

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
- **`tests/link-integrity.test.ts`** — verifies every slug/tag has a corresponding HTML file in `out/` and all internal links in `index.html` resolve (requires `npm run build` first)

## Routes

- `/`: searchable index (notes + templates)
- `/notes/[slug]`: note pages
- `/templates`: template list
- `/templates/[slug]`: template page
- `/tags`: tag index
- `/tags/[tag]`: docs under a tag

/**
 * init-content.mjs
 *
 * Run via `predev` / `prebuild` hooks.
 * Creates content/notes and content/templates if they don't exist, then seeds
 * each empty directory with one starter file so the site is never blank on a
 * fresh clone.  Existing files are never overwritten.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, "..");

const TODAY = new Date().toISOString().slice(0, 10);

export const SEEDS = [
  {
    dir: "content/notes",
    filename: "getting-started.md",
    content: `---
title: "Getting Started"
date: "${TODAY}"
tags: ["example"]
---

# Getting Started

Welcome to your markdown notes site!

## Adding notes

Drop any \`.md\` file into \`content/notes/\` and it will appear here automatically.

Each file can have optional frontmatter:

\`\`\`md
---
title: "My Note"
date: "${TODAY}"
tags: ["tag-one", "tag-two"]
---
\`\`\`

Both \`date\` and \`updatedAt\` are accepted (\`updatedAt\` takes precedence).

## Adding templates

Drop \`.md\` files into \`content/templates/\` to make them available under
the **Templates** section.

## Searching

The home page has a live fuzzy-search box powered by Fuse.js — just start typing.

## Browsing by tag

Click any tag badge to view all notes and templates that share that tag.
`,
  },
  {
    dir: "content/templates",
    filename: "new-note.md",
    content: `---
title: "New Note"
date: "{{date}}"
tags: ["untagged"]
---

# {{title}}

Content goes here.
`,
  },
];

/** Returns true if dir contains at least one .md file. */
export function hasMarkdownFiles(dir) {
  return fs.readdirSync(dir).some((f) => f.endsWith(".md"));
}

/**
 * Creates dir if missing.  Returns true when the directory was newly created
 * (and is therefore guaranteed to be empty).
 */
export function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

/**
 * Main entry point.  Accepts an optional root directory so tests can point at
 * a temporary location instead of the real project root.
 */
export function initContent(root = DEFAULT_ROOT) {
  for (const seed of SEEDS) {
    const absDir = path.join(root, seed.dir);
    const wasNew = ensureDir(absDir);

    if (wasNew) {
      console.log(`[init-content] created ${seed.dir}/`);
    }

    const seedPath = path.join(absDir, seed.filename);
    if (!fs.existsSync(seedPath) && (wasNew || !hasMarkdownFiles(absDir))) {
      fs.writeFileSync(seedPath, seed.content, "utf8");
      console.log(`[init-content] seeded ${seed.dir}/${seed.filename}`);
    }
  }
}

// Run automatically only when this file is the entry point.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initContent();
}

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// @ts-expect-error .mjs module
import {
  deriveSlug,
  extractTitle,
  slugify,
  uniqueSlug,
} from "../scripts/lib/inbox-processor.mjs";
// @ts-expect-error .mjs module
import { stripMarkdownFence } from "../scripts/lib/note-generator.mjs";

let tmpNotesDir: string;

beforeEach(() => {
  tmpNotesDir = fs.mkdtempSync(path.join(os.tmpdir(), "inbox-processor-test-"));
});

afterEach(() => {
  fs.rmSync(tmpNotesDir, { recursive: true, force: true });
});

describe("slugify", () => {
  it("normalizes accents, punctuation, and spacing", () => {
    expect(slugify("  CAFE déjà vu!!!  ")).toBe("cafe-deja-vu");
  });
});

describe("extractTitle", () => {
  it("reads title from frontmatter only", () => {
    const markdown = `---
title: "Frontmatter Title"
date: 2026-02-19
---

# Heading

title: body title should not be parsed`;

    expect(extractTitle(markdown)).toBe("Frontmatter Title");
  });

  it("returns null when no frontmatter title is present", () => {
    const markdown = `---
date: 2026-02-19
---

# Heading`;

    expect(extractTitle(markdown)).toBeNull();
  });
});

describe("stripMarkdownFence", () => {
  it("removes fenced markdown wrappers", () => {
    const fenced = "```markdown\n# Title\n\nBody\n```";
    expect(stripMarkdownFence(fenced)).toBe("# Title\n\nBody");
  });

  it("leaves unfenced text unchanged", () => {
    const plain = "# Title\n\nBody";
    expect(stripMarkdownFence(plain)).toBe(plain);
  });
});

describe("uniqueSlug", () => {
  it("returns base slug when not taken", () => {
    expect(uniqueSlug("topic", tmpNotesDir)).toBe("topic");
  });

  it("appends numeric suffix when collisions exist", () => {
    fs.writeFileSync(path.join(tmpNotesDir, "topic.md"), "# first");
    fs.writeFileSync(path.join(tmpNotesDir, "topic-2.md"), "# second");

    expect(uniqueSlug("topic", tmpNotesDir)).toBe("topic-3");
  });
});

describe("deriveSlug", () => {
  it("prefers frontmatter title and applies collision handling", () => {
    fs.writeFileSync(path.join(tmpNotesDir, "from-title.md"), "# existing");

    const markdown = `---
title: "From Title"
date: 2026-02-19
---

# From Title`;

    expect(deriveSlug(markdown, "ignored.txt", tmpNotesDir)).toBe("from-title-2");
  });

  it("falls back to original filename when title is missing", () => {
    const markdown = `---
date: 2026-02-19
---

# Untitled`;

    expect(deriveSlug(markdown, "My Input File.txt", tmpNotesDir)).toBe(
      "my-input-file"
    );
  });

  it("falls back to timestamp when title and filename cannot be slugified", () => {
    const markdown = "No frontmatter";
    const slug = deriveSlug(markdown, "!!!.txt", tmpNotesDir);
    expect(slug).toMatch(/^note-\d{4}-\d{2}-\d{2}T/);
  });
});

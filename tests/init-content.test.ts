import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// @ts-expect-error — .mjs module, no type declarations
import { initContent, SEEDS } from "../scripts/init-content.mjs";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "init-content-test-"));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe("initContent — fresh root (no content dir)", () => {
  it("creates content/notes and content/templates directories", () => {
    initContent(tmpRoot);

    expect(fs.existsSync(path.join(tmpRoot, "content", "notes"))).toBe(true);
    expect(fs.existsSync(path.join(tmpRoot, "content", "templates"))).toBe(true);
  });

  it("seeds one .md file per directory", () => {
    initContent(tmpRoot);

    for (const seed of SEEDS) {
      const seedPath = path.join(tmpRoot, seed.dir, seed.filename);
      expect(fs.existsSync(seedPath), `Missing seed: ${seed.dir}/${seed.filename}`).toBe(true);
    }
  });

  it("seeded notes file contains valid frontmatter markers", () => {
    initContent(tmpRoot);

    const noteSeed = SEEDS.find((s: { dir: string }) => s.dir === "content/notes");
    const content = fs.readFileSync(path.join(tmpRoot, noteSeed.dir, noteSeed.filename), "utf8");

    expect(content).toMatch(/^---/);
    expect(content).toMatch(/title:/);
    expect(content).toMatch(/tags:/);
    expect(content).toMatch(/date:/);
  });

  it("seeded template file contains placeholder tokens", () => {
    initContent(tmpRoot);

    const tmplSeed = SEEDS.find((s: { dir: string }) => s.dir === "content/templates");
    const content = fs.readFileSync(path.join(tmpRoot, tmplSeed.dir, tmplSeed.filename), "utf8");

    expect(content).toContain("{{title}}");
    expect(content).toContain("{{date}}");
  });
});

describe("initContent — idempotent (existing content)", () => {
  it("does not overwrite an existing file in content/notes", () => {
    const notesDir = path.join(tmpRoot, "content", "notes");
    fs.mkdirSync(notesDir, { recursive: true });

    const existingPath = path.join(notesDir, "my-note.md");
    const originalContent = "# My existing note\n\nDo not overwrite me.";
    fs.writeFileSync(existingPath, originalContent, "utf8");

    initContent(tmpRoot);

    expect(fs.readFileSync(existingPath, "utf8")).toBe(originalContent);
  });

  it("does not overwrite an existing file in content/templates", () => {
    const tmplDir = path.join(tmpRoot, "content", "templates");
    fs.mkdirSync(tmplDir, { recursive: true });

    const existingPath = path.join(tmplDir, "my-template.md");
    const originalContent = "# My existing template";
    fs.writeFileSync(existingPath, originalContent, "utf8");

    initContent(tmpRoot);

    expect(fs.readFileSync(existingPath, "utf8")).toBe(originalContent);
  });

  it("skips seeding when a directory already has .md files", () => {
    const notesDir = path.join(tmpRoot, "content", "notes");
    fs.mkdirSync(notesDir, { recursive: true });
    fs.writeFileSync(path.join(notesDir, "existing.md"), "# Existing", "utf8");

    initContent(tmpRoot);

    const noteSeed = SEEDS.find((s: { dir: string }) => s.dir === "content/notes");
    const seedPath = path.join(tmpRoot, noteSeed.dir, noteSeed.filename);
    expect(fs.existsSync(seedPath)).toBe(false);
  });

  it("is safe to call multiple times on the same directory", () => {
    initContent(tmpRoot);
    initContent(tmpRoot);

    // Still exactly one file per seeded directory
    for (const seed of SEEDS) {
      const dir = path.join(tmpRoot, seed.dir);
      const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(".md"));
      expect(files.length).toBe(1);
    }
  });
});

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getAllTags,
  getNoteSlugs,
  getTemplateSlugs,
} from "@/lib/notes";

const OUT_DIR = path.join(process.cwd(), "out");

const buildExists = fs.existsSync(OUT_DIR);

describe.skipIf(!buildExists)("link integrity (requires build)", () => {
  it("every note slug has a corresponding HTML file in out/", () => {
    getNoteSlugs().forEach((slug) => {
      const htmlPath = path.join(OUT_DIR, "notes", `${slug}.html`);
      expect(fs.existsSync(htmlPath), `Missing: ${htmlPath}`).toBe(true);
    });
  });

  it("every template slug has a corresponding HTML file in out/", () => {
    getTemplateSlugs().forEach((slug) => {
      const htmlPath = path.join(OUT_DIR, "templates", `${slug}.html`);
      expect(fs.existsSync(htmlPath), `Missing: ${htmlPath}`).toBe(true);
    });
  });

  it("every tag has a corresponding HTML file in out/", () => {
    getAllTags().forEach((tag) => {
      const htmlPath = path.join(OUT_DIR, "tags", `${tag}.html`);
      expect(fs.existsSync(htmlPath), `Missing: ${htmlPath}`).toBe(true);
    });
  });

  it("index.html exists", () => {
    expect(fs.existsSync(path.join(OUT_DIR, "index.html"))).toBe(true);
  });

  it("tags.html exists", () => {
    expect(fs.existsSync(path.join(OUT_DIR, "tags.html"))).toBe(true);
  });

  it("templates.html exists", () => {
    expect(fs.existsSync(path.join(OUT_DIR, "templates.html"))).toBe(true);
  });

  it("internal links in index.html point to existing files", () => {
    const html = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf8");
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)]
      .map((m) => m[1])
      .filter((h) => h.startsWith("/") && !h.startsWith("/_next") && !h.startsWith("/favicon"));

    const unique = [...new Set(hrefs)];

    unique.forEach((href) => {
      const filePath =
        href === "/"
          ? path.join(OUT_DIR, "index.html")
          : path.join(OUT_DIR, `${href}.html`);
      expect(fs.existsSync(filePath), `Broken link: ${href} -> ${filePath}`).toBe(true);
    });
  });
});

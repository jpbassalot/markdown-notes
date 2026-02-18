import { describe, expect, it } from "vitest";

import {
  getAllDocs,
  getAllNotes,
  getAllTags,
  getAllTemplates,
  getDocsByTag,
  getNoteBySlug,
  getNoteSlugs,
  getTemplateBySlug,
  getTemplateSlugs,
} from "@/lib/notes";

describe("getNoteSlugs", () => {
  it("returns an array of slug strings", () => {
    const slugs = getNoteSlugs();
    expect(Array.isArray(slugs)).toBe(true);
    expect(slugs.length).toBeGreaterThan(0);
    slugs.forEach((s) => expect(typeof s).toBe("string"));
  });

  it("slugs have no .md extension", () => {
    getNoteSlugs().forEach((s) => {
      expect(s).not.toMatch(/\.md$/);
    });
  });
});

describe("getTemplateSlugs", () => {
  it("returns an array of slug strings", () => {
    const slugs = getTemplateSlugs();
    expect(slugs.length).toBeGreaterThan(0);
  });
});

describe("getAllNotes", () => {
  it("returns DocSummary objects with required fields", () => {
    const notes = getAllNotes();
    expect(notes.length).toBeGreaterThan(0);

    notes.forEach((note) => {
      expect(note).toHaveProperty("slug");
      expect(note).toHaveProperty("title");
      expect(note).toHaveProperty("tags");
      expect(note).toHaveProperty("excerpt");
      expect(note.type).toBe("note");
      expect(Array.isArray(note.tags)).toBe(true);
    });
  });

  it("excerpt is 180 characters or fewer", () => {
    getAllNotes().forEach((note) => {
      expect(note.excerpt.length).toBeLessThanOrEqual(180);
    });
  });
});

describe("getAllTemplates", () => {
  it("returns templates with type 'template'", () => {
    const templates = getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => expect(t.type).toBe("template"));
  });
});

describe("getAllDocs", () => {
  it("returns combined notes and templates sorted by title", () => {
    const docs = getAllDocs();
    const notes = getAllNotes();
    const templates = getAllTemplates();

    expect(docs.length).toBe(notes.length + templates.length);

    for (let i = 1; i < docs.length; i++) {
      expect(docs[i - 1].title.localeCompare(docs[i].title)).toBeLessThanOrEqual(0);
    }
  });
});

describe("getNoteBySlug", () => {
  it("returns a full note with contentHtml for a valid slug", async () => {
    const slugs = getNoteSlugs();
    const note = await getNoteBySlug(slugs[0]);

    expect(note).not.toBeNull();
    expect(note!.contentHtml).toBeTruthy();
    expect(note!.contentHtml).toContain("<");
  });

  it("returns null for a nonexistent slug", async () => {
    const result = await getNoteBySlug("this-slug-does-not-exist");
    expect(result).toBeNull();
  });

  it("returns null for an invalid slug (path traversal)", async () => {
    const result = await getNoteBySlug("../etc/passwd");
    expect(result).toBeNull();
  });
});

describe("getTemplateBySlug", () => {
  it("returns a full template with contentHtml for a valid slug", async () => {
    const slugs = getTemplateSlugs();
    const template = await getTemplateBySlug(slugs[0]);

    expect(template).not.toBeNull();
    expect(template!.contentHtml).toBeTruthy();
  });

  it("returns null for a nonexistent slug", async () => {
    const result = await getTemplateBySlug("nonexistent-template");
    expect(result).toBeNull();
  });
});

describe("date parsing", () => {
  it("reads 'date' frontmatter field as updatedAt", async () => {
    const note = await getNoteBySlug("identity");
    expect(note).not.toBeNull();
    expect(note!.updatedAt).toBe("2026-02-18");
  });
});

describe("getAllTags", () => {
  it("returns a sorted array of unique tag strings", () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(0);

    tags.forEach((t) => {
      expect(typeof t).toBe("string");
      expect(t).toMatch(/^[a-z0-9-_]+$/);
    });

    for (let i = 1; i < tags.length; i++) {
      expect(tags[i - 1].localeCompare(tags[i])).toBeLessThanOrEqual(0);
    }
  });
});

describe("getDocsByTag", () => {
  it("returns docs that include the given tag", () => {
    const tags = getAllTags();
    const tag = tags[0];
    const docs = getDocsByTag(tag);

    expect(docs.length).toBeGreaterThan(0);
    docs.forEach((doc) => {
      expect(doc.tags).toContain(tag);
    });
  });

  it("returns empty array for a nonexistent tag", () => {
    const docs = getDocsByTag("zzz-nonexistent-tag");
    expect(docs).toEqual([]);
  });
});

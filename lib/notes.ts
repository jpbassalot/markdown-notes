import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const NOTES_DIR = path.join(process.cwd(), "content/notes");
const TEMPLATES_DIR = path.join(process.cwd(), "content/templates");

type DocType = "note" | "template";

type Frontmatter = {
  title?: string;
  tags?: string[] | string;
  date?: string | Date;
  updatedAt?: string | Date;
};

export type DocSummary = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  updatedAt?: string;
  type: DocType;
};

export type DocDetail = DocSummary & {
  contentHtml: string;
};

function listMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
}

function toSlug(fileName: string): string {
  return fileName.replace(/\.md$/, "");
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-_]*$/i.test(slug);
}

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function parseTags(input: Frontmatter["tags"]): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map(normalizeTag).filter(Boolean);
  }

  return input
    .split(",")
    .map(normalizeTag)
    .filter(Boolean);
}

function parseDocFromFile(filePath: string, type: DocType): Omit<DocSummary, "excerpt"> & { rawContent: string } {
  const file = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(file);
  const frontmatter = data as Frontmatter;
  const slug = toSlug(path.basename(filePath));

  const rawDate = frontmatter.updatedAt ?? frontmatter.date;

  return {
    slug,
    title: frontmatter.title?.trim() || slug,
    tags: parseTags(frontmatter.tags),
    updatedAt:
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : rawDate,
    type,
    rawContent: content,
  };
}

function createExcerpt(markdown: string): string {
  const plain = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // strip images entirely
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links: keep display text, drop URL
    .replace(/```[\s\S]*?```/gm, "") // fenced code blocks
    .replace(/`[^`]+`/g, "") // inline code
    .replace(/^#{1,6}\s*/gm, "") // heading markers
    .replace(/[>*_~]/g, "") // blockquotes, emphasis, strikethrough
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 180 ? `${plain.slice(0, 177)}...` : plain;
}

function getAllFromDirectory(dir: string, type: DocType): DocSummary[] {
  return listMarkdownFiles(dir).map((fileName) => {
    const fullPath = path.join(dir, fileName);
    const parsed = parseDocFromFile(fullPath, type);

    return {
      slug: parsed.slug,
      title: parsed.title,
      tags: parsed.tags,
      updatedAt: parsed.updatedAt,
      excerpt: createExcerpt(parsed.rawContent),
      type,
    };
  });
}

function getDocFromDirectory(
  dir: string,
  slug: string,
  type: DocType,
): (Omit<DocSummary, "excerpt"> & { rawContent: string }) | null {
  if (!isValidSlug(slug)) {
    return null;
  }

  const fullPath = path.join(dir, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return parseDocFromFile(fullPath, type);
}

async function markdownToHtml(markdown: string): Promise<string> {
  // Keep sanitization explicit to avoid accidental unsafe config changes.
  const rendered = await remark().use(html, { sanitize: true }).process(markdown);
  return rendered.toString();
}

export function getNoteSlugs(): string[] {
  return listMarkdownFiles(NOTES_DIR).map(toSlug);
}

export function getTemplateSlugs(): string[] {
  return listMarkdownFiles(TEMPLATES_DIR).map(toSlug);
}

export function getAllNotes(): DocSummary[] {
  return getAllFromDirectory(NOTES_DIR, "note");
}

export function getAllTemplates(): DocSummary[] {
  return getAllFromDirectory(TEMPLATES_DIR, "template");
}

export function getAllDocs(): DocSummary[] {
  return [...getAllNotes(), ...getAllTemplates()].sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

export async function getNoteBySlug(slug: string): Promise<DocDetail | null> {
  const parsed = getDocFromDirectory(NOTES_DIR, slug, "note");
  if (!parsed) return null;

  return {
    slug: parsed.slug,
    title: parsed.title,
    tags: parsed.tags,
    updatedAt: parsed.updatedAt,
    excerpt: createExcerpt(parsed.rawContent),
    type: parsed.type,
    contentHtml: await markdownToHtml(parsed.rawContent),
  };
}

export async function getTemplateBySlug(slug: string): Promise<DocDetail | null> {
  const parsed = getDocFromDirectory(TEMPLATES_DIR, slug, "template");
  if (!parsed) return null;

  return {
    slug: parsed.slug,
    title: parsed.title,
    tags: parsed.tags,
    updatedAt: parsed.updatedAt,
    excerpt: createExcerpt(parsed.rawContent),
    type: parsed.type,
    contentHtml: await markdownToHtml(parsed.rawContent),
  };
}

export function getAllTags(): string[] {
  return Array.from(new Set(getAllDocs().flatMap((doc) => doc.tags))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getDocsByTag(tag: string): DocSummary[] {
  const normalizedTag = normalizeTag(tag);
  return getAllDocs().filter((doc) => doc.tags.includes(normalizedTag));
}

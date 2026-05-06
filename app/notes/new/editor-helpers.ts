export function buildInitialContent(date: string): string {
  return `---\ntitle: New Note Stub\ntags:\n  - example-tag\ndate: ${date}\n---\n\n`;
}

function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : "";
}

export function parseTagsFromContent(content: string): string[] {
  const fm = extractFrontmatter(content);
  const match = fm.match(/^tags:\n((?:  - [^\n]*\n?)*)/m);
  if (!match) return [];
  return match[1]
    .split("\n")
    .filter((line) => line.startsWith("  - "))
    .map((line) => line.slice(4).trim())
    .filter(Boolean);
}

export function addTagToContent(content: string, tag: string): string {
  const fm = extractFrontmatter(content);
  if (!fm) return content;

  const updatedFm = fm.replace(
    /(^tags:\n(?:  - [^\n]*\n?)*)/m,
    (match) => (match.endsWith("\n") ? match : `${match}\n`) + `  - ${tag}\n`
  );

  return content.replace(/^---\n[\s\S]*?\n---/, `---\n${updatedFm}\n---`);
}

export function removeTagFromContent(content: string, tag: string): string {
  const fm = extractFrontmatter(content);
  if (!fm) return content;

  const updatedFm = fm.replace(new RegExp(`  - ${escapeRegex(tag)}\\n?`, "m"), "");

  return content.replace(/^---\n[\s\S]*?\n---/, `---\n${updatedFm}\n---`);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function slugifyTag(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

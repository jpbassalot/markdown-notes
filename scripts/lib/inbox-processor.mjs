/**
 * inbox-processor.mjs
 *
 * Handles the full lifecycle of a single inbox file:
 *   1. Read the file as text
 *   2. Call note-generator to get a formatted note
 *   3. Parse the frontmatter title to derive the output slug
 *   4. Write the note to content/notes/<slug>.md (with collision handling)
 *   5. Move the original to .processed/ on success, or .failed/ on error
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { generateNote } from "./note-generator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const NOTES_DIR = path.join(PROJECT_ROOT, "content/notes");
const MAX_INPUT_BYTES = 100 * 1024;
const LOG_PREFIX = "[watch-inbox]";

/**
 * Convert a string to a URL-safe slug.
 * @param {string} str
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")    // remove non-alphanumeric (except space/hyphen)
    .trim()
    .replace(/[\s]+/g, "-")          // spaces → hyphens
    .replace(/-+/g, "-")             // collapse runs of hyphens
    .replace(/^-|-$/g, "");          // strip leading/trailing hyphens
}

/**
 * Extract the `title` field from YAML frontmatter, if present.
 * @param {string} markdown
 * @returns {string|null}
 */
export function extractTitle(markdown) {
  const { data } = matter(markdown);
  if (typeof data.title !== "string") return null;
  const title = data.title.trim();
  return title || null;
}

/**
 * Return a slug that doesn't collide with existing notes.
 * Appends -2, -3, ... until unique.
 * @param {string} base
 */
export function uniqueSlug(base, notesDir = NOTES_DIR) {
  let slug = base;
  let counter = 2;
  while (fs.existsSync(path.join(notesDir, `${slug}.md`))) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

/**
 * Derive the output slug for a generated note.
 * Priority: frontmatter title → original filename → timestamp fallback.
 * @param {string} generatedMarkdown
 * @param {string} originalFilename
 */
export function deriveSlug(generatedMarkdown, originalFilename, notesDir = NOTES_DIR) {
  // 1. Try frontmatter title
  const title = extractTitle(generatedMarkdown);
  if (title) {
    const s = slugify(title);
    if (s) return uniqueSlug(s, notesDir);
  }

  // 2. Try original filename (strip extension)
  const base = path.basename(originalFilename, path.extname(originalFilename));
  const s = slugify(base);
  if (s) return uniqueSlug(s, notesDir);

  // 3. Fallback to timestamp
  return uniqueSlug(
    `note-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    notesDir
  );
}

/**
 * Ensure a directory exists (create recursively if needed).
 * @param {string} dir
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Move a file, creating the destination directory if needed.
 * @param {string} src
 * @param {string} dest
 */
function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
}

/**
 * Process a single inbox file end-to-end.
 * @param {string} filePath  Absolute path to the inbox file
 */
export async function processInboxFile(filePath) {
  const filename = path.basename(filePath);
  const inboxDir = path.dirname(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  console.log(`${LOG_PREFIX} Processing: ${filename}`);

  let rawText;
  try {
    rawText = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to read ${filename}:`, err.message);
    return;
  }

  try {
    const inputSizeBytes = Buffer.byteLength(rawText, "utf8");
    if (inputSizeBytes > MAX_INPUT_BYTES) {
      throw new Error(
        `Input too large (${inputSizeBytes} bytes). Max allowed is ${MAX_INPUT_BYTES} bytes`
      );
    }

    // Generate the note via LLM
    const generatedMarkdown = await generateNote(filename, rawText);

    // Derive slug and write to content/notes/
    ensureDir(NOTES_DIR);
    const slug = deriveSlug(generatedMarkdown, filename, NOTES_DIR);
    const outputPath = path.join(NOTES_DIR, `${slug}.md`);

    fs.writeFileSync(outputPath, generatedMarkdown, "utf8");
    console.log(`${LOG_PREFIX} Written: content/notes/${slug}.md`);

    // Archive the original
    const processedDir = path.join(inboxDir, ".processed");
    const archivePath = path.join(processedDir, `${timestamp}-${filename}`);
    moveFile(filePath, archivePath);
    console.log(`${LOG_PREFIX} Archived to .processed/${timestamp}-${filename}`);
  } catch (err) {
    console.error(`${LOG_PREFIX} Error processing ${filename}:`, err.message);

    // Move to .failed/ and write an error log
    try {
      const failedDir = path.join(inboxDir, ".failed");
      const failedPath = path.join(failedDir, `${timestamp}-${filename}`);
      const errorPath = `${failedPath}.error`;

      moveFile(filePath, failedPath);

      const errorDetails = [
        `File: ${filename}`,
        `Time: ${new Date().toISOString()}`,
        `Error: ${err.message}`,
        err.stack ? `\nStack:\n${err.stack}` : "",
      ].join("\n");

      fs.writeFileSync(errorPath, errorDetails, "utf8");
      console.error(`${LOG_PREFIX} Moved to .failed/ with error log`);
    } catch (archiveErr) {
      console.error(
        `${LOG_PREFIX} Also failed to archive to .failed/:`,
        archiveErr.message
      );
    }
  }
}

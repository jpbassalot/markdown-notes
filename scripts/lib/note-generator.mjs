/**
 * note-generator.mjs
 *
 * Builds the LLM prompt from live project files, calls the LLM, and returns
 * the raw markdown string for the generated note.
 *
 * Context loaded at runtime (nothing hardcoded):
 *   - README.md              project overview
 *   - docs/note-format.md    editable format guide
 *   - content/notes/*.md     up to 3 newest real examples
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callLLM } from "./llm-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../..");

/**
 * Read a file from the project root. Returns empty string if missing.
 * @param {string} relPath
 */
function readProjectFile(relPath) {
  const absPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(absPath)) return "";
  return fs.readFileSync(absPath, "utf8");
}

/**
 * Return the raw markdown of up to `limit` most-recently-modified notes.
 * @param {number} limit
 */
function loadExampleNotes(limit = 3) {
  const notesDir = path.join(PROJECT_ROOT, "content/notes");
  if (!fs.existsSync(notesDir)) return [];

  const files = fs
    .readdirSync(notesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const absPath = path.join(notesDir, f);
      return { name: f, mtime: fs.statSync(absPath).mtimeMs, absPath };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);

  return files.map(({ name, absPath }) => ({
    name,
    content: fs.readFileSync(absPath, "utf8"),
  }));
}

/**
 * Build the system prompt by assembling project context from disk.
 */
function buildSystemPrompt() {
  const readme = readProjectFile("README.md");
  const formatGuide = readProjectFile("docs/note-format.md");
  const examples = loadExampleNotes(3);

  const exampleSection =
    examples.length > 0
      ? examples
          .map(
            ({ name, content }) =>
              `### Example: ${name}\n\n\`\`\`md\n${content.trim()}\n\`\`\``
          )
          .join("\n\n")
      : "_No existing notes found — rely on the format guide above._";

  return `You are a note-writing assistant for a markdown notes application.
Your job is to take raw input text and transform it into a properly-formatted
markdown note file for this project.

OUTPUT REQUIREMENTS:
- Output ONLY a complete markdown file — nothing else.
- The file must begin with valid YAML frontmatter (title, date, tags).
- Do NOT wrap the output in a code fence. Output raw markdown directly.
- Infer the title, tags, and date from the content. Use today's date if no date is apparent.
- Preserve all meaning and facts from the original input.
- Format using the note format guide provided below.

---

## Project Overview

${readme}

---

## Note Format Guide

${formatGuide}

---

## Real Note Examples from This Project

${exampleSection}`;
}

/**
 * Generate a formatted note from raw input text.
 *
 * @param {string} filename  Original filename (used in the user message for context)
 * @param {string} rawText   Raw contents of the dropped file
 * @returns {Promise<string>} Complete markdown string for the new note
 */
export async function generateNote(filename, rawText) {
  const systemPrompt = buildSystemPrompt();

  const userMessage =
    `Original filename: ${filename}\n\n` +
    `--- BEGIN CONTENT ---\n${rawText}\n--- END CONTENT ---`;

  const rawResponse = await callLLM(systemPrompt, userMessage);

  // Strip optional ```markdown ... ``` fences the LLM might add despite instructions
  return stripMarkdownFence(rawResponse.trim());
}

/**
 * Remove opening/closing markdown code fences if present.
 * @param {string} text
 */
export function stripMarkdownFence(text) {
  // Match ```markdown or ``` at start, and ``` at end
  const fenced = /^```(?:markdown)?\n([\s\S]*?)```$/;
  const match = text.match(fenced);
  return match ? match[1].trim() : text;
}

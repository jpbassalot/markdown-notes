"use client";

import { useState } from "react";
import Link from "next/link";
import { saveNote } from "./actions";

// ── frontmatter helpers (exported for testing) ─────────────────────────────────

export function buildInitialContent(date: string): string {
  return `---\ntitle: New Note Stub\ntags:\n  - example-tag\ndate: ${date}\n---\n\n`;
}

/**
 * Extract the frontmatter block (between the first pair of `---` fences).
 * Returns empty string when no valid frontmatter is found.
 */
function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : "";
}

/** Read tag lines from the frontmatter tags block only. */
export function parseTagsFromContent(content: string): string[] {
  const fm = extractFrontmatter(content);
  const match = fm.match(/^tags:\n((?:  - [^\n]*\n?)*)/m);
  if (!match) return [];
  return match[1]
    .split("\n")
    .filter((l) => l.startsWith("  - "))
    .map((l) => l.slice(4).trim())
    .filter(Boolean);
}

/** Append a tag to the frontmatter tags block. */
export function addTagToContent(content: string, tag: string): string {
  const fm = extractFrontmatter(content);
  if (!fm) return content;

  const updatedFm = fm.replace(
    /(^tags:\n(?:  - [^\n]*\n?)*)/m,
    (m) => (m.endsWith("\n") ? m : m + "\n") + `  - ${tag}\n`
  );

  return content.replace(
    /^---\n[\s\S]*?\n---/,
    `---\n${updatedFm}\n---`
  );
}

/** Remove a specific tag from the frontmatter tags block. */
export function removeTagFromContent(content: string, tag: string): string {
  const fm = extractFrontmatter(content);
  if (!fm) return content;

  const updatedFm = fm.replace(
    new RegExp(`  - ${escapeRegex(tag)}\\n?`, "m"),
    ""
  );

  return content.replace(
    /^---\n[\s\S]*?\n---/,
    `---\n${updatedFm}\n---`
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

// ── component ──────────────────────────────────────────────────────────────────

export default function NewNotePage() {
  const today = new Date().toISOString().split("T")[0];

  const [content, setContent] = useState(() => buildInitialContent(today));
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const currentTags = parseTagsFromContent(content);

  // ── tag pill handlers ──────────────────────────────────────────────────────

  function commitTag() {
    const tag = slugifyTag(tagInput);
    if (!tag || currentTags.includes(tag)) {
      setTagInput("");
      return;
    }
    setContent((prev) => addTagToContent(prev, tag));
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === " ") {
      e.preventDefault();
      commitTag();
    }
  }

  function handleRemoveTag(tag: string) {
    setContent((prev) => removeTagFromContent(prev, tag));
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setStatus("saving");
    setErrorMsg("");
    const result = await saveNote(content);
    if (result.success) {
      setStatus("saved");
      setContent(buildInitialContent(new Date().toISOString().split("T")[0]));
      setTagInput("");
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Unknown error");
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-600 hover:underline">
        ← Back to notes
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">New Note</h1>

      <div className="mt-6 space-y-5">
        {/* Primary markdown textarea */}
        <div>
          <label
            htmlFor="note-content"
            className="block text-sm font-medium text-slate-700"
          >
            Content
          </label>
          <textarea
            id="note-content"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
            rows={22}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Tag input with pill display */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Tags</label>
          <div className="mt-1 flex min-h-9 flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 focus-within:border-slate-500">
            {currentTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="ml-0.5 leading-none text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type a tag and press Space…"
              className="min-w-40 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Press Space to add a tag. Tags sync with the frontmatter above.
          </p>
        </div>

        {/* Status feedback */}
        {status === "saved" && (
          <p className="text-sm font-medium text-green-700">
            Note saved — ingestion triggered successfully.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-700">
            <span className="font-medium">Error:</span> {errorMsg}
          </p>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === "saving"}
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save Note"}
        </button>
      </div>
    </main>
  );
}

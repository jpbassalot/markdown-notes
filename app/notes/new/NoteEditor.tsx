"use client";

import { useState } from "react";
import Link from "next/link";

import {
  addTagToContent,
  buildInitialContent,
  parseTagsFromContent,
  removeTagFromContent,
  slugifyTag,
} from "./editor-helpers";

type SaveResult = {
  success: boolean;
  error?: string;
};

type Props = {
  onSave?: (content: string) => Promise<SaveResult>;
  unavailableMessage?: string;
};

export default function NoteEditor({ onSave, unavailableMessage }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [content, setContent] = useState(() => buildInitialContent(today));
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const currentTags = parseTagsFromContent(content);

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

  async function handleSubmit() {
    if (!onSave) {
      setStatus("error");
      setErrorMsg(unavailableMessage ?? "Saving is unavailable in this build.");
      return;
    }

    setStatus("saving");
    setErrorMsg("");
    const result = await onSave(content);
    if (result.success) {
      setStatus("saved");
      setContent(buildInitialContent(new Date().toISOString().split("T")[0]));
      setTagInput("");
      return;
    }

    setStatus("error");
    setErrorMsg(result.error ?? "Unknown error");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-600 hover:underline">
        ← Back to notes
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">New Note</h1>

      <div className="mt-6 space-y-5">
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

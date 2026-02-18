"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import Fuse from "fuse.js";

type SearchDoc = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  type: "note" | "template";
  href: string;
};

type Props = {
  docs: SearchDoc[];
};

export default function SearchableDocs({ docs }: Props) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(docs, {
        threshold: 0.35,
        ignoreLocation: true,
        keys: [
          { name: "title", weight: 3 },
          { name: "tags", weight: 2 },
          { name: "excerpt", weight: 1 },
        ],
      }),
    [docs],
  );

  const filteredDocs = useMemo(() => {
    if (!query.trim()) return docs;
    return fuse.search(query.trim()).map((result) => result.item);
  }, [docs, fuse, query]);

  const isFiltered = query.trim().length > 0;

  return (
    <section aria-label="Search and browse documents" className="space-y-4">
      <label className="block text-sm font-medium text-slate-700" htmlFor="search">
        Search notes and templates
      </label>
      <div className="relative">
        <input
          id="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, tag, or content…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
          aria-controls="doc-list"
        />
        {isFiltered ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            ✕
          </button>
        ) : null}
      </div>

      <p aria-live="polite" aria-atomic="true" className="text-xs text-slate-500">
        {isFiltered
          ? `${filteredDocs.length} result${filteredDocs.length !== 1 ? "s" : ""} for "${query.trim()}"`
          : `${docs.length} document${docs.length !== 1 ? "s" : ""}`}
      </p>

      <ul id="doc-list" className="space-y-3">
        {filteredDocs.map((doc) => (
          <li key={`${doc.type}-${doc.slug}`} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href={doc.href} className="text-lg font-semibold text-slate-900 hover:underline">
                {doc.title}
              </Link>
              <span
                aria-label={`Type: ${doc.type}`}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs uppercase tracking-wide text-slate-600"
              >
                {doc.type}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{doc.excerpt}</p>
            {doc.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <Link
                    key={`${doc.slug}-${tag}`}
                    href={`/tags/${tag}`}
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {filteredDocs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          No documents matched &ldquo;{query}&rdquo;.
        </p>
      ) : null}
    </section>
  );
}

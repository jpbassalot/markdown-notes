import Link from "next/link";

import { getAllDocs, getAllTags } from "@/lib/notes";

export const metadata = {
  title: "Tags | Notes",
  description: "Browse notes and templates by tag.",
};

export default function TagsPage() {
  const tags = getAllTags();
  const docs = getAllDocs();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-600 hover:underline">
        ← Back to notes
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Tags</h1>
      <p className="mt-2 text-slate-600">Browse notes and templates by tag.</p>

      {tags.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          No tags found.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {tags.map((tag) => {
            const count = docs.filter((doc) => doc.tags.includes(tag)).length;

            return (
              <li key={tag}>
                <Link
                  href={`/tags/${tag}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <span className="font-medium text-slate-900">#{tag}</span>
                  <span aria-label={`${count} document${count !== 1 ? "s" : ""}`} className="text-sm text-slate-500">
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

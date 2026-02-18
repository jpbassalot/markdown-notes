import Link from "next/link";

import SearchableDocs from "@/app/components/searchable-docs";
import { getAllDocs } from "@/lib/notes";

export default function Home() {
  const docs = getAllDocs().map((doc) => ({
    ...doc,
    href: doc.type === "note" ? `/notes/${doc.slug}` : `/templates/${doc.slug}`,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-slate-50 px-6 py-10 text-slate-900">
      <header className="mb-8 space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Static Knowledge Base</p>
        <h1 className="text-3xl font-bold">Markdown Notes</h1>
        <p className="text-slate-600">
          Obsidian-style static notes with tags, templates, and fuzzy search.
        </p>
        <nav className="flex gap-4 text-sm">
          <Link href="/tags" className="font-medium text-slate-700 hover:underline">
            Browse tags
          </Link>
          <Link href="/templates" className="font-medium text-slate-700 hover:underline">
            Browse templates
          </Link>
        </nav>
      </header>

      <SearchableDocs docs={docs} />
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { getAllTags, getDocsByTag } from "@/lib/notes";

type Props = {
  params: Promise<{ tag: string }>;
};

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  return {
    title: `#${tag} | Tags`,
    description: `Notes and templates tagged with "${tag}".`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const docs = getDocsByTag(tag);

  if (docs.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <Link href="/tags" className="text-sm text-slate-600 hover:underline">
        ← Back to tags
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">#{tag}</h1>

      <ul className="mt-8 space-y-3">
        {docs.map((doc) => (
          <li key={`${doc.type}-${doc.slug}`} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={doc.type === "note" ? `/notes/${doc.slug}` : `/templates/${doc.slug}`}
                className="text-lg font-semibold text-slate-900 hover:underline"
              >
                {doc.title}
              </Link>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs uppercase tracking-wide text-slate-600">
                {doc.type}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{doc.excerpt}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

export const dynamicParams = false;

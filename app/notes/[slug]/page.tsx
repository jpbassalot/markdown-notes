import Link from "next/link";
import { notFound } from "next/navigation";

import { getNoteBySlug, getNoteSlugs } from "@/lib/notes";
import DeleteNoteButton from "./DeleteNoteButton";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getNoteSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    return {
      title: "Note | Notes",
    };
  }

  return {
    title: `${note.title} | Notes`,
    description: note.excerpt,
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Back to notes
        </Link>
        <DeleteNoteButton slug={slug} />
      </div>

      <article className="prose prose-slate mt-6 max-w-none">
        <h1>{note.title}</h1>
        {note.updatedAt ? <p className="text-sm text-slate-500">Updated {note.updatedAt}</p> : null}

        <div className="not-prose mt-4 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div dangerouslySetInnerHTML={{ __html: note.contentHtml }} className="mt-8" />
      </article>

      {note.backlinks.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Backlinks
          </h2>
          <ul className="mt-3 space-y-3">
            {note.backlinks.map((backlink) => (
              <li key={backlink.slug}>
                <Link
                  href={`/${backlink.type === "note" ? "notes" : "templates"}/${backlink.slug}`}
                  className="text-sm font-medium text-slate-800 hover:underline"
                >
                  {backlink.title}
                </Link>
                {backlink.excerpt && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{backlink.excerpt}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";

import { getTemplateBySlug, getTemplateSlugs } from "@/lib/notes";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getTemplateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) {
    return { title: "Template | Notes" };
  }

  return {
    title: `${template.title} | Templates`,
    description: template.excerpt,
  };
}

export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <Link href="/templates" className="text-sm text-slate-600 hover:underline">
        ← Back to templates
      </Link>

      <article className="prose prose-slate mt-6 max-w-none">
        <h1>{template.title}</h1>
        <p className="text-sm text-slate-500">Template</p>

        <div className="not-prose mt-4 flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div dangerouslySetInnerHTML={{ __html: template.contentHtml }} className="mt-8" />
      </article>

      {template.backlinks.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Backlinks
          </h2>
          <ul className="mt-3 space-y-3">
            {template.backlinks.map((backlink) => (
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

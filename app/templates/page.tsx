import Link from "next/link";

import { getAllTemplates } from "@/lib/notes";

export const metadata = {
  title: "Templates | Notes",
  description: "Reusable markdown templates for your notes.",
};

export default function TemplatesPage() {
  const templates = getAllTemplates();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-600 hover:underline">
        ← Back to notes
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Templates</h1>
      <p className="mt-2 text-slate-600">Reusable markdown templates for your notes.</p>

      {templates.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          No templates found.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {templates.map((template) => (
            <li key={template.slug} className="rounded-lg border border-slate-200 bg-white p-4">
              <Link href={`/templates/${template.slug}`} className="text-lg font-semibold text-slate-900 hover:underline">
                {template.title}
              </Link>
              <p className="mt-2 text-sm text-slate-600">{template.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

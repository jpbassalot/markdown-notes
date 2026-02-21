"use server";

import fs from "node:fs";
import path from "node:path";

const SLUG_RE = /^[a-z0-9][a-z0-9-_]*$/i;

export async function deleteNote(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SLUG_RE.test(slug)) {
      return { success: false, error: "Invalid slug" };
    }

    const filePath = path.join(process.cwd(), "content", "notes", `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Note not found" };
    }

    fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

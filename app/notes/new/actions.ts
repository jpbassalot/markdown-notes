"use server";

import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const MAX_CONTENT_BYTES = 100 * 1024; // 100 KB — mirrors inbox-processor limit
const INGEST_TIMEOUT_MS = 120_000; // 2 minutes for LLM round-trip

export async function saveNote(
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!content || !content.trim()) {
      return { success: false, error: "Content is empty" };
    }

    if (Buffer.byteLength(content, "utf-8") > MAX_CONTENT_BYTES) {
      return {
        success: false,
        error: `Content exceeds ${MAX_CONTENT_BYTES / 1024} KB limit`,
      };
    }

    const inboxDir = path.join(process.cwd(), "content", "inbox");
    fs.mkdirSync(inboxDir, { recursive: true });

    const filename = `note-${Date.now()}.md`;
    fs.writeFileSync(path.join(inboxDir, filename), content, "utf-8");

    await execAsync("npm run ingest", {
      cwd: process.cwd(),
      timeout: INGEST_TIMEOUT_MS,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

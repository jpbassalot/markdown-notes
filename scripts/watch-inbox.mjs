/**
 * watch-inbox.mjs
 *
 * Entry point for the inbox watcher.
 *
 * Usage:
 *   npm run watch          Continuously watch for new files (run with npm run dev)
 *   npm run ingest         Process existing files once, then exit (--once flag)
 *
 * Requires Node.js 20.6+ for --env-file support (used in npm scripts).
 * If .env is missing the script prints a helpful error and exits.
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { processInboxFile } from "./lib/inbox-processor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ALLOWED_EXTENSIONS = new Set([".txt", ".md", ".markdown"]);

// Resolve inbox directory (env override or default)
const INBOX_DIR = path.resolve(
  PROJECT_ROOT,
  process.env.INBOX_DIR || "content/inbox"
);

const ONCE_MODE = process.argv.includes("--once");

// Validate that a provider is configured
const PROVIDER = process.env.LLM_PROVIDER;
if (!PROVIDER) {
  const envExamplePath = path.join(PROJECT_ROOT, ".env.example");
  console.error(
    `[watch-inbox] ERROR: LLM_PROVIDER is not set.\n` +
      `  Copy .env.example to .env and fill in your settings:\n` +
      `    cp ${envExamplePath} ${path.join(PROJECT_ROOT, ".env")}\n` +
      `  Then run with:\n` +
      `    npm run watch   (or npm run ingest)`
  );
  process.exit(1);
}

// Ensure inbox directory exists
if (!fs.existsSync(INBOX_DIR)) {
  fs.mkdirSync(INBOX_DIR, { recursive: true });
  console.log(`[watch-inbox] Created inbox directory: ${INBOX_DIR}`);
}

/** Return all processable files currently in the inbox (skip hidden/dirs). */
function getPendingFiles() {
  return fs
    .readdirSync(INBOX_DIR)
    .filter((f) => !f.startsWith(".") && f !== "README.md")
    .map((f) => path.join(INBOX_DIR, f))
    .filter((f) => fs.statSync(f).isFile())
    .filter((f) => isProcessableFile(f));
}

/**
 * Best-effort binary check: if first 1KB contains a NULL byte, treat as binary.
 * @param {string} filePath
 */
function isBinaryFile(filePath) {
  /** @type {number | null} */
  let fd = null;
  try {
    fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(1024);
    const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
    return buf.subarray(0, bytesRead).includes(0);
  } catch {
    return true;
  } finally {
    if (fd !== null) {
      fs.closeSync(fd);
    }
  }
}

/**
 * Allow only text-like extensions and reject likely-binary contents.
 * @param {string} filePath
 */
function isProcessableFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const displayName = path.basename(filePath);

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    console.warn(
      `[watch-inbox] Skipping ${displayName}: unsupported extension "${ext || "(none)"}"`
    );
    return false;
  }

  if (isBinaryFile(filePath)) {
    console.warn(`[watch-inbox] Skipping ${displayName}: detected binary content`);
    return false;
  }

  return true;
}

if (ONCE_MODE) {
  // --once: process existing files and exit
  const pending = getPendingFiles();
  if (pending.length === 0) {
    console.log(`[watch-inbox] No files to process in ${INBOX_DIR}`);
  } else {
    console.log(
      `[watch-inbox] Processing ${pending.length} file(s) from ${INBOX_DIR}...`
    );
    for (const filePath of pending) {
      await processInboxFile(filePath);
    }
    console.log(`[watch-inbox] Done.`);
  }
} else {
  // Continuous watch mode
  const { default: chokidar } = await import("chokidar");
  let processing = Promise.resolve();

  function enqueueProcessing(filePath) {
    processing = processing
      .then(async () => {
        if (!isProcessableFile(filePath)) return;
        await processInboxFile(filePath);
      })
      .catch((err) => {
        console.error(
          `[watch-inbox] Unexpected queue error for ${path.basename(filePath)}:`,
          err
        );
      });
  }

  // Process any files already sitting in the inbox on startup
  const existing = getPendingFiles();
  if (existing.length > 0) {
    console.log(
      `[watch-inbox] Found ${existing.length} existing file(s) — processing...`
    );
    for (const filePath of existing) {
      enqueueProcessing(filePath);
    }
    await processing;
  }

  const watcher = chokidar.watch(INBOX_DIR, {
    ignored: [
      /(^|[/\\])\../, // hidden files and folders (.processed, .failed, etc.)
      path.join(INBOX_DIR, "README.md"),
    ],
    persistent: true,
    ignoreInitial: true, // we already handled existing files above
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on("add", (filePath) => {
    enqueueProcessing(filePath);
  });

  watcher.on("error", (err) => {
    console.error(`[watch-inbox] Watcher error:`, err);
  });

  console.log(`[watch-inbox] Watching ${INBOX_DIR} for new files...`);
  console.log(`[watch-inbox] Press Ctrl+C to stop.`);
}

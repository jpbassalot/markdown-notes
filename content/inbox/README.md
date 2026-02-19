# Inbox

Drop any text file here and the inbox watcher will automatically convert it
into a properly-formatted note in `content/notes/`.

## How to use

1. Copy `.env.example` → `.env` and fill in your LLM API key
2. Start the watcher (in a separate terminal alongside `npm run dev`):

   ```bash
   npm run watch
   ```

3. Drop any `.txt`, `.md`, or other text file into this folder
4. The watcher picks it up, calls the configured LLM, and writes the result to
   `content/notes/<slug>.md`
5. The original file is moved to `.processed/` on success, or `.failed/` on error

## One-shot mode

To process any files already sitting in the inbox and then exit:

```bash
npm run ingest
```

## What the LLM does

The LLM reads:
- `README.md` — project overview
- `docs/note-format.md` — the note format specification (edit this to change LLM behaviour)
- Up to 3 recent notes from `content/notes/` — live examples

It then transforms your dropped file into a note with valid YAML frontmatter,
inferred title, tags, and date.

## Supported providers

Set `LLM_PROVIDER` in `.env` to one of:

| Value        | Description                          |
|--------------|--------------------------------------|
| `openai`     | OpenAI API (default)                 |
| `anthropic`  | Anthropic Claude API                 |
| `gemini`     | Google Gemini API                    |
| `openrouter` | OpenRouter (access many models)      |
| `ollama`     | Local Ollama instance (no API key)   |

See `.env.example` for all configuration options.

## Folder layout

```
content/inbox/
├── README.md          ← this file
├── .processed/        ← successfully processed originals (auto-created)
└── .failed/           ← failed originals + .error logs (auto-created)
```

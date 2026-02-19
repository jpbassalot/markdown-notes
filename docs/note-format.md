# Note Format Guide

This file defines the expected format for notes in this project. It is read by the
LLM note-generator at runtime — edit it to change how notes are written.

---

## YAML Frontmatter

Every note **must** begin with a YAML frontmatter block. All fields are optional
except `title`.

```yaml
---
title: "My Note Title"
date: 2026-02-19
tags:
  - tag-one
  - tag-two
---
```

### Fields

| Field       | Type            | Description                                              |
|-------------|-----------------|----------------------------------------------------------|
| `title`     | string          | Human-readable title (required). Use title case.        |
| `date`      | YYYY-MM-DD      | Creation date. Infer from content if possible.           |
| `updatedAt` | YYYY-MM-DD      | Last updated date. Use only when different from `date`.  |
| `tags`      | list of strings | Categorisation tags (see tag conventions below).         |

### Tag Naming Conventions

- Lowercase only: `machine-learning` not `MachineLearning`
- Hyphens to separate words: `how-to` not `how_to` or `howto`
- Alphanumeric characters and hyphens only — no spaces or special characters
- Be concise: prefer `api` over `application-programming-interface`
- Reuse existing tags where possible rather than creating near-duplicates

---

## Document Body

After the frontmatter block, the body is standard Markdown:

- Use a single `# H1` heading that matches the frontmatter `title`
- Use `##` and `###` for sections; avoid deeper nesting unless necessary
- Use fenced code blocks with a language hint: ` ```python `
- Keep paragraphs focused — one idea per paragraph

---

## Wiki Links

Reference other notes with Obsidian-style wiki links:

```md
[[other-note]]              links to the note with slug "other-note"
[[other-note|display text]] same link with custom display text
```

The slug is the filename without the `.md` extension. Use wiki links to cross-reference
related notes rather than repeating information.

---

## Full Example

```md
---
title: "Introduction to Retrieval-Augmented Generation"
date: 2026-02-19
tags:
  - ai
  - rag
  - llm
---

# Introduction to Retrieval-Augmented Generation

Retrieval-Augmented Generation (RAG) combines a language model with an external
knowledge base to reduce hallucinations and improve answer accuracy.

## How It Works

1. A user query is embedded into a vector.
2. The vector is compared against a database of pre-embedded documents.
3. The top-k matching chunks are retrieved and injected into the LLM prompt.
4. The LLM generates an answer grounded in the retrieved context.

See also: [[vector-databases]] and [[prompt-engineering]].
```

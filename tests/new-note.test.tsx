import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  addTagToContent,
  buildInitialContent,
  parseTagsFromContent,
  removeTagFromContent,
  slugifyTag,
} from "@/app/notes/new/page";

// ── mock the server action (cannot import "use server" modules in vitest) ──────
vi.mock("@/app/notes/new/actions", () => ({
  saveNote: vi.fn().mockResolvedValue({ success: true }),
}));

// Dynamic import after mock registration so the component picks up the mock
const { default: NewNotePage } = await import("@/app/notes/new/page");
const { saveNote } = await import("@/app/notes/new/actions");

// ── pure helper tests ──────────────────────────────────────────────────────────

describe("buildInitialContent", () => {
  it("inserts the date into frontmatter", () => {
    const content = buildInitialContent("2026-02-20");
    expect(content).toContain("date: 2026-02-20");
  });

  it("contains the default example-tag", () => {
    const content = buildInitialContent("2026-01-01");
    expect(content).toContain("  - example-tag");
  });

  it("opens and closes with --- fences", () => {
    const content = buildInitialContent("2026-01-01");
    expect(content.startsWith("---\n")).toBe(true);
    expect(content).toContain("\n---\n");
  });
});

describe("parseTagsFromContent", () => {
  it("extracts tags from valid frontmatter", () => {
    const content = "---\ntitle: T\ntags:\n  - foo\n  - bar\ndate: 2026-01-01\n---\n\nbody";
    expect(parseTagsFromContent(content)).toEqual(["foo", "bar"]);
  });

  it("returns empty array when no tags block", () => {
    const content = "---\ntitle: T\ndate: 2026-01-01\n---\n\nbody";
    expect(parseTagsFromContent(content)).toEqual([]);
  });

  it("returns empty array when no frontmatter", () => {
    expect(parseTagsFromContent("just plain text")).toEqual([]);
  });

  it("ignores a tags: line in the body (outside frontmatter)", () => {
    const content = "---\ntitle: T\ntags:\n  - real\ndate: 2026-01-01\n---\n\ntags:\n  - fake\n";
    expect(parseTagsFromContent(content)).toEqual(["real"]);
  });
});

describe("addTagToContent", () => {
  it("appends a tag to the frontmatter tags block", () => {
    const before = "---\ntitle: T\ntags:\n  - foo\ndate: 2026-01-01\n---\n\nbody";
    const after = addTagToContent(before, "bar");
    expect(parseTagsFromContent(after)).toEqual(["foo", "bar"]);
  });

  it("preserves body content", () => {
    const before = "---\ntitle: T\ntags:\n  - a\ndate: 2026-01-01\n---\n\nmy body";
    const after = addTagToContent(before, "b");
    expect(after).toContain("my body");
  });

  it("returns content unchanged when no frontmatter", () => {
    const plain = "no frontmatter";
    expect(addTagToContent(plain, "tag")).toBe(plain);
  });
});

describe("removeTagFromContent", () => {
  it("removes a tag from the frontmatter", () => {
    const before = "---\ntitle: T\ntags:\n  - foo\n  - bar\ndate: 2026-01-01\n---\n\nbody";
    const after = removeTagFromContent(before, "foo");
    expect(parseTagsFromContent(after)).toEqual(["bar"]);
  });

  it("does not remove matching text in the body", () => {
    const content = "---\ntitle: T\ntags:\n  - keep\ndate: 2026-01-01\n---\n\n  - keep\n";
    const after = removeTagFromContent(content, "keep");
    // The body line should remain untouched
    expect(after).toContain("\n\n  - keep\n");
  });

  it("returns content unchanged when tag not found", () => {
    const content = "---\ntitle: T\ntags:\n  - a\ndate: 2026-01-01\n---\n\n";
    expect(removeTagFromContent(content, "missing")).toBe(content);
  });
});

describe("slugifyTag", () => {
  it("lowercases and trims", () => {
    expect(slugifyTag("  Hello  ")).toBe("hello");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugifyTag("my tag")).toBe("my-tag");
  });

  it("strips diacritics", () => {
    expect(slugifyTag("café")).toBe("cafe");
  });

  it("strips special characters", () => {
    expect(slugifyTag("tag!@#$%")).toBe("tag");
  });

  it("collapses multiple hyphens", () => {
    expect(slugifyTag("a---b")).toBe("a-b");
  });

  it("returns empty string for non-alphanumeric input", () => {
    expect(slugifyTag("!!!")).toBe("");
  });
});

// ── component tests ────────────────────────────────────────────────────────────

describe("NewNotePage component", () => {
  afterEach(cleanup);

  it("renders the heading and textarea", () => {
    render(<NewNotePage />);
    expect(screen.getByText("New Note")).toBeInTheDocument();
    expect(screen.getByLabelText("Content")).toBeInTheDocument();
  });

  it("pre-populates textarea with frontmatter including today's date", () => {
    render(<NewNotePage />);
    const textarea = screen.getByLabelText("Content") as HTMLTextAreaElement;
    const today = new Date().toISOString().split("T")[0];
    expect(textarea.value).toContain(`date: ${today}`);
    expect(textarea.value).toContain("title: New Note Stub");
  });

  it("shows example-tag pill on initial render", () => {
    render(<NewNotePage />);
    expect(screen.getByText("#example-tag")).toBeInTheDocument();
  });

  it("creates a tag pill on spacebar press", () => {
    render(<NewNotePage />);
    const tagInput = screen.getByPlaceholderText("Type a tag and press Space…");

    fireEvent.change(tagInput, { target: { value: "new-tag" } });
    fireEvent.keyDown(tagInput, { key: " " });

    expect(screen.getByText("#new-tag")).toBeInTheDocument();
    expect((tagInput as HTMLInputElement).value).toBe("");
  });

  it("adds the tag to frontmatter in the textarea", () => {
    render(<NewNotePage />);
    const tagInput = screen.getByPlaceholderText("Type a tag and press Space…");

    fireEvent.change(tagInput, { target: { value: "hello" } });
    fireEvent.keyDown(tagInput, { key: " " });

    const textarea = screen.getByLabelText("Content") as HTMLTextAreaElement;
    expect(textarea.value).toContain("  - hello");
  });

  it("does not add duplicate tags", () => {
    render(<NewNotePage />);
    const tagInput = screen.getByPlaceholderText("Type a tag and press Space…");

    fireEvent.change(tagInput, { target: { value: "example-tag" } });
    fireEvent.keyDown(tagInput, { key: " " });

    // Should still have exactly one example-tag pill
    const pills = screen.getAllByText("#example-tag");
    expect(pills).toHaveLength(1);
  });

  it("removes a tag pill when × is clicked", () => {
    render(<NewNotePage />);
    const removeBtn = screen.getByLabelText("Remove tag example-tag");
    fireEvent.click(removeBtn);

    expect(screen.queryByText("#example-tag")).not.toBeInTheDocument();
  });

  it("removes the tag from the textarea frontmatter", () => {
    render(<NewNotePage />);
    const removeBtn = screen.getByLabelText("Remove tag example-tag");
    fireEvent.click(removeBtn);

    const textarea = screen.getByLabelText("Content") as HTMLTextAreaElement;
    expect(textarea.value).not.toContain("  - example-tag");
  });

  it("ignores empty spacebar input", () => {
    render(<NewNotePage />);
    const tagInput = screen.getByPlaceholderText("Type a tag and press Space…");

    fireEvent.change(tagInput, { target: { value: "   " } });
    fireEvent.keyDown(tagInput, { key: " " });

    // Should still only have the initial tag
    const pills = screen.getAllByText(/#/);
    expect(pills).toHaveLength(1);
  });

  it("calls saveNote on submit and shows success message", async () => {
    render(<NewNotePage />);
    const submitBtn = screen.getByText("Save Note");
    fireEvent.click(submitBtn);

    // Wait for async action
    const successMsg = await screen.findByText(/Note saved/);
    expect(successMsg).toBeInTheDocument();
    expect(saveNote).toHaveBeenCalledOnce();
  });

  it("shows error message when saveNote fails", async () => {
    vi.mocked(saveNote).mockResolvedValueOnce({
      success: false,
      error: "disk full",
    });

    render(<NewNotePage />);
    const submitBtn = screen.getByText("Save Note");
    fireEvent.click(submitBtn);

    const errorMsg = await screen.findByText(/disk full/);
    expect(errorMsg).toBeInTheDocument();
  });

  it("resets the form after successful save", async () => {
    render(<NewNotePage />);

    // Add a custom tag first
    const tagInput = screen.getByPlaceholderText("Type a tag and press Space…");
    fireEvent.change(tagInput, { target: { value: "custom" } });
    fireEvent.keyDown(tagInput, { key: " " });
    expect(screen.getByText("#custom")).toBeInTheDocument();

    // Submit
    fireEvent.click(screen.getByText("Save Note"));
    await screen.findByText(/Note saved/);

    // Form should be reset — custom tag gone, example-tag restored
    expect(screen.queryByText("#custom")).not.toBeInTheDocument();
    expect(screen.getByText("#example-tag")).toBeInTheDocument();
  });
});

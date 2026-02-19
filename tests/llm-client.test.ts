import { describe, expect, it } from "vitest";

// @ts-expect-error .mjs module
import {
  extractAnthropicContent,
  extractGeminiContent,
  extractOpenAIContent,
} from "../scripts/lib/llm-client.mjs";

describe("extractOpenAIContent", () => {
  it("returns content when present", () => {
    const completion = {
      choices: [{ message: { content: "hello world" } }],
    };
    expect(extractOpenAIContent(completion)).toBe("hello world");
  });

  it("throws when choices/content are missing", () => {
    expect(() => extractOpenAIContent({ choices: [] })).toThrow(
      /empty response/i
    );
  });
});

describe("extractAnthropicContent", () => {
  it("returns the first non-empty text block", () => {
    const message = {
      content: [{ type: "tool_use" }, { type: "text", text: "claude output" }],
    };
    expect(extractAnthropicContent(message)).toBe("claude output");
  });

  it("throws when no text block exists", () => {
    expect(() => extractAnthropicContent({ content: [] })).toThrow(
      /empty response/i
    );
  });
});

describe("extractGeminiContent", () => {
  it("returns text when provided as a string property", async () => {
    await expect(extractGeminiContent({ text: "gemini output" })).resolves.toBe(
      "gemini output"
    );
  });

  it("returns text when provided via text() method", async () => {
    await expect(
      extractGeminiContent({
        text: async () => "gemini function output",
      })
    ).resolves.toBe("gemini function output");
  });

  it("throws when text is empty", async () => {
    await expect(extractGeminiContent({ text: "" })).rejects.toThrow(
      /empty response/i
    );
  });
});

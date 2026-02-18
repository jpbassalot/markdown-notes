import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SearchableDocs from "@/app/components/searchable-docs";

const docs = [
  {
    slug: "identity",
    title: "Identity: BiscuitClaw",
    tags: ["identity", "internal", "config"],
    excerpt: "BiscuitClaw is a personal assistant...",
    type: "note" as const,
    href: "/notes/identity",
  },
  {
    slug: "joseph",
    title: "The Human: Joseph",
    tags: ["human", "identity", "context"],
    excerpt: "Joseph is the architect of my current directives...",
    type: "note" as const,
    href: "/notes/joseph",
  },
  {
    slug: "new-note",
    title: "New Note",
    tags: ["untagged"],
    excerpt: "Content goes here.",
    type: "template" as const,
    href: "/templates/new-note",
  },
];

describe("SearchableDocs", () => {
  afterEach(cleanup);

  it("renders all docs when no search query", () => {
    render(<SearchableDocs docs={docs} />);

    expect(screen.getByText("Identity: BiscuitClaw")).toBeInTheDocument();
    expect(screen.getByText("The Human: Joseph")).toBeInTheDocument();
    expect(screen.getByText("New Note")).toBeInTheDocument();
    expect(screen.getByText("3 documents")).toBeInTheDocument();
  });

  it("filters docs by search query", () => {
    render(<SearchableDocs docs={docs} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "Joseph" } });

    expect(screen.getByText("The Human: Joseph")).toBeInTheDocument();
    expect(screen.queryByText("Identity: BiscuitClaw")).not.toBeInTheDocument();
  });

  it("shows result count when filtering", () => {
    render(<SearchableDocs docs={docs} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "Joseph" } });

    expect(screen.getByText(/1 result for "Joseph"/)).toBeInTheDocument();
  });

  it("shows no-results message for unmatched query", () => {
    render(<SearchableDocs docs={docs} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "xyznonexistent" } });

    expect(screen.getByText(/No documents matched/)).toBeInTheDocument();
  });

  it("clears search with clear button", () => {
    render(<SearchableDocs docs={docs} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "Joseph" } });

    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.click(clearButton);

    expect(screen.getByText("3 documents")).toBeInTheDocument();
  });

  it("renders tag links pointing to /tags/<tag>", () => {
    render(<SearchableDocs docs={docs} />);

    const tagLink = screen.getAllByText("#identity")[0];
    expect(tagLink.closest("a")).toHaveAttribute("href", "/tags/identity");
  });

  it("renders doc type badges", () => {
    render(<SearchableDocs docs={docs} />);

    const noteBadges = screen.getAllByLabelText("Type: note");
    expect(noteBadges.length).toBe(2);

    const templateBadge = screen.getByLabelText("Type: template");
    expect(templateBadge).toBeInTheDocument();
  });
});

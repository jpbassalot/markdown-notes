import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── mocks ───────────────────────────────────────────────────────────────────────

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/app/notes/[slug]/actions", () => ({
  deleteNote: vi.fn().mockResolvedValue({ success: true }),
}));

const { default: DeleteNoteButton } = await import(
  "@/app/notes/[slug]/DeleteNoteButton"
);
const { deleteNote } = await import("@/app/notes/[slug]/actions");

// ── tests ───────────────────────────────────────────────────────────────────────

describe("DeleteNoteButton", () => {
  beforeEach(() => {
    vi.mocked(deleteNote).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders a Delete button in idle state", () => {
    render(<DeleteNoteButton slug="test-note" />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("shows confirmation prompt when Delete is clicked", () => {
    render(<DeleteNoteButton slug="test-note" />);
    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByText("Delete this note?")).toBeInTheDocument();
    expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("returns to idle when Cancel is clicked", () => {
    render(<DeleteNoteButton slug="test-note" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Delete this note?")).not.toBeInTheDocument();
  });

  it("calls deleteNote and shows success on confirm", async () => {
    render(<DeleteNoteButton slug="test-note" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));

    const msg = await screen.findByText(/Note deleted/);
    expect(msg).toBeInTheDocument();
    expect(deleteNote).toHaveBeenCalledWith("test-note");
  });

  it("redirects to home after deletion", async () => {
    render(<DeleteNoteButton slug="test-note" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));

    await screen.findByText(/Note deleted/);

    // setTimeout(1200) schedules the redirect; wait for it
    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
    }, { timeout: 3000 });
  });

  it("shows error message when deleteNote fails", async () => {
    vi.mocked(deleteNote).mockResolvedValueOnce({
      success: false,
      error: "Note not found",
    });

    render(<DeleteNoteButton slug="missing" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));

    const errorMsg = await screen.findByText("Note not found");
    expect(errorMsg).toBeInTheDocument();
  });

  it("disables buttons during deleting state", async () => {
    // Make deleteNote hang so we can check the intermediate state
    let resolve: (v: { success: boolean }) => void;
    vi.mocked(deleteNote).mockReturnValueOnce(
      new Promise((r) => { resolve = r; })
    );

    render(<DeleteNoteButton slug="test-note" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));

    expect(screen.getByText("Deleting…")).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeDisabled();

    // Resolve to clean up
    resolve!({ success: true });
    await screen.findByText(/Note deleted/);
  });

  it("allows retry after error by clicking Delete again", async () => {
    vi.mocked(deleteNote).mockResolvedValueOnce({
      success: false,
      error: "Server error",
    });

    render(<DeleteNoteButton slug="test-note" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));

    await screen.findByText("Server error");

    // Should be back at idle with Delete button visible
    expect(screen.getByText("Delete")).toBeInTheDocument();

    // Try again — this time it succeeds (default mock)
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, delete"));

    await screen.findByText(/Note deleted/);
  });
});

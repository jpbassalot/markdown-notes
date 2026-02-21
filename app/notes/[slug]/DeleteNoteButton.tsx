"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteNote } from "./actions";

type State = "idle" | "confirming" | "deleting" | "deleted" | "error";

export default function DeleteNoteButton({ slug }: { slug: string }) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleDelete() {
    setState("deleting");
    setErrorMsg("");
    const result = await deleteNote(slug);
    if (result.success) {
      setState("deleted");
      setTimeout(() => router.push("/"), 1200);
    } else {
      setState("error");
      setErrorMsg(result.error ?? "Unknown error");
    }
  }

  if (state === "deleted") {
    return <span className="text-sm font-medium text-green-700">Note deleted. Redirecting…</span>;
  }

  if (state === "confirming" || state === "deleting") {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="text-slate-700">Delete this note?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={state === "deleting"}
          className="cursor-pointer rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {state === "deleting" ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setState("idle")}
          disabled={state === "deleting"}
          className="cursor-pointer rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setState("confirming");
          setErrorMsg("");
        }}
        className="cursor-pointer rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
      {state === "error" && (
        <span className="text-xs text-red-600">{errorMsg}</span>
      )}
    </span>
  );
}

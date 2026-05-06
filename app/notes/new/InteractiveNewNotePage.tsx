"use client";

import NoteEditor from "./NoteEditor";
import { saveNote } from "@/app/notes/new/actions";

export default function InteractiveNewNotePage() {
  return <NoteEditor onSave={saveNote} />;
}

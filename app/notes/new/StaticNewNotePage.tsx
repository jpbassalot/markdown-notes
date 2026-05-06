import NoteEditor from "./NoteEditor";

export default function StaticNewNotePage() {
  return (
    <NoteEditor unavailableMessage="Note creation is unavailable in the static export build." />
  );
}

export {
  addTagToContent,
  buildInitialContent,
  parseTagsFromContent,
  removeTagFromContent,
  slugifyTag,
} from "./editor-helpers";

export default async function NewNotePage() {
  if (process.env.NEXT_EXPORT === "true") {
    const { default: StaticNewNotePage } = await import("./StaticNewNotePage");
    return <StaticNewNotePage />;
  }

  const { default: InteractiveNewNotePage } = await import("./InteractiveNewNotePage");
  return <InteractiveNewNotePage />;
}

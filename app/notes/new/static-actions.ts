export async function saveNote(): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: "Note creation is unavailable in the static export build.",
  };
}

export async function deleteNote(): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: "Note deletion is unavailable in the static export build.",
  };
}

import type { NextConfig } from "next";

// Static export is opt-in: NEXT_EXPORT=true next build
// Without the flag, the full Next.js server is available (required for server actions
// such as the /notes/new note-creation form).
const nextConfig: NextConfig = {
  ...(process.env.NEXT_EXPORT === "true" ? { output: "export" } : {}),
};

export default nextConfig;

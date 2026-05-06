import type { NextConfig } from "next";

// Static export is opt-in: NEXT_EXPORT=true next build
// Without the flag, the full Next.js server is available (required for server actions
// such as the /notes/new note-creation form).
const nextConfig: NextConfig = {
  ...(process.env.NEXT_EXPORT === "true" ? { output: "export" } : {}),
  ...(process.env.NEXT_EXPORT === "true"
    ? {
        turbopack: {
          resolveAlias: {
            "@/app/notes/new/actions": "@/app/notes/new/static-actions",
            "@/app/notes/[slug]/actions": "@/app/notes/[slug]/static-actions",
          },
        },
      }
    : {}),
};

export default nextConfig;

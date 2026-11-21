// Runs before `npm run build` (npm "prebuild").
// Everything in public/ is copied into out/, so a local public/config.json would be shipped
// inside the build (e.g. the desktop app) and point every install at a developer's API.
import { existsSync } from "node:fs";

const file = new URL("../public/config.json", import.meta.url);

if (existsSync(file)) {
  console.error(
    [
      "",
      "Build stopped: public/config.json exists and would be copied into out/.",
      "  - For local development use .env.local (NEXT_PUBLIC_API_URL) instead, and delete public/config.json.",
      "  - For an install, put config.json next to index.html AFTER the build (e.g. out/config.json).",
      "",
    ].join("\n")
  );
  process.exit(1);
}

import type { NextConfig } from "next";

// Static export only (the app will be wrapped with Tauri later).
// No Server Actions, API routes, middleware or server-only dynamic routes.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

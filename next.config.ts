import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) loads a worker file by relative path at
  // runtime — bundling it breaks that lookup, so keep it a native require.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;

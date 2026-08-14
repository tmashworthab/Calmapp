import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pause is entirely local: no server, no API routes, no database. Exporting
  // to static files makes that structural rather than a promise — there is no
  // backend for an entry to be sent to, and nothing to log it.
  output: "export",

  // Static export can't run the image optimiser. The app ships no photography
  // anyway, so this only keeps the door closed.
  images: { unoptimized: true },
};

export default nextConfig;

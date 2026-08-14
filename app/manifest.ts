import type { MetadataRoute } from "next";

// Required under `output: "export"` — the manifest is emitted at build time
// rather than served by a route handler.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pause",
    short_name: "Pause",
    description:
      "A break-glass tool for the moment before you send something you can't take back.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

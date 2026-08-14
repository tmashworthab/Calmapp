// Zero-dependency static server for the exported app in `out/`.
// `next start` doesn't apply to a static export, and pulling in a server
// package for a local-only tool isn't worth the dependency.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

async function resolveFile(pathname) {
  // Strip any traversal before touching the filesystem.
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [];
  const direct = join(root, safe);

  if (safe.endsWith("/")) {
    candidates.push(join(direct, "index.html"));
  } else {
    candidates.push(direct, `${direct}.html`, join(direct, "index.html"));
  }

  for (const candidate of candidates) {
    if (!candidate.startsWith(root)) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const file = (await resolveFile(url.pathname)) ?? join(root, "404.html");

  try {
    const body = await readFile(file);
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    const immutable = url.pathname.startsWith("/_next/static/");
    res.writeHead(file.endsWith("404.html") ? 404 : 200, {
      "content-type": type,
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Pause is running at http://localhost:${port}`);
});

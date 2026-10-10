#!/usr/bin/env python3
"""A small "drop a file here to print" web page for a CUPS printer.

Standard library only, so it runs on any Raspberry Pi OS without extra packages.
It is meant to be reached over the home network or Tailscale, never the open
internet.
"""

import argparse
import html
import os
import subprocess
import tempfile
from email.parser import BytesParser
from email.policy import HTTP
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_UPLOAD_BYTES = 30 * 1024 * 1024
ALLOWED = {".pdf", ".jpg", ".jpeg", ".png", ".txt"}

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Home Printer</title>
<style>
  :root {{ color-scheme: light dark; --accent: #0a66c2; }}
  body {{ font: 17px/1.45 -apple-system, system-ui, sans-serif; margin: 0; padding: 24px 16px;
         background: Canvas; color: CanvasText; }}
  main {{ max-width: 520px; margin: 0 auto; }}
  h1 {{ font-size: 1.6rem; margin: 0 0 4px; }}
  .sub {{ opacity: .7; margin: 0 0 24px; }}
  form {{ display: grid; gap: 16px; }}
  .file {{ border: 2px dashed color-mix(in srgb, CanvasText 30%, transparent); border-radius: 12px;
          padding: 20px; text-align: center; }}
  label {{ display: grid; gap: 6px; }}
  select, input[type=number] {{ font: inherit; padding: 8px; border-radius: 8px; }}
  button {{ font: inherit; font-weight: 600; padding: 14px; border: 0; border-radius: 12px;
           background: var(--accent); color: white; }}
  .msg {{ padding: 14px; border-radius: 12px; margin-bottom: 20px;
         background: color-mix(in srgb, var(--accent) 15%, Canvas); }}
  .err {{ background: color-mix(in srgb, #d00 18%, Canvas); }}
  pre {{ white-space: pre-wrap; font-size: .85rem; opacity: .8; }}
</style>
</head>
<body><main>
<h1>Home Printer</h1>
<p class="sub">{queue}: PDF, photo (JPG or PNG) or plain text. For Word or Pages files, save or export as PDF first.</p>
{message}
<form method="post" action="/print" enctype="multipart/form-data">
  <div class="file"><input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.txt,application/pdf,image/*" required></div>
  <label>Copies <input type="number" name="copies" value="1" min="1" max="20"></label>
  <label>Colour
    <select name="color"><option value="color">Colour</option><option value="mono">Black and white</option></select>
  </label>
  <button type="submit">Print</button>
</form>
<h2 style="font-size:1rem;margin-top:32px">Waiting to print</h2>
<pre>{queue_status}</pre>
</main></body></html>
"""


class Handler(BaseHTTPRequestHandler):
    queue = "Brother"

    def do_GET(self):
        if self.path not in ("/", "/index.html"):
            self.send_error(404)
            return
        self.respond(200, "")

    def do_POST(self):
        if self.path != "/print":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_UPLOAD_BYTES:
            self.respond(413, "That file is too big. The limit is 30 MB.", error=True)
            return
        body = self.rfile.read(length)
        try:
            fields, filename, data = parse_form(self.headers.get("Content-Type", ""), body)
        except ValueError as exc:
            self.respond(400, str(exc), error=True)
            return

        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED:
            self.respond(400, "That type of file can't be printed from here. Save it as a PDF and try again.",
                         error=True)
            return

        try:
            copies = max(1, min(20, int(fields.get("copies", "1"))))
        except ValueError:
            copies = 1
        options = ["-o", "print-color-mode=monochrome"] if fields.get("color") == "mono" else []

        with tempfile.NamedTemporaryFile(suffix=ext) as tmp:
            tmp.write(data)
            tmp.flush()
            result = subprocess.run(
                ["lp", "-d", self.queue, "-n", str(copies), "-t", filename, *options, tmp.name],
                capture_output=True, text=True, timeout=120,
            )
        if result.returncode == 0:
            self.respond(200, f"Sent “{filename}” to the printer. A first-generation Pi can take a "
                              "minute or two to prepare a long PDF before the printer starts.")
        else:
            self.respond(500, "The printer system refused the file: " + (result.stderr.strip() or "unknown error"),
                         error=True)

    def respond(self, status, message, error=False):
        note = ""
        if message:
            note = f'<div class="msg{" err" if error else ""}">{html.escape(message)}</div>'
        status_text = subprocess.run(["lpstat", "-o", self.queue], capture_output=True, text=True).stdout.strip()
        page = PAGE.format(queue=html.escape(self.queue), message=note,
                           queue_status=html.escape(status_text or "Nothing waiting."))
        payload = page.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def parse_form(content_type, body):
    """Returns (text fields, uploaded file name, uploaded bytes) from a multipart form."""
    if not content_type.startswith("multipart/form-data"):
        raise ValueError("Expected a file upload.")
    message = BytesParser(policy=HTTP).parsebytes(
        b"Content-Type: " + content_type.encode("latin-1") + b"\r\n\r\n" + body)
    if not message.is_multipart():
        raise ValueError("Couldn't read the upload.")
    fields, filename, data = {}, None, None
    for part in message.iter_parts():
        name = part.get_param("name", header="content-disposition")
        payload = part.get_payload(decode=True) or b""
        if part.get_filename():
            filename, data = os.path.basename(part.get_filename()), payload
        elif name:
            fields[name] = payload.decode("utf-8", "replace")
    if not filename or not data:
        raise ValueError("Choose a file to print first.")
    return fields, filename, data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--queue", default="Brother", help="CUPS printer name")
    parser.add_argument("--port", type=int, default=8631)
    args = parser.parse_args()
    Handler.queue = args.queue
    server = ThreadingHTTPServer(("", args.port), Handler)
    print(f"Serving the print page for {args.queue} on port {args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()

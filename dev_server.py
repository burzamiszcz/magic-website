#!/usr/bin/env python3
"""Lokalny serwer: statyczne pliki + lista wydarzeń + ładne URL-e /bilety/..."""

from __future__ import annotations

import json
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

import bilety_events


class Handler(SimpleHTTPRequestHandler):
    def _rewrite_bilety_path(self) -> str | None:
        """Zwraca 'json' | 'list' | 'redirect:slug' | None."""
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path in ("/bilety-events.php", "/bilety-events.json"):
            return "json"
        if path == "/bilety":
            self.path = "/bilety.html"
            return "list"
        if path.startswith("/bilety/"):
            return "redirect:" + path[len("/bilety/") :]
        return None

    def do_GET(self):
        action = self._rewrite_bilety_path()

        if action == "json":
            try:
                payload = json.dumps(bilety_events.fetch_events(), ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "public, max-age=60")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as exc:
                body = json.dumps({"ok": False, "error": str(exc), "events": []}).encode("utf-8")
                self.send_response(502)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            return

        if action == "list":
            return SimpleHTTPRequestHandler.do_GET(self)

        if action and action.startswith("redirect:"):
            slug = action.split(":", 1)[1]
            self.send_response(302)
            self.send_header("Location", "/bilety.html?e=" + slug)
            self.end_headers()
            return

        return SimpleHTTPRequestHandler.do_GET(self)

    def do_HEAD(self):
        action = self._rewrite_bilety_path()

        if action == "json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            return

        if action == "list":
            return SimpleHTTPRequestHandler.do_HEAD(self)

        if action and action.startswith("redirect:"):
            slug = action.split(":", 1)[1]
            self.send_response(302)
            self.send_header("Location", "/bilety.html?e=" + slug)
            self.end_headers()
            return

        return SimpleHTTPRequestHandler.do_HEAD(self)


def main() -> None:
    host = "127.0.0.1"
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    httpd = ThreadingHTTPServer((host, port), Handler)
    print(f"Ready on http://{host}:{port}/")
    print(f"  Lista:      http://{host}:{port}/bilety")
    print(f"  Wydarzenie: http://{host}:{port}/bilety/iluzjonista-hubert-burzynski-wroclaw")
    httpd.serve_forever()


if __name__ == "__main__":
    main()

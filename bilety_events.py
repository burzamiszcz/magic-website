#!/usr/bin/env python3
"""Pobiera listę wydarzeń KupBilecik (ten sam kontrakt co bilety-events.php)."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape

KB_BASE = "25346"
KB_USER = "5681"
KB_TOKEN = "6c33b987b8aaa8ee45bcdcd6b0ceb79f"

MONTHS = {
    "stycznia": "01",
    "lutego": "02",
    "marca": "03",
    "kwietnia": "04",
    "maja": "05",
    "czerwca": "06",
    "lipca": "07",
    "sierpnia": "08",
    "wrzesnia": "09",
    "września": "09",
    "pazdziernika": "10",
    "października": "10",
    "listopada": "11",
    "grudnia": "12",
}


def _parse_date(when: str, chunk: str) -> str:
    iso = re.search(r"(20\d{2})-(\d{2})-(\d{2})", chunk)
    if iso:
        return f"{iso.group(1)}-{iso.group(2)}-{iso.group(3)}"

    m = re.search(
        r"(\d{1,2})\s+([A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)\s+(20\d{2})",
        when or chunk,
        re.IGNORECASE,
    )
    if not m:
        return ""
    day = int(m.group(1))
    month = MONTHS.get(m.group(2).lower(), "")
    year = m.group(3)
    if not month:
        return ""
    return f"{year}-{month}-{day:02d}"


def _make_path(slug: str, city: str, date: str, event_id: str, used: set[str]) -> str:
    # Dwa show w tym samym mieście → data w URL; gdy brak daty → ID
    base = f"{slug}-{city}"
    if date:
        candidate = f"{base}-{date}"
    else:
        candidate = f"{base}-{event_id}"

    if candidate in used:
        candidate = f"{base}-{event_id}"
    used.add(candidate)
    return candidate


def fetch_events() -> dict:
    qs = urllib.parse.urlencode(
        {
            "frame_base": KB_BASE,
            "frame_list_length": "50",
            "frame_primary_bg_color": "7b219f",
            "nolinks": "",
            "u": KB_USER,
            "v": "1.0",
            "token": KB_TOKEN,
        }
    )
    url = f"https://www.kupbilecik.pl/iframe/events?{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; MagicWebsite/1.0)"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        html = resp.read().decode("utf-8", errors="replace")

    pattern = re.compile(r"/iframe/single-event/(\d+)/([^/\"']+)/([^?\"']+)")
    events = []
    seen = set()
    used_paths: set[str] = set()

    for m in pattern.finditer(html):
        event_id, city, slug = m.group(1), m.group(2), m.group(3)
        key = f"{event_id}|{city}|{slug}"
        if key in seen:
            continue
        seen.add(key)

        chunk = html[max(0, m.start() - 1200) : m.end() + 1800]
        image = ""
        when = ""
        title = ""

        im = re.search(r"(https://assets\.kupbilecik\.pl/img/imprezy/[^\"\s]+)", chunk)
        if im:
            image = unescape(im.group(1))

        wm = re.search(
            r">(\d{1,2}\s+[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+\s+20\d{2},[^<]{0,40})<",
            chunk,
        )
        if wm:
            when = unescape(wm.group(1)).strip()

        for tm in re.finditer(r">([^<]{5,100})<", chunk):
            candidate = unescape(tm.group(1)).strip()
            low = candidate.lower()
            if any(x in low for x in ("bilety", "ocena", "dni", "http", "wybierz")):
                continue
            if "iluzjonista" in low or (len(candidate) > 12 and not candidate[0].isdigit()):
                title = candidate
                if "iluzjonista" in low:
                    break

        if not title:
            title = slug.replace("-", " ").title()

        date = _parse_date(when, chunk)
        path = _make_path(slug, city, date, event_id, used_paths)

        embed_qs = urllib.parse.urlencode(
            {"uiframe": KB_USER, "u": KB_USER, "token": KB_TOKEN}
        )
        embed = (
            f"https://www.kupbilecik.pl/iframe/single-event/"
            f"{urllib.parse.quote(event_id)}/{urllib.parse.quote(city)}/{urllib.parse.quote(slug)}"
            f"?{embed_qs}"
        )

        events.append(
            {
                "id": event_id,
                "city": city,
                "slug": slug,
                "date": date,
                "path": path,
                "title": title,
                "when": when,
                "image": image,
                "embed": embed,
            }
        )

    return {
        "ok": True,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "events": events,
    }


if __name__ == "__main__":
    print(json.dumps(fetch_events(), ensure_ascii=False, indent=2))

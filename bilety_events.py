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


def _text(fragment: str) -> str:
    """Usuwa tagi, dekoduje encje i zwija białe znaki."""
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


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


def _collect_prices(node, prices: list) -> None:
    """Ceny wolnych miejsc z mapy numerowanej (places[].price.normal / types[].value)."""
    if isinstance(node, dict):
        price = node.get("price")
        if isinstance(price, dict) and node.get("status") == "free" and node.get("active", True):
            vals = [price.get("normal")]
            vals += [t.get("value") for t in (price.get("types") or []) if isinstance(t, dict)]
            for v in vals:
                try:
                    val = float(v)
                except (TypeError, ValueError):
                    continue
                if val > 0:
                    prices.append(val)
        for key, v in node.items():
            if key != "price" and isinstance(v, (dict, list)):
                _collect_prices(v, prices)
    elif isinstance(node, list):
        for v in node:
            _collect_prices(v, prices)


def fetch_min_price(event_id: str):
    """Najniższa cena dostępnego miejsca (zł) z publicznego get-seats; None gdy brak/błąd."""
    url = f"https://www.kupbilecik.pl/pl/event/get-seats/{urllib.parse.quote(event_id)}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; MagicWebsite/1.0)",
            # bez tego endpoint przekierowuje na stronę HTML zamiast zwrócić JSON
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json",
            "Referer": "https://www.kupbilecik.pl/",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        return None
    if not isinstance(data, dict):
        return None

    prices: list = []
    for row in data.get("notnum") or []:
        if not isinstance(row, dict):
            continue
        if int(row.get("Count") or 0) <= 0 and "Count" in row:
            continue
        try:
            val = float(row.get("cart_price", row.get("Cena_miejsce")))
        except (TypeError, ValueError):
            continue
        if val > 0:
            prices.append(val)

    schema = data.get("schema")
    if isinstance(schema, str):
        try:
            schema = json.loads(unescape(schema))
        except ValueError:
            schema = None
    _collect_prices(schema, prices)

    if not prices:
        return None
    low = min(prices)
    return int(low) if low == int(low) else round(low, 2)


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

    # Każde wydarzenie ma kilka linków w jednej karcie. Blok karty = od pierwszego
    # linku danego ID do pierwszego linku kolejnego wydarzenia (bez mieszania sąsiadów).
    firsts: list[tuple[int, str, str, str]] = []
    seen_ids: set[str] = set()
    for m in pattern.finditer(html):
        if m.group(1) in seen_ids:
            continue
        seen_ids.add(m.group(1))
        firsts.append((m.start(), m.group(1), m.group(2), m.group(3)))

    events = []
    used_paths: set[str] = set()

    for idx, (start, event_id, city, slug) in enumerate(firsts):
        end = firsts[idx + 1][0] if idx + 1 < len(firsts) else min(len(html), start + 8000)
        chunk = html[start:end]

        title = ""
        tm = re.search(r"<h2[^>]*>\s*<a[^>]*>(.*?)</a>", chunk, re.S)
        if tm:
            title = _text(tm.group(1))
        if not title:
            title = slug.replace("-", " ").title()

        image = ""
        im = re.search(
            r"(?:data-src|src)=\"(https://assets\.kupbilecik\.pl/img/(?:baza|imprezy)/[^\"]+)\"",
            chunk,
        )
        if im:
            image = unescape(im.group(1))

        when = ""
        iso_dt = ""
        wm = re.search(r"<time[^>]*datetime=\"([^\"]*)\"[^>]*>(.*?)</time>", chunk, re.S)
        if wm:
            iso_dt = unescape(wm.group(1))
            when = _text(wm.group(2))

        city_name = ""
        cm = re.search(r"href=\"/pl/city/\d+/[^\"]*\"[^>]*>\s*([^<]+?)\s*</a>", chunk)
        if cm:
            city_name = unescape(cm.group(1)).strip()

        place = ""
        pm = re.search(r"href=\"/pl/place/\d+/[^\"]*\"[^>]*>\s*([^<]+?)\s*</a>", chunk)
        if pm:
            place = unescape(pm.group(1)).strip()

        date = iso_dt[:10] if re.match(r"20\d{2}-\d{2}-\d{2}", iso_dt) else _parse_date(when, "")
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
                "cityName": city_name,
                "place": place,
                "slug": slug,
                "date": date,
                "path": path,
                "title": title,
                "when": when,
                "image": image,
                "minPrice": fetch_min_price(event_id),
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

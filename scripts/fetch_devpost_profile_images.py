#!/usr/bin/env python3
"""Fetch profile pictures from Devpost portfolio URLs listed in a CSV export.

The script:
1. Reads a CSV file containing a `Portfolio Url` column.
2. Visits each Devpost profile page.
3. Tries multiple heuristics to find the participant's profile image.
4. Skips likely placeholder/default avatars unless explicitly allowed.
5. Downloads the image into `public/community-avatars/`.
6. Writes a manifest JSON file with successes, skips, and failures.

Example:
    python3 scripts/fetch_devpost_profile_images.py \
      --csv data/devpost-registrants.csv \
      --output-dir public/community-avatars \
      --manifest public/community-avatars/manifest.json
"""

from __future__ import annotations

import argparse
import csv
import json
import mimetypes
import re
import sys
import time
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

DEFAULT_AVATAR_PATTERNS = (
    "default",
    "placeholder",
    "missing",
    "avatar.svg",
    "avatar-default",
    "default-avatar",
    "devpost-logo",
    "devpost-icon",
    "devpost-avatar",
    "devpost-brand",
    "devpost-mark",
    "devpost-wordmark",
    "fallback",
    "/anonymous",
    "blank-avatar",
)

PROFILE_IMAGE_HINTS = (
    "avatar",
    "profile",
    "user-photo",
    "user_image",
    "profile-image",
    "profile_photo",
    "user-avatar",
)

NON_AVATAR_HINTS = (
    "project",
    "submission",
    "entry",
    "thumbnail",
    "thumb",
    "cover",
    "banner",
    "hero",
    "logo",
    "screenshot",
    "gallery",
    "portfolio",
)


class DevpostProfileParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta_candidates: List[str] = []
        self.img_candidates: List[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> None:
        attr_map: Dict[str, str] = {
            key.lower(): value for key, value in attrs if key and value is not None
        }

        if tag.lower() == "meta":
            prop = attr_map.get("property", "").lower()
            name = attr_map.get("name", "").lower()
            content = attr_map.get("content", "").strip()
            if not content:
                return

            if prop in {"og:image", "og:image:url"} or name in {
                "twitter:image",
                "twitter:image:src",
            }:
                self.meta_candidates.append(content)
            return

        if tag.lower() != "img":
            return

        src = attr_map.get("src", "").strip()
        if not src:
            return

        haystack = " ".join(
            [
                attr_map.get("class", ""),
                attr_map.get("alt", ""),
                attr_map.get("id", ""),
                attr_map.get("src", ""),
            ]
        ).lower()

        if any(hint in haystack for hint in PROFILE_IMAGE_HINTS):
            self.img_candidates.append((src, haystack))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download Devpost profile pictures from a registrant CSV."
    )
    parser.add_argument(
        "--csv",
        dest="csv_path",
        required=True,
        help="Path to the CSV export containing a `Portfolio Url` column.",
    )
    parser.add_argument(
        "--output-dir",
        default="public/community-avatars",
        help="Directory where downloaded images will be saved.",
    )
    parser.add_argument(
        "--manifest",
        default="public/community-avatars/manifest.json",
        help="Where to write the JSON manifest.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Delay in seconds between portfolio fetches.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit for testing only the first N rows.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=20.0,
        help="Network timeout in seconds for each request.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Redownload images even if the target file already exists.",
    )
    parser.add_argument(
        "--allow-defaults",
        action="store_true",
        help="Keep likely placeholder/default avatars instead of skipping them.",
    )
    return parser.parse_args()


def slugify(value: str, fallback: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return slug or fallback


def normalize_portfolio_url(raw_url: str) -> str:
    cleaned = raw_url.strip()
    if not cleaned:
        return ""
    if not cleaned.startswith(("http://", "https://")):
        cleaned = f"https://{cleaned}"
    return cleaned


def fetch_text(url: str, timeout: float) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_bytes(url: str, timeout: float) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        content_type = response.headers.get_content_type() or "application/octet-stream"
        return response.read(), content_type


def unique_preserve_order(values: Iterable[str]) -> List[str]:
    seen = set()
    result: List[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def extract_candidate_images(page_url: str, html: str) -> List[str]:
    parser = DevpostProfileParser()
    parser.feed(html)

    inline_urls = re.findall(r"https://[^\"'\s>]+", html)
    hinted_inline_urls = [
        url for url in inline_urls if any(hint in url.lower() for hint in PROFILE_IMAGE_HINTS)
    ]

    raw_candidates = parser.meta_candidates + [src for src, _ in parser.img_candidates] + hinted_inline_urls
    absolute_candidates = [urljoin(page_url, candidate) for candidate in raw_candidates]
    return unique_preserve_order(absolute_candidates)


def looks_like_default_avatar(image_url: str) -> bool:
    lowered = image_url.lower()
    if any(pattern in lowered for pattern in DEFAULT_AVATAR_PATTERNS):
        return True
    if "devpost" in lowered and any(
        marker in lowered for marker in ("logo", "icon", "brand", "mark", "wordmark")
    ):
        return True
    if "gravatar.com" in lowered and ("d=mm" in lowered or "d=identicon" in lowered):
        return True
    return False


def score_image_candidate(image_url: str) -> int:
    lowered = image_url.lower()
    score = 0

    if any(hint in lowered for hint in PROFILE_IMAGE_HINTS):
        score += 5
    if "user-photo" in lowered or "facebook_avatar_image" in lowered:
        score += 6
    if "image-replacement" in lowered:
        score += 2
    if "googleusercontent.com" in lowered:
        score += 2

    if any(hint in lowered for hint in NON_AVATAR_HINTS):
        score -= 6
    if any(token in lowered for token in ("project", "submission", "thumbnail", "cover")):
        score -= 4

    return score


def choose_image_candidate(candidates: List[str], allow_defaults: bool) -> tuple[str, str]:
    if not candidates:
        return "", "no_image_found"

    if allow_defaults:
        return candidates[0], "selected"

    custom_candidates = [
        candidate for candidate in candidates if not looks_like_default_avatar(candidate)
    ]
    if custom_candidates:
        ranked_candidates = sorted(
            custom_candidates,
            key=lambda candidate: score_image_candidate(candidate),
            reverse=True,
        )
        return ranked_candidates[0], "selected"

    return "", "default_avatar_only"


def infer_extension(image_url: str, content_type: str) -> str:
    path = urlparse(image_url).path
    suffix = Path(path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}:
        return suffix

    guessed = mimetypes.guess_extension(content_type)
    if guessed == ".jpe":
        return ".jpg"
    return guessed or ".jpg"


def portfolio_slug(portfolio_url: str, fallback: str) -> str:
    parsed = urlparse(portfolio_url)
    path_slug = parsed.path.strip("/").split("/")[-1]
    return slugify(path_slug or fallback, fallback)


def main() -> int:
    args = parse_args()
    csv_path = Path(args.csv_path)
    output_dir = Path(args.output_dir)
    manifest_path = Path(args.manifest)

    if not csv_path.exists():
        print(f"CSV file not found: {csv_path}", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    results = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)

        if "Portfolio Url" not in (reader.fieldnames or []):
            print("CSV is missing required column: Portfolio Url", file=sys.stderr)
            return 1

        rows = list(reader)

    if args.limit is not None:
        rows = rows[: args.limit]

    for index, row in enumerate(rows, start=1):
        first_name = (row.get("First Name") or "").strip()
        last_name = (row.get("Last Name") or "").strip()
        full_name = " ".join(part for part in [first_name, last_name] if part).strip()
        fallback_name = f"participant-{index:03d}"
        portfolio_url = normalize_portfolio_url(row.get("Portfolio Url", ""))

        record = {
            "index": index,
            "name": full_name or fallback_name,
            "email": (row.get("Email") or "").strip(),
            "portfolio_url": portfolio_url,
            "status": "",
            "reason": "",
            "image_url": "",
            "local_path": "",
        }

        if not portfolio_url:
            record["status"] = "skipped"
            record["reason"] = "missing_portfolio_url"
            results.append(record)
            continue

        try:
            html = fetch_text(portfolio_url, timeout=args.timeout)
            candidates = extract_candidate_images(portfolio_url, html)
            selected_image_url, reason = choose_image_candidate(
                candidates, allow_defaults=args.allow_defaults
            )

            if not selected_image_url:
                record["status"] = "skipped"
                record["reason"] = reason
                results.append(record)
                time.sleep(args.delay)
                continue

            slug = portfolio_slug(portfolio_url, slugify(full_name, fallback_name))
            image_bytes, content_type = fetch_bytes(selected_image_url, timeout=args.timeout)
            extension = infer_extension(selected_image_url, content_type)
            filename = f"{slug}{extension}"
            file_path = output_dir / filename

            if file_path.exists() and not args.overwrite:
                record["status"] = "skipped"
                record["reason"] = "already_downloaded"
                record["image_url"] = selected_image_url
                record["local_path"] = str(file_path.as_posix())
                results.append(record)
                time.sleep(args.delay)
                continue

            file_path.write_bytes(image_bytes)

            record["status"] = "downloaded"
            record["reason"] = "selected"
            record["image_url"] = selected_image_url
            record["local_path"] = str(file_path.as_posix())
            results.append(record)
        except (HTTPError, URLError, TimeoutError) as error:
            record["status"] = "error"
            record["reason"] = f"{type(error).__name__}: {error}"
            results.append(record)
        except Exception as error:  # noqa: BLE001
            record["status"] = "error"
            record["reason"] = f"{type(error).__name__}: {error}"
            results.append(record)

        time.sleep(args.delay)

    summary = {
        "source_csv": str(csv_path.as_posix()),
        "output_dir": str(output_dir.as_posix()),
        "total_rows": len(rows),
        "downloaded": sum(1 for row in results if row["status"] == "downloaded"),
        "skipped": sum(1 for row in results if row["status"] == "skipped"),
        "errors": sum(1 for row in results if row["status"] == "error"),
        "results": results,
    }

    manifest_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

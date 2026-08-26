#!/usr/bin/env python3
"""Import exact-name formula matches from American Dragon."""

from __future__ import annotations

import argparse
from html import unescape
import json
import re
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

import requests

BASE_URL = "https://www.americandragon.com/"
INDEX_PAGES = (
    "HerbFormulaIndexA-G.html",
    "HerbFormulaIndexH-N.html",
    "HerbFormulaIndexO-T.html",
    "HerbFormulaIndexU-Z.html",
)
HEADERS = {"User-Agent": "HerbzReference/0.1 (private educational reference)"}
EXACT_NAME_ALIASES = {
    "daochisan": "daochiresan",
    "gegenqinliantang": "gegenhuangqinhuangliantang",
    "huoxiangzhengqisan": "huoxiangzhengqitang",
    "lizhongwan": "lizhongtang",
}


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", value.lower())


def clean_text(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value)
    return " ".join(unescape(text).replace("\xa0", " ").split())


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def get_html(session: requests.Session, url: str) -> str:
    response = session.get(url, headers=HEADERS, timeout=45)
    response.raise_for_status()
    return response.text


def collect_index_links(session: requests.Session) -> dict[str, dict[str, str]]:
    links: dict[str, dict[str, str]] = {}
    for page in INDEX_PAGES:
        page_url = urljoin(BASE_URL, page)
        html = get_html(session, page_url)
        anchors = re.findall(r"<a\s+[^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>", html, re.I | re.S)
        for href, label_html in anchors:
            label = clean_text(label_html)
            url = urljoin(page_url, href)
            if not label or not url.lower().endswith((".html", ".htm")):
                continue
            if "Herb Formula" not in url and "Herb%20Formula" not in url:
                continue
            links.setdefault(normalize_name(label), {"label": label, "url": url})
    return links


def section_by_suffix(html: str, suffix: str) -> str:
    match = re.search(rf"<div[^>]+id=[\"']p7ABc\d+_{suffix}[\"'][^>]*>", html, re.I)
    if not match:
        return ""
    start = match.start()
    next_match = re.search(r"<div\s+class=[\"']p7ABtrig[\"']", html[match.end():], re.I)
    end = match.end() + next_match.start() if next_match else len(html)
    return html[start:end]


def html_cells(row: str) -> list[str]:
    return [
        clean_text(cell)
        for cell in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.I | re.S)
    ]


def html_rows(section: str) -> list[list[str]]:
    return [
        cells
        for row in re.findall(r"<tr[^>]*>(.*?)</tr>", section, re.I | re.S)
        if (cells := [cell for cell in html_cells(row) if cell])
    ]


def list_items(section: str) -> list[str]:
    if not section:
        return []
    items = [clean_text(item) for item in re.findall(r"<li[^>]*>(.*?)</li>", section, re.I | re.S)]
    if items:
        return unique(items)
    rows = []
    for cells in html_rows(section):
        text = " | ".join(cell for cell in cells if cell)
        if text:
            rows.append(text)
    return unique(rows)


def parse_title(section: str) -> tuple[str | None, list[str]]:
    if not section:
        return None, []
    heading = re.search(r"<h[1-3][^>]*>(.*?)</h[1-3]>", section, re.I | re.S)
    heading_text = clean_text(heading.group(1)) if heading else ""
    english_name = heading_text.split(" - ")[-1].title() if " - " in heading_text else None
    aliases: list[str] = []
    for cells in html_rows(section):
        if cells and cells[0].lower().rstrip(":") == "english" and len(cells) > 1:
            english_name = cells[1]
        if cells and "also known" in cells[0].lower():
            aliases.extend(cells[1:])
    return english_name, unique(aliases)


def parse_ingredients(section: str) -> list[dict[str, str]]:
    if not section:
        return []
    ingredients = []
    for cells in html_rows(section):
        if len(cells) < 3 or cells[0].lower().startswith(("herb", "pharmaceutical")):
            continue
        ingredients.append({
            "pharmaceuticalLatin": cells[0],
            "pinyin": cells[1],
            "dose": cells[2],
            "actions": cells[3] if len(cells) > 3 else "",
        })
    return ingredients


def parse_formula(session: requests.Session, entry: dict[str, str]) -> dict:
    html = get_html(session, entry["url"])
    english_name, aliases = parse_title(section_by_suffix(html, "1"))
    return {
        "sourceId": "american-dragon",
        "sourceTitle": "American Dragon Chinese Herbs and Formulas",
        "sourceUrl": entry["url"],
        "verification": "pending",
        "englishName": english_name,
        "alsoKnownAs": aliases,
        "ingredients": parse_ingredients(section_by_suffix(html, "2")),
        "formulaActions": list_items(section_by_suffix(html, "3")),
        "syndromes": list_items(section_by_suffix(html, "4")),
        "clinicalManifestations": list_items(section_by_suffix(html, "5")),
        "treats": list_items(section_by_suffix(html, "6")),
        "contraindicationsAndInteractions": list_items(section_by_suffix(html, "7")),
        "notes": list_items(section_by_suffix(html, "8")),
        "modifications": list_items(section_by_suffix(html, "9")),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--formulas", default="src/data/formulas.json")
    parser.add_argument("--textbook-formulas", default="src/data/textbook-formulas.json")
    parser.add_argument("--output", default="src/data/american-dragon-formulas.json")
    parser.add_argument("--review-output", default="data/review/american-dragon-formulas.review.json")
    parser.add_argument("--delay", type=float, default=0.08)
    args = parser.parse_args()

    formulas = json.loads(Path(args.formulas).read_text(encoding="utf-8-sig"))["formulas"]
    textbook_formulas = json.loads(Path(args.textbook_formulas).read_text(encoding="utf-8-sig"))["formulas"]
    names: dict[str, list[str]] = {}
    for formula in [*formulas, *textbook_formulas]:
        names.setdefault(normalize_name(formula["names"]["pinyin"]), []).append(formula["id"])

    session = requests.Session()
    index_links = collect_index_links(session)
    alias_matches = {
        name: EXACT_NAME_ALIASES[name]
        for name in names
        if name in EXACT_NAME_ALIASES and EXACT_NAME_ALIASES[name] in index_links
    }
    matched_names = sorted((set(names) & set(index_links)) | set(alias_matches))
    imported: dict[str, dict] = {}
    failures: list[dict[str, str]] = []

    for index, name in enumerate(matched_names, start=1):
        index_name = alias_matches.get(name, name)
        entry = index_links[index_name]
        try:
            reference = parse_formula(session, entry)
            for formula_id in names[name]:
                imported[formula_id] = reference
        except Exception as exc:
            failures.append({"name": entry["label"], "url": entry["url"], "error": str(exc)})
        if index < len(matched_names):
            time.sleep(args.delay)

    output = {
        "metadata": {
            "sourceId": "american-dragon",
            "sourceUrl": urljoin(BASE_URL, "HerbFormulaIndex2.html"),
            "matchMethod": "exact normalized pinyin",
            "verification": "pending",
            "matchedUniqueNames": len(matched_names),
            "explicitAliasMatches": len(alias_matches),
            "enrichedFormulaVariants": len(imported),
        },
        "references": imported,
    }
    review = {
        "summary": {
            "existingUniqueNames": len(names),
            "siteIndexEntries": len(index_links),
            "matchedUniqueNames": len(matched_names),
            "explicitAliasMatches": len(alias_matches),
            "unmatchedExistingNames": len(set(names) - set(index_links) - set(alias_matches)),
            "failedPages": len(failures),
        },
        "explicitAliases": [
            {
                "normalizedName": name,
                "siteNormalizedName": site_name,
                "formulaIds": names[name],
                "siteLabel": index_links[site_name]["label"],
                "siteUrl": index_links[site_name]["url"],
            }
            for name, site_name in sorted(alias_matches.items())
        ],
        "unmatchedExisting": [
            {"normalizedName": name, "formulaIds": names[name]}
            for name in sorted(set(names) - set(index_links) - set(alias_matches))
        ],
        "failures": failures,
    }

    output_path = Path(args.output)
    review_path = Path(args.review_output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    review_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    review_path.write_text(json.dumps(review, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output["metadata"]))


if __name__ == "__main__":
    main()

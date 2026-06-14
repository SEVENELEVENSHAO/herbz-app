#!/usr/bin/env python3
"""Import exact-name formula matches from American Dragon."""

from __future__ import annotations

import argparse
import json
import re
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag

BASE_URL = "https://www.americandragon.com/"
INDEX_PAGES = (
    "HerbFormulaIndexA-G.html",
    "HerbFormulaIndexH-N.html",
    "HerbFormulaIndexO-T.html",
    "HerbFormulaIndexU-Z.html",
)
HEADERS = {"User-Agent": "HerbzReference/0.1 (private educational reference)"}


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", value.lower())


def clean_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split())


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def get_soup(session: requests.Session, url: str) -> BeautifulSoup:
    response = session.get(url, headers=HEADERS, timeout=45)
    response.raise_for_status()
    return BeautifulSoup(response.content, "html.parser")


def collect_index_links(session: requests.Session) -> dict[str, dict[str, str]]:
    links: dict[str, dict[str, str]] = {}
    for page in INDEX_PAGES:
        page_url = urljoin(BASE_URL, page)
        soup = get_soup(session, page_url)
        for anchor in soup.find_all("a", href=True):
            label = clean_text(anchor.get_text(" ", strip=True))
            url = urljoin(page_url, anchor["href"])
            if not label or not url.lower().endswith((".html", ".htm")):
                continue
            if "Herb Formula" not in url and "Herb%20Formula" not in url:
                continue
            links.setdefault(normalize_name(label), {"label": label, "url": url})
    return links


def section_by_suffix(soup: BeautifulSoup, suffix: str) -> Tag | None:
    return soup.find(id=re.compile(rf"p7ABc\d+_{suffix}$"))


def list_items(section: Tag | None) -> list[str]:
    if not section:
        return []
    items = [clean_text(item.get_text(" ", strip=True)) for item in section.find_all("li")]
    if items:
        return unique(items)
    rows = []
    for row in section.find_all("tr"):
        cells = [clean_text(cell.get_text(" ", strip=True)) for cell in row.find_all(["th", "td"])]
        text = " | ".join(cell for cell in cells if cell)
        if text:
            rows.append(text)
    return unique(rows)


def parse_title(section: Tag | None) -> tuple[str | None, list[str]]:
    if not section:
        return None, []
    heading = section.find(["h1", "h2", "h3"])
    heading_text = clean_text(heading.get_text(" ", strip=True)) if heading else ""
    english_name = heading_text.split(" - ")[-1].title() if " - " in heading_text else None
    aliases: list[str] = []
    for row in section.find_all("tr"):
        cells = [clean_text(cell.get_text(" ", strip=True)) for cell in row.find_all(["th", "td"])]
        if cells and cells[0].lower().rstrip(":") == "english" and len(cells) > 1:
            english_name = cells[1]
        if cells and "also known" in cells[0].lower():
            aliases.extend(cells[1:])
    return english_name, unique(aliases)


def parse_ingredients(section: Tag | None) -> list[dict[str, str]]:
    if not section:
        return []
    ingredients = []
    for row in section.find_all("tr"):
        cells = [clean_text(cell.get_text(" ", strip=True)) for cell in row.find_all(["th", "td"])]
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
    soup = get_soup(session, entry["url"])
    english_name, aliases = parse_title(section_by_suffix(soup, "1"))
    return {
        "sourceId": "american-dragon",
        "sourceTitle": "American Dragon Chinese Herbs and Formulas",
        "sourceUrl": entry["url"],
        "verification": "pending",
        "englishName": english_name,
        "alsoKnownAs": aliases,
        "ingredients": parse_ingredients(section_by_suffix(soup, "2")),
        "formulaActions": list_items(section_by_suffix(soup, "3")),
        "syndromes": list_items(section_by_suffix(soup, "4")),
        "clinicalManifestations": list_items(section_by_suffix(soup, "5")),
        "treats": list_items(section_by_suffix(soup, "6")),
        "contraindicationsAndInteractions": list_items(section_by_suffix(soup, "7")),
        "notes": list_items(section_by_suffix(soup, "8")),
        "modifications": list_items(section_by_suffix(soup, "9")),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--formulas", default="src/data/formulas.json")
    parser.add_argument("--output", default="src/data/american-dragon-formulas.json")
    parser.add_argument("--review-output", default="data/review/american-dragon-formulas.review.json")
    parser.add_argument("--delay", type=float, default=0.08)
    args = parser.parse_args()

    formulas = json.loads(Path(args.formulas).read_text(encoding="utf-8-sig"))["formulas"]
    names: dict[str, list[str]] = {}
    for formula in formulas:
        names.setdefault(normalize_name(formula["names"]["pinyin"]), []).append(formula["id"])

    session = requests.Session()
    index_links = collect_index_links(session)
    matched_names = sorted(set(names) & set(index_links))
    imported: dict[str, dict] = {}
    failures: list[dict[str, str]] = []

    for index, name in enumerate(matched_names, start=1):
        entry = index_links[name]
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
            "enrichedFormulaVariants": len(imported),
        },
        "references": imported,
    }
    review = {
        "summary": {
            "existingUniqueNames": len(names),
            "siteIndexEntries": len(index_links),
            "matchedUniqueNames": len(matched_names),
            "unmatchedExistingNames": len(set(names) - set(index_links)),
            "failedPages": len(failures),
        },
        "unmatchedExisting": [
            {"normalizedName": name, "formulaIds": names[name]}
            for name in sorted(set(names) - set(index_links))
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

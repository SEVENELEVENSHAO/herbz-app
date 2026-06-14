"""Match Bensky materia medica monographs to the existing herb index.

The importer keeps the source page range and extracted English sections on each
matched herb. OCR-derived content is labeled as pending review in the app.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

from pypdf import PdfReader

SECTION_LABELS = [
    ("actions", r"Actions\s*&\s*Indications"),
    ("commentary", r"Commentary"),
    ("combinations", r"Mechanisms\s+of\s+Selected\s+Combinations"),
    ("comparisons", r"Comparisons"),
    ("traditionalContraindications", r"Traditional\s+Contraindications"),
    ("toxicity", r"Toxicity"),
    ("nomenclaturePreparation", r"Nomenclature\s*&\s*Preparation"),
    ("qualityCriteria", r"Quality\s+Criteria"),
    ("chemicalConstituents", r"Major\s+known\s+chemical\s+constituents"),
    ("alternateSpecies", r"Alternate\s+species\s*&\s*local\s+variants"),
    ("adulterations", r"Adulterations"),
    ("alternateNames", r"Alternate\s+names"),
    ("additionalProductInformation", r"Additional\s+product\s+information"),
]


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", value)
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def clean(value: str) -> str:
    value = value.replace("\x00", "").replace("\u00ad", "")
    value = re.sub(r"(?<=\w)-\n(?=\w)", "", value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r" *\n *", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", clean(value)).strip()


def metadata_value(text: str, label: str, next_labels: list[str]) -> str:
    following = "|".join(next_labels)
    pattern = re.compile(
        rf"{label}\s*(.*?)(?={following}|$)",
        re.IGNORECASE | re.DOTALL,
    )
    match = pattern.search(text)
    return compact(match.group(1)) if match else ""


def split_sections(text: str) -> dict[str, str]:
    markers: list[tuple[int, int, str]] = []
    for key, pattern in SECTION_LABELS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            markers.append((match.start(), match.end(), key))
    markers.sort()

    sections: dict[str, str] = {}
    for index, (_, end, key) in enumerate(markers):
        next_start = markers[index + 1][0] if index + 1 < len(markers) else len(text)
        value = clean(text[end:next_start])
        if len(value) >= 2 and key not in sections:
            sections[key] = value
    return sections


def find_pinyin(preceding: str, pinyin_lookup: dict[str, str]) -> tuple[str, str] | None:
    lines = preceding[-500:].splitlines()
    for line in reversed(lines[-14:]):
        candidate = normalize(line)
        if candidate in pinyin_lookup:
            return candidate, pinyin_lookup[candidate]
    return None


def build_page_text(reader: PdfReader) -> tuple[str, list[tuple[int, int, int]]]:
    parts: list[str] = []
    spans: list[tuple[int, int, int]] = []
    cursor = 0
    for page_number, page in enumerate(reader.pages, start=1):
        text = clean(page.extract_text() or "")
        marker = f"\n\n[[PDF_PAGE_{page_number}]]\n\n"
        value = marker + text
        parts.append(value)
        spans.append((cursor, cursor + len(value), page_number))
        cursor += len(value)
    return "".join(parts), spans


def page_for(offset: int, spans: list[tuple[int, int, int]]) -> int:
    for start, end, number in spans:
        if start <= offset < end:
            return number
    return spans[-1][2]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--herbs", required=True, type=Path)
    parser.add_argument("--review-output", required=True, type=Path)
    args = parser.parse_args()

    herb_payload = json.loads(args.herbs.read_text(encoding="utf-8"))
    herbs = herb_payload["herbs"]
    pinyin_lookup: dict[str, str] = {}
    for herb in herbs:
        for name in herb.get("pinyinNames", []):
            normalized = normalize(name)
            if normalized:
                pinyin_lookup.setdefault(normalized, herb["id"])

    reader = PdfReader(str(args.pdf))
    full_text, page_spans = build_page_text(reader)
    heading_pattern = re.compile(r"PHARMACEUTICAL\s+NAME", re.IGNORECASE)
    heading_matches = list(heading_pattern.finditer(full_text))
    anchors: list[dict] = []
    seen_ids: set[str] = set()

    for heading_index, match in enumerate(heading_matches):
        found = find_pinyin(full_text[max(0, match.start() - 500):match.start()], pinyin_lookup)
        if not found:
            continue
        normalized_pinyin, herb_id = found
        if herb_id in seen_ids:
            continue
        seen_ids.add(herb_id)
        anchors.append({
            "offset": match.start(),
            "herbId": herb_id,
            "normalizedPinyin": normalized_pinyin,
            "headingIndex": heading_index,
        })

    review_entries = []
    matched_by_id = {}
    for index, anchor in enumerate(anchors):
        start = anchor["offset"]
        heading_index = anchor["headingIndex"]
        end = heading_matches[heading_index + 1].start() if heading_index + 1 < len(heading_matches) else len(full_text)
        end = min(end, start + 60000)
        entry_text = clean(full_text[start:end])
        entry_text = re.sub(r"\[\[PDF_PAGE_\d+\]\]", "", entry_text)
        page_start = page_for(start, page_spans)
        page_end = page_for(end - 1, page_spans)

        intro_end = re.search(r"Actions\s*&\s*Indications", entry_text, re.IGNORECASE)
        intro = entry_text[:intro_end.start()] if intro_end else entry_text[:5000]
        english_name = metadata_value(
            intro, r"EN[A-Za-z]{0,5}SH\s*",
            [r"JAPANESE", r"KOREAN", r"TEXT\s+IN\s+WHICH"],
        )
        properties = metadata_value(
            intro, r"PROPERTI(?:ES|Es|eS)\s*",
            [r"CHANNELS?\s*ENTERED", r"KEY\s+CHARACTERISTICS"],
        )
        channels = metadata_value(
            intro, r"CHANNELS?\s*ENTERED\s*",
            [r"KEY\s+CHARACTERISTICS", r"DOSAGE"],
        )
        key_characteristics = metadata_value(
            intro, r"KEY\s+CHARACTERISTICS\s*",
            [r"DOSAGE", r"CAUTIONS\s*&\s*CONTRAINDICATIONS"],
        )
        dosage = metadata_value(
            intro, r"DOSAGE\s*",
            [r"CAUTIONS\s*&\s*CONTRAINDICATIONS", r"Actions\s*&\s*Indications"],
        )
        cautions = metadata_value(
            intro, r"CAUTION[A-Za-z]*\s*&\s*CONTRAINDICATIONS\s*",
            [r"Actions\s*&\s*Indications"],
        )
        pharmaceutical_name = metadata_value(
            intro, r"PHARMACEUTICAL\s+NAME\s*",
            [r"FAM[A-Za-z!]{1,7}", r"STANDARD\s+SPECIES"],
        )
        sections = split_sections(entry_text)

        reference = {
            "sourceId": "bensky-materia-medica-3e",
            "sourceTitle": "Chinese Herbal Medicine: Materia Medica, 3rd Edition",
            "pageStart": page_start,
            "pageEnd": page_end,
            "verification": "pending",
            "pharmaceuticalName": pharmaceutical_name,
            "englishName": english_name,
            "properties": properties,
            "channels": channels,
            "keyCharacteristics": key_characteristics,
            "dosage": dosage,
            "cautions": cautions,
            **sections,
        }
        matched_by_id[anchor["herbId"]] = reference
        review_entries.append({
            "herbId": anchor["herbId"],
            "pinyin": anchor["normalizedPinyin"],
            "reference": reference,
        })

    for herb in herbs:
        reference = matched_by_id.get(herb["id"])
        if reference:
            herb["englishReference"] = reference
            english_name = reference.get("englishName", "")
            if english_name and english_name not in herb["englishNames"]:
                herb["englishNames"].append(english_name)

    args.herbs.write_text(json.dumps(herb_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    args.review_output.parent.mkdir(parents=True, exist_ok=True)
    review_payload = {
        "document": {
            "id": "bensky-materia-medica-3e",
            "title": "Chinese Herbal Medicine: Materia Medica",
            "edition": "3rd Edition",
            "fileName": args.pdf.name,
            "pageCount": len(reader.pages),
            "verification": "pending",
        },
        "matchedEntries": review_entries,
        "summary": {
            "existingHerbs": len(herbs),
            "matchedHerbs": len(matched_by_id),
            "unmatchedHerbs": len(herbs) - len(matched_by_id),
        },
    }
    args.review_output.write_text(json.dumps(review_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(review_payload["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()

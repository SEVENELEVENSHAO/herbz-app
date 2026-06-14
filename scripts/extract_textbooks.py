"""Extract page-cited textbook passages into a review queue.

This script never marks OCR content as verified. It preserves PDF page numbers
and emits candidates for human review before database import.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from pypdf import PdfReader

FORMULA_FIELDS = [
    "组成", "用法", "功用", "主治", "证治机理", "方解", "运用",
    "附方", "鉴别", "方论选录", "医案举例", "方歌",
]
HERB_FIELDS = ["药性", "功效", "应用", "用法用量", "使用注意", "鉴别用药", "现代研究"]
FIELD_PATTERN = re.compile(r"【(" + "|".join(FORMULA_FIELDS + HERB_FIELDS) + r")】")
FORMULA_NAME_PATTERN = re.compile(r"^[\u3400-\u9fff]{2,12}(汤|丸|散|饮|膏|丹|煎|方|剂)$")
HERB_NAME_PATTERN = re.compile(r"^[\u3400-\u9fff]{1,6}$")


def clean(text: str) -> str:
    text = text.replace("\x00", "").replace("\u3000", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def candidate_name(lines: list[str], field_index: int, kind: str) -> str | None:
    pattern = FORMULA_NAME_PATTERN if kind == "formula" else HERB_NAME_PATTERN
    for line in reversed(lines[max(0, field_index - 8):field_index]):
        value = line.strip().replace(" ", "")
        if pattern.fullmatch(value):
            return value
    return None


def extract(pdf_path: Path, document_id: str, kind: str) -> dict:
    reader = PdfReader(str(pdf_path))
    passages = []
    entries: dict[str, dict] = {}

    for page_number, page in enumerate(reader.pages, start=1):
        text = clean(page.extract_text() or "")
        if not text:
            continue
        lines = text.splitlines()
        matches = list(FIELD_PATTERN.finditer(text))
        for index, match in enumerate(matches):
            start = match.end()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            value = clean(text[start:end])
            line_index = text[:match.start()].count("\n")
            name = candidate_name(lines, line_index, kind)
            if not name or len(value) < 2:
                continue
            entry_key = f"{kind}:{name}"
            entries.setdefault(entry_key, {
                "id": entry_key,
                "kind": kind,
                "chineseName": name,
                "verification": "pending",
                "fields": {},
            })
            entries[entry_key]["fields"].setdefault(match.group(1), []).append({
                "page": page_number,
                "text": value,
            })
            passages.append({
                "documentId": document_id,
                "entryId": entry_key,
                "fieldName": match.group(1),
                "pageNumber": page_number,
                "originalText": value,
                "verification": "pending",
                "confidence": 0.65,
            })

    return {
        "document": {
            "id": document_id,
            "fileName": pdf_path.name,
            "pageCount": len(reader.pages),
            "kind": kind,
        },
        "entries": list(entries.values()),
        "passages": passages,
        "reviewSummary": {
            "candidateEntries": len(entries),
            "candidatePassages": len(passages),
            "verified": 0,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--document-id", required=True)
    parser.add_argument("--kind", required=True, choices=["formula", "herb"])
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    result = extract(args.pdf, args.document_id, args.kind)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result["reviewSummary"], ensure_ascii=False))


if __name__ == "__main__":
    main()

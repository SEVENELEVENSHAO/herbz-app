import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const writeJson = (file, value) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const explicitTargets = new Set(process.argv.slice(2));

const preparationPrefixes = [
  "chao",
  "cu",
  "duan",
  "fa",
  "fu",
  "hei",
  "jiu",
  "mi",
  "pao",
  "qing",
  "sheng",
  "shu",
  "tu",
  "wei",
  "yan",
  "zhi",
];

function normalizePinyin(value) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\(([^)]*)\)/g, " $1 ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactPinyin(value) {
  return normalizePinyin(value).replace(/\s+/g, "");
}

function candidateKeys(value) {
  const normalized = normalizePinyin(value);
  const exactKey = compactPinyin(normalized);
  const keys = [exactKey];
  const words = normalized.split(/\s+/).filter(Boolean);

  while (words.length > 1 && preparationPrefixes.includes(words[0])) {
    words.shift();
    keys.push(words.join(""));
  }

  return [...new Set(keys.filter(Boolean))];
}

function firstValue(values) {
  return values.find((value) => typeof value === "string" && value.trim()) ?? "";
}

function displayPinyin(value, fallback) {
  const cleaned = (value ?? "")
    .replace(/^\s*\(\s*/, "")
    .replace(/\s*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

const formulasPayload = readJson("src/data/formulas.json");
const herbsPayload = readJson("src/data/herbs.json");
const americanDragonPayload = readJson("src/data/american-dragon-formulas.json");

const herbsByPinyin = new Map();
for (const herb of herbsPayload.herbs) {
  for (const pinyin of herb.pinyinNames ?? []) {
    const key = compactPinyin(pinyin);
    if (!key) continue;
    herbsByPinyin.set(key, [...(herbsByPinyin.get(key) ?? []), herb]);
  }
}

const updated = [];
const skipped = [];
const unresolved = [];

const formulas = formulasPayload.formulas.map((formula) => {
  const explicitlyTargeted = explicitTargets.has(formula.names.pinyin);
  if (explicitTargets.size > 0 && !explicitlyTargeted) return formula;
  if ((formula.ingredients ?? []).length > 0) {
    if (explicitlyTargeted) {
      skipped.push({ formulaId: formula.id, pinyin: formula.names.pinyin, reason: "already-has-ingredients" });
    }
    return formula;
  }

  const reference = americanDragonPayload.references?.[formula.id];
  if (!reference?.ingredients?.length) {
    if (explicitlyTargeted) {
      skipped.push({ formulaId: formula.id, pinyin: formula.names.pinyin, reason: "missing-american-dragon-ingredients" });
    }
    return formula;
  }

  const ingredients = [];
  const formulaUnresolved = [];

  for (const sourceIngredient of reference.ingredients) {
    const keys = candidateKeys(sourceIngredient.pinyin);
    const exactMatches = herbsByPinyin.get(keys[0]) ?? [];
    const matches = exactMatches.length > 0 ? exactMatches : keys.flatMap((key) => herbsByPinyin.get(key) ?? []);
    const uniqueMatches = [...new Map(matches.map((herb) => [herb.id, herb])).values()];

    if (uniqueMatches.length !== 1) {
      formulaUnresolved.push({
        sourcePinyin: sourceIngredient.pinyin,
        dose: sourceIngredient.dose,
        candidateKeys: keys,
        matches: uniqueMatches.map((herb) => ({
          id: herb.id,
          chineseNames: herb.chineseNames,
          pinyinNames: herb.pinyinNames,
        })),
      });
      continue;
    }

    const herb = uniqueMatches[0];
    ingredients.push({
      position: ingredients.length + 1,
      chineseName: firstValue(herb.chineseNames),
      pinyin: displayPinyin(sourceIngredient.pinyin, firstValue(herb.pinyinNames)),
      englishName: firstValue(herb.englishNames),
      dose: sourceIngredient.dose,
      thermalProperty: firstValue(herb.thermalProperties) || "neutral",
    });
  }

  if (formulaUnresolved.length > 0) {
    unresolved.push({
      formulaId: formula.id,
      chineseName: formula.names.chinese,
      pinyin: formula.names.pinyin,
      unresolvedIngredients: formulaUnresolved,
    });
    return formula;
  }

  updated.push({
    formulaId: formula.id,
    chineseName: formula.names.chinese,
    pinyin: formula.names.pinyin,
    ingredientCount: ingredients.length,
  });

  return { ...formula, ingredients };
});

writeJson("src/data/formulas.json", { ...formulasPayload, formulas });
writeJson("data/review/american-dragon-ingredient-backfill.review.json", {
  summary: {
    targetFormulas: explicitTargets.size || formulasPayload.formulas.filter((formula) =>
      (formula.ingredients ?? []).length === 0 &&
      americanDragonPayload.references?.[formula.id]?.ingredients?.length
    ).length,
    updated: updated.length,
    skipped: skipped.length,
    unresolved: unresolved.length,
  },
  updated,
  skipped,
  unresolved,
});

console.log(JSON.stringify({ updated: updated.length, skipped: skipped.length, unresolved: unresolved.length }));

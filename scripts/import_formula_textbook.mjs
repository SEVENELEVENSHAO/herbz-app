import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pinyin } from "pinyin-pro";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const writeJson = (file, value) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const review = readJson("data/review/formulas.review.json");
const existing = readJson("src/data/formulas.json").formulas;
const herbs = readJson("src/data/herbs.json").herbs;

const rejectedHeadings = new Set([
  "第三节扶正解表剂",
  "第三节润下剂",
  "第一节祛暑解表剂",
  "第三节气血双补剂",
  "第四节补阴剂",
  "第六节阴阳并补剂",
  "第三节涩肠固脱剂",
  "第二节温开剂",
  "第一节電行气剂",
  "第五节祛湿化浊剂",
]);

const aliases = new Map([
  ["加减葳蔻汤", "加减葳蕤汤"],
  ["葛根黄芩黄连汤", "葛根芩连汤"],
  ["参苓自术散", "参苓白术散"],
  ["实脾散", "实脾饮"],
  ["清气化痰丸", "清气化痰汤"],
  ["苇茎汤", "千金苇茎汤"],
]);

const preparationWords = [
  "去皮尖", "去皮", "去节", "去心", "去芦", "去毛", "去白", "去苗", "去核",
  "炮制", "炮", "炙", "炒", "麸炒", "酒炒", "盐炒", "姜制", "水洗", "洗", "蒸",
  "煨", "熬", "烧", "碎", "切", "研", "另研", "不见火", "绵裹", "面裹", "酒拌",
];

const chineseNameToExisting = new Map(existing.map((formula) => [formula.names.chinese, formula]));
const herbCandidates = herbs
  .flatMap((herb) => herb.chineseNames.map((chineseName) => ({
    chineseName,
    pinyin: herb.pinyinNames[0] ?? "",
    englishName: herb.englishNames.find(Boolean) ?? "",
    thermalProperty: herb.thermalProperties[0] ?? "neutral",
  })))
  .filter((herb) => herb.chineseName)
  .sort((left, right) => right.chineseName.length - left.chineseName.length);

function firstField(entry, name) {
  return entry.fields?.[name]?.[0]?.text?.trim() ?? "";
}

function titlePinyin(value) {
  return pinyin(value, { toneType: "none", type: "array" })
    .map((syllable) => syllable.charAt(0).toUpperCase() + syllable.slice(1))
    .join(" ");
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sourcePages(entry) {
  return [...new Set(
    Object.values(entry.fields ?? {})
      .flat()
      .map((passage) => passage.page)
      .filter(Number.isInteger),
  )].sort((left, right) => left - right);
}

function cleanField(value) {
  return value
    .replace(/\s+/g, " ")
    .split(/(?:（|\[|【)?(?:证治机理|方解|用法)(?:】|\])?/u)[0]
    .replace(/（现代用法[:：][\s\S]*$/u, "")
    .trim();
}

function splitActions(value) {
  return cleanField(value)
    .split(/[；;。]/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripCompositionNoise(value) {
  let cleaned = value.replace(/\s+/g, "");
  cleaned = cleaned.replace(/[（(][^）)]*(?:g|克|两|钱|分|枚|升|合|个|片|斤)[^）)]*[）)]/giu, "");
  cleaned = cleaned.replace(/\d+(?:\.\d+)?(?:～|-|—)?\d*(?:g|克|两|钱|分|枚|升|合|个|片|斤)/giu, "");
  cleaned = cleaned.replace(/[一二三四五六七八九十百半]+(?:两|钱|分|枚|升|合|个|片|斤)/gu, "");
  for (const word of preparationWords) cleaned = cleaned.split(word).join("");
  return cleaned.replace(/[，、。；;：:【】\[\]()（）]/gu, "");
}

function doseFollowing(text, ingredientName) {
  const index = text.indexOf(ingredientName);
  if (index < 0) return "";
  const sample = text.slice(index, index + 45);
  const grams = sample.match(/[（(]\s*(\d+(?:\.\d+)?(?:\s*[～~-]\s*\d+(?:\.\d+)?)?)\s*g\s*[）)]/iu);
  return grams ? `${grams[1].replace(/\s+/g, "")} g` : "";
}

function parseIngredients(composition) {
  if (!composition) return { ingredients: [], unmatchedText: "" };
  const compact = stripCompositionNoise(composition);
  const matches = [];
  let cursor = 0;

  while (cursor < compact.length) {
    const candidate = herbCandidates.find((herb) => compact.startsWith(herb.chineseName, cursor));
    if (!candidate) {
      cursor += 1;
      continue;
    }
    matches.push({ ...candidate, sourceIndex: cursor });
    cursor += candidate.chineseName.length;
  }

  const ingredients = matches.map((match, index) => ({
    position: index + 1,
    chineseName: match.chineseName,
    pinyin: match.pinyin,
    englishName: match.englishName,
    dose: doseFollowing(composition, match.chineseName),
    thermalProperty: match.thermalProperty,
  }));
  const recognized = matches.reduce(
    (text, match) => text.replace(match.chineseName, ""),
    compact,
  );
  return {
    ingredients,
    unmatchedText: recognized.replace(/[^\u3400-\u9fff]/gu, ""),
  };
}

const imported = [];
const rejected = [];
const unresolved = [];
const existingIds = new Set(existing.map((formula) => formula.id));

for (const entry of review.entries) {
  if (rejectedHeadings.has(entry.chineseName)) {
    rejected.push({
      chineseName: entry.chineseName,
      reason: "section-heading",
      pages: sourcePages(entry),
    });
    continue;
  }

  const canonicalChinese = aliases.get(entry.chineseName) ?? entry.chineseName;
  const existingFormula = chineseNameToExisting.get(canonicalChinese);
  const canonicalPinyin = existingFormula?.names.pinyin ?? titlePinyin(canonicalChinese);
  const entryPinyin = titlePinyin(entry.chineseName);
  const composition = firstField(entry, "组成");
  const parsed = parseIngredients(composition);
  const pages = sourcePages(entry);
  const digest = crypto
    .createHash("sha1")
    .update(`fang-ji-xue:${entry.chineseName}`)
    .digest("hex")
    .slice(0, 8);
  let id = `${slug(entryPinyin)}-textbook-${digest}`;
  if (existingIds.has(id)) id = `${id}-2`;
  existingIds.add(id);

  const actions = splitActions(firstField(entry, "功用"));
  const formula = {
    id,
    names: {
      chinese: entry.chineseName,
      pinyin: canonicalPinyin,
      english: existingFormula?.names.english ?? null,
    },
    actions: actions.length > 0 ? actions : ["Pending textbook review."],
    indications: cleanField(firstField(entry, "主治")) || "Pending textbook review.",
    ingredients: parsed.ingredients,
    sourceModules: ["textbook:fang-ji-xue"],
    usageIds: [],
    usageCount: 0,
    textbookReference: {
      sourceId: "fang-ji-xue",
      sourceTitle: "方剂学",
      sourceFile: review.document.fileName,
      verification: "pending",
      pages,
      extractedName: entry.chineseName,
      canonicalChineseName: canonicalChinese,
      isAlias: canonicalChinese !== entry.chineseName,
      fields: Object.fromEntries(
        Object.entries(entry.fields ?? {}).map(([name, passages]) => [
          name,
          passages.map((passage) => ({ page: passage.page, text: passage.text })),
        ]),
      ),
    },
  };
  imported.push(formula);

  if (!composition || parsed.ingredients.length === 0 || parsed.unmatchedText.length > 0) {
    unresolved.push({
      formulaId: id,
      chineseName: entry.chineseName,
      pages,
      missingComposition: !composition,
      parsedIngredientCount: parsed.ingredients.length,
      unmatchedCompositionText: parsed.unmatchedText,
    });
  }
}

const payload = {
  metadata: {
    sourceId: "fang-ji-xue",
    sourceFile: review.document.fileName,
    verification: "pending",
    extractedCandidates: review.entries.length,
    rejectedHeadings: rejected.length,
    importedSourceVariants: imported.length,
    aliasVariants: imported.filter((formula) => formula.textbookReference.isAlias).length,
    expectedNewCanonicalFormulas: 115,
  },
  formulas: imported,
};

const report = {
  summary: {
    ...payload.metadata,
    unresolvedIngredientEntries: unresolved.length,
  },
  rejected,
  aliases: [...aliases].map(([sourceName, canonicalName]) => ({ sourceName, canonicalName })),
  unresolved,
};

writeJson("src/data/textbook-formulas.json", payload);
writeJson("data/review/formula-textbook-import.review.json", report);
console.log(JSON.stringify(report.summary, null, 2));

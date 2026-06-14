import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, "src", "data", name), "utf8"));
const formulas = read("formulas.json").formulas;
const textbookPayload = read("textbook-formulas.json");
const textbookFormulas = textbookPayload.formulas;
const herbs = read("herbs.json").herbs;
const usages = read("usages.json").usages;

const formulaIds = new Set(formulas.map((item) => item.id));
const duplicateIds = formulas.length - formulaIds.size;
const invalidUsages = usages.filter((usage) => !formulaIds.has(usage.formulaId));
const invalidHerbLinks = herbs.flatMap((herb) =>
  herb.formulaIds.filter((id) => !formulaIds.has(id)).map((id) => ({ herb: herb.id, formula: id })),
);
const malformed = formulas.filter((formula) =>
  !formula.names?.chinese || !formula.names?.pinyin || !Array.isArray(formula.ingredients),
);
const malformedTextbook = textbookFormulas.filter((formula) =>
  !formula.names?.chinese ||
  !formula.names?.pinyin ||
  !Array.isArray(formula.ingredients) ||
  formula.textbookReference?.verification !== "pending" ||
  !formula.textbookReference?.pages?.length
);
const normalizeName = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();
const nameGroups = new Map();
for (const formula of formulas) {
  const key = normalizeName(formula.names.pinyin);
  nameGroups.set(key, [...(nameGroups.get(key) ?? []), formula]);
}
const combinedNameGroups = new Map();
for (const formula of [...formulas, ...textbookFormulas]) {
  const key = normalizeName(formula.names.pinyin) || formula.id;
  combinedNameGroups.set(key, [...(combinedNameGroups.get(key) ?? []), formula]);
}
const duplicateNameGroups = [...nameGroups.values()].filter((group) => group.length > 1);
const linkedChineseNames = new Set(herbs.flatMap((herb) => herb.chineseNames));
const linkedPinyinNames = new Set(herbs.flatMap((herb) => herb.pinyinNames));
const unlinkedTextbookIngredients = textbookFormulas.flatMap((formula) =>
  formula.ingredients
    .filter((ingredient) =>
      !linkedChineseNames.has(ingredient.chineseName) &&
      !linkedPinyinNames.has(ingredient.pinyin)
    )
    .map((ingredient) => ({ formula: formula.id, ingredient: ingredient.chineseName }))
);

const report = {
  formulaVariants: formulas.length,
  canonicalFormulaPages: nameGroups.size,
  textbookSourceVariants: textbookFormulas.length,
  combinedSourceVariants: formulas.length + textbookFormulas.length,
  combinedCanonicalFormulaPages: combinedNameGroups.size,
  newCanonicalFormulaPages: combinedNameGroups.size - nameGroups.size,
  duplicateNameGroups: duplicateNameGroups.length,
  herbs: herbs.length,
  usages: usages.length,
  duplicateIds,
  invalidUsages: invalidUsages.length,
  invalidHerbLinks: invalidHerbLinks.length,
  malformedFormulas: malformed.length,
  malformedTextbookFormulas: malformedTextbook.length,
  unlinkedTextbookIngredients: unlinkedTextbookIngredients.length,
};

console.log(JSON.stringify(report, null, 2));
if (
  duplicateIds ||
  invalidUsages.length ||
  invalidHerbLinks.length ||
  malformed.length ||
  malformedTextbook.length ||
  unlinkedTextbookIngredients.length ||
  combinedNameGroups.size !== 273 ||
  textbookPayload.metadata.rejectedHeadings !== 10 ||
  textbookPayload.metadata.aliasVariants !== 6
) process.exit(1);

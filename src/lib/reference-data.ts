import formulasJson from "@/data/formulas.json";
import herbsJson from "@/data/herbs.json";
import usagesJson from "@/data/usages.json";
import sourcesJson from "@/data/source-resources.json";
import americanDragonJson from "@/data/american-dragon-formulas.json";
import textbookFormulasJson from "@/data/textbook-formulas.json";
import apkFormulasJson from "@/data/apk-formulas.json";
import apkHerbsJson from "@/data/apk-herbs.json";
import type { Formula, Herb, ReferenceData, SourceResource, Usage } from "@/types/reference";

function normalizeFormulaName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function formulaCompleteness(formula: Formula) {
  return (
    (formula.textbookReference ? 0 : 100000) +
    formula.ingredients.length * 1000 +
    (formula.names.english ? 100 : 0) +
    formula.actions.length * 20 +
    formula.indications.length +
    formula.usageCount
  );
}

export function getReferenceData(): ReferenceData {
  const formulaCategoryByName = new Map(apkFormulasJson.classifications.map((item) => [item.name, item]));
  const herbCategoryByName = new Map(apkHerbsJson.classifications.map((item) => [item.name, item]));
  const supplemental = americanDragonJson.references as Record<string, Formula["americanDragonReference"]>;
  const appFormulas = formulasJson.formulas as Omit<Formula, "variantIds">[];
  const textbookFormulas = textbookFormulasJson.formulas as Omit<Formula, "variantIds">[];
  const apkFormulas = apkFormulasJson.formulas as Omit<Formula, "variantIds">[];
  const sourceFormulas = [...appFormulas, ...textbookFormulas, ...apkFormulas].map((formula): Formula => ({
    ...formula,
    category: formula.category ?? (() => {
      const match = formulaCategoryByName.get(formula.names.chinese);
      return match ? { system: "formula-apk" as const, ...match } : undefined;
    })(),
    variantIds: [formula.id],
    americanDragonReference: supplemental[formula.id],
  }));
  const groups = new Map<string, Formula[]>();

  for (const formula of sourceFormulas) {
    const key = normalizeFormulaName(formula.names.pinyin) || formula.id;
    groups.set(key, [...(groups.get(key) ?? []), formula]);
  }

  const canonicalIdByVariant = new Map<string, string>();
  const formulas = [...groups.values()].map((group): Formula => {
    const ranked = [...group].sort((left, right) =>
      formulaCompleteness(right) - formulaCompleteness(left) || left.id.localeCompare(right.id)
    );
    const primary = ranked[0];
    const variantIds = group.map((formula) => formula.id);
    const usageIds = unique(group.flatMap((formula) => formula.usageIds));

    for (const variantId of variantIds) canonicalIdByVariant.set(variantId, primary.id);

    return {
      ...primary,
      variantIds,
      names: {
        ...primary.names,
        english: primary.names.english ?? group.map((formula) => formula.names.english).find(Boolean) ?? null,
      },
      actions: unique([...primary.actions, ...group.flatMap((formula) => formula.actions)]),
      sourceModules: unique(group.flatMap((formula) => formula.sourceModules)),
      usageIds,
      usageCount: usageIds.length,
      americanDragonReference:
        primary.americanDragonReference ??
        ranked.map((formula) => formula.americanDragonReference).find(Boolean),
      textbookReference:
        primary.textbookReference ??
        ranked.map((formula) => formula.textbookReference).find(Boolean),
    };
  });

  const usages = (usagesJson.usages as Usage[]).map((usage) => ({
    ...usage,
    formulaId: canonicalIdByVariant.get(usage.formulaId) ?? usage.formulaId,
  }));
  const formulaIdsByHerbName = new Map<string, string[]>();
  const dosesByHerbName = new Map<string, string[]>();
  for (const formula of formulas) {
    for (const ingredient of formula.ingredients) {
      for (const name of [ingredient.chineseName, ingredient.pinyin]) {
        if (!name) continue;
        formulaIdsByHerbName.set(name, unique([
          ...(formulaIdsByHerbName.get(name) ?? []),
          formula.id,
        ]));
        dosesByHerbName.set(name, unique([
          ...(dosesByHerbName.get(name) ?? []),
          ingredient.dose,
        ]));
      }
    }
  }
  const sourceHerbs = [...(herbsJson.herbs as Herb[]), ...(apkHerbsJson.herbs as Herb[])];
  const herbs = sourceHerbs.map((herb) => {
    const categoryMatch = herb.chineseNames.map((name) => herbCategoryByName.get(name)).find(Boolean);
    const ingredientFormulaIds = [...herb.chineseNames, ...herb.pinyinNames]
      .flatMap((name) => formulaIdsByHerbName.get(name) ?? []);
    const formulaObservedDoses = [...herb.chineseNames, ...herb.pinyinNames]
      .flatMap((name) => dosesByHerbName.get(name) ?? []);
    return {
      ...herb,
      category: herb.category ?? (categoryMatch ? { system: "herb-apk" as const, ...categoryMatch } : undefined),
      formulaIds: unique([
        ...herb.formulaIds.map((id) => canonicalIdByVariant.get(id) ?? id),
        ...ingredientFormulaIds,
      ]),
      observedDoses: unique([
        ...herb.observedDoses,
        ...formulaObservedDoses,
      ]),
    };
  });

  return {
    formulas,
    herbs,
    usages,
    sources: sourcesJson.resources as SourceResource[],
    stats: {
      variants: formulas.length,
      sourceVariants: sourceFormulas.length,
      uniqueFormulaNames: formulas.length,
      herbs: herbs.length,
      usages: usages.length,
    },
  };
}

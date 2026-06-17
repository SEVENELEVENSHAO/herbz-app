"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  Columns2,
  FlaskConical,
  GraduationCap,
  Languages,
  Leaf,
  Library,
  Menu,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Formula, Herb, ReferenceData, ThermalProperty, Usage } from "@/types/reference";

type Section = "home" | "formulas" | "herbs" | "compare" | "study";
type Language = "zh" | "en";
type Detail = { type: "formula"; item: Formula } | { type: "herb"; item: Herb };
type ActionSubcategory = {
  id: string;
  label: string;
  keywords: string[];
};
type ActionCategory = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  subcategories: ActionSubcategory[];
};

const actionCategories: ActionCategory[] = [
  {
    id: "release-exterior", label: "Release the Exterior", description: "Exterior-releasing formulas",
    keywords: ["release", "exterior", "wind-cold", "wind-heat", "disperses wind"],
    subcategories: [
      { id: "wind-cold", label: "Wind-Cold", keywords: ["wind-cold", "exterior cold", "cold-dryness"] },
      { id: "wind-heat", label: "Wind-Heat", keywords: ["wind-heat"] },
      { id: "deficiency-exterior", label: "Deficiency Exterior", keywords: ["consolidates exterior", "supports wei qi", "ying and wei", "nutritive and defensive"] },
    ],
  },
  {
    id: "clear-heat", label: "Clear Heat", description: "Heat-clearing formulas",
    keywords: ["clear", "cool", "drain fire", "relieve toxicity", "heat toxin"],
    subcategories: [
      { id: "damp-heat", label: "Clear Damp-Heat", keywords: ["damp-heat", "urinary heat", "relieves jaundice"] },
      { id: "ying-blood", label: "Clear Ying and Blood Heat", keywords: ["blood heat", "cools blood", "nutritive-level"] },
      { id: "heat-toxin", label: "Clear Heat Toxin", keywords: ["heat toxin", "toxic heat", "clears toxin", "relieves toxicity", "resolves toxicity"] },
      { id: "organ-fire", label: "Clear Organ Fire", keywords: ["heart fire", "liver fire", "stomach heat", "lung heat", "bladder", "liver/stomach", "liver/gallbladder"] },
      { id: "deficiency-heat", label: "Clear Deficiency Heat", keywords: ["deficiency heat", "empty heat", "deficiency fever", "steaming bones", "stasis fever"] },
      { id: "qi-level", label: "Clear Qi-Level Heat", keywords: ["clear heat", "clears fire", "drains heat", "severe heat", "miasmic heat"] },
    ],
  },
  {
    id: "drain-downward", label: "Drain Downward", description: "Purgative and moistening formulas",
    keywords: ["purge", "drain downward", "moisten intestines", "unblock stool", "moves stool", "bowel movement", "retained fluid"],
    subcategories: [
      { id: "heat-accumulation", label: "Purge Heat Accumulation", keywords: ["heat accumulation", "drains excess", "moves stool"] },
      { id: "cold-accumulation", label: "Purge Cold Accumulation", keywords: ["cold accumulation"] },
      { id: "moisten-intestines", label: "Moisten the Intestines", keywords: ["moisten intestines", "bowel movement", "unblock stool"] },
      { id: "expel-water", label: "Expel Retained Water", keywords: ["retained fluid", "drives out"] },
    ],
  },
  {
    id: "harmonize", label: "Harmonize", description: "Harmonizing formulas",
    keywords: ["harmonize", "shaoyang"],
    subcategories: [
      { id: "shaoyang", label: "Harmonize Shaoyang", keywords: ["shaoyang", "alternating chills and fever"] },
      { id: "liver-spleen", label: "Harmonize Liver and Spleen", keywords: ["liver and spleen", "spreads liver qi", "soothe liver"] },
      { id: "stomach-intestines", label: "Harmonize Stomach and Intestines", keywords: ["stomach", "middle burner", "harmonizes middle"] },
      { id: "ying-wei", label: "Harmonize Ying and Wei", keywords: ["ying and wei", "nutritive and defensive"] },
    ],
  },
  {
    id: "warm-interior", label: "Warm the Interior", description: "Interior-warming formulas",
    keywords: ["warm", "dispel cold", "scatter cold", "restore yang"],
    subcategories: [
      { id: "rescue-yang", label: "Rescue Devastated Yang", keywords: ["restore yang", "restores devastated yang", "rescues collapse", "prevents collapse"] },
      { id: "warm-kidney", label: "Warm the Kidney", keywords: ["kidney", "spleen-kidney"] },
      { id: "warm-channels", label: "Warm the Channels", keywords: ["warm channels", "warms uterus"] },
      { id: "warm-middle", label: "Warm the Middle", keywords: ["middle", "stomach", "liver and stomach", "interior"] },
    ],
  },
  {
    id: "tonify", label: "Tonify", description: "Qi, Blood, Yin, and Yang tonics",
    keywords: ["tonif", "nourish", "augment", "replenish", "generate fluids", "strengthen spleen", "fill marrow"],
    subcategories: [
      { id: "qi-blood", label: "Tonify Qi and Blood", keywords: ["qi and blood", "heart and spleen"] },
      { id: "essence", label: "Tonify Essence", keywords: ["essence", "fills marrow", "enriches essence"] },
      { id: "yin", label: "Tonify Yin", keywords: ["yin", "generates fluids", "nourishes fluids"] },
      { id: "yang", label: "Tonify Yang", keywords: ["yang"] },
      { id: "blood", label: "Tonify Blood", keywords: ["blood"] },
      { id: "qi", label: "Tonify Qi", keywords: ["qi", "strengthens spleen", "supports middle", "raises clear yang"] },
    ],
  },
  {
    id: "stabilize-bind", label: "Stabilize and Bind", description: "Astringent and securing formulas",
    keywords: ["stabil", "secure", "bind", "astring", "stop sweating", "stops spontaneous sweating", "stop discharge", "stop bleeding", "controls bleeding"],
    subcategories: [
      { id: "exterior", label: "Stabilize the Exterior", keywords: ["exterior", "sweating"] },
      { id: "lung", label: "Stabilize the Lung", keywords: ["cough", "lung"] },
      { id: "intestines", label: "Bind the Intestines", keywords: ["intestines", "diarrhea", "dysentery"] },
      { id: "essence-urination", label: "Secure Essence and Urination", keywords: ["essence", "urination", "emission", "kidney"] },
      { id: "bleeding", label: "Stop Bleeding", keywords: ["bleeding", "blood"] },
    ],
  },
  {
    id: "calm-spirit", label: "Calm the Spirit", description: "Shen-calming formulas",
    keywords: ["calm shen", "calm spirit", "settle fright", "nourishes heart"],
    subcategories: [
      { id: "nourish-calm", label: "Nourish and Calm the Spirit", keywords: ["nourish", "heart yin", "heart and calms"] },
      { id: "settle-calm", label: "Settle and Calm the Spirit", keywords: ["settle fright", "calms agitation", "calms mania"] },
    ],
  },
  {
    id: "open-orifices", label: "Open the Orifices", description: "Consciousness-restoring formulas",
    keywords: ["open orifices", "restore consciousness", "revive", "opens the ears"],
    subcategories: [
      { id: "cool-open", label: "Cool and Open", keywords: ["heat", "fire", "cool"] },
      { id: "warm-open", label: "Warm and Open", keywords: ["warm"] },
      { id: "revive", label: "Revive Consciousness", keywords: ["revive", "consciousness", "opens the ears"] },
    ],
  },
  {
    id: "regulate-qi", label: "Regulate Qi", description: "Qi-regulating formulas",
    keywords: ["move qi", "regulate qi", "descend", "spread liver qi", "soothe liver", "constraint"],
    subcategories: [
      { id: "move-qi", label: "Move Qi", keywords: ["move qi", "moves constrained qi", "opens constraint"] },
      { id: "spread-liver", label: "Spread Liver Qi", keywords: ["liver qi", "soothe liver", "constraint"] },
      { id: "descend-qi", label: "Descend Rebellious Qi", keywords: ["descend", "rebellious qi", "lung qi"] },
    ],
  },
  {
    id: "regulate-blood", label: "Regulate Blood", description: "Blood-moving and hemostatic formulas",
    keywords: ["move blood", "moves blood", "invigorate blood", "blood stasis", "dispels stasis", "moves stasis", "regulate circulation", "regulates menstruation", "breaks stasis"],
    subcategories: [
      { id: "invigorate-blood", label: "Invigorate Blood", keywords: ["move blood", "moves blood", "invigorate", "circulation"] },
      { id: "dispel-stasis", label: "Dispel Blood Stasis", keywords: ["stasis", "breaks stasis"] },
      { id: "regulate-menses", label: "Regulate Menstruation", keywords: ["menstruation", "lochia", "postpartum"] },
    ],
  },
  {
    id: "treat-wind", label: "Treat Wind", description: "Internal and external Wind formulas",
    keywords: ["extinguish wind", "subdue liver yang", "calms liver yang", "stop convulsions", "expels wind"],
    subcategories: [
      { id: "external-wind", label: "Dispel External Wind", keywords: ["expels wind", "wind-damp", "headache"] },
      { id: "internal-wind", label: "Extinguish Internal Wind", keywords: ["extinguish", "convulsions"] },
      { id: "subdue-yang", label: "Subdue Liver Yang", keywords: ["liver yang"] },
    ],
  },
  {
    id: "treat-dryness", label: "Treat Dryness", description: "Dryness-treating formulas",
    keywords: ["moisten", "dryness", "nourishes lung yin"],
    subcategories: [
      { id: "external-dryness", label: "Disperse External Dryness", keywords: ["cold-dryness", "warm dryness", "exterior"] },
      { id: "internal-dryness", label: "Moisten Internal Dryness", keywords: ["moisten", "nourishes lung yin", "fluids"] },
    ],
  },
  {
    id: "expel-dampness", label: "Expel Dampness", description: "Dampness-transforming and water-regulating formulas",
    keywords: ["damp", "promote urination", "moves water", "water metabolism", "water transformation", "reduce edema", "relieve jaundice"],
    subcategories: [
      { id: "transform-damp", label: "Transform Dampness", keywords: ["transform damp", "dries damp", "turbidity"] },
      { id: "promote-urination", label: "Promote Urination", keywords: ["urination", "water metabolism", "water transformation"] },
      { id: "warm-transform-water", label: "Warm and Transform Water", keywords: ["cold-damp", "moves water", "edema"] },
      { id: "wind-damp", label: "Dispel Wind-Damp", keywords: ["wind-damp", "joints", "bi"] },
    ],
  },
  {
    id: "dispel-phlegm", label: "Dispel Phlegm", description: "Phlegm-transforming formulas",
    keywords: ["phlegm", "turbidity"],
    subcategories: [
      { id: "phlegm-heat", label: "Clear Phlegm-Heat", keywords: ["phlegm-heat", "phlegm-fire"] },
      { id: "cold-phlegm", label: "Warm Cold-Phlegm", keywords: ["cold", "warm", "thin fluids"] },
      { id: "damp-phlegm", label: "Dry Damp-Phlegm", keywords: ["damp", "transforms phlegm"] },
      { id: "wind-phlegm", label: "Extinguish Wind-Phlegm", keywords: ["wind", "dizziness", "seizures"] },
      { id: "phlegm-constraint", label: "Disperse Phlegm Constraint", keywords: ["constraint", "throat", "chest"] },
    ],
  },
  {
    id: "reduce-food", label: "Reduce Food Stagnation", description: "Digestive and food-reducing formulas",
    keywords: ["food stagnation", "digest", "accumulation"],
    subcategories: [
      { id: "food-stagnation", label: "Reduce Food Stagnation", keywords: ["food stagnation", "digestion"] },
      { id: "food-with-deficiency", label: "Reduce Food and Tonify", keywords: ["strengthens spleen", "tonifies", "supports"] },
    ],
  },
  {
    id: "other", label: "Other Actions", description: "Formulas with specialized actions", keywords: [],
    subcategories: [{ id: "specialized", label: "Specialized Actions", keywords: [] }],
  },
];

const thermalLabels: Record<ThermalProperty, string> = {
  hot: "热 Hot",
  warm: "温 Warm",
  neutral: "平 Neutral",
  cool: "凉 Cool",
  cold: "寒 Cold",
};

const sectionMeta: Record<Section, [string, string]> = {
  home: ["方剂", "Formulas"],
  formulas: ["方剂", "Formulas"],
  herbs: ["中药", "Herbs"],
  compare: ["对照", "Compare"],
  study: ["研习", "Study"],
};

const navSections: Section[] = ["home", "herbs", "compare", "study"];

const categoryChinese: Record<string, string> = {
  "release-exterior": "解表", "clear-heat": "清热", "drain-downward": "泻下",
  harmonize: "和解", "warm-interior": "温里", tonify: "补益",
  "stabilize-bind": "固涩", "calm-spirit": "安神", "open-orifices": "开窍",
  "regulate-qi": "理气", "regulate-blood": "理血", "treat-wind": "治风",
  "treat-dryness": "治燥", "expel-dampness": "祛湿", "dispel-phlegm": "祛痰",
  "reduce-food": "消食", other: "其他",
};

const subcategoryChinese: Record<string, string> = {
  "wind-cold": "风寒", "wind-heat": "风热", "deficiency-exterior": "表虚",
  "damp-heat": "湿热", "ying-blood": "营血热", "heat-toxin": "热毒",
  "organ-fire": "脏腑火热", "deficiency-heat": "虚热", "qi-level": "气分热",
  "heat-accumulation": "热结", "cold-accumulation": "寒积", "moisten-intestines": "润肠",
  "expel-water": "逐水", shaoyang: "少阳", "liver-spleen": "肝脾",
  "stomach-intestines": "胃肠", "ying-wei": "营卫", "rescue-yang": "回阳救逆",
  "warm-kidney": "温肾", "warm-channels": "温经", "warm-middle": "温中",
  "qi-blood": "气血双补", essence: "补精", yin: "补阴", yang: "补阳",
  blood: "补血", qi: "补气", exterior: "固表", lung: "敛肺",
  intestines: "涩肠", "essence-urination": "固精缩尿", bleeding: "止血",
  other: "其他", specialized: "专门功效",
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function matches(values: Array<string | null | undefined>, query: string) {
  return !query || normalize(values.filter(Boolean).join(" ")).includes(normalize(query));
}

function formulaActionText(formula: Formula) {
  return normalize(formula.actions.join(" "));
}

function textMatchesKeywords(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalize(keyword)));
}

const reviewedFormulaCategories: Record<string, string> = {
  "chen xiang san": "regulate-qi",
  "shen tong zhu yu tang": "regulate-blood",
  "xia ru yong quan san": "regulate-qi",
  "ma huang xing ren gan cao shi gao tang": "release-exterior",
  "chai ge jie ji tang": "release-exterior",
  "sheng ma ge gen tang": "release-exterior",
  "da xian xiong tang": "drain-downward",
  "wen pi tang": "drain-downward",
  "da yuan yin": "harmonize",
  "si ni san": "harmonize",
  "ban xia xie xin tang": "harmonize",
  "xi jiao di huang tang": "clear-heat",
  "qing gu san": "clear-heat",
  "qing luo yin": "clear-heat",
  "qi bao mei ran dan": "tonify",
  "bu tian da zao wan": "tonify",
  "sang die san": "stabilize-bind",
  "gui zhi gan cao long gu mu li tang": "calm-spirit",
  "jiao tai wan": "calm-spirit",
  "an gong niu huang wan": "open-orifices",
  "bao long wan": "calm-spirit",
  "tao he cheng qi tang": "regulate-blood",
  "qi li san": "regulate-blood",
  "gui zhi fu ling wan": "regulate-blood",
  "qian zheng san": "treat-wind",
  "yu zhen san": "treat-wind",
  "mai men dong tang": "treat-dryness",
  "qiong yu gao": "treat-dryness",
  "san ren tang": "expel-dampness",
  "ling gan wu wei jiang xin tang": "dispel-phlegm",
  "wu mei wan": "stabilize-bind",
  "si miao yong an tang": "clear-heat",
  "xiao jin dan": "dispel-phlegm",
  "da huang mu dan tang": "clear-heat",
  "nei bu huang qi tang": "tonify",
};

function getActionCategory(formula: Formula) {
  const reviewedCategory = reviewedFormulaCategories[normalize(formula.names.pinyin)];
  if (reviewedCategory) return reviewedCategory;

  const actionText = formulaActionText(formula);
  const chineseCategories: Array<[string, string[]]> = [
    ["release-exterior", ["解表", "发汗", "疏风", "散风"]],
    ["clear-heat", ["清热", "泻火", "解毒", "凉血", "清暑"]],
    ["drain-downward", ["泻下", "攻下", "通便", "润肠"]],
    ["harmonize", ["和解", "调和", "少阳"]],
    ["warm-interior", ["温中", "温里", "回阳", "散寒", "救逆"]],
    ["tonify", ["补气", "益气", "补血", "养血", "滋阴", "养阴", "补阳", "温阳", "补益"]],
    ["stabilize-bind", ["固表", "固精", "固冲", "止汗", "涩肠", "固涩"]],
    ["regulate-qi", ["行气", "理气", "降气", "宽胸"]],
    ["regulate-blood", ["活血", "化瘀", "祛瘀", "止血"]],
    ["treat-wind", ["息风", "熄风", "祛风", "止痉"]],
    ["treat-dryness", ["润燥", "润肺", "生津"]],
    ["expel-dampness", ["祛湿", "利水", "渗湿", "化湿"]],
    ["dispel-phlegm", ["化痰", "涤痰", "消痰"]],
    ["reduce-food", ["消食", "导滞", "消积"]],
  ];
  const chineseCategory = chineseCategories.find(([, keywords]) =>
    keywords.some((keyword) => actionText.includes(keyword))
  );
  if (chineseCategory) return chineseCategory[0];
  if (
    normalize(formula.actions[0] ?? "").includes("phlegm") ||
    actionText.includes("phlegm-heat") ||
    actionText.includes("phlegm-fire")
  ) return "dispel-phlegm";
  for (const action of formula.actions) {
    const normalizedAction = normalize(action);
    const category = actionCategories.find((item) =>
      item.id !== "other" && item.keywords.some((keyword) => normalizedAction.includes(keyword))
    );
    if (category) return category.id;
  }
  return "other";
}

function getActionSubcategory(formula: Formula, category: ActionCategory) {
  const actionText = formulaActionText(formula);
  return category.subcategories.find((subcategory) =>
    textMatchesKeywords(actionText, subcategory.keywords)
  )?.id ?? (category.id === "other" ? "specialized" : "other");
}

type HerbActionSubcategoryGroup = {
  subcategory: ActionSubcategory | { id: "other"; label: "Other"; keywords: string[] };
  evidence: string[];
};

type HerbActionCategoryGroup = {
  category: ActionCategory;
  subcategories: HerbActionSubcategoryGroup[];
};

function herbActionText(herb: Herb) {
  const english = herb.englishReference;
  return normalize([
    english?.actions,
    english?.keyCharacteristics,
  ].filter(Boolean).join(" "));
}

function herbEvidenceText(herb: Herb) {
  const english = herb.englishReference;
  return [
    english?.keyCharacteristics,
    english?.actions,
  ].filter(Boolean).join("\n\n");
}

function extractActionEvidence(source: string, category: ActionCategory, subcategory?: ActionSubcategory | { id: "other"; label: "Other"; keywords: string[] }) {
  const keywords = [...category.keywords, ...(subcategory?.keywords ?? [])].map(normalize).filter(Boolean);
  const chunks = source
    .replace(/\s+/g, " ")
    .split(/(?<=[:.])\s+(?=[A-Z])/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const matched = chunks.filter((chunk) => {
    const normalized = normalize(chunk);
    return keywords.some((keyword) => normalized.includes(keyword));
  });

  return uniqueDisplayValues(matched.length > 0 ? matched : chunks.slice(0, 2)).slice(0, 3);
}

function getHerbActionGroups(herb: Herb, related: Formula[]) {
  const directText = herbActionText(herb);
  const directEvidence = herbEvidenceText(herb);
  const formulaSignals = related.flatMap((formula) => formula.actions);
  const formulaText = normalize(formulaSignals.join(" "));
  const useFormulaFallback = !actionCategories.some((category) =>
    category.id !== "other" && textMatchesKeywords(directText, category.keywords)
  );

  return actionCategories
    .filter((category) => category.id !== "other")
    .map((category): HerbActionCategoryGroup | null => {
      const categoryMatchesDirect = textMatchesKeywords(directText, category.keywords);
      const categoryMatchesFormula = useFormulaFallback && textMatchesKeywords(formulaText, category.keywords);
      if (!categoryMatchesDirect && !categoryMatchesFormula) return null;

      const specificSubcategories = category.subcategories
        .map((subcategory): HerbActionSubcategoryGroup | null => {
          const subcategoryMatchesDirect = textMatchesKeywords(directText, subcategory.keywords);
          const subcategoryMatchesFormula = useFormulaFallback && textMatchesKeywords(formulaText, subcategory.keywords);
          if (!subcategoryMatchesDirect && !subcategoryMatchesFormula) return null;

          return {
            subcategory,
            evidence: subcategoryMatchesDirect && directEvidence
              ? extractActionEvidence(directEvidence, category, subcategory)
              : uniqueDisplayValues(formulaSignals.filter((action) =>
                  textMatchesKeywords(normalize(action), [...category.keywords, ...subcategory.keywords])
                )).slice(0, 3),
          };
        })
        .filter((group): group is HerbActionSubcategoryGroup => Boolean(group));

      const subcategories = [
        ...specificSubcategories,
        ...(specificSubcategories.length === 0
          ? [{
              subcategory: { id: "other" as const, label: "General", keywords: [] },
              evidence: categoryMatchesDirect && directEvidence
                ? extractActionEvidence(directEvidence, category)
                : uniqueDisplayValues(formulaSignals.filter((action) =>
                    textMatchesKeywords(normalize(action), category.keywords)
                  )).slice(0, 3),
            }]
          : []),
      ].filter((group, index, groups) =>
        group.evidence.length > 0 &&
        groups.findIndex((item) => item.subcategory.id === group.subcategory.id) === index
      );

      return subcategories.length > 0 ? { category, subcategories } : null;
    })
    .filter((group): group is HerbActionCategoryGroup => Boolean(group));
}

function relatedFormulasForHerb(herb: Herb, formulas: Formula[]) {
  return herb.formulaIds.map((id) => formulas.find((formula) => formula.id === id)).filter(Boolean) as Formula[];
}

type HerbLibrarySubcategoryGroup = {
  subcategory: ActionSubcategory | { id: "other"; label: "General"; keywords: string[] };
  herbs: Herb[];
};

type HerbLibraryCategoryGroup = {
  category: ActionCategory;
  subcategories: HerbLibrarySubcategoryGroup[];
  count: number;
};

function getHerbLibraryGroups(herbs: Herb[], formulas: Formula[]) {
  const groups = new Map(actionCategories.map((category) => [
    category.id,
    new Map([
      ...category.subcategories.map((subcategory) => [subcategory.id, [] as Herb[]] as const),
      ...(category.id !== "other" ? [["other", [] as Herb[]] as const] : []),
    ]),
  ]));

  for (const herb of herbs) {
    const actionGroups = getHerbActionGroups(herb, relatedFormulasForHerb(herb, formulas));
    if (actionGroups.length === 0) {
      groups.get("other")?.get("specialized")?.push(herb);
      continue;
    }

    for (const actionGroup of actionGroups) {
      for (const subcategoryGroup of actionGroup.subcategories) {
        const subcategoryId = subcategoryGroup.subcategory.id;
        const target = groups.get(actionGroup.category.id)?.get(subcategoryId === "other" ? "other" : subcategoryId);
        if (target && !target.some((item) => item.id === herb.id)) target.push(herb);
      }
    }
  }

  return actionCategories
    .map((category): HerbLibraryCategoryGroup => {
      const categoryGroups = groups.get(category.id);
      const subcategories = [
        ...category.subcategories,
        ...(category.id !== "other" ? [{ id: "other" as const, label: "General", keywords: [] }] : []),
      ]
        .map((subcategory) => ({
          subcategory,
          herbs: categoryGroups?.get(subcategory.id) ?? [],
        }))
        .filter((group) => group.herbs.length > 0);

      return {
        category,
        subcategories,
        count: new Set(subcategories.flatMap((group) => group.herbs.map((herb) => herb.id))).size,
      };
    })
    .filter((group) => group.count > 0);
}

function HerbCard({ language, herb, onOpen }: { language: Language; herb: Herb; onOpen: (herb: Herb) => void }) {
  const primaryChinese = herb.chineseNames[0] || herb.pinyinNames[0] || "";
  const primaryPinyin = herb.pinyinNames[0] || herb.englishNames.find(Boolean) || primaryChinese;
  const secondaryName = herb.englishNames.find(Boolean);

  return (
    <button className="herb-card" key={herb.id} onClick={() => onOpen(herb)}>
      <div className={`herb-color thermal-${herb.thermalProperties[0] ?? "neutral"}`}><Leaf size={19} /></div>
      <h3>{primaryChinese}</h3>
      <div className="herb-card-bottom">
        <span>{primaryPinyin}</span>
        {language === "en" && secondaryName && secondaryName !== primaryPinyin && <small>{secondaryName}</small>}
      </div>
      <div><span>{herb.formulaIds.length} {language === "zh" ? "方" : "formulas"}</span><ArrowRight size={15} /></div>
    </button>
  );
}

const channelMeta: Record<string, { label: string; className: string }> = {
  lung: { label: "LU", className: "channel-metal" },
  "large intestine": { label: "LI", className: "channel-metal" },
  stomach: { label: "ST", className: "channel-earth" },
  spleen: { label: "SP", className: "channel-earth" },
  heart: { label: "HT", className: "channel-fire" },
  "small intestine": { label: "SI", className: "channel-fire" },
  bladder: { label: "BL", className: "channel-water" },
  kidney: { label: "KI", className: "channel-water" },
  pericardium: { label: "PC", className: "channel-fire" },
  "triple burner": { label: "SJ", className: "channel-fire" },
  "san jiao": { label: "SJ", className: "channel-fire" },
  gallbladder: { label: "GB", className: "channel-wood" },
  "gall bladder": { label: "GB", className: "channel-wood" },
  liver: { label: "LR", className: "channel-wood" },
  ren: { label: "REN", className: "channel-extra" },
  du: { label: "DU", className: "channel-extra" },
};

function parseChannels(value?: string) {
  if (!value) return [];
  return uniqueDisplayValues(
    value
      .replace(/\band\b/gi, ",")
      .split(/[,;/]+/)
      .map((channel) => channel.trim())
      .filter(Boolean),
    (channel) => normalize(channel)
  )
    .map((channel) => {
      const meta = channelMeta[normalize(channel)] ?? {
        label: channel.slice(0, 2).toUpperCase(),
        className: "channel-extra",
      };
      return { name: channel, ...meta };
    });
}

function parseDoseChips(...values: Array<string | string[] | null | undefined>) {
  const doses = values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.match(/\d+(?:\.\d+)?\s*(?:-\s*\d+(?:\.\d+)?)?\s*(?:g|mg|ml)?/gi) ?? [])
    .map((value) => value.replace(/\s+/g, " ").replace(/-\s+/g, "-").trim());

  return uniqueDisplayValues(doses);
}

function stripOcrSectionHeaders(value: string) {
  return value
    .split(/\b(?:DOSAGE|DosAGE|DoSAGE|CAUTIONS?\s*(?:&|AND)?\s*CONTRAINDICATIONS?|CONTRAINDICATIONS?|COMMENTARY|Mechanisms of Selected Combinations|TRADITIONAL CONTRAINDICATIONS|TOXICITY|NOMENCLATURE)\b/i)[0]
    .replace(/^\s*\d+\s+(?:\/\s*)?(?:Herbs|Substances)\b[^-:;.]*/i, "")
    .replace(/^\s*\d+(?:\s+\d+)?\s+(?=[-:])/i, "")
    .trim();
}

function parseActionBullets(value: string) {
  const withoutCombinationLines = value
    .split(/\n/)
    .filter((line) => !/^[\s>\-]*with\b/i.test(line.trim()))
    .filter((line) => !/^\s*[-–—]*\s*with\b/i.test(line.trim()))
    .join(" ");

  const cleaned = withoutCombinationLines
    .replace(/\s+/g, " ")
    .replace(/^:\s*/, "")
    .trim();

  const chunks = cleaned
    .split(/(?<=[.:])\s+(?=(?:Tonif|Open|Promot|Warm|Clear|Drain|Dispel|Expel|Regulat|Move|Stop|Calm|Nourish|Transform|Resolve|Anchor|Descend|Raise|Release)\w*\b)/i)
    .map((chunk) => chunk.trim().replace(/^[-–—]\s*/, "").replace(/\s*-\s*$/, ""))
    .filter(Boolean);

  return uniqueDisplayValues(chunks.length > 1 ? chunks : cleaned.split(/\s+-\s+/)).slice(0, 8);
}

function parseHerbActionsAndIndications(value: string) {
  const cleanedValue = stripOcrSectionHeaders(value);
  const actions: string[] = [];
  const indications: string[] = [];
  const actionStartPattern = /^\s*[-–—:]?\s*(releases?|expels?|opens?|promotes?|tonif(?:y|ies)|warms?|clears?|drains?|dispels?|regulates?|moves?|stops?|calms?|nourishes?|transforms?|resolves?|anchors?|descends?|raises?)\b/i;
  const entries: string[] = [];
  let current = "";
  let skippingCombination = false;

  for (const rawLine of cleanedValue.split(/\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[\s>\-]*with\b/i.test(line)) {
      skippingCombination = true;
      continue;
    }

    if (/^[-–—]*\s*with\b/i.test(line)) {
      skippingCombination = true;
      continue;
    }

    const startsAction = actionStartPattern.test(line) || /^[\s:>\-]*(invigorates?|checks?|induces?)\b/i.test(line);
    if (startsAction) {
      if (current) entries.push(current);
      current = line.replace(/^[-–—:]\s*/, "");
      skippingCombination = false;
      continue;
    }

    if (!skippingCombination && current) current = `${current} ${line}`;
  }

  if (current) entries.push(current);

  for (const bullet of (entries.length > 0 ? entries : parseActionBullets(cleanedValue))) {
    const colonMatch = bullet.match(/^(.+?):\s*(.+)$/);
    const forMatch = bullet.match(/^(.+?)\s+for\s+(.+)$/i);

    if (colonMatch) {
      actions.push(colonMatch[1].replace(/^[-–—]\s*/, "").trim());
      indications.push(...simplifyIndicationText(colonMatch[2]));
    } else if (forMatch) {
      actions.push(forMatch[1].replace(/^[-–—]\s*/, "").trim());
      indications.push(...simplifyIndicationText(forMatch[2]));
    } else {
      actions.push(bullet.replace(/^[-–—]\s*/, "").trim());
    }
  }

  return {
    actions: uniqueDisplayValues(actions).slice(0, 8),
    indications: uniqueDisplayValues(indications).slice(0, 8),
  };
}

function parseKeyCharacteristicActions(value: string) {
  return uniqueDisplayValues(
    value
      .replace(/\s+/g, " ")
      .split(/[;,]/)
      .map((item) => item.trim().replace(/^and\s+/i, ""))
      .filter((item) => item.length > 2)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
  ).slice(0, 5);
}

function simplifyIndicationText(value: string) {
  return value
    .replace(/^for\s+/i, "")
    .replace(/\bas in\b.+$/i, "")
    .replace(/\bespecially when\b/gi, "when")
    .split(/[,.;]|\band\b/i)
    .map((item) => item.trim().replace(/^for\s+/i, ""))
    .filter((item) => item.length > 2 && !/^with\b/i.test(item))
    .slice(0, 5);
}

type HerbCombination = {
  title: string;
  notes: string[];
};

function formatCombinationTitle(value: string) {
  const pinyinMatch = value.match(/^With\s+.+?\(([^)]+)\)$/i);
  if (!pinyinMatch) return value;

  const pinyin = pinyinMatch[1]
    .replace(/(?<=[a-z])(?:0|6)(?=[a-z])/gi, "o")
    .replace(/\d/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return pinyin ? `With ${pinyin}` : value;
}

function parseHerbCombinations(value: string) {
  const sections = value
    .split(/\n(?=>\s*(?:WITH|WrTH)\b)/i)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.map((section): HerbCombination => {
    const lines = section.split(/\n/).map((line) => line.trim()).filter(Boolean);
    const rawTitle = lines.shift() ?? "Combination";
    const titleParts = rawTitle
      .replace(/^>\s*/g, "")
      .replace(/^(?:WITH|WrTH)\s+/i, "With ")
      .replace(/\s+/g, " ")
      .split(/\s*;\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
    const title = formatCombinationTitle(titleParts.shift() ?? "Combination");
    const titleNotes = titleParts
      .map((note) => note.charAt(0).toUpperCase() + note.slice(1));
    const body = lines.join(" ").replace(/\s+/g, " ").trim();
    const bodyNotes = body
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((note) => note.trim())
      .filter(Boolean);
    const notes = [...titleNotes, ...bodyNotes];

    return {
      title,
      notes: notes.length > 0 ? notes : [body].filter(Boolean),
    };
  });
}

export function ReferenceApp({ data }: { data: ReferenceData }) {
  const [section, setSection] = useState<Section>("home");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [thermal, setThermal] = useState<ThermalProperty | "all">("all");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [brandIcon, setBrandIcon] = useState("🌿");

  useEffect(() => {
    const saved = localStorage.getItem("herbz-bookmarks");
    if (saved) {
      const canonicalByVariant = new Map(
        data.formulas.flatMap((formula) =>
          formula.variantIds.map((variantId) => [variantId, formula.id] as const)
        )
      );
      const migrated = [...new Set(
        (JSON.parse(saved) as string[])
          .map((id) => canonicalByVariant.get(id))
          .filter((id): id is string => Boolean(id))
      )];
      queueMicrotask(() => setBookmarks(migrated));
      localStorage.setItem("herbz-bookmarks", JSON.stringify(migrated));
    }
    if ("serviceWorker" in navigator) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      navigator.serviceWorker.register(`${basePath}/sw.js`);
    }
  }, [data.formulas]);

  useEffect(() => {
    const syncIcon = (event?: Event) => {
      const customEvent = event as CustomEvent<string> | undefined;
      setBrandIcon(customEvent?.detail || document.documentElement.dataset.herbzIcon || "🌿");
    };

    syncIcon();
    window.addEventListener("herbz-icon-change", syncIcon);
    return () => window.removeEventListener("herbz-icon-change", syncIcon);
  }, []);

  const usagesByFormula = useMemo(() => {
    const map = new Map<string, Usage[]>();
    for (const usage of data.usages) map.set(usage.formulaId, [...(map.get(usage.formulaId) ?? []), usage]);
    return map;
  }, [data.usages]);

  const formulas = useMemo(() => data.formulas.filter((formula) => matches([
    formula.names.chinese,
    formula.names.pinyin,
    formula.names.english,
    ...formula.actions,
    formula.indications,
    ...formula.ingredients.flatMap((item) => [item.chineseName, item.pinyin, item.englishName]),
    formula.americanDragonReference?.englishName,
    ...(formula.americanDragonReference?.alsoKnownAs ?? []),
    ...(formula.americanDragonReference?.formulaActions ?? []),
    ...(formula.americanDragonReference?.syndromes ?? []),
    ...(formula.americanDragonReference?.clinicalManifestations ?? []),
    ...(formula.americanDragonReference?.treats ?? []),
    ...(formula.americanDragonReference?.ingredients.flatMap((item) => [
      item.pharmaceuticalLatin,
      item.pinyin,
      item.actions,
    ]) ?? []),
    ...(usagesByFormula.get(formula.id) ?? []).flatMap((usage) => [
      usage.conditionName,
      usage.conditionPinyin,
      usage.patternName,
      usage.treatmentPrinciple,
    ]),
  ], query)), [data.formulas, query, usagesByFormula]);

  const herbs = useMemo(() => data.herbs.filter((herb) =>
    (thermal === "all" || herb.thermalProperties.includes(thermal)) &&
    matches([
      ...herb.chineseNames,
      ...herb.pinyinNames,
      ...herb.englishNames,
      ...herb.observedDoses,
      herb.englishReference?.pharmaceuticalName,
      herb.englishReference?.englishName,
      herb.englishReference?.properties,
      herb.englishReference?.channels,
      herb.englishReference?.keyCharacteristics,
      herb.englishReference?.actions,
      herb.englishReference?.commentary,
    ], query)
  ), [data.herbs, query, thermal]);

  function toggleBookmark(id: string) {
    setBookmarks((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("herbz-bookmarks", JSON.stringify(next));
      return next;
    });
  }

  function toggleCompare(id: string) {
    setCompareIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3 ? [...current, id] : [current[1], current[2], id]
    );
  }

  function addToCompare(id: string) {
    setCompareIds((current) =>
      current.includes(id)
        ? current
        : current.length < 3 ? [...current, id] : [current[1], current[2], id]
    );
  }

  function navigate(next: Section) {
    setSection(next);
    setMobileNav(false);
    if (next === "formulas" || next === "herbs") setQuery("");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">{brandIcon}</div>
          <strong>HERBZ</strong>
        </div>
        <nav className="main-nav" aria-label="Primary navigation">
          {navSections.map((key) => {
            const Icon = key === "home" ? FlaskConical : key === "herbs" ? Leaf : key === "compare" ? Columns2 : GraduationCap;
            return (
              <button key={key} className={section === key ? "active" : ""} onClick={() => navigate(key)}>
                <Icon size={19} />
                <span>{sectionMeta[key][language === "zh" ? 0 : 1]}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note"><BookOpen size={18} /><div><strong>{language === "zh" ? "私人学习资料库" : "Private educational reference"}</strong></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="global-search">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={language === "zh" ? "搜索方名、中药、功效、证候或拼音…" : "Search formulas, herbs, actions, patterns, or pinyin…"}
            />
            {query && <button onClick={() => setQuery("")} aria-label={language === "zh" ? "清除搜索" : "Clear search"}><X size={17} /></button>}
          </div>
          <button className="language-switch" onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>
            <Languages size={17} />{language === "zh" ? "EN" : "Chinese"}
          </button>
        </header>

        <div className="content">
          {section === "home" && <HomeCategories language={language} formulas={formulas} total={data.formulas.length} query={query} onBrowseAll={() => navigate("formulas")} onOpen={(item) => setDetail({ type: "formula", item })} />}
          {section === "formulas" && (
            <FormulaLibrary language={language} formulas={formulas} total={data.formulas.length} bookmarks={bookmarks} compareIds={compareIds}
              usagesByFormula={usagesByFormula} onOpen={(item) => setDetail({ type: "formula", item })}
              onBookmark={toggleBookmark} onCompare={toggleCompare} onCompareNow={() => navigate("compare")} />
          )}
          {section === "herbs" && <HerbLibrary language={language} herbs={herbs} formulas={data.formulas} total={data.herbs.length} thermal={thermal} setThermal={setThermal} onOpen={(item) => setDetail({ type: "herb", item })} />}
          {section === "compare" && <CompareView language={language} formulas={data.formulas} compareIds={compareIds} onRemove={toggleCompare} onBrowse={() => navigate("formulas")} usagesByFormula={usagesByFormula} />}
          {section === "study" && <StudyView language={language} formulas={data.formulas} bookmarks={bookmarks} onOpen={(item) => setDetail({ type: "formula", item })} />}
        </div>
      </main>

      {detail && (
        <DetailDrawer language={language} detail={detail} formulas={data.formulas}
          usages={detail.type === "formula" ? usagesByFormula.get(detail.item.id) ?? [] : []}
          bookmarked={bookmarks.includes(detail.item.id)} onBookmark={toggleBookmark}
          compareIds={compareIds} onAddCompare={addToCompare}
          onClose={() => setDetail(null)} onFormulaOpen={(item) => setDetail({ type: "formula", item })} />
      )}
    </div>
  );
}

function HomeCategories({ language, formulas, total, query, onBrowseAll, onOpen }: {
  language: Language;
  formulas: Formula[];
  total: number;
  query: string;
  onBrowseAll: () => void;
  onOpen: (formula: Formula) => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups = new Map(actionCategories.map((category) => [
      category.id,
      new Map([
        ...category.subcategories.map((subcategory) => [subcategory.id, [] as Formula[]] as const),
        ...(category.id !== "other" ? [["other", [] as Formula[]] as const] : []),
      ]),
    ]));

    for (const formula of formulas) {
      const categoryId = getActionCategory(formula);
      const category = actionCategories.find((item) => item.id === categoryId) ?? actionCategories.at(-1)!;
      const subcategoryId = getActionSubcategory(formula, category);
      groups.get(category.id)?.get(subcategoryId)?.push(formula);
    }

    return actionCategories
      .map((category) => {
        const categoryGroups = groups.get(category.id);
        const subcategories = [
          ...category.subcategories,
          ...(category.id !== "other" ? [{ id: "other", label: "Other", keywords: [] }] : []),
        ]
          .map((subcategory) => ({
            subcategory,
            formulas: categoryGroups?.get(subcategory.id) ?? [],
          }))
          .filter((group) => group.formulas.length > 0);

        return {
          category,
          subcategories,
          count: subcategories.reduce((sum, group) => sum + group.formulas.length, 0),
        };
      })
      .filter((group) => group.count > 0);
  }, [formulas]);

  if (query) {
    return (
      <section className="category-browser">
        <NavigatorHeading
          kicker={language === "zh" ? "搜索结果" : "SEARCH RESULTS"}
          title={language === "zh" ? `${formulas.length} 个匹配方剂` : `${formulas.length} matching ${formulas.length === 1 ? "formula" : "formulas"}`}
          description={language === "zh" ? "选择方剂以查看完整资料。" : "Select a formula to open its full reference entry."}
        />
        <div className="navigator-formula-grid">
          {grouped.flatMap(({ category, subcategories }) =>
            subcategories.flatMap(({ subcategory, formulas: subgroupFormulas }) =>
              subgroupFormulas.map((formula) => (
                <button className="navigator-formula-card" key={formula.id} onClick={() => onOpen(formula)}>
                  <span className="navigator-path">{language === "zh" ? categoryChinese[category.id] : category.label} / {language === "zh" ? subcategoryChinese[subcategory.id] ?? subcategory.label : subcategory.label}</span>
                  <strong>{formula.names.chinese}</strong>
                  <span className="formula-pinyin">{formula.names.pinyin}</span>
                  {language === "en" && formula.names.english && <small>{formula.names.english}</small>}
                  <ArrowRight size={16} />
                </button>
              ))
            )
          )}
        </div>
        {!formulas.length && <EmptyState label="No formulas match this search." />}
      </section>
    );
  }

  return (
    <section className="category-browser">
      <NavigatorHeading
          kicker={language === "zh" ? "方剂库" : "FORMULA LIBRARY"}
          title={language === "zh" ? "方剂库" : "Formula Library"}
          description={language === "zh" ? `${total} 个方剂按教材主要功效整理。` : `${total} formulas organized by primary textbook action.`}
      >
        <div className="navigator-heading-actions">
        <button className="navigator-action-button" onClick={onBrowseAll}>
          {language === "zh" ? "按 A-Z 查看全部方剂" : "See all formulas A to Z"}
          <ArrowRight size={16} />
        </button>
        </div>
      </NavigatorHeading>
      <div className="category-strip-list tight-category-grid">
        {grouped.map(({ category, subcategories, count }, index) => {
          const categoryOpen = selectedCategoryId === category.id;
          return (
            <section className={`category-strip-group category-tone-${index % 5} ${categoryOpen ? "is-open" : ""}`} key={category.id}>
              <button
                className="category-strip"
                onClick={() => {
                  setSelectedCategoryId(categoryOpen ? null : category.id);
                  setSelectedSubcategoryId(null);
                }}
                aria-expanded={categoryOpen}
              >
                <span>{language === "zh" ? categoryChinese[category.id] : category.label}</span>
                <span><strong>{count}</strong><ChevronDown size={18} /></span>
              </button>
              {categoryOpen && (
                <div className="subcategory-strip-list">
                  {subcategories.map(({ subcategory, formulas: subgroupFormulas }) => {
                    const subcategoryOpen = selectedSubcategoryId === subcategory.id;
                    return (
                      <section className={`subcategory-strip-group ${subcategoryOpen ? "is-open" : ""}`} key={subcategory.id}>
                        <button
                          className="subcategory-strip"
                          onClick={() => setSelectedSubcategoryId(subcategoryOpen ? null : subcategory.id)}
                          aria-expanded={subcategoryOpen}
                        >
                          <span>{language === "zh" ? subcategoryChinese[subcategory.id] ?? subcategory.label : subcategory.label}</span>
                          <span><strong>{subgroupFormulas.length}</strong><ChevronDown size={16} /></span>
                        </button>
                        {subcategoryOpen && (
                          <div className="strip-formula-grid">
                            {subgroupFormulas.map((formula) => (
                              <button className="strip-formula-card" key={formula.id} onClick={() => onOpen(formula)}>
                                <strong>{formula.names.chinese}</strong>
                                <span className="formula-pinyin">{formula.names.pinyin}</span>
                                {language === "en" && formula.names.english && <small>{formula.names.english}</small>}
                              </button>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function NavigatorHeading({ kicker, title, description, onBack, children }: {
  kicker: string;
  title: string;
  description: string;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="navigator-heading">
      {onBack && <button className="navigator-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>}
      <span>{kicker}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function Home({ data, language, bookmarks, onNavigate, onOpen }: {
  data: ReferenceData; language: "zh" | "en"; bookmarks: string[];
  onNavigate: (section: Section) => void; onOpen: (formula: Formula) => void;
}) {
  const featured = data.formulas.filter((formula) => formula.usageCount > 2).slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">中医方药 · 双语参考</div>
          <h1>{language === "zh" ? "从方到药，" : "From formula to herb,"}<span>{language === "zh" ? "一脉贯通。" : "connected with clarity."}</span></h1>
          <p>{language === "zh" ? "面向学习与临床查阅的私人资料库。快速检索方剂组成、功效、主治、证候及中药属性。" : "A private study and clinical reference for formula composition, actions, indications, patterns, and materia medica."}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onNavigate("formulas")}>浏览方剂 <ArrowRight size={17} /></button>
            <button className="secondary-button" onClick={() => onNavigate("study")}><GraduationCap size={17} /> 开始研习</button>
          </div>
        </div>
        <div className="hero-seal" aria-hidden="true"><span>方</span><span>药</span></div>
      </section>
      <section className="stats-grid">
        <Stat icon={FlaskConical} value={data.stats.variants} label="方剂版本" english="Formula variants" />
        <Stat icon={Leaf} value={data.stats.herbs} label="中药索引" english="Indexed herbs" />
        <Stat icon={Library} value={data.stats.usages} label="临床关联" english="Clinical links" />
        <Stat icon={Bookmark} value={bookmarks.length} label="我的收藏" english="Bookmarks" />
      </section>
      <section className="section-block">
        <div className="section-heading"><div><span>常用方剂</span><h2>从这里继续查阅</h2></div><button className="text-button" onClick={() => onNavigate("formulas")}>查看全部 <ArrowRight size={16} /></button></div>
        <div className="formula-grid">{featured.map((formula, index) => <FormulaCard key={formula.id} formula={formula} index={index} onOpen={onOpen} />)}</div>
      </section>
      <section className="source-strip"><div><BookOpen size={22} /><strong>资料来源</strong></div><p>方剂学 · 中药学 · ACU Five clinical reference</p><span>仅供学习参考 · Educational use only</span></section>
    </>
  );
}

function Stat({ icon: Icon, value, label, english }: { icon: typeof Leaf; value: number; label: string; english: string }) {
  return <article className="stat-card"><Icon size={20} /><strong>{value}</strong><div><span>{label}</span><small>{english}</small></div></article>;
}

function FormulaCard({ formula, index, onOpen }: { formula: Formula; index: number; onOpen: (formula: Formula) => void }) {
  return (
    <button className={`formula-card tone-card-${index % 4}`} onClick={() => onOpen(formula)}>
      <div className="formula-card-top"><span>{formula.names.chinese.slice(0, 1)}</span><ArrowRight size={17} /></div>
      <h3>{formula.names.chinese}</h3><span className="formula-pinyin">{formula.names.pinyin}</span>
      <p>{formula.actions.slice(0, 2).join(" · ")}</p>
      <div className="mini-ingredients">
        {formula.ingredients.slice(0, 5).map((ingredient) => <span className={`thermal-${ingredient.thermalProperty}`} key={ingredient.position}>{ingredient.chineseName}</span>)}
        {formula.ingredients.length > 5 && <span>+{formula.ingredients.length - 5}</span>}
      </div>
    </button>
  );
}

function FormulaLibrary({ language, formulas, total, bookmarks, compareIds, usagesByFormula, onOpen, onBookmark, onCompare, onCompareNow }: {
  language: Language;
  formulas: Formula[]; total: number; bookmarks: string[]; compareIds: string[]; usagesByFormula: Map<string, Usage[]>;
  onOpen: (formula: Formula) => void; onBookmark: (id: string) => void; onCompare: (id: string) => void; onCompareNow: () => void;
}) {
  return (
    <section>
      <PageHeading kicker={language === "zh" ? "方剂库" : "FORMULA LIBRARY"} title={language === "zh" ? "方剂全览" : "Formula Library"} description={language === "zh" ? `显示 ${formulas.length} / ${total} 个方剂。` : `Showing ${formulas.length} of ${total} formulas.`} />
      <div className="result-toolbar"><span>{formulas.length} results</span>{compareIds.length > 0 && <button className="compare-pill" onClick={onCompareNow}><Columns2 size={15} /> 对照 {compareIds.length}</button>}</div>
      <div className="formula-list">
        {formulas.map((formula, index) => (
          <article className="formula-row" key={formula.id}>
            <button className="row-main" onClick={() => onOpen(formula)}>
              <span className={`category-dot tone-${index % 5}`} />
              <div className="formula-name"><strong>{formula.names.chinese}</strong><span>{formula.names.pinyin}</span>{language === "en" && formula.names.english && <small>{formula.names.english}</small>}</div>
              {language === "en" && <div className="row-action"><span>ACTIONS</span><p>{formula.actions.join(" · ")}</p></div>}
              <div className="row-clinical"><span>{formula.ingredients.length} {language === "zh" ? "味药" : "ingredients"}</span><span>{usagesByFormula.get(formula.id)?.length ?? 0} {language === "zh" ? "临床关联" : "clinical links"}</span></div>
              <ArrowRight size={18} />
            </button>
            <div className="row-tools">
              <button className={compareIds.includes(formula.id) ? "selected" : ""} onClick={() => onCompare(formula.id)} title="Compare"><Columns2 size={16} /></button>
              <button className={bookmarks.includes(formula.id) ? "selected" : ""} onClick={() => onBookmark(formula.id)} title="Bookmark"><Bookmark size={16} fill={bookmarks.includes(formula.id) ? "currentColor" : "none"} /></button>
            </div>
          </article>
        ))}
        {!formulas.length && <EmptyState label="没有找到匹配的方剂" />}
      </div>
    </section>
  );
}

function HerbLibrary({ language, herbs, formulas, total, thermal, setThermal, onOpen }: {
  language: Language;
  herbs: Herb[];
  formulas: Formula[];
  total: number;
  thermal: ThermalProperty | "all";
  setThermal: (value: ThermalProperty | "all") => void;
  onOpen: (herb: Herb) => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const grouped = useMemo(() => getHerbLibraryGroups(herbs, formulas), [herbs, formulas]);

  return (
    <section>
      <PageHeading kicker={language === "zh" ? "中药库" : "MATERIA MEDICA"} title={language === "zh" ? "中药索引" : "Herb Library"} description={language === "zh" ? `显示 ${herbs.length} / ${total} 味中药。` : `Showing ${herbs.length} of ${total} herbs by action category.`} />
      <div className="thermal-filters">
        {(["all", "hot", "warm", "neutral", "cool", "cold"] as const).map((item) => (
          <button key={item} className={`${thermal === item ? "active" : ""} filter-${item}`} onClick={() => setThermal(item)}>
            {item === "all" ? (language === "zh" ? "全部" : "All") : language === "zh" ? thermalLabels[item].split(" ")[0] : thermalLabels[item].split(" ").at(-1)}
          </button>
        ))}
      </div>
      <div className="category-strip-list tight-category-grid herb-category-strip-list">
        {grouped.map(({ category, subcategories, count }, index) => {
          const categoryOpen = selectedCategoryId === category.id;
          return (
            <section className={`category-strip-group category-tone-${index % 5} ${categoryOpen ? "is-open" : ""}`} key={category.id}>
              <button
                className="category-strip"
                onClick={() => {
                  setSelectedCategoryId(categoryOpen ? null : category.id);
                  setSelectedSubcategoryId(null);
                }}
                aria-expanded={categoryOpen}
              >
                <span>{language === "zh" ? categoryChinese[category.id] : category.label}</span>
                <span><strong>{count}</strong><ChevronDown size={18} /></span>
              </button>
              {categoryOpen && (
                <div className="subcategory-strip-list">
                  {subcategories.map(({ subcategory, herbs: subgroupHerbs }) => {
                    const subcategoryOpen = selectedSubcategoryId === subcategory.id;
                    return (
                      <section className={`subcategory-strip-group ${subcategoryOpen ? "is-open" : ""}`} key={subcategory.id}>
                        <button
                          className="subcategory-strip"
                          onClick={() => setSelectedSubcategoryId(subcategoryOpen ? null : subcategory.id)}
                          aria-expanded={subcategoryOpen}
                        >
                          <span>{language === "zh" ? subcategoryChinese[subcategory.id] ?? subcategory.label : subcategory.label}</span>
                          <span><strong>{subgroupHerbs.length}</strong><ChevronDown size={16} /></span>
                        </button>
                        {subcategoryOpen && (
                          <div className="herb-grid herb-strip-grid">
                            {subgroupHerbs.map((herb) => <HerbCard key={herb.id} language={language} herb={herb} onOpen={onOpen} />)}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
        {!herbs.length && <EmptyState label="没有找到匹配的中药" />}
        {herbs.length > 0 && grouped.length === 0 && <EmptyState label={language === "zh" ? "没有功效分类" : "No action categories found."} />}
      </div>
    </section>
  );
}

function CompareView({ language, formulas, compareIds, onRemove, onBrowse, usagesByFormula }: {
  language: Language;
  formulas: Formula[]; compareIds: string[]; onRemove: (id: string) => void; onBrowse: () => void; usagesByFormula: Map<string, Usage[]>;
}) {
  const selected = compareIds.map((id) => formulas.find((formula) => formula.id === id)).filter(Boolean) as Formula[];
  return (
    <section>
      <PageHeading kicker={language === "zh" ? "并列比较" : "SIDE BY SIDE"} title={language === "zh" ? "方剂对照" : "Formula Comparison"} description={language === "zh" ? "最多选择三个方剂进行比较。" : "Compare up to three formulas."} />
      {selected.length < 2 ? (
        <div className="empty-panel"><Columns2 size={34} /><h3>{language === "zh" ? "选择至少两个方剂" : "Select at least two formulas"}</h3><button className="primary-button" onClick={onBrowse}>{language === "zh" ? "浏览方剂" : "Browse formulas"}</button></div>
      ) : (
        <div className="comparison-grid" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
          {selected.map((formula) => (
            <article className="comparison-card" key={formula.id}>
              <button className="comparison-remove" onClick={() => onRemove(formula.id)}><X size={16} /></button>
              <h2>{formula.names.chinese}</h2><span className="formula-pinyin">{formula.names.pinyin}</span>{language === "en" && formula.names.english && <small className="formula-english">{formula.names.english}</small>}
              <CompareSection title={language === "zh" ? "组成" : "Ingredients"}><div className="compare-ingredients">{formula.ingredients.map((item) => <span className={`ingredient-${item.thermalProperty}`} key={item.position}>{item.chineseName}<small>{item.dose}</small></span>)}</div></CompareSection>
              {language === "en" && <><CompareSection title="Actions">{formula.actions.map((action) => <p key={action}>{action}</p>)}</CompareSection><CompareSection title="Indications"><p>{formula.indications}</p></CompareSection><CompareSection title="Patterns">{(usagesByFormula.get(formula.id) ?? []).slice(0, 5).map((usage) => <p key={usage.id}>{usage.patternName}</p>)}</CompareSection></>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CompareSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="compare-section"><h4>{title}</h4>{children}</section>;
}

function StudyView({ language, formulas, bookmarks, onOpen }: { language: Language; formulas: Formula[]; bookmarks: string[]; onOpen: (formula: Formula) => void }) {
  const pool = bookmarks.length ? formulas.filter((formula) => bookmarks.includes(formula.id)) : formulas;
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const formula = pool[index % Math.max(pool.length, 1)];

  function next(random = false) {
    if (!pool.length) return;
    setIndex(random ? Math.floor(Math.random() * pool.length) : (index + 1) % pool.length);
    setRevealed(false);
  }

  return (
    <section>
      <PageHeading kicker={language === "zh" ? "研习模式" : "STUDY MODE"} title={language === "zh" ? "方剂研习" : "Formula Study"} description={language === "zh" ? `当前卡组含 ${pool.length} 个方剂。` : `${pool.length} formulas in the current study deck.`} />
      {formula && <div className="study-layout">
        <div className={`study-card ${revealed ? "revealed" : ""}`}>
          <div className="study-card-label">{language === "zh" ? "辨认方剂" : "IDENTIFY THE FORMULA"}</div>
          {language === "zh" ? <div className="study-formula-prompt"><h2>{formula.names.chinese}</h2><span>{formula.names.pinyin}</span></div> : <h2>{formula.actions.join(" · ")}</h2>}
          <div className="study-clues">{formula.ingredients.slice(0, 6).map((item) => <span className={`ingredient-${item.thermalProperty}`} key={item.position}>{item.chineseName}</span>)}</div>
          {!revealed ? <button className="primary-button" onClick={() => setRevealed(true)}>{language === "zh" ? "显示答案" : "Show answer"}</button> : <div className="study-answer"><Check size={23} /><div><strong>{formula.names.chinese}</strong><span>{formula.names.pinyin}</span>{language === "en" && formula.names.english && <small>{formula.names.english}</small>}</div></div>}
        </div>
        <div className="study-controls">
          <div><span>{language === "zh" ? "卡组进度" : "Deck progress"}</span><strong>{index + 1} / {pool.length}</strong></div><progress value={index + 1} max={pool.length} />
          <button onClick={() => next(false)}>{language === "zh" ? "下一张" : "Next"} <ArrowRight size={16} /></button>
          <button onClick={() => next(true)}><Shuffle size={16} /> {language === "zh" ? "随机抽取" : "Random"}</button>
          <button onClick={() => onOpen(formula)}><BookOpen size={16} /> {language === "zh" ? "查看完整条目" : "Open reference"}</button>
        </div>
      </div>}
    </section>
  );
}

function DetailDrawer({ language, detail, formulas, usages, bookmarked, compareIds, onBookmark, onAddCompare, onClose, onFormulaOpen }: {
  language: Language; detail: Detail; formulas: Formula[]; usages: Usage[]; bookmarked: boolean;
  compareIds: string[];
  onBookmark: (id: string) => void; onAddCompare: (id: string) => void; onClose: () => void; onFormulaOpen: (formula: Formula) => void;
}) {
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="detail-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-toolbar"><button onClick={onClose}><ArrowLeft size={18} /> {language === "zh" ? "返回" : "Back"}</button><span>{language === "zh" ? "教材参考" : "TEXTBOOK REFERENCE"}</span><button onClick={() => onBookmark(detail.item.id)}><Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} /></button></div>
        {detail.type === "formula" ? <FormulaDetail language={language} formula={detail.item} usages={usages} isCompared={compareIds.includes(detail.item.id)} onAddCompare={onAddCompare} /> : <HerbDetail language={language} herb={detail.item} formulas={formulas} onFormulaOpen={onFormulaOpen} />}
      </aside>
    </div>
  );
}

function FormulaDetail({ language, formula, usages, isCompared, onAddCompare }: {
  language: Language;
  formula: Formula;
  usages: Usage[];
  isCompared: boolean;
  onAddCompare: (id: string) => void;
}) {
  const web = formula.americanDragonReference;
  const textbook = formula.textbookReference;
  const indicationDetails = parseIndications(
    formula.indications,
    web?.clinicalManifestations ?? [],
    formula.actions
  );
  const diagnosticSigns = [
    indicationDetails.pulse && { label: "Pulse", value: indicationDetails.pulse },
    indicationDetails.tongue && { label: "Tongue", value: indicationDetails.tongue },
    indicationDetails.coating && { label: "Coating", value: indicationDetails.coating },
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const clinicalCorrelates = [...new Set(usages.map((usage) => {
    const condition = usage.conditionName?.trim();
    const pattern = usage.patternName?.trim();
    if (condition && pattern) return `${condition} - ${pattern}`;
    return condition || pattern;
  }).filter((value): value is string => Boolean(value)))];

  return (
    <div className="detail-content">
      <button className={`formula-detail-compare-button ${isCompared ? "is-selected" : ""}`} onClick={() => onAddCompare(formula.id)}>
        <Columns2 size={16} />
        <span>{isCompared ? (language === "zh" ? "已加入" : "Added") : (language === "zh" ? "加入对照" : "Compare")}</span>
      </button>
      <div className="detail-title formula-detail-title"><div><span>{language === "zh" ? "方剂" : "FORMULA"}</span><h1>{formula.names.chinese}</h1><p>{formula.names.pinyin}</p>{formula.names.english && <small>{formula.names.english}</small>}</div></div>
      <DetailSection title={language === "zh" ? "组成" : "Ingredients"}>
        <div className="ingredient-grid">
          {formula.ingredients.map((ingredient) => (
            <article className={`ingredient-tile ingredient-${ingredient.thermalProperty}`} key={ingredient.position}>
              <div className="ingredient-color-panel">
                <div className="ingredient-identity">
                  <div className="ingredient-western-names">
                    <span>{ingredient.pinyin}</span>
                    {ingredient.englishName && <small>{ingredient.englishName}</small>}
                  </div>
                  <strong>{ingredient.chineseName}</strong>
                </div>
              </div>
              <div className="ingredient-dose">
                <strong>{ingredient.dose || "—"}</strong>
              </div>
            </article>
          ))}
        </div>
      </DetailSection>
      {language === "en" && <div className="two-column-detail">
        <DetailSection title="Actions">
          <EmojiPointList values={formula.actions} />
        </DetailSection>
        <DetailSection title="Indications">
          <EmojiPointList values={indicationDetails.symptoms} className="indication-point-list" />
          {diagnosticSigns.length > 0 && (
            <div className="diagnostic-signs">
              {diagnosticSigns.map((sign) => (
                <article key={sign.label}>
                  <div><small>{sign.label}</small><strong>{sign.value}</strong></div>
                </article>
              ))}
            </div>
          )}
        </DetailSection>
      </div>}
      {language === "en" && clinicalCorrelates.length > 0 && (
        <DetailSection title="Clinical correlates">
          <div className="clinical-tags">
            {clinicalCorrelates.map((correlate, index) => (
              <span className={`clinical-tag clinical-tag-${index % 4}`} key={correlate}>{correlate}</span>
            ))}
          </div>
        </DetailSection>
      )}
      {textbook && <>
        <details className="english-details textbook-extracts">
          <summary>{language === "zh" ? "教材摘录" : "Textbook extracts"}<span>{language === "zh" ? formatChinesePages(textbook.pages) : "Read cited sections"}</span></summary>
          {Object.entries(textbook.fields).map(([field, passages]) => (
            <section key={field}>
              <h4>{field}</h4>
              {passages.map((passage, index) => (
                <p key={`${field}-${passage.page}-${index}`}><strong>p. {passage.page}</strong> {passage.text}</p>
              ))}
            </section>
          ))}
        </details>
      </>}
      {language === "en" && web && <>
        {web.contraindicationsAndInteractions.length > 0 && <CautionList values={web.contraindicationsAndInteractions} />}
        {web.notes.length > 0 && <CollapsibleList title="Source notes" values={web.notes} />}
        {web.modifications.length > 0 && <ModificationSection values={web.modifications} />}
      </>}
      <SourceNote language={language} title={[
        "ACU Five",
        textbook && "Formula Study textbook",
      ].filter(Boolean).join(" / ")} />
    </div>
  );
}

function HerbDetail({ language, herb, formulas, onFormulaOpen }: { language: Language; herb: Herb; formulas: Formula[]; onFormulaOpen: (formula: Formula) => void }) {
  const related = herb.formulaIds.map((id) => formulas.find((formula) => formula.id === id)).filter(Boolean) as Formula[];
  const english = herb.englishReference;
  const channels = parseChannels(english?.channels);
  const doseChips = parseDoseChips(herb.observedDoses);
  const englishNames = herb.englishNames.filter(Boolean);
  const parsedActionIndications = english?.actions ? parseHerbActionsAndIndications(english.actions) : { actions: [], indications: [] };
  const actionIndications = {
    actions: uniqueDisplayValues([
      ...(english?.keyCharacteristics ? parseKeyCharacteristicActions(english.keyCharacteristics) : []),
      ...parsedActionIndications.actions,
    ]).slice(0, 10),
    indications: parsedActionIndications.indications,
  };
  return (
    <div className="detail-content">
      <div className={`detail-title herb-detail-title thermal-${herb.thermalProperties[0] ?? "neutral"}`}>
        <div>
          <span>{language === "zh" ? "中药" : "HERB"}</span>
          <h1>{herb.chineseNames.join(" / ")}</h1>
          <p>{herb.pinyinNames.join(" / ")}</p>
          {englishNames.length > 0 && <small>{englishNames.join(" / ")}</small>}
        </div>
      </div>
      {channels.length > 0 && (
        <div className="channel-row" aria-label="Channels entered">
          <span className="channel-row-label">{language === "zh" ? "缁忕粶" : "Channels"}</span>
          <div className="channel-chip-list">
            {channels.map((channel) => (
              <span className={`channel-chip ${channel.className}`} title={channel.name} key={channel.name}>{channel.label}</span>
            ))}
          </div>
        </div>
      )}
      <div className="herb-facts herb-detail-facts">
        {doseChips.length > 0 && (
          <article className="herb-dosage-card">
            <span>{language === "zh" ? "剂量" : "Dosage"}</span>
            <div className="dose-chip-list">{doseChips.map((dose) => <strong key={dose}>{dose}</strong>)}</div>
          </article>
        )}
        {english?.pharmaceuticalName && <article><span>Pharmaceutical name</span><strong>{english.pharmaceuticalName}</strong></article>}
        {english?.properties && <article><span>Properties</span><strong>{english.properties}</strong></article>}
      </div>
      {language === "en" && english && <>
        {(actionIndications.actions.length > 0 || actionIndications.indications.length > 0) && (
          <div className="two-column-detail herb-action-indication-detail">
            {actionIndications.actions.length > 0 && (
              <DetailSection title="Actions">
                <EmojiPointList values={actionIndications.actions} />
              </DetailSection>
            )}
            {actionIndications.indications.length > 0 && (
              <DetailSection title="Indications">
                <EmojiPointList values={actionIndications.indications} className="indication-point-list" />
              </DetailSection>
            )}
          </div>
        )}
        <HerbSafetySection
          cautions={english.cautions}
          traditionalContraindications={english.traditionalContraindications}
          toxicity={english.toxicity}
        />
        {english.commentary && <CollapsibleEnglish title="Commentary" value={english.commentary} />}
        {english.combinations && <HerbCombinationSection value={english.combinations} />}
      </>}
      <DetailSection title={language === "zh" ? "相关方剂" : "Related formulas"}><div className="related-list">{related.map((formula) => <button key={formula.id} onClick={() => onFormulaOpen(formula)}><div><strong>{formula.names.chinese}</strong><span>{formula.names.pinyin}</span>{language === "en" && formula.names.english && <small>{formula.names.english}</small>}</div><ArrowRight size={16} /></button>)}</div></DetailSection>
    </div>
  );
}

function EnglishText({ value }: { value: string }) {
  return <div className="english-prose">{value.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph.replace(/\n/g, " ")}</p>)}</div>;
}

function cleanSafetyNote(value?: string, tone?: string) {
  const cleaned = (value ? stripOcrSectionHeaders(value) : undefined)
    ?.replace(/\bsee\s+toxi\w*\s+bel\w*\.?/gi, "")
    .replace(/\bbelo?w\.?$/gi, "")
    .replace(/\bsee\.?$/gi, "")
    .replace(/^[\s:;,.]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/^none noted\.?$/i.test(cleaned ?? "")) return "None noted.";
  if (/^pregnancy\.?$/i.test(cleaned ?? "")) return "Use with caution during pregnancy.";

  if (tone === "toxicity" && cleaned) {
    const normalized = normalize(cleaned);
    const toxicitySignals = [
      "toxicity",
      "toxic dose",
      "toxic substance",
      "is toxic",
      "slightly toxic",
      "toxic and",
      "overdos",
      "poison",
      "poisoning",
      "allergic",
      "reaction",
      "large quantity",
      "large quantities",
      "large dosage",
      "long term",
      "long-term",
      "restricted",
      "addictive",
      "arrhythmia",
      "blood pressure",
      "coma",
      "convulsion",
    ];

    if (!textMatchesKeywords(normalized, toxicitySignals)) return undefined;
  }

  return cleaned || undefined;
}

function HerbSafetySection({ cautions, traditionalContraindications, toxicity }: {
  cautions?: string;
  traditionalContraindications?: string;
  toxicity?: string;
}) {
  const safetyNotes = [
    { label: "Cautions", value: cleanSafetyNote(cautions, "caution"), tone: "caution" },
    { label: "Traditional contraindications", value: cleanSafetyNote(traditionalContraindications, "traditional"), tone: "traditional" },
    { label: "Toxicity", value: cleanSafetyNote(toxicity, "toxicity"), tone: "toxicity" },
  ].filter((item): item is { label: string; value: string; tone: string } => Boolean(item.value?.trim()));

  if (safetyNotes.length === 0) return null;

  return (
    <DetailSection title="Safety notes">
      <div className="herb-safety-grid">
        {safetyNotes.map((note) => (
          <article className={`herb-safety-card safety-${note.tone}`} key={note.label}>
            <div className="herb-safety-card-title">
              <span>!</span>
              <h4>{note.label}</h4>
            </div>
            <EnglishText value={note.value} />
          </article>
        ))}
      </div>
    </DetailSection>
  );
}

function HerbCombinationSection({ value }: { value: string }) {
  const combinations = parseHerbCombinations(value);
  if (combinations.length === 0) return null;

  return (
    <DetailSection title="Mechanisms of selected combinations">
      <div className="herb-combination-grid">
        {combinations.map((combination, index) => (
          <article className="herb-combination-card" key={`${combination.title}-${index}`}>
            <h4>{combination.title}</h4>
            <ul>
              {combination.notes.map((note, noteIndex) => (
                <li key={`${combination.title}-${noteIndex}`}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </DetailSection>
  );
}

type ModificationIngredient = {
  mode: "add" | "remove";
  latin: string;
  pinyin: string;
  dose: string;
};

type ModificationGroup = {
  condition: string;
  ingredients: ModificationIngredient[];
};

function ModificationSection({ values }: { values: string[] }) {
  const groups = parseModifications(values);
  if (groups.length === 0) return null;

  return (
    <DetailSection title="Modifications">
      <div className="modification-grid">
        {groups.map((group, index) => (
          <details className="modification-card" key={`${group.condition}-${index}`}>
            <summary>{group.condition}<span>{group.ingredients.length}</span></summary>
            <div className="modification-ingredients">
              {group.ingredients.map((ingredient, ingredientIndex) => (
                <span className={`modification-chip ${ingredient.mode === "remove" ? "is-removed" : ""}`} key={`${group.condition}-${ingredient.pinyin}-${ingredientIndex}`}>
                  <strong>{ingredient.pinyin || ingredient.latin}</strong>
                  {ingredient.latin && ingredient.pinyin && <small>{ingredient.latin}</small>}
                  {ingredient.dose && <em>{ingredient.dose}</em>}
                </span>
              ))}
            </div>
          </details>
        ))}
      </div>
    </DetailSection>
  );
}

function parseModifications(values: string[]) {
  const groups: ModificationGroup[] = [];
  const activeGroups = new Map<number, ModificationGroup>();

  const ensureGroup = (condition: string, column: number) => {
    const normalizedCondition = condition.replace(/^For\s+/i, "").replace(/[:：]+$/, "").trim();
    if (!normalizedCondition || normalizedCondition.toLowerCase() === "or") return activeGroups.get(column);
    const existing = groups.find((group) => group.condition.toLowerCase() === normalizedCondition.toLowerCase());
    const group = existing ?? { condition: normalizedCondition, ingredients: [] };
    if (!existing) groups.push(group);
    activeGroups.set(column, group);
    return group;
  };

  for (const row of values) {
    const cells = row.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length === 0) continue;
    const hasIngredient = cells.some(isModificationIngredientCell);

    if (!hasIngredient) {
      cells.forEach((cell, column) => {
        if (isModificationConditionCell(cell)) ensureGroup(cell, column);
      });
      continue;
    }

    let localGroup: ModificationGroup | undefined;
    for (let index = 0; index < cells.length; index += 1) {
      const cell = cells[index];
      if (isModificationConditionCell(cell)) {
        localGroup = ensureGroup(cell, Math.floor(index / 2));
        continue;
      }
      if (!isModificationIngredientCell(cell)) continue;

      const parsed = parseModificationIngredient(cell, cells[index + 1]);
      const group = localGroup ?? activeGroups.get(Math.floor(index / 2)) ?? ensureGroup("General modification", 0);
      if (group && parsed) group.ingredients.push(parsed);
      if (cells[index + 1] && !isModificationIngredientCell(cells[index + 1]) && !isModificationConditionCell(cells[index + 1])) index += 1;
    }
  }

  return groups.filter((group) => group.ingredients.length > 0);
}

function isModificationConditionCell(value: string) {
  return /^For\b.+[:：]$/i.test(value);
}

function isModificationIngredientCell(value: string) {
  return /^[+-]\s*/.test(value);
}

function parseModificationIngredient(value: string, pinyinCell?: string): ModificationIngredient | null {
  const match = value.match(/^([+-])\s*(?:(\d+(?:\.\d+)?\s*g)\s*)?(.+)$/i);
  if (!match) return null;
  const [, marker, dose = "", latin] = match;
  const pinyin = pinyinCell && !isModificationIngredientCell(pinyinCell) && !isModificationConditionCell(pinyinCell)
    ? pinyinCell
    : "";
  return {
    mode: marker === "-" ? "remove" : "add",
    latin: latin.trim(),
    pinyin: pinyin.trim(),
    dose: dose.trim(),
  };
}

function CollapsibleEnglish({ title, value }: { title: string; value: string }) {
  return <details className="english-details"><summary>{title}<span>Read section</span></summary><EnglishText value={value} /></details>;
}

function ReferenceList({ values }: { values: string[] }) {
  return <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul>;
}

function CautionList({ values }: { values: string[] }) {
  return (
    <DetailSection title="Contraindications & interactions">
      <div className="caution-list">
        {values.map((value, index) => (
          <article className="caution-item" key={`${value}-${index}`}>
            <span aria-hidden="true">{cautionEmoji(value)}</span>
            <p>{value}</p>
          </article>
        ))}
      </div>
    </DetailSection>
  );
}

function cautionEmoji(value: string) {
  const normalized = value.toLowerCase();
  if (/pregnan|fetus|miscarriage/.test(normalized)) return "🤰";
  if (/contraindicat|do not|avoid/.test(normalized)) return "⛔";
  if (/caution|extreme caution/.test(normalized)) return "⚠️";
  if (/tox|poison|overdose/.test(normalized)) return "☠️";
  if (/deficien|weak|spleen|stomach|yin|yang|blood|qi/.test(normalized)) return "🩺";
  if (/heat|cold|damp|phlegm|excess/.test(normalized)) return "🌡️";
  return "⚕️";
}

function EmojiPointList({ values, className = "" }: { values: string[]; className?: string }) {
  return (
    <ul className={`emoji-point-list ${className}`}>
      {values.map((value, index) => (
        <li key={`${value}-${index}`}>
          <span aria-hidden="true">{pointEmoji(value)}</span>
          <p>{value}</p>
        </li>
      ))}
    </ul>
  );
}

function parseIndications(value: string, clinicalManifestations: string[] = [], actions: string[] = []) {
  const actionLike = isActionLikeIndication(value, actions);
  const parts = (actionLike ? "" : value)
    .split(/[,;，；]\s*/)
    .map((part) => part.trim().replace(/[。.]+$/, ""))
    .filter(Boolean);
  const symptoms: string[] = [];
  const pulse: string[] = [];
  const tongue: string[] = [];
  const coating: string[] = [];

  for (const part of [...parts, ...clinicalManifestations]) {
    const cleaned = part.replace(/^(and|with)\s+/i, "");
    const diagnostic = parseDiagnosticPart(cleaned);
    if (diagnostic.type === "pulse") pulse.push(diagnostic.value);
    else if (diagnostic.type === "tongue") tongue.push(diagnostic.value);
    else if (diagnostic.type === "coating") coating.push(diagnostic.value);
    else symptoms.push(diagnostic.value);
  }

  return {
    symptoms: uniqueDisplayValues(symptoms.length > 0 ? symptoms : [value || "General clinical presentation"], normalizeIndicationKey),
    pulse: uniqueDisplayValues(pulse).join("; "),
    tongue: uniqueDisplayValues(tongue).join("; "),
    coating: uniqueDisplayValues(coating).join("; "),
  };
}

function parseDiagnosticPart(value: string) {
  const cleaned = value.trim();
  const abbreviationMatch = cleaned.match(/^(P|T|C)\s*[:：]\s*(.+)$/i);
  if (abbreviationMatch) {
    const [, marker, content] = abbreviationMatch;
    if (/^p$/i.test(marker)) return { type: "pulse", value: content.trim() };
    if (/^t$/i.test(marker)) return { type: "tongue", value: content.trim() };
    return { type: "coating", value: content.trim() };
  }
  if (/\bpulse\b|脉/i.test(cleaned)) return { type: "pulse", value: cleaned };
  if (/\bcoat(?:ing)?\b|苔/i.test(cleaned)) return { type: "coating", value: cleaned };
  if (/\btongue\b|舌/i.test(cleaned)) return { type: "tongue", value: cleaned };
  return { type: "symptom", value: cleaned };
}

function isActionLikeIndication(value: string, actions: string[]) {
  const normalized = value.trim().replace(/[.。]+$/, "").toLowerCase();
  if (!normalized) return true;
  if (actions.some((action) => action.trim().replace(/[.。]+$/, "").toLowerCase() === normalized)) return true;
  return (
    normalized.split(/[,;]/).length <= 2 &&
    /^(tonif|clear|nourish|warm|drain|dispels?|spreads?|regulates?|harmonizes?|moves?|stops?|calms?|promotes?|raises?|descends?|resolves?|transforms?)/.test(normalized)
  );
}

function uniqueDisplayValues(values: string[], normalizeValue: (value: string) => string = (value) => value.toLowerCase().replace(/\s+/g, " ").trim()) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalizeValue(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeIndicationKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\bnasal (obstruction|congestion|stuffiness)\b/g, "nasal obstruction")
    .replace(/\bstuffy nose\b/g, "nasal obstruction")
    .replace(/\s+/g, " ")
    .trim();
}

function pointEmoji(value: string) {
  const point = value.toLowerCase();
  if (/(calm|shen|spirit|anxiety|insomnia|fright|mental|安神|失眠|心悸)/.test(point)) return "🧘";
  if (/(heart|palpitation|blood|circulation|心|血)/.test(point)) return "❤️";
  if (/(lung|cough|wheez|breath|chest|肺|咳|喘|胸)/.test(point)) return "🫁";
  if (/(stomach|spleen|digest|appetite|nausea|vomit|diarrhea|constipation|胃|脾|呕|泻|便秘)/.test(point)) return "🍵";
  if (/(kidney|urine|urinary|bladder|edema|肾|尿|水肿)/.test(point)) return "💧";
  if (/(heat|fire|fever|thirst|sweat|热|火|渴|汗)/.test(point)) return "🔥";
  if (/(cold|chill|warm|yang|寒|冷|温阳)/.test(point)) return "☀️";
  if (/(pain|ache|spasm|cramp|痛|痉)/.test(point)) return "⚡";
  if (/(wind|exterior|headache|dizz|vertigo|风|表|头痛|眩晕)/.test(point)) return "🌬️";
  if (/(tonif|strength|qi|deficien|fatigue|weak|补|益气|虚|乏力)/.test(point)) return "🌱";
  if (/(phlegm|damp|fluid|moisten|dry|痰|湿|润|燥)/.test(point)) return "💦";
  return "✨";
}

function formatChinesePages(pages: number[]) {
  if (pages.length === 0) return "页码未标注";
  return `第 ${pages.join("、")} 页`;
}

function CollapsibleList({ title, values }: { title: string; values: string[] }) {
  return <details className="english-details"><summary>{title}<span>Read section</span></summary><ReferenceList values={values} /></details>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="detail-section"><div className="detail-section-title"><h3>{title}</h3></div>{children}</section>;
}

function SourceNote({ language, title }: { language: Language; title: string }) {
  return <div className="source-note"><BookOpen size={18} /><div><strong>{language === "zh" ? "来源" : "Source"}</strong><span>{title}</span></div></div>;
}

function PageHeading({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <div className="page-heading"><span>{kicker}</span><h1>{title}</h1><p>{description}</p></div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state"><Search size={24} /><p>{label}</p></div>;
}

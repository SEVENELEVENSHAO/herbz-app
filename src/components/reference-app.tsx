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
  home: ["总览", "Overview"],
  formulas: ["方剂", "Formulas"],
  herbs: ["中药", "Herbs"],
  compare: ["对照", "Compare"],
  study: ["研习", "Study"],
};

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
    subcategory.keywords.some((keyword) => actionText.includes(keyword))
  )?.id ?? (category.id === "other" ? "specialized" : "other");
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
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
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
          {(Object.keys(sectionMeta) as Section[]).map((key) => {
            const Icon = key === "home" ? Library : key === "formulas" ? FlaskConical : key === "herbs" ? Leaf : key === "compare" ? Columns2 : GraduationCap;
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
          {section === "home" && <HomeCategories language={language} formulas={formulas} total={data.formulas.length} query={query} onOpen={(item) => setDetail({ type: "formula", item })} />}
          {section === "formulas" && (
            <FormulaLibrary language={language} formulas={formulas} total={data.formulas.length} bookmarks={bookmarks} compareIds={compareIds}
              usagesByFormula={usagesByFormula} onOpen={(item) => setDetail({ type: "formula", item })}
              onBookmark={toggleBookmark} onCompare={toggleCompare} onCompareNow={() => navigate("compare")} />
          )}
          {section === "herbs" && <HerbLibrary language={language} herbs={herbs} total={data.herbs.length} thermal={thermal} setThermal={setThermal} onOpen={(item) => setDetail({ type: "herb", item })} />}
          {section === "compare" && <CompareView language={language} formulas={data.formulas} compareIds={compareIds} onRemove={toggleCompare} onBrowse={() => navigate("formulas")} usagesByFormula={usagesByFormula} />}
          {section === "study" && <StudyView language={language} formulas={data.formulas} bookmarks={bookmarks} onOpen={(item) => setDetail({ type: "formula", item })} />}
        </div>
      </main>

      {detail && (
        <DetailDrawer language={language} detail={detail} formulas={data.formulas}
          usages={detail.type === "formula" ? usagesByFormula.get(detail.item.id) ?? [] : []}
          bookmarked={bookmarks.includes(detail.item.id)} onBookmark={toggleBookmark}
          onClose={() => setDetail(null)} onFormulaOpen={(item) => setDetail({ type: "formula", item })} />
      )}
    </div>
  );
}

function HomeCategories({ language, formulas, total, query, onOpen }: {
  language: Language;
  formulas: Formula[];
  total: number;
  query: string;
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
          kicker={language === "zh" ? "按功效分类" : "FORMULAS BY ACTION"}
          title={language === "zh" ? "浏览方剂分类" : "Browse Formula Categories"}
          description={language === "zh" ? `${total} 个方剂按教材主要功效整理。` : `${total} formulas organized by primary textbook action.`}
      />
      <div className="category-strip-list">
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

function NavigatorHeading({ kicker, title, description, onBack }: {
  kicker: string;
  title: string;
  description: string;
  onBack?: () => void;
}) {
  return (
    <div className="navigator-heading">
      {onBack && <button className="navigator-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>}
      <span>{kicker}</span>
      <h1>{title}</h1>
      <p>{description}</p>
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

function HerbLibrary({ language, herbs, total, thermal, setThermal, onOpen }: {
  language: Language;
  herbs: Herb[]; total: number; thermal: ThermalProperty | "all"; setThermal: (value: ThermalProperty | "all") => void; onOpen: (herb: Herb) => void;
}) {
  return (
    <section>
      <PageHeading kicker={language === "zh" ? "中药库" : "MATERIA MEDICA"} title={language === "zh" ? "中药索引" : "Herb Library"} description={language === "zh" ? `显示 ${herbs.length} / ${total} 味中药。` : `Showing ${herbs.length} of ${total} herbs.`} />
      <div className="thermal-filters">
        {(["all", "hot", "warm", "neutral", "cool", "cold"] as const).map((item) => (
          <button key={item} className={`${thermal === item ? "active" : ""} filter-${item}`} onClick={() => setThermal(item)}>
            {item === "all" ? (language === "zh" ? "全部" : "All") : language === "zh" ? thermalLabels[item].split(" ")[0] : thermalLabels[item].split(" ").at(-1)}
          </button>
        ))}
      </div>
      <div className="herb-grid">
        {herbs.map((herb) => (
          <button className="herb-card" key={herb.id} onClick={() => onOpen(herb)}>
            <div className={`herb-color thermal-${herb.thermalProperties[0] ?? "neutral"}`}><Leaf size={19} /><span>{thermalLabels[herb.thermalProperties[0] ?? "neutral"]}</span></div>
            <h3>{language === "zh" ? herb.chineseNames[0] : herb.englishNames.find(Boolean) || herb.pinyinNames[0]}</h3>
            <div><span>{herb.formulaIds.length} {language === "zh" ? "方" : "formulas"}</span><ArrowRight size={15} /></div>
          </button>
        ))}
        {!herbs.length && <EmptyState label="没有找到匹配的中药" />}
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

function DetailDrawer({ language, detail, formulas, usages, bookmarked, onBookmark, onClose, onFormulaOpen }: {
  language: Language; detail: Detail; formulas: Formula[]; usages: Usage[]; bookmarked: boolean;
  onBookmark: (id: string) => void; onClose: () => void; onFormulaOpen: (formula: Formula) => void;
}) {
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="detail-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-toolbar"><button onClick={onClose}><ArrowLeft size={18} /> {language === "zh" ? "返回" : "Back"}</button><span>{language === "zh" ? "教材参考" : "TEXTBOOK REFERENCE"}</span><button onClick={() => onBookmark(detail.item.id)}><Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} /></button></div>
        {detail.type === "formula" ? <FormulaDetail language={language} formula={detail.item} usages={usages} /> : <HerbDetail language={language} herb={detail.item} formulas={formulas} onFormulaOpen={onFormulaOpen} />}
      </aside>
    </div>
  );
}

function FormulaDetail({ language, formula, usages }: { language: Language; formula: Formula; usages: Usage[] }) {
  const web = formula.americanDragonReference;
  const textbook = formula.textbookReference;
  const indicationDetails = parseIndications(formula.indications);
  const clinicalCorrelates = [...new Set(usages.map((usage) => {
    const condition = usage.conditionName?.trim();
    const pattern = usage.patternName?.trim();
    if (condition && pattern) return `${condition} · ${pattern}`;
    return condition || pattern;
  }).filter((value): value is string => Boolean(value)))];

  return (
    <div className="detail-content">
      <div className="detail-title formula-detail-title"><div><span>{language === "zh" ? "方剂" : "FORMULA"}</span><h1>{formula.names.chinese}</h1><p>{formula.names.pinyin}</p>{language === "en" && formula.names.english && <small>{formula.names.english}</small>}</div></div>
      <DetailSection title={language === "zh" ? "组成" : "Ingredients"}>
        <div className="ingredient-grid">
          {formula.ingredients.map((ingredient) => (
            <article className={`ingredient-tile ingredient-${ingredient.thermalProperty}`} key={ingredient.position}>
              <div className="ingredient-color-panel">
                <div className="ingredient-identity">
                  <div className="ingredient-western-names">
                    <span>{ingredient.pinyin}</span>
                    <small>{ingredient.englishName}</small>
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
          <EmojiPointList values={indicationDetails.symptoms} />
          <div className="diagnostic-signs">
            <article>
              <div><small>Pulse</small><strong>{indicationDetails.pulse || "Not specified"}</strong></div>
            </article>
            <article>
              <div><small>Tongue</small><strong>{indicationDetails.tongue || "Not specified"}</strong></div>
            </article>
          </div>
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
      {language === "en" && <DetailSection title="Clinical context"><div className="usage-list">{usages.length ? usages.map((usage) => <article key={usage.id}><span>{usage.organSystem}</span><h4>{usage.conditionName} · {usage.patternName}</h4><p>{usage.treatmentPrinciple}</p></article>) : <p className="muted">No clinical links are available.</p>}</div></DetailSection>}
      {textbook && <>
        <div className="textbook-source-banner">
          <div><BookOpen size={18} /><strong>Formula textbook source</strong></div>
          <span>PDF {formatPages(textbook.pages)}</span>
          <small>{textbook.verification} review</small>
        </div>
        <details className="english-details textbook-extracts">
          <summary>Textbook extracts<span>Read cited sections</span></summary>
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
        <div className="web-source-banner">
          <div><Library size={18} /><strong>American Dragon supplement</strong></div>
          <a href={web.sourceUrl} target="_blank" rel="noreferrer">Open source <ArrowRight size={14} /></a>
          <small>Pending review</small>
        </div>
        {web.englishName && <DetailSection title="English reference name"><p>{web.englishName}</p>{web.alsoKnownAs.length > 0 && <p className="muted">Also known as: {web.alsoKnownAs.join("; ")}</p>}</DetailSection>}
        {web.formulaActions.length > 0 && <DetailSection title="Supplemental actions"><ReferenceList values={web.formulaActions} /></DetailSection>}
        {web.syndromes.length > 0 && <DetailSection title="Syndromes"><ReferenceList values={web.syndromes} /></DetailSection>}
        {web.ingredients.length > 0 && <details className="english-details"><summary>Supplemental ingredient notes<span>Read section</span></summary><div className="web-ingredient-list">{web.ingredients.map((item, index) => <article key={`${item.pinyin}-${index}`}><strong>{item.pinyin}</strong><span>{item.pharmaceuticalLatin}</span><small>{item.dose}</small>{item.actions && <p>{item.actions}</p>}</article>)}</div></details>}
        {web.clinicalManifestations.length > 0 && <CollapsibleList title="Clinical manifestations" values={web.clinicalManifestations} />}
        {web.treats.length > 0 && <CollapsibleList title="Conditions listed by source" values={web.treats} />}
        {web.contraindicationsAndInteractions.length > 0 && <CollapsibleList title="Contraindications & interactions" values={web.contraindicationsAndInteractions} />}
        {web.notes.length > 0 && <CollapsibleList title="Source notes" values={web.notes} />}
        {web.modifications.length > 0 && <CollapsibleList title="Modifications" values={web.modifications} />}
      </>}
      <SourceNote language={language} title={[
        "ACU Five",
        textbook && "Formula Study textbook",
        web && "American Dragon",
      ].filter(Boolean).join(" / ")} />
    </div>
  );
}

function HerbDetail({ language, herb, formulas, onFormulaOpen }: { language: Language; herb: Herb; formulas: Formula[]; onFormulaOpen: (formula: Formula) => void }) {
  const related = herb.formulaIds.map((id) => formulas.find((formula) => formula.id === id)).filter(Boolean) as Formula[];
  const english = herb.englishReference;
  return (
    <div className="detail-content">
      <div className="detail-title"><div className={`seal-small thermal-${herb.thermalProperties[0] ?? "neutral"}`}><Leaf size={24} /></div><div><span>{language === "zh" ? "中药" : "HERB"}</span><h1>{language === "zh" ? herb.chineseNames.join(" / ") : herb.englishNames.filter(Boolean).join(" / ") || herb.pinyinNames.join(" / ")}</h1></div></div>
      <div className="herb-facts"><article><span>{language === "zh" ? "药性" : "Thermal"}</span><strong>{herb.thermalProperties.map((item) => language === "zh" ? thermalLabels[item].split(" ")[0] : thermalLabels[item].split(" ").at(-1)).join(" · ")}</strong></article><article><span>{language === "zh" ? "已见剂量" : "Observed doses"}</span><strong>{herb.observedDoses.slice(0, 4).join(" · ") || "—"}</strong></article><article><span>{language === "zh" ? "方剂关联" : "Formula links"}</span><strong>{related.length}</strong></article></div>
      {language === "en" && english && <>
        <div className="english-source-banner">
          <div><Languages size={18} /><strong>English Materia Medica</strong></div>
          <span>PDF pages {english.pageStart}–{english.pageEnd}</span>
          <small>OCR · Pending review</small>
        </div>
        <div className="english-facts">
          {english.pharmaceuticalName && <article><span>Pharmaceutical name</span><strong>{english.pharmaceuticalName}</strong></article>}
          {english.properties && <article><span>Properties</span><strong>{english.properties}</strong></article>}
          {english.channels && <article><span>Channels entered</span><strong>{english.channels}</strong></article>}
          {english.dosage && <article><span>Dosage</span><strong>{english.dosage}</strong></article>}
        </div>
        {english.keyCharacteristics && <DetailSection title="Key characteristics"><EnglishText value={english.keyCharacteristics} /></DetailSection>}
        {english.actions && <DetailSection title="Actions and indications"><EnglishText value={english.actions} /></DetailSection>}
        {english.cautions && <DetailSection title="Cautions and contraindications"><EnglishText value={english.cautions} /></DetailSection>}
        {english.commentary && <CollapsibleEnglish title="Commentary" value={english.commentary} />}
        {english.combinations && <CollapsibleEnglish title="Mechanisms of selected combinations" value={english.combinations} />}
        {english.comparisons && <CollapsibleEnglish title="Comparisons" value={english.comparisons} />}
        {english.traditionalContraindications && <CollapsibleEnglish title="Traditional contraindications" value={english.traditionalContraindications} />}
        {english.toxicity && <CollapsibleEnglish title="Toxicity" value={english.toxicity} />}
        {english.nomenclaturePreparation && <CollapsibleEnglish title="Nomenclature & preparation" value={english.nomenclaturePreparation} />}
      </>}
      <DetailSection title={language === "zh" ? "相关方剂" : "Related formulas"}><div className="related-list">{related.map((formula) => <button key={formula.id} onClick={() => onFormulaOpen(formula)}><div><strong>{formula.names.chinese}</strong><span>{formula.names.pinyin}</span>{language === "en" && formula.names.english && <small>{formula.names.english}</small>}</div><ArrowRight size={16} /></button>)}</div></DetailSection>
      <SourceNote language={language} title={english ? "ACU Five / Bensky Materia Medica 3e" : "ACU Five"} />
    </div>
  );
}

function EnglishText({ value }: { value: string }) {
  return <div className="english-prose">{value.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph.replace(/\n/g, " ")}</p>)}</div>;
}

function CollapsibleEnglish({ title, value }: { title: string; value: string }) {
  return <details className="english-details"><summary>{title}<span>Read section</span></summary><EnglishText value={value} /></details>;
}

function ReferenceList({ values }: { values: string[] }) {
  return <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul>;
}

function EmojiPointList({ values }: { values: string[] }) {
  return (
    <ul className="emoji-point-list">
      {values.map((value, index) => (
        <li key={`${value}-${index}`}>
          <span aria-hidden="true">{pointEmoji(value)}</span>
          <p>{value}</p>
        </li>
      ))}
    </ul>
  );
}

function parseIndications(value: string) {
  const parts = value
    .split(/[,;，；]\s*/)
    .map((part) => part.trim().replace(/[。.]+$/, ""))
    .filter(Boolean);
  const symptoms: string[] = [];
  const pulse: string[] = [];
  const tongue: string[] = [];

  for (const part of parts) {
    const cleaned = part.replace(/^(and|with)\s+/i, "");
    if (/\bpulse\b|脉/i.test(cleaned)) pulse.push(cleaned);
    else if (/\btongue\b|\bcoat(?:ing)?\b|舌|苔/i.test(cleaned)) tongue.push(cleaned);
    else symptoms.push(cleaned);
  }

  return {
    symptoms: symptoms.length > 0 ? symptoms : ["General clinical presentation"],
    pulse: pulse.join("; "),
    tongue: tongue.join("; "),
  };
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

function formatPages(pages: number[]) {
  if (pages.length === 0) return "page unavailable";
  if (pages.length === 1) return `page ${pages[0]}`;
  return `pages ${pages.join(", ")}`;
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

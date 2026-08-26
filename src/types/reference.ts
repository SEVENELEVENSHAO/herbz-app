export type ThermalProperty = "hot" | "warm" | "neutral" | "cool" | "cold";

export interface Ingredient {
  position: number;
  chineseName: string;
  pinyin: string;
  englishName: string;
  dose: string;
  thermalProperty: ThermalProperty;
}

export interface Formula {
  id: string;
  variantIds: string[];
  names: { chinese: string; pinyin: string; english: string | null };
  actions: string[];
  indications: string;
  ingredients: Ingredient[];
  sourceModules: string[];
  usageIds: string[];
  usageCount: number;
  category?: ReferenceCategory;
  apkReference?: ApkFormulaReference;
  textbookReference?: {
    sourceId: string;
    sourceTitle: string;
    sourceFile: string;
    verification: "pending" | "verified" | "rejected";
    pages: number[];
    extractedName: string;
    canonicalChineseName: string;
    isAlias: boolean;
    fields: Record<string, { page: number; text: string }[]>;
  };
  americanDragonReference?: {
    sourceId: string;
    sourceTitle: string;
    sourceUrl: string;
    verification: "pending" | "verified" | "rejected";
    englishName?: string | null;
    alsoKnownAs: string[];
    ingredients: {
      pharmaceuticalLatin: string;
      pinyin: string;
      dose: string;
      actions: string;
    }[];
    formulaActions: string[];
    syndromes: string[];
    clinicalManifestations: string[];
    treats: string[];
    contraindicationsAndInteractions: string[];
    notes: string[];
    modifications: string[];
  };
}

export interface Usage {
  id: string;
  formulaId: string;
  courseNumber: number;
  organSystem: string | null;
  conditionName: string | null;
  conditionPinyin: string | null;
  section: string | null;
  patternName: string;
  treatmentPrinciple: string;
  sourceModule: string;
}

export interface Herb {
  id: string;
  chineseNames: string[];
  pinyinNames: string[];
  englishNames: string[];
  thermalProperties: ThermalProperty[];
  formulaIds: string[];
  observedDoses: string[];
  category?: ReferenceCategory;
  apkReference?: ApkHerbReference;
  englishReference?: {
    sourceId: string;
    sourceTitle: string;
    pageStart: number;
    pageEnd: number;
    verification: "pending" | "verified" | "rejected";
    pharmaceuticalName?: string;
    englishName?: string;
    properties?: string;
    channels?: string;
    keyCharacteristics?: string;
    dosage?: string;
    cautions?: string;
    actions?: string;
    commentary?: string;
    combinations?: string;
    comparisons?: string;
    traditionalContraindications?: string;
    toxicity?: string;
    nomenclaturePreparation?: string;
    qualityCriteria?: string;
    chemicalConstituents?: string;
    alternateSpecies?: string;
    adulterations?: string;
    alternateNames?: string;
    additionalProductInformation?: string;
  };
}

export interface ReferenceCategory {
  system: "formula-apk" | "herb-apk";
  categoryId: number;
  category: string;
  subcategory: string | null;
}

export interface ApkFormulaReference {
  sourceId: string; sourceTitle: string; sourceFile: string; verification: "pending";
  source: string | null; ingredientText: string | null; usage: string | null;
  mainTreatment: string | null; function: string | null; appliedTo: string | null; notes: string | null;
}

export interface ApkHerbReference {
  sourceId: string; sourceTitle: string; sourceFile: string; verification: "pending";
  source: string | null; propertiesAndChannels: string | null; function: string | null;
  characteristics: string | null; appliedTo: string | null; preparation: string | null;
  usage: string | null; formulas: string | null; digest: string | null; notes: string | null; aliases: string | null;
}

export interface SourceResource {
  id: string;
  title: string;
  englishTitle: string;
  fileName: string;
  sourceRole: string;
}

export interface ReferenceData {
  formulas: Formula[];
  herbs: Herb[];
  usages: Usage[];
  sources: SourceResource[];
  stats: {
    variants: number;
    sourceVariants: number;
    uniqueFormulaNames: number;
    herbs: number;
    usages: number;
  };
}

import fs from "node:fs";
import path from "node:path";
import { pinyin } from "pinyin-pro";
import Database from "better-sqlite3-multiple-ciphers";

const medicineApk = process.argv[2] ?? "D:/BaiduNetdiskDownload/中医中药.apk";
const formulaApk = process.argv[3] ?? "D:/BaiduNetdiskDownload/中医方剂.apk";
const extractedRoot = process.argv[4];

if (!extractedRoot) {
  throw new Error("Pass the folder containing extracted MedicineCh.db and FormulaCh.db as the third argument.");
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const normalize = (value) => value.normalize("NFKC").replace(/[\s·•，。、（）()《》“”'"-]+/g, "").toLowerCase();
const romanize = (value) => pinyin(value, { toneType: "none", type: "array" })
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const slug = (value) => romanize(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function openEncrypted(file) {
  const db = new Database(file, { readonly: true });
  db.pragma("cipher='sqlcipher'");
  db.pragma("legacy=4");
  db.pragma("key='Wsndy@jnd2020'");
  db.prepare("select count(*) from sqlite_master").get();
  return db;
}

const formulaDb = openEncrypted(path.join(extractedRoot, "FormulaCh.db"));
const medicineDb = openEncrypted(path.join(extractedRoot, "MedicineCh.db"));
const existingFormulaNames = new Set([
  ...readJson("src/data/formulas.json").formulas,
  ...readJson("src/data/textbook-formulas.json").formulas,
].map((item) => normalize(item.names.chinese)));
const existingHerbNames = new Set(readJson("src/data/herbs.json").herbs.flatMap((item) => item.chineseNames.map(normalize)));

const formulaTaxonomy = formulaDb.prepare("select ID as id, Category as category, SubCategory as subcategory from Categories order by ID").all();
const herbTaxonomy = medicineDb.prepare("select ID as id, Category as category, SubCategory as subcategory from Categories order by ID").all();
const formulaRows = formulaDb.prepare("select f.*, c.Category, c.SubCategory from Formulas f join Categories c on c.ID=f.CategoryId order by f.ID").all();
const herbRows = medicineDb.prepare("select m.*, c.Category, c.SubCategory from Medicines m join Categories c on c.ID=m.CategoryId order by m.ID").all();
const formulaClassifications = formulaRows.map((row) => ({ name: row.Formula, categoryId: row.CategoryId, category: row.Category, subcategory: row.SubCategory }));
const herbClassifications = herbRows.map((row) => ({ name: row.Medicine, categoryId: row.CategoryId, category: row.Category, subcategory: row.SubCategory }));

const formulas = formulaRows.filter((row) => !existingFormulaNames.has(normalize(row.Formula))).map((row) => ({
  id: `apk-formula-${slug(row.Formula)}-${row.ID}`,
  names: { chinese: row.Formula, pinyin: romanize(row.Formula), english: null },
  actions: row.Function ? [row.Function.replace(/[。；;]+$/g, "")] : [],
  indications: row.MainTreatment ?? "",
  ingredients: [],
  sourceModules: ["apk:中医方剂"],
  usageIds: [],
  usageCount: 0,
  category: { system: "formula-apk", categoryId: row.CategoryId, category: row.Category, subcategory: row.SubCategory },
  apkReference: {
    sourceId: "formula-ch-apk", sourceTitle: "中医方剂 APK", sourceFile: formulaApk,
    verification: "pending", source: row.Source, ingredientText: row.Ingredient, usage: row.Usage,
    mainTreatment: row.MainTreatment, function: row.Function, appliedTo: row.AppliedTo, notes: row.Notes,
  },
}));

const herbs = herbRows.filter((row) => !existingHerbNames.has(normalize(row.Medicine))).map((row) => ({
  id: `apk-herb-${slug(row.Medicine)}-${row.ID}`,
  chineseNames: [row.Medicine], pinyinNames: [romanize(row.Medicine)], englishNames: [],
  thermalProperties: [], formulaIds: [], observedDoses: [],
  category: { system: "herb-apk", categoryId: row.CategoryId, category: row.Category, subcategory: row.SubCategory },
  apkReference: {
    sourceId: "medicine-ch-apk", sourceTitle: "中医中药 APK", sourceFile: medicineApk,
    verification: "pending", source: row.Source, propertiesAndChannels: row.GuiJing, function: row.Function,
    characteristics: row.Character, appliedTo: row.AppliedTo, preparation: row.Prescription, usage: row.Usage,
    formulas: row.Formula, digest: row.Digest, notes: row.Note, aliases: row.Alias,
  },
}));

fs.writeFileSync("src/data/apk-formulas.json", `${JSON.stringify({ metadata: { source: formulaApk, verification: "pending", importedAt: new Date().toISOString() }, taxonomy: formulaTaxonomy, classifications: formulaClassifications, formulas }, null, 2)}\n`);
fs.writeFileSync("src/data/apk-herbs.json", `${JSON.stringify({ metadata: { source: medicineApk, verification: "pending", importedAt: new Date().toISOString() }, taxonomy: herbTaxonomy, classifications: herbClassifications, herbs }, null, 2)}\n`);
formulaDb.close(); medicineDb.close();
console.log(JSON.stringify({ addedFormulas: formulas.length, addedHerbs: herbs.length, formulaCategories: formulaTaxonomy.length, herbCategories: herbTaxonomy.length }, null, 2));

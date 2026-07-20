import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { readingSections } from "../book20-source.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sectionsPath = path.join(root, "sections.js");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(sectionsPath, "utf8"), context);

const originalSections = context.window.__SECTIONS__.filter((section) => section.book < 20);
const pairKeys = new Set(
  originalSections.flatMap((section) =>
    section.pairs.map(({ w, p }) => `${w.toLowerCase()}|||${p.toLowerCase()}`),
  ),
);

let duplicates = 0;
const book20Sections = readingSections.map((section) => ({
  book: 20,
  test: section.test,
  passage: section.passage,
  title: section.title,
  pairs: section.pairs.flatMap(([w, p]) => {
    const key = `${w.toLowerCase()}|||${p.toLowerCase()}`;
    if (pairKeys.has(key)) {
      duplicates += 1;
      return [];
    }
    pairKeys.add(key);
    return [{ w, p }];
  }),
}));

const sections = [...originalSections, ...book20Sections];
const pairCount = sections.reduce((sum, section) => sum + section.pairs.length, 0);
const roundCount = sections.reduce((sum, section) => sum + Math.ceil(section.pairs.length / 5), 0);

if (originalSections.length !== 108) throw new Error(`Expected 108 Books 11–19 sections; found ${originalSections.length}`);
if (book20Sections.length !== 12) throw new Error(`Expected 12 Book 20 sections; found ${book20Sections.length}`);
if (duplicates !== 0) throw new Error(`Unexpected duplicate Book 20 pairs: ${duplicates}`);
if (pairCount !== 2200) throw new Error(`Expected 2,200 total pairs; found ${pairCount}`);
if (roundCount !== 485) throw new Error(`Expected 485 total rounds; found ${roundCount}`);

const output = [
  "// Generated from Shelfom's authoritative Feishu 阅读同义替换 workbook. Do not hand-edit.",
  `window.__SECTIONS__=${JSON.stringify(sections)};`,
  "",
].join("\n");

fs.writeFileSync(sectionsPath, output, "utf8");
console.log(JSON.stringify({ sections: sections.length, pairs: pairCount, rounds: roundCount, book20Pairs: 247 }));

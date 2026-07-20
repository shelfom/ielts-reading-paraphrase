import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourcePath = process.argv[2] || "/private/tmp/feishu-ielts-csv.json";
const outputPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "sections.js");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const clean = (value) => (value || "").trim().replace(/\s+/g, " ");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const annotatedCsv = source.data.annotated_csv;
const rows = parseCsv(annotatedCsv).map((row) => {
  const match = row[0].match(/^\[row=(\d+)\]\s?(.*)$/s);
  if (!match) throw new Error(`Missing Feishu row prefix: ${row[0]}`);
  return { rowNumber: Number(match[1]), cells: [match[2], ...row.slice(1)] };
});

const sections = [];
const pairKeys = new Set();
let duplicateCount = 0;
let avoidCount = 0;
let removedAvoidCount = 0;

for (let bookOffset = 0; bookOffset < 10; bookOffset += 1) {
  const book = 11 + bookOffset;
  const leftColumn = bookOffset * 2;
  const rightColumn = leftColumn + 1;
  const testHeaderIndexes = [];

  rows.forEach((row, rowIndex) => {
    const left = clean(row.cells[leftColumn]);
    const right = clean(row.cells[rightColumn]);
    const combined = `${left} ${right}`;
    const fullHeader = /Cambridge/i.test(combined) && /Test\s*\d/i.test(combined);
    const abbreviatedHeader = book >= 17 && /^Test\s*\d/i.test(left);
    if (fullHeader || abbreviatedHeader) testHeaderIndexes.push(rowIndex);
  });

  if (testHeaderIndexes.length !== 4) {
    throw new Error(`Expected four tests for Cambridge ${book}; found ${testHeaderIndexes.length}`);
  }

  testHeaderIndexes.forEach((testStart, testIndex) => {
    const testEnd = testHeaderIndexes[testIndex + 1] ?? rows.length;
    const passageMarkers = [];

    for (let rowIndex = testStart + 1; rowIndex < testEnd; rowIndex += 1) {
      const marker = clean(rows[rowIndex].cells[leftColumn]);
      const passageMatch = marker.match(/^Pass(?:age|ge)\s*([123])(?:\s+proofread)?$/i);
      if (passageMatch) {
        passageMarkers.push({
          rowIndex,
          passage: Number(passageMatch[1]),
          title: clean(rows[rowIndex].cells[rightColumn]),
        });
      }
    }

    if (passageMarkers.length !== 3) {
      throw new Error(
        `Expected three passages for Cambridge ${book} Test ${testIndex + 1}; found ${passageMarkers.length}`,
      );
    }

    passageMarkers.forEach((marker, passageIndex) => {
      const passageEnd = passageMarkers[passageIndex + 1]?.rowIndex ?? testEnd;
      const pairs = [];

      for (let rowIndex = marker.rowIndex + 1; rowIndex < passageEnd; rowIndex += 1) {
        let word = clean(rows[rowIndex].cells[leftColumn]);
        let paraphrase = clean(rows[rowIndex].cells[rightColumn]);
        if (!word || !paraphrase) continue;

        if (
          book === 11 &&
          testIndex === 0 &&
          marker.passage === 1 &&
          word.toLowerCase() === "already" &&
          paraphrase.toLowerCase() === "has been in vogue for some time"
        ) {
          word = "has been";
          paraphrase = "in vogue for some time";
        }

        const pairKey = `${word.toLowerCase()}|||${paraphrase.toLowerCase()}`;
        if (pairKeys.has(pairKey)) {
          duplicateCount += 1;
          continue;
        }

        if (word.toLowerCase() === "avoid") {
          avoidCount += 1;
          if (avoidCount > 2) {
            removedAvoidCount += 1;
            continue;
          }
        }

        pairKeys.add(pairKey);
        pairs.push({ w: word, p: paraphrase, sourceRow: rows[rowIndex].rowNumber });
      }

      if (!pairs.length) {
        throw new Error(`Empty section: Cambridge ${book} Test ${testIndex + 1} Passage ${marker.passage}`);
      }

      sections.push({
        book,
        test: testIndex + 1,
        passage: marker.passage,
        title: marker.title,
        pairs,
      });
    });
  });
}

const pairs = sections.flatMap((section) => section.pairs);
const rounds = sections.reduce((sum, section) => sum + Math.ceil(section.pairs.length / 5), 0);

if (sections.length !== 120) throw new Error(`Expected 120 passage sections; found ${sections.length}`);
if (pairs.length !== 2200) throw new Error(`Expected 2,200 unique exercises; found ${pairs.length}`);
if (sections[0].pairs.length !== 19) throw new Error("Cambridge 11 Test 1 Passage 1 must contain 19 pairs");
if (`${pairs[0].w}|${pairs[0].p}` !== "food plants|produce") throw new Error("Unexpected first pair");
if (`${pairs[1].w}|${pairs[1].p}` !== "has been|in vogue for some time") throw new Error("Unexpected second pair");
if (`${pairs.at(-1).w}|${pairs.at(-1).p}` !== "enhance biodiversity|create refuges for species threatened by predation") throw new Error("Unexpected final pair");
if (duplicateCount !== 27) throw new Error(`Expected 27 source duplicates; found ${duplicateCount}`);
if (removedAvoidCount !== 6) throw new Error(`Expected six excess avoid entries; found ${removedAvoidCount}`);

const deployedSections = sections.map((section) => ({
  ...section,
  pairs: section.pairs.map(({ w, p }) => ({ w, p })),
}));

const output = [
  "// Generated from the Feishu sheet 阅读同义替换. Do not hand-edit.",
  `window.__SECTIONS__=${JSON.stringify(deployedSections)};`,
  "",
].join("\n");

fs.writeFileSync(outputPath, output, "utf8");
console.log(JSON.stringify({ sections: sections.length, pairs: pairs.length, rounds, duplicateCount, avoidKept: 2 }));

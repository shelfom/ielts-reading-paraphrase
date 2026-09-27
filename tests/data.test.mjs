import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const sectionsSource = fs.readFileSync(new URL("sections.js", root), "utf8");
const appSource = fs.readFileSync(new URL("app.js", root), "utf8");
const html = fs.readFileSync(new URL("index.html", root), "utf8");
const context = { window: {} };
vm.runInNewContext(sectionsSource, context);
const sections = context.window.__SECTIONS__;

test("course covers Cambridge IELTS Books 11–20", () => {
  assert.equal(sections.length, 120);
  assert.equal(sections.reduce((sum, section) => sum + section.pairs.length, 0), 2200);
  assert.equal(sections.reduce((sum, section) => sum + Math.ceil(section.pairs.length / 5), 0), 485);
  assert.deepEqual([...new Set(sections.map((section) => section.book))], [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
});

test("Book 20 contributes twelve passages and 247 verified pairs", () => {
  const book20 = sections.filter((section) => section.book === 20);
  assert.equal(book20.length, 12);
  assert.equal(book20.reduce((sum, section) => sum + section.pairs.length, 0), 247);
  assert.deepEqual(Array.from(book20, (section) => section.pairs.length), [17, 22, 22, 20, 22, 22, 20, 20, 22, 20, 20, 20]);
  assert.deepEqual({ ...book20.at(-1).pairs.at(-1) }, {
    w: "enhance biodiversity",
    p: "create refuges for species threatened by predation",
  });
});

test("all exercises are unique and no round contains one pair", () => {
  const pairs = sections.flatMap((section) => section.pairs);
  const keys = pairs.map(({ w, p }) => `${w.toLowerCase()}|||${p.toLowerCase()}`);
  assert.equal(new Set(keys).size, pairs.length);
  for (const section of sections) {
    const sizes = [];
    let remaining = section.pairs.length;
    while (remaining > 5) {
      const size = remaining === 6 ? 4 : 5;
      sizes.push(size);
      remaining -= size;
    }
    if (remaining) sizes.push(remaining);
    assert.ok(sizes.every((size) => size >= 2 && size <= 5), `${section.book}-${section.test}-${section.passage}`);
  }
});

test("all 120 passages receive distinct completion messages", () => {
  const openers = vm.runInNewContext(`(${appSource.match(/const pepOpeners = (\[[\s\S]*?\n  \]);/)[1]})`);
  const closers = vm.runInNewContext(`(${appSource.match(/const pepClosers = (\[[\s\S]*?\n  \]);/)[1]})`);
  const messages = sections.map((_, index) => `${openers[index % openers.length]}—${closers[Math.floor(index / openers.length) % closers.length]}.`);
  assert.equal(messages.length, 120);
  assert.equal(new Set(messages).size, 120);
});

test("public copy and data release identify Books 11–20", () => {
  assert.match(html, /Cambridge IELTS 11–20/);
  assert.match(html, /sections\.js\?v=7/);
  assert.match(html, /enhance biodiversity → create refuges for species threatened by predation/);
});

test("contents dialog markup exists with correct selectors", () => {
  assert.match(html, /id="contentsButton"/);
  assert.match(html, /id="contentsDialog"/);
  assert.match(html, /id="contentsList"/);
  assert.match(html, /id="contentsClose"/);
  assert.match(html, /aria-label="Open contents directory"/);
});

test("book directory metadata is sorted and maps to correct first rounds", () => {
  // Derive book entries the same way app.js does
  const seen = new Map();
  sections.forEach((section, sectionIndex) => {
    if (!seen.has(section.book)) {
      seen.set(section.book, sectionIndex);
    }
  });
  const sortedBooks = [...seen.keys()].sort((a, b) => a - b);
  assert.deepEqual(sortedBooks, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

  // Build rounds to verify firstRoundIndex mapping
  const rounds = [];
  sections.forEach((section, sectionIndex) => {
    const pairCount = section.pairs.length;
    const sizes = [];
    let remaining = pairCount;
    while (remaining > 5) {
      sizes.push(5);
      remaining -= 5;
    }
    if (remaining > 0) sizes.push(remaining);
    sizes.forEach((size, roundIndex) => {
      const start = roundIndex === 0 ? 0 : sizes.slice(0, roundIndex).reduce((a, b) => a + b, 0);
      const end = start + size;
      const left = section.pairs.slice(start, end).map((pair, index) => ({ ...pair, id: `${sectionIndex}-${roundIndex}-${index}` }));
      const right = [...left].sort(() => 0.5 - Math.random());
      rounds.push({ sectionIndex, roundIndex, size, left, right, start, end });
    });
  });

  // Verify each book's first section and first round
  for (const book of sortedBooks) {
    const firstSectionIndex = seen.get(book);
    const firstSection = sections[firstSectionIndex];
    assert.equal(firstSection.book, book, `Book ${book} first section should have matching book number`);
    assert.equal(firstSection.test, 1, `Book ${book} first section should be Test 1`);
    assert.equal(firstSection.passage, 1, `Book ${book} first section should be Passage 1`);

    const firstRoundIndex = rounds.findIndex((r) => r.sectionIndex === firstSectionIndex);
    assert.ok(firstRoundIndex >= 0, `Book ${book} should have a valid first round index`);
    assert.equal(rounds[firstRoundIndex].roundIndex, 0, `Book ${book} first round should be round 0`);
  }
});

test("book directory jump cancels timers and clears celebration state", () => {
  // Verify the app.js source contains the expected jumpToBook logic
  assert.match(appSource, /function jumpToBook\(book\)/);
  assert.match(appSource, /cancelTimers\(\)/);
  assert.match(appSource, /state\.celebrationOpen = false/);
  assert.match(appSource, /state\.celebrationPointerStarted = false/);
  assert.match(appSource, /elements\.passageCelebration\.hidden = true/);
  assert.match(appSource, /elements\.finishDialog\.hidden = true/);
  assert.match(appSource, /elements\.contentsDialog\.close\(\)/);
});

test("contents dialog blocks navigation while open", () => {
  // Verify goNext/goBack check for contents dialog
  assert.match(appSource, /if \(elements\.contentsDialog\.open\) return;/);
  // Verify keydown handler also checks
  const keydownMatch = appSource.match(/document\.addEventListener\("keydown",[\s\S]*?\}\);/);
  assert.ok(keydownMatch);
  assert.match(keydownMatch[0], /elements\.contentsDialog\.open/);
});

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

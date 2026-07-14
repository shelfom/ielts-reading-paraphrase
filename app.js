(() => {
  "use strict";

  const SECTIONS = window.__SECTIONS__;
  if (!Array.isArray(SECTIONS) || !SECTIONS.length) throw new Error("Exercise data failed to load");

  const $ = (id) => document.getElementById(id);
  const elements = {
    testLabel: $("testLabel"),
    passageTitle: $("passageTitle"),
    roundLabel: $("roundLabel"),
    scoreLabel: $("scoreLabel"),
    progressFill: $("progressFill"),
    instruction: $("instruction"),
    sectionProgress: $("sectionProgress"),
    leftColumn: $("leftColumn"),
    rightColumn: $("rightColumn"),
    clearToast: $("clearToast"),
    clearMessage: $("clearMessage"),
    backButton: $("backButton"),
    nextButton: $("nextButton"),
    restartButton: $("restartButton"),
    themeButton: $("themeButton"),
    passageCelebration: $("passageCelebration"),
    celebrationCard: $("celebrationCard"),
    celebrationMessage: $("celebrationMessage"),
    celebrationNext: $("celebrationNext"),
    finishDialog: $("finishDialog"),
    finishRestart: $("finishRestart"),
  };

  const rounds = [];
  SECTIONS.forEach((section, sectionIndex) => {
    const sizes = [];
    let remaining = section.pairs.length;
    while (remaining > 5) {
      if (remaining === 6) {
        sizes.push(4);
        remaining -= 4;
      } else {
        sizes.push(5);
        remaining -= 5;
      }
    }
    if (remaining) sizes.push(remaining);
    let offset = 0;
    sizes.forEach((size, roundIndex) => {
      rounds.push({
        sectionIndex,
        roundIndex,
        roundTotal: sizes.length,
        offset,
        pairs: section.pairs.slice(offset, offset + size),
      });
      offset += size;
    });
  });

  const state = {
    roundIndex: 0,
    runs: new Map(),
    navToken: 0,
    timers: new Set(),
    celebrationOpen: false,
    celebrationOpenedAt: 0,
    celebrationPointerStarted: false,
  };

  function schedule(callback, delay) {
    const token = state.navToken;
    const timer = window.setTimeout(() => {
      state.timers.delete(timer);
      if (token === state.navToken) callback();
    }, delay);
    state.timers.add(timer);
    return timer;
  }

  function cancelTimers() {
    state.timers.forEach((timer) => window.clearTimeout(timer));
    state.timers.clear();
    state.navToken += 1;
  }

  function currentRound() {
    return rounds[state.roundIndex];
  }

  function currentRun() {
    if (!state.runs.has(state.roundIndex)) {
      state.runs.set(state.roundIndex, {
        matched: new Set(),
        selected: null,
        completing: false,
      });
    }
    return state.runs.get(state.roundIndex);
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffledIndexes(length, seed) {
    if (length < 2) return [0];
    const indexes = Array.from({ length }, (_, index) => index);
    const random = seededRandom(seed + 47);
    for (let attempt = 0; attempt < 40; attempt += 1) {
      for (let index = indexes.length - 1; index > 0; index -= 1) {
        const other = Math.floor(random() * (index + 1));
        [indexes[index], indexes[other]] = [indexes[other], indexes[index]];
      }
      if (indexes.every((value, index) => value !== index)) return indexes;
    }
    return indexes.map((_, index) => (index + 1) % length);
  }

  function makeCard(side, pairIndex, label) {
    const slot = document.createElement("div");
    slot.className = "card-slot";
    slot.dataset.side = side;
    slot.dataset.pair = String(pairIndex);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "match-card";
    button.dataset.side = side;
    button.dataset.pair = String(pairIndex);
    button.textContent = label;
    if (label.length > 90) button.classList.add("is-very-long");
    else if (label.length > 58) button.classList.add("is-long");
    button.setAttribute("aria-label", `${side === "left" ? "Question" : "Passage"}: ${label}`);
    button.addEventListener("click", () => choose(side, pairIndex));
    slot.append(button);
    return slot;
  }

  function findCard(side, pairIndex) {
    return document.querySelector(`.match-card[data-side="${side}"][data-pair="${pairIndex}"]`);
  }

  function findSlot(side, pairIndex) {
    return document.querySelector(`.card-slot[data-side="${side}"][data-pair="${pairIndex}"]`);
  }

  function updateProgress() {
    const round = currentRound();
    const section = SECTIONS[round.sectionIndex];
    const run = currentRun();
    const cleared = run.matched.size;
    const sectionCleared = sectionSolvedCount(round.sectionIndex);
    elements.scoreLabel.textContent = `${sectionCleared}/${section.pairs.length}`;
    elements.progressFill.style.width = `${(sectionCleared / section.pairs.length) * 100}%`;
    elements.sectionProgress.textContent = `Round ${round.roundIndex + 1} of ${round.roundTotal}`;
  }

  function sectionSolvedCount(sectionIndex) {
    return rounds.reduce((total, candidate, index) => {
      if (candidate.sectionIndex !== sectionIndex) return total;
      return total + (state.runs.get(index)?.matched.size || 0);
    }, 0);
  }

  function setInstruction(message, tone = "normal") {
    elements.instruction.textContent = message;
    elements.instruction.style.color = tone === "success" ? "var(--success)" : tone === "wrong" ? "var(--danger)" : "";
  }

  function render() {
    cancelTimers();
    const round = currentRound();
    const section = SECTIONS[round.sectionIndex];
    const run = currentRun();
    const rightOrder = shuffledIndexes(round.pairs.length, state.roundIndex + section.book * 101);

    elements.clearToast.classList.remove("is-visible");
    if (!state.celebrationOpen) elements.passageCelebration.hidden = true;
    elements.leftColumn.replaceChildren();
    elements.rightColumn.replaceChildren();
    elements.testLabel.textContent = `Passage ${section.passage} · ${section.title}`;
    elements.passageTitle.textContent = `Test ${section.test} Cambridge IELTS ${section.book}`;
    elements.roundLabel.textContent = `Round ${round.roundIndex + 1} of ${round.roundTotal}`;
    elements.backButton.disabled = state.roundIndex === 0;
    elements.nextButton.textContent = state.roundIndex === rounds.length - 1 ? "Finish ›" : "Next ›";
    setInstruction("Choose either side, then find its match.");

    round.pairs.forEach((pair, pairIndex) => {
      const slot = makeCard("left", pairIndex, pair.w);
      elements.leftColumn.append(slot);
    });
    rightOrder.forEach((pairIndex) => {
      const slot = makeCard("right", pairIndex, round.pairs[pairIndex].p);
      elements.rightColumn.append(slot);
    });

    run.matched.forEach((pairIndex) => clearPairVisually(pairIndex, false));
    if (run.selected) findCard(run.selected.side, run.selected.pairIndex)?.classList.add("is-selected");
    updateProgress();
  }

  function createSparks(slot) {
    if (!slot || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let index = 0; index < 7; index += 1) {
      const spark = document.createElement("i");
      spark.className = "spark";
      spark.style.setProperty("--angle", `${index * (360 / 7)}deg`);
      slot.append(spark);
      window.setTimeout(() => spark.remove(), 420);
    }
  }

  function clearPairVisually(pairIndex, animate = true) {
    ["left", "right"].forEach((side) => {
      const card = findCard(side, pairIndex);
      const slot = findSlot(side, pairIndex);
      if (!card || !slot) return;
      card.disabled = true;
      card.classList.remove("is-selected", "is-wrong");
      if (animate) {
        card.classList.add("is-popping");
        createSparks(slot);
        schedule(() => slot.classList.add("is-cleared"), 260);
      } else {
        card.style.visibility = "hidden";
        slot.classList.add("is-cleared");
      }
    });
  }

  function clearSelection(run) {
    if (run.selected) {
      findCard(run.selected.side, run.selected.pairIndex)?.classList.remove("is-selected");
    }
    run.selected = null;
  }

  function choose(side, pairIndex) {
    const run = currentRun();
    if (run.completing || run.matched.has(pairIndex)) return;
    const card = findCard(side, pairIndex);
    if (!card) return;

    if (!run.selected) {
      run.selected = { side, pairIndex };
      card.classList.add("is-selected");
      setInstruction(side === "left" ? "Now find its paraphrase." : "Now find the matching question phrase.");
      return;
    }

    if (run.selected.side === side) {
      findCard(run.selected.side, run.selected.pairIndex)?.classList.remove("is-selected");
      run.selected = { side, pairIndex };
      card.classList.add("is-selected");
      return;
    }

    const first = run.selected;
    const firstCard = findCard(first.side, first.pairIndex);
    if (first.pairIndex !== pairIndex) {
      firstCard?.classList.add("is-wrong");
      card.classList.add("is-wrong");
      setInstruction("Not that one — try again.", "wrong");
      clearSelection(run);
      schedule(() => {
        firstCard?.classList.remove("is-wrong");
        card.classList.remove("is-wrong");
        setInstruction("Choose either side, then find its match.");
      }, 360);
      return;
    }

    run.matched.add(pairIndex);
    clearSelection(run);
    clearPairVisually(pairIndex, true);
    if (navigator.vibrate) navigator.vibrate(12);
    setInstruction("Nice — that pair is cleared.", "success");
    updateProgress();

    if (run.matched.size === currentRound().pairs.length) finishRound(run);
  }

  function completionMessage() {
    const round = currentRound();
    const section = SECTIONS[round.sectionIndex];
    const isSectionEnd = round.roundIndex === round.roundTotal - 1;
    const nextSection = SECTIONS[rounds[state.roundIndex + 1]?.sectionIndex];
    if (isSectionEnd && section.passage === 3 && (!nextSection || nextSection.test !== section.test || nextSection.book !== section.book)) {
      return `Test ${section.test} complete`;
    }
    if (isSectionEnd) return `Passage ${section.passage} clear`;
    return `${round.pairs.length}/${round.pairs.length} · Nice one`;
  }

  const pepOpeners = [
    "You absolutely cooked",
    "Vocabulary beast mode: unlocked",
    "That was disgustingly smooth",
    "You made that passage look easy",
    "Your brain just did a victory lap",
    "Too sharp—honestly unfair",
    "That was clean, clever, and slightly rude",
    "Cambridge just felt a disturbance",
    "You’re getting dangerously good at this",
    "That passage never stood a chance",
    "Main-character brain energy",
    "Elite matching—zero crumbs",
  ];

  const pepClosers = [
    "keep the streak alive",
    "go bully the next one",
    "the next passage is already nervous",
    "stay hot and keep moving",
    "take the win, then level up",
    "sip the glory before you continue",
    "your future band score says hello",
    "cool down for one second, genius",
    "next round, same swagger",
  ];

  function pepTalkFor(sectionIndex) {
    const opener = pepOpeners[sectionIndex % pepOpeners.length];
    const closer = pepClosers[Math.floor(sectionIndex / pepOpeners.length) % pepClosers.length];
    return `${opener}—${closer}.`;
  }

  function showPassageCelebration(section, sectionIndex) {
    cancelTimers();
    state.celebrationOpen = true;
    state.celebrationOpenedAt = performance.now();
    state.celebrationPointerStarted = false;
    const pep = pepTalkFor(sectionIndex);
    elements.celebrationMessage.textContent = `Passage ${section.passage} · Test ${section.test} · Book ${section.book} — done. ${pep}`;
    elements.celebrationNext.textContent = state.roundIndex === rounds.length - 1 ? "Finish ›" : "Next ›";
    elements.celebrationNext.disabled = true;
    elements.passageCelebration.hidden = false;
    elements.celebrationCard.focus({ preventScroll: true });
    schedule(() => {
      if (state.celebrationOpen) elements.celebrationNext.disabled = false;
    }, 900);
  }

  function advanceAfterCelebration(event) {
    if (!state.celebrationOpen || elements.passageCelebration.hidden) return;
    const settled = performance.now() - state.celebrationOpenedAt >= 850;
    const freshPointerClick = event.detail > 0 && state.celebrationPointerStarted;
    const freshKeyboardClick = event.detail === 0 && document.activeElement === elements.celebrationNext;
    state.celebrationPointerStarted = false;
    if (!event.isTrusted || !settled || (!freshPointerClick && !freshKeyboardClick)) return;
    state.celebrationOpen = false;
    elements.passageCelebration.hidden = true;
    if (state.roundIndex === rounds.length - 1) {
      elements.finishDialog.hidden = false;
      elements.finishRestart.focus();
      return;
    }
    state.roundIndex += 1;
    render();
  }

  function finishRound(run) {
    run.completing = true;
    const round = currentRound();
    const section = SECTIONS[round.sectionIndex];
    const isSectionEnd = round.roundIndex === round.roundTotal - 1;
    const passageComplete = isSectionEnd && sectionSolvedCount(round.sectionIndex) === section.pairs.length;

    if (passageComplete) {
      schedule(() => showPassageCelebration(section, round.sectionIndex), 300);
      return;
    }

    schedule(() => {
      elements.clearMessage.textContent = completionMessage();
      elements.clearToast.classList.remove("is-visible");
      void elements.clearToast.offsetWidth;
      elements.clearToast.classList.add("is-visible");
    }, 300);
    schedule(() => {
      if (state.roundIndex === rounds.length - 1) {
        elements.finishDialog.hidden = false;
      } else {
        state.roundIndex += 1;
        render();
      }
    }, 1180);
  }

  function goNext() {
    if (state.celebrationOpen) return;
    if (currentRun().completing) return;
    if (state.roundIndex === rounds.length - 1) {
      elements.finishDialog.hidden = false;
      return;
    }
    state.roundIndex += 1;
    render();
  }

  function goBack() {
    if (state.celebrationOpen) return;
    if (state.roundIndex === 0) return;
    state.roundIndex -= 1;
    state.runs.delete(state.roundIndex);
    render();
    setInstruction("Replay this round at your own pace.");
  }

  function restartRound() {
    if (state.celebrationOpen) return;
    state.runs.delete(state.roundIndex);
    render();
    setInstruction("Fresh start — five quick wins.");
  }

  function restartCourse() {
    cancelTimers();
    state.celebrationOpen = false;
    state.roundIndex = 0;
    state.runs.clear();
    state.celebrationPointerStarted = false;
    elements.passageCelebration.hidden = true;
    elements.finishDialog.hidden = true;
    render();
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ielts-paraphrase-theme", theme);
    const dark = theme === "dark";
    elements.themeButton.querySelector(".sun").textContent = dark ? "☾" : "☼";
    elements.themeButton.querySelector(".theme-label").textContent = dark ? "Light" : "Dark";
    elements.themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", dark ? "#101813" : "#edf1e8");
  }

  elements.backButton.addEventListener("click", goBack);
  elements.nextButton.addEventListener("click", goNext);
  elements.restartButton.addEventListener("click", restartRound);
  elements.celebrationNext.addEventListener("pointerdown", () => {
    if (state.celebrationOpen && !elements.celebrationNext.disabled) state.celebrationPointerStarted = true;
  });
  elements.celebrationNext.addEventListener("pointercancel", () => {
    state.celebrationPointerStarted = false;
  });
  elements.celebrationNext.addEventListener("click", advanceAfterCelebration);
  elements.finishRestart.addEventListener("click", restartCourse);
  elements.themeButton.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  document.addEventListener("keydown", (event) => {
    if (state.celebrationOpen) return;
    if (event.altKey && event.key === "ArrowLeft") goBack();
    if (event.altKey && event.key === "ArrowRight") goNext();
  });

  const queryTheme = new URLSearchParams(location.search).get("theme");
  const savedTheme = localStorage.getItem("ielts-paraphrase-theme");
  setTheme(queryTheme === "dark" || queryTheme === "light" ? queryTheme : savedTheme || "light");
  render();

  window.__APP__ = { SECTIONS, rounds, state, goNext, goBack, restartRound, pepTalkFor };
})();

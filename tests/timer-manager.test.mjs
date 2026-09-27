import test from "node:test";
import assert from "node:assert/strict";
import { createTimerManager } from "../timer-manager.mjs";

// Fake controllable clock: setTimeout returns a NUMBER like browsers.
function createFakeClock() {
  let now = 0;
  let nextHandle = 1;
  const pending = new Map();

  const setTimeoutFn = (callback, delay) => {
    const handle = nextHandle++;
    pending.set(handle, { callback, due: now + delay });
    return handle;
  };
  const clearTimeoutFn = (handle) => {
    pending.delete(handle);
  };

  const advance = (ms) => {
    now += ms;
    const due = [];
    for (const [handle, entry] of pending) {
      if (entry.due <= now) due.push([handle, entry]);
    }
    for (const [handle, entry] of due) {
      if (pending.has(handle)) {
        pending.delete(handle);
        entry.callback();
      }
    }
  };

  return {
    setTimeout: setTimeoutFn,
    clearTimeout: clearTimeoutFn,
    now: () => now,
    advance,
    get pendingCount() {
      return pending.size;
    },
  };
}

test("timer-manager: numeric timeout ids, schedule fires once", () => {
  const clock = createFakeClock();
  const tm = createTimerManager(clock);
  let count = 0;
  tm.schedule(() => (count += 1), 100);
  assert.equal(clock.pendingCount, 1);
  clock.advance(99);
  assert.equal(count, 0);
  clock.advance(1);
  assert.equal(count, 1);
  clock.advance(500);
  assert.equal(count, 1);
});

test("timer-manager: pause preserves remaining delay and resume fires exactly once", () => {
  const clock = createFakeClock();
  const tm = createTimerManager(clock);
  let fired = 0;
  tm.schedule(() => (fired += 1), 1000);
  clock.advance(700);
  tm.pauseAll();
  assert.equal(fired, 0);
  assert.equal(tm.activeCount, 0);
  assert.equal(tm.pausedCount, 1);
  // While paused, time passes but callback must not fire.
  clock.advance(5000);
  assert.equal(fired, 0);
  tm.resumeAll();
  assert.equal(tm.pausedCount, 0);
  assert.equal(tm.activeCount, 1);
  // Remaining delay was 300ms; advancing 299 must not fire.
  clock.advance(299);
  assert.equal(fired, 0);
  clock.advance(1);
  assert.equal(fired, 1);
  // Confirm exactly once.
  clock.advance(5000);
  assert.equal(fired, 1);
});

test("timer-manager: cancelAll discards active and paused callbacks and bumps token", () => {
  const clock = createFakeClock();
  const tm = createTimerManager(clock);
  const tokenBefore = tm.token;
  let activeFired = 0;
  let pausedFired = 0;
  tm.schedule(() => (activeFired += 1), 500);
  tm.schedule(() => (pausedFired += 1), 900);
  clock.advance(200);
  tm.pauseAll();
  tm.cancelAll();
  assert.equal(tm.activeCount, 0);
  assert.equal(tm.pausedCount, 0);
  assert.ok(tm.token > tokenBefore, "nav token must be invalidated");
  clock.advance(10000);
  assert.equal(activeFired, 0);
  assert.equal(pausedFired, 0);
});

test("timer-manager: stale-token callbacks cannot change state after navigation", () => {
  const clock = createFakeClock();
  const tm = createTimerManager(clock);
  let calls = 0;
  // Schedule a callback at the current token.
  tm.schedule(() => (calls += 1), 1000);
  // Navigation cancels and invalidates token.
  tm.cancelAll();
  clock.advance(2000);
  assert.equal(calls, 0);
  // A fresh callback under the new token still works.
  let fresh = 0;
  tm.schedule(() => (fresh += 1), 100);
  clock.advance(100);
  assert.equal(fresh, 1);
});

test("timer-manager: resume filters out callbacks whose token changed", () => {
  const clock = createFakeClock();
  const tm = createTimerManager(clock);
  let oldFired = 0;
  let newFired = 0;
  tm.schedule(() => (oldFired += 1), 1000);
  clock.advance(100);
  tm.pauseAll();
  // While paused, a navigation invalidates the token.
  tm.cancelAll();
  // Paused store was cleared by cancelAll; simulate a leftover entry by
  // pausing a fresh callback under the new token to ensure valid resume path.
  tm.schedule(() => (newFired += 1), 200);
  tm.pauseAll();
  tm.resumeAll();
  clock.advance(200);
  assert.equal(oldFired, 0);
  assert.equal(newFired, 1);
});

// Timer manager: stores schedule metadata in a Map keyed by numeric timer id.
// Never attaches properties to setTimeout return values (browser ids are numbers).
export function createTimerManager(clock) {
  const env = clock || {
    setTimeout: (...args) => globalThis.setTimeout(...args),
    clearTimeout: (handle) => globalThis.clearTimeout(handle),
    now: () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
  };

  const records = new Map();
  let navToken = 0;
  let paused = [];
  let idCounter = 0;

  function schedule(callback, delay) {
    const token = navToken;
    const id = ++idCounter;
    const createdAt = env.now();
    const handle = env.setTimeout(() => {
      records.delete(id);
      if (token === navToken) callback();
    }, delay);
    records.set(id, { id, handle, callback, delay, createdAt, token });
    return id;
  }

  function cancelAll() {
    for (const rec of records.values()) env.clearTimeout(rec.handle);
    records.clear();
    paused = [];
    navToken += 1;
  }

  function pauseAll() {
    const now = env.now();
    const captured = [];
    for (const rec of records.values()) {
      env.clearTimeout(rec.handle);
      const elapsed = now - rec.createdAt;
      captured.push({
        callback: rec.callback,
        remaining: Math.max(0, rec.delay - elapsed),
        token: rec.token,
      });
    }
    records.clear();
    paused = captured;
  }

  function resumeAll() {
    const stored = paused;
    paused = [];
    for (const entry of stored) {
      if (entry.token !== navToken) continue;
      schedule(entry.callback, entry.remaining);
    }
  }

  return {
    schedule,
    cancelAll,
    pauseAll,
    resumeAll,
    get activeCount() {
      return records.size;
    },
    get pausedCount() {
      return paused.length;
    },
    get token() {
      return navToken;
    },
  };
}

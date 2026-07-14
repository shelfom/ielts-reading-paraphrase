export function initApp(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('#app element not found');
    return;
  }

  app.innerHTML = `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="border-b border-[var(--border)] px-6 py-4">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold tracking-tight">IELTS Reading Paragraph</h1>
          <nav id="nav" class="flex gap-4 text-sm text-[var(--muted)]">
            <span>Passages</span>
          </nav>
        </div>
      </header>

      <!-- Main content area -->
      <main id="main-content" class="flex-1 px-6 py-8">
        <div class="max-w-4xl mx-auto">
          <div class="flex flex-col items-center justify-center py-24 text-center">
            <div class="mb-6">
              <svg class="w-16 h-16 mx-auto text-[var(--muted)] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold mb-2">Ready for Content</h2>
            <p class="text-sm text-[var(--muted)] max-w-md">
              Place passage JSON files in <code class="px-1.5 py-0.5 rounded bg-[var(--border)] text-xs font-mono">public/data/</code>
              to begin. A <code class="px-1.5 py-0.5 rounded bg-[var(--border)] text-xs font-mono">manifest.json</code> index file is required.
            </p>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-[var(--border)] px-6 py-3 text-center text-xs text-[var(--muted)]">
        IELTS Reading Paragraph
      </footer>
    </div>
  `;
}

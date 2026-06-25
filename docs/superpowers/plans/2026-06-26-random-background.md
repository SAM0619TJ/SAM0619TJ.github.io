# Random Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Select one existing `images/` asset as the shared page background on each page load, with no carousel or persistence.

**Architecture:** Add a small tested background helper to `assets/ui.js`. The helper chooses one image from a fixed list, resolves the image relative to `assets/ui.js` with `new URL(..., import.meta.url)`, and writes the resulting `url(...)` value to the existing `--bg-image` CSS custom property.

**Tech Stack:** Static HTML, browser ES modules, CSS custom properties, Node.js for source-level tests.

---

### File Map

- Modify: `assets/ui.js`
  - Add background image constants and helper functions.
  - Call random background initialization once inside `initSidebarUI()`.
- Create: `tests/random-background.test.mjs`
  - Tests random index selection, URL resolution, and CSS variable application without a browser.

### Task 1: Add Failing Test

**Files:**
- Create: `tests/random-background.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import {
  buildCssImageUrl,
  chooseRandomBackgroundImage,
  initRandomBackground,
} from "../assets/ui.js";

assert.equal(
  chooseRandomBackgroundImage(["a.jpg", "b.jpg", "c.jpg"], () => 0),
  "a.jpg",
);

assert.equal(
  chooseRandomBackgroundImage(["a.jpg", "b.jpg", "c.jpg"], () => 0.99),
  "c.jpg",
);

assert.equal(
  buildCssImageUrl("../images/image4.jpg", "https://example.com/site/assets/ui.js"),
  'url("https://example.com/site/images/image4.jpg")',
);

const styleWrites = [];
const fakeDocument = {
  documentElement: {
    style: {
      setProperty(name, value) {
        styleWrites.push([name, value]);
      },
    },
  },
};

initRandomBackground({
  doc: fakeDocument,
  images: ["../images/image1.jpg", "../images/p1.png"],
  random: () => 0.75,
  baseUrl: "https://example.com/site/assets/ui.js",
});

assert.deepEqual(styleWrites, [
  ["--bg-image", 'url("https://example.com/site/images/p1.png")'],
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/random-background.test.mjs`

Expected: FAIL with a module export error because `buildCssImageUrl`, `chooseRandomBackgroundImage`, and `initRandomBackground` are not implemented/exported yet.

### Task 2: Implement Random Background

**Files:**
- Modify: `assets/ui.js`

- [ ] **Step 1: Add tested helpers and initializer**

Add this near the top of `assets/ui.js`, after the `$` / `$$` helpers:

```js
const BACKGROUND_IMAGES = [
  "../images/image1.jpg",
  "../images/image2.jpg",
  "../images/image3.jpg",
  "../images/image4.jpg",
  "../images/image5.jpg",
  "../images/p1.png",
];

export function chooseRandomBackgroundImage(images = BACKGROUND_IMAGES, random = Math.random) {
  if (!images.length) return "";
  const raw = random();
  const clamped = Math.max(0, Math.min(raw, 0.999999999));
  return images[Math.floor(clamped * images.length)];
}

export function buildCssImageUrl(imagePath, baseUrl = import.meta.url) {
  return `url("${new URL(imagePath, baseUrl).href}")`;
}

export function initRandomBackground({
  doc = globalThis.document,
  images = BACKGROUND_IMAGES,
  random = Math.random,
  baseUrl = import.meta.url,
} = {}) {
  const imagePath = chooseRandomBackgroundImage(images, random);
  if (!imagePath || !doc?.documentElement?.style?.setProperty) return;
  doc.documentElement.style.setProperty("--bg-image", buildCssImageUrl(imagePath, baseUrl));
}
```

- [ ] **Step 2: Call initializer once from shared UI startup**

Update `initSidebarUI()` in `assets/ui.js`:

```js
export function initSidebarUI() {
  initThemeOnLoad();
  initRandomBackground();
  initThemeToggle();
  initGroups();
  initActiveLink();
  initScrollUI();
  initMobileSidebar();
  initSmoothAnchors();
  initReveal();
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `node tests/random-background.test.mjs`

Expected: PASS with exit code 0 and no output.

### Task 3: Verify Site Behavior

**Files:**
- Read: `assets/ui.js`
- Read: `images/`
- Read: `orgin.html`
- Read: `md.html`

- [ ] **Step 1: Confirm all image files exist**

Run:

```bash
for f in images/image1.jpg images/image2.jpg images/image3.jpg images/image4.jpg images/image5.jpg images/p1.png; do test -f "$f" || exit 1; done
```

Expected: exit code 0.

- [ ] **Step 2: Confirm no carousel or persistence was added**

Run:

```bash
rg -n "setInterval|setTimeout|localStorage\\.setItem\\(\".*background|carousel|轮播" assets/ui.js
```

Expected: exit code 1, meaning no matches.

- [ ] **Step 3: Smoke test static pages**

Run:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
curl --fail --silent --show-error --output /dev/null http://127.0.0.1:8765/orgin.html
curl --fail --silent --show-error --output /dev/null 'http://127.0.0.1:8765/md.html?file=study_note/shader/bridge/vulkan_engine_map.md'
curl --fail --silent --show-error --output /dev/null http://127.0.0.1:8765/assets/ui.js
```

Expected: all `curl` commands exit 0; stop the server after requests.

### Task 4: Commit, Push, and PR

**Files:**
- Commit: `assets/ui.js`
- Commit: `tests/random-background.test.mjs`
- Commit: `docs/superpowers/plans/2026-06-26-random-background.md`

- [ ] **Step 1: Review scoped diff**

Run:

```bash
git diff -- assets/ui.js tests/random-background.test.mjs docs/superpowers/plans/2026-06-26-random-background.md
git status --short
```

Expected: only the random background files are staged for the feature commit; pre-existing unrelated worktree changes remain unstaged.

- [ ] **Step 2: Commit feature changes**

Run:

```bash
git add assets/ui.js tests/random-background.test.mjs docs/superpowers/plans/2026-06-26-random-background.md
git commit -m "Add random page background selection"
```

Expected: commit succeeds on `feat/random-background`.

- [ ] **Step 3: Push and open PR**

Run:

```bash
git push -u origin feat/random-background
gh pr create --base main --head feat/random-background --title "Add random page background selection" --body "## Summary
- randomly select one existing image as the shared page background on each load
- keep the existing CSS fallback and avoid carousel/persistence behavior
- add a small Node test for selection and URL resolution

## Tests
- node tests/random-background.test.mjs
- curl smoke checks against local static server"
```

Expected: branch pushes and GitHub CLI returns a PR URL.

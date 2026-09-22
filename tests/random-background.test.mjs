import assert from "node:assert/strict";
import {
  buildCssImageUrl,
  chooseRandomBackgroundImage,
  initRandomBackground,
  isPortraitViewport,
  selectBackgroundSet,
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

const sets = {
  landscape: ["L1.jpg", "L2.jpg"],
  portrait: ["P1.jpg", "P2.jpg"],
};

assert.deepEqual(selectBackgroundSet(false, sets), sets.landscape);
assert.deepEqual(selectBackgroundSet(true, sets), sets.portrait);
assert.deepEqual(
  selectBackgroundSet(true, { landscape: ["L.jpg"], portrait: [] }),
  ["L.jpg"],
);

assert.equal(isPortraitViewport({}), false);
assert.equal(
  isPortraitViewport({ matchMedia: (q) => ({ matches: q.includes("portrait") }) }),
  true,
);

const portraitWrites = [];
initRandomBackground({
  doc: {
    documentElement: {
      style: { setProperty: (name, value) => portraitWrites.push([name, value]) },
    },
  },
  win: { matchMedia: (q) => ({ matches: q.includes("portrait") }) },
  sets,
  random: () => 0,
  baseUrl: "https://example.com/site/assets/ui.js",
});

assert.deepEqual(portraitWrites, [
  ["--bg-image", 'url("https://example.com/site/assets/P1.jpg")'],
]);

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

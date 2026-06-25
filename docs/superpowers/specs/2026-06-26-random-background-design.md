# Random Background Design

## Goal

Use the existing images in `images/` as page backgrounds, selecting one random image each time the page loads. The page should not keep rotating images after load.

## Scope

- Applies to pages that initialize the shared UI through `assets/ui.js`.
- Uses the existing CSS background variable `--bg-image`.
- Candidate images:
  - `images/image1.jpg`
  - `images/image2.jpg`
  - `images/image3.jpg`
  - `images/image4.jpg`
  - `images/image5.jpg`
  - `images/p1.png`

## Behavior

On page initialization, JavaScript chooses one candidate image with `Math.random()` and sets `document.documentElement.style.setProperty("--bg-image", ...)`.

The random choice happens once per page load. There is no timer, carousel, button, or localStorage persistence. Reloading the page may choose a different image.

## Fallback

`assets/ui.css` keeps its current `--bg-image` default. If JavaScript fails or runs before the image list is applied, the site still uses the existing default background.

## Implementation

Add a small `initRandomBackground()` function in `assets/ui.js` and call it from `initSidebarUI()`.

Do not add new dependencies, markup, controls, or build tooling.

## Verification

- Static check that the image list paths exist in `images/`.
- Start a local static server and request `orgin.html`, `md.html`, and `assets/ui.css`.
- Inspect source to confirm there is no interval/timer-based rotation and no persistence.

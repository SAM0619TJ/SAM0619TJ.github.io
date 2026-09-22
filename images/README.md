# Images

This directory stores reusable image assets for the site.

## Background Sets (orientation-aware)

The shared UI picks a random background that matches the screen orientation.
The two sets are configured in `assets/ui.js` (`BACKGROUND_SETS`).

### Landscape (横屏, width ≥ height)

- `image1.jpg`, `image2.jpg`, `image3.jpg`, `image4.jpg`
- `122535213_p0-万事屋すいちゃん.jpg`
- `65913057_p0-水着オルタ.png`
- `122149864_p0-とげなしとげあり.jpg`
- `120064238_p0-GIRLS BAND CRY完结贺图.png`
- `126475690_p0-No longer alone.jpg`
- `57963734_p0-魔女と聖女.png`

### Portrait (竖屏, height > width)

- `119121286_p0-ガールズバンドクライ.jpg`
- `145762384_p0-冬.jpg`
- `119051947_p0-全部ぶちこめ！.png`
- `59612057_p0-Avalon.png`

## Usage Notes

- Orientation is detected via `matchMedia("(orientation: portrait)")`; the
  background is re-picked automatically when the device rotates.
- The `--bg-image` CSS variable is set at runtime by `assets/ui.js`; the layer
  styling (`cover`, `center`) lives in `assets/ui.css` under `body::before`.
- Filenames with spaces / non-ASCII characters are URL-encoded automatically by
  `buildCssImageUrl` (via the `URL` constructor), so they are safe to list.
- To add a new image, classify it by aspect ratio and append it to the matching
  array in `BACKGROUND_SETS`.
- Keep background opacity low so text cards stay readable in light and dark themes.

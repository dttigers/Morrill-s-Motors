# Morrill's Motors

A small static marketing site for Morrill's Motors — HTML/CSS/JS with images in `assets/images/`.

## Quick start ✅

- Open `index.html` in your browser (double-click) for simple local testing.
- Or serve locally (recommended) to avoid cross-origin issues:

```bash
# Python 3
python -m http.server 8000
# then open: http://localhost:8000
```

## Project structure 🔧

- `index.html`, `contact.html`, `gallery.html`, `info.html`, `store.html` — site pages
- `assets/` — static assets
  - `assets/styles.css` — stylesheet
  - `assets/script.js` — site JS
  - `assets/images/` — all image assets including `logo.png`

## Notes & conventions 💡

- Logo: `assets/images/logo.png` (used across pages)
- Keep images inside `assets/images` and other assets in `assets/` for consistency and easier deployments.
- This is a static site — no build step required.

## Development tips ⚠️

- Use a local static server (see Quick start) or a VS Code Live Server extension to preview changes.
- If you add new assets, update references in the HTML files to point into `assets/`.

## Next steps (optional) ✨

- Add a `LICENSE` file (e.g., MIT) and a short `CONTRIBUTING.md` if collaborators will work on this.
- Add a simple deploy script or GitHub Pages workflow if you'd like automated publishing.

---

If you'd like, I can add a `LICENSE` (MIT/ISC) and a small GitHub Actions workflow to publish to GitHub Pages — shall I add those?
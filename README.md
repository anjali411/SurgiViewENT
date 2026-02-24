# SurgiView ENT (starter scaffold)

A lightweight Three.js starter for an ENT patient-education viewer.

## Features

- Condition presets for common ENT pathologies
- Structure-specific highlighting in a 3D scene
- Plain-language explanation panel for chairside discussions
- Quick-pick condition buttons and URL-persisted state (`?condition=...`)
- Minimal dependency footprint (Three.js loaded by CDN)

## Run locally

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Deploy to GitHub Pages

This repository now includes a GitHub Actions workflow that publishes the site from the repository root to GitHub Pages.

1. Push the branch to GitHub.
2. In **Settings → Pages**, set source to **GitHub Actions**.
3. Ensure Actions are enabled for the repository.
4. Merge to `main` (or run the workflow manually).

The workflow uploads the static files directly (no build step required).

## Next steps

1. Replace placeholder geometry with ENT glTF models (OpenAnatomy / BodyParts3D-derived assets).
2. Expand `src/conditions.js` with additional pathology presets and procedure overlays.
3. Add side-by-side normal vs pathology comparison and optional annotations.

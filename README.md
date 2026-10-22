# Hoops Dynasty — complete editable project

## Run locally
Install Node.js 20 or newer, extract this ZIP, open the Hoops-Dynasty folder in VS Code, and run:

```sh
npm start
```

Open http://127.0.0.1:8000. The game has no runtime dependencies and needs no build step or npm install.

Alternatively, with Python 3:

```sh
python3 -m http.server 8000 --directory dist --bind 127.0.0.1
```

On Windows use `py` instead of `python3`.

## Editable source and assets
Despite its name, `dist/` contains the actual hand-authored HTML, CSS and JavaScript source; it is not a compiled-only bundle. Edit these files directly and refresh the browser. All existing local assets, city photographs, inline/generated player portraits, logos, data/configuration files, documentation, audit reports and developer scripts are preserved. There is no separate backend database required to run this browser-local game; included JSON/data files are retained.

`dev/` and root `test-*.cjs` contain development/testing tools. `docs/` and `dist/audits/` contain reports, including the Phase 1–6 work and later phases. The latest published gameplay is accepted Phase 12. Unpublished Phase 13 calibration scripts and any results present at export are included as work in progress; no Phase 13 freeze or final holdout was completed. Export does not apply pending experiments or alter gameplay.

Optional storage/browser testing dependencies are declared in `dev/package.json`. If needed run `npm install --prefix dev`; historical analysis scripts may also require Python packages such as numpy. No existing dependency lockfile was present in the source checkout; the root lockfile supplied here is for the dependency-free local launcher. Some historical audit scripts reference old absolute snapshot paths or live data endpoints; adapt those paths only when rerunning those optional tools.

## Continue development / GitHub
The new root package.json, package-lock.json, scripts/start-local.cjs and this README are export-only conveniences. Original project files are byte-for-byte preserved. EXPORT-MANIFEST.json lists their SHA-256 hashes. Git history, installed dependencies, temporary locks/logs/caches, and credentials are omitted.

To upload from a new GitHub repository:

```sh
git init
git add .
git commit -m "Import Hoops Dynasty project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

The .openai/hosting.json file is the existing Sites configuration, not a secret. It is not needed for local serving. Large historical audit files can require Git LFS if GitHub rejects a file over 100 MB; the complete data remains in this ZIP.

Browser career saves live in the original browser storage and are not project source. Export an existing save from the game separately if you need to continue that particular career locally. External links present in the original source remain unchanged; all assets already stored in the project are included.

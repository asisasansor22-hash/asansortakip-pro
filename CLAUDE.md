# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview built bundle on http://localhost:4173
```

There are no test, lint, or type-check scripts. The project ships plain JS (no TypeScript) and has no test runner. Don't invent npm scripts — if you need to verify a change, run `npm run build` (catches syntax/import errors) and exercise the affected screen in `npm run dev`.

## Architecture

Single-page PWA for elevator maintenance / fault tracking. UI strings, identifiers, and code comments are in **Turkish** — preserve that style when editing (e.g. `rol`, `tab`, `elevs`, `maints`, `bakimci`, `yonetici`, `kapama`, `odeme`).

### Stack
- **React 18** + **Vite 5** + **vite-plugin-pwa** (injectManifest strategy, custom SW in `public/sw.js`)
- **Firebase Auth** (email/password) + **Firebase Realtime Database via REST** — see `src/firebase.js`. The Firebase config is intentionally hardcoded; access is gated server-side by RTDB security rules.
- **SheetJS** is loaded from CDN (`<script>` in `index.html`) and used via `window.XLSX` in `src/utils/excel.js`. It is *not* an npm dependency.

### App.jsx is the hub
`src/App.jsx` (~3100 lines) holds nearly all application state, routing, and most business logic. Components in `src/components/` are mostly presentational and receive state + setters via props. When adding a feature, expect to thread new state through `App.jsx` rather than introducing a context/store.

Top-level flow inside `App()`:
1. `rol` (`null` | `"yonetici"` | `"bakimci"`) gates rendering. While `null`, `LoginScreen` is shown.
2. `tab` (integer) drives the active screen. `TABS_YON` defines 14 admin tabs (Dashboard / Asansörler / Bakım Atama / Arızalar / ...); `TABS_BAK` defines 4 technician tabs and is mapped to absolute indices `[2,5,8,9]` so `tab===2` and `tab===5` etc. behave consistently across roles. Conditional renders are written `tab===N && rol==="..."`.
3. Modal-like screens (`modal`, `edit`, `form`, `sifreModal`, `rotaAdresModal`, etc.) are also held in `App` state.

### Persistence (Firebase RTDB + localStorage mirror)
Data flows through `dbGet(key)` / `dbSet(key, value)` from `src/firebase.js`, which hit `https://asansortakipv3-default-rtdb.../asansor/<key>.json?auth=<idToken>`. Keys used by the app are prefixed `at_` (e.g. `at_elevs`, `at_maints`, `at_faults`, `at_tasks`, `at_sozlesme`, `at_hesapkayit`, `at_haftalik`, `at_aylik`, `at_sonodemeler`, `at_giderler`, `at_giderhafta`, `at_notlar`, `at_ekstraisler`, `at_muayeneler`, `at_bakimcilar`).

Two important invariants in the load/save effects (App.jsx ~lines 615–725):

- **`ilkYukleme` ref guards the save effects.** Each piece of state has a `useEffect` that calls `dbSet` whenever it changes — but only after `ilkYukleme.current=false`, set at the end of the initial load. If you add new persistent state, follow the same pattern or you will overwrite Firebase with empty arrays on first render.
- **Never write `EXCEL_ELEVS` to Firebase when `dbGet` returns `null`.** `null` can mean "network error" — the loader only seeds Firebase with `EXCEL_ELEVS` when both Firebase *and* the `ls_elevs` localStorage backup are empty (genuine first-run). Preserve this branching when touching the elevator load logic.

`src/utils/storage.js` exposes `lsGet`/`lsSet` (JSON-wrapped `localStorage`). Critical lists (`elevs`, `maints`, `aylik`, `sonodemeler`, `bakimcilar`) are mirrored to `ls_*` keys for offline fallback. `at_adres_overrides` is localStorage-only.

### Authentication & roles
- **Yönetici (admin)** logs in with the hardcoded UI password `asis94`, which then signs in to Firebase Auth as `yonetici@asistakip.app`. Same string is used as the Firebase password.
- **Bakımcı (technician)** entries live in `bakimcilar` (loaded from `at_bakimcilar`). Each gets a synthetic email derived from a Turkish-character-folded version of `bakimci.ad` (`bakimci_<slug>@asistakip.app`). Personal password is stored on the bakımcı object as `sifre`; if missing, a deterministic `bakimci_<id>` fallback is used.
- Account creation is automatic: `firebaseLogin` falls back to `createUserWithEmailAndPassword` on `auth/user-not-found` or `auth/invalid-credential`. Be careful not to break this fallback when editing `firebase.js`.

### Automatic period closures
`App.jsx` contains effects (~line 732+) that run weekly and monthly closures (`yapHaftalikKapama`, `yapAylikKapama`). They use:
- a `kapamaTetiklendi` ref to prevent double-firing within a session,
- a `localStorage` flag `kapama_<key>` to prevent re-running before Firebase persists,
- and at month rollover, migrate each elevator's `yeniDevir` → `bakiyeDevir`.
Tread carefully here: bugs cause double-charging or skipped closures.

### Route planning (Google Maps deep links)
The block of `route*` helpers near the top of `App.jsx` (`normalizeRouteAddress`, `routeAddressKey`, `buildRouteGeocodeQueries`, `optimizeRouteWithMatrix`, `optimizeRoute`, `haversineKm`, etc.) builds optimized Google Maps URLs. There are two output URLs (`mapsUrl`, `mapsUrl2`) because Google Maps caps waypoints (`MAPS_MAX = 13`). Routing is currently text/order-based — earlier coordinate-based ordering was deliberately removed (see git log). Don't reintroduce CORS-blocked Google API calls from the browser.

### Domain model (key fields)
- `elev` — `{id, ad, semt, ilce, adres, yonetici, tel, bakimGunu, aylikUcret, kdv, bakiyeDevir, tip, kat, kapasite}`. Initial seed in `src/data/elevators.js` (`EXCEL_ELEVS`).
- `maint` — `{id, asansorId, tarih, tutar, planlanmis, yapildi, odendi, alinanTutar, kl, atananBakimci, ...}`. Status derives from booleans: `yapildi` ⇒ "tamam", `planlanmis && !yapildi` ⇒ "atandi", neither ⇒ "bekleyen". Use this same precedence everywhere (`durumEl` in `BakimAtamaPaneli.jsx`).
- `fault`, `task`, `sozlesme`, `hesapKayit`, `not`, `ekstraIs`, `muayene` — see App.jsx state declarations (~lines 555–602) for the canonical list.

### Shared UI primitives
`src/utils/constants.js` exports the design system: `Card`, `Modal`, `Stat`, `Badge`, `IlceBadge`, `IBtn`, `Tog`, `FF`, `AdresFF`, `FS`, `MahallePicker`, plus `S` (input/select styles) and the `KONTROL` checklist categories. **These components are written with `React.createElement` rather than JSX** — match that style when editing them. Other files use JSX freely.

Theming is driven by a `data-tema` attribute on `<html>` (`gece` / `yesil` / etc.) with CSS variables defined in `src/index.css`. The current theme is persisted to `localStorage['at_tema']`.

### Receipts
`src/utils/makbuz.js` exports `makbuzBakimYazdir(maint, elev)`, `makbuzEkstraYazdir(kayit, elev)`, and `ASIS_LOGO_B64` (a large base64-encoded PNG — don't try to read the whole file). Receipts are rendered to a new window for printing.

### PWA / Service Worker
`src/main.jsx` registers the SW via `virtual:pwa-register`, polls `registration.update()` every 60s, and reloads on `controllerchange` (guarded by `reloadingForUpdate`). The SW source is `public/sw.js` (Workbox: precache + a `CacheFirst` route for `cdn.sheetjs.com`). When changing PWA assets or behavior, bump anything that affects the precache manifest so clients pick up the update.

## Conventions
- **Turkish identifiers and UI strings.** Don't translate them.
- **var + function-keyword + nested IIFEs are common** in App.jsx. Don't refactor an entire block to modern syntax just to "clean up"; keep changes localized.
- **No new files unless necessary** — the project deliberately keeps things in a few large files. Prefer editing `App.jsx` / `constants.js` over creating new modules.
- **`.gitignore` only covers `node_modules/` and `dist/`.** Don't add build artifacts or local config to the repo.

# Baseline · Racket Lab

Build, tune and compare tennis racket setups, then record how they feel on court. Baseline also includes a match log, training plans and a local video journal.

[Open the production demo](https://tennis-app-phi.vercel.app/dashboard). The production URL can show the previous release until the pending changes are promoted.

The **Racket Lab screenshots** GitHub Actions run attaches a `racket-lab-screenshots` artifact with desktop and mobile PNGs from the production build.

## Features

- Estimate weight, balance and swingweight after adding mass.
- Save and compare setups, review sourced pro references and log court tests.
- Track matches and practice, plan training sessions and keep local video clips.
- Export or import JSON backups. Download video clips separately from the journal.

## Run locally

Use Node.js 24 and npm. The app requires no account or environment variables.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). To validate a change, run `npm test`, `npm run typecheck` and `npm run build`.

## Technology and data

Next.js App Router, React, TypeScript and CSS/Tailwind. Records stay in browser storage. Video clips use IndexedDB. See [architecture](ARCHITECTURE.md) for the data flow and [changelog](CHANGELOG.md) for release notes.

| Player | Report year | Source |
| --- | --- | --- |
| Carlos Alcaraz | 2025 | [Tennisnerd](https://www.tennisnerd.net/gear/racquets/pro-player-racquets/carlos-alcaraz-racquet/26903) |
| Roger Federer | 2018 | [Tennisnerd](https://www.tennisnerd.net/gear/racquets/pro-player-racquets/roger-federers-racquet-2/3065) |
| Novak Djokovic | 2022 | [Tennisnerd](https://www.tennisnerd.net/gear/racquets/pro-player-racquets/does-the-best-player-use-the-best-racquet/27743) |
| Rafael Nadal | 2026 | [Tennisnerd](https://www.tennisnerd.net/gear/racquets/pro-player-racquets/rafa-nadals-racquet-player-profile/66028) |
| Jannik Sinner | 2026 | [Tennisnerd](https://www.tennisnerd.net/gear/racquets/pro-player-racquets/jannik-sinners-racquet/23204) |
| Aryna Sabalenka | 2026 | [Tennisnerd](https://www.tennisnerd.net/gear/racquets/pro-player-racquets/aryna-sabalenkas-racquet/24697) |

The table uses report years. Playing seasons and specifications are not independently verified. Baseline has no affiliation with any brand. The [Tennis Warehouse University customization worksheet](https://twu.tennis-warehouse.com/learning_center/customizationReverse.php) describes the point mass approach used for customization estimates.

## Limitations

- Estimates depend on your starting measurements and where you place the added mass. Unknown starting swingweight stays unknown. Differences between strung and unstrung setups are hidden.
- Data stays in the current browser and site origin. Clearing site data removes it. Backups do not include video files or synchronize between devices.
- Setup links include the name and specs. Anyone with a link can read that information.
- Video playback and recording depend on browser support.

[MIT License](LICENSE)

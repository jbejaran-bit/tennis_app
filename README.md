# Baseline — Your Game, in Focus

A tennis workspace for racket customization, match reflection, deliberate practice and video review. Built with Next.js, React and TypeScript.

## Run locally

```sh
npm ci
npm run dev
```

The dashboard and landing page work without an account. For the existing Supabase sign-in and cloud recordings, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Those values are also required to prerender the existing auth pages during `npm run build`. Never commit secrets.

## What works

- **Overview:** real logged match totals, recent form, practice minutes, most recently saved setup and quick actions.
- **Racket Lab:** editable starting weight, balance, length and optional swingweight; added mass at racket locations; string and grip additions; setup saving, copying, comparison and export.
- **Match log:** add/edit matches with optional stats, search/filter, notes, equipment and next-practice focus. Original sample matches are preserved but excluded from personal totals. No fabricated AI diagnosis.
- **Training and playbook:** solo, wall and partner drills with targets, session structure, practice journal and written tactical guides.
- **Video journal:** add clips up to 150 MB, local recording, slow playback, notes and downloads. Authenticated existing cloud clips are queried by user and have a retry state.
- **Backup:** export/import matches, practice sessions and setups as versioned JSON. Import merges by ID and keeps existing entries. Videos are downloaded separately.

## Storage and estimates

Logs and setups use browser localStorage. Videos use IndexedDB. These are device/browser-specific, not account-synchronized. Cloud recordings remain accessible to their signed-in owner when Supabase is available. Export backups before clearing browser data.

Racket catalog weights and balances are editable **unstrung starter estimates** retained from the original app; check the exact model/year and your own frame. The calculator uses center-of-mass balance and point-mass swingweight additions around a 10 cm axis. For unknown starting swingweight, only the change is reported. Never mix a strung swingweight with unstrung weight/balance. String and grip distributions are approximations, not machine measurements. See [Tennis Warehouse University's customization worksheet](https://twu.tennis-warehouse.com/learning_center/customizationReverse.php).

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests cover mass/balance calculations, swingweight units and axis, unknown baselines, custom lengths, stat validation, missing values and exclusion of legacy sample matches.

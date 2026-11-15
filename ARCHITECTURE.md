# Architecture

Next.js serves the workspace at `/dashboard`. The root redirects there. The dashboard is a React client component. URL fragments select workspace views and can carry explicitly shared racket configurations.

- `components/RacquetLab.tsx` manages the working draft and coordinates comparison, customization, saved setups and court tests.
- `lib/baseline/racquet.ts` validates specifications and calculates weight, balance and swingweight. `pro-specs.ts` holds sourced reference values and checks whether measurement conditions match.
- `lib/baseline/storage.ts` and `useLocalData.ts` store records in localStorage. `backup.ts` validates and merges imports. `videos.ts` uses IndexedDB for video clips.
- Backup files are selected by the user and validated in the browser before import. Shared setups omit notes. There is no account service or application database.

GitHub Actions runs unit and interaction tests, TypeScript and the production build. The existing Vercel integration builds a preview from the PR branch. Production follows `main`.

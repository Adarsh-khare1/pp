# Codefolio handover

## September 2026 product update

The workspace now has a real daily operating-system layer in addition to the developer profile:

- Home is a non-repeating command center. Coding totals, ratings, topic coverage, and submissions live only in **Coding dashboard**.
- Goals are editable. Habits and bad-habit trackers use a clickable 28-day calendar.
- Reminders are stored and announced in-app, by browser notification (after permission), and with speech while the app is open.
- The floating `JarvisAssistant` supports text/voice commands for navigation, adding goals/habits, scheduling reminders, and daily briefings.
- User-owned workspace state is persisted through `GET/PUT /api/workspace` into Cloudflare D1, with localStorage as an offline fallback.
- The app ships a web manifest and responsive layouts at 390px, 768px, and desktop widths. Native background alarms/push will still require a mobile runtime or push service in a later phase.

Database setup after a fresh clone:

```powershell
npm run db:generate
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_careful_ben_grimm.sql
```

New key files are `components/JarvisAssistant.tsx`, `app/api/workspace/route.ts`, `db/schema.ts`, and `public/manifest.webmanifest`.

## Project and intent

This is Adarsh Khare's personal developer dashboard, **Codefolio**. The visual direction is a dark, black/navy developer workspace with purple and lime accents. The user wants real profile data shown in the UI rather than resume-derived or placeholder values:

- LeetCode: solved counts and recent accepted submissions
- Codeforces: rating, rank, and recent accepted submissions
- GitHub: repository count, current/active projects, and repository activity

The primary workspace is this folder. The GitHub remote is `https://github.com/Adarsh-khare1/pp.git` on `main`.

## Run locally

```powershell
npm run build
npm run start
```

The local preview is expected at `http://127.0.0.1:8787`.

Useful checks:

```powershell
npm run lint
Invoke-RestMethod http://127.0.0.1:8787/api/profile | ConvertTo-Json -Depth 6
```

## Important files

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Entire client dashboard: navigation, overview, problem journal, projects, goals, portfolio, resume, and settings. |
| `app/globals.css` | Responsive dark-theme styling and animated hero. |
| `app/api/profile/route.ts` | Server route that aggregates the three public platforms into one browser-safe response. |

## Live-data architecture

The browser calls only `GET /api/profile`. The server route fetches the source platforms in parallel, maps them to the dashboard's `Project`, `Problem`, and stats shapes, and returns partial data when one source fails.

Configured profile handles:

| Platform | Handle | Data now used |
| --- | --- | --- |
| GitHub | `Adarsh-khare1` | followers, public repositories, recent non-fork/non-archived repositories, last push, stars/forks, homepage URL |
| Codeforces | `adarsh269` | rating/rank/max rating plus latest unique accepted submissions from the latest 200 submissions |
| LeetCode | `adarsh2028` | total/easy/medium/hard solved counts plus latest accepted submissions |

### Source details and caveats

- GitHub uses the public REST API directly.
- Codeforces uses its public API. The route intentionally waits a little over two seconds between `user.info` and `user.status` to respect Codeforces' documented request limit.
- LeetCode has no stable public REST profile endpoint available here. The route currently uses the public `alfaarghya/alfa-leetcode-api` bridge for `solved` and `acSubmission` data. If it becomes unavailable, the UI must still show GitHub and Codeforces and list the LeetCode failure in Settings.
- The API response is cached for two minutes with stale-while-revalidate. The **Sync profiles** / **Refresh now** button appends a timestamp and requests fresh data.

## Data ownership rules

1. Live platform records are never written to localStorage.
2. Only records added by the user in the UI are persisted under `codefolio-manual-v3` and marked `source: "Manual"`.
3. The old `codefolio-data` demo cache is deliberately ignored, so stale fake journal entries cannot return.
4. Live problem entries link to their source platform; only manual rows expose a delete control.
5. GitHub repositories are live project cards. Their status is `Active` when pushed within 120 days; otherwise `Maintained`.

## Current implementation state

TypeScript, ESLint, the production build, D1 persistence, and browser breakpoints were verified during the Jarvis update. Continue to preserve truthful partial platform failures and keep personal planning data separate from live coding-platform records.

## Product behavior to preserve

- Black/navy shaded background; avoid light/pink page backgrounds.
- Keep the animated Code → Build → Ship hero from the prior redesign.
- Responsive behavior needs a collapsed/usable narrow mobile layout; do not let the fixed sidebar or command bar cover content.
- Problem journal should show actual recent accepted submissions, searchable by title/topic/platform.
- Projects should show actual GitHub repository data and open real repository/homepage links.
- The user can still add manual projects/problems, but these must be visually and logically separate from live platform records.

## Git status at handover

Expected in-progress edits:

- modified: `app/page.tsx`
- new: `app/api/profile/route.ts`
- new: `ANTIGRAVITY_HANDOVER.md`

Review the diff rather than discarding it. Previous redesign work was already committed as `c3e7453` (`Create animated Code Build Ship hero`).

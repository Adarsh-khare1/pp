# Codefolio handover

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

The live-data route and client integration have been added, but the worktree was handed over before final verification and before the corresponding CSS cleanup. Please complete these items before considering it done:

1. Run `npm run lint` and `npm run build`; repair any TypeScript, lint, or Cloudflare/Vinext compatibility errors.
2. Finish CSS support in `app/globals.css` for the new markup:
   - `.links a` should look like the former `.links button`.
   - source links in journal/activity rows should be visible and inherit the dark theme.
   - add styles for `.empty-row`, `.sync-status`, and `.source-error`.
   - a `Solved` pill needs a sensible status color.
3. Start the local preview and inspect `/api/profile` plus the Overview, Problem journal, Projects, and Settings screens in desktop and mobile widths.
4. Ensure zero/partial failures are truthful: no fake rating, fake solved count, fake project, or fake journal entry should appear.
5. Commit and push the completed work to `main` after verifying it.

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

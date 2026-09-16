const HANDLES = {
  github: "Adarsh-khare1",
  codeforces: "adarsh269",
  leetcode: "adarsh2028",
} as const;

type GithubUser = { followers?: number; public_repos?: number };
type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
};
type CodeforcesUser = { rating?: number; rank?: string; maxRating?: number };
type CodeforcesSubmission = {
  id: number;
  creationTimeSeconds: number;
  verdict?: string;
  problem: {
    contestId?: number;
    index?: string;
    name: string;
    rating?: number;
    tags?: string[];
  };
};
type LeetCodeSolved = {
  solvedProblem?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
};
type LeetCodeSubmission = {
  title: string;
  titleSlug: string;
  timestamp: string;
  lang?: string;
};
type CodeforcesContest = {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
};
export type UpsolveProblem = {
  id: string;
  title: string;
  contestId: number;
  index: string;
  rating?: number;
  tags: string[];
  verdict: string;
  date: string;
  url: string;
};
export type UpcomingContest = {
  id: number;
  name: string;
  type: string;
  durationSeconds: number;
  relativeTimeSeconds: number;
  startTime: string;
  url: string;
};
export type LeetCodeDaily = {
  title: string;
  difficulty: string;
  url: string;
  date: string;
  tags: string[];
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("User-Agent", "Codefolio/1.0");
  const response = await fetch(url, {
    ...init,
    headers,
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok)
    throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.json() as Promise<T>;
}

const dateFromSeconds = (seconds: number | string) =>
  new Date(Number(seconds) * 1000).toISOString().slice(0, 10);

function ratingDifficulty(rating?: number) {
  if (!rating || rating <= 1200) return "Easy";
  if (rating <= 1800) return "Medium";
  return "Hard";
}

export async function GET() {
  const errors: string[] = [];
  let github = { followers: 0, repos: 0 };
  let codeforces = { rating: 0, rank: "unrated", maxRating: 0, solved: 0 };
  let leetcode = { solved: 0, easy: 0, medium: 0, hard: 0 };
  let projects: Array<Record<string, unknown>> = [];
  const problems: Array<Record<string, unknown>> = [];
  let contests: UpcomingContest[] = [];
  let upsolvingQueue: UpsolveProblem[] = [];

  const githubTask = (async () => {
    const [user, repos] = await Promise.all([
      getJson<GithubUser>(`https://api.github.com/users/${HANDLES.github}`),
      getJson<GithubRepo[]>(
        `https://api.github.com/users/${HANDLES.github}/repos?type=owner&sort=pushed&direction=desc&per_page=100`,
      ),
    ]);
    const visible = repos.filter((repo) => !repo.fork && !repo.archived);
    github = {
      followers: user.followers ?? 0,
      repos: user.public_repos ?? visible.length,
    };
    projects = visible.slice(0, 9).map((repo) => {
      const daysSincePush = Math.floor(
        (Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000,
      );
      const stack =
        [repo.language, ...(repo.topics ?? []).slice(0, 4)]
          .filter(Boolean)
          .join(", ") || "Repository";
      return {
        id: repo.id,
        name: repo.name,
        summary: repo.description || "Public GitHub project",
        stack,
        status: daysSincePush <= 120 ? "Active" : "Maintained",
        progress: daysSincePush <= 30 ? 90 : daysSincePush <= 120 ? 72 : 55,
        repo: repo.html_url,
        demo: repo.homepage || "",
        changelog: [
          `Last pushed ${new Date(repo.pushed_at).toLocaleDateString("en-IN")}`,
          `${repo.stargazers_count} stars · ${repo.forks_count} forks`,
        ],
        public: true,
        source: "GitHub",
      };
    });
  })().catch((error: unknown) =>
    errors.push(
      `GitHub: ${error instanceof Error ? error.message : "unavailable"}`,
    ),
  );

  const leetcodeTask = (async () => {
    const base = `https://alfa-leetcode-api.onrender.com/${HANDLES.leetcode}`;
    const [solved, recent] = await Promise.all([
      getJson<LeetCodeSolved>(`${base}/solved`),
      getJson<{ submission?: LeetCodeSubmission[] }>(
        `${base}/acSubmission?limit=20`,
      ),
    ]);
    leetcode = {
      solved: solved.solvedProblem ?? 0,
      easy: solved.easySolved ?? 0,
      medium: solved.mediumSolved ?? 0,
      hard: solved.hardSolved ?? 0,
    };
    for (const submission of recent.submission ?? []) {
      problems.push({
        id: `lc-${submission.titleSlug}-${submission.timestamp}`,
        title: submission.title,
        platform: "LeetCode",
        topic: submission.lang ? submission.lang.toUpperCase() : "Algorithm",
        difficulty: "Solved",
        date: dateFromSeconds(submission.timestamp),
        notes: `Accepted on LeetCode · ${submission.lang || "language unavailable"}`,
        revise: false,
        source: "LeetCode",
        url: `https://leetcode.com/problems/${submission.titleSlug}/`,
      });
    }
  })().catch((error: unknown) =>
    errors.push(
      `LeetCode: ${error instanceof Error ? error.message : "unavailable"}`,
    ),
  );

  const codeforcesTask = (async () => {
    const info = await getJson<{ status: string; result?: CodeforcesUser[] }>(
      `https://codeforces.com/api/user.info?handles=${HANDLES.codeforces}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2100));
    const status = await getJson<{
      status: string;
      result?: CodeforcesSubmission[];
    }>(
      `https://codeforces.com/api/user.status?handle=${HANDLES.codeforces}&from=1&count=200`,
    );
    const user = info.result?.[0] ?? {};
    const submissions = status.result ?? [];
    const accepted = submissions.filter(
      (submission) => submission.verdict === "OK",
    );
    const unique = new Map<string, CodeforcesSubmission>();
    const solvedKeys = new Set<string>();
    for (const submission of accepted) {
      const key = `${submission.problem.contestId ?? "practice"}-${submission.problem.index ?? submission.problem.name}`;
      solvedKeys.add(key);
      if (!unique.has(key)) unique.set(key, submission);
    }
    codeforces = {
      rating: user.rating ?? 0,
      rank: user.rank ?? "unrated",
      maxRating: user.maxRating ?? 0,
      solved: unique.size,
    };
    for (const submission of [...unique.values()].slice(0, 20)) {
      const contestId = submission.problem.contestId;
      problems.push({
        id: `cf-${submission.id}`,
        title: submission.problem.name,
        platform: "Codeforces",
        topic: submission.problem.tags?.[0] || "Competitive programming",
        difficulty: ratingDifficulty(submission.problem.rating),
        date: dateFromSeconds(submission.creationTimeSeconds),
        notes: `Accepted on Codeforces${submission.problem.rating ? ` · rating ${submission.problem.rating}` : ""}`,
        revise: false,
        source: "Codeforces",
        url: contestId
          ? `https://codeforces.com/problemset/problem/${contestId}/${submission.problem.index}`
          : "https://codeforces.com/submissions/adarsh269",
      });
    }

    // Compute Upsolving Queue: problems attempted (non-OK) that have not been solved yet
    const upsolveMap = new Map<string, UpsolveProblem>();
    for (const sub of submissions) {
      if (sub.verdict && sub.verdict !== "OK" && sub.problem.contestId) {
        const key = `${sub.problem.contestId}-${sub.problem.index ?? sub.problem.name}`;
        if (!solvedKeys.has(key) && !upsolveMap.has(key)) {
          upsolveMap.set(key, {
            id: `cf-upsolve-${sub.id}`,
            title: sub.problem.name,
            contestId: sub.problem.contestId,
            index: sub.problem.index || "A",
            rating: sub.problem.rating,
            tags:
              sub.problem.tags && sub.problem.tags.length
                ? sub.problem.tags
                : ["competitive programming"],
            verdict: sub.verdict.replace(/_/g, " "),
            date: dateFromSeconds(sub.creationTimeSeconds),
            url: `https://codeforces.com/contest/${sub.problem.contestId}/problem/${sub.problem.index || "A"}`,
          });
        }
      }
    }
    upsolvingQueue = [...upsolveMap.values()].slice(0, 10);
  })().catch((error: unknown) =>
    errors.push(
      `Codeforces: ${error instanceof Error ? error.message : "unavailable"}`,
    ),
  );

  const contestTask = (async () => {
    const data = await getJson<{
      status: string;
      result?: CodeforcesContest[];
    }>("https://codeforces.com/api/contest.list?gym=false");
    if (data.result) {
      const upcoming = data.result
        .filter((c) => c.phase === "BEFORE" && (c.relativeTimeSeconds ?? 0) < 0)
        .sort(
          (a, b) => (b.relativeTimeSeconds ?? 0) - (a.relativeTimeSeconds ?? 0),
        )
        .slice(0, 4);

      contests = upcoming.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        durationSeconds: c.durationSeconds,
        relativeTimeSeconds: Math.abs(c.relativeTimeSeconds || 0),
        startTime: c.startTimeSeconds
          ? new Date(c.startTimeSeconds * 1000).toISOString()
          : "",
        url: `https://codeforces.com/contestRegistration/${c.id}`,
      }));
    }
  })().catch((error: unknown) =>
    errors.push(
      `Contests: ${error instanceof Error ? error.message : "unavailable"}`,
    ),
  );

  let dailyChallenge: LeetCodeDaily | null = null;
  const dailyTask = (async () => {
    const daily = await getJson<{
      questionTitle?: string;
      difficulty?: string;
      questionLink?: string;
      date?: string;
      topicTags?: Array<{ name: string }>;
    }>("https://alfa-leetcode-api.onrender.com/daily");
    if (daily && daily.questionTitle) {
      dailyChallenge = {
        title: daily.questionTitle,
        difficulty: daily.difficulty || "Medium",
        url: daily.questionLink || "https://leetcode.com/problemset/",
        date: daily.date || new Date().toISOString().slice(0, 10),
        tags: (daily.topicTags || []).map((t) => t.name),
      };
    }
  })().catch((error: unknown) =>
    errors.push(
      `LeetCode Daily: ${error instanceof Error ? error.message : "unavailable"}`,
    ),
  );

  await Promise.all([githubTask, leetcodeTask, codeforcesTask, contestTask, dailyTask]);
  problems.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return Response.json(
    {
      handles: HANDLES,
      stats: {
        github,
        codeforces,
        leetcode,
        activeProjects: projects.filter(
          (project) => project.status === "Active",
        ).length,
      },
      projects,
      problems,
      contests,
      upsolvingQueue,
      dailyChallenge,
      errors,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
      },
    },
  );
}

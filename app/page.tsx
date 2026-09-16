"use client";
import { useEffect, useState } from "react";
import PortfolioAdmin from "@/components/PortfolioAdmin";
import JarvisAssistant from "@/components/JarvisAssistant";
import {
  defaultPortfolioConfig,
  PortfolioConfig,
  readPortfolioConfig,
} from "@/lib/portfolio-config";
import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  Trash2,
} from "lucide-react";

type Problem = {
  id: number | string;
  title: string;
  platform: string;
  topic: string;
  difficulty: string;
  date: string;
  notes: string;
  revise: boolean;
  source?: string;
  url?: string;
};
type Project = {
  id: number | string;
  name: string;
  summary: string;
  stack: string;
  status: string;
  progress: number;
  repo: string;
  demo: string;
  changelog: string[];
  public: boolean;
  source?: string;
};
type Goal = { id: number; title: string; target: number; done: number };
type Habit = {
  id: number;
  title: string;
  kind: "build" | "break";
  streak: number;
  doneToday: boolean;
  history: string[];
};
type UpcomingContest = {
  id: number;
  name: string;
  type: string;
  durationSeconds: number;
  relativeTimeSeconds: number;
  startTime: string;
  url: string;
};
type UpsolveProblem = {
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
type Stats = {
  github: number;
  repos: number;
  cf: number;
  rank: string;
  cfSolved: number;
  cfMax: number;
  leetcode: number;
  leetcodeEasy: number;
  leetcodeMedium: number;
  leetcodeHard: number;
  activeProjects: number;
};
type LiveProfile = {
  stats: {
    github: { followers: number; repos: number };
    codeforces: {
      rating: number;
      rank: string;
      maxRating: number;
      solved: number;
    };
    leetcode: { solved: number; easy: number; medium: number; hard: number };
    activeProjects: number;
  };
  projects: Project[];
  problems: Problem[];
  contests?: UpcomingContest[];
  upsolvingQueue?: UpsolveProblem[];
  errors: string[];
  updatedAt: string;
};
const emptyStats: Stats = {
  github: 0,
  repos: 0,
  cf: 0,
  rank: "loading",
  cfSolved: 0,
  cfMax: 0,
  leetcode: 0,
  leetcodeEasy: 0,
  leetcodeMedium: 0,
  leetcodeHard: 0,
  activeProjects: 0,
};
const goalsSeed: Goal[] = [
  { id: 1, title: "Solve 50 DSA problems", target: 50, done: 18 },
  { id: 2, title: "Reach Codeforces Expert", target: 1600, done: 1437 },
  { id: 3, title: "Ship one project", target: 1, done: 1 },
];
const habitsSeed: Habit[] = [
  {
    id: 1,
    title: "Code with full focus",
    kind: "build",
    streak: 0,
    doneToday: false,
    history: [],
  },
  {
    id: 2,
    title: "Exercise for 30 minutes",
    kind: "build",
    streak: 0,
    doneToday: false,
    history: [],
  },
  {
    id: 3,
    title: "Avoid mindless scrolling",
    kind: "break",
    streak: 0,
    doneToday: false,
    history: [],
  },
];
const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "journal", label: "Coding dashboard", icon: BookOpen },
  { id: "projects", label: "Projects", icon: BriefcaseBusiness },
  { id: "goals", label: "Goals & habits", icon: Target },
  { id: "portfolio", label: "Portfolio", icon: Globe2 },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];
const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const normalizeHabits = (items: Habit[]) =>
  items.map((habit) => ({
    ...habit,
    history: habit.history || (habit.doneToday ? [dateKey()] : []),
  }));

function formatCountdown(relativeSeconds: number) {
  if (relativeSeconds <= 0) return "Starting soon";
  const days = Math.floor(relativeSeconds / 86400);
  const hours = Math.floor((relativeSeconds % 86400) / 3600);
  const minutes = Math.floor((relativeSeconds % 3600) / 60);
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function getProblemHint(tags: string[], rating?: number) {
  const t = tags.map((x) => x.toLowerCase());
  let intuition =
    "Look for invariants, monotonic properties, or small constraints that enable greedy or DP choices.";
  let dataStructure = "Standard array, prefix sums, or frequency hash maps.";
  let edgeCase =
    "Check single-element arrays, extreme bounds (integer overflow), and boundary zeroes.";

  if (t.includes("binary search")) {
    intuition =
      "Can you rephrase the question as a monotonic predicate check(mid) and binary search the answer range?";
    dataStructure = "Binary search over answer range [low, high].";
    edgeCase =
      "Carefully compute mid = low + (high - low) / 2 to avoid integer overflow.";
  } else if (t.includes("dp")) {
    intuition =
      "Define DP[i] as the optimal solution for prefix i, and consider which state transition determines DP[i].";
    dataStructure =
      "1D/2D memoization table or rolling variables for space optimization.";
    edgeCase = "Base cases: DP[0] or empty prefix. Watch for negative values.";
  } else if (t.includes("greedy")) {
    intuition =
      "Sort elements by a key metric (e.g. deadline, ratio, or value) and prove that local optimal choice never hurts global.";
    dataStructure = "Priority Queue (Heap) or Sorted Array with two pointers.";
    edgeCase =
      "Ties in sorting order. Ensure tie-breakers don't invert the invariant.";
  } else if (t.includes("data structures")) {
    intuition =
      "Maintain prefix sums, frequency buckets, or monotonic stacks to answer range queries efficiently.";
    dataStructure = "Monotonic Stack, Fenwick Tree, or Segment Tree.";
    edgeCase = "1-based vs 0-based indexing and updates at boundary indices.";
  } else if (t.includes("math") || t.includes("number theory")) {
    intuition =
      "Analyze parity, modular arithmetic, gcd/lcm properties, or prime factorizations.";
    dataStructure = "Sieve of Eratosthenes or Euclidean algorithm.";
    edgeCase =
      "0 and 1 as inputs; modulo reduction at every multiplication step to avoid overflow.";
  }

  return {
    intuition,
    complexity:
      rating && rating >= 1600 ? "O(N log N) or O(N)" : "O(N) or O(N log N)",
    dataStructure,
    edgeCase,
  };
}

export default function Home() {
  const [view, setView] = useState("overview"),
    [problems, setProblems] = useState<Problem[]>([]),
    [projects, setProjects] = useState<Project[]>([]),
    [contests, setContests] = useState<UpcomingContest[]>([]),
    [upsolvingQueue, setUpsolvingQueue] = useState<UpsolveProblem[]>([]),
    [expandedHintId, setExpandedHintId] = useState<string | null>(null),
    [goals, setGoals] = useState<Goal[]>(goalsSeed),
    [habits, setHabits] = useState<Habit[]>(habitsSeed),
    [reminders, setReminders] = useState<Reminder[]>([]),
    [workspaceReady, setWorkspaceReady] = useState(false),
    [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig>(
      defaultPortfolioConfig,
    ),
    [query, setQuery] = useState(""),
    [privacy, setPrivacy] = useState(true),
    [toast, setToast] = useState(""),
    [stats, setStats] = useState<Stats>(emptyStats),
    [sourceErrors, setSourceErrors] = useState<string[]>([]),
    [updatedAt, setUpdatedAt] = useState(""),
    [goalForm, setGoalForm] = useState({ title: "", target: "" }),
    [habitForm, setHabitForm] = useState({
      title: "",
      kind: "build" as "build" | "break",
    }),
    [reminderForm, setReminderForm] = useState({ title: "", remindAt: "" }),
    [projectForm, setProjectForm] = useState({ name: "", summary: "" });
  const applyLive = (
    data: LiveProfile,
    manualProblems: Problem[] = problems.filter((p) => p.source === "Manual"),
    manualProjects: Project[] = projects.filter((p) => p.source === "Manual"),
  ) => {
    setProblems([...manualProblems, ...data.problems]);
    setProjects([...manualProjects, ...data.projects]);
    if (data.contests) setContests(data.contests);
    if (data.upsolvingQueue) setUpsolvingQueue(data.upsolvingQueue);
    setStats({
      github: data.stats.github.followers,
      repos: data.stats.github.repos,
      cf: data.stats.codeforces.rating,
      rank: data.stats.codeforces.rank,
      cfSolved: data.stats.codeforces.solved,
      cfMax: data.stats.codeforces.maxRating,
      leetcode: data.stats.leetcode.solved,
      leetcodeEasy: data.stats.leetcode.easy,
      leetcodeMedium: data.stats.leetcode.medium,
      leetcodeHard: data.stats.leetcode.hard,
      activeProjects: data.stats.activeProjects,
    });
    setSourceErrors(data.errors || []);
    setUpdatedAt(data.updatedAt);
  };
  useEffect(() => {
    const timer = window.setTimeout(
      () => setPortfolioConfig(readPortfolioConfig()),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      let manualProblems: Problem[] = [];
      let manualProjects: Project[] = [];
      let savedGoals = goalsSeed;
      let savedHabits = habitsSeed;
      let savedReminders: Reminder[] = [];
      let savedConfig = readPortfolioConfig();
      try {
        const saved = localStorage.getItem("codefolio-manual-v3");
        if (saved) {
          const x = JSON.parse(saved);
          manualProblems = (x.problems || []).filter(
            (p: Problem) => p.source === "Manual",
          );
          manualProjects = (x.projects || []).filter(
            (p: Project) => p.source === "Manual",
          );
          savedGoals = x.goals || goalsSeed;
          savedHabits = normalizeHabits(x.habits || habitsSeed);
          savedReminders = x.reminders || [];
          savedConfig = x.portfolioConfig || savedConfig;
        }
      } catch {}
      try {
        const workspaceResponse = await fetch("/api/workspace", {
          cache: "no-store",
        });
        const workspace = (await workspaceResponse.json()) as {
          data?: {
            problems?: Problem[];
            projects?: Project[];
            goals?: Goal[];
            habits?: Habit[];
            reminders?: Reminder[];
            portfolioConfig?: PortfolioConfig;
          };
        };
        if (workspace.data) {
          const x = workspace.data;
          manualProblems = (x.problems || []).filter(
            (p: Problem) => p.source === "Manual",
          );
          manualProjects = (x.projects || []).filter(
            (p: Project) => p.source === "Manual",
          );
          savedGoals = x.goals || goalsSeed;
          savedHabits = normalizeHabits(x.habits || habitsSeed);
          savedReminders = x.reminders || [];
          savedConfig = x.portfolioConfig || savedConfig;
        }
      } catch {}
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok)
          throw new Error(`Profile service returned ${response.status}`);
        const data = (await response.json()) as LiveProfile;
        if (active) applyLive(data, manualProblems, manualProjects);
      } catch (error) {
        if (active) {
          setProblems(manualProblems);
          setProjects(manualProjects);
          setSourceErrors([
            error instanceof Error
              ? error.message
              : "Live profiles unavailable",
          ]);
        }
      }
      if (active) setGoals(savedGoals);
      if (active) setHabits(savedHabits);
      if (active) setReminders(savedReminders);
      if (active) setPortfolioConfig(savedConfig);
      if (active) setWorkspaceReady(true);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!workspaceReady) return;
    const data = {
      problems: problems.filter((p) => p.source === "Manual"),
      projects: projects.filter((p) => p.source === "Manual"),
      goals,
      habits,
      reminders,
      portfolioConfig,
    };
    localStorage.setItem("codefolio-manual-v3", JSON.stringify(data));
    const timer = window.setTimeout(
      () =>
        fetch("/api/workspace", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        }).catch(() => undefined),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [
    problems,
    projects,
    goals,
    habits,
    reminders,
    portfolioConfig,
    workspaceReady,
  ]);
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2600);
  };
  const addGoal = () => {
    const target = Number(goalForm.target);
    if (!goalForm.title.trim() || !target) return;
    setGoals((items) => [
      ...items,
      { id: Date.now(), title: goalForm.title.trim(), target, done: 0 },
    ]);
    setGoalForm({ title: "", target: "" });
    notify("Goal added");
  };
  const addHabit = () => {
    if (!habitForm.title.trim()) return;
    setHabits((items) => [
      ...items,
      {
        id: Date.now(),
        title: habitForm.title.trim(),
        kind: habitForm.kind,
        streak: 0,
        doneToday: false,
        history: [],
      },
    ]);
    setHabitForm({ ...habitForm, title: "" });
    notify(
      habitForm.kind === "build" ? "Habit added" : "Bad-habit tracker added",
    );
  };
  const toggleHabitDate = (id: number, day = dateKey()) =>
    setHabits((items) =>
      items.map((habit) => {
        if (habit.id !== id) return habit;
        const history = habit.history || [];
        const exists = history.includes(day);
        const next = exists
          ? history.filter((item) => item !== day)
          : [...history, day];
        return {
          ...habit,
          history: next,
          doneToday: next.includes(dateKey()),
          streak: next.length,
        };
      }),
    );
  const addReminder = () => {
    if (!reminderForm.title.trim() || !reminderForm.remindAt) return;
    setReminders((items) => [
      ...items,
      {
        id: Date.now(),
        title: reminderForm.title.trim(),
        remindAt: new Date(reminderForm.remindAt).toISOString(),
        completed: false,
      },
    ]);
    setReminderForm({ title: "", remindAt: "" });
    notify("Reminder scheduled");
  };
  useEffect(() => {
    if (!workspaceReady) return;
    const check = () =>
      setReminders((items) =>
        items.map((reminder) => {
          if (
            reminder.completed ||
            reminder.notified ||
            new Date(reminder.remindAt).getTime() > Date.now()
          )
            return reminder;
          notify(`Reminder: ${reminder.title}`);
          if ("Notification" in window && Notification.permission === "granted")
            new Notification("Jarvis reminder", { body: reminder.title });
          if ("speechSynthesis" in window)
            window.speechSynthesis.speak(
              new SpeechSynthesisUtterance(`Reminder. ${reminder.title}`),
            );
          return { ...reminder, notified: true };
        }),
      );
    check();
    const timer = window.setInterval(check, 30000);
    return () => window.clearInterval(timer);
  }, [workspaceReady]);
  const addProject = () => {
    if (!projectForm.name.trim()) return;
    setProjects((p) => [
      {
        id: `manual-${Date.now()}`,
        name: projectForm.name,
        summary: projectForm.summary || "New project",
        stack: "Add stack",
        status: "In progress",
        progress: 10,
        repo: "",
        demo: "",
        changelog: ["Project created"],
        public: true,
        source: "Manual",
      },
      ...p,
    ]);
    setProjectForm({ name: "", summary: "" });
    notify("Project added");
  };
  const exportData = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            profile: { name: "Adarsh Khare", role: "Full Stack Developer" },
            problems,
            projects,
            goals,
            habits,
            reminders,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "adarsh-codefolio-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const filtered = problems.filter((p) =>
    (p.title + p.topic + p.platform)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const title = nav.find((n) => n.id === view)?.label || "Overview";
  return (
    <main className="shell">
      <aside className="side">
        <div className="brand">
          <span>AK</span>
          <div>
            <b>Codefolio</b>
            <small>Developer OS</small>
          </div>
        </div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "nav active" : "nav"}
              onClick={() => setView(n.id)}
            >
              <n.icon size={18} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="avatar">AK</div>
          <div>
            <b>Adarsh Khare</b>
            <small>Full Stack Developer</small>
          </div>
        </div>
      </aside>
      <section className={`main view-${view}`}>
        <header>
          <div>
            <p className="kicker">PERSONAL DEVELOPER WORKSPACE</p>
            <h1>{title}</h1>
          </div>
          <div className="live-source">
            <span />
            Live data updates automatically
          </div>
        </header>
        {toast && <div className="toast">{toast}</div>}
        {view === "overview" && (
          <Overview
            projects={projects}
            goals={goals}
            habits={habits}
            reminders={reminders}
            contests={contests}
            setView={setView}
          />
        )}{" "}
        {view === "journal" && (
          <section className="stack">
            <div className="coding-stats">
              <article>
                <span>LeetCode</span>
                <b>{stats.leetcode}</b>
                <small>Total solved</small>
                <div className="difficulty-line">
                  <i
                    style={{
                      width: `${stats.leetcode ? (stats.leetcodeEasy / stats.leetcode) * 100 : 0}%`,
                    }}
                  />
                  <i
                    style={{
                      width: `${stats.leetcode ? (stats.leetcodeMedium / stats.leetcode) * 100 : 0}%`,
                    }}
                  />
                  <i
                    style={{
                      width: `${stats.leetcode ? (stats.leetcodeHard / stats.leetcode) * 100 : 0}%`,
                    }}
                  />
                </div>
              </article>
              <article>
                <span>Codeforces</span>
                <b>{stats.cf || "—"}</b>
                <small className="capitalize">
                  {stats.rank} · max {stats.cfMax || "—"}
                </small>
                <strong>{stats.cfSolved} recent unique solves</strong>
              </article>
              <article>
                <span>Activity feed</span>
                <b>{problems.length}</b>
                <small>Recent accepted submissions</small>
                <strong>
                  {new Set(problems.map((p) => p.topic)).size} topics
                  represented
                </strong>
              </article>
            </div>
            <div className="coding-breakdown">
              <Panel title="LeetCode difficulty" eyebrow="PROBLEM MIX">
                <div className="difficulty-row easy">
                  <span>Easy</span>
                  <b>{stats.leetcodeEasy}</b>
                  <i>
                    <em
                      style={{
                        width: `${stats.leetcode ? (stats.leetcodeEasy / stats.leetcode) * 100 : 0}%`,
                      }}
                    />
                  </i>
                </div>
                <div className="difficulty-row medium">
                  <span>Medium</span>
                  <b>{stats.leetcodeMedium}</b>
                  <i>
                    <em
                      style={{
                        width: `${stats.leetcode ? (stats.leetcodeMedium / stats.leetcode) * 100 : 0}%`,
                      }}
                    />
                  </i>
                </div>
                <div className="difficulty-row hard">
                  <span>Hard</span>
                  <b>{stats.leetcodeHard}</b>
                  <i>
                    <em
                      style={{
                        width: `${stats.leetcode ? (stats.leetcodeHard / stats.leetcode) * 100 : 0}%`,
                      }}
                    />
                  </i>
                </div>
              </Panel>
              <Panel title="Platform pulse" eyebrow="LIVE RATINGS">
                <div className="rating-pulse">
                  <Trophy size={26} />
                  <div>
                    <b>{stats.cf || "—"}</b>
                    <span className="capitalize">Codeforces {stats.rank}</span>
                  </div>
                </div>
                <p className="dashboard-note">
                  Submissions are fetched automatically from your connected
                  public profiles. No manual logging needed.
                </p>
              </Panel>
            </div>

            {contests.length > 0 && (
              <Panel
                title="Live Contest Radar"
                eyebrow="SCHEDULED COMPETITIONS"
              >
                <div className="contest-grid">
                  {contests.map((c) => (
                    <article className="contest-card" key={c.id}>
                      <div className="contest-card-head">
                        <span className="contest-div-pill">
                          {c.name.includes("Div. 1")
                            ? "Div. 1"
                            : c.name.includes("Div. 2")
                              ? "Div. 2"
                              : c.name.includes("Div. 3")
                                ? "Div. 3"
                                : c.name.includes("Div. 4")
                                  ? "Div. 4"
                                  : "Round"}
                        </span>
                        <span className="contest-timer">
                          {formatCountdown(c.relativeTimeSeconds)}
                        </span>
                      </div>
                      <h3>{c.name}</h3>
                      <div className="contest-meta">
                        <span>
                          Duration: {Math.floor(c.durationSeconds / 3600)}h{" "}
                          {Math.floor((c.durationSeconds % 3600) / 60)}m
                        </span>
                        <span>Format: {c.type}</span>
                      </div>
                      <a
                        href={c.url}
                        target="_blank"
                        className="contest-reg-btn"
                      >
                        Register on Codeforces <ExternalLink size={13} />
                      </a>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            <Panel
              title="Codeforces Upsolving Queue"
              eyebrow="ATTEMPTED BUT UNACCEPTED"
            >
              <p
                className="dashboard-note"
                style={{ marginTop: 0, marginBottom: "16px" }}
              >
                Problems from recent contests where your submission received a
                non-OK verdict and has not yet been accepted. Review hints,
                analyze the bottleneck, and upsolve to build rating.
              </p>
              <div className="upsolve-grid">
                {upsolvingQueue.map((item) => {
                  const hint = getProblemHint(item.tags, item.rating);
                  const isExpanded = expandedHintId === item.id;
                  const vLower = item.verdict.toLowerCase();
                  const verdictClass = vLower.includes("time")
                    ? "tle"
                    : vLower.includes("wrong")
                      ? "wa"
                      : vLower.includes("memory")
                        ? "mle"
                        : "other";
                  return (
                    <div className="upsolve-card" key={item.id}>
                      <div className="upsolve-card-header">
                        <div className="upsolve-info">
                          <div className="upsolve-badges">
                            <span className={`verdict-pill ${verdictClass}`}>
                              {item.verdict}
                            </span>
                            {item.rating && (
                              <span className="upsolve-rating-pill">
                                ★ {item.rating}
                              </span>
                            )}
                            <span className="upsolve-contest-pill">
                              Contest {item.contestId}
                              {item.index}
                            </span>
                          </div>
                          <h4>
                            <a
                              href={item.url}
                              target="_blank"
                              className="upsolve-title"
                            >
                              {item.title} <ExternalLink size={13} />
                            </a>
                          </h4>
                        </div>
                        <div className="upsolve-actions">
                          <button
                            className={`secondary hint-btn ${isExpanded ? "active" : ""}`}
                            onClick={() =>
                              setExpandedHintId(isExpanded ? null : item.id)
                            }
                          >
                            {isExpanded ? "Hide Hints" : "View Hints"}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            className="primary solve-btn"
                          >
                            Solve Problem
                          </a>
                        </div>
                      </div>
                      <div className="tags upsolve-tags">
                        {item.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                      {isExpanded && (
                        <div className="hint-drawer">
                          <div className="hint-step">
                            <b>Hint 1 (Observation & Approach):</b>
                            <p>{hint.intuition}</p>
                          </div>
                          <div className="hint-step">
                            <b>Hint 2 (Target Complexity & Structures):</b>
                            <p>
                              Target Complexity: <code>{hint.complexity}</code>.
                              Consider: {hint.dataStructure}.
                            </p>
                          </div>
                          <div className="hint-step">
                            <b>Hint 3 (Edge Cases & Pitfalls):</b>
                            <p>{hint.edgeCase}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!upsolvingQueue.length && (
                  <div className="empty-row">
                    {sourceErrors.length
                      ? sourceErrors.join(" · ")
                      : "No unaccepted problems found in recent contest submissions. Great job!"}
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title="Latest accepted submissions"
              eyebrow="LIVE PROBLEM JOURNAL"
            >
              <div className="search">
                <Search size={16} />
                <input
                  placeholder="Search title, topic, or platform"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="table">
                <div className="tr th">
                  <span>Problem</span>
                  <span>Platform</span>
                  <span>Topic</span>
                  <span>Difficulty</span>
                  <span />
                </div>
                {filtered.map((p) => (
                  <div className="tr" key={p.id}>
                    <span>
                      {p.url ? (
                        <a href={p.url} target="_blank">
                          <b>{p.title}</b>
                        </a>
                      ) : (
                        <b>{p.title}</b>
                      )}
                      <small>{p.notes}</small>
                    </span>
                    <span>{p.platform}</span>
                    <span>{p.topic}</span>
                    <span className={`pill ${p.difficulty.toLowerCase()}`}>
                      {p.difficulty}
                    </span>
                    {p.source === "Manual" ? (
                      <button
                        className="icon"
                        onClick={() =>
                          setProblems((x) => x.filter((q) => q.id !== p.id))
                        }
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <a
                        className="icon source-link"
                        href={p.url}
                        target="_blank"
                        aria-label={`Open ${p.title}`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                ))}
                {!filtered.length && (
                  <div className="empty-row">
                    {sourceErrors.length
                      ? sourceErrors.join(" · ")
                      : "Loading live accepted submissions…"}
                  </div>
                )}
              </div>
            </Panel>
          </section>
        )}
        {view === "projects" && (
          <section className="stack">
            <Panel title="Create a project" eyebrow="WORKBENCH">
              <div className="inline-form">
                <input
                  placeholder="Project name"
                  value={projectForm.name}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, name: e.target.value })
                  }
                />
                <input
                  placeholder="One-line summary"
                  value={projectForm.summary}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, summary: e.target.value })
                  }
                />
                <button className="primary" onClick={addProject}>
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </Panel>
            <div className="cards">
              {projects.map((p) => (
                <article className="project" key={p.id}>
                  <div className="row">
                    <span className="pill done">{p.status}</span>
                    <label className="privacy">
                      <input
                        type="checkbox"
                        checked={p.public}
                        onChange={() =>
                          setProjects((x) =>
                            x.map((q) =>
                              q.id === p.id ? { ...q, public: !q.public } : q,
                            ),
                          )
                        }
                      />
                      Public
                    </label>
                  </div>
                  <h3>{p.name}</h3>
                  <p>{p.summary}</p>
                  <div className="tags">
                    {p.stack.split(",").map((s) => (
                      <span key={s}>{s.trim()}</span>
                    ))}
                  </div>
                  <div className="progress">
                    <i style={{ width: `${p.progress}%` }} />
                  </div>
                  <h4>Live repository activity</h4>
                  {p.changelog.map((c) => (
                    <small className="change" key={c}>
                      ✓ {c}
                    </small>
                  ))}
                  <div className="links">
                    <a
                      href={p.repo || "https://github.com/Adarsh-khare1"}
                      target="_blank"
                    >
                      GitHub <ExternalLink size={14} />
                    </a>
                    {p.demo && (
                      <a href={p.demo} target="_blank">
                        Live demo <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {!projects.length && (
                <div className="empty-row">
                  {sourceErrors.length
                    ? sourceErrors.join(" · ")
                    : "Loading GitHub repositories…"}
                </div>
              )}
            </div>
          </section>
        )}
        {view === "goals" && (
          <section className="stack life-dashboard">
            <div className="split">
              <Panel title="Editable goals" eyebrow="DIRECTION">
                <div className="goal-create">
                  <input
                    placeholder="New goal"
                    value={goalForm.title}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, title: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Target"
                    value={goalForm.target}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, target: e.target.value })
                    }
                  />
                  <button className="primary" onClick={addGoal}>
                    <Plus size={15} />
                    Add
                  </button>
                </div>
                {goals.map((g) => (
                  <div className="goal editable-goal" key={g.id}>
                    <div className="goal-edit-row">
                      <input
                        aria-label="Goal name"
                        value={g.title}
                        onChange={(e) =>
                          setGoals((items) =>
                            items.map((item) =>
                              item.id === g.id
                                ? { ...item, title: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label="Current progress"
                        type="number"
                        min="0"
                        max={g.target}
                        value={g.done}
                        onChange={(e) =>
                          setGoals((items) =>
                            items.map((item) =>
                              item.id === g.id
                                ? {
                                    ...item,
                                    done: Math.min(
                                      item.target,
                                      Number(e.target.value),
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      <span>/</span>
                      <input
                        aria-label="Goal target"
                        type="number"
                        min="1"
                        value={g.target}
                        onChange={(e) =>
                          setGoals((items) =>
                            items.map((item) =>
                              item.id === g.id
                                ? {
                                    ...item,
                                    target: Math.max(1, Number(e.target.value)),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      <button
                        className="icon"
                        aria-label={`Delete ${g.title}`}
                        onClick={() =>
                          setGoals((items) =>
                            items.filter((item) => item.id !== g.id),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="progress">
                      <i
                        style={{
                          width: `${Math.min(100, (g.done / g.target) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </Panel>
              <Panel title="Today at a glance" eyebrow="CONSISTENCY">
                <div className="habit-summary">
                  <div>
                    <b>
                      {
                        habits.filter((h) => h.history.includes(dateKey()))
                          .length
                      }
                      /{habits.length}
                    </b>
                    <span>check-ins today</span>
                  </div>
                  <div>
                    <b>{Math.max(0, ...habits.map((h) => h.streak))}</b>
                    <span>total check-ins</span>
                  </div>
                </div>
                <div className="reminder-mini">
                  <CalendarDays />
                  <div>
                    <b>
                      {reminders.filter((r) => !r.completed).length} active
                      reminders
                    </b>
                    <p>Jarvis can create and announce them for you.</p>
                  </div>
                </div>
              </Panel>
            </div>
            <Panel title="Habit calendar" eyebrow="DAILY SYSTEM">
              <div className="habit-create">
                <input
                  placeholder="Habit to build or break"
                  value={habitForm.title}
                  onChange={(e) =>
                    setHabitForm({ ...habitForm, title: e.target.value })
                  }
                />
                <select
                  value={habitForm.kind}
                  onChange={(e) =>
                    setHabitForm({
                      ...habitForm,
                      kind: e.target.value as "build" | "break",
                    })
                  }
                >
                  <option value="build">Build a habit</option>
                  <option value="break">Break a bad habit</option>
                </select>
                <button className="primary" onClick={addHabit}>
                  <Plus size={15} />
                  Add tracker
                </button>
              </div>
              <div className="habit-calendar-list">
                {habits.map((habit) => (
                  <HabitCalendar
                    key={habit.id}
                    habit={habit}
                    onToggle={toggleHabitDate}
                    onDelete={() =>
                      setHabits((items) =>
                        items.filter((item) => item.id !== habit.id),
                      )
                    }
                  />
                ))}
              </div>
            </Panel>
            <Panel title="Reminders & alarms" eyebrow="JARVIS SCHEDULE">
              <div className="reminder-create">
                <input
                  placeholder="What should Jarvis remind you?"
                  value={reminderForm.title}
                  onChange={(e) =>
                    setReminderForm({ ...reminderForm, title: e.target.value })
                  }
                />
                <input
                  type="datetime-local"
                  value={reminderForm.remindAt}
                  onChange={(e) =>
                    setReminderForm({
                      ...reminderForm,
                      remindAt: e.target.value,
                    })
                  }
                />
                <button className="primary" onClick={addReminder}>
                  <Plus size={15} />
                  Schedule
                </button>
              </div>
              <div className="reminder-list">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={
                      reminder.completed ? "reminder done-reminder" : "reminder"
                    }
                  >
                    <button
                      aria-label="Toggle reminder"
                      onClick={() =>
                        setReminders((items) =>
                          items.map((item) =>
                            item.id === reminder.id
                              ? { ...item, completed: !item.completed }
                              : item,
                          ),
                        )
                      }
                    >
                      {reminder.completed ? "✓" : "○"}
                    </button>
                    <div>
                      <b>{reminder.title}</b>
                      <span>
                        {new Date(reminder.remindAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="icon"
                      aria-label={`Delete ${reminder.title}`}
                      onClick={() =>
                        setReminders((items) =>
                          items.filter((item) => item.id !== reminder.id),
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {!reminders.length && (
                  <p className="dashboard-note">
                    No reminders yet. Add one here or tell Jarvis.
                  </p>
                )}
              </div>
            </Panel>
          </section>
        )}
        {view === "portfolio" && <WallOfPortfolios stats={stats} />}{" "}
        {view === "resume" && <Resume config={portfolioConfig} />}{" "}
        {view === "settings" && (
          <SettingsView
            privacy={privacy}
            setPrivacy={setPrivacy}
            exportData={exportData}
            stats={stats}
            errors={sourceErrors}
            updatedAt={updatedAt}
            config={portfolioConfig}
            setConfig={setPortfolioConfig}
            notify={notify}
          />
        )}
        <JarvisAssistant
          setView={setView}
          goals={goals}
          setGoals={setGoals}
          habits={habits}
          setHabits={setHabits}
          reminders={reminders}
          setReminders={setReminders}
          notify={notify}
          contests={contests}
          upsolvingQueue={upsolvingQueue}
        />
      </section>
    </main>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <article className="panel">
      <p className="kicker">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </article>
  );
}
function Overview({
  projects,
  goals,
  habits,
  reminders,
  contests = [],
  setView,
}: {
  projects: Project[];
  goals: Goal[];
  habits: Habit[];
  reminders: Reminder[];
  contests?: UpcomingContest[];
  setView: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [now] = useState(() => Date.now());
  const focusGoal = goals.find((goal) => goal.done < goal.target);
  const nextReminder = reminders
    .filter(
      (item) =>
        !item.completed && new Date(item.remindAt).getTime() > now,
    )
    .sort((a, b) => a.remindAt.localeCompare(b.remindAt))[0];
  const doneToday = habits.filter((habit) =>
    habit.history.includes(dateKey()),
  ).length;
  return (
    <section className="stack overview-stack">
      <div
        className="hero reactive-hero"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty(
            "--mx",
            `${event.clientX - rect.left}px`,
          );
          event.currentTarget.style.setProperty(
            "--my",
            `${event.clientY - rect.top}px`,
          );
        }}
      >
        <div className="hero-copy">
          <p className="kicker">YOUR PERSONAL OPERATING SYSTEM</p>
          <h2>
            Own your day.
            <br />
            <em>Build your future.</em>
          </h2>
          <p>
            Plan meaningful work, protect your habits, and let Jarvis keep the
            details moving while you stay focused.
          </p>
          <div className="hero-actions">
            <button onClick={() => setView("goals")}>
              Plan today <Target size={16} />
            </button>
            <button className="hero-ghost" onClick={() => setView("projects")}>
              Continue a project
            </button>
          </div>
          <div className="hero-note">
            <span>TIP</span>
            <p>Tell Jarvis what you want to achieve today. Voice or text.</p>
          </div>
        </div>
        <div className="machine">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="track track-one" />
          <div className="track track-two" />
          <div className="machine-core">
            <Code2 size={40} />
            <b>AK</b>
            <small>DEV CORE</small>
          </div>
          <div className="machine-node node-code">
            <Target size={18} />
            <span>Focus</span>
          </div>
          <div className="machine-node node-build">
            <Activity size={18} />
            <span>Act</span>
          </div>
          <div className="machine-node node-ship">
            <BriefcaseBusiness size={18} />
            <span>Grow</span>
          </div>
          <div className="status-bubble bubble-one">
            Daily plan <b>Ready</b>
          </div>
          <div className="status-bubble bubble-two">
            Jarvis <b>Online</b>
          </div>
          <div className="status-bubble bubble-three">
            Habits today{" "}
            <b>
              {doneToday}/{habits.length}
            </b>
          </div>
          <div className="terminal-card">
            <small>NEXT MOVE</small>
            <strong>{focusGoal?.title || "Choose a new goal"}</strong>
            <code>
              focus mode <i>ready</i>
            </code>
          </div>
          <span className="flow-ball ball-one" />
          <span className="flow-ball ball-two" />
          <span className="flow-ball ball-three" />
        </div>
      </div>

      {contests && contests.length > 0 && (
        <div className="contest-radar-strip">
          <div className="radar-indicator">
            <span className="radar-dot" />
            <b>LIVE CONTEST RADAR</b>
          </div>
          <div className="radar-detail">
            <strong>{contests[0].name}</strong>
            <span>
              Starts {formatCountdown(contests[0].relativeTimeSeconds)} ·
              Codeforces
            </span>
          </div>
          <div className="radar-actions">
            <button className="secondary" onClick={() => setView("journal")}>
              Radar & Upsolve
            </button>
            <a href={contests[0].url} target="_blank" className="primary">
              Register <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      <div className="home-grid">
        <button
          className="home-card focus-card"
          onClick={() => setView("goals")}
        >
          <span>
            <Target size={19} />
            TODAY&apos;S FOCUS
          </span>
          <b>{focusGoal?.title || "Set your next goal"}</b>
          <small>
            {focusGoal
              ? `${focusGoal.done} of ${focusGoal.target} complete`
              : "Start with one clear outcome"}
          </small>
        </button>
        <button className="home-card" onClick={() => setView("goals")}>
          <span>
            <CalendarDays size={19} />
            HABIT RHYTHM
          </span>
          <b>
            {doneToday}/{habits.length} checked in
          </b>
          <small>Open the calendar and protect the streak</small>
        </button>
        <button className="home-card" onClick={() => setView("goals")}>
          <span>
            <Activity size={19} />
            NEXT REMINDER
          </span>
          <b>{nextReminder?.title || "Nothing scheduled"}</b>
          <small>
            {nextReminder
              ? new Date(nextReminder.remindAt).toLocaleString()
              : "Ask Jarvis to remind you"}
          </small>
        </button>
        <button className="home-card" onClick={() => setView("projects")}>
          <span>
            <BriefcaseBusiness size={19} />
            PROJECT SPACE
          </span>
          <b>{projects[0]?.name || "Create a project"}</b>
          <small>{projects.length} projects available</small>
        </button>
      </div>
      <div className="split home-lower">
        <Panel title="Goal momentum" eyebrow="MAKE THE NEXT MOVE">
          {goals.slice(0, 4).map((g) => (
            <div className="mini-goal" key={g.id}>
              <div className="row">
                <span>{g.title}</span>
                <b>{Math.round((g.done / g.target) * 100)}%</b>
              </div>
              <div className="progress">
                <i
                  style={{
                    width: `${Math.min(100, (g.done / g.target) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <button className="text-action" onClick={() => setView("goals")}>
            Edit goals and habits →
          </button>
        </Panel>
        <Panel title="Jarvis briefing" eyebrow="PERSONAL ASSISTANT">
          <div className="jarvis-brief">
            <SparklesIcon />
            <p>
              <b>Ready when you are.</b>
              <span>
                Ask me to open a page, add a goal, create a habit, schedule a
                reminder, or decide what to do next.
              </span>
            </p>
          </div>
          <button className="text-action jarvis-hint">
            Use the floating orb to talk →
          </button>
        </Panel>
      </div>
    </section>
  );
}
function SparklesIcon() {
  return <span className="jarvis-core-mark">J</span>;
}
function HabitCalendar({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  onToggle: (id: number, day?: string) => void;
  onDelete: () => void;
}) {
  const days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    return date;
  });
  return (
    <article className={`habit-calendar-row ${habit.kind}`}>
      <div className="habit-calendar-head">
        <div>
          <span>{habit.kind === "build" ? "BUILD" : "BREAK"}</span>
          <h3>{habit.title}</h3>
        </div>
        <div>
          <b>{habit.history.length}</b>
          <small>check-ins</small>
          <button
            className="icon"
            onClick={onDelete}
            aria-label={`Delete ${habit.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="calendar-strip">
        {days.map((day) => {
          const key = dateKey(day);
          const checked = habit.history.includes(key);
          return (
            <button
              key={key}
              className={checked ? "calendar-day checked" : "calendar-day"}
              onClick={() => onToggle(habit.id, key)}
              title={`${day.toLocaleDateString()} · ${checked ? "checked" : "not checked"}`}
            >
              <small>
                {day.toLocaleDateString(undefined, { weekday: "narrow" })}
              </small>
              <b>{day.getDate()}</b>
            </button>
          );
        })}
      </div>
    </article>
  );
}
function WallOfPortfolios({ stats }: { stats: Stats }) {
  return (
    <div className="wop-container">
      <div className="wop-sidebar">
        <div className="wop-profile">
          <div className="wop-avatar">AK</div>
          <div className="wop-status">Open to Work</div>
          <h2>Adarsh Khare</h2>
          <p className="wop-title">Full Stack Developer</p>
          <p className="wop-location">📍 India</p>
        </div>
        <div className="wop-exp">
          <small>
            {stats.repos} Repositories · {stats.cf} Codeforces rating
          </small>
          <div className="wop-logos">
            <span className="wop-logo github">GitHub</span>
            <span className="wop-logo codeforces">Codeforces</span>
            <span className="wop-logo leetcode">LeetCode</span>
          </div>
        </div>
        <div className="wop-actions">
          <a href="/portfolio#contact" target="_blank" className="wop-message">
            Contact Adarsh
          </a>
        </div>
        <div className="wop-tabs">
          <div className="wop-tab active">Portfolio</div>
        </div>
      </div>
      <div className="wop-content">
        <iframe
          src="/portfolio"
          title="Adarsh Khare Portfolio"
          className="wop-iframe"
        ></iframe>
      </div>
    </div>
  );
}
function Resume({ config }: { config: PortfolioConfig }) {
  return (
    <section className="resume-wrap">
      <div className="print-actions">
        <button className="primary" onClick={() => window.print()}>
          <Download size={16} />
          Print / save PDF
        </button>
      </div>
      <article className="resume">
        <header className="resume-banner">
          <div className="resume-monogram">AK</div>
          <div>
            <h2>{config.name}</h2>
            <p>{config.role}</p>
          </div>
        </header>
        <div className="resume-body">
          <aside className="resume-side">
            <section>
              <h3>Contact details</h3>
              <a href={`mailto:${config.email}`}>{config.email}</a>
              <a href={config.githubUrl} target="_blank" rel="noreferrer">
                {config.githubUrl.replace(/^https?:\/\//, "")}
              </a>
              <p>{config.location}</p>
            </section>
            <section>
              <h3>Education</h3>
              <div className="resume-rail">
                <b>B.Tech, Electronics &amp; Communication Engineering</b>
                <span>
                  Motilal Nehru National Institute of Technology Allahabad
                </span>
                <span>2024 – 2028 · CGPA 7.65</span>
              </div>
            </section>
            <section>
              <h3>Core skills</h3>
              <ul className="resume-skills">
                <li>Problem solving &amp; DSA</li>
                <li>Full stack web development</li>
                <li>REST APIs &amp; authentication</li>
                <li>Database design</li>
                <li>Git &amp; collaborative development</li>
              </ul>
            </section>
            <section>
              <h3>Platforms</h3>
              <p>Codeforces · Specialist</p>
              <p>LeetCode · Algorithm practice</p>
              <p>GitHub · Open source projects</p>
            </section>
          </aside>
          <div className="resume-main">
            <section>
              <h3>Summary</h3>
              <p className="resume-summary">{config.intro}</p>
            </section>
            <section>
              <h3>Selected projects</h3>
              {config.projects.map((project) => (
                <div className="resume-project" key={project.id}>
                  <b>{project.name}</b>
                  <span>{project.stack}</span>
                  <p>{project.summary}</p>
                </div>
              ))}
            </section>
            <section>
              <h3>Technologies</h3>
              <div className="resume-tech">
                <div>
                  <b>Languages</b>
                  <span>JavaScript, TypeScript, C++, Python, SQL</span>
                </div>
                <div>
                  <b>Frontend</b>
                  <span>React, Next.js, Tailwind CSS, HTML, CSS</span>
                </div>
                <div>
                  <b>Backend</b>
                  <span>Node.js, Express, REST APIs, JWT, Socket.io</span>
                </div>
                <div>
                  <b>Data &amp; tools</b>
                  <span>
                    PostgreSQL, MongoDB, Supabase, Docker, Git, GitHub
                  </span>
                </div>
              </div>
            </section>
            <section>
              <h3>Achievements</h3>
              <p className="resume-summary">
                <b>Codeforces Specialist</b> · First place, Hand Gesture Robot
                Competition at Avishkar 2025 · Featured in Amar Ujala.
              </p>
            </section>
          </div>
        </div>
      </article>
    </section>
  );
}
function SettingsView({
  privacy,
  setPrivacy,
  exportData,
  stats,
  errors,
  updatedAt,
  config,
  setConfig,
  notify,
}: {
  privacy: boolean;
  setPrivacy: React.Dispatch<React.SetStateAction<boolean>>;
  exportData: () => void;
  stats: Stats;
  errors: string[];
  updatedAt: string;
  config: PortfolioConfig;
  setConfig: React.Dispatch<React.SetStateAction<PortfolioConfig>>;
  notify: (message: string) => void;
}) {
  return (
    <section className="stack settings-stack">
      <div className="split">
        <Panel title="Profile connections" eyebrow="LIVE DATA">
          <div className="connection">
            <b>LeetCode</b>
            <a href="https://leetcode.com/u/adarsh2028/" target="_blank">
              adarsh2028 · {stats.leetcode} solved <ExternalLink size={14} />
            </a>
          </div>
          <div className="connection">
            <b>Codeforces</b>
            <a href="https://codeforces.com/profile/adarsh269" target="_blank">
              adarsh269 · {stats.cf || "unrated"} · {stats.cfSolved} recent
              solves <ExternalLink size={14} />
            </a>
          </div>
          <div className="connection">
            <b>GitHub</b>
            <a href="https://github.com/Adarsh-khare1" target="_blank">
              Adarsh-khare1 · {stats.repos} repos <ExternalLink size={14} />
            </a>
          </div>
          {updatedAt && (
            <p className="sync-status">
              Last refreshed {new Date(updatedAt).toLocaleString()}
            </p>
          )}
          {errors.map((error) => (
            <p className="source-error" key={error}>
              {error}
            </p>
          ))}
          <p className="sync-status">
            Profiles refresh automatically when the workspace opens.
          </p>
        </Panel>
        <Panel title="Privacy & backup" eyebrow="CONTROL">
          <label className="toggle">
            <div>
              <b>Public recruiter view</b>
              <small>Only projects marked public appear.</small>
            </div>
            <input
              type="checkbox"
              checked={privacy}
              onChange={() => setPrivacy(!privacy)}
            />
          </label>
          <button className="secondary export" onClick={exportData}>
            <Download size={16} />
            Export all data as JSON
          </button>
          <div className="safe">
            <ShieldCheck size={20} />
            <p>
              Only manually added records are stored in this browser. Platform
              data is fetched live.
            </p>
          </div>
        </Panel>
      </div>
      <PortfolioAdmin config={config} setConfig={setConfig} notify={notify} />
    </section>
  );
}

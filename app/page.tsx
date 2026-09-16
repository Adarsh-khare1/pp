"use client";
import { useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
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
const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "journal", label: "Problem journal", icon: BookOpen },
  { id: "projects", label: "Projects", icon: BriefcaseBusiness },
  { id: "goals", label: "Goals & contests", icon: Target },
  { id: "portfolio", label: "Portfolio", icon: Globe2 },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];
const topics = [
  "Arrays",
  "Graphs",
  "Dynamic Programming",
  "Trees",
  "Strings",
  "Math",
];

export default function Home() {
  const [view, setView] = useState("overview"),
    [problems, setProblems] = useState<Problem[]>([]),
    [projects, setProjects] = useState<Project[]>([]),
    [goals, setGoals] = useState<Goal[]>(goalsSeed),
    [command, setCommand] = useState(""),
    [query, setQuery] = useState(""),
    [privacy, setPrivacy] = useState(true),
    [toast, setToast] = useState(""),
    [syncing, setSyncing] = useState(false),
    [stats, setStats] = useState<Stats>(emptyStats),
    [sourceErrors, setSourceErrors] = useState<string[]>([]),
    [updatedAt, setUpdatedAt] = useState(""),
    [problemForm, setProblemForm] = useState({
      title: "",
      platform: "LeetCode",
      topic: "Arrays",
      difficulty: "Medium",
      notes: "",
    }),
    [projectForm, setProjectForm] = useState({ name: "", summary: "" });
  const applyLive = (
    data: LiveProfile,
    manualProblems: Problem[] = problems.filter((p) => p.source === "Manual"),
    manualProjects: Project[] = projects.filter((p) => p.source === "Manual"),
  ) => {
    setProblems([...manualProblems, ...data.problems]);
    setProjects([...manualProjects, ...data.projects]);
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
    let active = true;
    const timer = window.setTimeout(async () => {
      let manualProblems: Problem[] = [];
      let manualProjects: Project[] = [];
      let savedGoals = goalsSeed;
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
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "codefolio-manual-v3",
      JSON.stringify({
        problems: problems.filter((p) => p.source === "Manual"),
        projects: projects.filter((p) => p.source === "Manual"),
        goals,
      }),
    );
  }, [problems, projects, goals]);
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2600);
  };
  const sync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/profile?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(`Profile service returned ${response.status}`);
      const data = (await response.json()) as LiveProfile;
      applyLive(data);
      notify(
        data.errors?.length
          ? `Updated with ${data.errors.length} platform warning${data.errors.length === 1 ? "" : "s"}`
          : "All live profiles refreshed",
      );
    } catch {
      notify("Live sync unavailable — keeping current values");
    } finally {
      setSyncing(false);
    }
  };
  const addProblem = () => {
    if (!problemForm.title.trim()) return;
    setProblems((p) => [
      {
        id: `manual-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        revise: false,
        source: "Manual",
        ...problemForm,
      },
      ...p,
    ]);
    setProblemForm({ ...problemForm, title: "", notes: "" });
    notify("Problem added to journal");
  };
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
  const runCommand = () => {
    const c = command.trim();
    if (!c) return;
    if (/solved|problem/i.test(c)) setView("journal");
    else if (/resume/i.test(c)) setView("resume");
    else if (/portfolio/i.test(c)) setView("portfolio");
    else if (/project/i.test(c)) setView("projects");
    notify(`Update noted: ${c}`);
    setCommand("");
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
  const skills = useMemo(
    () =>
      topics.map((t) => ({
        name: t,
        value: Math.max(
          18,
          problems.filter((p) => p.topic === t).length * 18 + 24,
        ),
      })),
    [problems],
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
          <div className="header-actions">
            <button className="secondary" onClick={sync}>
              <RefreshCw size={16} className={syncing ? "spin" : ""} />
              {syncing ? "Syncing" : "Sync profiles"}
            </button>
            <button className="primary" onClick={() => setView("journal")}>
              <Plus size={16} />
              Add work
            </button>
          </div>
        </header>
        {toast && <div className="toast">{toast}</div>}
        {view === "overview" && (
          <Overview
            stats={stats}
            problems={problems}
            projects={projects}
            goals={goals}
            skills={skills}
            setView={setView}
          />
        )}{" "}
        {view === "journal" && (
          <section className="stack">
            <div className="split">
              <Panel title="Log a solved problem" eyebrow="CODING JOURNAL">
                <div className="form-grid">
                  <input
                    placeholder="Problem title"
                    value={problemForm.title}
                    onChange={(e) =>
                      setProblemForm({ ...problemForm, title: e.target.value })
                    }
                  />
                  <select
                    value={problemForm.platform}
                    onChange={(e) =>
                      setProblemForm({
                        ...problemForm,
                        platform: e.target.value,
                      })
                    }
                  >
                    <option>LeetCode</option>
                    <option>Codeforces</option>
                    <option>Other</option>
                  </select>
                  <select
                    value={problemForm.topic}
                    onChange={(e) =>
                      setProblemForm({ ...problemForm, topic: e.target.value })
                    }
                  >
                    {topics.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={problemForm.difficulty}
                    onChange={(e) =>
                      setProblemForm({
                        ...problemForm,
                        difficulty: e.target.value,
                      })
                    }
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                  <textarea
                    className="wide"
                    placeholder="Approach, mistakes, complexity…"
                    value={problemForm.notes}
                    onChange={(e) =>
                      setProblemForm({ ...problemForm, notes: e.target.value })
                    }
                  />
                  <button className="primary wide" onClick={addProblem}>
                    Save problem
                  </button>
                </div>
              </Panel>
              <Panel title="Revision queue" eyebrow="SMART REVIEW">
                <div className="queue">
                  <b>
                    {problems.filter((p) => p.revise).length} topics waiting
                  </b>
                  <p>
                    Review weak problems, then clear them when the approach
                    feels natural.
                  </p>
                  {problems
                    .filter((p) => p.revise)
                    .slice(0, 3)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          setProblems((x) =>
                            x.map((q) =>
                              q.id === p.id ? { ...q, revise: false } : q,
                            ),
                          )
                        }
                      >
                        {p.title}
                        <span>Mark reviewed</span>
                      </button>
                    ))}
                </div>
              </Panel>
            </div>
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
          <section className="split">
            <Panel title="Weekly goals" eyebrow="DIRECTION">
              {goals.map((g) => (
                <div className="goal" key={g.id}>
                  <div className="row">
                    <b>{g.title}</b>
                    <span>
                      {g.done}/{g.target}
                    </span>
                  </div>
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.min(100, (g.done / g.target) * 100)}%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() =>
                      setGoals((x) =>
                        x.map((q) =>
                          q.id === g.id
                            ? { ...q, done: Math.min(q.target, q.done + 1) }
                            : q,
                        ),
                      )
                    }
                  >
                    Log progress
                  </button>
                </div>
              ))}
            </Panel>
            <Panel title="Contest tracker" eyebrow="UPCOMING & RECENT">
              <div className="contest">
                <CalendarDays />
                <div>
                  <b>Codeforces rounds</b>
                  <p>
                    Open your live contest calendar and record post-contest
                    notes.
                  </p>
                  <a href="https://codeforces.com/contests" target="_blank">
                    View contests <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              <div className="contest">
                <Trophy />
                <div>
                  <b>Current rating: {stats.cf}</b>
                  <p className="capitalize">
                    {stats.rank} · Target: Expert (1600)
                  </p>
                </div>
              </div>
            </Panel>
          </section>
        )}
        {view === "portfolio" && (
          <Portfolio projects={projects.filter((p) => p.public)} />
        )}{" "}
        {view === "resume" && <Resume projects={projects} />}{" "}
        {view === "settings" && (
          <SettingsView
            privacy={privacy}
            setPrivacy={setPrivacy}
            exportData={exportData}
            sync={sync}
            stats={stats}
            errors={sourceErrors}
            updatedAt={updatedAt}
          />
        )}
        <div className="command">
          <Sparkles size={18} />
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCommand()}
            placeholder="Tell Codefolio: “I solved a graph problem today”"
          />
          <button onClick={runCommand}>Apply update</button>
        </div>
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
  stats,
  problems,
  projects,
  goals,
  skills,
  setView,
}: {
  stats: Stats;
  problems: Problem[];
  projects: Project[];
  goals: Goal[];
  skills: { name: string; value: number }[];
  setView: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <section className="stack overview-stack">
      <div className="hero">
        <div className="hero-copy">
          <p className="kicker">ADARSH KHARE · FULL STACK DEVELOPER</p>
          <h2>
            Build. Solve. Ship.
            <br />
            <em>Prove it.</em>
          </h2>
          <p>
            One living workspace for the code you write, the problems you solve,
            and the products you ship.
          </p>
          <div className="hero-actions">
            <button onClick={() => setView("journal")}>
              View live problem journal <ExternalLink size={16} />
            </button>
            <button className="hero-ghost" onClick={() => setView("projects")}>
              View live projects
            </button>
          </div>
          <div className="hero-note">
            <span>●</span> Synced from LeetCode, Codeforces, and GitHub
          </div>
        </div>
        <div className="hero-machine" aria-hidden="true">
          <div className="machine-glow" />
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
            <Code2 size={18} />
            <span>Code</span>
          </div>
          <div className="machine-node node-build">
            <Activity size={18} />
            <span>Build</span>
          </div>
          <div className="machine-node node-ship">
            <BriefcaseBusiness size={18} />
            <span>Ship</span>
          </div>
          <div className="status-bubble bubble-one">
            Problem solved <b>✓</b>
          </div>
          <div className="status-bubble bubble-two">
            Profiles synced <b>Live</b>
          </div>
          <div className="status-bubble bubble-three">
            Repos updated <b>{stats.repos}</b>
          </div>
          <div className="terminal-card">
            <small>GITHUB ACTIVITY</small>
            <strong>{stats.activeProjects} active projects</strong>
            <code>
              git push origin main <i>✓</i>
            </code>
          </div>
          <span className="flow-ball ball-one" />
          <span className="flow-ball ball-two" />
          <span className="flow-ball ball-three" />
        </div>
      </div>
      <div className="proof-strip">
        <div className="proof-quote">
          <strong>“Proof beats promises.”</strong>
          <span>
            Every accepted submission and repository update becomes visible
            career evidence.
          </span>
        </div>
        <div className="proof-brands">
          {projects.slice(0, 3).map((p) => (
            <button key={p.id} onClick={() => setView("projects")}>
              <span>{p.name.slice(0, 1).toUpperCase()}</span>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="metrics">
        <Metric
          label="LeetCode solved"
          value={stats.leetcode}
          note={`${stats.leetcodeEasy} easy · ${stats.leetcodeMedium} medium · ${stats.leetcodeHard} hard`}
          icon={BookOpen}
        />
        <Metric
          label="Codeforces rating"
          value={stats.cf || "—"}
          note={`${stats.cfSolved} recent unique solves · ${stats.rank}`}
          icon={Trophy}
        />
        <Metric
          label="GitHub repos"
          value={stats.repos}
          note={`${stats.github} followers`}
          icon={Code2}
        />
        <Metric
          label="Active projects"
          value={stats.activeProjects}
          note={`${projects.length} recent GitHub repos`}
          icon={BriefcaseBusiness}
        />
      </div>
      <div className="split">
        <Panel title="Skill radar" eyebrow="TOPIC COVERAGE">
          <div className="bars">
            {skills.map((s) => (
              <div key={s.name}>
                <span>{s.name}</span>
                <i>
                  <b style={{ width: `${s.value}%` }} />
                </i>
                <small>{s.value}%</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Goal momentum" eyebrow="THIS WEEK">
          {goals.map((g) => (
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
        </Panel>
      </div>
      <Panel title="Recent accepted submissions" eyebrow="LIVE ACTIVITY">
        {problems.slice(0, 5).map((p) => (
          <div className="activity" key={p.id}>
            <span className="dot" />
            <div>
              {p.url ? (
                <a href={p.url} target="_blank">
                  <b>{p.title}</b>
                </a>
              ) : (
                <b>{p.title}</b>
              )}
              <small>
                {p.platform} · {p.topic} · {p.date}
              </small>
            </div>
            <span className={`pill ${p.difficulty.toLowerCase()}`}>
              {p.difficulty}
            </span>
          </div>
        ))}
      </Panel>
    </section>
  );
}
function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <article className="metric">
      <Icon size={19} />
      <p>{label}</p>
      <b>{value}</b>
      <small>{note}</small>
    </article>
  );
}
function Portfolio({ projects }: { projects: Project[] }) {
  return (
    <section className="public-page">
      <div className="portfolio-hero">
        <p>ADARSH KHARE</p>
        <h2>
          Full Stack Developer building reliable products from interface to
          infrastructure.
        </h2>
        <div>
          <a href="mailto:adarshkhare269@gmail.com">Email me</a>
          <a href="https://github.com/Adarsh-khare1" target="_blank">
            GitHub <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <h3>Selected work</h3>
      <div className="cards">
        {projects.map((p) => (
          <article className="project public" key={p.id}>
            <span className="pill done">Featured</span>
            <h3>{p.name}</h3>
            <p>{p.summary}</p>
            <div className="tags">
              {p.stack.split(",").map((s) => (
                <span key={s}>{s.trim()}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="timeline">
        <h3>Highlights</h3>
        <p>
          <b>2026</b> Built three full-stack products across security,
          competitive programming, and restaurant operations.
        </p>
        <p>
          <b>2025</b> Won the Hand Gesture Robot Competition at Avishkar;
          featured in Amar Ujala.
        </p>
        <p>
          <b>2024–2028</b> B.Tech, Electronics and Communication Engineering,
          MNNIT Allahabad.
        </p>
      </div>
    </section>
  );
}
function Resume({ projects }: { projects: Project[] }) {
  return (
    <section>
      <div className="print-actions">
        <button className="primary" onClick={() => window.print()}>
          <Download size={16} />
          Print / save PDF
        </button>
      </div>
      <article className="resume">
        <header>
          <h2>Adarsh Khare</h2>
          <p>Full Stack Developer · Prayagraj, India</p>
          <p>adarshkhare269@gmail.com · github.com/Adarsh-khare1</p>
        </header>
        <section>
          <h3>Education</h3>
          <p>
            <b>Motilal Nehru National Institute of Technology Allahabad</b>
            <span>
              B.Tech, Electronics and Communication Engineering · 2024–2028 ·
              CGPA 7.65
            </span>
          </p>
        </section>
        <section>
          <h3>Projects</h3>
          {projects.map((p) => (
            <div className="resume-project" key={p.id}>
              <b>{p.name}</b>
              <span>{p.stack}</span>
              <p>{p.summary}</p>
              {p.changelog.slice(0, 2).map((c) => (
                <small key={c}>• {c}</small>
              ))}
            </div>
          ))}
        </section>
        <section>
          <h3>Technical skills</h3>
          <p>
            JavaScript, TypeScript, C++, Python, React, Next.js, Node.js,
            Express, Tailwind CSS, PostgreSQL, MongoDB, Docker, Git, GitHub,
            Socket.io, Supabase
          </p>
        </section>
        <section>
          <h3>Achievements</h3>
          <p>
            Codeforces Specialist (1437). First place, Hand Gesture Robot
            Competition — Avishkar 2025.
          </p>
        </section>
      </article>
    </section>
  );
}
function SettingsView({
  privacy,
  setPrivacy,
  exportData,
  sync,
  stats,
  errors,
  updatedAt,
}: {
  privacy: boolean;
  setPrivacy: React.Dispatch<React.SetStateAction<boolean>>;
  exportData: () => void;
  sync: () => Promise<void>;
  stats: Stats;
  errors: string[];
  updatedAt: string;
}) {
  return (
    <section className="split">
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
            adarsh269 · {stats.cf || "unrated"} · {stats.cfSolved} recent solves{" "}
            <ExternalLink size={14} />
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
        <button className="primary" onClick={sync}>
          <RefreshCw size={16} />
          Refresh now
        </button>
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
    </section>
  );
}

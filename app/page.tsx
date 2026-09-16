"use client";
import { useEffect, useMemo, useState } from "react";
import PortfolioAdmin from "@/components/PortfolioAdmin";
import { defaultPortfolioConfig, PortfolioConfig, readPortfolioConfig } from "@/lib/portfolio-config";
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
type Habit = { id: number; title: string; kind: "build" | "break"; streak: number; doneToday: boolean };
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
const habitsSeed: Habit[] = [
  { id: 1, title: "Code with full focus", kind: "build", streak: 4, doneToday: false },
  { id: 2, title: "Exercise for 30 minutes", kind: "build", streak: 2, doneToday: false },
  { id: 3, title: "Avoid mindless scrolling", kind: "break", streak: 3, doneToday: false },
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
    [habits, setHabits] = useState<Habit[]>(habitsSeed),
    [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig>(defaultPortfolioConfig),
    [command, setCommand] = useState(""),
    [query, setQuery] = useState(""),
    [privacy, setPrivacy] = useState(true),
    [toast, setToast] = useState(""),
    [stats, setStats] = useState<Stats>(emptyStats),
    [sourceErrors, setSourceErrors] = useState<string[]>([]),
    [updatedAt, setUpdatedAt] = useState(""),
    [goalForm, setGoalForm] = useState({ title: "", target: "" }),
    [habitForm, setHabitForm] = useState({ title: "", kind: "build" as "build" | "break" }),
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
    const timer = window.setTimeout(() => setPortfolioConfig(readPortfolioConfig()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      let manualProblems: Problem[] = [];
      let manualProjects: Project[] = [];
      let savedGoals = goalsSeed;
      let savedHabits = habitsSeed;
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
          savedHabits = x.habits || habitsSeed;
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
        habits,
      }),
    );
  }, [problems, projects, goals, habits]);
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2600);
  };
  const addGoal = () => { const target = Number(goalForm.target); if (!goalForm.title.trim() || !target) return; setGoals((items) => [...items, { id: Date.now(), title: goalForm.title.trim(), target, done: 0 }]); setGoalForm({ title: "", target: "" }); notify("Goal added"); };
  const addHabit = () => { if (!habitForm.title.trim()) return; setHabits((items) => [...items, { id: Date.now(), title: habitForm.title.trim(), kind: habitForm.kind, streak: 0, doneToday: false }]); setHabitForm({ ...habitForm, title: "" }); notify(habitForm.kind === "build" ? "Habit added" : "Bad-habit tracker added"); };
  const toggleHabit = (id: number) => setHabits((items) => items.map((habit) => habit.id === id ? { ...habit, doneToday: !habit.doneToday, streak: habit.doneToday ? Math.max(0, habit.streak - 1) : habit.streak + 1 } : habit));
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
            habits,
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
          <div className="live-source"><span/>Live data updates automatically</div>
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
            <div className="coding-stats">
              <article><span>LeetCode</span><b>{stats.leetcode}</b><small>Total solved</small><div className="difficulty-line"><i style={{width:`${stats.leetcode ? stats.leetcodeEasy / stats.leetcode * 100 : 0}%`}}/><i style={{width:`${stats.leetcode ? stats.leetcodeMedium / stats.leetcode * 100 : 0}%`}}/><i style={{width:`${stats.leetcode ? stats.leetcodeHard / stats.leetcode * 100 : 0}%`}}/></div></article>
              <article><span>Codeforces</span><b>{stats.cf || "—"}</b><small className="capitalize">{stats.rank} · max {stats.cfMax || "—"}</small><strong>{stats.cfSolved} recent unique solves</strong></article>
              <article><span>Activity feed</span><b>{problems.length}</b><small>Recent accepted submissions</small><strong>{new Set(problems.map((p)=>p.topic)).size} topics represented</strong></article>
            </div>
            <div className="coding-breakdown"><Panel title="LeetCode difficulty" eyebrow="PROBLEM MIX"><div className="difficulty-row easy"><span>Easy</span><b>{stats.leetcodeEasy}</b><i><em style={{width:`${stats.leetcode ? stats.leetcodeEasy / stats.leetcode * 100 : 0}%`}}/></i></div><div className="difficulty-row medium"><span>Medium</span><b>{stats.leetcodeMedium}</b><i><em style={{width:`${stats.leetcode ? stats.leetcodeMedium / stats.leetcode * 100 : 0}%`}}/></i></div><div className="difficulty-row hard"><span>Hard</span><b>{stats.leetcodeHard}</b><i><em style={{width:`${stats.leetcode ? stats.leetcodeHard / stats.leetcode * 100 : 0}%`}}/></i></div></Panel><Panel title="Platform pulse" eyebrow="LIVE RATINGS"><div className="rating-pulse"><Trophy size={26}/><div><b>{stats.cf || "—"}</b><span className="capitalize">Codeforces {stats.rank}</span></div></div><p className="dashboard-note">Submissions are fetched automatically from your connected public profiles. No manual logging needed.</p></Panel></div>
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
            <div className="split"><Panel title="Editable goals" eyebrow="DIRECTION"><div className="goal-create"><input placeholder="New goal" value={goalForm.title} onChange={(e)=>setGoalForm({...goalForm,title:e.target.value})}/><input type="number" min="1" placeholder="Target" value={goalForm.target} onChange={(e)=>setGoalForm({...goalForm,target:e.target.value})}/><button className="primary" onClick={addGoal}><Plus size={15}/>Add</button></div>{goals.map((g)=><div className="goal editable-goal" key={g.id}><div className="goal-edit-row"><input aria-label="Goal name" value={g.title} onChange={(e)=>setGoals((items)=>items.map((item)=>item.id===g.id?{...item,title:e.target.value}:item))}/><input aria-label="Current progress" type="number" min="0" max={g.target} value={g.done} onChange={(e)=>setGoals((items)=>items.map((item)=>item.id===g.id?{...item,done:Math.min(item.target,Number(e.target.value))}:item))}/><span>/</span><input aria-label="Goal target" type="number" min="1" value={g.target} onChange={(e)=>setGoals((items)=>items.map((item)=>item.id===g.id?{...item,target:Math.max(1,Number(e.target.value))}:item))}/><button className="icon" aria-label={`Delete ${g.title}`} onClick={()=>setGoals((items)=>items.filter((item)=>item.id!==g.id))}><Trash2 size={15}/></button></div><div className="progress"><i style={{width:`${Math.min(100,g.done/g.target*100)}%`}}/></div></div>)}</Panel>
            <Panel title="Today at a glance" eyebrow="CONSISTENCY"><div className="habit-summary"><div><b>{habits.filter((h)=>h.doneToday).length}/{habits.length}</b><span>check-ins today</span></div><div><b>{Math.max(0,...habits.map((h)=>h.streak))}</b><span>best streak</span></div></div><div className="contest"><CalendarDays/><div><b>Codeforces rounds</b><p>Keep competition part of the routine.</p><a href="https://codeforces.com/contests" target="_blank">View contests <ExternalLink size={14}/></a></div></div></Panel></div>
            <Panel title="Habit & bad-habit tracker" eyebrow="DAILY SYSTEM"><div className="habit-create"><input placeholder="Habit to build or break" value={habitForm.title} onChange={(e)=>setHabitForm({...habitForm,title:e.target.value})}/><select value={habitForm.kind} onChange={(e)=>setHabitForm({...habitForm,kind:e.target.value as "build"|"break"})}><option value="build">Build a habit</option><option value="break">Break a bad habit</option></select><button className="primary" onClick={addHabit}><Plus size={15}/>Add tracker</button></div><div className="habit-grid">{habits.map((habit)=><article className={`habit-card ${habit.kind} ${habit.doneToday?"checked":""}`} key={habit.id}><div><span>{habit.kind==="build"?"BUILD":"BREAK"}</span><button className="icon" aria-label={`Delete ${habit.title}`} onClick={()=>setHabits((items)=>items.filter((item)=>item.id!==habit.id))}><Trash2 size={14}/></button></div><h3>{habit.title}</h3><p><b>{habit.streak}</b> day streak</p><button onClick={()=>toggleHabit(habit.id)}>{habit.doneToday?"✓ Checked today":habit.kind==="build"?"Mark complete":"I avoided it today"}</button></article>)}</div></Panel>
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
        <div className="wop-actions"><a href="/portfolio#contact" target="_blank" className="wop-message">Contact Adarsh</a></div>
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
  return <section className="resume-wrap"><div className="print-actions"><button className="primary" onClick={() => window.print()}><Download size={16}/>Print / save PDF</button></div><article className="resume">
    <header className="resume-banner"><div className="resume-monogram">AK</div><div><h2>{config.name}</h2><p>{config.role}</p></div></header>
    <div className="resume-body"><aside className="resume-side">
      <section><h3>Contact details</h3><a href={`mailto:${config.email}`}>{config.email}</a><a href={config.githubUrl} target="_blank" rel="noreferrer">{config.githubUrl.replace(/^https?:\/\//,"")}</a><p>{config.location}</p></section>
      <section><h3>Education</h3><div className="resume-rail"><b>B.Tech, Electronics &amp; Communication Engineering</b><span>Motilal Nehru National Institute of Technology Allahabad</span><span>2024 – 2028 · CGPA 7.65</span></div></section>
      <section><h3>Core skills</h3><ul className="resume-skills"><li>Problem solving &amp; DSA</li><li>Full stack web development</li><li>REST APIs &amp; authentication</li><li>Database design</li><li>Git &amp; collaborative development</li></ul></section>
      <section><h3>Platforms</h3><p>Codeforces · Specialist</p><p>LeetCode · Algorithm practice</p><p>GitHub · Open source projects</p></section>
    </aside><div className="resume-main">
      <section><h3>Summary</h3><p className="resume-summary">{config.intro}</p></section>
      <section><h3>Selected projects</h3>
        {config.projects.map((project)=><div className="resume-project" key={project.id}><b>{project.name}</b><span>{project.stack}</span><p>{project.summary}</p></div>)}
      </section>
      <section><h3>Technologies</h3><div className="resume-tech"><div><b>Languages</b><span>JavaScript, TypeScript, C++, Python, SQL</span></div><div><b>Frontend</b><span>React, Next.js, Tailwind CSS, HTML, CSS</span></div><div><b>Backend</b><span>Node.js, Express, REST APIs, JWT, Socket.io</span></div><div><b>Data &amp; tools</b><span>PostgreSQL, MongoDB, Supabase, Docker, Git, GitHub</span></div></div></section>
      <section><h3>Achievements</h3><p className="resume-summary"><b>Codeforces Specialist</b> · First place, Hand Gesture Robot Competition at Avishkar 2025 · Featured in Amar Ujala.</p></section>
    </div></div>
  </article></section>;
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
    <section className="stack settings-stack"><div className="split">
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
        <p className="sync-status">Profiles refresh automatically when the workspace opens.</p>
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
      </Panel></div><PortfolioAdmin config={config} setConfig={setConfig} notify={notify}/>
    </section>
  );
}

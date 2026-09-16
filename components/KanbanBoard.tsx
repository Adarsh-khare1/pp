"use client";

import { useMemo } from "react";
import { ExternalLink, ArrowRight, CheckCircle2, Rocket, Lightbulb, Code2 } from "lucide-react";

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

interface KanbanBoardProps {
  projects: Project[];
  onAdvanceStage: (id: number | string) => void;
  onTogglePublic: (id: number | string) => void;
}

export default function KanbanBoard({
  projects,
  onAdvanceStage,
  onTogglePublic,
}: KanbanBoardProps) {
  const columns = useMemo(() => {
    const backlog: Project[] = [];
    const inProgress: Project[] = [];
    const shipped: Project[] = [];

    projects.forEach((p) => {
      const s = (p.status || "").toLowerCase();
      if (s === "shipped" || s === "completed" || s === "done") {
        shipped.push(p);
      } else if (s === "in progress" || s === "active" || s === "building") {
        inProgress.push(p);
      } else {
        backlog.push(p);
      }
    });

    return [
      {
        id: "backlog",
        title: "Backlog & Ideas",
        icon: Lightbulb,
        color: "amber",
        items: backlog,
        emptyText: "No projects in backlog. Add one to plan your next build.",
      },
      {
        id: "in_progress",
        title: "In Progress",
        icon: Code2,
        color: "purple",
        items: inProgress,
        emptyText: "No active builds. Advance an idea or create a new project.",
      },
      {
        id: "shipped",
        title: "Shipped & Live",
        icon: Rocket,
        color: "lime",
        items: shipped,
        emptyText: "No shipped projects yet. Complete a build and mark it shipped!",
      },
    ];
  }, [projects]);

  return (
    <div className="kanban-board">
      {columns.map((col) => (
        <div className={`kanban-column col-${col.color}`} key={col.id}>
          <div className="kanban-col-head">
            <div className="kanban-col-title">
              <col.icon size={16} />
              <h3>{col.title}</h3>
            </div>
            <span className="kanban-count-pill">{col.items.length}</span>
          </div>

          <div className="kanban-cards-stack">
            {col.items.map((project) => (
              <article className="kanban-card" key={project.id}>
                <div className="kanban-card-top">
                  <span className={`kanban-status-pill ${col.color}`}>
                    {project.status || "Active"}
                  </span>
                  <label className="privacy">
                    <input
                      type="checkbox"
                      checked={project.public}
                      onChange={() => onTogglePublic(project.id)}
                    />
                    Public
                  </label>
                </div>

                <h4>{project.name}</h4>
                <p>{project.summary}</p>

                <div className="tags kanban-tags">
                  {project.stack.split(",").map((tag) => (
                    <span key={tag}>{tag.trim()}</span>
                  ))}
                </div>

                <div className="progress kanban-progress">
                  <i style={{ width: `${project.progress}%` }} />
                </div>

                <div className="kanban-card-footer">
                  <div className="links kanban-links">
                    <a
                      href={project.repo || "https://github.com/Adarsh-khare1"}
                      target="_blank"
                      rel="noreferrer"
                      title="GitHub Repository"
                    >
                      Code <ExternalLink size={12} />
                    </a>
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noreferrer"
                        title="Live Demo"
                      >
                        Demo <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <button
                    className="kanban-advance-btn"
                    onClick={() => onAdvanceStage(project.id)}
                    title="Advance to next stage"
                  >
                    {col.id === "backlog" && (
                      <>
                        Start <ArrowRight size={13} />
                      </>
                    )}
                    {col.id === "in_progress" && (
                      <>
                        Ship <CheckCircle2 size={13} />
                      </>
                    )}
                    {col.id === "shipped" && <>Shipped ✓</>}
                  </button>
                </div>
              </article>
            ))}

            {!col.items.length && (
              <div className="kanban-empty-col">
                <p>{col.emptyText}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

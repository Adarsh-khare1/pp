"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

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

export default function PortfolioApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects.filter((p: Project) => p.public));
        }
      } catch (error) {
        console.error("Failed to fetch portfolio data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Loading portfolio...
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f4ef",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <section
          className="public-page"
          style={{ padding: 0, background: "transparent", color: "#16151b" }}
        >
          <div className="portfolio-hero">
            <p>ADARSH KHARE</p>
            <h2 style={{ color: "#16151b" }}>
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
          <h3 style={{ marginTop: "40px", color: "#16151b" }}>Selected work</h3>
          <div className="cards" style={{ marginTop: "20px" }}>
            {projects.map((p) => (
              <article className="project public" key={p.id}>
                <span className="pill done">Featured</span>
                <h3 style={{ color: "#16151b" }}>{p.name}</h3>
                <p>{p.summary}</p>
                <div className="tags">
                  {p.stack.split(",").map((s) => (
                    <span key={s}>{s.trim()}</span>
                  ))}
                </div>
              </article>
            ))}
            {!projects.length && (
              <p style={{ color: "#666" }}>No public projects available.</p>
            )}
          </div>
          <div className="timeline" style={{ color: "#16151b" }}>
            <h3 style={{ color: "#16151b" }}>Highlights</h3>
            <p>
              <b>2026</b> Built three full-stack products across security,
              competitive programming, and restaurant operations.
            </p>
            <p>
              <b>2025</b> Won the Hand Gesture Robot Competition at Avishkar;
              featured in Amar Ujala.
            </p>
            <p>
              <b>2024–2028</b> B.Tech, Electronics and Communication
              Engineering, MNNIT Allahabad.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Code2, ExternalLink, Mail, MapPin, Sparkles } from "lucide-react";

type Project = { id: number | string; name: string; summary: string; stack: string; status: string; repo: string; demo: string; public: boolean };
type ProfileData = { projects: Project[]; stats: { github: { followers: number; repos: number }; codeforces: { rating: number; rank: string }; leetcode: { solved: number } } };

export default function PortfolioApp() {
  const [data, setData] = useState<ProfileData | null>(null);
  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Profile unavailable"))))
      .then((profile: ProfileData) => setData(profile))
      .catch(() => setData({ projects: [], stats: { github: { followers: 0, repos: 0 }, codeforces: { rating: 0, rank: "" }, leetcode: { solved: 0 } } }));
  }, []);

  const projects = (data?.projects ?? []).filter((project) => project.public).slice(0, 6);
  const stats = data?.stats;

  return <main className="portfolio-app">
    <nav className="portfolio-nav">
      <a className="portfolio-mark" href="#top" aria-label="Adarsh Khare portfolio">AK<span>.</span></a>
      <div className="portfolio-nav-links"><a href="#work">Work</a><a href="#about">About</a><a href="mailto:adarshkhare269@gmail.com">Contact</a></div>
      <a className="portfolio-nav-cta" href="https://github.com/Adarsh-khare1" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={16}/></a>
    </nav>
    <section className="portfolio-intro" id="top">
      <div className="portfolio-orbit" aria-hidden="true"><span>AK</span></div>
      <p className="portfolio-eyebrow"><Sparkles size={14}/> AVAILABLE FOR INTERNSHIPS &amp; COLLABORATION</p>
      <h1>Building digital products<br/>that feel <i>alive.</i></h1>
      <p className="portfolio-lead">I&apos;m Adarsh Khare, a full stack developer in India. I turn ambitious ideas into useful, dependable web experiences.</p>
      <div className="portfolio-intro-actions"><a className="portfolio-dark-button" href="mailto:adarshkhare269@gmail.com"><Mail size={16}/> Let&apos;s work together</a><a className="portfolio-text-link" href="#work">Explore selected work <ArrowUpRight size={16}/></a></div>
    </section>
    <section className="portfolio-proof" aria-label="Developer profile summary"><div><span>Location</span><b><MapPin size={15}/> India</b></div><div><span>Focus</span><b>Full stack development</b></div><div><span>Currently</span><b>Building &amp; learning in public</b></div><div><span>GitHub</span><b>{stats ? `${stats.github.repos} public repos` : "Syncing profile…"}</b></div></section>
    <section className="portfolio-work" id="work">
      <div className="portfolio-section-heading"><p>01 / SELECTED WORK</p><h2>Repositories with<br/><i>real momentum.</i></h2><span>Live projects from GitHub, refreshed directly from the source.</span></div>
      <div className="portfolio-grid">
        {projects.map((project, index) => <article className={`portfolio-project portfolio-project-${index % 3}`} key={project.id}><div className="portfolio-project-art"><span>{String(index + 1).padStart(2, "0")}</span><Code2 size={index % 2 ? 42 : 54}/><i>{project.status}</i></div><div className="portfolio-project-copy"><p>GITHUB PROJECT <span>·</span> {project.status}</p><h3>{project.name}</h3><div className="portfolio-project-links"><a href={project.repo} target="_blank" rel="noreferrer">View repository <ExternalLink size={15}/></a>{project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Live site <ArrowUpRight size={15}/></a>}</div></div></article>)}
        {!data && <div className="portfolio-loading">Loading live work from GitHub…</div>}{data && !projects.length && <div className="portfolio-loading">No public projects are available yet. Visit GitHub to see the latest work.</div>}
      </div>
    </section>
    <section className="portfolio-about" id="about"><p>02 / ABOUT</p><div><h2>Code is my medium.<br/><i>Useful is my standard.</i></h2><p>I enjoy the whole journey: shaping an interface, designing the systems behind it, and making the final product feel fast and clear. My current work blends React, TypeScript, Node.js, databases, and thoughtful product decisions.</p><a href="https://github.com/Adarsh-khare1" target="_blank" rel="noreferrer"><Code2 size={17}/> See the code behind the work <ArrowUpRight size={16}/></a></div></section>
    <section className="portfolio-numbers"><div><b>{stats?.leetcode ?? "—"}</b><span>LeetCode problems solved</span></div><div><b>{stats?.codeforces.rating || "—"}</b><span>{stats?.codeforces.rank || "Codeforces rating"}</span></div><div><b>{stats?.github.repos ?? "—"}</b><span>Public GitHub repositories</span></div><div><b>{stats?.github.followers ?? "—"}</b><span>GitHub followers</span></div></section>
    <footer className="portfolio-footer"><a className="portfolio-mark" href="#top">AK<span>.</span></a><p>© {new Date().getFullYear()} Adarsh Khare</p><a href="mailto:adarshkhare269@gmail.com">Start a conversation <ArrowUpRight size={16}/></a></footer>
  </main>;
}

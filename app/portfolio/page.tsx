"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Code2, ExternalLink, Mail, MapPin, Sparkles, Trophy } from "lucide-react";

type ResumeProject = { id: string; name: string; summary: string; stack: string; repo: string; demo?: string; accent: string };
type ProfileData = { stats: { github: { followers: number; repos: number }; codeforces: { rating: number; rank: string } } };
const resumeProjects: ResumeProject[] = [
  { id: "cyphervault", name: "CypherVault", summary: "Secure multi-tenant access-control and identity infrastructure with rotating QR passes, duress alarms, and an audit-ledger validator.", stack: "React · Node.js · PostgreSQL · Socket.io", repo: "https://github.com/Adarsh-khare1", accent: "forest" },
  { id: "code-monk", name: "Code Monk", summary: "Competitive-programming platform with secure multi-language execution, hidden tests, AI reviews, daily challenges, badges, and leaderboards.", stack: "Next.js · TypeScript · MongoDB · Docker", repo: "https://github.com/Adarsh-khare1", accent: "coral" },
  { id: "bits-n-bites", name: "Bits N Bites", summary: "Restaurant ordering and management PWA with customer and admin dashboards, JWT roles, media uploads, and push notifications.", stack: "React · Node.js · MongoDB · Tailwind CSS", repo: "https://github.com/Adarsh-khare1", accent: "violet" },
];

export default function PortfolioApp() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Profile unavailable"))))
      .then((profile: ProfileData) => setData(profile))
      .catch(() => setData({ stats: { github: { followers: 0, repos: 0 }, codeforces: { rating: 0, rank: "" } } }));
  }, []);

  const stats = data?.stats;
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("adarshkhare269@gmail.com");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return <main className="portfolio-app">
    <nav className="portfolio-nav">
      <a className="portfolio-mark" href="#top" aria-label="Adarsh Khare portfolio">AK<span>.</span></a>
      <div className="portfolio-nav-links"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></div>
      <a className="portfolio-nav-cta" href="https://github.com/Adarsh-khare1" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={16}/></a>
    </nav>
    <section className="portfolio-intro" id="top">
      <div className="portfolio-orbit" aria-hidden="true"><span>AK</span></div>
      <p className="portfolio-eyebrow"><Sparkles size={14}/> AVAILABLE FOR INTERNSHIPS &amp; COLLABORATION</p>
      <h1>Building digital products<br/>that feel <i>alive.</i></h1>
      <p className="portfolio-lead">I&apos;m Adarsh Khare, a full stack developer in India. I turn ambitious ideas into useful, dependable web experiences.</p>
      <div className="portfolio-intro-actions"><a className="portfolio-dark-button" href="#contact"><Mail size={16}/> Let&apos;s work together</a><a className="portfolio-text-link" href="#work">Explore selected work <ArrowUpRight size={16}/></a></div>
    </section>
    <section className="portfolio-proof" aria-label="Developer profile summary"><div><span>Location</span><b><MapPin size={15}/> India</b></div><div><span>Focus</span><b>Full stack development</b></div><div><span>Currently</span><b>Building &amp; learning in public</b></div><div><span>Codeforces</span><b>{stats?.codeforces.rating || "Syncing rating…"}</b></div></section>
    <section className="portfolio-work" id="work">
      <div className="portfolio-section-heading"><p>01 / SELECTED WORK</p><h2>Projects with<br/><i>real momentum.</i></h2><span>A focused selection from my resume and hands-on product work.</span></div>
      <div className="portfolio-grid">
        {resumeProjects.map((project, index) => <article className={`portfolio-project portfolio-project-${index % 3}`} key={project.id}><div className={`portfolio-project-art portfolio-art-${project.accent}`}><span>{String(index + 1).padStart(2, "0")}</span><Code2 size={index % 2 ? 42 : 54}/><i>Resume project</i></div><div className="portfolio-project-copy"><p>SELECTED WORK <span>·</span> {project.stack}</p><h3>{project.name}</h3><p className="portfolio-project-summary">{project.summary}</p><div className="portfolio-project-links"><a href={project.repo} target="_blank" rel="noreferrer">View GitHub <ExternalLink size={15}/></a>{project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Live site <ArrowUpRight size={15}/></a>}</div></div></article>)}
      </div>
    </section>
    <section className="portfolio-about" id="about"><p>02 / ABOUT</p><div><h2>Code is my medium.<br/><i>Useful is my standard.</i></h2><p>I enjoy the whole journey: shaping an interface, designing the systems behind it, and making the final product feel fast and clear. My current work blends React, TypeScript, Node.js, databases, and thoughtful product decisions.</p><a href="https://github.com/Adarsh-khare1" target="_blank" rel="noreferrer"><Code2 size={17}/> See the code behind the work <ArrowUpRight size={16}/></a></div></section>
    <section className="portfolio-numbers"><div><Trophy size={20}/><b>{stats?.codeforces.rating || "—"}</b><span>{stats?.codeforces.rank || "Codeforces rating"}</span></div><div><Code2 size={20}/><b>{stats?.github.repos ?? "—"}</b><span>GitHub public repositories</span></div><div><Trophy size={20}/><b>Specialist</b><span>Competitive programming tier</span></div><div><Code2 size={20}/><b>{stats?.github.followers ?? "—"}</b><span>GitHub followers</span></div></section>
    <section className="portfolio-contact" id="contact"><p>03 / CONTACT</p><div><h2>Have an idea worth<br/><i>building?</i></h2><p>I&apos;m open to internships, collaborations, and thoughtful product conversations.</p><div className="portfolio-contact-actions"><button type="button" className="contact-primary" onClick={copyEmail}><Mail size={16}/>{copied ? "Email copied" : "Copy email address"}</button><a href="https://mail.google.com/mail/?view=cm&fs=1&to=adarshkhare269@gmail.com&su=Portfolio%20enquiry" target="_blank" rel="noreferrer">Open Gmail compose <ArrowUpRight size={16}/></a></div><code>adarshkhare269@gmail.com</code><small className="contact-hint">Copy the address to use any mail app, or open a pre-addressed Gmail draft.</small></div></section>
    <footer className="portfolio-footer"><a className="portfolio-mark" href="#top">AK<span>.</span></a><p>© {new Date().getFullYear()} Adarsh Khare</p><a href="#contact">Start a conversation <ArrowUpRight size={16}/></a></footer>
  </main>;
}

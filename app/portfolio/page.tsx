"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Code2, ExternalLink, Mail, MapPin, Sparkles, Trophy } from "lucide-react";
import { defaultPortfolioConfig, PortfolioConfig, readPortfolioConfig } from "@/lib/portfolio-config";

type ProfileData = { stats: { github: { followers: number; repos: number }; codeforces: { rating: number; rank: string } } };

export default function PortfolioApp() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [config, setConfig] = useState<PortfolioConfig>(defaultPortfolioConfig);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", company: "" });
  const [sending, setSending] = useState(false);
  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setConfig(readPortfolioConfig()), 0);
    const onUpdate = (event: Event) => setConfig((event as CustomEvent<PortfolioConfig>).detail);
    window.addEventListener("portfolio-config-updated", onUpdate);
    fetch("/api/profile", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((profile: ProfileData) => setData(profile)).catch(() => setData({ stats: { github: { followers: 0, repos: 0 }, codeforces: { rating: 0, rank: "" } } }));
    return () => { window.clearTimeout(timer); window.removeEventListener("portfolio-config-updated", onUpdate); };
  }, []);

  const stats = data?.stats;
  const copyEmail = async () => { try { await navigator.clipboard.writeText(config.email); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } };
  const sendMessage = async (event: React.FormEvent) => { event.preventDefault(); setSending(true); setFormStatus(""); try { const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Message failed."); setForm({ name: "", email: "", subject: "", message: "", company: "" }); setFormStatus("Message sent. I'll get back to you soon."); } catch (error) { setFormStatus(error instanceof Error ? error.message : "Message failed."); } finally { setSending(false); } };
  const initials = config.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  return <main className="portfolio-app">
    <nav className="portfolio-nav"><a className="portfolio-mark" href="#top" aria-label={`${config.name} portfolio`}>{initials}<span>.</span></a><div className="portfolio-nav-links"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></div><a className="portfolio-nav-cta" href={config.githubUrl} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={16}/></a></nav>
    <section className="portfolio-intro" id="top"><div className="portfolio-orbit" aria-hidden="true"><span>{initials}</span></div><p className="portfolio-eyebrow"><Sparkles size={14}/> {config.availability}</p><h1>{config.headline}</h1><p className="portfolio-lead">{config.intro}</p><div className="portfolio-intro-actions"><a className="portfolio-dark-button" href="#contact"><Mail size={16}/> Let&apos;s work together</a><a className="portfolio-text-link" href="#work">Explore selected work <ArrowUpRight size={16}/></a></div></section>
    <section className="portfolio-proof" aria-label="Developer profile summary"><div><span>Location</span><b><MapPin size={15}/> {config.location}</b></div><div><span>Focus</span><b>{config.role}</b></div><div><span>Currently</span><b>{config.availability.toLowerCase()}</b></div><div><span>Codeforces</span><b>{stats?.codeforces.rating || "Syncing rating…"}</b></div></section>
    <section className="portfolio-work" id="work"><div className="portfolio-section-heading"><p>01 / SELECTED WORK</p><h2>Projects with<br/><i>real momentum.</i></h2><span>A focused selection from my resume and hands-on product work.</span></div><div className="portfolio-grid">{config.projects.map((project, index) => <article className={`portfolio-project portfolio-project-${index % 3}`} key={project.id}><div className={`portfolio-project-art portfolio-art-${project.accent}`}><span>{String(index + 1).padStart(2, "0")}</span><Code2 size={index % 2 ? 42 : 54}/><i>Resume project</i></div><div className="portfolio-project-copy"><p>SELECTED WORK <span>·</span> {project.stack}</p><h3>{project.name}</h3><p className="portfolio-project-summary">{project.summary}</p><div className="portfolio-project-links"><a href={project.repo} target="_blank" rel="noreferrer">View GitHub <ExternalLink size={15}/></a>{project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Live site <ArrowUpRight size={15}/></a>}</div></div></article>)}</div></section>
    <section className="portfolio-about" id="about"><p>02 / ABOUT</p><div><h2>Code is my medium.<br/><i>Useful is my standard.</i></h2><p>{config.about}</p><a href={config.githubUrl} target="_blank" rel="noreferrer"><Code2 size={17}/> See the code behind the work <ArrowUpRight size={16}/></a></div></section>
    <section className="portfolio-numbers"><div><Trophy size={20}/><b>{stats?.codeforces.rating || "—"}</b><span>{stats?.codeforces.rank || "Codeforces rating"}</span></div><div><Code2 size={20}/><b>{stats?.github.repos ?? "—"}</b><span>GitHub public repositories</span></div><div><Trophy size={20}/><b>Specialist</b><span>Competitive programming tier</span></div><div><Code2 size={20}/><b>{stats?.github.followers ?? "—"}</b><span>GitHub followers</span></div></section>
    <section className="portfolio-contact" id="contact"><p>03 / CONTACT</p><div><h2>Have an idea worth<br/><i>building?</i></h2><p>Send a message directly from the portfolio. Replies will go to the email address you provide.</p><form className="portfolio-contact-form" onSubmit={sendMessage}><div><label>Name<input required minLength={2} value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label><label>Email<input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label></div><label>Subject<input value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})}/></label><label>Message<textarea required minLength={10} value={form.message} onChange={(e)=>setForm({...form,message:e.target.value})}/></label><input className="contact-honeypot" tabIndex={-1} autoComplete="off" value={form.company} onChange={(e)=>setForm({...form,company:e.target.value})}/><button type="submit" disabled={sending}><Mail size={16}/>{sending ? "Sending…" : "Send message"}</button>{formStatus && <output>{formStatus}</output>}</form><div className="portfolio-contact-fallback"><button type="button" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"}</button><code>{config.email}</code></div></div></section>
    <footer className="portfolio-footer"><a className="portfolio-mark" href="#top">{initials}<span>.</span></a><p>© {new Date().getFullYear()} {config.name}</p><a href="#contact">Start a conversation <ArrowUpRight size={16}/></a></footer>
  </main>;
}

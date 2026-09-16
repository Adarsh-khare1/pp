export type PortfolioProject = {
  id: string;
  name: string;
  summary: string;
  stack: string;
  repo: string;
  demo: string;
  accent: "forest" | "coral" | "violet";
};

export type PortfolioConfig = {
  name: string;
  role: string;
  availability: string;
  headline: string;
  intro: string;
  about: string;
  email: string;
  location: string;
  githubUrl: string;
  projects: PortfolioProject[];
};

export const PORTFOLIO_STORAGE_KEY = "codefolio-portfolio-config-v1";

export const defaultPortfolioConfig: PortfolioConfig = {
  name: "Adarsh Khare",
  role: "Full Stack Developer",
  availability: "AVAILABLE FOR INTERNSHIPS & COLLABORATION",
  headline: "Building digital products that feel alive.",
  intro: "I'm Adarsh Khare, a full stack developer in India. I turn ambitious ideas into useful, dependable web experiences.",
  about: "I enjoy the whole journey: shaping an interface, designing the systems behind it, and making the final product feel fast and clear. My current work blends React, TypeScript, Node.js, databases, and thoughtful product decisions.",
  email: "adarshkhare269@gmail.com",
  location: "Prayagraj, India",
  githubUrl: "https://github.com/Adarsh-khare1",
  projects: [
    { id: "cyphervault", name: "CypherVault", summary: "Secure multi-tenant access-control and identity infrastructure with rotating QR passes, duress alarms, and an audit-ledger validator.", stack: "React · Node.js · PostgreSQL · Socket.io", repo: "https://github.com/Adarsh-khare1", demo: "", accent: "forest" },
    { id: "code-monk", name: "Code Monk", summary: "Competitive-programming platform with secure multi-language execution, hidden tests, AI reviews, daily challenges, badges, and leaderboards.", stack: "Next.js · TypeScript · MongoDB · Docker", repo: "https://github.com/Adarsh-khare1", demo: "", accent: "coral" },
    { id: "bits-n-bites", name: "Bits N Bites", summary: "Restaurant ordering and management PWA with customer and admin dashboards, JWT roles, media uploads, and push notifications.", stack: "React · Node.js · MongoDB · Tailwind CSS", repo: "https://github.com/Adarsh-khare1", demo: "", accent: "violet" },
  ],
};

export function readPortfolioConfig(): PortfolioConfig {
  if (typeof window === "undefined") return defaultPortfolioConfig;
  try {
    const saved = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    return saved ? { ...defaultPortfolioConfig, ...JSON.parse(saved) } : defaultPortfolioConfig;
  } catch {
    return defaultPortfolioConfig;
  }
}

export function savePortfolioConfig(config: PortfolioConfig) {
  window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("portfolio-config-updated", { detail: config }));
}

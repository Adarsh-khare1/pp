"use client";

import { useMemo } from "react";
import { Brain, Award } from "lucide-react";

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

interface TopicMasteryProps {
  problems: Problem[];
}

export default function TopicMastery({ problems }: TopicMasteryProps) {
  const topicStats = useMemo(() => {
    const counts: Record<string, { count: number; easy: number; medium: number; hard: number }> = {};
    const total = problems.length;

    problems.forEach((p) => {
      const rawTopic = p.topic?.trim() || "General";
      // Normalize common synonyms
      let topic = rawTopic;
      const lower = rawTopic.toLowerCase();
      if (lower.includes("dp") || lower.includes("dynamic")) topic = "Dynamic Programming";
      else if (lower.includes("tree") || lower.includes("bst")) topic = "Trees & BST";
      else if (lower.includes("graph") || lower.includes("dfs") || lower.includes("bfs")) topic = "Graphs & BFS/DFS";
      else if (lower.includes("binary search")) topic = "Binary Search";
      else if (lower.includes("greedy")) topic = "Greedy";
      else if (lower.includes("math") || lower.includes("number theory")) topic = "Math & Number Theory";
      else if (lower.includes("string")) topic = "Strings & Parsing";
      else if (lower.includes("two pointer") || lower.includes("sliding window")) topic = "Two Pointers / Sliding Window";
      else if (lower.includes("array") || lower.includes("matrix") || lower.includes("hash")) topic = "Arrays & Hash Tables";
      else if (lower.includes("stack") || lower.includes("queue") || lower.includes("heap")) topic = "Stacks, Queues & Heaps";

      if (!counts[topic]) {
        counts[topic] = { count: 0, easy: 0, medium: 0, hard: 0 };
      }
      counts[topic].count += 1;
      const diff = (p.difficulty || "").toLowerCase();
      if (diff.includes("easy")) counts[topic].easy += 1;
      else if (diff.includes("hard")) counts[topic].hard += 1;
      else counts[topic].medium += 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
        easy: data.easy,
        medium: data.medium,
        hard: data.hard,
        level:
          data.count >= 8
            ? "Mastered"
            : data.count >= 4
              ? "Proficient"
              : "Practicing",
      }))
      .sort((a, b) => b.count - a.count);

    return { items: sorted.slice(0, 8), total };
  }, [problems]);

  if (!problems.length) {
    return null;
  }

  return (
    <article className="panel topic-mastery-panel">
      <div className="topic-mastery-head">
        <div>
          <p className="kicker">ALGORITHMIC SKILL RADAR</p>
          <h2>Topic Mastery & Domain Breakdown</h2>
        </div>
        <div className="mastery-summary-pill">
          <Brain size={15} />
          <span>{topicStats.items.length} Active Domains Analyzed</span>
        </div>
      </div>

      <p className="dashboard-note">
        Real-time problem distribution synthesized from your live LeetCode and Codeforces accepted submissions.
      </p>

      <div className="mastery-grid">
        {topicStats.items.map((item) => (
          <div className="mastery-card" key={item.name}>
            <div className="mastery-card-header">
              <div className="mastery-card-info">
                <b>{item.name}</b>
                <span className={`mastery-badge badge-${item.level.toLowerCase()}`}>
                  {item.level === "Mastered" && <Award size={11} />}
                  {item.level}
                </span>
              </div>
              <span className="mastery-count-text">
                <strong>{item.count}</strong> solved ({item.percentage}%)
              </span>
            </div>

            <div className="mastery-bar-track">
              <div
                className="mastery-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(8, item.percentage * 2))}%`,
                }}
              />
            </div>

            <div className="mastery-diff-dots">
              {item.easy > 0 && <span className="diff-dot easy">{item.easy}E</span>}
              {item.medium > 0 && <span className="diff-dot medium">{item.medium}M</span>}
              {item.hard > 0 && <span className="diff-dot hard">{item.hard}H</span>}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

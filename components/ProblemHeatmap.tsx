"use client";

import { useMemo, useState } from "react";
import { Flame, Calendar } from "lucide-react";

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

interface ProblemHeatmapProps {
  problems: Problem[];
}

export default function ProblemHeatmap({ problems }: ProblemHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
  } | null>(null);

  const heatmapData = useMemo(() => {
    // Generate dates for past 16 weeks (112 days)
    const counts: Record<string, number> = {};
    problems.forEach((p) => {
      const d = (p.date || "").slice(0, 10);
      if (d) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });

    const now = new Date();
    // Align to Sunday or end of week
    const days: Array<{
      date: string;
      count: number;
      level: number;
      dayOfWeek: number;
      monthLabel?: string;
    }> = [];

    let totalPeriodSolves = 0;
    let maxInDay = 0;

    // Generate 112 days backwards from today
    for (let i = 111; i >= 0; i--) {
      const current = new Date(now.getTime() - i * 86400 * 1000);
      const dateStr = current.toISOString().slice(0, 10);
      const count = counts[dateStr] || 0;
      totalPeriodSolves += count;
      if (count > maxInDay) maxInDay = count;

      let level = 0;
      if (count >= 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;

      // Add month label on the first day of month or start of week
      const isStartOfMonth = current.getDate() === 1;
      const monthLabel = isStartOfMonth
        ? current.toLocaleString("default", { month: "short" })
        : undefined;

      days.push({
        date: dateStr,
        count,
        level,
        dayOfWeek: current.getDay(), // 0 = Sun, 1 = Mon ...
        monthLabel,
      });
    }

    // Group into 16 columns of 7 days
    const columns: Array<typeof days> = [];
    for (let i = 0; i < days.length; i += 7) {
      columns.push(days.slice(i, i + 7));
    }

    // Calculate current streak
    let currentStreak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        currentStreak++;
      } else {
        // If today is empty, allow streak from yesterday
        if (i === days.length - 1) continue;
        break;
      }
    }

    return {
      columns,
      totalPeriodSolves,
      maxInDay,
      currentStreak,
    };
  }, [problems]);

  return (
    <article className="panel heatmap-panel">
      <div className="heatmap-header">
        <div>
          <p className="kicker">UNIFIED PROBLEM ACTIVITY</p>
          <h2>Cross-Platform Activity Heatmap</h2>
        </div>
        <div className="heatmap-stats-pill-group">
          <div className="heatmap-pill">
            <Calendar size={13} />
            <span>
              <strong>{heatmapData.totalPeriodSolves}</strong> solves in 16 wks
            </span>
          </div>
          <div className="heatmap-pill streak-pill">
            <Flame size={13} />
            <span>
              <strong>{heatmapData.currentStreak}d</strong> active streak
            </span>
          </div>
        </div>
      </div>

      <p className="dashboard-note">
        Aggregated accepted solutions from LeetCode and Codeforces over the past 112 days.
      </p>

      <div className="heatmap-container">
        <div className="heatmap-day-labels">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        <div className="heatmap-scroll-area">
          <div className="heatmap-matrix">
            {heatmapData.columns.map((col, colIdx) => (
              <div className="heatmap-col" key={colIdx}>
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    className={`heatmap-cell level-${cell.level}`}
                    title={`${cell.date}: ${cell.count} problem${cell.count === 1 ? "" : "s"} solved`}
                    onMouseEnter={() =>
                      setHoveredDay({ date: cell.date, count: cell.count })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-footer">
        <div className="heatmap-hover-info">
          {hoveredDay ? (
            <span>
              <b>{hoveredDay.date}</b>: {hoveredDay.count} problem
              {hoveredDay.count === 1 ? "" : "s"} solved
            </span>
          ) : (
            <span>Hover over any cell to see daily breakdown</span>
          )}
        </div>

        <div className="heatmap-legend">
          <small>Less</small>
          <span className="heatmap-cell level-0" />
          <span className="heatmap-cell level-1" />
          <span className="heatmap-cell level-2" />
          <span className="heatmap-cell level-3" />
          <small>More</small>
        </div>
      </div>
    </article>
  );
}

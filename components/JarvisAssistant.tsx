"use client";

import { useState } from "react";
import { Bell, Bot, Mic, Send, Volume2, X } from "lucide-react";

type Goal = { id: number; title: string; target: number; done: number };
type Habit = {
  id: number;
  title: string;
  kind: "build" | "break";
  streak: number;
  doneToday: boolean;
  history: string[];
};
type Reminder = {
  id: number;
  title: string;
  remindAt: string;
  completed: boolean;
  notified?: boolean;
};
type UpcomingContest = {
  id: number;
  name: string;
  type: string;
  durationSeconds: number;
  relativeTimeSeconds: number;
  startTime: string;
  url: string;
};
type UpsolveProblem = {
  id: string;
  title: string;
  contestId: number;
  index: string;
  rating?: number;
  tags: string[];
  verdict: string;
  date: string;
  url: string;
};
type Message = { role: "jarvis" | "user"; text: string };
type SpeechRecognitionCtor = new () => {
  lang: string;
  start: () => void;
  onresult: (event: { results: { 0: { transcript: string } }[] }) => void;
  onerror: () => void;
};

export default function JarvisAssistant({
  setView,
  goals,
  setGoals,
  habits,
  setHabits,
  reminders,
  setReminders,
  notify,
  contests = [],
  upsolvingQueue = [],
}: {
  setView: React.Dispatch<React.SetStateAction<string>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  notify: (message: string) => void;
  contests?: UpcomingContest[];
  upsolvingQueue?: UpsolveProblem[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "jarvis",
      text: "Hello, Adarsh. I can navigate the workspace, add goals and habits, schedule reminders, and help choose your next move.",
    },
  ]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };
  const answer = (text: string) => {
    setMessages((items) => [...items, { role: "jarvis", text }]);
    speak(text);
  };
  const handle = (raw = input) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((items) => [...items, { role: "user", text }]);
    setInput("");
    const lower = text.toLowerCase();
    const pages: Record<string, string> = {
      home: "overview",
      overview: "overview",
      dashboard: "journal",
      coding: "journal",
      projects: "projects",
      goals: "goals",
      habits: "goals",
      portfolio: "portfolio",
      resume: "resume",
      settings: "settings",
    };
    const destination = Object.entries(pages).find(
      ([name]) =>
        lower.includes(`open ${name}`) || lower.includes(`go to ${name}`),
    );
    if (destination) {
      setView(destination[1]);
      answer(`Opening ${destination[0]}.`);
      return;
    }
    const goalMatch = text.match(
      /(?:add|create) (?:a )?goal(?: called)?\s+(.+?)(?:\s+target\s+(\d+))?$/i,
    );
    if (goalMatch) {
      const title = goalMatch[1].trim();
      const target = Number(goalMatch[2] || 1);
      setGoals((items) => [
        ...items,
        { id: Date.now(), title, target, done: 0 },
      ]);
      answer(`Goal added: ${title}.`);
      return;
    }
    const habitMatch = text.match(
      /(?:add|create) (?:a )?(bad )?habit(?: called)?\s+(.+)$/i,
    );
    if (habitMatch) {
      const kind = habitMatch[1] ? "break" : "build";
      const title = habitMatch[2].trim();
      setHabits((items) => [
        ...items,
        {
          id: Date.now(),
          title,
          kind,
          streak: 0,
          doneToday: false,
          history: [],
        },
      ]);
      answer(
        `${kind === "break" ? "Bad-habit tracker" : "Habit"} added: ${title}.`,
      );
      return;
    }
    const reminderMatch = text.match(
      /remind me (?:to )?(.+?)\s+(?:at|on)\s+(.+)$/i,
    );
    if (reminderMatch) {
      const when = new Date(reminderMatch[2]);
      if (!Number.isNaN(when.getTime())) {
        setReminders((items) => [
          ...items,
          {
            id: Date.now(),
            title: reminderMatch[1].trim(),
            remindAt: when.toISOString(),
            completed: false,
          },
        ]);
        answer(`Reminder scheduled for ${when.toLocaleString()}.`);
        return;
      }
      answer(
        "I could not understand that time. Try: remind me to exercise at 2026-09-18 07:00.",
      );
      return;
    }
    if (/contest|competition|next round|when is the next/.test(lower)) {
      if (contests && contests.length > 0) {
        const next = contests[0];
        const days = Math.floor(next.relativeTimeSeconds / 86400);
        const hours = Math.floor((next.relativeTimeSeconds % 86400) / 3600);
        const timeStr =
          days > 0 ? `in ${days} days and ${hours} hours` : `in ${hours} hours`;
        answer(
          `The next contest on Codeforces is ${next.name}, starting ${timeStr}.`,
        );
        return;
      }
      answer("No upcoming contests found on Codeforces at the moment.");
      return;
    }
    if (
      /upsolve|unsolved|practice problem|failed problem|what should i upsolve/.test(
        lower,
      )
    ) {
      if (upsolvingQueue && upsolvingQueue.length > 0) {
        const prob = upsolvingQueue[0];
        answer(
          `I recommend upsolving "${prob.title}" from contest ${prob.contestId}, problem ${prob.index}${prob.rating ? ` with rating ${prob.rating}` : ""}. Your last verdict was ${prob.verdict}.`,
        );
        return;
      }
      answer(
        "You currently have no unaccepted problems in your upsolving queue. Great job!",
      );
      return;
    }
    if (/what should i do|next move|brief me|my day/.test(lower)) {
      const goal = goals.find((item) => item.done < item.target);
      const dueHabits = habits.filter(
        (item) => !item.history.includes(new Date().toISOString().slice(0, 10)),
      );
      const next = reminders
        .filter((item) => !item.completed)
        .sort((a, b) => a.remindAt.localeCompare(b.remindAt))[0];
      answer(
        `${goal ? `Focus on ${goal.title}.` : "Your goals are clear."} ${dueHabits.length ? `${dueHabits.length} habits still need a check-in.` : "Today's habits are complete."} ${next ? `Your next reminder is ${next.title}.` : "You have no active reminders."}`,
      );
      return;
    }
    answer(
      "I can open pages, tell you upcoming contests, recommend upsolving problems, add a goal or habit, schedule a reminder, or brief your day. Try “when is the next contest?” or “what should I upsolve?”",
    );
  };
  const listen = () => {
    const win = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) {
      notify("Voice recognition is not supported in this browser");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    setListening(true);
    recognition.onresult = (event) => {
      const value = event.results[0][0].transcript;
      setListening(false);
      setInput(value);
      handle(value);
    };
    recognition.onerror = () => {
      setListening(false);
      notify("I could not hear that. Please try again.");
    };
    recognition.start();
  };
  const enableNotifications = async () => {
    if (!("Notification" in window))
      return notify("Notifications are not supported here");
    const result = await Notification.requestPermission();
    notify(
      result === "granted"
        ? "Jarvis notifications enabled"
        : "Notification permission was not enabled",
    );
  };
  return (
    <>
      <button
        className="jarvis-orb"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open Jarvis assistant"
      >
        <span />
        <Bot size={23} />
        <b>JARVIS</b>
      </button>
      {open && (
        <aside className="jarvis-panel" aria-label="Jarvis assistant">
          <header>
            <div>
              <span className="jarvis-status" />
              <div>
                <b>Jarvis</b>
                <small>Workspace assistant · online</small>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close Jarvis">
              <X size={18} />
            </button>
          </header>
          <div className="jarvis-messages">
            {messages.map((message, index) => (
              <div key={index} className={`jarvis-message ${message.role}`}>
                {message.text}
                {message.role === "jarvis" && (
                  <button
                    onClick={() => speak(message.text)}
                    aria-label="Read response"
                  >
                    <Volume2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="jarvis-suggestions">
            <button onClick={() => handle("When is the next contest?")}>
              Next contest
            </button>
            <button onClick={() => handle("What should I upsolve?")}>
              Upsolve advice
            </button>
            <button onClick={() => handle("What should I do?")}>
              Brief my day
            </button>
            <button onClick={enableNotifications}>
              <Bell size={13} /> Enable alerts
            </button>
          </div>
          <div className="jarvis-input">
            <button
              className={listening ? "listening" : ""}
              onClick={listen}
              aria-label="Talk to Jarvis"
            >
              <Mic size={18} />
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handle()}
              placeholder="Ask Jarvis…"
            />
            <button onClick={() => handle()} aria-label="Send">
              <Send size={17} />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

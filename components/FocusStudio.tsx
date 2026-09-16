"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2 } from "lucide-react";

type TimerMode = "pomodoro" | "deep" | "break";

interface FocusStudioProps {
  onSessionComplete?: (minutes: number) => void;
}

export default function FocusStudio({ onSessionComplete }: FocusStudioProps) {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundscape, setSoundscape] = useState<"none" | "rain" | "drone">("none");
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodeRef = useRef<{ stop: () => void } | null>(null);

  // Set default time when mode changes
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === "pomodoro") setTimeLeft(25 * 60);
    else if (newMode === "deep") setTimeLeft(50 * 60);
    else if (newMode === "break") setTimeLeft(5 * 60);
  };

  const totalTimeForMode = mode === "pomodoro" ? 25 * 60 : mode === "deep" ? 50 * 60 : 5 * 60;
  const progressPercent = Math.min(100, Math.round(((totalTimeForMode - timeLeft) / totalTimeForMode) * 100));

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setCompletedSessions((c) => c + 1);
          if (onSessionComplete) {
            onSessionComplete(mode === "pomodoro" ? 25 : mode === "deep" ? 50 : 5);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, onSessionComplete]);

  // Ambient sound synthesizer
  useEffect(() => {
    if (soundNodeRef.current) {
      soundNodeRef.current.stop();
      soundNodeRef.current = null;
    }

    if (soundscape === "none" || !isRunning) {
      return;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (soundscape === "rain") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 850;

        const gain = ctx.createGain();
        gain.gain.value = 0.25;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();

        soundNodeRef.current = {
          stop: () => {
            try { noise.stop(); } catch {}
          },
        };
      } else if (soundscape === "drone") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.value = 65.41;
        osc2.type = "sine";
        osc2.frequency.value = 66.41;

        gain.gain.value = 0.12;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        soundNodeRef.current = {
          stop: () => {
            try { osc1.stop(); osc2.stop(); } catch {}
          },
        };
      }
    } catch {}

    return () => {
      if (soundNodeRef.current) {
        soundNodeRef.current.stop();
        soundNodeRef.current = null;
      }
    };
  }, [soundscape, isRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="focus-studio-card">
      <div className="focus-studio-header">
        <div className="focus-title-group">
          <Sparkles size={16} className="focus-icon" />
          <b>Focus Studio</b>
          <span className="focus-mode-badge">{mode.toUpperCase()}</span>
        </div>
        <div className="focus-sound-picker">
          <button
            className={`sound-chip ${soundscape === "none" ? "active" : ""}`}
            onClick={() => setSoundscape("none")}
            title="Mute ambient sound"
          >
            <VolumeX size={12} /> Silent
          </button>
          <button
            className={`sound-chip ${soundscape === "rain" ? "active" : ""}`}
            onClick={() => setSoundscape("rain")}
            title="Cyberpunk Rain background"
          >
            <Volume2 size={12} /> Rain
          </button>
          <button
            className={`sound-chip ${soundscape === "drone" ? "active" : ""}`}
            onClick={() => setSoundscape("drone")}
            title="Deep Space Drone"
          >
            <Volume2 size={12} /> Drone
          </button>
        </div>
      </div>

      <div className="focus-timer-display">
        <div className="digital-clock">{formatTime(timeLeft)}</div>
        <div className="focus-progress-bar">
          <div className="focus-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="focus-controls">
        <div className="mode-toggle-group">
          <button
            className={`mode-btn ${mode === "pomodoro" ? "active" : ""}`}
            onClick={() => handleModeChange("pomodoro")}
          >
            25m Pomodoro
          </button>
          <button
            className={`mode-btn ${mode === "deep" ? "active" : ""}`}
            onClick={() => handleModeChange("deep")}
          >
            50m Deep Work
          </button>
          <button
            className={`mode-btn ${mode === "break" ? "active" : ""}`}
            onClick={() => handleModeChange("break")}
          >
            5m Break
          </button>
        </div>

        <div className="action-buttons">
          <button
            className={`focus-main-btn ${isRunning ? "pause" : "start"}`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <>
                <Pause size={14} /> Pause
              </>
            ) : (
              <>
                <Play size={14} /> Start Session
              </>
            )}
          </button>
          <button
            className="focus-reset-btn"
            onClick={() => {
              setIsRunning(false);
              handleModeChange(mode);
            }}
            title="Reset timer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="focus-footer">
        <span>
          <CheckCircle2 size={13} /> {completedSessions} sessions completed today
        </span>
        <span className="ambient-status">
          {soundscape !== "none" && isRunning ? `Ambient: ${soundscape}` : "Focus Terminal Ready"}
        </span>
      </div>
    </div>
  );
}

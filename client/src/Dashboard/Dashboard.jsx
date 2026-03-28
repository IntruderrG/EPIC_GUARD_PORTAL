import { useAuth } from "../Context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Animated counter hook ──────────────────────────────────────────
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return value;
}

// ── Pulse dot ─────────────────────────────────────────────────────
function PulseDot({ active }) {
  return (
    <span className="relative flex h-3 w-3">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${
          active ? "bg-yellow-400" : "bg-zinc-600"
        }`}
      />
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, unit = "", accent = false }) {
  const displayed = useCountUp(typeof value === "number" ? value : 0);
  return (
    <div
      className={`
        rounded-2xl p-5 border flex flex-col gap-1
        ${
          accent ?
            "bg-yellow-400 border-yellow-300"
          : "bg-zinc-900 border-zinc-800"
        }
      `}
    >
      <span
        className={`text-xs font-medium tracking-widest uppercase ${
          accent ? "text-yellow-900" : "text-zinc-500"
        }`}
        style={{ fontSize: "clamp(0.6rem, 1.5vw, 0.7rem)" }}
      >
        {label}
      </span>
      <span
        className={`font-bold leading-none ${
          accent ? "text-black" : "text-white"
        }`}
        style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}
      >
        {typeof value === "number" ? displayed : value}
        {unit && (
          <span
            className={`font-normal ml-1 ${
              accent ? "text-yellow-800" : "text-zinc-500"
            }`}
            style={{ fontSize: "clamp(0.8rem, 2vw, 1rem)" }}
          >
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

// ── Alert item ────────────────────────────────────────────────────
function AlertItem({ time, message, level }) {
  const colors = {
    high: "border-red-800 bg-red-950 text-red-400",
    medium: "border-yellow-800 bg-yellow-950 text-yellow-400",
    low: "border-zinc-700 bg-zinc-900 text-zinc-400",
  };
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${colors[level]}`}
    >
      <div className="mt-0.5 shrink-0">
        {level === "high" && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {level === "medium" && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8v4m0 4h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {level === "low" && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 16v-4m0-4h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{message}</p>
        <p className="text-xs opacity-60 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const guardName = user?.name || "Guard";
  const [streamOnline, setStreamOnline] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState({
    headCount: 0,
    peakToday: 0,
    uptime: "00:00",
    zone: "Main Gate",
  });

  // ── Clock ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── WebSocket — receives live metrics from EC2-Model ───────────
  // Replace WS_URL with your actual EC2-Model WebSocket endpoint
  const WS_URL = import.meta.env.VITE_METRICS_WS_URL || "ws://localhost:4001";
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setStreamOnline(true);

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          // Expected shape: { headCount, peakToday, uptime, zone }
          setMetrics((prev) => ({ ...prev, ...data }));
        } catch (_) {}
      };

      ws.onclose = () => {
        setStreamOnline(false);
        // Auto-reconnect after 3s
        setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  // ── Sample alerts (replace with real WS events) ────────────────
  const alerts = [
    {
      time: "Just now",
      message: "Head count exceeded threshold — 47 people detected",
      level: "high",
    },
    {
      time: "4 min ago",
      message: "Camera feed momentarily dropped, auto-recovered",
      level: "medium",
    },
    {
      time: "18 min ago",
      message: "Shift started — stream connected successfully",
      level: "low",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("guardName");
    navigate("/");
  };

  const timeStr = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const dateStr = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Grid background ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#FFD700 1px,transparent 1px),linear-gradient(90deg,#FFD700 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Top navbar ── */}
      <header className="relative border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path
                  d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
                  fill="#000"
                />
              </svg>
            </div>
            <span
              className="font-bold text-yellow-400 tracking-tight"
              style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)" }}
            >
              CYBERWARDEN
            </span>
          </div>

          {/* Guard info + logout */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex items-center gap-2">
              <PulseDot active={streamOnline} />
              <span
                className="text-zinc-400"
                style={{ fontSize: "clamp(0.7rem, 2vw, 0.8rem)" }}
              >
                {streamOnline ? "Stream live" : "Stream offline"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                className="text-white font-medium hidden sm:block"
                style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}
              >
                {guardName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-400 transition-colors duration-200 p-1"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Greeting + time block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1
              className="font-bold text-white leading-tight"
              style={{ fontSize: "clamp(1.3rem, 4vw, 2rem)" }}
            >
              Welcome back, <span className="text-yellow-400">{guardName}</span>
            </h1>
            <p
              className="text-zinc-500 mt-1"
              style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}
            >
              {dateStr}
            </p>
          </div>
          <div className="text-right">
            <p
              className="font-mono font-semibold text-white tabular-nums"
              style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}
            >
              {timeStr}
            </p>
            <p
              className="text-zinc-600 font-mono"
              style={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
            >
              IST — {metrics.zone}
            </p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Live head count" value={metrics.headCount} accent />
          <StatCard
            label="Peak today"
            value={metrics.peakToday}
            unit="people"
          />
          <StatCard label="Stream uptime" value={metrics.uptime} />
          <StatCard label="Active zone" value={metrics.zone} />
        </div>

        {/* ── Live feed CTA ── */}
        <div
          className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden cursor-pointer group"
          onClick={() => navigate("/feed")}
        >
          <div className="relative aspect-video sm:aspect-[21/6] flex items-center justify-center bg-zinc-950">
            {/* Scanline texture */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)",
              }}
            />

            <div className="relative flex flex-col items-center gap-4 text-center px-4">
              {/* Camera icon with pulse ring */}
              <div className="relative">
                {streamOnline && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-yellow-400 opacity-20 scale-150" />
                )}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    streamOnline ?
                      "border-yellow-400 bg-yellow-400/10 group-hover:bg-yellow-400/20"
                    : "border-zinc-700 bg-zinc-800"
                  }`}
                >
                  <svg
                    className={`w-7 h-7 ${streamOnline ? "text-yellow-400" : "text-zinc-600"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <p
                  className="font-semibold text-white group-hover:text-yellow-400 transition-colors duration-200"
                  style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)" }}
                >
                  {streamOnline ? "View live feed" : "Stream not available"}
                </p>
                <p
                  className="text-zinc-600 mt-1"
                  style={{ fontSize: "clamp(0.7rem, 2vw, 0.8rem)" }}
                >
                  {streamOnline ?
                    "Click to open full camera view"
                  : "Waiting for camera connection..."}
                </p>
              </div>

              {streamOnline && (
                <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-3 py-1">
                  <PulseDot active />
                  <span
                    className="text-yellow-400 font-medium"
                    style={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
                  >
                    LIVE
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent alerts ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="font-semibold text-white"
              style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}
            >
              Recent alerts
            </h2>
            <span
              className="text-zinc-600"
              style={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
            >
              Shift log
            </span>
          </div>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <AlertItem key={i} {...a} />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <p
          className="text-center text-zinc-800 pb-4"
          style={{ fontSize: "clamp(0.65rem, 1.5vw, 0.7rem)" }}
        >
          CYBERWARDEN — Where people flow, we keep order.
        </p>
      </main>
    </div>
  );
}

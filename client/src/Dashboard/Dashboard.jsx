import { useAuth } from "../Context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LiveFeed from "./LiveFeed";

const API_BASE = "https://epic.akiyaa.online";

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
function PulseDot({ active, color = "yellow" }) {
  const colors = {
    yellow: {
      ping: "bg-yellow-400",
      dot: "bg-yellow-400",
      inactive: "bg-zinc-600",
    },
    red: { ping: "bg-red-300", dot: "bg-red-300", inactive: "bg-zinc-600" },
  };
  const c = colors[color] || colors.yellow;
  return (
    <span className="relative flex h-3 w-3">
      {active && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.ping} opacity-75`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${active ? c.dot : c.inactive}`}
      />
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, unit = "", accent = false, danger = false }) {
  const displayed = useCountUp(typeof value === "number" ? value : 0);
  return (
    <div
      className={`
      rounded-2xl p-5 border flex flex-col gap-1
      ${
        danger ? "bg-red-600 border-red-500"
        : accent ? "bg-yellow-400 border-yellow-300"
        : "bg-zinc-900 border-zinc-800"
      }
    `}
    >
      <span
        className={`text-xs font-medium tracking-widest uppercase ${
          danger ? "text-red-100"
          : accent ? "text-yellow-900"
          : "text-zinc-500"
        }`}
        style={{ fontSize: "clamp(0.6rem, 1.5vw, 0.7rem)" }}
      >
        {label}
      </span>
      <span
        className={`font-bold leading-none ${
          danger ? "text-white"
          : accent ? "text-black"
          : "text-white"
        }`}
        style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}
      >
        {typeof value === "number" ? displayed : value}
        {unit && (
          <span
            className={`font-normal ml-1 ${
              danger ? "text-red-200"
              : accent ? "text-yellow-800"
              : "text-zinc-500"
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
  const [alertBanner, setAlertBanner] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [countdownActive, setCountdownActive] = useState(false);

  const [metrics, setMetrics] = useState({
    headCount: 0,
    threshold: null,
    peakToday: 0,
    uptime: "00:00",
    zone: "Main Gate",
    avgVelocity: 0,
    alert: false,
  });

  const peakRef = useRef(0);
  const countdownRef = useRef(null);
  const breachStart = useRef(null);
  const cooldownRef = useRef(false);
  const cancelledRef = useRef(false);
  const startRef = useRef(Date.now());

  // ── Clock ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Uptime ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
      setMetrics((prev) => ({ ...prev, uptime: `${h}:${m}` }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // ── Stream check ─────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("https://epic.akiyaa.online/live/stream");
        setStreamOnline(res.ok);
      } catch {
        setStreamOnline(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Cancel handler ───────────────────────────────────────────────
  const handleCancelAlert = () => {
    const token = localStorage.getItem("token");
    cancelledRef.current = true;
    setCountdownActive(false);
    setCountdown(null);
    breachStart.current = null;
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    fetch(`${API_BASE}/api/crowd/cancel-alert`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("[ALERT] Guard cancelled");
    const now = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    setAlerts((prev) => [
      {
        time: now,
        message: "Guard cancelled alert — SMS not sent",
        level: "medium",
        _ts: Date.now(),
      },
      ...prev.slice(0, 19),
    ]);
  };

  // ── Live headcount poll ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/crowd/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[POLL] status:", res.status);
        if (!res.ok) return;

        const data = await res.json();
        console.log("[POLL] data ✅:", data);

        const count = data.count ?? 0;
        const threshold = data.threshold ?? null;
        const isAlert = data.alert ?? false;
        const velocity = data.avgVelocity ?? 0;
        const zone = data.zone ?? "Main Gate";

        if (count > peakRef.current) peakRef.current = count;

        setMetrics((prev) => ({
          ...prev,
          headCount: count,
          threshold,
          peakToday: peakRef.current,
          zone,
          avgVelocity: velocity,
          alert: isAlert,
        }));

        setAlertBanner(isAlert);

        // ── START COUNTDOWN ──────────────────────────────────────
        if (isAlert && !cooldownRef.current && !cancelledRef.current) {
          if (!breachStart.current) {
            breachStart.current = Date.now();
            setCountdownActive(true);
            setCountdown(30);

            let secs = 30;
            countdownRef.current = setInterval(() => {
              secs -= 1;
              setCountdown(secs);

              if (secs <= 0) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
                breachStart.current = null;
                setCountdownActive(false);
                setCountdown(null);

                if (!cancelledRef.current) {
                  fetch(`${API_BASE}/api/crowd/trigger-alert`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then((r) => r.json())
                    .then((d) => {
                      console.log("[SNS] result:", d);
                      cooldownRef.current = true;
                      const now = new Date().toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      });
                      setAlerts((prev) => [
                        {
                          time: now,
                          message: `SMS + Email sent — ${count} people detected (limit: ${threshold})`,
                          level: "high",
                          _ts: Date.now(),
                        },
                        ...prev.slice(0, 19),
                      ]);
                    });
                }
              }
            }, 1000);
          }
        }

        // ── RESET when count drops below threshold ───────────────
        if (!isAlert && (cooldownRef.current || cancelledRef.current)) {
          cooldownRef.current = false;
          cancelledRef.current = false;
          breachStart.current = null;
          setCountdownActive(false);
          setCountdown(null);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          fetch(`${API_BASE}/api/crowd/reset-alert`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (err) {
        console.warn("[POLL]", err.message);
      }
    };

    fetchLatest();
    const id = setInterval(fetchLatest, 3000);
    return () => {
      clearInterval(id);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

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

      {/* ── COUNTDOWN BANNER ── */}
      {countdownActive && countdown !== null && (
        <div className="sticky top-0 z-50 bg-red-600 text-white px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PulseDot active color="red" />
              <div>
                <span className="font-bold text-sm">
                  ⚠ THRESHOLD BREACHED — {metrics.headCount} people detected
                </span>
                <span className="text-red-200 text-sm ml-3">
                  SMS + Email sending in{" "}
                  <span className="font-bold text-white tabular-nums">
                    {countdown}s
                  </span>
                  ...
                </span>
              </div>
            </div>
            <button
              onClick={handleCancelAlert}
              className="bg-white text-red-600 font-bold text-sm px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* ── STATIC ALERT BANNER — after SMS sent ── */}
      {alertBanner && !countdownActive && (
        <div className="sticky top-0 z-50 bg-red-800 text-white px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PulseDot active color="red" />
              <span className="font-semibold text-sm">
                ⚠ ALERT ACTIVE — {metrics.headCount} people detected
                {metrics.threshold && ` (limit: ${metrics.threshold})`}
              </span>
            </div>
            <button
              onClick={() => setAlertBanner(false)}
              className="text-red-200 hover:text-white text-xs underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Top navbar ── */}
      <header className="relative border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
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
              onClick={() => window.open("/management", "_blank")}
              className="bg-yellow-400 text-black font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-300 transition"
            >
              Management
            </button>
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
          <StatCard
            label="Live head count"
            value={metrics.headCount}
            accent={!metrics.alert}
            danger={metrics.alert}
          />
          <StatCard label="Threshold" value={metrics.threshold ?? "—"} />
          <StatCard
            label="Peak today"
            value={metrics.peakToday}
            unit="people"
          />
          <StatCard label="Stream uptime" value={metrics.uptime} />
        </div>

        {/* ── Live feed ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {streamOnline ?
            <LiveFeed embedded />
          : <div className="relative aspect-video flex items-center justify-center bg-zinc-950">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-zinc-700 bg-zinc-800">
                  <svg
                    className="w-7 h-7 text-zinc-600"
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
                <p className="text-zinc-500">Stream not available</p>
                <p className="text-zinc-600 text-sm">
                  Waiting for camera connection...
                </p>
              </div>
            </div>
          }
        </div>

        {/* ── Alert log ── */}
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
            {alerts.length === 0 ?
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-center text-zinc-600 text-sm">
                No alerts this shift — all clear
              </div>
            : alerts.map((a, i) => <AlertItem key={i} {...a} />)}
          </div>
        </div>

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

import { useEffect, useState, useRef } from "react";

// ── Google Fonts injection ─────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

    @keyframes ping       { 75%,100%{ transform:scale(2); opacity:0 } }
    @keyframes fadeUp     { from{ opacity:0; transform:translateY(16px) } to{ opacity:1; transform:translateY(0) } }
    @keyframes pulseGlow  { 0%,100%{ box-shadow:0 0 0 0 rgba(250,204,21,0) } 50%{ box-shadow:0 0 0 12px rgba(250,204,21,0.08) } }
    @keyframes scanMove   { from{ top:-2px } to{ top:100% } }
    @keyframes countPop   { 0%{ transform:scale(1) } 50%{ transform:scale(1.06) } 100%{ transform:scale(1) } }
    @keyframes arrowBounce{
      0%,100%{ transform: var(--arrow-translate,translateX(0)) scale(1); }
      50%    { transform: var(--arrow-translate,translateX(0)) scale(1) var(--arrow-bounce); }
    }
    @keyframes alertFlash { 0%,100%{ opacity:1 } 50%{ opacity:0.4 } }
    @keyframes gridScroll { from{ transform:translateY(0) } to{ transform:translateY(48px) } }
    @keyframes blink      { 0%,100%{ opacity:1 } 50%{ opacity:0 } }

    .count-pop  { animation: countPop 0.35s ease; }
    .fade-up    { animation: fadeUp 0.6s ease both; }
    .alert-flash{ animation: alertFlash 0.8s ease infinite; }
    .blink      { animation: blink 1s step-end infinite; }
  `}</style>
);

// ── Pulse dot ──────────────────────────────────────────────────────
function PulseDot({ active, color = "#FACC15" }) {
  return (
    <span
      style={{
        position: "relative",
        display: "flex",
        width: 10,
        height: 10,
        flexShrink: 0,
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: color,
            opacity: 0.7,
            animation: "ping 1.3s cubic-bezier(0,0,.2,1) infinite",
          }}
        />
      )}
      <span
        style={{
          position: "relative",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: active ? color : "#52525b",
          display: "inline-flex",
        }}
      />
    </span>
  );
}

// ── Animated count display ─────────────────────────────────────────
function AnimatedCount({ value, danger }) {
  const [displayed, setDisplayed] = useState(value);
  const [popping, setPopping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;
    setPopping(true);
    const start = displayed;
    const diff = value - start;
    const steps = 18;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(Math.round(start + (diff * i) / steps));
      if (i >= steps) {
        clearInterval(id);
        setPopping(false);
      }
    }, 20);
    return () => clearInterval(id);
  }, [value]);

  return (
    <span
      className={popping ? "count-pop" : ""}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(4rem, 14vw, 7rem)",
        fontWeight: 900,
        lineHeight: 1,
        color: danger ? "#ef4444" : "#FACC15",
        letterSpacing: "-2px",
        display: "block",
        transition: "color 0.4s ease",
        textShadow:
          danger ?
            "0 0 40px rgba(239,68,68,0.3)"
          : "0 0 40px rgba(250,204,21,0.15)",
      }}
    >
      {displayed}
    </span>
  );
}

// ── Threshold bar ──────────────────────────────────────────────────
function ThresholdBar({ count, threshold }) {
  const pct = threshold > 0 ? Math.min((count / threshold) * 100, 100) : 0;
  const danger = pct >= 100;
  const warning = pct >= 75;

  const barColor =
    danger ? "#ef4444"
    : warning ? "#f97316"
    : "#FACC15";

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#52525b",
            letterSpacing: "2px",
          }}
        >
          OCCUPANCY LEVEL
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: barColor,
            letterSpacing: "1px",
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "#27272a",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: 999,
            transition: "width 0.6s ease, background 0.4s ease",
            boxShadow: `0 0 8px ${barColor}60`,
          }}
        />
      </div>
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#3f3f46",
            letterSpacing: "1px",
          }}
        >
          THRESHOLD: {threshold}
        </span>
      </div>
    </div>
  );
}

// ── Gate arrow card ────────────────────────────────────────────────
const GATE_CONFIG = {
  A: {
    label: "GATE A",
    direction: "LEFT",
    hint: "West exit",
    arrow: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        style={{ width: "100%", height: "100%" }}
      >
        <path
          d="M36 24H12M12 24l10-10M12 24l10 10"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    translateVar: "translateX(-6px)",
  },
  B: {
    label: "GATE B",
    direction: "STRAIGHT",
    hint: "North exit",
    arrow: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        style={{ width: "100%", height: "100%" }}
      >
        <path
          d="M24 36V12M24 12L14 22M24 12l10 10"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    translateVar: "translateY(-6px)",
  },
  C: {
    label: "GATE C",
    direction: "RIGHT",
    hint: "East exit",
    arrow: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        style={{ width: "100%", height: "100%" }}
      >
        <path
          d="M12 24h24M36 24L26 14M36 24L26 34"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    translateVar: "translateX(6px)",
  },
};

function GateCard({ safeGate, danger }) {
  const gate = GATE_CONFIG[safeGate] || GATE_CONFIG["C"];
  const [prev, setPrev] = useState(safeGate);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (safeGate !== prev) {
      setFlash(true);
      setPrev(safeGate);
      setTimeout(() => setFlash(false), 600);
    }
  }, [safeGate]);

  return (
    <div
      style={{
        border: `1px solid ${danger ? "rgba(239,68,68,0.4)" : "rgba(250,204,21,0.25)"}`,
        background: danger ? "rgba(239,68,68,0.04)" : "rgba(250,204,21,0.03)",
        borderRadius: 20,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        transition: "all 0.4s ease",
        animation: flash ? "pulseGlow 0.5s ease" : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle glow bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 20,
          background:
            danger ?
              "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08), transparent 70%)"
            : "radial-gradient(ellipse at 50% 0%, rgba(250,204,21,0.06), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          position: "relative",
        }}
      >
        <PulseDot active={!danger} color={danger ? "#ef4444" : "#FACC15"} />
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "2.5px",
            color: danger ? "#ef4444" : "#FACC15",
          }}
        >
          SAFE EXIT ROUTE
        </span>
      </div>

      {/* Arrow */}
      <div
        style={{
          width: 88,
          height: 88,
          color: danger ? "#ef4444" : "#FACC15",
          filter: `drop-shadow(0 0 12px ${danger ? "rgba(239,68,68,0.4)" : "rgba(250,204,21,0.35)"})`,
          "--arrow-translate": gate.translateVar,
          "--arrow-bounce":
            gate.translateVar.includes("X") ? "translateX(0)" : "translateY(0)",
          animation: "arrowBounce 1.4s ease-in-out infinite",
        }}
      >
        {gate.arrow}
      </div>

      {/* Gate name */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(2.2rem, 7vw, 3.2rem)",
            fontWeight: 900,
            letterSpacing: "-0.5px",
            lineHeight: 1,
            color: danger ? "#ef4444" : "#FACC15",
          }}
        >
          {gate.label}
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "2px",
            color: "#52525b",
            marginTop: 4,
          }}
        >
          {gate.direction} · {gate.hint}
        </div>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────
function StatusBadge({ danger, warning }) {
  if (danger)
    return (
      <div
        className="alert-flash"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 999,
          padding: "6px 14px",
        }}
      >
        <PulseDot active color="#ef4444" />
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: "#ef4444",
            letterSpacing: "1.5px",
          }}
        >
          THRESHOLD EXCEEDED
        </span>
      </div>
    );
  if (warning)
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.35)",
          borderRadius: 999,
          padding: "6px 14px",
        }}
      >
        <PulseDot active color="#f97316" />
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: "#f97316",
            letterSpacing: "1.5px",
          }}
        >
          APPROACHING LIMIT
        </span>
      </div>
    );
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(250,204,21,0.06)",
        border: "1px solid rgba(250,204,21,0.2)",
        borderRadius: 999,
        padding: "6px 14px",
      }}
    >
      <PulseDot active />
      <span
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: "#FACC15",
          letterSpacing: "1.5px",
        }}
      >
        NOMINAL
      </span>
    </div>
  );
}

// ── Mini stat pill ─────────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 12,
        padding: "10px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flex: 1,
        minWidth: 100,
      }}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          color: "#52525b",
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.3px",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function CrowdManagement() {
  const [data, setData] = useState({ safeGate: "A", count: 0, threshold: 50 });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [peak, setPeak] = useState(0);
  const [uptime, setUptime] = useState(0);

  const danger = data.threshold > 0 && data.count >= data.threshold;
  const warning =
    data.threshold > 0 && data.count >= data.threshold * 0.75 && !danger;

  // ── Uptime counter ──────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const uptimeFmt = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Fetch loop ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchDecision = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("https://epic.akiyaa.online/api/crowd/latest", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("API failed");

        const json = await res.json();
        console.log("API DATA:", json);

        const count = json.count ?? 0;
        const threshold = json.threshold ?? 50;

        // 🔥 same logic as backend
        let safeGate = "A";
        if (count >= threshold * 1.2) {
          safeGate = "C";
        } else if (count >= threshold) {
          safeGate = "B";
        }

        setData({
          safeGate,
          count,
          threshold,
        });

        setFetchError(false);
        setLastUpdated(new Date());
        setPeak((p) => Math.max(p, count));
      } catch (err) {
        console.error("Error fetching decision", err);
        setFetchError(true);
      }
    };

    fetchDecision();
    const interval = setInterval(fetchDecision, 2000); // little smoother
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <FontLoader />

      {/* Scanlines */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
          opacity: 0.025,
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px)",
        }}
      />

      {/* Animated grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "calc(100% + 48px)",
            backgroundImage:
              "linear-gradient(rgba(250,204,21,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(250,204,21,0.04) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            animation: "gridScroll 4s linear infinite",
          }}
        />
        {/* scan line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg,transparent,rgba(250,204,21,0.12),transparent)",
            animation: "scanMove 6s linear infinite",
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid #18181b",
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: "#FACC15",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                style={{ width: 15, height: 15 }}
                fill="none"
              >
                <path
                  d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
                  fill="#000"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 20,
                fontWeight: 900,
                color: "#FACC15",
                letterSpacing: 1,
              }}
            >
              CYBERWARDEN
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Connection status */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <PulseDot
                active={!fetchError}
                color={fetchError ? "#ef4444" : "#FACC15"}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: fetchError ? "#ef4444" : "#52525b",
                  letterSpacing: "1.5px",
                }}
              >
                {fetchError ? "API OFFLINE" : "LIVE"}
              </span>
            </div>
            {/* Clock */}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#3f3f46",
                letterSpacing: "1px",
              }}
            >
              {new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "32px 20px 60px",
          position: "relative",
        }}
      >
        {/* Page heading */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                lineHeight: 1,
                color: "#fff",
                margin: 0,
              }}
            >
              CROWD MANAGEMENT
            </h1>
            <StatusBadge danger={danger} warning={warning} />
          </div>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#3f3f46",
              letterSpacing: "2px",
              margin: 0,
            }}
          >
            ZONE-A · REAL-TIME AI ANALYSIS · 1s REFRESH
          </p>
        </div>

        {/* ── Main grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Live count card */}
          <div
            style={{
              border: `1px solid ${danger ? "rgba(239,68,68,0.35)" : "#27272a"}`,
              background: "#09090b",
              borderRadius: 20,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              transition: "border-color 0.4s ease",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* BG glow on danger */}
            {danger && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.08), transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#52525b",
                  letterSpacing: "2.5px",
                }}
              >
                LIVE HEAD COUNT
              </span>
              {/* Camera icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  style={{ width: 15, height: 15, color: "#52525b" }}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <AnimatedCount value={data.count} danger={danger} />

            <ThresholdBar count={data.count} threshold={data.threshold} />

            {/* Last updated */}
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: "#3f3f46",
                letterSpacing: "1.5px",
                borderTop: "1px solid #18181b",
                paddingTop: 12,
              }}
            >
              {lastUpdated ?
                `UPDATED ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}`
              : "AWAITING DATA..."}
            </div>
          </div>

          {/* Gate direction card */}
          <GateCard safeGate={data.safeGate} danger={danger} />
        </div>

        {/* ── Stat pills row ── */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <StatPill label="Threshold" value={data.threshold || "—"} />
          <StatPill label="Peak today" value={peak} />
          <StatPill label="Session" value={uptimeFmt(uptime)} />
          <StatPill label="Zone" value="ZONE-A" />
        </div>

        {/* ── Alert banner (shows only when danger) ── */}
        {danger && (
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.06)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <svg
                style={{ width: 20, height: 20, color: "#ef4444" }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#ef4444",
                  margin: 0,
                  letterSpacing: "0.5px",
                }}
              >
                CROWD THRESHOLD EXCEEDED — IMMEDIATE ACTION REQUIRED
              </p>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#7f1d1d",
                  margin: "4px 0 0",
                  letterSpacing: "1px",
                }}
              >
                DIRECT ALL PERSONS TO{" "}
                {GATE_CONFIG[data.safeGate]?.label || "SAFE GATE"} ·{" "}
                {GATE_CONFIG[data.safeGate]?.hint?.toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {/* ── Offline banner ── */}
        {fetchError && (
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.04)",
              borderRadius: 16,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <svg
              style={{ width: 16, height: 16, color: "#ef4444", flexShrink: 0 }}
              fill="none"
              viewBox="0 0 24 24"
            >
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
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#ef4444",
                letterSpacing: "1.5px",
              }}
            >
              CANNOT REACH API — RETRYING...
            </span>
          </div>
        )}

        {/* Footer */}
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: "#27272a",
            letterSpacing: "2px",
            marginTop: 40,
            textAlign: "center",
          }}
        >
          CYBERWARDEN · AI CROWD MANAGEMENT · REAL-TIME · ENCRYPTED
        </p>
      </main>
    </div>
  );
}

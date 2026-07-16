import express from "express";
import CrowdLog from "../models/CrowdLog.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── IN-MEMORY THRESHOLD STORE ───────────────────────────────
// Main user sets this via POST /api/crowd/config
// Persists in memory until EC2 restarts (good enough for now)
let areaConfig = {
  zone: "main",
  areaSqMeters: 100,
  threshold: 20, // default, overwritten by admin
};

// Helper: calculate threshold from area
// Rule: 1 person per 2 sq meters (change formula as needed)
function calcThreshold(areaSqMeters) {
  return Math.floor(areaSqMeters / 2);
}

// ─── ADMIN: Set area config (main user via Postman) ──────────
// POST /api/crowd/config
// Body: { zone, areaSqMeters }
router.post("/config", auth, async (req, res) => {
  try {
    const { zone, areaSqMeters } = req.body;
    if (!areaSqMeters || areaSqMeters <= 0) {
      return res
        .status(400)
        .json({ msg: "areaSqMeters must be a positive number" });
    }
    areaConfig = {
      zone: zone || "main",
      areaSqMeters,
      threshold: calcThreshold(areaSqMeters),
    };
    res.json({
      msg: "Config updated",
      ...areaConfig,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/crowd/config — so React can show current threshold
router.get("/config", auth, async (req, res) => {
  res.json(areaConfig);
});

// ─── PYTHON: Log headcount (no auth, internal) ───────────────
// POST /api/crowd/log
// Called by run_final_prediction.py every 5 frames
router.post("/log", async (req, res) => {
  try {
    const { count, avgVelocity, cameraId } = req.body;
    const threshold = areaConfig.threshold;
    const alert = threshold !== null && count >= threshold;

    const log = await CrowdLog.create({
      zone: areaConfig.zone,
      count,
      threshold,
      alert,
      avgVelocity: avgVelocity || 0,
      cameraId: cameraId || "main",
    });

    res.json(log);
  } catch (err) {
    console.error("[crowd/log]", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── REACT: Get latest count (guard dashboard polls this) ─────
// GET /api/crowd/latest
router.get("/latest", auth, async (req, res) => {
  try {
    const latest = await CrowdLog.findOne().sort({ createdAt: -1 }).lean();
    res.json(
      latest || { count: 0, threshold: areaConfig.threshold, alert: false },
    );
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── REACT: Get recent logs (guard dashboard history) ─────────
// GET /api/crowd/
router.get("/", auth, async (req, res) => {
  try {
    const logs = await CrowdLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;

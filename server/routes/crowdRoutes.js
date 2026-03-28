import express from "express";
import CrowdLog from "../models/CrowdLog.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// POST crowd data (YOLO will hit this)
router.post("/log", async (req, res) => {
  try {
    const { zone, count, threshold } = req.body;

    const alert = count > threshold;

    const log = await CrowdLog.create({
      zone,
      count,
      threshold,
      alert,
    });

    res.json(log);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET logs (protected)
router.get("/", auth, async (req, res) => {
  try {
    const logs = await CrowdLog.find().sort({ createdAt: -1 }).limit(50);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;

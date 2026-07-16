import mongoose from "mongoose";

const crowdSchema = new mongoose.Schema(
  {
    zone: { type: String, default: "main" },
    count: Number,
    threshold: { type: Number, default: null },
    alert: { type: Boolean, default: false },
    avgVelocity: { type: Number, default: 0 },
    cameraId: { type: String, default: "main" },
  },
  { timestamps: true },
);

export default mongoose.model("CrowdLog", crowdSchema);

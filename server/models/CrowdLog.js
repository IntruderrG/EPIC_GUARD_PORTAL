import mongoose from "mongoose";

const crowdSchema = new mongoose.Schema(
  {
    zone: String,
    count: Number,
    threshold: Number,
    alert: Boolean,
  },
  { timestamps: true },
);

export default mongoose.model("CrowdLog", crowdSchema);

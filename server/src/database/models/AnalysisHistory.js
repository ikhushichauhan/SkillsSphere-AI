import mongoose from "mongoose";

const analysisHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    classification: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    mode: {
      type: String,
      enum: ["match", "benchmark"],
      default: "match",
    },
  },
  {
    timestamps: true,
  }
);

const AnalysisHistory = mongoose.model("AnalysisHistory", analysisHistorySchema);

export default AnalysisHistory;

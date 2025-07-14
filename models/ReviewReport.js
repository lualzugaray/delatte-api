// models/ReviewReport.js
import mongoose from "mongoose";

const reviewReportSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", required: true },
  reason: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending","reviewed","dismissed"],
    default: "pending"
  }
});

export default mongoose.model("ReviewReport", reviewReportSchema);

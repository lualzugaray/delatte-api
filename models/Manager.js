import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  assignedCafe: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe" }, // opcional
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Manager", managerSchema);

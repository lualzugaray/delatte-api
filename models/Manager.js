import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  fullName: String,
  phone: String,
  assignedCafe: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Manager", managerSchema);

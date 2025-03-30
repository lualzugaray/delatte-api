import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: { type: String }
});

export default mongoose.model("Admin", adminSchema);

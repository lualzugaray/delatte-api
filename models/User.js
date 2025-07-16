import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["client", "manager", "admin"], required: true },
  lastAccess: { type: Date },
  isActive: { type: Boolean, default: true },
  auth0Id: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
});

export default mongoose.model("User", userSchema);

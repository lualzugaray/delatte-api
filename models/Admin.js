import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  auth0Id:   { type: String, required: true, unique: true },
  fullName:  { type: String }
}, {
  collection: "admins"
});

export default mongoose.model("Admin", adminSchema);

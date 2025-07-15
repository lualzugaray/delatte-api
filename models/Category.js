import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  isActive: { type: Boolean, default: false },
  type: { type: String, enum: ["structural", "perceptual"], required: true },
  createdByClient: { type: Boolean, default: false },
  createdByManager: { type: Boolean, default: false },
});

categorySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  },
});

export default mongoose.model("Category", categorySchema);

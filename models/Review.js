import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  cafeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  rating: { type: Number, required: true },
  comment: String,
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Review", reviewSchema);

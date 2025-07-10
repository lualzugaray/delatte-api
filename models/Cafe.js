import mongoose from "mongoose";

const cafeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  location: {
    lat: Number,
    lng: Number,
  },
  description: String,
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  perceptualCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }], 
  gallery: [String],
  menu: [
    {
      name: { type: String, required: true },
      description: String,
      price: { type: Number, required: true },
      image: String,
    },
  ],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  averageRating: { type: Number, default: 0 },
  schedule: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
  },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("Cafe", cafeSchema, "cafes");


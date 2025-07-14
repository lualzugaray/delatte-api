import mongoose from "mongoose";
import { normalizeText } from "../utils/text.js";

const cafeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  location: {
    lat: Number,
    lng: Number,
  },
  description: String,
  nameNormalized:        { type: String, index: true },
  descriptionNormalized: { type: String, index: true },
  categories:            [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  perceptualCategories:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  gallery:               [String],
  coverImage:            { type: String },
  menu: [
    {
      name:        { type: String, required: true },
      description: String,
      price:       { type: Number, required: true },
      image:       String,
    },
  ],
  reviews:       [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  averageRating: { type: Number, default: 0 },
  schedule: {
    lunes:    { open: String, close: String, isClosed: { type: Boolean, default: false } },
    martes:   { open: String, close: String, isClosed: { type: Boolean, default: false } },
    miércoles:{ open: String, close: String, isClosed: { type: Boolean, default: false } },
    jueves:   { open: String, close: String, isClosed: { type: Boolean, default: false } },
    viernes:  { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sábado:   { open: String, close: String, isClosed: { type: Boolean, default: false } },
    domingo:  { open: String, close: String, isClosed: { type: Boolean, default: false } },
  },
  managerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
  createdAt:    { type: Date, default: Date.now },
  isActive:     { type: Boolean, default: true },
});

cafeSchema.pre("save", function(next) {
  this.nameNormalized        = normalizeText(this.name);
  this.descriptionNormalized = normalizeText(this.description);
  next();
});

cafeSchema.pre("findOneAndUpdate", function(next) {
  const u = this.getUpdate();
  if (u.name !== undefined) {
    u.nameNormalized = normalizeText(u.name);
  }
  if (u.description !== undefined) {
    u.descriptionNormalized = normalizeText(u.description);
  }
  next();
});

export default mongoose.model("Cafe", cafeSchema, "cafes");

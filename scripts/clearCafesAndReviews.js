import mongoose from "mongoose";
import dotenv from "dotenv";
import Cafe from "../models/Cafe.js";
import Review from "../models/Review.js";

dotenv.config();

async function clear() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const cafes = await Cafe.find({});
    const cafeIds = cafes.map(c => c._id);

    const reviewsDeleted = await Review.deleteMany({ cafeId: { $in: cafeIds } });
    const cafesDeleted = await Cafe.deleteMany({ _id: { $in: cafeIds } });

    console.log(`🗑️ Cafeterías eliminadas: ${cafesDeleted.deletedCount}`);
    console.log(`🗑️ Reseñas eliminadas: ${reviewsDeleted.deletedCount}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error eliminando datos:", err);
    process.exit(1);
  }
}

clear();

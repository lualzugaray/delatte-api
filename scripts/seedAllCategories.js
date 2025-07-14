import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
import { structuralCategories, perceptualCategories } from "../scripts/categoriesSeedData.js";

dotenv.config();

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const allCategories = [
      ...structuralCategories.map(cat => ({ ...cat, type: "structural" })),
      ...perceptualCategories.map(cat => ({ ...cat, type: "perceptual" }))
    ];

    for (const cat of allCategories) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        await Category.create({
          ...cat,
          isActive: cat.type === "structural" && !cat.createdByClient && !cat.createdByManager,
        });
        console.log(`✅ Categoría creada: ${cat.name}`);
      } else {
        console.log(`↪ Categoría ya existente: ${cat.name}`);
      }
    }

    console.log("🎉 Categorías insertadas correctamente");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error al insertar categorías:", err);
    process.exit(1);
  }
}

seedCategories();
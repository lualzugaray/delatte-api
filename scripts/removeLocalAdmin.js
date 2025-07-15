import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteOne({ email: "admin@delatte.com" });
    console.log("🗑️ Admin local eliminado");
    await mongoose.disconnect();
}

run().catch(console.error);

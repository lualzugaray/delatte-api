import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/User.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const password = "admin123";
const hashedPassword = await bcrypt.hash(password, 10);

const admin = new User({
  email: "admin@delatte.com",
  password: hashedPassword,
  role: "admin",
  isActive: true
});

await admin.save();
console.log("Admin creado:", admin.email);
await mongoose.disconnect();

import express from "express";
import Client from "../models/Client.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Manager from "../models/Manager.js"; 

const router = express.Router();
const saltRounds = 10;

router.post("/register/client", async (req, res) => {
  try {
    const { email, password, firstName, lastName, profilePicture } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({ error: "Email, password and first name are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      email,
      password: hashedPassword,
      role: "client"
    });

    await user.save();

    const client = new Client({
      userId: user._id,
      firstName,
      lastName,
      profilePicture
    });

    await client.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "Client registered", userId: user._id, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/register/manager", async (req, res) => {
    try {
      const { email, password, fullName, phone } = req.body;
  
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Email, password and fullName are required" });
      }
  
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: "User already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const user = new User({
        email,
        password: hashedPassword,
        role: "manager"
      });
  
      await user.save();
  
      const manager = new Manager({
        userId: user._id,
        fullName,
        phone
      });
  
      await manager.save();
  
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
  
      res.status(201).json({ message: "Manager registered", userId: user._id, token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });  

export default router;
import express from "express";
import User from "../models/User.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.get("/role", verifyAuth0, async (req, res) => {
    console.log("Headers:", req.headers);
    console.log("Token payload recibido:", req.auth); 
  

  const email = req.auth.email || req.auth["https://delatte.com/email"] || req.auth["email"];
  if (!email) return res.status(400).json({ error: "Email no disponible en el token" });

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  res.json({
    role: user.role,
    emailVerified: true,
  });
});


export default router;

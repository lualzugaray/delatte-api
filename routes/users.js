import express from "express";
import User from "../models/User.js";
import verifyAuth0Sync from "../middlewares/verifyAuth0Sync.js"; 

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.get("/role", verifyAuth0Sync, async (req, res) => {
  try {
    const auth0Id = req.auth.sub;
    const email = req.auth.email || req.auth["https://delatte.com/email"] || req.auth["email"];
    
    if (!auth0Id) {
      return res.status(400).json({ error: "Auth0 ID no disponible en el token" });
    }

    let user = await User.findOne({ email });
    
    if (!user && auth0Id) {
      const Client = (await import("../models/Client.js")).default;
      const Manager = (await import("../models/Manager.js")).default;
      
      const client = await Client.findOne({ auth0Id });
      const manager = await Manager.findOne({ auth0Id });
      
      if (client) {
        user = await User.findOne({ role: "client", email });
      } else if (manager) {
        user = await User.findOne({ role: "manager", email });
      }
    }

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      role: user.role,
      emailVerified: true,
    });
  } catch (error) {
    console.error("Error in /users/role:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
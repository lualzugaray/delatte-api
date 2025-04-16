// routes/auth.js
import express from "express";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import User from "../models/User.js";
import Client from "../models/Client.js";
import Manager from "../models/Manager.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const createToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post("/auth0-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const authRes = await fetch(
      "https://dev-d82ap42lb6n7381y.us.auth0.com/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "password",
          username: email,
          password,
          client_id: process.env.AUTH0_BACKEND_CLIENT_ID,
          client_secret: process.env.AUTH0_BACKEND_CLIENT_SECRET,
          audience: "https://delatte.api",
        }),
      }
    );

    const authData = await authRes.json();

    if (!authRes.ok) {
      console.error("Auth0 login failed:", authData);
      return res
        .status(401)
        .json({ error: authData.error_description || "Unauthorized" });
    }

    res.json({ access_token: authData.access_token });
  } catch (err) {
    console.error("Internal error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/sync-client", verifyAuth0, async (req, res) => {
  console.log("REQ.AUTH:", req.auth);
  const email = req.body.email;
  const { firstName, lastName, profilePicture } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        password: "auth0",
        role: "client",
      });
      await user.save();

      const client = new Client({
        userId: user._id,
        firstName,
        lastName,
        profilePicture,
      });
      await client.save();
    }

    const token = createToken(user);
    res.json({ message: "Client synced", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sync-manager", verifyAuth0, async (req, res) => {
    const email = req.body.email;
    const { firstName, lastName, profilePicture } = req.body;
  
    try {
      let user = await User.findOne({ email });
  
      if (!user) {
        user = new User({
          email,
          password: "auth0",
          role: "manager",
        });
        await user.save();
  
        const manager = new Manager({
          userId: user._id,
          fullName: `${firstName} ${lastName}`,
          phone: "",
        });
        await manager.save();
      }
  
      const token = createToken(user);
      res.json({ message: "Manager synced", token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

export default router;

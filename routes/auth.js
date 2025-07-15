import express from "express";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import User from "../models/User.js";
import Client from "../models/Client.js";
import Manager from "../models/Manager.js";

const router = express.Router();

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
          audience: process.env.AUTH0_AUDIENCE,
          client_id: process.env.AUTH0_BACKEND_CLIENT_ID,
          client_secret: process.env.AUTH0_BACKEND_CLIENT_SECRET,
          connection: "Username-Password-Authentication",
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
  const { email, firstName, lastName, profilePicture } = req.body;
  const auth0Id = req.auth.sub;

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
        auth0Id,
        firstName,
        lastName,
        profilePicture,
      });
      await client.save();
    }

    res.json({ message: "Client synced" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sync-manager", verifyAuth0, async (req, res) => {
  const { email, firstName, lastName, profilePicture } = req.body;
  const auth0Id = req.auth.sub;

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
        auth0Id,
        fullName: `${firstName} ${lastName}`,
        phone: "",
      });
      await manager.save();
    }

    res.json({ message: "Manager synced" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

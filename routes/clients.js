import express from "express";
import Client from "../models/Client.js";
import Cafe from "../models/Cafe.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// GET /clients/me/favorites
router.get("/me/favorites", verifyAuth0, async (req, res) => {
  try {
    const client = await Client.findOne({ auth0Id: req.auth.sub }).populate("favorites");
    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json(client.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /clients/me/favorites/:cafeId
router.post("/me/favorites/:cafeId", verifyAuth0, async (req, res) => {
  try {
    const client = await Client.findOne({ auth0Id: req.auth.sub });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const { cafeId } = req.params;

    if (client.favorites.includes(cafeId)) {
      return res.status(400).json({ error: "Café already in favorites" });
    }

    client.favorites.push(cafeId);
    await client.save();

    res.json({ message: "Café added to favorites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /clients/me/favorites/:cafeId
router.delete("/me/favorites/:cafeId", verifyAuth0, async (req, res) => {
  try {
    const client = await Client.findOne({ auth0Id: req.auth.sub });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const { cafeId } = req.params;

    client.favorites = client.favorites.filter(id => id.toString() !== cafeId);
    await client.save();

    res.json({ message: "Café removed from favorites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/me
router.get("/me", verifyAuth0, async (req, res) => {
  try {
    const client = await Client.findOne({ auth0Id: req.auth.sub }).populate("favorites");
    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /clients/me
router.put("/me",
  verifyAuth0,
  [
    body("firstName").optional().isString().withMessage("Debe ser un texto"),
    body("lastName").optional().isString(),
    body("profilePicture").optional().isURL().withMessage("Debe ser una URL válida"),
    body("bio").optional().isLength({ max: 300 }).withMessage("Máximo 300 caracteres")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updates = req.body;
      const client = await Client.findOneAndUpdate(
        { auth0Id: req.auth.sub },
        updates,
        { new: true }
      );

      if (!client) return res.status(404).json({ error: "Client not found" });

      res.json({ message: "Profile updated", client });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /clients/me
router.delete("/me", verifyAuth0, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ auth0Id: req.auth.sub });
    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json({ message: "Client account deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /clients/me/preferences
router.patch("/me/preferences", verifyAuth0, async (req, res) => {
  try {
    const { preferences } = req.body;

    const client = await Client.findOneAndUpdate(
      { auth0Id: req.auth.sub },
      { preferences },
      { new: true }
    );

    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json({ message: "Preferences updated", preferences: client.preferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /clients/me/social-links
router.patch("/me/social-links", verifyAuth0, async (req, res) => {
  try {
    const { socialLinks } = req.body;

    const client = await Client.findOneAndUpdate(
      { auth0Id: req.auth.sub },
      { socialLinks },
      { new: true }
    );

    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json({ message: "Social links updated", socialLinks: client.socialLinks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

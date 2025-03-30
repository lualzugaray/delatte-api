import express from "express";
import Client from "../models/Client.js";
import Cafe from "../models/Cafe.js";
import auth from "../middlewares/auth.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// GET /clients/me/favorites — Obtener favoritos del cliente logueado
router.get("/me/favorites", auth, async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user.userId }).populate("favorites");
    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json(client.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /clients/me/favorites/:cafeId — Agregar un café a favoritos
router.post("/me/favorites/:cafeId", auth, async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user.userId });
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

// DELETE /clients/me/favorites/:cafeId — Quitar un café de favoritos
router.delete("/me/favorites/:cafeId", auth, async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user.userId });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const { cafeId } = req.params;

    client.favorites = client.favorites.filter(id => id.toString() !== cafeId);
    await client.save();

    res.json({ message: "Café removed from favorites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clients/me — obtener perfil del cliente autenticado
router.get("/me", auth, async (req, res) => {
    try {
      const client = await Client.findOne({ userId: req.user.userId }).populate("favorites");
      if (!client) return res.status(404).json({ error: "Client not found" });
  
      res.json(client);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// PUT /clients/me — actualizar perfil del cliente autenticado
router.put("/me",
    auth,
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
          { userId: req.user.userId },
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

// DELETE /clients/me — eliminar el perfil del cliente
router.delete("/me", auth, async (req, res) => {
    try {
      const client = await Client.findOneAndDelete({ userId: req.user.userId });
      if (!client) return res.status(404).json({ error: "Client not found" });
  
      res.json({ message: "Client account deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// PATCH /clients/me/preferences — actualizar preferencias del cliente
router.patch("/me/preferences", auth, async (req, res) => {
    try {
      const { preferences } = req.body;
  
      const client = await Client.findOneAndUpdate(
        { userId: req.user.userId },
        { preferences },
        { new: true }
      );
  
      if (!client) return res.status(404).json({ error: "Client not found" });
  
      res.json({ message: "Preferences updated", preferences: client.preferences });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// PATCH /clients/me/social-links — actualizar redes sociales
router.patch("/me/social-links", auth, async (req, res) => {
    try {
      const { socialLinks } = req.body;
  
      const client = await Client.findOneAndUpdate(
        { userId: req.user.userId },
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

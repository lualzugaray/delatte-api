import express from "express";
import Cafe from "../models/Cafe.js";
import Category from "../models/Category.js";
import Manager from "../models/Manager.js";
import isAdmin from "../middlewares/isAdmin.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import { isValidScheduleForCategory } from "../utils/scheduleValidators.js";
import { isCafeOpenNow } from "../utils/isCafeOpenNow.js";

const router = express.Router();

// Obtener lista filtrada de cafés (abierta al público)
router.post("/", async (req, res) => {
  try {
    const { categories, limit = 10, skip = 0 } = req.query;

    const query = { isActive: true };

    if (categories) {
      const categoryList = categories.split(",");
      query.categories = { $in: categoryList };
    }

    const cafes = await Cafe.find(query)
      .populate("categories", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(cafes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener lista avanzada filtrada de cafés
router.get("/", async (req, res) => {
  try {
    const {
      categories,
      ratingMin,
      sortBy = "createdAt",
      openNow,
      limit = 10,
      skip = 0,
    } = req.query;

    const query = { isActive: true };

    if (categories) {
      const categoryList = categories.split(",");
      query.categories = { $in: categoryList };
    }

    if (ratingMin) {
      query.averageRating = { $gte: parseFloat(ratingMin) };
    }

    let cafes;

    if (sortBy === "reviewsCount") {
      cafes = await Cafe.aggregate([
        { $match: query },
        {
          $addFields: {
            reviewsCount: { $size: "$reviews" }
          }
        },
        { $sort: { reviewsCount: -1 } },
        { $skip: parseInt(skip) },
        { $limit: parseInt(limit) },
      ]);

      cafes = await Cafe.populate(cafes, [
        { path: "categories", select: "name" },
        {
          path: "reviews",
          options: { limit: 2, sort: { createdAt: -1 } },
          populate: { path: "clientId", select: "firstName lastName profilePicture" },
        }
      ]);
    } else {
      cafes = await Cafe.find(query)
        .populate("categories", "name")
        .populate({
          path: "reviews",
          select: "rating comment clientId createdAt",
          options: { limit: 2, sort: { createdAt: -1 } },
          populate: {
            path: "clientId",
            select: "firstName lastName profilePicture",
          },
        })
        .sort(
          sortBy === "rating"
            ? { averageRating: -1 }
            : { createdAt: -1 }
        )
        .limit(parseInt(limit))
        .skip(parseInt(skip));
    }

    const filteredCafes =
      openNow === "true"
        ? cafes.filter((cafe) => isCafeOpenNow(cafe.schedule))
        : cafes;

    res.json(filteredCafes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalle de café
router.get("/:id", async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id)
      .populate("categories", "name")
      .populate("menu")
      .populate("managerId", "fullName")
      .populate({
        path: "reviews",
        select: "rating comment createdAt clientId",
        populate: {
          path: "clientId",
          select: "firstName lastName profilePicture",
        },
        options: { sort: { createdAt: -1 } },
      });

    if (!cafe) {
      return res.status(404).json({ error: "Café not found" });
    }

    res.json(cafe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar ítems al menú
router.post("/:id/menu", verifyAuth0, async (req, res) => {
  try {
    const { items } = req.body;

    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(403).json({ error: "Unauthorized" });

    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    if (String(cafe.managerId) !== String(manager._id)) {
      return res.status(403).json({ error: "Only the owner can update the menu" });
    }

    cafe.menu.push(...items);
    await cafe.save();

    res.status(201).json({ message: "Menu updated", menu: cafe.menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar ítem del menú
router.put("/:cafeId/menu/:itemId", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(403).json({ error: "Unauthorized" });

    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    if (String(cafe.managerId) !== String(manager._id)) {
      return res.status(403).json({ error: "Only the owner can update the menu" });
    }

    const item = cafe.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Menu item not found" });

    Object.assign(item, req.body);
    await cafe.save();

    res.json({ message: "Menu item updated", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar ítem del menú
router.delete("/:cafeId/menu/:itemId", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(403).json({ error: "Unauthorized" });

    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    if (String(cafe.managerId) !== String(manager._id)) {
      return res.status(403).json({ error: "Only the owner can modify the menu" });
    }

    const item = cafe.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Menu item not found" });

    item.remove();
    await cafe.save();

    res.json({ message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activar / desactivar café (admin)
router.patch("/:id/active", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const updated = await Cafe.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Café not found" });

    res.json({ message: "Café status updated", cafe: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

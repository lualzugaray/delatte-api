import express from "express";
import Cafe from "../models/Cafe.js";
import Category from "../models/Category.js";
import Manager from "../models/Manager.js";
import isAdmin from "../middlewares/isAdmin.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import { isCafeOpenNow } from "../utils/isCafeOpenNow.js";
import { normalizeText } from "../utils/text.js";

const router = express.Router();

// GET /api/cafes
router.get("/", async (req, res) => {
  try {
    const {
      q,
      categories,
      ratingMin,
      sortBy = "createdAt",
      openNow,
      limit = 10,
      skip = 0,
    } = req.query;

    const match = { isActive: true };

    if (q) {
      const normalizedQ = normalizeText(q);
      const regex = new RegExp(normalizedQ, "i");

      const matchedCats = await Category.find({
        name: { $regex: regex }
      });
      const matchedCatIds = matchedCats.map(cat => cat._id);

      match.$or = [
        { nameNormalized:        regex },
        { descriptionNormalized: regex },
        { categories:           { $in: matchedCatIds } },
        { perceptualCategories: { $in: matchedCatIds } }
      ];
    }

    if (categories) {
      match.categories = { $in: categories.split(",") };
    }

    if (ratingMin) {
      match.averageRating = { $gte: parseFloat(ratingMin) };
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from:         "reviews",
          localField:   "_id",
          foreignField: "cafeId",
          as:           "reviews",
        },
      },
      {
        $addFields: {
          reviewsCount: { $size: "$reviews" },
        },
      },
      {
        $project: {
          name:          1,
          address:       1,
          location:      1,
          description:   1,
          categories:    1,
          gallery:       1,
          coverImage:    1,
          averageRating: 1,
          reviewsCount:  1,
          schedule:      1,
        },
      },
      {
        $sort:
          sortBy === "rating"
            ? { averageRating: -1 }
            : { [sortBy]: -1 }
      },
      { $skip:  parseInt(skip,  10) },
      { $limit: parseInt(limit, 10) },
    ];

    let cafes = await Cafe.aggregate(pipeline).exec();

    if (openNow === "true") {
      cafes = cafes.filter(cafe => isCafeOpenNow(cafe.schedule));
    }

    res.json(cafes);
  } catch (err) {
    console.error("Error en GET /api/cafes:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cafes/suggestions
router.post("/suggestions", verifyAuth0, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name required" });
    }

    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizeText(name)}$`, "i") }
    });

    if (exists) {
      return res
        .status(400)
        .json({ error: "Category already exists or suggested" });
    }

    const newCat = new Category({
      name,
      type:       "suggested",
      isActive:   false,
      suggestedBy: req.auth.sub
    });

    await newCat.save();
    res.status(201).json({ message: "Suggestion submitted" });
  } catch (err) {
    console.error("Error en POST /api/cafes/suggestions:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cafes/:id — detalle de un café
router.get("/:id", async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id)
      .populate("categories", "name")
      .populate("menu")
      .populate("managerId", "fullName")
      .populate({
        path:    "reviews",
        select:  "rating comment createdAt clientId",
        populate: {
          path:   "clientId",
          select: "firstName lastName profilePicture",
        },
        options: { sort: { createdAt: -1 } },
      });

    if (!cafe) {
      return res.status(404).json({ error: "Café not found" });
    }

    res.json(cafe);
  } catch (err) {
    console.error("Error en GET /api/cafes/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cafes/:id/menu — agregar ítems al menú
router.post("/:id/menu", verifyAuth0, async (req, res) => {
  try {
    const { items } = req.body;
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) {
      return res.status(404).json({ error: "Café not found" });
    }
    if (String(cafe.managerId) !== String(manager._id)) {
      return res
        .status(403)
        .json({ error: "Only the owner can update the menu" });
    }

    cafe.menu.push(...items);
    await cafe.save();
    res.status(201).json({ message: "Menu updated", menu: cafe.menu });
  } catch (err) {
    console.error("Error en POST /api/cafes/:id/menu:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cafes/:cafeId/menu/:itemId — editar ítem del menú
router.put("/:cafeId/menu/:itemId", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe) {
      return res.status(404).json({ error: "Café not found" });
    }
    if (String(cafe.managerId) !== String(manager._id)) {
      return res
        .status(403)
        .json({ error: "Only the owner can update the menu" });
    }

    const item = cafe.menu.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    Object.assign(item, req.body);
    await cafe.save();
    res.json({ message: "Menu item updated", item });
  } catch (err) {
    console.error(
      "Error en PUT /api/cafes/:cafeId/menu/:itemId:",
      err
    );
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cafes/:cafeId/menu/:itemId — eliminar ítem del menú
router.delete("/:cafeId/menu/:itemId", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe) {
      return res.status(404).json({ error: "Café not found" });
    }
    if (String(cafe.managerId) !== String(manager._id)) {
      return res
        .status(403)
        .json({ error: "Only the owner can modify the menu" });
    }

    const item = cafe.menu.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    item.remove();
    await cafe.save();
    res.json({ message: "Menu item deleted" });
  } catch (err) {
    console.error(
      "Error en DELETE /api/cafes/:cafeId/menu/:itemId:",
      err
    );
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cafes/:id/active — activar/desactivar café (admin)
router.patch("/:id/active", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const updated = await Cafe.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Café not found" });
    }
    res.json({ message: "Café status updated", cafe: updated });
  } catch (err) {
    console.error("Error en PATCH /api/cafes/:id/active:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

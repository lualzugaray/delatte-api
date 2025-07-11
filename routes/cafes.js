import express from "express";
import Cafe from "../models/Cafe.js";
import Category from "../models/Category.js";
import Manager from "../models/Manager.js";
import isAdmin from "../middlewares/isAdmin.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import { isCafeOpenNow } from "../utils/isCafeOpenNow.js";

const router = express.Router();

// routes/cafes.js
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

    const query = { isActive: true };

    // 🟡 Si hay búsqueda textual
    if (q) {
      const regex = new RegExp(q, "i");

      // Buscamos IDs de categorías cuyo nombre matchee el texto
      const matchedCats = await Category.find({ name: regex });
      const matchedCatIds = matchedCats.map((cat) => cat._id);

      // Búsqueda combinada: nombre, descripción o match con categorías
      query.$or = [
        { name: regex },
        { description: regex },
        { categories: { $in: matchedCatIds } },
        { perceptualCategories: { $in: matchedCatIds } },
      ];
    }

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
        .select("name location address averageRating description categories reviews coverImage gallery")
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
    console.error("Error en /api/cafes:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/suggestions", verifyAuth0, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (exists) return res.status(400).json({ error: "Category already exists or suggested" });

    const newCat = new Category({
      name,
      type: "suggested",
      isActive: false,
      suggestedBy: req.auth.sub
    });

    await newCat.save();
    res.status(201).json({ message: "Suggestion submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Obtener detalle de un café
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

// ✅ Agregar ítems al menú
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

// ✅ Editar ítem del menú
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

// ✅ Eliminar ítem del menú
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

// ✅ Activar / desactivar café (admin)
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

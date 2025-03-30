import express from "express";
import Cafe from "../models/Cafe.js";
import Category from "../models/Category.js";
import isAdmin from "../middlewares/isAdmin.js";
import auth from "../middlewares/auth.js";
import { isValidScheduleForCategory } from "../utils/scheduleValidators.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { role, userId } = req.user;

    if (role !== "manager") {
      return res.status(403).json({ error: "Only managers can create a café" });
    }

    const { name, address, lat, lng, description, categories, gallery, schedule } = req.body;

    if (!name || !address || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validación automática de categorías
    let validCategories = categories || [];
    const ignoredCategories = [];

    if (schedule && Array.isArray(validCategories)) {
      const categoryDocs = await Category.find({ _id: { $in: validCategories }, isActive: true });

      const validated = categoryDocs.filter((cat) => {
        if (!cat.validateBySchedule) return true;

        const isValid =
          (cat.name === "Abre hasta tarde" && isValidScheduleForCategory(schedule, "openAfter20")) ||
          (cat.name === "Abre temprano" && isValidScheduleForCategory(schedule, "openBefore8"));

        if (!isValid) ignoredCategories.push(cat.name);
        return isValid;
      });

      validCategories = validated.map((cat) => cat._id);
    }

    const newCafe = new Cafe({
      name,
      address,
      description,
      location: { lat, lng },
      categories: validCategories,
      gallery,
      managerId: userId,
      schedule,
    });

    await newCafe.save();

    res.status(201).json({
      message: "Café created",
      cafeId: newCafe._id,
      ...(ignoredCategories.length > 0 && { ignoredCategories }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { categories, limit = 10, skip = 0 } = req.query;

    const query = { isActive: true };

    // Si hay filtro por categorías
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

router.get("/", async (req, res) => {
  try {
    const { categories, limit = 10, skip = 0 } = req.query;

    const query = { isActive: true };

    if (categories) {
      const categoryList = categories.split(",");
      query.categories = { $in: categoryList };
    }

    const cafes = await Cafe.find(query)
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
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(cafes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// POST /cafes/:id/menu — Agregar ítem(s) al menú (solo manager dueño del café)
router.post("/:id/menu", auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { items } = req.body; // puede ser uno o varios

    if (role !== "manager") {
      return res
        .status(403)
        .json({ error: "Only managers can modify the menu" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Must send at least one menu item" });
    }

    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) {
      return res.status(404).json({ error: "Café not found" });
    }

    if (String(cafe.managerId) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "You can only update your own café" });
    }

    cafe.menu.push(...items);
    await cafe.save();

    res.status(201).json({ message: "Menu updated", menu: cafe.menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:cafeId/menu/:itemId", auth, async (req, res) => {
  try {
    const { cafeId, itemId } = req.params;
    const { userId, role } = req.user;

    if (role !== "manager") {
      return res
        .status(403)
        .json({ error: "Only managers can update the menu" });
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    if (String(cafe.managerId) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "You can only update your own café" });
    }

    const item = cafe.menu.id(itemId);
    if (!item) return res.status(404).json({ error: "Menu item not found" });

    Object.assign(item, req.body); // actualiza solo los campos enviados
    await cafe.save();

    res.json({ message: "Menu item updated", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:cafeId/menu/:itemId", auth, async (req, res) => {
  try {
    const { cafeId, itemId } = req.params;
    const { userId, role } = req.user;

    if (role !== "manager") {
      return res
        .status(403)
        .json({ error: "Only managers can delete from the menu" });
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    if (String(cafe.managerId) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "You can only modify your own café" });
    }

    const item = cafe.menu.id(itemId);
    if (!item) return res.status(404).json({ error: "Menu item not found" });

    item.remove();
    await cafe.save();

    res.json({ message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/active", auth, isAdmin, async (req, res) => {
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

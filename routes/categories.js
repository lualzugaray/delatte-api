import express from "express";
import Category from "../models/Category.js";
import isAdmin from "../middlewares/isAdmin.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.type) {
      query.type = req.query.type;
    }
    const categories = await Category.find(query);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name)
      return res.status(400).json({ error: "Category name is required" });

    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(409).json({ error: "Category already exists" });

    const category = new Category({ name, description, isActive: true });
    await category.save();

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Category not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/suggest", verifyAuth0, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (req.auth.role !== "manager") {
      return res
        .status(403)
        .json({ error: "Only managers can suggest categories" });
    }

    if (!name) return res.status(400).json({ error: "Name is required" });

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existing)
      return res
        .status(409)
        .json({ error: "Category already exists or was suggested" });

    const newCategory = new Category({
      name: name.trim(),
      description,
      type: "structural",
      isActive: false,
      createdByManager: true,
    });

    await newCategory.save();
    res.status(201).json({ message: "Category suggestion sent for review" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/suggested", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const roleFilter = req.query.role;
    const filter = { isActive: false };

    if (roleFilter === "manager") filter.createdByManager = true;
    else if (roleFilter === "client") filter.createdByClient = true;

    const suggestions = await Category.find(filter);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/approve", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (category.isActive) {
      return res.status(400).json({ error: "Category is already active" });
    }

    category.isActive = true;
    await category.save();

    res.json({ message: "Category approved", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Category not found" });

    res.json({ message: "Category deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

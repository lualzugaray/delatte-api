import express from "express";
import Manager from "../models/Manager.js";
import Cafe from "../models/Cafe.js";
import Review from "../models/Review.js";
import { validationResult } from "express-validator";
import { isValidScheduleForCategory } from "../utils/scheduleValidators.js";
import scheduleValidation from "../validators/scheduleValidator.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import Category from "../models/Category.js";

const router = express.Router();
router.use((req, res, next) => {
  console.log(`Entra a managers.js: ${req.method} ${req.originalUrl}`);
  next();
});


// GET /managers/me — obtener perfil del manager
router.get("/me", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub }).populate("assignedCafe");
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    res.json(manager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /managers/me — actualizar info del manager
router.patch("/me", verifyAuth0, async (req, res) => {
  try {
    const updates = req.body;
    const manager = await Manager.findOneAndUpdate(
      { auth0Id: req.auth.sub },
      updates,
      { new: true }
    );
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    res.json({ message: "Manager updated", manager });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /managers/me/cafe
router.get("/me/cafe", verifyAuth0, async (req, res) => {
  const manager = await Manager.findOne({ auth0Id: req.auth?.sub });

  if (!manager) {
    return res.status(404).json({ error: "Manager not found" });
  }

  const cafe = await Cafe.findOne({ managerId: manager._id });

  if (!cafe) {
    return res.status(404).json({ error: "Café not found" });
  }

  res.json(cafe);
});


// GET /managers/me/stats
router.get("/me/stats", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const cafe = await Cafe.findOne({ managerId: manager._id });
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    const reviews = await Review.find({ cafeId: cafe._id });
    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const latestReviews = reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    res.json({
      cafeName: cafe.name,
      totalReviews,
      averageRating,
      latestReviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /managers/me/cafe — actualizar su cafetería
router.put("/me/cafe", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const cafe = await Cafe.findOne({ managerId: manager._id });
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    const updates = req.body;
    const allowedFields = ["name", "address", "description", "location", "categories", "gallery", "coverImage", "schedule"];
    const ignoredCategories = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === "categories" && updates.schedule) {
          const categoryDocs = await Category.find({ _id: { $in: updates.categories }, isActive: true });

          const validated = categoryDocs.filter((cat) => {
            if (!cat.validateBySchedule) return true;

            const isValid =
              (cat.name === "Abre hasta tarde" && isValidScheduleForCategory(updates.schedule, "openAfter20")) ||
              (cat.name === "Abre temprano" && isValidScheduleForCategory(updates.schedule, "openBefore8"));

            if (!isValid) ignoredCategories.push(cat.name);
            return isValid;
          });

          cafe.categories = validated.map((cat) => cat._id);
        } else {
          cafe[field] = updates[field];
        }
      }
    }

    await cafe.save();

    res.json({
      message: "Café updated",
      cafe,
      ...(ignoredCategories.length > 0 && { ignoredCategories }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /managers/me/cafe/active — activar/desactivar su café
router.patch("/me/cafe/active", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const cafe = await Cafe.findOne({ managerId: manager._id });
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    cafe.isActive = !cafe.isActive;
    await cafe.save();

    res.json({
      message: `Café ${cafe.isActive ? "enabled" : "disabled"}`,
      cafe,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /managers/me/cafe/schedule
router.patch("/me/cafe/schedule", verifyAuth0, scheduleValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const cafe = await Cafe.findOne({ managerId: manager._id });
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    cafe.schedule = req.body.schedule;
    await cafe.save();

    res.json({ message: "Horario actualizado", schedule: cafe.schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/me/cafe", verifyAuth0, async (req, res) => {
  try {
    const auth0Id = req.auth.sub;

    let manager = await Manager.findOne({ auth0Id });

    if (!manager) {
      manager = new Manager({
        auth0Id,
        fullName: req.body.managerName || "Sin nombre", 
      });
      await manager.save();
    }

    const existingCafe = await Cafe.findOne({ managerId: manager._id });
    if (existingCafe) {
      return res.status(400).json({ error: "Ya tienes una cafetería registrada" });
    }

    const newCafe = new Cafe({
      ...req.body,
      managerId: manager._id,
    });

    await newCafe.save();
    manager.assignedCafe = newCafe._id;
    await manager.save();

    res.status(201).json({ message: "Cafetería creada exitosamente", cafe: newCafe });
  } catch (err) {
    console.error("Error en POST /me/cafe:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

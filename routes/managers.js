import express from "express";
import Manager from "../models/Manager.js";
import Cafe from "../models/Cafe.js";
import Review from "../models/Review.js";
import { validationResult } from "express-validator";
import { isValidScheduleForCategory } from "../utils/scheduleValidators.js";
import scheduleValidation from "../validators/scheduleValidator.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import Category from "../models/Category.js";
import ReviewReport from "../models/ReviewReport.js";

const router = express.Router();
router.use((req, res, next) => {
  console.log(`Entra a managers.js: ${req.method} ${req.originalUrl}`);
  next();
});


router.get("/me", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub }).populate("assignedCafe");
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    res.json(manager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.get("/me/reviews", verifyAuth0, async (req, res) => {
  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const cafe = await Cafe.findOne({ managerId: manager._id });
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    const reviews = await Review.find({ cafeId: cafe._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/me/reviews/:reviewId/report", verifyAuth0, async (req, res) => {
  const { reviewId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return res.status(400).json({ error: "Debes enviar un motivo (mínimo 10 caracteres)" });
  }

  try {
    const manager = await Manager.findOne({ auth0Id: req.auth.sub });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const cafe = await Cafe.findOne({ managerId: manager._id });
    if (!cafe) return res.status(404).json({ error: "Café not found" });

    const review = await Review.findOne({ _id: reviewId, cafeId: cafe._id });
    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada para tu café" });
    }

    const existing = await ReviewReport.findOne({ reviewId, managerId: manager._id });
    if (existing) {
      return res.status(400).json({ error: "Ya has denunciado esta reseña" });
    }

    const report = new ReviewReport({
      reviewId,
      managerId: manager._id,
      reason
    });
    await report.save();

    res.status(201).json({ message: "Denuncia registrada", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
        if (field === "schedule") {
          const raw = updates.schedule;
          const recalculated = {};
          for (const [day, { open, close }] of Object.entries(raw)) {
            recalculated[day] = { open, close, isClosed: !(open && close) };
          }
          cafe.schedule = recalculated;
        }
        else if (field === "categories" && updates.schedule) {
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

    const newSchedule = {};
    for (const [day, { open, close }] of Object.entries(req.body.schedule)) {
      newSchedule[day] = {
        open,
        close,
        isClosed: !(open && close)
      };
    }
    cafe.schedule = newSchedule;
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

    const scheduleObj = (req.body.schedule || []).reduce((acc, { day, open, close }) => {
      acc[day] = {
        open,
        close,
        isClosed: !(Boolean(open) && Boolean(close))
      };
      return acc;
    }, {});

    const newCafe = new Cafe({
      ...req.body,
      schedule: scheduleObj,
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

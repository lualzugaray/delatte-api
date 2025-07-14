import express from "express";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import isAdmin from "../middlewares/isAdmin.js";

import User from "../models/User.js";
import Cafe from "../models/Cafe.js";
import Client from "../models/Client.js";
import Manager from "../models/Manager.js";
import Admin from "../models/Admin.js";
import Review from "../models/Review.js";
import ReviewReport from "../models/ReviewReport.js";
import Category from "../models/Category.js";

const router = express.Router();

// 📊 Dashboard admin
router.get("/stats", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const users = await User.countDocuments();
    const clients = await Client.countDocuments();
    const managers = await Manager.countDocuments();
    const admins = await Admin.countDocuments();
    const cafes = await Cafe.countDocuments();
    const reviews = await Review.countDocuments();
    const reports = await ReviewReport.countDocuments({ status: "pending" });

    res.json({
      users,
      clients,
      managers,
      admins,
      cafes,
      reviews,
      pendingReports: reports,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚨 Ver reportes de reseñas
router.get("/review-reports", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const reports = await ReviewReport.find()
      .populate("reviewId")
      .populate("managerId");
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Cambiar estado del reporte
router.patch("/review-reports/:id", verifyAuth0, isAdmin, async (req, res) => {
  const { status } = req.body;
  if (!["pending", "reviewed", "dismissed"].includes(status)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  try {
    const updated = await ReviewReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Reporte no encontrado" });

    res.json({ message: "Reporte actualizado", updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑 Eliminar café
router.delete("/cafes/:id", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const deleted = await Cafe.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Café no encontrado" });

    await Review.deleteMany({ cafeId: deleted._id });
    await Manager.updateMany({ assignedCafe: deleted._id }, { assignedCafe: null });

    res.json({ message: "Café y sus reseñas eliminados", deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑 Eliminar usuario
router.delete("/users/:id", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const role = user.role;
    if (role === "client") await Client.deleteOne({ userId: user._id });
    else if (role === "manager") await Manager.deleteOne({ userId: user._id });
    else if (role === "admin") await Admin.deleteOne({ userId: user._id });

    res.json({ message: `Usuario ${role} eliminado` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔁 Activar/desactivar usuario
router.patch("/users/:id/active", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });

    if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({ message: "Estado actualizado", user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

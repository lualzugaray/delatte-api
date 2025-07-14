import express from "express";
import Review from "../models/Review.js";
import Client from "../models/Client.js";
import Cafe from "../models/Cafe.js";
import Category from "../models/Category.js";
import isAdmin from "../middlewares/isAdmin.js";
import verifyAuth0 from "../middlewares/verifyAuth0.js";
import { updateAverageRating } from "../utils/ratings.js";

const router = express.Router();

// GET /reviews?cafeId=... — obtener reviews públicas
router.get("/", async (req, res) => {
  try {
    const { cafeId } = req.query;

    if (!cafeId) {
      return res.status(400).json({ error: "Missing cafeId in query params" });
    }

    const reviews = await Review.find({ cafeId })
      .populate("clientId", "firstName lastName profilePicture")
      .populate("categories", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews — crear una reseña (cliente autenticado)
router.post("/", verifyAuth0, async (req, res) => {
  try {
    const {
      cafeId,
      rating,
      comment,
      image,
      selectedCategoryIds = [],
      newCategoryNames = [],
    } = req.body;

    if (!cafeId || !rating) {
      return res.status(400).json({ error: "cafeId and rating are required" });
    }

    const client = await Client.findOne({ auth0Id: req.auth.sub });
    console.log(client);
    console.log(req.auth);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const clientId = client._id;

    const existing = await Review.findOne({ cafeId, clientId });
    if (existing) {
      return res
        .status(400)
        .json({ error: "You already left a review for this café" });
    }

    const createdCategories = await Promise.all(
      newCategoryNames.map(async (name) => {
        const normalizedName = name.trim().toLowerCase();

        const existing = await Category.findOne({
          name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
        });
        if (existing) return null;

        const cat = new Category({
          name: name.trim(),
          type: "perceptual",
          isActive: false,
          createdByClient: true,
        });

        return await cat.save();
      })
    );

    const validCategoryIds = [
      ...selectedCategoryIds,
      ...createdCategories.filter(Boolean).map((cat) => cat._id),
    ];

    const review = new Review({
      cafeId,
      clientId,
      rating,
      comment,
      image,
      categories: validCategoryIds,
    });
    await review.save();

    const perceptualCats = await Category.find({
      _id: { $in: validCategoryIds },
      type: "perceptual",
      isActive: true,
    });

    const cafe = await Cafe.findById(cafeId);
    const current = cafe.perceptualCategories.map((id) => id.toString());
    const toAdd = perceptualCats
      .map((c) => c._id.toString())
      .filter((id) => !current.includes(id));

    if (toAdd.length) {
      cafe.perceptualCategories.push(...toAdd);
    }

    if (image && image.trim()) {
      if (!cafe.gallery.includes(image)) {
        cafe.gallery.push(image);
      }
    }
    await cafe.save();
    await updateAverageRating(cafeId);

    res.status(201).json({ message: "Review created", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /reviews/:id — eliminar reseña (admin)
router.delete("/:id", verifyAuth0, isAdmin, async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (deleted.image && deleted.image.trim()) {
      const cafe = await Cafe.findById(deleted.cafeId);
      if (cafe) {
        const otherReviewsWithSameImage = await Review.findOne({
          cafeId: deleted.cafeId,
          image: deleted.image,
          _id: { $ne: deleted._id }
        });

        if (!otherReviewsWithSameImage) {
          cafe.gallery = cafe.gallery.filter(img => img !== deleted.image);
          await cafe.save();
        }
      }
    }

    await updateAverageRating(deleted.cafeId);

    res.json({ message: "Review deleted", review: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
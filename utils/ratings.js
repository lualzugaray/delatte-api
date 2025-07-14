import Review from "../models/Review.js";
import Cafe from "../models/Cafe.js";

export async function updateAverageRating(cafeId) {
  const reviews = await Review.find({ cafeId });
  let average = 0;

  if (reviews.length) {
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    average = total / reviews.length;
  }

  await Cafe.findByIdAndUpdate(cafeId, { averageRating: average });
}

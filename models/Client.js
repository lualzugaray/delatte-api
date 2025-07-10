import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true }, // ← String, no ObjectId
  firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  lastName: { type: String, trim: true, maxlength: 50 },
  profilePicture: {
    type: String,
    validate: {
      validator: v => !v || /^https?:\/\/.+/.test(v),
      message: "El link de la imagen no es válido"
    }
  },
  bio: { type: String, maxlength: 280 },
  preferences: [{ type: String, trim: true }],
  socialLinks: {
    instagram: {
      type: String,
      validate: {
        validator: v => !v || /^https:\/\/(www\.)?instagram\.com\/.+/.test(v),
        message: "Link de Instagram inválido"
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: v => !v || /^https:\/\/(www\.)?twitter\.com\/.+/.test(v),
        message: "Link de Twitter inválido"
      }
    },
    facebook: {
      type: String,
      validate: {
        validator: v => !v || /^https:\/\/(www\.)?facebook\.com\/.+/.test(v),
        message: "Link de Facebook inválido"
      }
    },
    tiktok: {
      type: String,
      validate: {
        validator: v => !v || /^https:\/\/(www\.)?tiktok\.com\/.+/.test(v),
        message: "Link de TikTok inválido"
      }
    },
    website: {
      type: String,
      validate: {
        validator: v => !v || /^https?:\/\/.+/.test(v),
        message: "Link de sitio web inválido"
      }
    }
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cafe" }],
  registeredAt: { type: Date, default: Date.now }
});

export default mongoose.model("Client", clientSchema);

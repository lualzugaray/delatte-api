import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

import authRoutes from "./routes/auth.js";
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

import userRoutes from "./routes/users.js";
app.use("/api/users", userRoutes);

import cafesRoutes from "./routes/cafes.js";
app.use("/api/cafes", cafesRoutes);

import categoriesRoutes from "./routes/categories.js";
app.use("/api/categories", categoriesRoutes);

import reviewsRoutes from "./routes/reviews.js";
app.use("/api/reviews", reviewsRoutes);

import clientsRoutes from "./routes/clients.js";
app.use("/api/clients", clientsRoutes);

import managersRoutes from "./routes/managers.js";
app.use("/api/managers", managersRoutes);

import adminRoutes from "./routes/admin.js";
app.use("/api/admin", adminRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(process.env.PORT || 3000, () =>
      console.log('Servidor corriendo en el puerto 3000')
    );
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

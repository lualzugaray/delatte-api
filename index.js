// index.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

import authRoutes from "./routes/auth.js";
app.use("/auth", authRoutes);

// Ruta para probar que el servidor funciona
app.get("/", (req, res) => {
  res.send("Servidor funcionando 👌");
});

import usuariosRoutes from "./routes/usuarios.js";
app.use("/usuarios", usuariosRoutes);

import cafesRoutes from "./routes/cafes.js";
app.use("/cafes", cafesRoutes);

import categoriesRoutes from "./routes/categories.js";
app.use("/categories", categoriesRoutes);

import reviewsRoutes from "./routes/reviews.js";
app.use("/reviews", reviewsRoutes);

import clientsRoutes from "./routes/clients.js";
app.use("/clients", clientsRoutes);

import managersRoutes from "./routes/managers.js";
app.use("/managers", managersRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(process.env.PORT || 3000, () =>
      console.log('Servidor corriendo en el puerto 3000')
    );
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

import mongoose from "mongoose";
import dotenv from "dotenv";
import { normalizeText } from "../utils/text.js";

import User from "../models/User.js";
import Manager from "../models/Manager.js";
import Client from "../models/Client.js";
import Category from "../models/Category.js";
import Cafe from "../models/Cafe.js";
import Review from "../models/Review.js";
import ReviewReport from "../models/ReviewReport.js";

dotenv.config();

async function updateAvgRating(cafeId) {
  const reviews = await Review.find({ cafeId });
  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  await Cafe.findByIdAndUpdate(cafeId, { averageRating: avg });
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Conectado a MongoDB");

  // 0) Limpiar colecciones
  await Promise.all([
    User.deleteMany({}),
    Manager.deleteMany({}),
    Client.deleteMany({}),
    Category.deleteMany({}),
    Cafe.deleteMany({}),
    Review.deleteMany({}),
    ReviewReport.deleteMany({}),
  ]);
  console.log("🗑️ Colecciones limpiadas");

  // 1) Usuarios
  const usersData = [
    { email: "admin@delatte.com",  password: "admin123",   role: "admin"   },
    { email: "mgr1@delatte.com",   password: "mgr123",     role: "manager" },
    { email: "mgr2@delatte.com",   password: "mgr234",     role: "manager" },
    { email: "client1@delatte.com",password: "cli123",     role: "client"  },
    { email: "client2@delatte.com",password: "cli234",     role: "client"  },
  ];
  const users = {};
  for (let u of usersData) {
    users[u.role + (u.email.includes("1")?"1":"2") || u.role] = await User.create(u);
  }
  console.log("👥 Usuarios creados");

  // 2) Managers y Clients
  const mgr1 = await Manager.create({
    auth0Id: users.manager1._id,
    fullName: "Manager Uno",
    phone: "099111111"
  });
  const mgr2 = await Manager.create({
    auth0Id: users.manager2._id,
    fullName: "Manager Dos",
    phone: "099222222"
  });
  const cli1 = await Client.create({
    auth0Id: users.client1._id,
    firstName: "Cliente",
    lastName: "Uno"
  });
  const cli2 = await Client.create({
    auth0Id: users.client2._id,
    firstName: "Cliente",
    lastName: "Dos"
  });
  console.log("🧑‍💼 Managers y 👤 Clients creados");

  // 3) Categorías
  const categoriesData = [
    // estructurales
    { name: "WiFi",                   type: "structural", isActive: true  },
    { name: "Céntrico",               type: "structural", isActive: true  },
    { name: "Reservas",               type: "structural", isActive: true  },
    { name: "Opciones vegetarianas",  type: "structural", isActive: true  },
    { name: "Al aire libre",          type: "structural", isActive: false },
    { name: "Espacio techado",        type: "structural", isActive: true  },
    { name: "Abre temprano",          type: "structural", isActive: true  },
    { name: "Abre hasta tarde",       type: "structural", isActive: true  },

    // perceptuales
    { name: "Instagrammeable",        type: "perceptual", isActive: true  },
    { name: "Estilo vintage",         type: "perceptual", isActive: true  },
    { name: "Ambiente relajado",      type: "perceptual", isActive: true  },
    { name: "Tradicional",            type: "perceptual", isActive: true  },
    { name: "Con plantas",            type: "perceptual", isActive: false },
    { name: "Digital nomad",          type: "perceptual", isActive: true  },
    { name: "Hipster",                type: "perceptual", isActive: true  },
    { name: "Especialistas en café",  type: "perceptual", isActive: true  },
  ];
  const cats = {};
  for (let c of categoriesData) {
    const cat = await Category.create(c);
    cats[c.name] = cat._id;
  }
  console.log("🏷️ Categorías creadas");

  // 4) Cafés de prueba
  const cafeDefs = [
    {
      name: "La Farmacia Café",  // tilde en Café
      address: "Ciudad Vieja",
      description: "Antiguo local estilo farmacia transformado en café boutique.",
      location: { lat: -34.906, lng: -56.199 },
      categories: [cats["WiFi"], cats["Céntrico"]],
      perceptualCategories: [cats["Instagrammeable"], cats["Estilo vintage"]],
      gallery: [
        "https://images.unsplash.com/photo-1586985289384-a4155223d1d5"
      ],
      coverImage: "https://images.unsplash.com/photo-1586985289384-a4155223d1d5",
      menu: [
        { name: "Flat White", price: 190 },
        { name: "Alfajor artesanal", price: 160 }
      ],
      schedule: {
        lunes:     { open:"08:00", close:"20:00" },
        martes:    { open:"08:00", close:"20:00" },
        miércoles:{ open:"08:00", close:"20:00" },
        jueves:    { open:"08:00", close:"20:00" },
        viernes:   { open:"08:00", close:"22:00" }, // abre hasta tarde
        sábado:    { open:"00:00", close:"23:59" }, // 24h sábado
        domingo:   { open:null,   close:null, isClosed:true } // cerrado domingo
      },
      managerId: mgr1._id,
      isActive: true,
      reviews: [
        { clientId: cli1._id, rating: 5, comment: "Excelente!", categories: [cats["Estilo vintage"]] },
        { clientId: cli2._id, rating: 4, comment: "Muy bueno.", categories: [cats["Instagrammeable"]] },
      ]
    },
    {
      name: "Culto Cafe",  // sin tilde
      address: "Córdoba",
      description: "Espacio industrial, tueste y sabor.",
      location: { lat: -34.908, lng: -56.175 },
      categories: [cats["WiFi"], cats["Espacio techado"]],
      perceptualCategories: [cats["Ambiente relajado"]],
      gallery: [
        "https://images.unsplash.com/photo-1533777324565-a040eb52fac2"
      ],
      coverImage: "https://images.unsplash.com/photo-1533777324565-a040eb52fac2",
      menu: [
        { name: "Americano", price: 150 },
        { name: "Bagel vegano", price: 200 }
      ],
      schedule: {
        lunes:   { open:"07:00", close:"18:00" }, // abre temprano
        martes:  { open:"07:00", close:"18:00" },
        miércoles: { open:"07:00", close:"18:00" },
        jueves:  { open:"07:00", close:"18:00" },
        viernes: { open:"07:00", close:"18:00" },
        sábado:  { open:"08:00", close:"16:00" },
        domingo: { open:"08:00", close:"16:00" },
      },
      managerId: mgr1._id,
      isActive: true,
      reviews: [
        { clientId: cli2._id, rating: 2, comment: "Muy ruidoso.", categories: [cats["Ambiente relajado"]] },
        { clientId: cli1._id, rating: 3, comment: "Justo OK.", categories: [] },
      ]
    },
    {
      name: "Inactive Café",
      address: "Prueba inactiva",
      description: "Este café está marcado como inactivo y no debería aparecer.",
      location: { lat: -34.900, lng: -56.100 },
      categories: [],
      perceptualCategories: [],
      gallery: [],
      coverImage: "",
      menu: [],
      schedule: {
        lunes:     { open:"09:00", close:"17:00" },
        martes:    { open:"09:00", close:"17:00" },
        miércoles:{ open:"09:00", close:"17:00" },
        jueves:    { open:"09:00", close:"17:00" },
        viernes:   { open:"09:00", close:"17:00" },
        sábado:    { open:null,   close:null, isClosed:true },
        domingo:   { open:null,   close:null, isClosed:true },
      },
      managerId: mgr2._id,
      isActive: false,
      reviews: []
    },
    {
      name: "No Reviews Café",
      address: "Sin reseñas",
      description: "Café sin reseñas para probar averageRating=0.",
      location: { lat: -34.910, lng: -56.150 },
      categories: [cats["Reservas"]],
      perceptualCategories: [cats["Tradicional"]],
      gallery: [],
      coverImage: "",
      menu: [{ name:"Espresso", price:100 }],
      schedule: {
        lunes:   { open:"10:00", close:"14:00" },
        martes:  { open:"10:00", close:"14:00" },
        miércoles:{ open:"10:00", close:"14:00" },
        jueves:  { open:"10:00", close:"14:00" },
        viernes: { open:"10:00", close:"14:00" },
        sábado:  { open:"10:00", close:"14:00" },
        domingo:{ open:null,close:null,isClosed:true }
      },
      managerId: mgr2._id,
      isActive: true,
      reviews: []
    }
  ];

  // Crear cafés y sus reseñas
  for (let def of cafeDefs) {
    const cafe = await Cafe.create({
      name:        def.name,
      address:     def.address,
      location:    def.location,
      description: def.description,
      categories:  def.categories,
      perceptualCategories: def.perceptualCategories,
      gallery:     def.gallery,
      coverImage:  def.coverImage,
      menu:        def.menu,
      schedule:    def.schedule,
      managerId:   def.managerId,
      isActive:    def.isActive
    });

    for (let r of def.reviews) {
      await Review.create({
        cafeId:    cafe._id,
        clientId:  r.clientId,
        rating:    r.rating,
        comment:   r.comment,
        categories:r.categories
      });
    }

    await updateAvgRating(cafe._id);
    console.log(`☕ Seeded café: ${def.name}`);
  }

  // 5) Favorites (solo cli1)
  const allCafes = await Cafe.find({ isActive: true });
  cli1.favorites = allCafes.slice(0, 2).map(c=>c._id);
  await cli1.save();
  console.log("⭐ Favorites asignadas a cliente uno");

  // 6) Review Reports (mgr1 denuncia la primer reseña de su café)
  const cafe1 = await Cafe.findOne({ managerId: mgr1._id });
  const rev = await Review.findOne({ cafeId: cafe1._id });
  if (rev) {
    await ReviewReport.create({
      reviewId: rev._id,
      managerId: mgr1._id,
      reason: "Contenido inapropiado en la reseña."
    });
    console.log("🚩 ReviewReport creado");
  }

  console.log("✅ SeedAll completado exitosamente");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});

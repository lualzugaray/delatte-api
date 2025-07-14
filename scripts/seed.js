import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
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
    { email: "admin@delatte.com",   password: "admin123", role: "admin"   },
    { email: "mgr1@delatte.com",    password: "mgr123",   role: "manager" },
    { email: "mgr2@delatte.com",    password: "mgr234",   role: "manager" },
    { email: "client1@delatte.com", password: "cli123",   role: "client"  },
    { email: "client2@delatte.com", password: "cli234",   role: "client"  },
  ];
  const users = {};
  for (let u of usersData) {
    const created = await User.create(u);
    const key = u.role + (u.email.includes("1") ? "1" : "2");
    users[key] = created;
  }
  console.log("👥 Usuarios creados");

  // 2) Managers y Clients
  const mgr1 = await Manager.create({
    auth0Id: users.manager1._id,
    fullName: "Manager Uno",
    phone:    "099111111",
  });
  const mgr2 = await Manager.create({
    auth0Id: users.manager2._id,
    fullName: "Manager Dos",
    phone:    "099222222",
  });
  const cli1 = await Client.create({
    auth0Id:   users.client1._id,
    firstName: "Cliente",
    lastName:  "Uno",
  });
  const cli2 = await Client.create({
    auth0Id:   users.client2._id,
    firstName: "Cliente",
    lastName:  "Dos",
  });
  console.log("🧑‍💼 Managers y 👤 Clients creados");

  // 3) Categorías (estructurales + perceptuales)
  const structuralCategories = [
    "WiFi", "Céntrico", "Reservas",
    "Opciones vegetarianas", "Al aire libre",
    "Espacio techado", "Abre temprano", "Abre hasta tarde",
  ];
  const perceptualCategories = [
    "Instagrammeable", "Estilo vintage", "Ambiente relajado",
    "Tradicional", "Con plantas", "Digital nomad",
    "Hipster", "Especialistas en café",
  ];
  const cats = {};
  for (let name of [...structuralCategories, ...perceptualCategories]) {
    const cat = await Category.create({
      name,
      type:      structuralCategories.includes(name) ? "structural" : "perceptual",
      isActive:  true,
    });
    cats[name] = cat._id;
  }
  console.log("🏷️ Categorías creadas");

  // 4) Ejemplos básicos de cafés (opcional)
  const baseCafes = [
    {
      name:                 "La Farmacia Café",
      address:              "Ciudad Vieja",
      description:          "Antiguo local estilo farmacia transformado en café boutique.",
      location:             { lat: -34.906, lng: -56.199 },
      categories:           [ cats["WiFi"], cats["Céntrico"] ],
      perceptualCategories: [ cats["Instagrammeable"], cats["Estilo vintage"] ],
      gallery:              [ "https://images.unsplash.com/photo-1586985289384-a4155223d1d5" ],
      coverImage:           "https://images.unsplash.com/photo-1586985289384-a4155223d1d5",
      menu: [
        { name: "Flat White",       price: 190 },
        { name: "Alfajor artesanal", price: 160 }
      ],
      schedule: {
        lunes:     { open: "08:00", close: "20:00" },
        martes:    { open: "08:00", close: "20:00" },
        miércoles: { open: "08:00", close: "20:00" },
        jueves:    { open: "08:00", close: "20:00" },
        viernes:   { open: "08:00", close: "22:00" },
        sábado:    { open: "09:00", close: "18:00" },
        domingo:   { open: null,    close: null, isClosed: true }
      },
      managerId: mgr1._id,
      isActive:  true,
      reviews: [
        {
          clientId:   cli1._id,
          rating:     5,
          comment:    "Excelente!",
          categories: [ cats["Estilo vintage"] ]
        },
        {
          clientId:   cli2._id,
          rating:     4,
          comment:    "Muy bueno.",
          categories: [ cats["Instagrammeable"] ]
        }
      ]
    }
  ];

  for (let def of baseCafes) {
    // Separa reviews del resto de los datos
    const { reviews: reviewDefs, ...cafeData } = def;

    // Crea el café sin la propiedad `reviews`
    const cafe = await Cafe.create(cafeData);

    // Crea las reviews en su propia colección
    if (Array.isArray(reviewDefs)) {
      for (let r of reviewDefs) {
        await Review.create({ ...r, cafeId: cafe._id });
      }
      await updateAvgRating(cafe._id);
    }

    console.log(`☕ Seeded café: ${def.name}`);
  }

  // 5) Autofill de cafés usando Faker
  const sampleImgs  = [
    "https://images.unsplash.com/photo-1560448204-53e8d8dd77e0",
    "https://images.unsplash.com/photo-1523942839745-7848d43b21b5",
    "https://images.unsplash.com/photo-1533777324565-a040eb52fac2",
    "https://images.unsplash.com/photo-1600464209074-2d7e5f548a2a",
    "https://images.unsplash.com/photo-1547046875-711112849fd0",
    "https://images.unsplash.com/photo-1511988617509-a57c8a288659"
  ];
  const managers   = [ mgr1, mgr2 ];
  const clients    = [ cli1, cli2 ];
  const categoryIds= Object.values(cats);

  for (let i = 0; i < 10; i++) {
    const manager = faker.helpers.arrayElements(managers, 1)[0];
    const name    = faker.company.name() + " Café";
    const address = `${faker.location.streetAddress()}, Montevideo`;
    const lat     = parseFloat(faker.location.latitude(-34.95, -34.80));
    const lng     = parseFloat(faker.location.longitude(-56.25, -56.10));

    const catsCount = faker.number.int({ min: 1, max: 4 });
    const perfCount = faker.number.int({ min: 1, max: 4 });
    const catsRnd   = faker.helpers.arrayElements(categoryIds, catsCount);
    const perfRnd   = faker.helpers.arrayElements(categoryIds, perfCount);
    const imgs      = faker.helpers.arrayElements(sampleImgs, faker.number.int({ min: 1, max: 5 }));

    const cafe = await Cafe.create({
      name,
      address,
      location:             { lat, lng },
      description:          faker.lorem.sentences(2),
      categories:           catsRnd,
      perceptualCategories: perfRnd,
      gallery:              imgs,
      coverImage:           imgs[0],
      menu: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }).map(() => ({
        name:  faker.commerce.productName(),
        price: faker.number.int({ min: 80, max: 350 })
      })),
      schedule: {
        lunes:     { open: "08:00", close: "20:00" },
        martes:    { open: "08:00", close: "20:00" },
        miércoles: { open: "08:00", close: "20:00" },
        jueves:    { open: "08:00", close: "20:00" },
        viernes:   { open: "08:00", close: "22:00" },
        sábado:    { open: "09:00", close: "18:00" },
        domingo:   { open: null,    close: null, isClosed: true }
      },
      managerId:            manager._id,
      isActive:             true
    });

    // Seed de reviews Faker
    const revCount = faker.number.int({ min: 0, max: 5 });
    for (let j = 0; j < revCount; j++) {
      await Review.create({
        cafeId:     cafe._id,
        clientId:   faker.helpers.arrayElements(clients, 1)[0]._id,
        rating:     faker.number.int({ min: 1, max: 5 }),
        comment:    faker.lorem.sentence(),
        categories: faker.helpers.arrayElements(categoryIds, faker.number.int({ min: 0, max: 2 }))
      });
    }

    await updateAvgRating(cafe._id);
    console.log(`⚙️  Auto-seeded café: ${name}`);
  }

  // 6) Favorites (solo cli1)
  const allCafes = await Cafe.find({ isActive: true });
  cli1.favorites = allCafes.slice(0, 2).map(c => c._id);
  await cli1.save();
  console.log("⭐ Favorites asignadas a cliente uno");

  // 7) Review Report de ejemplo
  const firstCafe   = await Cafe.findOne({ managerId: mgr1._id });
  const firstReview = await Review.findOne({ cafeId: firstCafe._id });
  if (firstReview) {
    await ReviewReport.create({
      reviewId:  firstReview._id,
      managerId: mgr1._id,
      reason:    "Contenido inapropiado."
    });
    console.log("🚩 ReviewReport creado");
  }

  console.log("✅ SeedAll completado exitosamente");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Error en seedAll:", err);
  process.exit(1);
});

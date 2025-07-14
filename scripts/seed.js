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
      name:"La Farmacia Café", address:"Ciudad Vieja, Montevideo",
      location:{lat:-34.906, lng:-56.199},
      description:"Antiguo local estilo farmacia transformado en café boutique.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],     // replace “Tiene enchufes” with your actual key
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1586985289384-a4155223d1d5",
        "https://images.unsplash.com/photo-1523942839745-7848d43b21b5",
        "https://images.unsplash.com/photo-1600464209074-2d7e5f548a2a"
      ],
      menu:[{name:"Flat White",price:190},{name:"Alfajor artesanal",price:160}],
      reviews:[
        {rating:5,comment:"Lugar mágico con café exquisito.",categories:["Estilo vintage"]},
        {rating:4,comment:"Ambiente genial para fotos.",categories:["Instagrammeable"]}
      ]
    },
    {
      name:"Culto Café", address:"Córdoba y Pablo de María, Córdoba",
      location:{lat:-34.908, lng:-56.175},
      description:"Espacio industrial, especialidad en tueste y sabor.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],     // replace “Tiene enchufes” with your actual key
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1533777324565-a040eb52fac2",
        "https://images.unsplash.com/photo-1544060747-2bb51a19a0af",
        "https://images.unsplash.com/photo-1611411117684-5f2d8e5abef2",
        "https://images.unsplash.com/photo-1533777324565-a040eb52fac2"
      ],
      menu:[{name:"Americano",price:150},{name:"Bagel vegano",price:200}],
      reviews:[
        {rating:5,comment:"Excelente tueste y atención.",categories:["Ambiente relajado"]}
      ]
    },
    {
      name:"La Linda Bakery", address:"Punta Carretas, Montevideo",
      location:{lat:-34.929, lng:-56.188},
      description:"Panadería y café con patio interior y brunch.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],     // replace “Tiene enchufes” with your actual key
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1560448204-53e8d8dd77e0",
        "https://images.unsplash.com/photo-1586190848861-99aa4a171e90",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
      ],
      menu:[{name:"Brunch completo",price:320},{name:"Jugo natural",price:140}],
      reviews:[
        {rating:5,comment:"Perfecto para una mañana relajada.",categories:["Con plantas"]}
      ]
    },
    {
      name:"Bar Facal", address:"18 de Julio, Centro",
      location:{lat:-34.902, lng:-56.190},
      description:"Cafetería tradicional con show de tango al mediodía.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1547046875-711112849fd0",
        "https://images.unsplash.com/photo-1556911073-52527ac437f0",
        "https://images.unsplash.com/photo-1562967916-eb82221dfb2d"
      ],
      menu:[{name:"Cafe con leche",price:130},{name:"Medialuna",price:80}],
      reviews:[
        {rating:5,comment:"Un clásico, con tango y sabor.",categories:["Tradicional"]}
      ]
    },
    {
      name:"Seis Montes Tostadores", address:"Córdoba, Cordon",
      location:{lat:-34.9085, lng:-56.180},
      description:"Tostador + cafetería, ambiente vintage y moderno.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],  
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1532634896-26909d0d1aed",
        "https://images.unsplash.com/photo-1560448204-53e8d8dd77e0",
        "https://images.unsplash.com/photo-1573164574398-3f31d17c3f8b"
      ],
      menu:[{name:"Pour over",price:200}],
      reviews:[{rating:5,comment:"Los mejores granos de Montevideo.",categories:["Especialistas en café"]}]
    },
    {
      name:"Café Patrimonio", address:"Córdoba, Cordon",
      location:{lat:-34.909, lng:-56.181},
      description:"Rooftop con vista, tostado especial y brunch.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"], 
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        "https://images.unsplash.com/photo-1529692236671-f1a593e35340"
      ],
      menu:[{name:"Avocado toast",price:280}],
      reviews:[{rating:4,comment:"Buena vista y tranquilo.",categories:["Ambiente relajado"]}]
    },
    {
      name:"Oro del Rhin", address:"Pocitos",
      location:{lat:-34.915, lng:-56.150},
      description:"Confitería de repostería alemana histórica.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"], 
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1511988617509-a57c8a288659",
        "https://images.unsplash.com/photo-1504917595217-2bfa64f7c482",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
      ],
      menu:[{name:"Strudel manzana",price:220}],
      reviews:[{rating:5,comment:"Pastelería alemana fantástica.",categories:["Tradicional"]}]
    },
    {
      name:"Escaramuza", address:"Cordón",
      location:{lat:-34.9095, lng:-56.182},
      description:"Café librería, ideal para leer y relajarse.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
        "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba"
      ],
      menu:[{name:"Latte",price:180},{name:"Torta casera",price:200}],
      reviews:[{rating:5,comment:"Maravilloso para pasar la tarde.",categories:["Con libros"]}]
    },
    {
      name:"Sometimes Sunday", address:"Ciudad Vieja",
      location:{lat:-34.905, lng:-56.195},
      description:"Café abierto domingo, brunch ecléctico.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        "https://images.unsplash.com/photo-1525097487452-6278ff080c31",
        "https://images.unsplash.com/photo-1559847844-5315695d3a63"
      ],
      menu:[{name:"Pancakes",price:260}],
      reviews:[{rating:4,comment:"Muy trendy y buen café.",categories:["Hipster"]}]
    },
    {
      name:"Gold Of The Rhine", address:"Punta Carretas",
      location:{lat:-34.928, lng:-56.188},
      description:"Café moderno, ideal para trabajar y relajarse.",
      categories: [
        cats["WiFi"],
        cats["Espacio techado"],
        cats["Céntrico"]
      ],
      perceptualCategories: [
        cats["Instagrammeable"],
        cats["Estilo vintage"]
      ],
      images:[
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        "https://images.unsplash.com/photo-1511988617509-a57c8a288659",
        "https://images.unsplash.com/photo-1560448204-53e8d8dd77e0"
      ],
      menu:[{name:"Cold brew",price:200}],
      reviews:[{rating:5,comment:"Muy buen ambiente para trabajar.",categories:["Digital nomad"]}]
    },
    {
      name: "La Farmacia Café",  
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

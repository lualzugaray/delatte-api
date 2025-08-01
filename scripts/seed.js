import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import User from "../models/User.js";
import Manager from "../models/Manager.js";
import Client from "../models/Client.js";
import Category from "../models/Category.js";
import Cafe from "../models/Cafe.js";
import Review from "../models/Review.js";
import { ManagementClient } from "auth0";
import ReviewReport from "../models/ReviewReport.js";

dotenv.config();

const auth0 = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_BACKEND_CLIENT_ID,
    clientSecret: process.env.AUTH0_BACKEND_CLIENT_SECRET,
    scope: "create:users read:users update:users",
});

async function updateAvgRating(cafeId) {
    const reviews = await Review.find({ cafeId });
    const avg = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    await Cafe.findByIdAndUpdate(cafeId, { averageRating: avg });
}

async function createAuth0User(email, password, role) {
    let auth0User;

    try {
        const response = await auth0.users.create({
            connection: "Username-Password-Authentication",
            email,
            password,
            email_verified: true,
            app_metadata: { roles: [role] },
        });
        auth0User = response.data || response;
        console.log("🔐 Auth0 user created:", auth0User.user_id);
    } catch (err) {
        if (err.statusCode === 409) {
            const users = await auth0.getUsersByEmail(email);
            auth0User = users[0].data || users[0];
            console.log("⚠️ Auth0 user already exists:", auth0User.user_id);
        } else {
            throw err;
        }
    }

    return auth0User.user_id;
}

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    await Promise.all([
        User.deleteMany({}),
        Manager.deleteMany({}),
        Client.deleteMany({}),
        Category.deleteMany({}),
        Cafe.deleteMany({}),
        Review.deleteMany({}),
        ReviewReport.deleteMany({})
    ]);
    console.log("🗑️ Colecciones limpiadas");

    const users = {};
    for (let { email, password, role } of [
        { email: "admin@delatte.com", password: "Cafe123!", role: "admin" },
        { email: "mgr1@delatte.com", password: "Cafe123!", role: "manager" },
        { email: "mgr2@delatte.com", password: "Cafe123!", role: "manager" },
        { email: "client1@delatte.com", password: "Cafe123!", role: "client" },
        { email: "client2@delatte.com", password: "Cafe123!", role: "client" },
    ]) {
        const auth0Id = await createAuth0User(email, password, role);
        const mongoUser = await User.create({ email, password, role, auth0Id });
        const key = role + (email.includes("1") ? "1" : "2");
        users[key] = mongoUser;
    }

    console.log("👥 Usuarios creados");

    const mgr1 = await Manager.create({
        auth0Id: users.manager1.auth0Id,
        fullName: "Manager Uno",
        phone: "099111111",
    });
    const mgr2 = await Manager.create({
        auth0Id: users.manager2.auth0Id,
        fullName: "Manager Dos",
        phone: "099222222",
    });
    const cli1 = await Client.create({
        auth0Id: users.client1.auth0Id,
        firstName: "Cliente",
        lastName: "Uno",
    });
    const cli2 = await Client.create({
        auth0Id: users.client2.auth0Id,
        firstName: "Cliente",
        lastName: "Dos",
    });

    console.log("🧑‍💼 Managers y 👤 Clients creados");

    const structuralCategoriesData = [
        { name: "Pet-friendly", description: "Permiten el ingreso de mascotas" },
        { name: "WiFi", description: "Ofrecen conexión WiFi gratuita" },
        { name: "Espacio para trabajar", description: "Tienen mesas y ambiente cómodo para trabajar con notebook" },
        { name: "Abre hasta tarde", description: "Cierra después de las 22:00 horas" },
        { name: "Abre temprano", description: "Abre antes de las 08:00 horas" },
        { name: "Al aire libre", description: "Cuenta con espacio al aire libre o terraza" },
        { name: "Opciones vegetarianas", description: "Incluyen comidas vegetarianas" },
        { name: "Opciones veganas", description: "Incluyen opciones veganas" },
        { name: "Opciones sin gluten", description: "Ofrecen alimentos sin TACC" },
        { name: "Accesible", description: "Accesible para personas con movilidad reducida" },
        { name: "Reservas", description: "Permite hacer reservas de mesas" },
        { name: "Espacio tranquilo", description: "Ambiente silencioso, ideal para estudiar o trabajar" },
        { name: "Céntrico", description: "Ubicado en zonas céntricas de la ciudad" },
        { name: "Ideal para ir en grupo", description: "Tiene espacio suficiente para grupos grandes" },
        { name: "Ideal para ir solo", description: "Ambiente cómodo para visitar sin compañía" },
        { name: "Acepta tarjetas", description: "Acepta pagos con tarjetas de débito y/o crédito" },
        { name: "Tiene enchufes", description: "Cuenta con enchufes accesibles para cargar dispositivos" },
        { name: "Espacio techado", description: "Tiene zona techada para días de lluvia" },
        { name: "Cerca de transporte público", description: "Ubicado a pocas cuadras de paradas de ómnibus/tren" }
    ];
    const perceptualCategoriesData = [
        { name: "Ideal para trabajar", description: "Ambiente ideal para trabajar con notebook" },
        { name: "Ideal para estudiar", description: "Ambiente ideal para estudiar tranquilo" },
        { name: "Espacio cowork", description: "Zona con estilo cowork o mesas comunitarias" },
        { name: "Wi-Fi rápido", description: "Buena señal de Wi-Fi para trabajar o estudiar" },
        { name: "Apto para niños", description: "Ambiente cómodo y seguro para ir con niños" },
        { name: "Menú saludable", description: "Ofrecen opciones con ingredientes saludables" },
        { name: "Menú económico", description: "Ofrecen combos o precios accesibles" },
        { name: "Café de especialidad", description: "Preparan café de especialidad" },
        { name: "Venden café en grano", description: "Tienen café para llevar o en paquetes" },
        { name: "Tienda de café", description: "Funcionan también como tienda de café" },
        { name: "Especialistas en café", description: "El café es el foco principal del local" },
        { name: "Estilo minimalista", description: "Decoración sobria, moderna y sencilla" },
        { name: "Estilo vintage", description: "Decoración clásica o retro" },
        { name: "Instagrammeable", description: "Estética visual llamativa y cuidada" },
        { name: "Con plantas", description: "Decorado con muchas plantas y vegetación" },
        { name: "Ambiente silencioso", description: "No hay música fuerte ni ruidos molestos" },
        { name: "Ambiente relajado", description: "Tranquilo, ideal para charlar sin apuro" },
        { name: "Con música en vivo", description: "Tienen shows o música en vivo a veces" },
        { name: "Abierto fines de semana", description: "Abre sábados y domingos" },
        { name: "Cerca de parques", description: "Ubicado junto a plazas o parques verdes" },
        { name: "En el centro", description: "Ubicado en el centro de la ciudad" },
        { name: "En barrio residencial", description: "Ubicado en una zona residencial o tranquila" }
    ];

    const cats = {};
    for (const catData of [...structuralCategoriesData, ...perceptualCategoriesData]) {
        const cat = await Category.create({
            ...catData,
            type: structuralCategoriesData.find(c => c.name === catData.name) ? "structural" : "perceptual",
            isActive: true,
            createdByManager: false,
            createdByClient: false
        });
        cats[cat.name] = cat._id;
    }
    console.log("🏷️ Categorías creadas");

    const baseCafes = [
        {
            name: "Jacinto Café y Restaurante",
            address: "Sarandí 349, Ciudad Vieja",
            description: "Restaurante-café de estilo europeo con ambiente cálido en Ciudad Vieja.",
            location: { lat: -34.90845, lng: -56.20794 },
            categories: [cats["Reservas"], cats["Céntrico"], cats["Opciones vegetarianas"]],
            perceptualCategories: [cats["Estilo vintage"], cats["Ambiente relajado"]],
            gallery: [
                "https://images.pexels.com/photos/15110223/pexels-photo-15110223.jpeg",
                "https://images.pexels.com/photos/4472870/pexels-photo-4472870.jpeg",
                "https://images.pexels.com/photos/8165427/pexels-photo-8165427.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/15110223/pexels-photo-15110223.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "10:00", close: "16:00" },
                martes: { open: "10:00", close: "16:00" },
                miércoles: { open: "10:00", close: "00:00" },
                jueves: { open: "10:00", close: "00:00" },
                viernes: { open: "10:00", close: "00:00" },
                sábado: { open: "10:00", close: "00:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr1._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Excelente lugar, comida deliciosa y atención impecable.",
                    categories: [cats["Reservas"], cats["Estilo vintage"]]
                },
                {
                    clientId: cli2._id,
                    rating: 4,
                    comment: "Muy lindo ambiente y decoración. Un poco caro pero vale la pena.",
                    categories: [cats["Ambiente relajado"]]
                }
            ]
        },
        {
            name: "The Lab Coffee Roasters",
            address: "Av. Luis Alberto de Herrera 1109, Montevideo",
            description: "Cafetería de especialidad con excelente café, muy cerca de la rambla.",
            location: { lat: -34.9017, lng: -56.1363 },
            categories: [cats["WiFi"], cats["Espacio para trabajar"], cats["Abre hasta tarde"]],
            perceptualCategories: [cats["Café de especialidad"], cats["Ideal para trabajar"], cats["Wi-Fi rápido"]],
            gallery: [
                "https://images.pexels.com/photos/33179731/pexels-photo-33179731.jpeg",
                "https://images.pexels.com/photos/33188113/pexels-photo-33188113.jpeg",
                "https://images.pexels.com/photos/33193713/pexels-photo-33193713.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/33179731/pexels-photo-33179731.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:00", close: "21:00" },
                martes: { open: "08:00", close: "21:00" },
                miércoles: { open: "08:00", close: "21:00" },
                jueves: { open: "08:00", close: "21:00" },
                viernes: { open: "08:00", close: "21:00" },
                sábado: { open: "09:00", close: "21:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr1._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Café de primera calidad. Ideal para ir con la laptop a trabajar, el WiFi es rápido.",
                    categories: [cats["Wi-Fi rápido"], cats["Ideal para trabajar"]]
                },
                {
                    clientId: cli2._id,
                    rating: 3,
                    comment: "El café estaba bien, pero la última vez el servicio fue lento.",
                    categories: [cats["Café de especialidad"]]
                }
            ]
        },
        {
            name: "Escaramuza",
            address: "Dr. Pablo de María 1185, Montevideo",
            description: "Librería y cafetería en un hermoso edificio histórico de 1903, con patio al aire libre.",
            location: { lat: -34.9069, lng: -56.1708 },
            categories: [cats["WiFi"], cats["Al aire libre"], cats["Céntrico"]],
            perceptualCategories: [cats["Instagrammeable"], cats["Con plantas"], cats["Ambiente relajado"]],
            gallery: [
                "https://images.pexels.com/photos/4450335/pexels-photo-4450335.jpeg",
                "https://images.pexels.com/photos/33202867/pexels-photo-33202867.jpeg",
                "https://images.pexels.com/photos/33209701/pexels-photo-33209701.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/4450335/pexels-photo-4450335.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "09:00", close: "20:00" },
                martes: { open: "09:00", close: "20:00" },
                miércoles: { open: "09:00", close: "20:00" },
                jueves: { open: "09:00", close: "20:00" },
                viernes: { open: "09:00", close: "20:00" },
                sábado: { open: "09:00", close: "20:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr1._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Precioso lugar para disfrutar un café y leer un libro. El patio es un plus espectacular.",
                    categories: [cats["Instagrammeable"], cats["Ambiente relajado"]]
                },
                {
                    clientId: cli2._id,
                    rating: 5,
                    comment: "Ambiente único entre libros y buen café. Un poco caro, pero la experiencia lo vale.",
                    categories: [cats["Con plantas"]]
                }
            ]
        },
        {
            name: "Café Brasilero",
            address: "Ituzaingó 1447, Ciudad Vieja",
            description: "Clásico café fundado en 1877, ambiente vintage en el corazón de Ciudad Vieja.",
            location: { lat: -34.9070, lng: -56.2030 },
            categories: [cats["Céntrico"], cats["Abre temprano"], cats["Acepta tarjetas"]],
            perceptualCategories: [cats["Estilo vintage"], cats["Ambiente relajado"]],
            gallery: [
                "https://images.pexels.com/photos/32440659/pexels-photo-32440659.jpeg",
                "https://images.pexels.com/photos/3679601/pexels-photo-3679601.jpeg",
                "https://images.pexels.com/photos/1551346/pexels-photo-1551346.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/32440659/pexels-photo-32440659.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:00", close: "19:00" },
                martes: { open: "08:00", close: "19:00" },
                miércoles: { open: "08:00", close: "19:00" },
                jueves: { open: "08:00", close: "19:00" },
                viernes: { open: "08:00", close: "19:00" },
                sábado: { open: "09:00", close: "13:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr1._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Un café histórico imperdible. Hermoso lugar, mantiene su encanto antiguo.",
                    categories: [cats["Estilo vintage"], cats["Ambiente relajado"]]
                },
                {
                    clientId: cli2._id,
                    rating: 4,
                    comment: "Muy lindo café tradicional, aunque el café en sí podría ser mejor.",
                    categories: []
                }
            ]
        },
        {
            name: "La Farmacia Café",
            address: "Cerrito 550, Ciudad Vieja",
            description: "Antiguo local estilo farmacia transformado en café boutique.",
            location: { lat: -34.9060, lng: -56.1990 },
            categories: [cats["WiFi"], cats["Céntrico"], cats["Espacio techado"]],
            perceptualCategories: [cats["Instagrammeable"], cats["Estilo vintage"]],
            gallery: [
                "https://images.pexels.com/photos/904616/pexels-photo-904616.jpeg",
                "https://images.pexels.com/photos/302896/pexels-photo-302896.jpeg",
                "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/904616/pexels-photo-904616.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:00", close: "20:00" },
                martes: { open: "08:00", close: "20:00" },
                miércoles: { open: "08:00", close: "20:00" },
                jueves: { open: "08:00", close: "20:00" },
                viernes: { open: "08:00", close: "22:00" },
                sábado: { open: "09:00", close: "18:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr1._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Excelente! Un lugar hermoso, el flat white delicioso y la temática vintage muy bien lograda.",
                    categories: [cats["Estilo vintage"], cats["Instagrammeable"]]
                },
                {
                    clientId: cli2._id,
                    rating: 4,
                    comment: "Muy bueno. Personal amable y buen café, aunque suele llenarse de turistas.",
                    categories: [cats["Instagrammeable"]]
                }
            ]
        },
        {
            name: "Culto Café",
            address: "Canelones 2154, Montevideo",
            description: "Café de especialidad moderno con ambiente acogedor y buen WiFi.",
            location: { lat: -34.9030, lng: -56.1700 },
            categories: [cats["WiFi"], cats["Espacio para trabajar"], cats["Céntrico"]],
            perceptualCategories: [cats["Café de especialidad"], cats["Especialistas en café"], cats["Ambiente relajado"]],
            gallery: [
                "https://images.pexels.com/photos/3879495/pexels-photo-3879495.jpeg",
                "https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg",
                "https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/3879495/pexels-photo-3879495.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:30", close: "20:00" },
                martes: { open: "08:30", close: "20:00" },
                miércoles: { open: "08:30", close: "20:00" },
                jueves: { open: "08:30", close: "20:00" },
                viernes: { open: "08:30", close: "20:00" },
                sábado: { open: "09:00", close: "18:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr1._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Excelente café, uno de mis favoritos. Los baristas saben lo que hacen.",
                    categories: [cats["Especialistas en café"], cats["WiFi"]]
                },
                {
                    clientId: cli2._id,
                    rating: 2,
                    comment: "El café estaba rico, pero el personal fue bastante antipático. Me fui con una mala impresión.",
                    categories: []
                }
            ]
        },
        {
            name: "Expreso Pocitos",
            address: "Bulevar Juan Benito Blanco 956, Pocitos",
            description: "Bar y cafetín tradicional de barrio con más de un siglo de historia.",
            location: { lat: -34.9170, lng: -56.1570 },
            categories: [cats["Abre temprano"], cats["Ideal para ir en grupo"], cats["Espacio techado"]],
            perceptualCategories: [cats["Estilo vintage"], cats["Ambiente relajado"]],
            gallery: [
                "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
                "https://images.pexels.com/photos/15110223/pexels-photo-15110223.jpeg",
                "https://images.pexels.com/photos/4472870/pexels-photo-4472870.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "07:30", close: "23:00" },
                martes: { open: "07:30", close: "23:00" },
                miércoles: { open: "07:30", close: "23:00" },
                jueves: { open: "07:30", close: "23:00" },
                viernes: { open: "07:30", close: "23:00" },
                sábado: { open: "08:00", close: "23:00" },
                domingo: { open: "08:00", close: "23:00" }
            },
            managerId: mgr1._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 4,
                    comment: "Clásico café de Pocitos, ideal para desayunar. Servicio rápido y porciones generosas.",
                    categories: [cats["Ambiente relajado"]]
                },
                {
                    clientId: cli2._id,
                    rating: 1,
                    comment: "Una porquería de lugar, la comida llegó fría y el mozo fue grosero. No vuelvo más.",
                    categories: []
                }
            ]
        },
        {
            name: "La Madriguera Café",
            address: "Divina Comedia 1666 bis, Carrasco",
            description: "Acogedora cafetería en Carrasco con patio al aire libre y delicias caseras.",
            location: { lat: -34.8890, lng: -56.0510 },
            categories: [cats["Al aire libre"], cats["Espacio tranquilo"], cats["En barrio residencial"]],
            perceptualCategories: [cats["Ambiente relajado"], cats["Apto para niños"], cats["Con plantas"]],
            gallery: [
                "https://images.pexels.com/photos/8165427/pexels-photo-8165427.jpeg",
                "https://images.pexels.com/photos/33179731/pexels-photo-33179731.jpeg",
                "https://images.pexels.com/photos/33188113/pexels-photo-33188113.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/33188113/pexels-photo-33188113.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "09:00", close: "19:30" },
                martes: { open: "09:00", close: "19:30" },
                miércoles: { open: "09:00", close: "19:30" },
                jueves: { open: "09:00", close: "19:30" },
                viernes: { open: "09:00", close: "19:30" },
                sábado: { open: "09:00", close: "19:30" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr2._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Hermoso café de barrio. El jardín exterior es ideal para las tardes soleadas.",
                    categories: [cats["Al aire libre"], cats["Con plantas"]]
                },
                {
                    clientId: cli2._id,
                    rating: 5,
                    comment: "Excelente atención y pastelería riquísima. Muy buena vibra, volveré seguido.",
                    categories: [cats["Ambiente relajado"]]
                }
            ]
        },
        {
            name: "Sometimes Sunday Café",
            address: "Perez Castellano 1518, Ciudad Vieja",
            description: "Pequeña cafetería de especialidad en Ciudad Vieja, con ambiente relajado y brunch creativo.",
            location: { lat: -34.9050, lng: -56.2110 },
            categories: [cats["WiFi"], cats["Espacio tranquilo"], cats["Céntrico"]],
            perceptualCategories: [cats["Café de especialidad"], cats["Estilo minimalista"], cats["Ambiente relajado"]],
            gallery: [
                "https://images.pexels.com/photos/8165427/pexels-photo-8165427.jpeg",
                "https://images.pexels.com/photos/33179731/pexels-photo-33179731.jpeg",
                "https://images.pexels.com/photos/33188113/pexels-photo-33188113.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/8165427/pexels-photo-8165427.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:00", close: "18:00" },
                martes: { open: "08:00", close: "18:00" },
                miércoles: { open: "08:00", close: "18:00" },
                jueves: { open: "08:00", close: "18:00" },
                viernes: { open: "08:00", close: "18:00" },
                sábado: { open: "09:00", close: "16:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr2._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Brunch espectacular y café excelente. Pequeño pero muy acogedor, uno de mis favoritos.",
                    categories: [cats["Café de especialidad"], cats["Ambiente relajado"]]
                }
            ]
        },
        {
            name: "Café Gourmand",
            address: "Constituyente 2026, Cordón",
            description: "Café de estilo francés con pastelería artesanal, ideal para brunch cerca de Parque Rodó.",
            location: { lat: -34.9050, lng: -56.1750 },
            categories: [cats["Espacio techado"], cats["Opciones vegetarianas"], cats["Cerca de parques"]],
            perceptualCategories: [cats["Café de especialidad"], cats["Especialistas en café"], cats["Ambiente relajado"]],
            gallery: [
                "https://images.pexels.com/photos/302896/pexels-photo-302896.jpeg",
                "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg",
                "https://images.pexels.com/photos/3879495/pexels-photo-3879495.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/302896/pexels-photo-302896.jpeg",
            menu: [],
            schedule: {
                lunes: { open: null, close: null, isClosed: true },
                martes: { open: null, close: null, isClosed: true },
                miércoles: { open: "08:30", close: "20:00" },
                jueves: { open: "08:30", close: "20:00" },
                viernes: { open: "08:30", close: "20:00" },
                sábado: { open: "08:30", close: "20:00" },
                domingo: { open: "08:30", close: "20:00" }
            },
            managerId: mgr2._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli2._id,
                    rating: 5,
                    comment: "Un rincón de París en Montevideo. Los croissants increíbles y el café de primera.",
                    categories: [cats["Café de especialidad"], cats["Ambiente relajado"]]
                }
            ]
        },
        {
            name: "Sauco Café",
            address: "Canelones 1985, Montevideo",
            description: "Acogedor café de especialidad en Cordón, popular entre amantes del buen café.",
            location: { lat: -34.8980, lng: -56.1680 },
            categories: [cats["WiFi"], cats["Espacio para trabajar"], cats["Opciones veganas"]],
            perceptualCategories: [cats["Café de especialidad"], cats["Ambiente relajado"], cats["Ideal para estudiar"]],
            gallery: [
                "https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg",
                "https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg",
                "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:00", close: "19:00" },
                martes: { open: "08:00", close: "19:00" },
                miércoles: { open: "08:00", close: "19:00" },
                jueves: { open: "08:00", close: "19:00" },
                viernes: { open: "08:00", close: "19:00" },
                sábado: { open: "09:00", close: "14:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr2._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 4,
                    comment: "Buen café y buen lugar para estudiar. A veces se llena y es difícil conseguir mesa.",
                    categories: [cats["Ideal para estudiar"], cats["WiFi"]]
                }
            ]
        },
        {
            name: "Seis Montes (Tostadores de Café)",
            address: "Av. Gral. Rivera 2208, Pocitos",
            description: "Tostaduría y café de especialidad local, ofrece granos seleccionados y degustaciones.",
            location: { lat: -34.9060, lng: -56.1570 },
            categories: [cats["WiFi"], cats["Acepta tarjetas"], cats["Espacio para trabajar"]],
            perceptualCategories: [cats["Venden café en grano"], cats["Especialistas en café"], cats["Tienda de café"]],
            gallery: [
                "https://images.pexels.com/photos/1551346/pexels-photo-1551346.jpeg",
                "https://images.pexels.com/photos/904616/pexels-photo-904616.jpeg",
                "https://images.pexels.com/photos/302896/pexels-photo-302896.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/1551346/pexels-photo-1551346.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "09:00", close: "18:00" },
                martes: { open: "09:00", close: "18:00" },
                miércoles: { open: "09:00", close: "18:00" },
                jueves: { open: "09:00", close: "18:00" },
                viernes: { open: "09:00", close: "18:00" },
                sábado: { open: "10:00", close: "14:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr2._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli2._id,
                    rating: 5,
                    comment: "Excelente calidad de café. Compré granos para llevar y me dieron muy buenos consejos.",
                    categories: [cats["Venden café en grano"], cats["Especialistas en café"]]
                }
            ]
        },
        {
            name: "Craft Café",
            address: "Av. 8 de Octubre 2771, Montevideo",
            description: "Cafetería de especialidad en La Blanqueada, ambiente tranquilo para trabajar.",
            location: { lat: -34.8850, lng: -56.1570 },
            categories: [cats["WiFi"], cats["Espacio tranquilo"], cats["Cerca de transporte público"]],
            perceptualCategories: [cats["Café de especialidad"], cats["Ideal para trabajar"], cats["Ambiente silencioso"]],
            gallery: [
                "https://images.pexels.com/photos/887869/pexels-photo-887869.jpeg",
                "https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg",
                "https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/887869/pexels-photo-887869.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:00", close: "18:00" },
                martes: { open: "08:00", close: "18:00" },
                miércoles: { open: "08:00", close: "18:00" },
                jueves: { open: "08:00", close: "18:00" },
                viernes: { open: "08:00", close: "18:00" },
                sábado: { open: "09:00", close: "13:00" },
                domingo: { open: null, close: null, isClosed: true }
            },
            managerId: mgr2._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli2._id,
                    rating: 4,
                    comment: "Café muy rico y buen lugar para concentrarse. Podría tener más enchufes disponibles.",
                    categories: [cats["Ideal para trabajar"], cats["Ambiente silencioso"]]
                }
            ]
        },
        {
            name: "Confitería Oro del Rhin",
            address: "Colonia 897, Centro",
            description: "Tradicional confitería y café europeo en el centro, famosa por sus masas y postres.",
            location: { lat: -34.9050, lng: -56.1980 },
            categories: [cats["Céntrico"], cats["Espacio techado"], cats["Opciones sin gluten"]],
            perceptualCategories: [cats["Estilo vintage"], cats["Ambiente silencioso"]],
            gallery: [
                "https://images.pexels.com/photos/4472870/pexels-photo-4472870.jpeg",
                "https://images.pexels.com/photos/8165427/pexels-photo-8165427.jpeg",
                "https://images.pexels.com/photos/33193713/pexels-photo-33193713.jpeg"
            ],
            coverImage: "https://images.pexels.com/photos/4472870/pexels-photo-4472870.jpeg",
            menu: [],
            schedule: {
                lunes: { open: "08:00", close: "19:00" },
                martes: { open: "08:00", close: "19:00" },
                miércoles: { open: "08:00", close: "19:00" },
                jueves: { open: "08:00", close: "19:00" },
                viernes: { open: "08:00", close: "19:00" },
                sábado: { open: "09:00", close: "19:00" },
                domingo: { open: "09:00", close: "13:00" }
            },
            managerId: mgr2._id,
            isActive: true,
            reviews: [
                {
                    clientId: cli1._id,
                    rating: 5,
                    comment: "Una confitería clásica. Excelente pastelería y un ambiente que te transporta en el tiempo.",
                    categories: [cats["Estilo vintage"], cats["Ambiente silencioso"]]
                }
            ]
        }
    ];

    // Insertar cafés y sus reseñas
    for (let def of baseCafes) {
        const { reviews: reviewDefs, ...cafeData } = def;
        const cafe = await Cafe.create(cafeData);
        if (Array.isArray(reviewDefs)) {
            for (let r of reviewDefs) {
                const newRev = await Review.create({ ...r, cafeId: cafe._id });
                await Cafe.findByIdAndUpdate(cafe._id, { $push: { reviews: newRev._id } });
            }
            await updateAvgRating(cafe._id);
        }
        console.log(`☕ Seeded café: ${cafe.name}`);
    }

    const allCafes = await Cafe.find({ isActive: true });
    cli1.favorites = allCafes.slice(0, 2).map(c => c._id);
    cli2.favorites = allCafes.slice(2, 4).map(c => c._id);
    await cli1.save();
    await cli2.save();
    console.log("⭐ Favorites asignadas a clientes");

    const firstCafe = await Cafe.findOne({ managerId: mgr1._id });
    const firstReview = await Review.findOne({ cafeId: firstCafe._id });
    if (firstReview) {
        await ReviewReport.create({
            reviewId: firstReview._id,
            managerId: mgr1._id,
            reason: "Contenido inapropiado."
        });
    }
    const otherCafe = await Cafe.findOne({ managerId: mgr2._id });
    const badReview = await Review.findOne({ cafeId: otherCafe._id, rating: 1 });
    if (badReview) {
        await ReviewReport.create({
            reviewId: badReview._id,
            managerId: mgr2._id,
            reason: "Reseña ofensiva."
        });
    }
    console.log("🚩 ReviewReports creados");

    console.log("✅ SeedAll completado exitosamente");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Error en seedAll:", err);
    process.exit(1);
});

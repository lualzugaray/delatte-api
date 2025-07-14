# Delatte API ☕🛠️

Backend de la plataforma **Delatte**, una aplicación para descubrir y explorar cafeterías en Montevideo. Provee endpoints RESTful para gestionar usuarios, cafeterías, reseñas, favoritos, categorías, imágenes, autenticación y más.

---

## 🧑‍💻 Tecnologías utilizadas

- **Node.js** + **Express**
- **MongoDB** (con Mongoose)
- **JWT** con **Auth0** (autenticación de usuarios)
- **Bcrypt** (hasheo de contraseñas)
- **Dotenv** (manejo de variables de entorno)
- **Express-validator** (validaciones)
- **Cloudinary** (gestión de imágenes)
- **Google Maps API** (ubicación)
- Scripts personalizados para seed/reset

---

## 📁 Estructura del proyecto

delatte-api/
├── middlewares/ # Middleware de autenticación y roles
├── models/ # Esquemas de Mongoose
├── routes/ # Endpoints organizados por entidad
├── scripts/ # Scripts para pre-carga, limpieza y pruebas
│ ├── seed.js
│ ├── createAdmin.js
│ ├── clearAll.js
│ ├── clearCafesAndReviews.js
│ ├── seedAllCategories.js
│ ├── seedStructuralCategories.js
│ └── categoriesSeedData.js
├── utils/ # Funciones auxiliares
├── validators/ # Validaciones personalizadas
├── index.js # Punto de entrada del servidor
├── .env.example # Plantilla de variables de entorno
├── package.json
└── README.md

## ⚙️ Variables de entorno

Creá un archivo `.env` en la raíz del proyecto y completalo basado en el siguiente ejemplo:

```env
PORT=3000
MONGO_URI=....
AUTH0_DOMAIN=....
AUTH0_AUDIENCE=....
AUTH0_BACKEND_CLIENT_ID=....
CLOUDINARY_URL=....
CLOUDINARY_UPLOAD_PRESET=....
```

## 🚀 Instalación desde cero

Si querés probar el proyecto en una computadora nueva, seguí estos pasos:

1. **Cloná el repositorio**
    git clone https://github.com/tu-usuario/delatte-api.git
    cd delatte-api

2. **Instalá dependencias**
    npm install

3. **Creá el archivo .env**
    cp .env.example .env

4. **Levantá el servidor de desarrollo**
    npm run dev

## Scripts útiles
    npm run dev                      # Inicia el servidor en modo desarrollo
    node scripts/seedAllCategories.js  # Inserta categorías estructurales y perceptuales
    node scripts/seed.js               # Carga usuarios, cafés, reseñas y favoritos
    node scripts/createAdmin.js        # Crea un usuario administrador manualmente
    node scripts/clearAll.js           # Limpia usuarios y datos locales (y Auth0 si se configura)


## Inicialización del sistema (Setup)

Antes de usar la app, ejecutá estos comandos:

- node scripts/seedAllCategories.js
- node scripts/seed.js

### ¿Qué hace cada script?

- **`seedAllCategories.js`**  
Inserta categorías estructurales y perceptuales (ej: WiFi, Pet-friendly, Abre hasta tarde, etc.).
El script evita duplicados y puede ejecutarse varias veces.

- **`seed.js`**  
Usuarios con contraseña en texto plano:
- admin@delatte.com / admin123
- manager@delatte.com / manager123
- client@delatte.com / client123
- Cafeterías reales con imágenes, horarios, menús y reseñas
- Categorías estructurales y perceptuales
- Favoritos preseleccionados para el cliente
- Denuncias de reseñas para probar gestión de contenido
- Validación automática de categorías por horario (como "Abre hasta tarde")

El script puede correrse varias veces sin riesgo de duplicación, ya que limpia las colecciones antes de comenzar.

###
Este mecanismo de pre-carga fue diseñado para facilitar la evaluación del sistema. Al clonar el proyecto y correr los scripts de seed, se obtiene una instancia funcional y navegable sin necesidad de registrar usuarios ni cargar datos desde cero.

Hecho con 💛 por Lucía | © Delatte 2025
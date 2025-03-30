# Delatte API

Backend de la plataforma Delatte, una aplicación para descubrir y explorar cafeterías en Montevideo. Provee endpoints REST para gestionar usuarios, cafeterías, reseñas, categorías, favoritos, estadísticas y más.

## Tecnologías

- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticación
- Bcrypt para hashear contraseñas
- Express-validator para validaciones
- Dotenv para variables de entorno

## Estructura

- `/models`: esquemas de Mongoose
- `/routes`: endpoints organizados por entidad
- `/middlewares`: autenticación, validación de rol
- `/utils`: funciones auxiliares
- `/scripts`: seeds de categorías, admin

## Variables de entorno

Crear un archivo `.env` con:

```
MONGO_URI=<tu_conexion_mongodb>
JWT_SECRET=<clave_secreta_para_tokens>
```

## Scripts útiles

- `npm run dev`: inicia el servidor en modo desarrollo con nodemon
- `node scripts/seedCategories.js`: carga categorías estructurales
- `node scripts/create-admin.js`: crea un usuario admin

## Recomendaciones

- Asegurarse de tener un `.gitignore` con `.env` excluido
- No subir usuarios reales ni credenciales a ningún repositorio público

© Delatte 2025

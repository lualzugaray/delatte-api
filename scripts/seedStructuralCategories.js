import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const categories = [
  { name: "Pet-friendly", description: "Permiten el ingreso de mascotas" },
  { name: "WiFi", description: "Ofrecen conexión WiFi gratuita" },
  { name: "Espacio para trabajar", description: "Tienen mesas y ambiente cómodo para trabajar con notebook" },
  { name: "Abre hasta tarde", description: "Cierra después de las 22:00 horas", validateBySchedule: true },
  { name: "Abre temprano", description: "Abre antes de las 08:00 horas", validateBySchedule: true },
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

for (const cat of categories) {
  const exists = await Category.findOne({ name: cat.name });
  if (!exists) {
    await Category.create({
      ...cat,
      isActive: true,
      type: "structural",
      createdByManager: false,
      createdByClient: false,
    });
    console.log("✔️ Creada:", cat.name);
  } else {
    console.log("⏭️ Ya existe:", cat.name);
  }
}

await mongoose.disconnect();
console.log("✅ Seed completado");

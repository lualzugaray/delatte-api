import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { ManagementClient } from "auth0";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Conectado a MongoDB");

  const auth0 = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_BACKEND_CLIENT_ID,
    clientSecret: process.env.AUTH0_BACKEND_CLIENT_SECRET,
    scope: "create:users read:users update:users",
  });

  const email = "admin@delatte.com";
  const password = "DelatteAdmin!23";

  let auth0User;
  try {
    const response = await auth0.users.create({
      connection: "Username-Password-Authentication",
      email,
      password,
      email_verified: true,
      app_metadata: { roles: ["admin"] },
    });
    auth0User = response.data || response;
    console.log("🔍 auth0User RAW:", auth0User);
    console.log("🔑 Auth0 user created:", auth0User.user_id);
  } catch (err) {
    if (err.statusCode === 409) {
      console.log("⚠️ El usuario ya existe en Auth0, recuperándolo...");
      const users = await auth0.users.getAll({
        q: `email:"${email}"`,
        search_engine: 'v3'
      });
      auth0User = users.data?.[0] || users[0];
      console.log("🔑 Auth0 existing user:", auth0User.user_id);
    } else {
      throw err;
    }
  }

  const auth0Id = auth0User.user_id;

  const mongoUser = await User.findOne({ email });
  if (!mongoUser) {
    console.error("❌ No existe un User con ese email. ¿Has corrido seed.js?");
    process.exit(1);
  }
  mongoUser.auth0Id = auth0Id;
  mongoUser.role = "admin";
  mongoUser.isActive = true;
  await mongoUser.save();
  console.log("✅ Usuario Mongo actualizado:", mongoUser.email);

  const existingAdmin = await Admin.findOne({ userId: mongoUser._id });
  if (existingAdmin) {
    existingAdmin.auth0Id = auth0Id;
    await existingAdmin.save();
    console.log("✅ Admin document actualizado en admins");
  } else {
    const newAdmin = await Admin.create({
      userId: mongoUser._id,
      auth0Id,
      fullName: mongoUser.email.split("@")[0],
    });
    console.log("✅ Admin document creado en admins:", newAdmin._id);
  }

  await mongoose.disconnect();
  console.log("👋 Done.");
}

run().catch(err => {
  console.error("❌ Error creando admin:", err);
  process.exit(1);
});
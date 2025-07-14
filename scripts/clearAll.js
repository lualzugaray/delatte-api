import mongoose from "mongoose";
import dotenv from "dotenv";
import fetch from "node-fetch"; 
import Cafe    from "../models/Cafe.js";
import Review  from "../models/Review.js";
import Manager from "../models/Manager.js";
import Client  from "../models/Client.js";
import User    from "../models/User.js";

dotenv.config();
const {
  MONGO_URI,
  AUTH0_DOMAIN,
  AUTH0_BACKEND_CLIENT_ID,
  AUTH0_BACKEND_CLIENT_SECRET
} = process.env;

async function getAuth0Token() {
  const resp = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id:     AUTH0_BACKEND_CLIENT_ID,
      client_secret: AUTH0_BACKEND_CLIENT_SECRET,
      audience:      `https://${AUTH0_DOMAIN}/api/v2/`,
      grant_type:    "client_credentials",
      scope:         "read:users delete:users"
    })
  });
  const { access_token, scope } = await resp.json();
  console.log("🔑 Token scopes:", scope);
  return access_token;
}

async function clearAuth0Users(token) {
  console.log("🚀 Listando y borrando usuarios en Auth0...");
  let page = 0, per_page = 50;
  while (true) {
    const url = new URL(`https://${AUTH0_DOMAIN}/api/v2/users`);
    url.searchParams.set("per_page",       per_page);
    url.searchParams.set("page",           page);
    url.searchParams.set("fields",         "user_id,email");
    url.searchParams.set("include_fields", "true");
    url.searchParams.set("search_engine",  "v3");

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = await resp.json();
    if (!users.length) break;

    for (const u of users) {
      try {
        await fetch(
          `https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(u.user_id)}`, {
            method:  "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log(`   ✅ Eliminado: ${u.email} (${u.user_id})`);
      } catch (e) {
        console.warn(
          `   ⚠️ Error borrando ${u.email} (${u.user_id}): ${e.message}`
        );
      }
    }
    page++;
  }
}

async function clearLocalDB() {
  console.log("🗑  Limpiando Mongo local...");
  const [
    cafesRes,
    revRes,
    mgrRes,
    cliRes,
    userRes
  ] = await Promise.all([
    Cafe.deleteMany({}),
    Review.deleteMany({}),
    Manager.deleteMany({}),
    Client.deleteMany({}),
    User.deleteMany({})
  ]);
  console.log(`   Cafés:     ${cafesRes.deletedCount}`);
  console.log(`   Reseñas:   ${revRes.deletedCount}`);
  console.log(`   Managers:  ${mgrRes.deletedCount}`);
  console.log(`   Clients:   ${cliRes.deletedCount}`);
  console.log(`   Users:     ${userRes.deletedCount}`);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Conectado a MongoDB");

  const token = await getAuth0Token();
  await clearAuth0Users(token);
  await clearLocalDB();

  console.log("🎉 Todo limpio. ¡Listo!");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Error en clearAll:", err);
  process.exit(1);
});

import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const jwtCheck = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-d82ap42lb6n7381y.us.auth0.com/.well-known/jwks.json`
  }),
  audience: "https://delatte.api",
  issuer: "https://dev-d82ap42lb6n7381y.us.auth0.com/",
  algorithms: ["RS256"]
});

async function attachUser(req, res, next) {
  try {
    const sub = req.auth.sub;
    let user = await User.findOne({ auth0Id: sub });

    if (!user) {
      const adminDoc = await Admin.findOne({ auth0Id: sub });
      if (adminDoc) {
        user = await User.findById(adminDoc.userId);
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export default [jwtCheck, attachUser];

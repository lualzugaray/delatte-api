import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

const verifyAuth0 = expressjwt({
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

export default verifyAuth0;

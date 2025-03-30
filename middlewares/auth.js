import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ahora tenés acceso a req.user.userId, req.user.role, etc.
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export default auth;

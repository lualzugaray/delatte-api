export default function isAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins are allowed to perform this action" });
    }
    next();
  }
  
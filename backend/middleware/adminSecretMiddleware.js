// Simple gate for admin-only endpoints (social verification approval).
// The client must send header `x-admin-secret` matching process.env.ADMIN_SECRET.
const adminSecretMiddleware = (req, res, next) => {
  const provided = req.headers["x-admin-secret"];
  const expected = process.env.ADMIN_SECRET;

  if (!expected) {
    return res
      .status(500)
      .json({ message: "ADMIN_SECRET is not configured on the server" });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

module.exports = adminSecretMiddleware;

import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.headers["authorization"]?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // {id, role}
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied: Admins only" });
  }
  next();
};

// ✅ Flexible role-based middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: `Access denied: Requires [${roles}]` });
    }
    next();
  };
};

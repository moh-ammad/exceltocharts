import jwt from "jsonwebtoken";
import User from "../models/user.js";

// ✅ Authenticate user and attach full user info to req.user
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // ✅ Attach full user with role and isSuperAdmin to request
      req.user = user;

      next();
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed", error: error.message });
  }
};

// ✅ Middleware: Allow only admins (super admin or not)
const AdminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied, admin only" });
};

// ✅ Middleware: Allow only super admins
const SuperAdminOnly = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Access denied, super admin only" });
};

// ✅ Middleware: Admin or super admin
const AdminOrSuperAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isSuperAdmin)) {
    return next();
  }
  return res.status(403).json({ message: "Access denied, admin or super admin only" });
};

export {
  protect,
  AdminOnly,
  SuperAdminOnly,
  AdminOrSuperAdmin
};
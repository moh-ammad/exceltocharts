import { Router } from "express";
import {
  AdminOnly,
  SuperAdminOnly,
  protect
} from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserByAdmin
} from "../controllers/userController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

// ✅ All admins can view all users (members only or limited as per controller logic)
router.get("/", protect, AdminOnly, getAllUsers);

// ✅ Any authenticated user can get user by ID (add restrictions in controller if needed)
router.get("/:id", protect, getUserById);

// ✅ Only super admin can delete users (admins or members)
router.delete("/:id", protect, SuperAdminOnly, deleteUser);

// ✅ Only super admin can update users, including other admins
router.put("/:id", protect, SuperAdminOnly, upload.single("image"), updateUserByAdmin);

export const userRoutes = router;

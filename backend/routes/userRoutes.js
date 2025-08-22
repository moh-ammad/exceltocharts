import { Router } from "express";
import { AdminOnly, protect } from "../middlewares/authMiddleware.js";
import { getAllUsers, getUserById, deleteUser, updateUserByAdmin } from "../controllers/userController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router= Router();

router.get("/",protect,AdminOnly,getAllUsers);
router.get("/:id",protect,getUserById);
router.delete("/:id",protect,AdminOnly,deleteUser);
router.put("/:id", protect, AdminOnly, upload.single("image"), updateUserByAdmin);


export const userRoutes = router;
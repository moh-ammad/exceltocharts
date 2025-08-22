import { Router } from "express";
import { AdminOnly, protect } from "../middlewares/authMiddleware.js";
import {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getDashboardData, updateTaskStatus,
    updateTaskChecklist
} from "../controllers/taskController.js";
const router = Router();


router.get("/dashboard-data", protect, getDashboardData);
router.get("/", protect, getAllTasks);
router.get("/:id", protect, getTaskById);
router.post("/create", protect, AdminOnly, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, AdminOnly, deleteTask);
router.put("/:id/status", protect, updateTaskStatus);
router.put("/:id/todo", protect, updateTaskChecklist);

export { router as taskRoutes };
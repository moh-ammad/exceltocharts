import express from 'express';
import {
  exportEmptyUsersTemplate,
  exportOnlyUsers,
  exportOnlyTasks,
  exportUsersWithEmptyTasks,
  exportUsersAndTasks,
  importOnlyUsers,
  importUsersAndTasks,
} from '../controllers/reportController.js';

import { protect, AdminOnly } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// === EXPORT ROUTES ===
router.get('/exports/empty-users', protect, AdminOnly, exportEmptyUsersTemplate);       // 1. Empty users template
router.get('/exports/users', protect, AdminOnly, exportOnlyUsers);                      // 2. Export only users
router.get('/exports/tasks', protect, AdminOnly, exportOnlyTasks);                      // 3. Export only tasks
router.get('/exports/users-emptytasks', protect, AdminOnly, exportUsersWithEmptyTasks); // 4. Export users + empty tasks
router.get('/exports/users-tasks', protect, AdminOnly, exportUsersAndTasks);            // 5. Export users + tasks

// === IMPORT ROUTES ===
// Use your custom multer middleware with fileFilter and filename config
router.post('/upload/users', protect, AdminOnly, upload.single('excelfile'), importOnlyUsers);       // 6. Import only users
router.post('/upload/users-tasks', protect, AdminOnly, upload.single('excelfile'), importUsersAndTasks); // 7. Import users + tasks

export { router as reportRoutes };

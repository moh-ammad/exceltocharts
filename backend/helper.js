import Task from "./models/task.js";
import fs from 'fs/promises';
import path from 'path';

const uploadDir = path.join(process.cwd(), "uploads");

function syncTaskStatusWithTodos(task) {
  const todos = task.todoChecklist || [];
  const total = todos.length;
  const completedCount = todos.filter(t => t.completed).length;

  // Update progress
  task.progress = total ? Math.round((completedCount / total) * 100) : 0;

  // Auto-set status
  if (completedCount === total && total > 0) {
    task.status = 'completed';
  } else if (completedCount > 0) {
    task.status = 'in-progress';
  } else {
    task.status = 'pending';
  }

  return task;
}

export default syncTaskStatusWithTodos;

export const getTaskStats = async (filter) => {
  const [totalTasks, pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
    Task.countDocuments(filter),
    Task.countDocuments({ ...filter, status: 'pending' }),
    Task.countDocuments({ ...filter, status: 'in-progress' }),
    Task.countDocuments({ ...filter, status: 'completed' }),
  ]);
  return {
  totalTasks,
  pendingTasks,
  inProgressTasks,
  completedTasks,
 percentages: {
  pending: totalTasks ? Math.round((pendingTasks / totalTasks) * 100) : 0,
  inProgress: totalTasks ? Math.round((inProgressTasks / totalTasks) * 100) : 0,
  completed: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
}

};

};

export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const parsedUrl = new URL(fileUrl);
    const filename = path.basename(parsedUrl.pathname);
    const filepath = path.join(uploadDir, filename);
    await fs.unlink(filepath);
  } catch (e) {
    console.warn("Error deleting file:", e.message);
  }
};


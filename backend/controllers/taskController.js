import syncTaskStatusWithTodos from "../helper.js";
import Task from "../models/task.js";
import User from "../models/user.js";
import mongoose from "mongoose";

const getAllTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const isAdmin = req.user.role === 'admin';

    const taskFilter = {};
    if (status) taskFilter.status = status;
    if (!isAdmin) taskFilter.assignedTo = req.user._id;

    let tasks = await Task.find(taskFilter).populate('assignedTo', 'name email profileImageUrl');

    tasks = tasks.map(task => {
      const completedTodoCount = task.todoChecklist.filter(todo => todo.completed).length;
      return { ...task.toObject(), completedTodoCount };
    });

    const baseFilter = isAdmin ? {} : { assignedTo: req.user._id };

    const [totalTasks, pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
      Task.countDocuments(baseFilter),
      Task.countDocuments({ ...baseFilter, status: 'pending' }),
      Task.countDocuments({ ...baseFilter, status: 'in-progress' }),
      Task.countDocuments({ ...baseFilter, status: 'completed' }),
    ]);

    res.status(200).json({
      tasks,
      statusSummary: { totalTasks, pendingTasks, inProgressTasks, completedTasks }
    });
  } catch (error) {
    console.error("Error in getAllTasks:", error.message);
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

const getTaskById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await Task.findById(id).populate('assignedTo', 'name email profileImageUrl');
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAdmin = req.user.role === 'admin';
    const isAssigned = task.assignedTo.some(user => user._id.equals(req.user._id));

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    const completedTodoCount = task.todoChecklist.filter(todo => todo.completed).length;
    res.status(200).json({ ...task.toObject(), completedTodoCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching task", error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments = [],
      todoChecklist = [],
    } = req.body;

    if (!title || !description || !priority || !dueDate || !Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res.status(400).json({ message: "Missing required fields or invalid assignedTo" });
    }

    // Validate assignedTo users
    for (const userId of assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: `Invalid user ID: ${userId}` });
      }
      if (!(await User.exists({ _id: userId }))) {
        return res.status(404).json({ message: `User not found: ${userId}` });
      }
    }

    // Validate attachments array
    if (!Array.isArray(attachments)) {
      return res.status(400).json({ message: "Attachments must be an array." });
    }
    for (const att of attachments) {
      if (typeof att !== 'object' || !att.name || !att.url) {
        return res.status(400).json({ message: "Each attachment must have a name and url." });
      }
    }

    const newTask = new Task({
      title,
      description,
      priority,
      dueDate: new Date(dueDate),
      assignedTo,
      createdBy: req.user._id,
      attachments,
      todoChecklist,
    });

    syncTaskStatusWithTodos(newTask);
    await newTask.save();

    const populatedTask = await newTask.populate('assignedTo', 'name email profileImageUrl').execPopulate();

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await Task.findById(id).populate('assignedTo', 'name email profileImageUrl');
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAdmin = req.user.role === 'admin';
    const isAssigned = task.assignedTo.some(user => user._id.equals(req.user._id));
    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: "Access denied: Only admin or assigned users can update this task." });
    }

    const allowedFields = isAdmin
      ? ["title", "description", "dueDate", "priority", "todoChecklist", "attachments", "assignedTo"]
      : ["todoChecklist"];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Validate assignedTo if admin updating
    if (isAdmin && updates.assignedTo) {
      if (!Array.isArray(updates.assignedTo)) {
        return res.status(400).json({ message: "assignedTo must be an array" });
      }
      for (const userId of updates.assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: `Invalid user ID: ${userId}` });
        }
        if (!(await User.exists({ _id: userId }))) {
          return res.status(404).json({ message: `User not found: ${userId}` });
        }
      }
      task.assignedTo = updates.assignedTo;
    }

    if (updates.dueDate) {
      const dueDateObj = new Date(updates.dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({ message: "Invalid dueDate format" });
      }
      task.dueDate = dueDateObj;
    }

    if (updates.todoChecklist) {
      if (!Array.isArray(updates.todoChecklist)) {
        return res.status(400).json({ message: "todoChecklist must be an array" });
      }
      task.todoChecklist = updates.todoChecklist.map(todo => {
        if (todo.dueDate) {
          const todoDate = new Date(todo.dueDate);
          if (isNaN(todoDate.getTime())) throw new Error("Invalid todo dueDate format");
          return { ...todo, dueDate: todoDate };
        }
        return todo;
      });
    }

    if (isAdmin) {
      if (updates.title !== undefined) task.title = updates.title;
      if (updates.description !== undefined) task.description = updates.description;
      if (updates.priority !== undefined) task.priority = updates.priority;

      if (updates.attachments !== undefined) {
        if (!Array.isArray(updates.attachments)) {
          return res.status(400).json({ message: "Attachments must be an array." });
        }
        for (const att of updates.attachments) {
          if (typeof att !== 'object' || !att.name || !att.url) {
            return res.status(400).json({ message: "Each attachment must have a name and url." });
          }
        }
        task.attachments = updates.attachments;
      }
    }

    syncTaskStatusWithTodos(task);
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Only admin can delete tasks" });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

    const tasksByStatus = await Task.aggregate([
      { $match: { ...filter, status: { $ne: 'completed' }, dueDate: { $lt: new Date() } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const tasksByPriority = await Task.aggregate([
      { $match: filter },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const recentTasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority createdAt");

    res.status(200).json({ statusSummary: tasksByStatus, prioritySummary: tasksByPriority, recentTasks });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { todoChecklist } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAdmin = req.user.role === 'admin';
    const isAssignedUser = task.assignedTo.some(userId => userId.equals(req.user._id));
    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ message: "Access denied: Only admin or assigned users can update this task." });
    }

    if (todoChecklist) {
      if (!Array.isArray(todoChecklist)) {
        return res.status(400).json({ message: "todoChecklist must be an array" });
      }
      task.todoChecklist = todoChecklist;
    }

    syncTaskStatusWithTodos(task);
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Error updating task status", error: error.message });
  }
};

const updateTaskChecklist = async (req, res) => {
  const { id } = req.params;
  const { checklist } = req.body;

  if (!Array.isArray(checklist)) {
    return res.status(400).json({ message: "Checklist must be an array." });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const isAdmin = req.user.role === 'admin';
    const isAssignedUser = task.assignedTo.some(userId => userId.equals(req.user._id));
    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ message: "Access denied: Only admin or assigned users can update this task." });
    }

    task.todoChecklist.push(...checklist);
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Error updating checklist", error: error.message });
  }
};

export {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getDashboardData,
  updateTaskStatus,
  updateTaskChecklist,
};

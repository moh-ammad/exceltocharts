import Task from "../models/task.js";
import User from "../models/user.js"
import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import { deleteFile } from "../helper.js";

const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (req.user.isSuperAdmin) {
      // Super admin sees both admins and members
      filter.role = { $in: ["admin", "member"] };
    } else if (req.user.role === "admin") {
      // Admin sees only members
      filter.role = "member";
    } else {
      // Members see no users or just themselves? Adjust as needed
      filter._id = req.user._id;  // example: only self
    }

    if (search) {
      filter.name = new RegExp(search, 'i');
    }

    const users = await User.find(filter).select('-password');

    const userWithPassCounts = await Promise.all(users.map(async (user) => {
      const [pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
        Task.countDocuments({ assignedTo: user._id, status: 'pending' }),
        Task.countDocuments({ assignedTo: user._id, status: 'in-progress' }),
        Task.countDocuments({ assignedTo: user._id, status: 'completed' }),
      ]);

      return {
        ...user.toObject(),
        pendingTasks,
        inProgressTasks,
        completedTasks,
      };
    }));

    res.status(200).json(userWithPassCounts);

  } catch (error) {
    console.error('Error in getAllUsers:', error.message);
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};




const getUserById = async (req, res) => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }
  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error: error.message
    })
  }
}

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❌ Only super admin can delete admins
    if (targetUser.role === 'admin' && !req.user.isSuperAdmin) {
      return res.status(403).json({ message: "You are not allowed to delete another admin" });
    }

    // Prevent deletion of the only super admin (optional but recommended)
    if (targetUser.isSuperAdmin) {
      return res.status(403).json({ message: "You cannot delete the super admin" });
    }

    await targetUser.deleteOne();

    res.status(200).json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting user",
      error: error.message
    });
  }
};


// PUT /api/users/:id — Admin updating user
const updateUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, adminKey, removeImage } = req.body || {};

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ❌ Only super admin can update other admins
    if (user.role === "admin" && !req.user.isSuperAdmin) {
      return res.status(403).json({ message: "You are not allowed to update another admin" });
    }

    // ❌ Cannot update super admin
    if (user.isSuperAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({ message: "You cannot modify the super admin" });
    }

    // ✅ Continue with updates...
    if (name) user.name = name.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      user.email = email.trim();
    }

    if (password && password.length >= 6) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      if (role === "admin") {
        const correctAdminKey = process.env.ADMIN_INVITE_TOKEN;
        if (!adminKey || adminKey !== correctAdminKey) {
          return res.status(403).json({ message: "Invalid admin key" });
        }
      }
      user.role = role;
    }

    if (req.file) {
      deleteFile(user.profileImageUrl);
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
      user.profileImageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    } else if (removeImage === "true") {
      deleteFile(user.profileImageUrl);
      user.profileImageUrl = null;
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
};









export { getAllUsers, getUserById, deleteUser, updateUserByAdmin }
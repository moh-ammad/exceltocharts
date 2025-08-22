import Task from "../models/task.js";
import User from "../models/user.js"
import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({
            role: 'member'
        }).select('-password');
        const userWithPassCounts = await Promise.all(users.map(async (user) => {
            const pendingTasks = await Task.countDocuments({
                assignedTo: user._id,
                status: 'pending'
            })
            const inProgressTasks = await Task.countDocuments({
                assignedTo: user._id,
                status: "in-progress"
            })
            const completedTasks = await Task.countDocuments({
                assignedTo: user._id,
                status: "completed"
            })
            return {
                ...user.toObject(),
                pendingTasks,
                inProgressTasks,
                completedTasks
            }

        })
        )
        res.status(200).json(userWithPassCounts)

    } catch (error) {
        res.status(500).json({
            message: "Error fetching users",
            error: error.message
        })
    }
}

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
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
    }
    try {
        const user = await User.findByIdAndDelete(id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json({ message: "User deleted successfully" })
    } catch (error) {
        res.status(500).json({
            message: "Error deleting user",
            error: error.message
        })
    }
}

// PUT /api/users/:id — Admin updating user
const updateUserByAdmin = async (req, res) => {
  const { id } = req.params;

  // Defensive: req.body could be undefined, so default to empty object
  const {
    name,
    email,
    password,
    role,
    adminKey
  } = req.body || {};

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name && typeof name === "string") user.name = name.trim();

    if (email && typeof email === "string") {
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      user.email = email.trim();
    }

    if (password) {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      try {
        user.password = await bcrypt.hash(password, 10);
      } catch (hashError) {
        return res.status(500).json({ message: "Password hashing failed", error: hashError.message });
      }
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
      user.profileImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    await user.save();

    // Return user info without password
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
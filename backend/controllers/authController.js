import User from "../models/user.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const generateToken = (userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    })
    return token;
}

// Register user

const registerUser = async (req, res) => {
  try {
    let originalImageUrl;
    const { fullName, email, password, role, adminKey } = req.body;
    console.log(req.body)

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    if (req.file) {
      originalImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let finalRole = "member";
    if (role === 'admin' && adminKey && adminKey === process.env.ADMIN_INVITE_TOKEN) {
      finalRole = "admin";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: fullName,
      email,
      password: hashedPassword,
      profileImageUrl: originalImageUrl || null,
      role: finalRole,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};


//login user

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const user = await User.findOne({ email });

    if (user && await user.matchPassword(password)) {
      const token = generateToken(user._id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user object and token separately
      return res.status(200).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
        }
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error logging in user",
      error: error.message,
    });
  }
};


const getUserProfile = async (req, res) => {
    try {
        const user= await User.findById(req.user._id).select("-password");
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching user profile",
            error: error.message
        });
        
    }
 }

// controllers/authController.js

const updateUserProfile = async (req, res) => {
  let originalImageUrl;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { name, email, password, role, adminKey } = req.body || {};

  if (name) user.name = name;
  if (email) {
    if (!email.includes("@")) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }
    user.email = email;
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    user.password = await bcrypt.hash(password, 10);
  }

  if (role) {
    if (role === "admin") {
      if (!adminKey || adminKey.trim() === "") {
        return res.status(400).json({ message: "Admin key required for admin role" });
      }
      const correctAdminKey = process.env.ADMIN_INVITE_TOKEN;
      if (adminKey !== correctAdminKey) {
        return res.status(403).json({ message: "Invalid admin key" });
      }
    }
    user.role = role;
  }

  if (req.file) {
    originalImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    user.profileImageUrl = originalImageUrl;
  }

  const updatedUser = await user.save();
  const token = generateToken(updatedUser._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    profileImageUrl: updatedUser.profileImageUrl,
    role: updatedUser.role,
    token,
  });
};


export {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
}

            
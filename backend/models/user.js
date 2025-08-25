import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },
  isSuperAdmin: {
    type: Boolean,
    default: false // Only manually set this to true for the super admin
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Used to track who promoted this user (for admin hierarchy)
  }
}, {
  timestamps: true
});

// 🔐 Compare hashed passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = model('User', userSchema);

export default User;

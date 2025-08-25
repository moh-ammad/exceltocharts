import fs from 'fs';
import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Task from '../models/task.js';
import User from '../models/user.js';

dotenv.config();

// Helper to send XLSX buffer as response attachment
const writeWorkbookToResponse = (res, workbook, filename) => {
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.end(buffer);
};

// Format users for export
const formatUsers = (users) => users.map(user => ({
  ID: user._id.toString(),
  Name: user.name,
  Email: user.email,
  Password: user.password,
  Role: user.role,
  ProfileImage: user.profileImageUrl || '',
  'Admin Key': user.role === 'admin' ? (process.env.ADMIN_INVITE_TOKEN || '') : '',
  CreatedAt: user.createdAt?.toISOString() || '',
  UpdatedAt: user.updatedAt?.toISOString() || '',
}));

// Format tasks for export
const formatTasks = (tasks) => tasks.map(task => ({
  Title: task.title,
  Description: task.description || '',
  Priority: task.priority,
  Status: task.status,
  DueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
  Progress: (task.progress ?? 0) + '%',
  AssignedTo: task.assignedTo?.map(u => u.name).join(', ') || '',
  CreatedBy: task.createdBy?.name || '',
  Attachments: task.attachments?.map(att => `${att.name} (${att.url})`).join(', ') || '',
  Todos: task.todoChecklist?.map(todo => `${todo.text} [${todo.completed ? '✔' : '✘'}]`).join(' | ') || '',
  CreatedAt: task.createdAt ? new Date(task.createdAt).toLocaleString() : '',
  UpdatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleString() : '',
}));

// Normalize keys (trim spaces)
const normalizeSheetKeys = (sheetData) => sheetData.map(row => {
  const normalized = {};
  Object.entries(row).forEach(([k,v]) => normalized[k.trim()] = v);
  return normalized;
});

// Parse attachments string to array
const parseAttachments = (raw) => {
  if (!raw) return [];
  return raw.toString().split(',').map(str => {
    const m = str.trim().match(/^(.+?)\s*\((https?:\/\/[^\s)]+)\)$/);
    return m ? { name: m[1].trim(), url: m[2].trim() } : null;
  }).filter(Boolean);
};

// Parse todos string to array
const parseTodos = (raw) => {
  if (!raw) return [];
  return raw.toString().split(' | ').map(str => {
    const m = str.trim().match(/^(.+?) \[(✔|✘)\]$/);
    return m ? { text: m[1].trim(), completed: m[2] === '✔', dueDate: undefined } : null;
  }).filter(Boolean);
};

// Parse Excel date formats to JS Date
const parseExcelDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date((value - (25567 + 2)) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    // Try parsing dd/mm/yyyy or similar
    const parts = value.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const d = new Date(parts[2], parts[1] - 1, parts[0]);
      if (!isNaN(d.getTime())) return d;
    }
    const d2 = new Date(value);
    return isNaN(d2.getTime()) ? null : d2;
  }
  return null;
};

// Find user by email or name (case-insensitive)
const findUserByEmailOrName = (users, identifier) => {
  if (!identifier) return null;
  const idLower = identifier.trim().toLowerCase();
  return users.find(u =>
    (u.email?.toLowerCase() === idLower) || (u.name?.toLowerCase() === idLower)
  );
};

// Role check helpers
const isSuperAdmin = (user) => user?.isSuperAdmin === true;
const isAdmin = (user) => user?.role === 'admin';

// ==== EXPORT FUNCTIONS ====

const exportEmptyUsersTemplate = async (req, res) => {
  const template = [{
    ID: '',
    Name: '',
    Email: '',
    Password: '',
    Role: '',
    ProfileImage: '',
    'Admin Key': '',
    CreatedAt: '',
    UpdatedAt: '',
  }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(template), 'Users');
  writeWorkbookToResponse(res, wb, 'empty-users-template.xlsx');
};

const exportOnlyUsers = async (req, res) => {
  const currentUser = req.user;

  if (isSuperAdmin(currentUser)) {
    const users = await User.find({ role: { $in: ['admin', 'member'] } }).lean();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
    return writeWorkbookToResponse(res, wb, 'users.xlsx');
  }

  if (isAdmin(currentUser)) {
    const users = await User.find({ role: 'member' }).lean();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
    return writeWorkbookToResponse(res, wb, 'members.xlsx');
  }

  return res.status(403).json({ message: 'Access denied' });
};

const exportOnlyTasks = async (req, res) => {
  const currentUser = req.user;

  let tasks = [];

  if (isSuperAdmin(currentUser)) {
    tasks = await Task.find()
      .populate('assignedTo')
      .populate('createdBy')
      .lean();
  } else if (isAdmin(currentUser)) {
    const members = await User.find({ role: 'member' }).select('_id').lean();
    const memberIds = members.map(u => u._id);

    tasks = await Task.find({
      $or: [
        { createdBy: currentUser._id },
        { assignedTo: { $in: memberIds } }
      ]
    }).populate('assignedTo').populate('createdBy').lean();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatTasks(tasks)), 'Tasks');
  return writeWorkbookToResponse(res, wb, 'tasks.xlsx');
};

const exportUsersWithEmptyTasks = async (req, res) => {
  const currentUser = req.user;

  if (isSuperAdmin(currentUser)) {
    const users = await User.find({ role: { $in: ['admin', 'member'] } }).lean();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'Tasks');
    return writeWorkbookToResponse(res, wb, 'users-and-empty-tasks.xlsx');
  }

  if (isAdmin(currentUser)) {
    const users = await User.find({ role: 'member' }).lean();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'Tasks');
    return writeWorkbookToResponse(res, wb, 'members-and-empty-tasks.xlsx');
  }

  return res.status(403).json({ message: 'Access denied' });
};

const exportUsersAndTasks = async (req, res) => {
  const currentUser = req.user;

  let users = [];
  let tasks = [];

  if (isSuperAdmin(currentUser)) {
    users = await User.find({ role: { $in: ['admin', 'member'] } }).lean();
    tasks = await Task.find().populate('assignedTo').populate('createdBy').lean();
  } else if (isAdmin(currentUser)) {
    users = await User.find({ role: 'member' }).lean();

    const memberIds = users.map(u => u._id);

    tasks = await Task.find({
      $or: [
        { createdBy: currentUser._id },
        { assignedTo: { $in: memberIds } }
      ]
    }).populate('assignedTo').populate('createdBy').lean();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatTasks(tasks)), 'Tasks');

  return writeWorkbookToResponse(res, wb, isSuperAdmin(currentUser) ? 'users-and-tasks.xlsx' : 'members-and-tasks.xlsx');
};

// ==== IMPORT FUNCTIONS ====

const importOnlyUsers = async (req, res) => {
  const currentUser = req.user;
  if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

  if (!isAdmin(currentUser) && !isSuperAdmin(currentUser)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const filePath = req.file.path;
  const workbook = XLSX.readFile(filePath);

  let usersSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Users"] || []);
  usersSheet = normalizeSheetKeys(usersSheet);

  const errors = [];

  for (let i = 0; i < usersSheet.length; i++) {
    const row = usersSheet[i];
    const rowNum = i + 2; // For error messages (Excel rows start at 1 + header)

    const id = row.ID?.trim() || null;
    const name = row.Name?.trim();
    const email = row.Email?.trim().toLowerCase();
    const role = row.Role?.trim().toLowerCase();
    const adminKey = row['Admin Key']?.trim();
    const profileImageUrl = row.ProfileImage?.trim() || '';

    if (!name || !email || !role) {
      errors.push(`[User Import] row ${rowNum}: Missing required fields`);
      continue;
    }

    if (!['admin', 'member'].includes(role)) {
      errors.push(`[User Import] row ${rowNum}: Invalid role "${role}"`);
      continue;
    }

    // Only superadmin can create admins
    if (role === 'admin' && !isSuperAdmin(currentUser)) {
      errors.push(`[User Import] row ${rowNum}: Only superadmin can create admin users`);
      continue;
    }

    // If adminKey is required for admin creation
    if (role === 'admin' && adminKey !== (process.env.ADMIN_INVITE_TOKEN || '')) {
      errors.push(`[User Import] row ${rowNum}: Invalid Admin Key`);
      continue;
    }

    // Check if user exists by ID or email
    let user = null;
    if (id) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      // Update existing user
      user.name = name;
      user.email = email;
      user.role = role;
      user.profileImageUrl = profileImageUrl;

      // Password update only if password provided
      if (row.Password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(row.Password, salt);
      }
      await user.save();
    } else {
      // New user
      const password = row.Password || 'defaultPassword123'; // fallback password

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        name,
        email,
        role,
        profileImageUrl,
        password: hashedPassword,
      });

      await newUser.save();
    }
  }

  // Delete temp uploaded file
  fs.unlink(filePath, () => {});

  if (errors.length) {
    return res.status(400).json({ message: 'Import finished with errors', errors });
  }

  return res.json({ message: 'Users imported successfully' });
};

const importUsersAndTasks = async (req, res) => {
  const currentUser = req.user;
  if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

  if (!isAdmin(currentUser) && !isSuperAdmin(currentUser)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const filePath = req.file.path;
  const workbook = XLSX.readFile(filePath);

  let usersSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Users"] || []);
  usersSheet = normalizeSheetKeys(usersSheet);

  let tasksSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Tasks"] || []);
  tasksSheet = normalizeSheetKeys(tasksSheet);

  const errors = [];

  // Import users first (same logic as importOnlyUsers)
  for (let i = 0; i < usersSheet.length; i++) {
    const row = usersSheet[i];
    const rowNum = i + 2;

    const id = row.ID?.trim() || null;
    const name = row.Name?.trim();
    const email = row.Email?.trim().toLowerCase();
    const role = row.Role?.trim().toLowerCase();
    const adminKey = row['Admin Key']?.trim();
    const profileImageUrl = row.ProfileImage?.trim() || '';

    if (!name || !email || !role) {
      errors.push(`[User Import] row ${rowNum}: Missing required fields`);
      continue;
    }

    if (!['admin', 'member'].includes(role)) {
      errors.push(`[User Import] row ${rowNum}: Invalid role "${role}"`);
      continue;
    }

    if (role === 'admin' && !isSuperAdmin(currentUser)) {
      errors.push(`[User Import] row ${rowNum}: Only superadmin can create admin users`);
      continue;
    }

    if (role === 'admin' && adminKey !== (process.env.ADMIN_INVITE_TOKEN || '')) {
      errors.push(`[User Import] row ${rowNum}: Invalid Admin Key`);
      continue;
    }

    let user = null;
    if (id) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      user.name = name;
      user.email = email;
      user.role = role;
      user.profileImageUrl = profileImageUrl;

      if (row.Password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(row.Password, salt);
      }
      await user.save();
    } else {
      const password = row.Password || 'defaultPassword123';

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        name,
        email,
        role,
        profileImageUrl,
        password: hashedPassword,
      });

      await newUser.save();
    }
  }

  // Reload users after import to resolve assignedTo and createdBy
  const allUsers = await User.find().lean();

  // Import tasks
  for (let i = 0; i < tasksSheet.length; i++) {
    const row = tasksSheet[i];
    const rowNum = i + 2;

    const title = row.Title?.trim();
    if (!title) {
      errors.push(`[Task Import] row ${rowNum}: Title is required`);
      continue;
    }

    const description = row.Description?.trim() || '';
    const priority = row.Priority?.trim() || 'Normal';
    const status = row.Status?.trim() || 'Pending';
    const dueDate = parseExcelDate(row.DueDate);
    const progressStr = row.Progress?.toString().trim().replace('%', '') || '0';
    const progress = Number(progressStr);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      errors.push(`[Task Import] row ${rowNum}: Invalid progress value "${row.Progress}"`);
      continue;
    }

    // assignedTo can be multiple users (comma-separated names/emails)
    const assignedToRaw = row.AssignedTo || '';
    const assignedToIdentifiers = assignedToRaw.toString().split(',').map(s => s.trim()).filter(Boolean);
    const assignedToUsers = assignedToIdentifiers
      .map(idf => findUserByEmailOrName(allUsers, idf))
      .filter(Boolean);

    // createdBy single user (name or email)
    const createdByUser = findUserByEmailOrName(allUsers, row.CreatedBy);

    if (!createdByUser) {
      errors.push(`[Task Import] row ${rowNum}: CreatedBy user "${row.CreatedBy}" not found`);
      continue;
    }

    // attachments & todos parsing
    const attachments = parseAttachments(row.Attachments);
    const todos = parseTodos(row.Todos);

    // Try to find existing task by title & createdBy (or create new)
    let task = await Task.findOne({ title, createdBy: createdByUser._id });
    if (!task) {
      task = new Task();
    }

    task.title = title;
    task.description = description;
    task.priority = priority;
    task.status = status;
    task.dueDate = dueDate;
    task.progress = progress;
    task.assignedTo = assignedToUsers.map(u => u._id);
    task.createdBy = createdByUser._id;
    task.attachments = attachments;
    task.todoChecklist = todos;

    try {
      await task.save();
    } catch (err) {
      errors.push(`[Task Import] row ${rowNum}: Error saving task - ${err.message}`);
    }
  }

  // Delete temp file
  fs.unlink(filePath, () => {});

  if (errors.length) {
    return res.status(400).json({ message: 'Import finished with errors', errors });
  }

  return res.json({ message: 'Users and tasks imported successfully' });
};

// Export all functions for routes
export {
  exportEmptyUsersTemplate,
  exportOnlyUsers,
  exportOnlyTasks,
  exportUsersWithEmptyTasks,
  exportUsersAndTasks,
  importOnlyUsers,
  importUsersAndTasks,
};

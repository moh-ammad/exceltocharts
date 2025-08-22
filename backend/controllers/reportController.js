import fs from 'fs';
import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Task from '../models/task.js';
import User from '../models/user.js';

dotenv.config();

const writeWorkbookToResponse = (res, workbook, filename) => {
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.end(buffer);
};

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

// Normalize sheet keys: trim all keys of each object in the array
const normalizeSheetKeys = (sheetData) => {
  return sheetData.map(row => {
    const normalizedRow = {};
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[key.trim()] = value;
    });
    return normalizedRow;
  });
};

const parseAttachments = (attachmentsRaw) => {
  if (!attachmentsRaw) return [];
  return attachmentsRaw
    .toString()
    .split(',')
    .map(str => str.trim())
    .map(str => {
      const match = str.match(/^(.+?)\s*\((https?:\/\/[^\s)]+)\)$/);
      if (match) {
        return { name: match[1].trim(), url: match[2].trim() };
      }
      return null;
    })
    .filter(Boolean);
};

const parseTodos = (todosRaw) => {
  if (!todosRaw) return [];
  return todosRaw
    .toString()
    .split(' | ')
    .map(str => str.trim())
    .map(todoStr => {
      const match = todoStr.match(/^(.+?) \[(✔|✘)\]$/);
      if (match) {
        return {
          text: match[1].trim(),
          completed: match[2] === '✔',
          dueDate: undefined,
        };
      }
      return null;
    })
    .filter(Boolean);
};

const parseExcelDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date((value - (25567 + 2)) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date;
  }
  if (typeof value === 'string') {
    // Parse DD/MM/YYYY format
    const parts = value.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
};


const findUserByEmailOrName = (users, identifier) => {
  if (!identifier) return null;
  const idLower = identifier.trim().toLowerCase();
  return users.find(u =>
    (u.email?.toLowerCase() === idLower) || (u.name?.toLowerCase() === idLower)
  );
};

const exportEmptyUsersTemplate = (req, res) => {
  const usersTemplate = [{
    Name: '',
    Email: '',
    Password: '',
    Role: '',
    'Admin Key': '',
    ProfileImage: '',
  }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersTemplate), 'Users');
  writeWorkbookToResponse(res, wb, 'empty-users-template.xlsx');
};

const exportOnlyUsers = async (req, res) => {
  const users = await User.find().lean();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
  writeWorkbookToResponse(res, wb, 'users.xlsx');
};

const exportOnlyTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo')
      .populate('createdBy')
      .lean();

    const formattedTasks = formatTasks(tasks);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedTasks);
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    writeWorkbookToResponse(res, wb, 'tasks.xlsx');
  } catch (error) {
    console.error('Export tasks error:', error);
    res.status(500).json({ message: 'Failed to export tasks' });
  }
};

const exportUsersWithEmptyTasks = async (req, res) => {
  const users = await User.find().lean();

  const emptyTasks = [{
    Title: '',
    Description: '',
    Priority: '',
    Status: '',
    DueDate: '',
    AssignedTo: '',
    CreatedBy: '',
    TodoChecklist: '',
    Progress: '',
    Attachments: '',
  }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(emptyTasks), 'Tasks');
  writeWorkbookToResponse(res, wb, 'users-with-empty-tasks.xlsx');
};

const exportUsersAndTasks = async (req, res) => {
  const users = await User.find().lean();
  const tasks = await Task.find().populate('assignedTo').populate('createdBy').lean();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatTasks(tasks)), 'Tasks');
  writeWorkbookToResponse(res, wb, 'users-and-tasks.xlsx');
};

const importOnlyUsers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

  const filePath = req.file.path;
  const workbook = XLSX.readFile(filePath);

  // Normalize keys here
  let usersSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Users"] || []);
  usersSheet = normalizeSheetKeys(usersSheet);

  const errors = [];

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
      errors.push(`[User Import] row ${rowNum}: Invalid role`);
      continue;
    }

    if (role === 'admin' && adminKey !== process.env.ADMIN_INVITE_TOKEN) {
      errors.push(`[User Import] row ${rowNum}: Invalid admin key`);
      continue;
    }

    const existingUser = id ? await User.findById(id) : await User.findOne({ email });

    try {
      if (existingUser) {
        await User.findByIdAndUpdate(existingUser._id, {
          name,
          email,
          role,
          profileImageUrl,
        });
      } else {
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashedPassword, role, profileImageUrl });
      }
    } catch (err) {
      errors.push(`[User Import] row ${rowNum}: ${err.message}`);
    }
  }

  await fs.promises.unlink(filePath);

  if (errors.length) return res.status(400).json({ message: 'Import completed with errors', errors });
  res.status(200).json({ message: 'Users imported successfully' });
};

const importUsersAndTasks = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

  const filePath = req.file.path;
  const errors = [];

  try {
    const workbook = XLSX.readFile(filePath);
    const usersSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Users'] || []);
    const tasksSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Tasks'] || []);

    // Cache users
    const existingUsersList = await User.find().lean();
    const existingUsersByEmail = new Map(existingUsersList.map(u => [u.email.toLowerCase(), u]));

    // === Import USERS ===
    for (let i = 0; i < usersSheet.length; i++) {
      const row = usersSheet[i];
      const rowNum = i + 2;

      const name = row.Name?.toString().trim();
      const email = row.Email?.toString().trim().toLowerCase();
      const role = row.Role?.toString().trim().toLowerCase();
      const adminKey = row['Admin Key']?.toString().trim();
      const profileImageUrl = row.ProfileImage?.toString().trim() || '';

      if (!name && !email && !role) continue; // Skip empty rows

      if (!name || !email || !role) {
        errors.push(`[User Import] row ${rowNum}: Missing required fields (Name, Email, Role)`);
        continue;
      }

      if (!['admin', 'member'].includes(role)) {
        errors.push(`[User Import] row ${rowNum}: Invalid role "${role}"`);
        continue;
      }

      if (role === 'admin' && adminKey !== process.env.ADMIN_INVITE_TOKEN) {
        errors.push(`[User Import] row ${rowNum}: Invalid admin key`);
        continue;
      }

      try {
        const existingUser = existingUsersByEmail.get(email);
        if (existingUser) {
          await User.findByIdAndUpdate(existingUser._id, { name, role, profileImageUrl });
        } else {
          const password = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(password, 10);
          const newUser = await User.create({ name, email, password: hashedPassword, role, profileImageUrl });
          existingUsersByEmail.set(email, newUser);
        }
      } catch (err) {
        errors.push(`[User Import] row ${rowNum}: ${err.message}`);
      }
    }

    // Reload users for mapping
    const allUsers = await User.find().lean();
    const usersByEmailOrName = new Map();
    allUsers.forEach(u => {
      if (u.email) usersByEmailOrName.set(u.email.toLowerCase(), u);
      if (u.name) usersByEmailOrName.set(u.name.toLowerCase(), u);
    });

    // === Import TASKS ===
    for (let i = 0; i < tasksSheet.length; i++) {
      const row = tasksSheet[i];
      const rowNum = i + 2;

      try {
        const title = row.Title?.toString().trim();
        const dueDateRaw = row.DueDate;
        const createdByRaw = row.CreatedBy?.toString().trim();

        // Parse date with improved function (supports DD/MM/YYYY)
        const dueDate = parseExcelDate(dueDateRaw);

        if (!title && !dueDateRaw && !createdByRaw) continue; // Skip empty task row

        // Validation
        if (!title || !dueDate || !createdByRaw) {
          errors.push(`[Task Import] row ${rowNum}: Missing required fields (Title, DueDate, CreatedBy)`);
          continue;
        }

        if (isNaN(dueDate.getTime())) {
          errors.push(`[Task Import] row ${rowNum}: Invalid DueDate format`);
          continue;
        }

        const createdByUser = usersByEmailOrName.get(createdByRaw.toLowerCase());
        if (!createdByUser) {
          errors.push(`[Task Import] row ${rowNum}: CreatedBy user not found (${createdByRaw})`);
          continue;
        }

        // AssignedTo
        const assignedToRaw = row.AssignedTo || '';
        const assignedInputs = assignedToRaw
          .toString()
          .split(',')
          .map(str => str.trim())
          .filter(Boolean);
        const assignedUsers = assignedInputs
          .map(input => usersByEmailOrName.get(input.toLowerCase()))
          .filter(Boolean);

        // Optional fields
        const priority = row.Priority?.toString().trim() || 'medium';
        const status = row.Status?.toString().trim() || 'pending';
        const description = row.Description || '';
        const progress = typeof row.Progress === 'string'
          ? parseInt(row.Progress.replace('%', ''), 10) || 0
          : parseInt(row.Progress, 10) || 0;

        const attachments = parseAttachments(row.Attachments);
        const todoChecklist = parseTodos(row.Todos);

        await Task.create({
          title,
          description,
          priority,
          status,
          dueDate,
          progress,
          attachments,
          todoChecklist,
          createdBy: createdByUser._id,
          assignedTo: assignedUsers.map(u => u._id),
        });
      } catch (err) {
        errors.push(`[Task Import] row ${rowNum}: ${err.message}`);
      }
    }
  } catch (err) {
    errors.push(`General import error: ${err.message}`);
  }

  await fs.promises.unlink(filePath);

  if (errors.length) {
    return res.status(400).json({ message: 'Import completed with errors', errors });
  }

  res.status(200).json({ message: 'Import successful' });
};




export {
  exportEmptyUsersTemplate,
  exportOnlyUsers,
  exportOnlyTasks,
  exportUsersWithEmptyTasks,
  exportUsersAndTasks,
  importOnlyUsers,
  importUsersAndTasks,
};

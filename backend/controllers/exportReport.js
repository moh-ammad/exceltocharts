import XLSX from 'xlsx';
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
    Object.entries(row).forEach(([k, v]) => normalized[k.trim()] = v);
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

    const emptyTaskTemplate = [{
        Title: '',
        Description: '',
        Priority: '',
        Status: '',
        DueDate: '',
        Progress: '',
        AssignedTo: '',
        CreatedBy: '',
        Attachments: '',
        Todos: '',
        CreatedAt: '',
        UpdatedAt: ''
    }];

    if (isSuperAdmin(currentUser)) {
        const users = await User.find({ role: { $in: ['admin', 'member'] } }).lean();
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(emptyTaskTemplate), 'Tasks'); // <-- Use template with headers
        return writeWorkbookToResponse(res, wb, 'users-and-empty-tasks.xlsx');
    }

    if (isAdmin(currentUser)) {
        const users = await User.find({ role: 'member' }).lean();
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(emptyTaskTemplate), 'Tasks'); // <-- Use template with headers
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

export {
    exportEmptyUsersTemplate,
    exportOnlyUsers,
    exportOnlyTasks,
    exportUsersWithEmptyTasks,
    exportUsersAndTasks
};
// export const BASE_URL = "http://localhost:5000/api";
// export const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
export const BASE_URL = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
  },
  USERS: {
    GET_ALL_USERS: "/api/users",
    GET_USER_BY_ID: (userId) => `/api/users/${userId}`,
    // CREATE_USER: "/api/users",
    UPDATE_USER: (userId) => `/api/users/${userId}`,
    DELETE_USER: (userId) => `/api/users/${userId}`,
  },
  TASKS: {
    GET_DASHBOARD_DATA: "/api/tasks/dashboard-data",
    GET_ALL_TASKS: "/api/tasks",
    GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
    CREATE_TASK: "/api/tasks/create",
    UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`,
    DELETE_TASK: (taskId) => `/api/tasks/${taskId}`,
  },
  REPORTS: {
    // === EXPORT ROUTES ===
    EXPORT_EMPTY_USERS_TEMPLATE: "/api/reports/exports/empty-users",          // 1. Empty Users Template
    EXPORT_ALL_USERS: "/api/reports/exports/users",                           // 2. Only Users
    EXPORT_ALL_TASKS: "/api/reports/exports/tasks",                           // 3. Only Tasks
    EXPORT_USERS_WITH_EMPTY_TASKS: "/api/reports/exports/users-emptytasks",   // 4. Users + Empty Tasks
    EXPORT_USERS_AND_TASKS: "/api/reports/exports/users-tasks",               // 5. Users + Tasks

    // === IMPORT ROUTES ===
    IMPORT_ONLY_USERS: "/api/reports/upload/users",                           // 6. Only Users
    IMPORT_USERS_AND_TASKS: "/api/reports/upload/users-tasks",                // 7. Users + Tasks
  }
};


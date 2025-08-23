// export const BASE_URL = "http://localhost:5000/api";
// export const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
export const BASE_URL = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    GET_PROFILE: "/auth/profile",
    UPDATE_PROFILE: "/auth/profile",
  },
  USERS: {
    GET_ALL_USERS: "/users",
    GET_USER_BY_ID: (userId) => `/users/${userId}`,
    // CREATE_USER: "/users",
    UPDATE_USER: (userId) => `/users/${userId}`,
    DELETE_USER: (userId) => `/users/${userId}`,
  },
  TASKS: {
    GET_DASHBOARD_DATA: "/tasks/dashboard-data",
    GET_ALL_TASKS: "/tasks",
    GET_TASK_BY_ID: (taskId) => `/tasks/${taskId}`,
    CREATE_TASK: "/tasks/create",
    UPDATE_TASK: (taskId) => `/tasks/${taskId}`,
    DELETE_TASK: (taskId) => `/tasks/${taskId}`,
  },
  REPORTS: {
    // === EXPORT ROUTES ===
    EXPORT_EMPTY_USERS_TEMPLATE: "/reports/exports/empty-users",          // 1. Empty Users Template
    EXPORT_ALL_USERS: "/reports/exports/users",                           // 2. Only Users
    EXPORT_ALL_TASKS: "/reports/exports/tasks",                           // 3. Only Tasks
    EXPORT_USERS_WITH_EMPTY_TASKS: "/reports/exports/users-emptytasks",   // 4. Users + Empty Tasks
    EXPORT_USERS_AND_TASKS: "/reports/exports/users-tasks",               // 5. Users + Tasks

    // === IMPORT ROUTES ===
    IMPORT_ONLY_USERS: "/reports/upload/users",                           // 6. Only Users
    IMPORT_USERS_AND_TASKS: "/reports/upload/users-tasks",                // 7. Users + Tasks
  }
};


import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import UserContextProvider from '@/context/userContext';
import ThemeProvider from '@/context/themeContext';

import Login from '@/pages/Auth/Login';
import SignUp from '@/pages/Auth/SignUp';

import ManageUsers from '@/pages/Admin/ManageUsers';
import ManageTasks from '@/pages/Admin/ManageTasks';
import CreateTask from '@/pages/Admin/CreateTask';

import UserDashboard from '@/pages/users/UserDashboard';
import MyTasks from '@/pages/users/MyTasks';
import ViewTaskDetails from '@/pages/users/ViewtaskDetails';

import PrivateRoute from '@/routes/PrivateRoute';

import Navbar from '@/components/layouts/Navbar';
import Home from '@/components/layouts/Home';
import Instructions from '@/components/Instructions';
import UploadPage from '@/components/UploadPage';
import Profile from '@/components/Profile';
import UpdateUser from '@/pages/Auth/UpdateUser';
import UpdateTask from '@/pages/Admin/UpdateTask';

import Visualize2d from "@/visualize/Visualize2d"
import Visualize3d from '@/visualize/Visualize3d';
import VisualizeDashboard from '@/visualize/Dashboard';
import Dashboard from '@/visualize/Dashboard';

const App = () => {
  return (
    <UserContextProvider>
      <ThemeProvider>
        <Router>
          <Toaster position="top-right" reverseOrder={false} />

          <Routes>
            {/* Public routes without Navbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/signUp" element={<SignUp />} />

            {/* Protected routes wrapped by Navbar */}
            <Route element={<PrivateRoute allowedRoles={['admin', 'member']} />}>
              <Route element={<Navbar />}>
                {/* Common routes */}
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/update-profile" element={<UpdateUser />} />
                <Route path="/admin/update-user/:userId" element={<UpdateUser />} />

                <Route path="/upload" element={<UploadPage />} />
                <Route path="/instructions" element={<Instructions />} />
                <Route path="/visualize/2d" element={<Visualize2d />} />
                <Route path="/visualize/3d" element={<Visualize3d />} />
                <Route path="/visualize/dashboard" element={<VisualizeDashboard />} />

                {/* ✅ Fixed this line */}
                <Route path="/update-task/:taskId" element={<UpdateTask />} />

                {/* User routes */}
                <Route path="/tasks" element={<MyTasks />} />
                <Route path="/view-task/:taskId" element={<ViewTaskDetails />} />
                <Route path="/user/user-dashboard" element={<UserDashboard />} />

                {/* Admin-only routes */}
                <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="/admin/create-task" element={<CreateTask />} />
                  <Route path="/admin/tasks" element={<ManageTasks />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </UserContextProvider>
  );
};

export default App;

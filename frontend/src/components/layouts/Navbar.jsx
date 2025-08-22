import { useContext, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '@/context/userContext';
import { ThemeContext } from '@/context/themeContext';

// lucide-react icons
import {
  Home,
  Users,
  ClipboardList,
  Upload,
  LogOut,
  BarChart2,
  Cpu,
  Sun,
  Moon,
  FilePlus,
  ChevronDown,
  ChevronUp,
  Menu
} from 'lucide-react';

const Navbar = () => {
  const { user, clearUser } = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [visualizeOpen, setVisualizeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearUser();
    navigate('/login');
    setSidebarOpen(false); // close sidebar on logout
  };

  // Sidebar menu by role with updated paths
  const adminMenu = [
    { label: 'Home', to: '/', icon: <Home size={18} /> },
    { label: 'Profile', to: '/profile', icon: <Users size={18} /> },
    { label: 'Users', to: '/admin/users', icon: <Users size={18} /> },
    { label: 'Tasks', to: '/admin/tasks', icon: <ClipboardList size={18} /> },
    { label: 'Create Task', to: '/admin/create-task', icon: <FilePlus size={18} /> },
    { label: 'Dashboard', to: '/admin/dashboard', icon: <BarChart2 size={18} /> },
    { label: 'Upload', to: '/upload', icon: <Upload size={18} /> },
  ];

  const userMenu = [
    { label: 'Home', to: '/', icon: <Home size={18} /> },
    { label: 'Profile', to: '/profile', icon: <Users size={18} /> },
    { label: 'My Tasks', to: '/tasks', icon: <ClipboardList size={18} /> },
    { label: 'Dashboard', to: '/user/user-dashboard', icon: <BarChart2 size={18} /> },
    { label: 'Upload', to: '/upload', icon: <Upload size={18} /> },
  ];

  const menu = user?.role === 'admin' ? adminMenu : userMenu;

  // Highlight active link
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar overlay for small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col
          transform transition-transform duration-300 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
        `}
      >
        <div
          className="px-6 py-4 font-bold text-xl text-blue-600 dark:text-blue-400 cursor-pointer flex items-center gap-2"
          onClick={() => {
            navigate('/');
            setSidebarOpen(false);
          }}
        >
          <span>DataViz</span>
        </div>
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {menu.map(({ label, to, icon }) => (
            <Link
              key={label}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded transition-colors ${isActive(to)
                ? 'bg-blue-200 dark:bg-gray-700 text-blue-700 dark:text-blue-400'
                : 'hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}

          {/* Visualize dropdown */}
          <div className="mt-4 px-4">
            <button
              onClick={() => setVisualizeOpen(!visualizeOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors focus:outline-none text-gray-700 dark:text-gray-300"
              aria-expanded={visualizeOpen}
            >
              <span className="flex items-center gap-2">
                <Cpu size={18} /> Visualize
              </span>
              <span>
                {visualizeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {visualizeOpen && (
              <div className="ml-6 mt-2 flex flex-col space-y-1">
                <Link
                  to="/visualize/2d"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive('/visualize/2d')
                    ? 'bg-blue-300 dark:bg-gray-600 text-blue-700 dark:text-blue-400'
                    : 'hover:bg-blue-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <BarChart2 size={16} /> 2D Visuals
                </Link>
                <Link
                  to="/visualize/3d"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive('/visualize/3d')
                    ? 'bg-blue-300 dark:bg-gray-600 text-blue-700 dark:text-blue-400'
                    : 'hover:bg-blue-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <Cpu size={16} /> 3D Visuals
                </Link>
              </div>
            )}
          </div>

          {/* Logout inside sidebar */}
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-3 mt-6 w-full text-red-500 hover:text-red-700 font-semibold"
            >
              <LogOut size={18} /> Logout
            </button>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top navbar */}
        <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 shadow-md lg:px-6">
          <div className="flex items-center gap-4">
            {/* Hamburger menu for small screens */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 dark:text-gray-300 lg:hidden focus:outline-none"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            {/* DataViz brand on top-left on small screens and hidden on large (because sidebar shows it) */}
            <div
              className="font-bold text-xl text-blue-600 dark:text-blue-400 cursor-pointer lg:hidden"
              onClick={() => navigate('/')}
            >
              DataViz
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Remove logout from top on small & large, it's in sidebar now */}
            {!user && (
              <>
                <Link to="/login" className="hover:underline text-gray-700 dark:text-gray-300">
                  Login
                </Link>
                <Link to="/signUp" className="ml-4 hover:underline text-gray-700 dark:text-gray-300">
                  Register
                </Link>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Navbar;
// src/components/ThemeToggle.jsx
import { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '@/context/themeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="text-black dark:text-white ml-2"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;

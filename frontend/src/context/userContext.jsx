// context/UserContextProvider

import { createContext, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import axiosInstance from '@/utils/axiosInstance';

export const UserContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true initially while checking token

  // Fetch user profile if token exists
  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(API_ENDPOINTS.AUTH.GET_PROFILE);
        setUser(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          // Token invalid or expired → logout
          clearUser();
        } else {
          console.error('Error fetching user profile:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Set user and store token
  const updateUser = (userData) => {
    setUser(userData);
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    setLoading(false);
  };

  // Clear user and token
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;
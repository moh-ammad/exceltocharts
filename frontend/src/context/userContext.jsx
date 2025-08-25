import { createContext, useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import axiosInstance from '@/utils/axiosInstance';

export const UserContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to check if user is authenticated
  const isAuthenticated = !!user;

  // Fetch user profile if token exists
  const fetchUserProfile = useCallback(async (signal) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.AUTH.GET_PROFILE, { signal });
      setUser(response.data);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      if (error.response?.status === 401) {
        // Token invalid or expired → logout
        clearUser();
      } else {
        console.error('Error fetching user profile:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchUserProfile(controller.signal);

    // Cleanup to abort fetch on unmount
    return () => controller.abort();
  }, [fetchUserProfile]);

  // Update user & store token if present
  const updateUser = (userData) => {
    setUser(userData);
    if (userData?.token) {
      localStorage.setItem('token', userData.token);
    }
    setLoading(false);
  };

  // Clear user & remove token from storage
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  // Optional: method to refresh profile manually
  const refreshUserProfile = async () => {
    setLoading(true);
    await fetchUserProfile();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        updateUser,
        clearUser,
        refreshUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;

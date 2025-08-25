import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { showError, showSuccess } from '@/utils/helper';
import { Trash2, Edit, Download } from 'lucide-react';
import ConfirmationPopup from '@/createtasks/ConfirmationPopUp';
import FileSaver from 'file-saver';
import axiosInstance from '@/utils/axiosInstance';
import UserAvatar from '@/createtasks/UserAvatar';
import SearchBar from '@/createtasks/SearchBar';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchUsers = async (search = '') => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS, {
        params: { search },
      });
      setUsers(data);
    } catch (err) {
      showError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openDeleteConfirm = (id) => setDeleteUserId(id);
  const cancelDelete = () => setDeleteUserId(null);

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);

    try {
      await axiosInstance.delete(API_ENDPOINTS.USERS.DELETE_USER(deleteUserId));
      showSuccess('User deleted successfully');
      setUsers((prev) => prev.filter((u) => u._id !== deleteUserId));
      setDeleteUserId(null);
    } catch (err) {
      showError('Failed to delete user');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (user) => {
    navigate(`/admin/update-user/${user._id}`);
  };

  const handleDownloadUsers = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.EXPORT_ALL_USERS, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      FileSaver.saveAs(blob, 'users.xlsx');
      showSuccess('Users Excel downloaded');
    } catch (error) {
      console.error('Download users error:', error);
      showError('Failed to download users');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-700 dark:text-gray-300">
        Loading users...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">
          Manage Users
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <SearchBar
            placeholder="Search by name..."
            value={searchTerm}                   
            onSearch={(value) => setSearchTerm(value.trim())}  
          />
          <button
            onClick={handleDownloadUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow transition"
          >
            <Download className="w-4 h-4" />
            Download Users
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-400 italic text-center">No users found.</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full bg-[#0f172a] text-white rounded-lg">
              <thead>
                <tr className="text-left border-b border-gray-700 text-sm">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-yellow-400">Pending</th>
                  <th className="px-4 py-3 text-blue-400">In Progress</th>
                  <th className="px-4 py-3 text-green-400">Completed</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition-colors text-sm"
                  >
                    <td className="px-4 py-3 flex h-20 items-center gap-4 whitespace-nowrap">
                      <UserAvatar src={user.profileImageUrl} name={user.name} />
                      <span className="font-semibold">{user.name}</span>
                    </td>
                    <td className="px-4 py-3 break-all">{user.email}</td>
                    <td className="px-4 py-3 text-yellow-400">{user.pendingTasks || 0}</td>
                    <td className="px-4 py-3 text-blue-400">{user.inProgressTasks || 0}</td>
                    <td className="px-4 py-3 text-green-400">{user.completedTasks || 0}</td>
                    <td className="px-4 py-3 flex h-20 items-center gap-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex items-center justify-center p-2 rounded hover:bg-blue-500/20"
                        aria-label="Edit user"
                      >
                        <Edit className="text-blue-500 w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(user._id)}
                        className="flex items-center justify-center p-2 rounded hover:bg-red-500/20"
                        disabled={deleting}
                        aria-label="Delete user"
                      >
                        <Trash2
                          className={`w-5 h-5 ${deleting ? 'text-red-300' : 'text-red-500'}`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col container mx-auto space-y-6 lg:hidden">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-[#0f172a] text-white rounded-xl p-6 shadow-lg border border-gray-700"
              >
                <div className="flex justify-center">
                  <UserAvatar src={user.profileImageUrl} name={user.name} />
                </div>

                <div className="text-center space-y-1 mt-3">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-gray-400 text-sm break-all">{user.email}</p>
                </div>

                <div className="flex flex-wrap justify-around text-sm font-medium text-center gap-3 mt-4">
                  <div className="text-yellow-400">
                    <p>Pending</p>
                    <p>{user.pendingTasks || 0}</p>
                  </div>
                  <div className="text-blue-400">
                    <p>In Progress</p>
                    <p>{user.inProgressTasks || 0}</p>
                  </div>
                  <div className="text-green-400">
                    <p>Completed</p>
                    <p>{user.completedTasks || 0}</p>
                  </div>
                </div>

                <div className="flex justify-around gap-4 pt-5">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700 transition duration-200"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(user._id)}
                    disabled={deleting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-md transition duration-200 ${
                      deleting ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmationPopup
        isOpen={Boolean(deleteUserId)}
        onCancel={cancelDelete}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};

export default ManageUsers;

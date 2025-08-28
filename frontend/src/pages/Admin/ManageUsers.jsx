import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { showError, showSuccess } from '@/utils/helper';
import { Trash2, Edit, Download } from 'lucide-react';
import ConfirmationPopup from '@/createtasks/ConfirmationPopUp';
import FileSaver from 'file-saver';
import axiosInstance from '@/utils/axiosInstance';
import UserAvatar from '@/createtasks/UserAvatar';
import SearchBar from '@/createtasks/SearchBar';
import { UserContext } from '@/context/userContext';

const RoleBadge = ({ role, isSuperAdmin }) => {
  if (isSuperAdmin) {
    return (
      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full select-none bg-purple-600 text-white">
        Super Admin
      </span>
    );
  }

  let bgColor = '';
  let text = '';

  switch (role) {
    case 'admin':
      bgColor = 'bg-blue-600 text-white';
      text = 'Admin';
      break;
    case 'member':
      bgColor = 'bg-green-600 text-white';
      text = 'Member';
      break;
    default:
      bgColor = 'bg-gray-600 text-white';
      text = 'User';
  }

  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full select-none ${bgColor}`}>
      {text}
    </span>
  );
};

const ManageUsers = () => {
  const { user: currentUser, loading: userLoading } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchUsers = useCallback(
    async (search = '') => {
      if (userLoading) return;

      setLoading(true);

      try {
        if (!currentUser) {
          setUsers([]);
          setLoading(false);
          return;
        }

        let endpoint = '';
        const params = { search };

        if (currentUser.isSuperAdmin) {
          endpoint = API_ENDPOINTS.USERS.GET_ALL_USERS;
        } else if (currentUser.role === 'admin') {
          endpoint = API_ENDPOINTS.USERS.GET_ALL_USERS;
        } else {
          showError('Access denied');
          setUsers([]);
          setLoading(false);
          return;
        }

        const { data } = await axiosInstance.get(endpoint, { params });
        setUsers(data);
      } catch (err) {
        showError('Failed to load users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, userLoading]
  );

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchTerm.trim());
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, fetchUsers]);

  useEffect(() => {
    if (!userLoading) {
      fetchUsers();
    }
  }, [userLoading, fetchUsers]);

  const openDeleteConfirm = (id) => setDeleteUserId(id);
  const cancelDelete = () => setDeleteUserId(null);

  const handleDelete = async () => {
    if (!deleteUserId) return;

    const userToDelete = users.find((u) => u._id === deleteUserId);
    if (userToDelete?.isSuperAdmin) {
      showError('Cannot delete Super Admin');
      setDeleteUserId(null);
      return;
    }

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
      let exportEndpoint = '';

      if (currentUser?.isSuperAdmin) {
        exportEndpoint = API_ENDPOINTS.REPORTS.EXPORT_USERS_AND_TASKS;
      } else if (currentUser?.role === 'admin') {
        exportEndpoint = API_ENDPOINTS.REPORTS.EXPORT_ALL_USERS;
      } else {
        showError('Access denied');
        return;
      }

      const response = await axiosInstance.get(exportEndpoint, {
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

  if (loading || userLoading) {
    return (
      <div className="text-center mt-10 text-gray-700 dark:text-gray-300">
        Loading users...
      </div>
    );
  }

  const filteredUsers = users.filter((user) => !user.isSuperAdmin);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold dark:text-white text-gray-900">
          Manage Users
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <SearchBar
            placeholder="Search by name..."
            value={searchTerm}
            onSearch={setSearchTerm}
          />
          <button
            onClick={handleDownloadUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow transition"
          >
            <Download className="size-6 text-white" />
            Download Users
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
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
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-yellow-400">Pending</th>
                  <th className="px-4 py-3 text-blue-400">In Progress</th>
                  <th className="px-4 py-3 text-green-400">Completed</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition-colors text-sm"
                  >
                    <td className="px-4 py-3 flex h-20 items-center gap-4 whitespace-nowrap">
                      <UserAvatar src={user.profileImageUrl} name={user.name} />
                      <span className="font-semibold">{user.name}</span>
                    </td>
                    <td className="px-4 py-3 break-all">{user.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} isSuperAdmin={user.isSuperAdmin} />
                    </td>
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
                      {!user.isSuperAdmin && (
                        <button
                          onClick={() => openDeleteConfirm(user._id)}
                          disabled={deleting}
                          className="flex items-center justify-center p-2 rounded hover:bg-red-500/20"
                          aria-label="Delete user"
                        >
                          <Trash2
                            className={`w-5 h-5 ${deleting ? 'text-red-300' : 'text-red-500'}`}
                          />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col container mx-auto space-y-6 lg:hidden">
            {filteredUsers.map((user) => (
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
                  <div className="flex justify-center">
                    <RoleBadge role={user.role} isSuperAdmin={user.isSuperAdmin} />
                  </div>
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

                  {!user.isSuperAdmin && (
                    <button
                      onClick={() => openDeleteConfirm(user._id)}
                      disabled={deleting}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-md transition duration-200 ${
                        deleting
                          ? 'bg-red-300 text-white cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
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

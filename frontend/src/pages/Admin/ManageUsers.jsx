import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { showError, showSuccess } from '@/utils/helper';
import { Trash2, Edit, User,Download } from 'lucide-react';
import ConfirmationPopup from '@/createtasks/ConfirmationPopUp';
import FileSaver from 'file-saver';
import axiosInstance from '@/utils/axiosInstance';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS);
        setUsers(data);
      } catch {
        showError('Failed to load users');
      }
    };
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
    } catch {
      showError('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (user) => {
    // Navigate to admin user edit page with userId param
    navigate(`/admin/update-user/${user._id}`);
  };

  const Avatar = ({ src, alt }) =>
    src ? (
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 rounded-full object-cover border-2 border-white"
      />
    ) : (
      <span className="inline-flex w-10 h-10 rounded-full bg-gray-700 items-center justify-center">
        <User className="text-white w-8 h-8" />
      </span>
    );

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
    showError('Failed to download users');
  }
};


  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">
          Manage Users
        </h1>
        <button
          onClick={handleDownloadUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow transition"
        >
          <Download className="w-4 h-4" />
          Download Users
        </button>
      </div>


      {users.length === 0 ? (
        <p className="text-gray-400 italic text-center">No users yet.</p>
      ) : (
        <>
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
                      <Avatar src={user.profileImageUrl} alt={user.name} />
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

          <div className="flex flex-col container mx-auto space-y-6 lg:hidden">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-[#0f172a] text-white rounded-xl p-6 shadow-lg border border-gray-700"
              >
                <div className="flex justify-center">
                  <Avatar src={user.profileImageUrl} alt={user.name} />
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-md transition duration-200 ${deleting
                        ? 'bg-red-300 text-white cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
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

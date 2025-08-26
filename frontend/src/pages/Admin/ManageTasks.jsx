import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import toast from 'react-hot-toast';
import { Trash2, Pencil, Download } from 'lucide-react';
import FileSaver from 'file-saver';
import { useNavigate } from 'react-router-dom';
import ConfirmationPopup from '@/createtasks/ConfirmationPopUp';
import { showError, showSuccess } from '@/utils/helper';
import axiosInstance from '@/utils/axiosInstance';
import SearchBar from '@/createtasks/SearchBar';

const ManageTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTasks(searchTerm);
    }, 400); // debounce for 400ms

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchTasks = async (search = '') => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.TASKS.GET_ALL_TASKS, {
        params: { search },
      });

      const uniqueTasks = Array.from(
        new Map(data.tasks.map(task => [task._id, task])).values()
      );

      setTasks(uniqueTasks);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTaskId) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(API_ENDPOINTS.TASKS.DELETE_TASK(selectedTaskId));
      showSuccess('Task deleted');
      setShowDeletePopup(false);
      fetchTasks(searchTerm);
    } catch (error) {
      console.error(error);
      showError(error.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadTasks = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REPORTS.EXPORT_ALL_TASKS, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      FileSaver.saveAs(blob, 'tasks.xlsx');
      showSuccess('Tasks Excel downloaded');
    } catch (error) {
      console.error('Download tasks error:', error);
      showError('Failed to download tasks');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Manage Tasks
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <SearchBar
            placeholder="Search tasks by title"
            value={searchTerm}
            onSearch={(value) => setSearchTerm(value.trim())}
            className="w-full sm:w-auto"
          />
          <button
            onClick={handleDownloadTasks}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow transition"
          >
            <Download className="size-6 text-white" />
            Download Tasks
          </button>
        </div>
      </div>


      {loading ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-300">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No tasks found.</p>
      ) : (
        <div className="space-y-5">
          {tasks.map((task) => {
            const completedCount = task.todoChecklist.filter(todo => todo.completed).length;
            const total = task.todoChecklist.length;
            const percent = total > 0 ? (completedCount / total) * 100 : 0;

            return (
              <div
                key={task._id}
                className="bg-white dark:bg-gray-800 p-5 rounded shadow border dark:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {task.assignedTo.map((user) => (
                        <span
                          key={user._id}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                        >
                          {user.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/update-task/${task._id}`)}
                        title="Edit"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTaskId(task._id);
                          setShowDeletePopup(true);
                        }}
                        title="Delete"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <span
                      className={`text-xs font-medium capitalize px-2 py-1 rounded ${statusClass(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>

                    <div className="w-full h-2 bg-gray-300 rounded">
                      <div
                        className="h-full bg-blue-600 rounded"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {completedCount}/{total} todos
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationPopup
        isOpen={showDeletePopup}
        userName="this task"
        onCancel={() => setShowDeletePopup(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ManageTasks;

// Helper function for status styling
const statusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-200 text-yellow-800';
    case 'in-progress':
      return 'bg-blue-200 text-blue-800';
    case 'completed':
      return 'bg-green-200 text-green-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

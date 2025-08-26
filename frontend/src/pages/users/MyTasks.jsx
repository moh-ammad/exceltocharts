import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import SearchBar from '@/createtasks/SearchBar';
import axiosInstance from '@/utils/axiosInstance';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTasks(searchTerm);
    }, 400); // debounce

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
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Assigned Tasks
        </h1>
        <SearchBar
          placeholder="Search tasks by title"
          value={searchTerm}
          onSearch={(value) => setSearchTerm(value.trim())}
          className="w-full sm:w-auto"
        />
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
    </div>
  );
};

export default MyTasks;

// Utility function
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

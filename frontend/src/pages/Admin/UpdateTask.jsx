import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { UserContext } from '@/context/userContext';
import AttachmentList from '@/createtasks/AttachmentList';
// Updated import name here:
import UserSelection from '@/createtasks/UserSelection';
import { showError, showSuccess } from '@/utils/helper';
import TodoChecklist from '@/components/TodoCheckList';
import axiosInstance from '@/utils/axiosInstance';

const UpdateTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [todoChecklist, setTodoChecklist] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New state for users and modal
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTaskAndUsers = async () => {
      try {
        // Fetch task and all users in parallel
        const [taskRes, usersRes] = await Promise.all([
          axiosInstance.get(API_ENDPOINTS.TASKS.GET_TASK_BY_ID(taskId)),
          user.role === 'admin' ? axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS) : Promise.resolve({ data: [] }),
        ]);

        const data = taskRes.data;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPriority(data.priority || 'medium');
        setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : '');
        
        // ====== FIX: correctly parse todo dueDate ======
        setTodoChecklist(
          (data.todoChecklist || []).map((todo) => ({
            text: todo.text,
            completed: todo.completed || false,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : '',
          }))
        );
        // ==============================================

        setAttachments(data.attachments || []);
        setSelectedUsers(data.assignedTo || []);

        if (user.role === 'admin') {
          setUsers(usersRes.data);
        }
      } catch (error) {
        console.error('Failed to load task data', error);
        showError('Failed to load task data');
      } finally {
        setLoading(false);
      }
    };
    fetchTaskAndUsers();
  }, [taskId, user.role]);

  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.some((x) => x._id === u._id) ? prev.filter((x) => x._id !== u._id) : [...prev, u]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formattedDueDate = dueDate ? dueDate : null;

      const sanitizedChecklist = todoChecklist.map((todo) => ({
        text: todo.text,
        completed: todo.completed,
        // Send dueDate as null or ISO string
        dueDate: todo.dueDate ? todo.dueDate : undefined,
      }));

      const cleanAttachments = attachments.map((att) => {
        if (!att.name || !att.url) throw new Error('Each attachment must have name & url');
        return { name: att.name, url: att.url };
      });

      const payload = user.role === 'admin'
        ? {
            title,
            description,
            priority,
            dueDate: formattedDueDate,
            todoChecklist: sanitizedChecklist,
            attachments: cleanAttachments,
            assignedTo: selectedUsers.map((u) => u._id),
          }
        : {
            todoChecklist: sanitizedChecklist,
          };

      await axiosInstance.put(API_ENDPOINTS.TASKS.UPDATE_TASK(taskId), payload);

      showSuccess('Task updated successfully');
      navigate(user.role === 'admin' ? '/admin/tasks' : '/tasks');
    } catch (error) {
      showError(error.response?.data?.message || error.message || 'Failed to update task');
    }
  };

  if (loading) return <p className="p-6">Loading task...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white text-gray-900">Update Task</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={user.role !== 'admin'}
          required
          className={`w-full px-4 py-3 rounded-md border ${user.role === 'admin'
            ? 'border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500'
            : 'bg-gray-200 cursor-not-allowed'}`}
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={user.role !== 'admin'}
          rows={4}
          className={`w-full px-4 py-3 rounded-md border resize-none ${user.role === 'admin'
            ? 'border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500'
            : 'bg-gray-200 cursor-not-allowed'}`}
        ></textarea>

        <div className="flex gap-4">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={user.role !== 'admin'}
            className={`flex-1 px-4 py-3 rounded-md border ${user.role === 'admin'
              ? 'border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-200 cursor-not-allowed'}`}
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={user.role !== 'admin'}
            className={`flex-1 px-4 py-3 rounded-md border ${user.role === 'admin'
              ? 'border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-200 cursor-not-allowed'}`}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold dark:text-white text-gray-700">Todos</label>
          {/* Updated component name here */}
          <TodoChecklist 
            todos={todoChecklist} 
            setTodos={setTodoChecklist} 
            isEditable={user.role === 'admin'} 
            canEditText={user.role === 'admin'} 
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold dark:text-white text-gray-700">Attachments</label>
          <AttachmentList attachments={attachments} setAttachments={setAttachments} disabled={user.role !== 'admin'} />
        </div>

        {/* Assigned Users Section */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold dark:text-white text-gray-700">Assigned Users</label>
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition text-sm font-medium"
            >
              + Add/Remove Users
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUsers.map((u) => (
            <span
              key={u._id}
              className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {u.profileImageUrl ? (
                <img
                  src={u.profileImageUrl}
                  alt={u.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex w-6 h-6 rounded-full bg-gray-700 items-center justify-center text-xs font-semibold">
                  {u.name.charAt(0).toUpperCase()}
                </span>
              )}
              {u.name}
            </span>
          ))}
        </div>

        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
          Update Task
        </button>
      </form>

      {/* UserSelection Modal */}
      {showModal && (
        <UserSelection
          users={users}
          selectedUsers={selectedUsers}
          onToggleUser={toggleUser}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default UpdateTask;

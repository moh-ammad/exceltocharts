import { useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { toast } from 'react-hot-toast';
import UserSelection from '@/createtasks/UserSelection';
import AttachmentList from '@/createtasks/AttachmentList';
import TodoList from '@/createtasks/TodoList';
import { UserRoundPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '@/context/userContext';
import { showError, showSuccess } from '@/utils/helper';
import UserAvatar from '@/createtasks/UserAvatar';
import axiosInstance from '@/utils/axiosInstance';

const CreateTask = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [todoChecklist, setTodoChecklist] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS);
        setUsers(data);
      } catch (error) {
        console.error(error);
        showError('Error fetching users');
      }
    };
    fetchUsers();
  }, []);

  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.some((x) => x._id === u._id) ? prev.filter((x) => x._id !== u._id) : [...prev, u]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!['low', 'medium', 'high'].includes(priority)) {
      toast.error('Invalid priority selected');
      return;
    }
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }
    if (!selectedUsers.length) {
      toast.error('Please assign at least one user');
      return;
    }

    try {
      const sanitizedChecklist = todoChecklist.map((todo) => ({
        text: todo.text,
        completed: false,
        dueDate: todo.dueDate ? todo.dueDate : undefined,
      }));

      // Validate attachments: each must have name and url
      const cleanAttachments = attachments.map((att) => {
        if (!att.name || !att.url) throw new Error('Attachment must have name & URL');
        return { name: att.name, url: att.url };
      });

      const payload = {
        title,
        description,
        priority,
        dueDate,
        assignedTo: selectedUsers.map((u) => u._id),
        todoChecklist: sanitizedChecklist,
        attachments: cleanAttachments,
      };

      console.log('Create payload:', payload);
      await axiosInstance.post(API_ENDPOINTS.TASKS.CREATE_TASK, payload);

      showSuccess('Task created successfully');
      navigate(user.role === 'admin' ? '/admin/tasks' : '/tasks');

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setSelectedUsers([]);
      setTodoChecklist([]);
      setAttachments([]);
    } catch (error) {
      console.error('Create task error:', error);
      showError(error.response?.data?.message || error.message || 'Failed to create task');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto sm:px-4">
      <h1 className="text-3xl font-bold mb-8 dark:text-white text-gray-900">
        Create New Task
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-md border dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition"
        />

        <textarea
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-md border dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition resize-none"
        />

        <div className="flex gap-4">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex-1 px-4 py-3 rounded-md border dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="flex-1 px-4 py-3 rounded-md border dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold dark:text-white text-gray-700">Assigned Users</span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 focus:ring-2 focus:ring-blue-500 rounded transition"
          >
            <UserRoundPlus className="w-5 h-5" /> Add User
          </button>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedUsers.map((u) => (
              <div key={u._id} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <UserAvatar src={u.profileImageUrl} alt={u.name} />
                {u.name}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block mb-2 font-semibold dark:text-white text-gray-700">Todos</label>
          <TodoList todos={todoChecklist} setTodos={setTodoChecklist} />
        </div>

        <div>
          <label className="block mb-2 font-semibold dark:text-white text-gray-700">Attachments</label>
          <AttachmentList attachments={attachments} setAttachments={setAttachments} />
        </div>

        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
          Create Task
        </button>
      </form>

      {showModal && (
        <UserSelection users={users} selectedUsers={selectedUsers} onToggleUser={toggleUser} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default CreateTask;

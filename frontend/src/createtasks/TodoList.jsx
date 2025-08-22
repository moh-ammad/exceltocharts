import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const TodoList = ({ todos, setTodos }) => {
  const [newTodo, setNewTodo] = useState({ text: "", date: "" });
  const [error, setError] = useState("");

  const addTodo = () => {
    if (!newTodo.text.trim() || !newTodo.date) {
      setError("Todo and date cannot be empty.");
      return;
    }
    setTodos([...todos, newTodo]);
    setNewTodo({ text: "", date: "" });
    setError("");
  };

  const updateTodo = (index, field, value) => {
    const updated = [...todos];
    updated[index][field] = value;
    setTodos(updated);
  };

  const removeTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Enter todo"
          className="bg-gray-800 text-white px-3 py-2 rounded-md flex-1"
          value={newTodo.text}
          onChange={(e) => setNewTodo({ ...newTodo, text: e.target.value })}
        />
        <input
          type="date"
          className="bg-gray-800 text-white px-3 py-2 rounded-md"
          value={newTodo.date}
          onChange={(e) => setNewTodo({ ...newTodo, date: e.target.value })}
        />
        <button
          type="button"
          onClick={addTodo}
          disabled={!newTodo.text || !newTodo.date}
          className={`self-center sm:self-auto px-2 py-1 rounded ${
            newTodo.text && newTodo.date
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-600 text-gray-300 cursor-not-allowed"
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {todos.map((todo, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row gap-2 items-center"
        >
          <input
            type="text"
            value={todo.text}
            onChange={(e) => updateTodo(index, "text", e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-md flex-1"
          />
          <input
            type="date"
            value={todo.date}
            onChange={(e) => updateTodo(index, "date", e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-md"
          />
          <button type="button" onClick={() => removeTodo(index)}>
            <Trash2 className="text-red-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TodoList;


// Convert date string (dd-mm-yyyy or others) to yyyy-mm-dd format for date input
const toISODate = (dateStr) => {
  if (!dateStr) return "";
  
  // If dateStr already in ISO format (yyyy-mm-dd), just return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // Try to parse dd-mm-yyyy format
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (yyyy.length === 4) {
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
  }
  // fallback empty string if parsing fails
  return "";
};

const TodoChecklist = ({ todos, setTodos, isEditable = true, canEditText = true }) => {
  const handleTodoChange = (index, key, value) => {
    // Normalize date when user inputs it
    if (key === "dueDate") {
      value = toISODate(value);
    }

    setTodos((prev) =>
      prev.map((todo, i) => (i === index ? { ...todo, [key]: value } : todo))
    );
  };

  const addTodo = () => {
    if (!isEditable) return;
    setTodos((prev) => [
      ...prev,
      { text: "", completed: false, dueDate: "" },
    ]);
  };

  const removeTodo = (index) => {
    if (!isEditable) return;
    setTodos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {todos.map((todo, index) => (
        <div
          key={index}
          className={`flex items-center gap-2 p-2 rounded-md bg-gray-800 dark:bg-gray-700 ${
            todo.completed ? "opacity-60 line-through" : ""
          }`}
        >
          {/* Checkbox to mark todo done/undone */}
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() =>
              isEditable &&
              handleTodoChange(index, "completed", !todo.completed)
            }
            className="w-5 h-5 cursor-pointer"
            disabled={!isEditable}
            aria-label={`Mark todo ${todo.text} as completed`}
          />

          {/* Editable todo text */}
          <input
            type="text"
            value={todo.text}
            onChange={(e) =>
              canEditText && handleTodoChange(index, "text", e.target.value)
            }
            placeholder="Enter todo"
            disabled={!canEditText}
            className={`flex-1 px-3 py-2 rounded-md bg-gray-900 dark:bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !canEditText ? "cursor-not-allowed opacity-70" : ""
            }`}
            aria-label="Todo text"
          />

          {/* Due date input, with ISO formatted value */}
          <input
            type="date"
            value={toISODate(todo.dueDate)}
            onChange={(e) =>
              isEditable && handleTodoChange(index, "dueDate", e.target.value)
            }
            disabled={!isEditable}
            className={`px-2 py-2 rounded-md bg-gray-900 dark:bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !isEditable ? "cursor-not-allowed opacity-70" : ""
            }`}
            aria-label="Todo due date"
          />

          {/* Remove todo button */}
          {isEditable && (
            <button
              type="button"
              onClick={() => removeTodo(index)}
              className="text-red-500 hover:text-red-700 focus:outline-none"
              aria-label="Remove todo"
            >
              🗑️
            </button>
          )}
        </div>
      ))}

      {/* Add todo button */}
      {isEditable && (
        <button
          type="button"
          onClick={addTodo}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Add Todo
        </button>
      )}
    </div>
  );
};

export default TodoChecklist;

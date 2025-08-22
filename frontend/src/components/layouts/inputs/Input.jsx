import { useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

const Input = ({
  type,
  name,
  value,
  onChange,
  placeholder,
  label,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const isPasswordField = type === "password";

  return (
    <div>
      {label && <label className="input-label">{label}</label>}

      <div className="input-box relative">
        <input
          type={isPasswordField ? (showPassword ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input-field" // extra padding for icon space
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-5 text-blue-500" />
            ) : (
              <Eye className="size-5 text-blue-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const Select = ({ label, value, onChange, options, name }) => {
  return (
    <div className="flex flex-col gap-4 relative">
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="input-field appearance-none w-full px-2 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400 pr-10"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Dropdown icon */}
        <ChevronDown
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none size-6 text-blue-700"
          size={18}
        />
      </div>
    </div>
  );
};

export {
  Input,
  Select
};

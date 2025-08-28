import { Search, X } from 'lucide-react';
import { useState } from 'react';

const SearchBar = ({ placeholder = 'Search...', value, onSearch }) => {
  const [inputValue, setInputValue] = useState(value || '');

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const triggerSearch = () => {
    onSearch(inputValue.trim());
  };

  const clearSearch = () => {
    setInputValue('');
    onSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch(); // allow Enter to trigger search
    }
  };

  return (
    <div className="relative w-full sm:max-w-xs md:max-w-md lg:max-w-lg">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition duration-200"
      />

      {inputValue && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <button
        type="button"
        onClick={triggerSearch}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
        aria-label="Trigger search"
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SearchBar;

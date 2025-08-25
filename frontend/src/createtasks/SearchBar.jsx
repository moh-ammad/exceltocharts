import { Search, X } from 'lucide-react';

const SearchBar = ({ placeholder = 'Search...', value, onSearch }) => {
  // Remove internal state

  const handleChange = (e) => {
    const val = e.target.value;
    onSearch(val);
  };

  const clearSearch = () => {
    onSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="relative w-full sm:max-w-xs md:max-w-md lg:max-w-lg">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      <input
        type="text"
        value={value}  // controlled input from parent
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition duration-200"
      />
      {value && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;

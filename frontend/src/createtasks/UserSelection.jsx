import React, { useEffect, useRef } from 'react';
import { CheckSquare, Square, User as UserIcon } from 'lucide-react';

const UserSelection = ({ users, selectedUsers, onToggleUser, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (modalRef.current) {
      const firstCheckbox = modalRef.current.querySelector('input[type="checkbox"]');
      firstCheckbox?.focus();
    }
  }, []);

  const Avatar = ({ src, alt }) => (
    src ? (
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 rounded-full object-cover"
        loading="lazy"
        decoding="async"
      />
    ) : (
      <span className="inline-flex w-10 h-10 rounded-full bg-gray-700 items-center justify-center">
        <UserIcon className="text-white w-5 h-5" />
      </span>
    )
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="user-selection-title"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-md p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="user-selection-title" className="text-white font-semibold text-lg" tabIndex={0}>
            Select Users
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label="Close modal"
            type="button"
          >
            &#x2715;
          </button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto" role="list">
          {users.length === 0 ? (
            <p className="text-gray-400 text-center">No users available.</p>
          ) : (
            users.map((user) => {
              const isSelected = selectedUsers.some((u) => u._id === user._id);
              return (
                <label
                  key={user._id}
                  htmlFor={`user-checkbox-${user._id}`}
                  className="flex items-center gap-3 bg-gray-800 p-3 rounded-md cursor-pointer hover:bg-gray-700 transition"
                  role="listitem"
                >
                  <input
                    id={`user-checkbox-${user._id}`}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleUser(user)}
                    className="hidden"
                  />
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-500" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  )}

                  <Avatar src={user.profileImageUrl} alt={user.name} />

                  <div className="flex flex-col text-white">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-gray-400 text-sm">{user.email}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSelection;

import { memo, useState } from 'react';
import { User } from 'lucide-react'; // Import the icon you prefer

const UserAvatar = memo(({ src, name = 'User avatar' }) => {
  const isValidSrc = src && typeof src === 'string' && src.trim() !== '';

  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center text-white"
        aria-label={name}
        role="img"
      >
        <User className="w-6 h-6 text-gray-400" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center text-white"
      aria-label={name}
      role="img"
    >
      {isValidSrc ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : (
        <User className="w-6 h-6 text-gray-400" aria-hidden="true" />
      )}
    </div>
  );
});

export default UserAvatar;

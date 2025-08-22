import { memo } from 'react';
import { UserRound } from 'lucide-react';

const UserAvatar = memo(({ src, name = "User avatar" }) => {
  return (
    <div
      className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center text-white"
      aria-label={name}
      role="img"
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <UserRound className="w-6 h-6 text-gray-400" aria-hidden="true" />
      )}
    </div>
  );
});

export default UserAvatar;

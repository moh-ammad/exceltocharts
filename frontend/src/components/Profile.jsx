import { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.AUTH.GET_PROFILE);
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) {
    return <div className="text-center mt-10 text-gray-700 dark:text-gray-300">Loading profile...</div>;
  }

  const getRoleBadgeColor = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-white';
      case 'member':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-white';
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-14 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-10 text-center transition-all">
      <div className="flex flex-col items-center justify-center space-y-6">
        {profile.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt="Profile"
            className="w-36 h-36 md:w-40 md:h-40 rounded-full border-4 border-blue-500 object-cover shadow-md"
          />
        ) : (
          <div className="w-36 h-36 md:w-40 md:h-40 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full border-4 border-blue-500 shadow-md">
            <UserIcon size={60} />
          </div>
        )}

        <div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">{profile.email}</p>

          <span
            className={`inline-block mt-3 px-4 py-1.5 text-sm font-semibold rounded-full ${getRoleBadgeColor(
              profile.role
            )}`}
          >
            {profile.role}
          </span>
        </div>

        <button
          onClick={() => navigate('/update-profile')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default Profile;

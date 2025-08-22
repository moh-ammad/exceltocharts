import { useRef, useState, useEffect } from "react";
import { Upload, Trash2, User } from "lucide-react";

const ProfilePhotoSelector = ({
  profilePic,
  setProfilePic,
  existingImageUrl,
  clearExistingImage,
}) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let objectUrl;
    if (profilePic instanceof File) {
      // Generate blob URL
      objectUrl = URL.createObjectURL(profilePic);
      setPreviewUrl(objectUrl);
    } else if (existingImageUrl) {
      setPreviewUrl(existingImageUrl);
    } else {
      setPreviewUrl(null);
    }

    return () => {
      // Revoke old blob URL to avoid memory leaks
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profilePic, existingImageUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setProfilePic(file);
      if (clearExistingImage) clearExistingImage();
    }
    // Reset input to allow re-selecting the same file
    e.target.value = null;
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setProfilePic(null);
    setPreviewUrl(null);
    if (clearExistingImage) clearExistingImage();
  };

  const onFileChoose = () => inputRef.current?.click();

  return (
    <div
      onClick={onFileChoose}
      className="relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-blue-100/50 border border-gray-300 cursor-pointer hover:border-blue-500 transition"
      aria-label="Profile photo selector"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onFileChoose()}
    >
      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Profile Preview"
            className="object-cover w-full h-full"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute bottom-3 right-3 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 z-20 border-2 border-white dark:border-gray-800"
            aria-label="Remove profile picture"
          >
            <Trash2 size={16} />
          </button>
        </>
      ) : (
        <>
          <User size={56} className="text-gray-400 mb-3" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileChoose();
            }}
            className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 z-20 border-2 border-white dark:border-gray-800"
            aria-label="Upload profile picture"
          >
            <Upload size={16} />
          </button>
        </>
      )}
      <input
        type="file"
        name="image"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhotoSelector;

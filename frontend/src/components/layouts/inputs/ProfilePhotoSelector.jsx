import { useRef, useState, useEffect } from "react";
import { Upload, Trash2, User } from "lucide-react";
import { showError } from "@/utils/helper";

const ProfilePhotoSelector = ({
  profilePic,
  setProfilePic,
  existingImageUrl,
  clearExistingImage,
}) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let objectUrl;

    setImageError(false);

    if (profilePic instanceof File) {
      objectUrl = URL.createObjectURL(profilePic);
      setPreviewUrl(objectUrl);
      console.log("Using local file previewUrl:", objectUrl);
    } else if (existingImageUrl) {
      setPreviewUrl(existingImageUrl);
      console.log("Using existingImageUrl previewUrl:", existingImageUrl);
    } else {
      setPreviewUrl(null);
      console.log("No previewUrl set");
    }

    // Cleanup: revoke only URLs created via createObjectURL
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [profilePic, existingImageUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Only image files are allowed");
      e.target.value = null;
      return;
    }

    setProfilePic(file);
    if (clearExistingImage) clearExistingImage();
    e.target.value = null; // reset input to allow same file upload again
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setProfilePic(null);
    setImageError(false);
    setPreviewUrl(null);
    if (clearExistingImage) clearExistingImage();
  };

  const onFileChoose = () => inputRef.current?.click();

  const shouldShowFallback = !previewUrl || imageError;

  return (
    <div
      onClick={shouldShowFallback ? onFileChoose : undefined}
      className="relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-blue-100/50 border border-gray-300 cursor-pointer hover:border-blue-500 transition"
      aria-label="Profile photo selector"
      aria-pressed={!!previewUrl}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => shouldShowFallback && e.key === "Enter" && onFileChoose()}
    >
      {/* If image is available and not errored */}
      {!shouldShowFallback ? (
        <>
          <img
            src={previewUrl}
            alt="Profile Preview"
            className="object-cover w-full h-full"
            onError={() => {
              setImageError(true);
              console.log("Failed to load image, fallback used");
            }}
          />

          {/* Show trash button only if image is present */}
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
          {/* Fallback user icon */}
          <User size={56} className="text-gray-400 dark:text-gray-600 mb-3" />

          {/* Upload button only shown when no image */}
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
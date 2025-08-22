import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input, Select } from "@/components/layouts/inputs/Input";
import ProfilePhotoSelector from "@/components/layouts/inputs/ProfilePhotoSelector";
import {
  validateEmail,
  validatePassword,
  showError,
  showSuccess,
} from "@/utils/helper";
import { API_ENDPOINTS } from "@/utils/apisPaths";
import axiosInstance from "@/utils/axiosInstance";

const UpdateUser = () => {
  const { userId } = useParams(); // Admin editing another user
  const isAdminEditing = Boolean(userId);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",      // Changed from fullName to name to match backend
    email: "",
    password: "",
    role: "member",
    adminKey: "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = isAdminEditing
          ? await axiosInstance.get(API_ENDPOINTS.USERS.GET_USER_BY_ID(userId))
          : await axiosInstance.get(API_ENDPOINTS.AUTH.GET_PROFILE);

        const data = res.data;

        setFormData({
          name: data.name || "",
          email: data.email || "",
          password: "", // always empty on load for security
          role: data.role || "member",
          adminKey: "",
        });
        setExistingImageUrl(data.profileImageUrl || null);
        setProfilePic(null); // reset local image on load
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        showError("Failed to load profile");
      }
    };

    fetchProfile();
  }, [userId, isAdminEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear adminKey if role changed from admin to something else
    if (name === "role" && value !== "admin") {
      setFormData((prev) => ({ ...prev, adminKey: "" }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email address.";
    if (formData.password && !validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (formData.role === "admin" && !formData.adminKey.trim()) {
      newErrors.adminKey = "Admin key is required to assign admin role.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);

      if (formData.password) {
        formDataToSend.append("password", formData.password);
      }

      formDataToSend.append("role", formData.role);

      if (formData.role === "admin") {
        formDataToSend.append("adminKey", formData.adminKey);
      }

      // Upload new profile picture if changed
      if (profilePic) {
        formDataToSend.append("image", profilePic);
      } else if (!existingImageUrl) {
        // User removed existing image without uploading new one
        // Backend needs to handle empty image to remove
        formDataToSend.append("image", "");
      }

      if (isAdminEditing) {
        await axiosInstance.put(
          API_ENDPOINTS.USERS.UPDATE_USER(userId),
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        showSuccess("User updated successfully!");
        navigate("/admin/users");
      } else {
        await axiosInstance.put(
          API_ENDPOINTS.AUTH.UPDATE_PROFILE,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        showSuccess("Profile updated successfully!");
        navigate("/profile");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-900 shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        {isAdminEditing ? "Update User Profile" : "Update Your Profile"}
      </h2>

      <form onSubmit={handleUpdate} encType="multipart/form-data" noValidate>
        <div className="flex justify-center mb-6">
          <ProfilePhotoSelector
            profilePic={profilePic}
            setProfilePic={setProfilePic}
            existingImageUrl={existingImageUrl}
            clearExistingImage={() => setExistingImageUrl(null)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            label="New Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave empty to keep current password"
            error={errors.password}
          />
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: "member", label: "Member" },
              { value: "admin", label: "Admin" },
            ]}
            error={errors.role}
          />
          {formData.role === "admin" && (
            <div className="md:col-span-2">
              <Input
                label="Admin Key"
                name="adminKey"
                type="password"
                value={formData.adminKey}
                onChange={handleChange}
                error={errors.adminKey}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-8 disabled:opacity-50"
        >
          {loading
            ? isAdminEditing
              ? "Updating User..."
              : "Updating..."
            : isAdminEditing
            ? "Update User"
            : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default UpdateUser;

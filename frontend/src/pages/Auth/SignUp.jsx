import { useState } from "react";
import AuthLayout from "@/components/layouts/AuthLayout";
import { Input, Select } from "@/components/layouts/inputs/Input";
import ProfilePhotoSelector from "@/components/layouts/inputs/ProfilePhotoSelector";
import {
  showError,
  showSuccess,
  validateEmail,
  validatePassword,
} from "@/utils/helper";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { API_ENDPOINTS } from "@/utils/apisPaths";

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "member",
    adminKey: "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email address.";
    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (!formData.role) newErrors.role = "Role is required.";
    if (formData.role === "admin" && !formData.adminKey.trim()) {
      newErrors.adminKey = "Admin key is required for admin registration.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("role", formData.role);
      if (formData.role === "admin") {
        formDataToSend.append("adminKey", formData.adminKey);
      }
      if (profilePic) {
        formDataToSend.append("image", profilePic);
      }

      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response.data);
      showSuccess("Registration successful!");
      localStorage.setItem("profilePic", response.data.profilePic || "");
      navigate("/login");
    } catch (error) {
      showError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-2xl w-full mx-auto bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Create An Account
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Join us today by entering your details below
        </p>

        <form onSubmit={handleSignUp} encType="multipart/form-data" noValidate>
          <div className="flex justify-center mb-8">
            <ProfilePhotoSelector profilePic={profilePic} setProfilePic={setProfilePic} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: "member", label: "Member" },
                { value: "admin", label: "Admin" },
              ]}
            />
            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}

            {formData.role === "admin" && (
              <div className="md:col-span-2">
                <Input
                  label="Admin Key"
                  name="adminKey"
                  type="password"
                  autoComplete="off"
                  value={formData.adminKey}
                  onChange={handleChange}
                  placeholder="Enter admin key"
                />
                {errors.adminKey && (
                  <p className="text-red-500 text-sm">{errors.adminKey}</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="text-sm text-center mt-4 text-gray-700 dark:text-gray-300">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-500 underline cursor-pointer"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;

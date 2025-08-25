import AuthLayout from '@/components/layouts/AuthLayout';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/layouts/inputs/Input';
import {
  validateEmail,
  validatePassword,
  showError,
  showSuccess,
} from '@/utils/helper';
import { UserContext } from '@/context/userContext';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import axiosInstance from '@/utils/axiosInstance';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!validateEmail(formData.email)) newErrors.email = 'Invalid email.';
    if (!validatePassword(formData.password)) newErrors.password = 'Min 6 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, formData);
      const { token, user } = data || {};
      if (!user) throw new Error('Missing user data');
      updateUser(token ? { ...user, token } : user);
      showSuccess('Login successful!');
      navigate(user.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/user-dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed.';
      setErrors({ general: msg });
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-lg w-full mx-auto">
        <h3 className="text-2xl font-semibold mb-2">Welcome Back</h3>
        <p className="text-sm mb-8">Please enter your details to log in.</p>
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="jimmy@gmail.com"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}
          <button type="submit" className="btn-primary mt-4" disabled={loading}>
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
          <p className="text-sm mt-4 text-center">
            Don't have an account?{' '}
            <span onClick={() => navigate('/signUp')} className="text-blue-500 underline cursor-pointer">
              Sign Up
            </span>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;

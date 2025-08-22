import React, { useEffect, useState } from 'react';
import Visualize2d from './Visualize2d';
import Visualize3d from './Visualize3d';
import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/utils/apisPaths';

const StatusBadge = ({ label, value, color }) => {
  const colorMap = {
    yellow: 'border-l-4 border-yellow-400',
    blue: 'border-l-4 border-blue-500',
    green: 'border-l-4 border-green-500',
  };

  return (
    <div className={`flex justify-between items-center bg-slate-800 text-white px-4 py-3 rounded-md shadow ${colorMap[color]}`}>
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-slate-800 p-5 rounded-md text-center shadow hover:shadow-lg transition duration-200">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalTasks: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.TASKS.GET_DASHBOARD_DATA);
      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Visualization Dashboard</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Users" value={dashboardData.totalUsers} />
        <StatCard label="Total Tasks" value={dashboardData.totalTasks} />
        <StatusBadge label="Pending" value={dashboardData.pending} color="yellow" />
        <StatusBadge label="In Progress" value={dashboardData.inProgress} color="blue" />
        <StatusBadge label="Completed" value={dashboardData.completed} color="green" />
      </div>

      {/* Charts Section */}
      <div className="flex flex-wrap gap-6 justify-center">
        <div className="w-full max-w-3xl bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="text-xl font-semibold text-blue-400 text-center mb-3">Visualize2D Dashboard</h3>
          <Visualize2d />
        </div>
        <div className="w-full max-w-3xl bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="text-xl font-semibold text-blue-400 text-center mb-3">Visualize3D Dashboard</h3>
          <Visualize3d />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

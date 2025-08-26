import React, { useEffect, useState, useRef } from 'react';
import styles from '@/visualize/visualize2d.module.css';
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import html2canvas from 'html2canvas';
import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import CustomTooltip from '@/createtasks/CustomTooltip';
import { showError, showSuccess } from '@/utils/helper';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Visualize2d = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [statusSummary, setStatusSummary] = useState([]);
  const [prioritySummary, setPrioritySummary] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS);
        const tasksRes = await axiosInstance.get(API_ENDPOINTS.TASKS.GET_ALL_TASKS);
        const dashboardRes = await axiosInstance.get(API_ENDPOINTS.TASKS.GET_DASHBOARD_DATA);

        // Filter users to only members (exclude admin, superadmin)
        const filteredMembers = (Array.isArray(usersRes.data) ? usersRes.data : []).filter(user =>
          user.role === 'member'
        );

        setUsers(filteredMembers);
        setTasks(Array.isArray(tasksRes.data?.tasks) ? tasksRes.data.tasks : []);
        setStatusSummary(Array.isArray(dashboardRes.data?.statusSummary) ? dashboardRes.data.statusSummary : []);
        setPrioritySummary(Array.isArray(dashboardRes.data?.prioritySummary) ? dashboardRes.data.prioritySummary : []);
      } catch (error) {
        console.error("Dashboard load error:", error);
        setUsers([]);
        setTasks([]);
        setStatusSummary([]);
        setPrioritySummary([]);
      }
    };

    fetchData();
  }, []);


  const getUsersTaskCount = () => {
    const countMap = {};
    users.forEach(user => {
      countMap[user._id] = { name: user.name || 'User', tasks: 0 };
    });

    tasks.forEach(task => {
      if (Array.isArray(task.assignedTo)) {
        task.assignedTo.forEach(user => {
          if (countMap[user._id]) {
            countMap[user._id].tasks++;
          }
        });
      }
    });

    return Object.values(countMap);
  };


  const getPriorityData = () => {
    return prioritySummary.map(({ _id, count }) => ({
      name: _id,
      value: count
    }));
  };

  const getStatusData = () => {
    return statusSummary.map(({ _id, count }) => ({
      name: _id,
      value: count
    }));
  };

  const handleDownload = async (format = 'png') => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#1f2937',
        useCORS: true,
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `dashboard.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();

      showSuccess('Dashboard downloaded successfully!');
    } catch (err) {
      console.error('Download failed:', err);
      showError('Failed to download chart. Try again.');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Visualize2d Dashboard</h2>

      <div ref={chartRef} className={styles.chartWrapper}>
        {/* Bar Chart - Tasks by User */}
        <div className={`${styles.card} ${styles.chartContainer}`}>
          <h4 className={styles.cardTitle}>Tasks by User</h4>
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={getUsersTaskCount()}>
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 14 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 14 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#9ca3af' }}
                formatter={(val) => <span className={styles.legendText}>{val}</span>}
              />
              <Bar dataKey="tasks" fill={COLORS[0]} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Tasks by Status */}
        <div className={`${styles.card} ${styles.chartContainer}`}>
          <h4 className={styles.cardTitle}>Tasks by Status</h4>
          <ResponsiveContainer width="99%" height="100%">
            <PieChart>
              {(() => {
                const pieData = getStatusData();
                const hasData = pieData.some((item) => item.value > 0);

                return hasData ? (
                  <>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={false} // 🔥 Removed label to prevent overlap
                      labelLine={false}
                      isAnimationActive
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ color: '#9ca3af' }}
                      formatter={(val) => <span className={styles.legendText}>{val}</span>}
                    />
                  </>
                ) : (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ccc"
                    fontSize={14}
                  >
                    No data available
                  </text>
                );
              })()}
            </PieChart>

          </ResponsiveContainer>
        </div>

        {/* Line Chart - Tasks by Priority */}
        <div className={`${styles.card} ${styles.chartContainer}`}>
          <h4 className={styles.cardTitle}>Tasks by Priority</h4>
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={getPriorityData()}>
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 14 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 14 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#9ca3af' }}
                formatter={(val) => <span className={styles.legendText}>{val}</span>}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS[1]}
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={() => handleDownload('png')} className={`${styles.button} ${styles.btnIndigo}`}>
          Download PNG
        </button>
        <button onClick={() => handleDownload('jpeg')} className={`${styles.button} ${styles.btnGreen}`}>
          Download JPEG
        </button>
        <button onClick={() => handleDownload('webp')} className={`${styles.button} ${styles.btnYellow}`}>
          Download WEBP
        </button>
      </div>
    </div>
  );
};

export default Visualize2d;

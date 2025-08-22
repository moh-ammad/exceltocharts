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
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS);
        const tasksRes = await axiosInstance.get(API_ENDPOINTS.TASKS.GET_ALL_TASKS);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      } catch {
        setUsers([]);
        setTasks([]);
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
      if (task.createdBy && countMap[task.createdBy]) {
        countMap[task.createdBy].tasks++;
      }
    });
    return Object.values(countMap);
  };

  const getPriorityCount = () => {
    const priorityCount = { low: 0, medium: 0, high: 0 };
    tasks.forEach(task => {
      priorityCount[task.priority] = (priorityCount[task.priority] || 0) + 1;
    });
    return Object.entries(priorityCount).map(([name, value]) => ({ name, value }));
  };

  const getStatusCount = () => {
    const statusCount = { pending: 0, 'in-progress': 0, completed: 0 };
    tasks.forEach(task => {
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
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
                formatter={val => <span className={styles.legendText}>{val}</span>}
              />
              <Bar dataKey="tasks" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Tasks by Status */}
        <div className={`${styles.card} ${styles.chartContainer}`}>
          <h4 className={styles.cardTitle}>Tasks by Status</h4>
          <ResponsiveContainer width="99%" height="100%">
            <PieChart>
              {(() => {
                const statusData = getStatusCount();
                const hasData = statusData.some(item => item.value > 0);

                const pieData = hasData
                  ? statusData
                  : [
                      { name: 'Pending', value: 1 },
                      { name: 'In Progress', value: 1 },
                      { name: 'Completed', value: 1 },
                    ];

                return (
                  <>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        hasData ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                      }
                      labelLine={false}
                      isAnimationActive={hasData}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={hasData ? COLORS[index % COLORS.length] : '#374151'}
                        />
                      ))}
                    </Pie>
                    {hasData ? (
                      <>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{ color: '#9ca3af' }}
                          formatter={val => <span className={styles.legendText}>{val}</span>}
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
                        Loading...
                      </text>
                    )}
                  </>
                );
              })()}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Tasks by Priority */}
        <div className={`${styles.card} ${styles.chartContainer}`}>
          <h4 className={styles.cardTitle}>Tasks by Priority</h4>
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={getPriorityCount()}>
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 14 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 14 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#9ca3af' }}
                formatter={val => <span className={styles.legendText}>{val}</span>}
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

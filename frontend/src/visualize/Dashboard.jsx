import React, { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';

import Visualize2d from './Visualize2d';
import Visualize3d from './Visualize3d';
import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/utils/apisPaths';

import styles from './dashboard.module.css';

const StatusBadge = ({ label, value, color }) => {
  return (
    <div className={`${styles.statusBadge} ${styles[color]}`}>
      <span className={styles.statusLabel}>{label}</span>
      <span className={styles.statusValue}>{value}</span>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className={styles.statCard}>
    <div className={styles.statLabel}>{label}</div>
    <div className={styles.statValue}>{value}</div>
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard task data (status counts, etc)
      const { data: taskData } = await axiosInstance.get(API_ENDPOINTS.TASKS.GET_DASHBOARD_DATA);

      // Fetch all users to get totalUsers count
      const { data: users } = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS);

      // Calculate totalTasks by summing all statuses
      const totalTasks =
        taskData.statusSummary.reduce((acc, item) => acc + item.count, 0) + (taskData.completed || 0);

      // Extract counts safely from taskData.statusSummary
      const pendingCount = taskData.statusSummary.find(item => item._id === 'pending')?.count || 0;
      const inProgressCount = taskData.statusSummary.find(item => item._id === 'in-progress')?.count || 0;
      const completedCount = taskData.statusSummary.find(item => item._id === 'completed')?.count || 0;

      setDashboardData({
        totalUsers: users.length,
        totalTasks,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const pngImage = await pdfDoc.embedPng(imgData);
    const { width, height } = page.getSize();

    const scale = Math.min(width / canvas.width, height / canvas.height);
    const imgWidth = canvas.width * scale;
    const imgHeight = canvas.height * scale;

    page.drawImage(pngImage, {
      x: (width - imgWidth) / 2,
      y: (height - imgHeight) / 2,
      width: imgWidth,
      height: imgHeight,
    });

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dashboard.pdf';
    link.click();
  };

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Visualization Dashboard</h1>
        <button className={styles.downloadButton} onClick={downloadPDF}>
          Download Dashboard as PDF
        </button>
      </header>

      <div id="dashboard-content">
        <section className={styles.statsSection}>
          <StatCard label="Total Users" value={dashboardData.totalUsers} />
          <StatCard label="Total Tasks" value={dashboardData.totalTasks} />
          <StatusBadge label="Pending" value={dashboardData.pending} color="yellow" />
          <StatusBadge label="In Progress" value={dashboardData.inProgress} color="blue" />
          <StatusBadge label="Completed" value={dashboardData.completed} color="green" />
        </section>

        <section className={styles.chartsSection}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Visualize2D Dashboard</h3>
            <Visualize2d />
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Visualize3D Dashboard</h3>
            <Visualize3d />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

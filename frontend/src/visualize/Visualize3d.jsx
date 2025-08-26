import React, { useEffect, useState, useRef } from 'react';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import html2canvas from 'html2canvas';
import axiosInstance from '@/utils/axiosInstance';
import styles from '@/visualize/visualize3d.module.css';
import { showError, showSuccess } from '@/utils/helper';
import { API_ENDPOINTS } from '@/utils/apisPaths';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// 3D Bar component
const Bar = ({ position, height, color, label, onHover, onLeave }) => (
  <mesh
    position={position}
    onPointerOver={e => {
      e.stopPropagation();
      onHover({ label, position: [e.clientX, e.clientY] });
    }}
    onPointerOut={e => {
      e.stopPropagation();
      onLeave();
    }}
  >
    <boxGeometry args={[1, height, 1]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

// 3D Pie slice component
const PieSlice = ({ startAngle, endAngle, radius, height, color, label, position, onHover, onLeave }) => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, radius, startAngle, endAngle, false);
  shape.lineTo(0, 0);

  const extrudeSettings = { depth: height, bevelEnabled: false };

  return (
    <mesh
      position={position}
      onPointerOver={e => {
        e.stopPropagation();
        onHover({ label, position: [e.clientX, e.clientY] });
      }}
      onPointerOut={e => {
        e.stopPropagation();
        onLeave();
      }}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// 3D Point component for line chart
const Point = ({ position, color, label, onHover, onLeave }) => (
  <mesh
    position={position}
    onPointerOver={e => {
      e.stopPropagation();
      onHover({ label, position: [e.clientX, e.clientY] });
    }}
    onPointerOut={e => {
      e.stopPropagation();
      onLeave();
    }}
  >
    <sphereGeometry args={[0.15, 16, 16]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

// 3D Line component
const Line = ({ points, color }) => {
  const geometry = React.useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array(points.flat());
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geom;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial attach="material" color={color} />
    </line>
  );
};

const Visualize3d = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const chartRef = useRef(null);
  const [tooltipData, setTooltipData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, tasksRes, dashboardRes] = await Promise.all([
          axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS),
          axiosInstance.get(API_ENDPOINTS.TASKS.GET_ALL_TASKS),
          axiosInstance.get(API_ENDPOINTS.TASKS.GET_DASHBOARD_DATA),
        ]);

        // Filter users to only members (exclude admin/superadmin)
        const membersOnly = (Array.isArray(usersRes.data) ? usersRes.data : []).filter(user => {
          return !user.isSuperAdmin && user.role !== 'admin';
        });

        setUsers(membersOnly);
        setTasks(Array.isArray(tasksRes.data.tasks) ? tasksRes.data.tasks : []);
        setDashboardData(dashboardRes.data || null);
      } catch (e) {
        console.error('Failed to fetch data:', e);
        showError('Failed to load data. Please try again later.');
        setUsers([]);
        setTasks([]);
        setDashboardData(null);
      }
    }
    fetchData();
  }, []);


  // Prepare data for charts
  const userTaskCounts = users.map(user => {
  const assignedCount = tasks.filter(task =>
    Array.isArray(task.assignedTo) &&
    task.assignedTo.some(assignee => assignee._id === user._id)
  ).length;

  return {
    id: user._id,
    name: user.name || 'User',
    count: assignedCount,
  };
});


  const maxUserCount = Math.max(...userTaskCounts.map(u => u.count), 1);

  const pieData = dashboardData?.statusSummary?.length
    ? dashboardData.statusSummary.map(({ _id, count }) => ({ name: _id, value: count }))
    : [
      { name: 'pending', value: 1 },
      { name: 'in-progress', value: 1 },
      { name: 'completed', value: 1 },
    ];
  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0);

  const lineData = dashboardData?.prioritySummary?.length
    ? dashboardData.prioritySummary.map(({ _id, count }) => ({ name: _id, value: count }))
    : [
      { name: 'low', value: 1 },
      { name: 'medium', value: 1 },
      { name: 'high', value: 1 },
    ];
  const maxPriority = Math.max(...lineData.map(d => d.value), 1);

  // Download function
  const handleDownload = async (format = 'png') => {
    if (!chartRef.current) return;
    try {
      const container = chartRef.current;
      const rect = container.getBoundingClientRect();
      const scale = 2;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = Math.round(rect.width * scale);
      exportCanvas.height = Math.round(rect.height * scale);
      const ctx = exportCanvas.getContext('2d');
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      let domCanvas = null;
      try {
        const clone = container.cloneNode(true);
        clone.querySelectorAll && clone.querySelectorAll('canvas').forEach(n => n.remove());
        clone.style.position = 'absolute';
        clone.style.left = '-99999px';
        document.body.appendChild(clone);
        domCanvas = await html2canvas(clone, { backgroundColor: null, useCORS: true, scale });
        document.body.removeChild(clone);
      } catch (e) {
        console.warn('html2canvas overlay capture failed:', e);
      }

      if (domCanvas) {
        ctx.drawImage(domCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
      }

      const canvases = Array.from(container.querySelectorAll('canvas'));
      for (const c of canvases) {
        const cRect = c.getBoundingClientRect();
        const x = Math.round((cRect.left - rect.left) * scale);
        const y = Math.round((cRect.top - rect.top) * scale);
        const w = Math.round(cRect.width * scale);
        const h = Math.round(cRect.height * scale);

        const dataUrl = c.toDataURL(`image/${format}`);
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x, y, w, h);
            resolve();
          };
          img.onerror = reject;
          img.src = dataUrl;
        });
      }

      const link = document.createElement('a');
      link.download = `dashboard3d.${format}`;
      link.href = exportCanvas.toDataURL(`image/${format}`);
      link.click();
      showSuccess('3D Dashboard downloaded!');
    } catch (err) {
      console.error(err);
      showError('Download failed. Please try again.');
    }
  };

  // Tooltip style - position with small offset so it doesn't block cursor
  const tooltipStyle = {
    position: 'fixed',
    left: tooltipData ? tooltipData.position[0] + 12 : 0,
    top: tooltipData ? tooltipData.position[1] + 12 : 0,
    pointerEvents: 'none',
    background: 'rgba(55, 65, 81, 0.9)',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    zIndex: 1000,
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Visualize3d Dashboard</h2>

      <div className={styles.chartsContainer} ref={chartRef}>
        {/* Bar Chart */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>Tasks by User (3D Bar)</h4>
          <Canvas camera={{ position: [0, 10, 15], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
            {/* lights and controls */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[0, 10, 5]} intensity={0.8} />
            <OrbitControls />
            {/* ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            {/* bars */}
            {userTaskCounts.map(({ id, name, count }, i) => (
              <Bar
                key={id}
                position={[i * 2 - userTaskCounts.length, (count / maxUserCount) * 5 / 2, 0]}
                height={(count / maxUserCount) * 5 + 0.1}
                color={COLORS[i % COLORS.length]}
                label={`${name}: ${count} tasks`}
                onHover={setTooltipData}
                onLeave={() => setTooltipData(null)}
              />
            ))}
          </Canvas>
        </div>

        {/* Pie Chart */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>Tasks Status Distribution (3D Pie)</h4>
          <Canvas camera={{ position: [0, 10, 12], fov: 40 }} gl={{ preserveDrawingBuffer: true }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 10, 10]} intensity={0.8} />
            <OrbitControls />
            {/* pie slices */}
            {(() => {
              let startAngle = 0;
              return pieData.map(({ name, value }, i) => {
                const sliceAngle = (value / totalPie) * Math.PI * 2;
                const slice = (
                  <PieSlice
                    key={name}
                    startAngle={startAngle}
                    endAngle={startAngle + sliceAngle}
                    radius={4}
                    height={2}
                    color={COLORS[i % COLORS.length]}
                    label={`${name}: ${value} tasks`}
                    position={[0, 0, 0]}
                    onHover={setTooltipData}
                    onLeave={() => setTooltipData(null)}
                  />
                );
                startAngle += sliceAngle;
                return slice;
              });
            })()}
          </Canvas>
        </div>

        {/* Line Chart */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>Tasks Priority Count (3D Line)</h4>
          <Canvas camera={{ position: [0, 8, 12], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[0, 10, 10]} intensity={0.8} />
            <OrbitControls />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[15, 10]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            {/* Points */}
            {lineData.map(({ name, value }, i) => {
              const x = (i - (lineData.length - 1) / 2) * 4;
              const y = (value / maxPriority) * 5 + 0.2;
              return (
                <Point
                  key={name}
                  position={[x, y, 0]}
                  color={COLORS[i % COLORS.length]}
                  label={`${name}: ${value} tasks`}
                  onHover={setTooltipData}
                  onLeave={() => setTooltipData(null)}
                />
              );
            })}
            {/* Line */}
            <Line
              points={lineData.map(({ value }, i) => [
                (i - (lineData.length - 1) / 2) * 4,
                (value / maxPriority) * 5 + 0.2,
                0,
              ])}
              color="#10b981"
            />
          </Canvas>
        </div>
      </div>



      {/* Tooltip */}
      {tooltipData && (
        <div style={tooltipStyle} className={styles.tooltip}>
          {tooltipData.label}
        </div>
      )}

      {/* Download Buttons */}
      <div className={styles.downloadButtons}>
        <button className={styles.btnIndigo} onClick={() => handleDownload('png')}>
          Download PNG
        </button>
        <button className={styles.btnGreen} onClick={() => handleDownload('jpeg')}>
          Download JPEG
        </button>
        <button className={styles.btnYellow} onClick={() => handleDownload('webp')}>
          Download WEBP
        </button>
      </div>
    </div>
  );
};

export default Visualize3d;

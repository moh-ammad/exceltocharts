import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import html2canvas from 'html2canvas';
import axiosInstance from '@/utils/axiosInstance';
import styles from "@/visualize/visualize3d.module.css";
import { showError, showSuccess } from '@/utils/helper';
import CustomTooltip from '@/createtasks/CustomTooltip';
import { API_ENDPOINTS } from '@/utils/apisPaths';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Bar component for 3D bar chart with hover handlers
const Bar = ({ position, height, color, label, onHover, onLeave }) => (
  <mesh
    position={position}
    onPointerOver={e => {
      e.stopPropagation();
      onHover({ label, position: e.point });
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

// Pie slice component with hover handlers
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
        onHover({ label, position: e.point });
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

// Line chart point component with hover handlers
const Point = ({ position, color, label, onHover, onLeave }) => (
  <mesh
    position={position}
    onPointerOver={e => {
      e.stopPropagation();
      onHover({ label, position: e.point });
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

// Line chart connecting lines (no hover needed here)
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
  const chartRef = useRef(null);

  // Tooltip state: { label: string, position: THREE.Vector3 } or null
  const [tooltipData, setTooltipData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
         const usersRes = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS);
        const tasksRes = await axiosInstance.get(API_ENDPOINTS.TASKS.GET_ALL_TASKS);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      } catch (e) {
        setUsers([]);
        setTasks([]);
      }
    }
    fetchData();
  }, []);

  // Data for bar chart - tasks per user
  const userTaskCounts = users.map(user => {
    const count = tasks.filter(task => task.createdBy === user._id).length;
    return { id: user._id, name: user.name || 'User', count };
  });
  const maxUserCount = Math.max(...userTaskCounts.map(u => u.count), 1);

  // Data for pie chart - tasks by status
  const statusCount = { pending: 0, 'in-progress': 0, completed: 0 };
  tasks.forEach(task => {
    if (task.status in statusCount) statusCount[task.status]++;
  });
  const pieData = Object.entries(statusCount).some(([, v]) => v > 0)
    ? Object.entries(statusCount).map(([name, value]) => ({ name, value }))
    : [
        { name: 'Pending', value: 1 },
        { name: 'In Progress', value: 1 },
        { name: 'Completed', value: 1 },
      ]; // fallback dummy

  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0);

  // Data for line chart - tasks by priority
  const priorityCount = { low: 0, medium: 0, high: 0 };
  tasks.forEach(task => {
    if (task.priority in priorityCount) priorityCount[task.priority]++;
  });
  const lineData = Object.entries(priorityCount).map(([name, value]) => ({ name, value }));
  const maxPriority = Math.max(...lineData.map(d => d.value), 1);

  // Improved download handler: composite WebGL canvases (r3f) and DOM overlays
  // into a single image. html2canvas alone can't capture WebGL canvas content.
  const handleDownload = async (format = 'png') => {
    if (!chartRef.current) return;
    try {
      const container = chartRef.current;
      const rect = container.getBoundingClientRect();
      const scale = 2; // export at higher resolution

      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = Math.round(rect.width * scale);
      exportCanvas.height = Math.round(rect.height * scale);
      const ctx = exportCanvas.getContext('2d');

      // Fill background
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // 1) Capture DOM overlays (non-canvas elements) by cloning the container
      // and running html2canvas on the clone with canvases removed.
      let domCanvas = null;
      try {
        const clone = container.cloneNode(true);
        // Remove canvas elements from the clone so html2canvas only captures DOM
        clone.querySelectorAll && clone.querySelectorAll('canvas').forEach(n => n.remove());
        // Place clone offscreen so styles still apply
        clone.style.position = 'absolute';
        clone.style.left = '-99999px';
        document.body.appendChild(clone);
        domCanvas = await html2canvas(clone, { backgroundColor: null, useCORS: true, scale });
        document.body.removeChild(clone);
      } catch (e) {
        // If html2canvas fails for DOM overlays, continue — we still can capture WebGL
        console.warn('html2canvas overlay capture failed:', e);
        domCanvas = null;
      }

      // Draw DOM overlay (if any) as base layer
      if (domCanvas) {
        ctx.drawImage(domCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
      }

      // 2) Capture all canvas elements inside the container (react-three-fiber canvases)
      const canvases = Array.from(container.querySelectorAll('canvas'));
      for (const c of canvases) {
        try {
          // Get canvas bounding box relative to container
          const cRect = c.getBoundingClientRect();
          const x = Math.round((cRect.left - rect.left) * scale);
          const y = Math.round((cRect.top - rect.top) * scale);
          const w = Math.round(cRect.width * scale);
          const h = Math.round(cRect.height * scale);

          // Prefer to use the canvas's own pixel buffer if available
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
        } catch (err) {
          console.warn('Failed to draw canvas during export', err);
        }
      }

      // Finalize export
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

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Visualize3d Dashboard</h2>

      <div className={styles.chartsContainer} ref={chartRef}>
        {/* Bar Chart */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>Tasks by User (3D Bar)</h4>
          <Canvas camera={{ position: [0, 10, 15], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[0, 10, 5]} intensity={0.8} />
            <OrbitControls />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {userTaskCounts.map((user, i) => (
              <Bar
                key={user.id}
                position={[i * 2 - (userTaskCounts.length - 1), (user.count / maxUserCount) * 2.5, 0]}
                height={(user.count / maxUserCount) * 5 + 0.1}
                color={COLORS[i % COLORS.length]}
                label={`${user.name}: ${user.count}`}
                onHover={setTooltipData}
                onLeave={() => setTooltipData(null)}
              />
            ))}

            {/* Render tooltip */}
            {tooltipData && (
              <Html position={tooltipData.position} center>
                <CustomTooltip active={true} payload={[{ name: tooltipData.label, fill: '#fff', value: '' }]} label={tooltipData.label} />
              </Html>
            )}
          </Canvas>
        </div>

        {/* Pie Chart */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>Tasks by Status (3D Pie)</h4>
          <Canvas camera={{ position: [0, 8, 12], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[0, 10, 5]} intensity={0.8} />
            <OrbitControls />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* Pie slices with hover */}
            {(() => {
              let startAngle = 0;
              return pieData.map(({ name, value }, i) => {
                const angle = (value / totalPie) * Math.PI * 2;
                const label = `${name} (${value})`;
                const slice = (
                  <PieSlice
                    key={name}
                    startAngle={startAngle}
                    endAngle={startAngle + angle}
                    radius={3}
                    height={1}
                    color={COLORS[i % COLORS.length]}
                    label={label}
                    position={[0, 0, 0]}
                    onHover={setTooltipData}
                    onLeave={() => setTooltipData(null)}
                  />
                );
                startAngle += angle;
                return slice;
              });
            })()}

            {/* Render tooltip */}
            {tooltipData && (
              <Html position={tooltipData.position} center>
                <CustomTooltip active={true} payload={[{ name: tooltipData.label, fill: '#fff', value: '' }]} label={tooltipData.label} />
              </Html>
            )}
          </Canvas>
        </div>

        {/* Line Chart */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>Tasks by Priority (3D Line)</h4>
          <Canvas camera={{ position: [0, 8, 15], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[0, 10, 5]} intensity={0.8} />
            <OrbitControls />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#222" />
            </mesh>

            {/* Points and line */}
            {(() => {
              const points = lineData.map((d, i) => {
                const x = i * 3 - (lineData.length - 1) * 1.5;
                const y = (d.value / maxPriority) * 5;
                return [x, y, 0];
              });
              return (
                <>
                  <Line points={points} color={COLORS[1]} />
                  {points.map((pos, i) => (
                    <Point
                      key={lineData[i].name}
                      position={pos}
                      color={COLORS[i % COLORS.length]}
                      label={`${lineData[i].name}: ${lineData[i].value}`}
                      onHover={setTooltipData}
                      onLeave={() => setTooltipData(null)}
                    />
                  ))}
                </>
              );
            })()}

            {/* Render tooltip */}
            {tooltipData && (
              <Html position={tooltipData.position} center>
                <CustomTooltip active={true} payload={[{ name: tooltipData.label, fill: '#fff', value: '' }]} label={tooltipData.label} />
              </Html>
            )}
          </Canvas>
        </div>
      </div>

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

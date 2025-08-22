import React from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg text-sm font-medium">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="mb-0" style={{ color: entry.fill }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip;

// src/components/Instructions.jsx

import {
  FileSpreadsheet,
  BarChart3,
  UserCheck,
  UploadCloud,
  ClipboardList,
  Settings,
  LineChart,
} from "lucide-react";

const features = [
  {
    icon: <FileSpreadsheet className="w-8 h-8 text-blue-600" />,
    title: "Upload Excel Files",
    description: "Upload .xlsx files to instantly convert data into interactive 2D and 3D charts.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-green-600" />,
    title: "Visualize Data",
    description: "Transform your spreadsheets into powerful visual dashboards for analysis.",
  },
  {
    icon: <UserCheck className="w-8 h-8 text-purple-600" />,
    title: "Role-based Access",
    description: "Admins can assign and manage tasks. Users handle their own assigned tasks.",
  },
  {
    icon: <ClipboardList className="w-8 h-8 text-orange-600" />,
    title: "Task Management",
    description: "Track task status as Pending, In-progress, or Completed with priority levels.",
  },
  {
    icon: <Settings className="w-8 h-8 text-pink-600" />,
    title: "Dynamic Status Updates",
    description: "Users can update the status of tasks, and progress is calculated accordingly.",
  },
  {
    icon: <LineChart className="w-8 h-8 text-teal-600" />,
    title: "Progress Monitoring",
    description: "Admin dashboard shows overall progress, activity, and user engagement.",
  },
];

const Instructions = () => {
  return (
    <section className="py-12 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          How DataViz Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 shadow p-6 rounded-lg flex flex-col items-center text-center"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Instructions;

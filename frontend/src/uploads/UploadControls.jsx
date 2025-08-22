import { Download } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { showError } from '@/utils/helper';

const exportOptions = [
  {
    label: 'Empty Users Template',
    url: API_ENDPOINTS.REPORTS.EXPORT_EMPTY_USERS_TEMPLATE,
    fileName: 'empty-users-template.xlsx',
  },
  {
    label: 'Users Only',
    url: API_ENDPOINTS.REPORTS.EXPORT_ALL_USERS,
    fileName: 'users.xlsx',
  },
  {
    label: 'Tasks Only',
    url: API_ENDPOINTS.REPORTS.EXPORT_ALL_TASKS,
    fileName: 'tasks.xlsx',
  },
  {
    label: 'Users With Empty Tasks',
    url: API_ENDPOINTS.REPORTS.EXPORT_USERS_WITH_EMPTY_TASKS,
    fileName: 'users-with-empty-tasks.xlsx',
  },
  {
    label: 'Users + Tasks',
    url: API_ENDPOINTS.REPORTS.EXPORT_USERS_AND_TASKS,
    fileName: 'users-and-tasks.xlsx',
  },
];

const handleDownload = async (url, filename) => {
  try {
    const res = await axiosInstance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const href = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(href);
  } catch (error) {
    showError('Failed to download file.');
  }
};

const UploadControls = () => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {exportOptions.map(({ label, url, fileName }) => (
        <button
          key={fileName}
          onClick={() => handleDownload(url, fileName)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-all duration-200 text-sm"
        >
          <Download size={16} />
          {label}
        </button>
      ))}
    </div>
  );
};

export default UploadControls;

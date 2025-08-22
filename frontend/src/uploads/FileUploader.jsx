import { useEffect, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { showError, showSuccess } from '@/utils/helper';
import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/utils/apisPaths';

const LOCAL_KEY = 'uploadedExcelFile';

const FileUploader = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setFile(parsed);
      setProgress(100);
      setUploadComplete(true);
    }
  }, []);

  const handleFileUpload = async (uploadedFile) => {
    const formData = new FormData();
    formData.append('excelfile', uploadedFile);

    try {
      setProgress(20);

      const endpoint = uploadedFile.name.toLowerCase().includes('task')
        ? API_ENDPOINTS.REPORTS.IMPORT_USERS_AND_TASKS
        : API_ENDPOINTS.REPORTS.IMPORT_ONLY_USERS;

      await axiosInstance.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });

      localStorage.setItem(LOCAL_KEY, JSON.stringify({ name: uploadedFile.name }));
      setFile({ name: uploadedFile.name });
      setUploadComplete(true);
      showSuccess('File uploaded and processed successfully!');
    } catch (err) {
      showError(err?.response?.data?.message || 'Upload failed');
    }
  };

  const processFile = (uploadedFile) => {
    if (uploadedFile && uploadedFile.name.endsWith('.xlsx')) {
      setFile({ name: uploadedFile.name });
      setProgress(0);
      setUploadComplete(false);
      handleFileUpload(uploadedFile);
    } else {
      showError('Only .xlsx files are allowed.');
    }
  };

  const handleChange = (e) => {
    const uploadedFile = e.target.files[0];
    processFile(uploadedFile);
  };

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setUploadComplete(false);
    localStorage.removeItem(LOCAL_KEY);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div
      className={`w-full border-2 border-dashed p-6 rounded-md transition-all duration-200
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-400 dark:border-gray-600'}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {!file && (
        <>
          <UploadCloud size={48} className="mx-auto text-blue-600 dark:text-blue-400 mb-4" />
          <p className="text-lg font-medium mb-1">
            Drag and drop your <code>.xlsx</code> file here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to select file</p>
        </>
      )}

      <label className="inline-block bg-blue-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-700 transition">
        Select File
        <input type="file" hidden accept=".xlsx" onChange={handleChange} />
      </label>

      {file && (
        <div className="mt-6 text-left relative bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
          <button
            className="absolute right-2 top-2 text-red-500 hover:text-red-700"
            onClick={handleRemove}
            title="Remove File"
          >
            <X size={20} />
          </button>

          <p className="mb-2 text-sm font-medium">{file.name}</p>

          <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded mt-2">
            <div
              className="h-2 bg-blue-600 dark:bg-blue-400 rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {uploadComplete && (
            <p className="text-green-600 text-sm mt-2">Upload complete!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

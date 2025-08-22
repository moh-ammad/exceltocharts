import FileUploader from '@/uploads/FileUploader';
import UploadControls from '@/uploads/UploadControls';

const UploadPage = () => {
  return (
    <div className="min-h-screen px-6 py-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <h2 className="text-3xl font-semibold mb-8">Upload Your Excel File</h2>

      <div className="max-w-3xl mx-auto border-dashed border-2 border-gray-400 dark:border-gray-600 p-10 rounded-md text-center">
        <FileUploader />
      </div>

      <div className="mt-10 max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">Download Templates</h3>
        <UploadControls />
      </div>
    </div>
  );
};

export default UploadPage;

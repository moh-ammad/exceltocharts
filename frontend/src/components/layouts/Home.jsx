import { useContext } from 'react';
import { UserContext } from '@/context/userContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!user) return navigate('/signUp');
    return navigate('/upload');
  };

  const handleLearnMore = () => {
    if (!user) return navigate('/login');
    return navigate('/instructions');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Transform Your Excel Data into Stunning Visuals
        </h1>
        <p className="text-lg mb-4 leading-relaxed">
          Seamlessly convert Excel files into interactive charts and dashboards with DataViz.
        </p>
        <p className="text-md mb-6 leading-relaxed text-gray-700 dark:text-gray-300">
          Empower your data analysis with 2D and 3D visualizations, task management, and real-time progress tracking — all in one platform.
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Get Started
          </button>
          <button
            onClick={handleLearnMore}
            className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-100"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

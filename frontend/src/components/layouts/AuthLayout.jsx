import UI_IMAGE from "@/assets/collab.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex pb-4">
      <div className="w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12">
        <h2 className="text-lg font-medium text-white">Task Manager</h2>
        {children}
      </div>
      <div
        className="hidden md:flex w-[40vw] h-screen items-center justify-center overflow-hidden p-8 bg-gradient-to-br from-indigo-500 to-blue-900"
      >
        <img src={UI_IMAGE} alt="Cover" className="w-full h-full object-cover" />
      </div>

    </div>
  );
};

export default AuthLayout;




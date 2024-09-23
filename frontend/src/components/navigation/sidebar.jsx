import { useState } from 'react';
import logoSidebar from '../../assets/logoHeader.png';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { doSignOut } from '../../firebase/auth';
import { HomeIcon, UserIcon, ClipboardDocumentListIcon, ChartBarIcon, PowerIcon, Bars3Icon, Cog8ToothIcon, UserGroupIcon } from '@heroicons/react/16/solid';
import { Outlet } from 'react-router-dom';

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const titles = {
    '/dashboard': 'Overview',
    '/patients': 'Patients',
    '/inventory': 'Inventory',
    '/settings': 'Settings',
    '/analytics': 'Analytics',
  };

  const currentTitle = titles[location.pathname] || 'Overview';

  return (
    <div className="flex h-screen shadow-lg">
      {/* Sidebar Toggle */}
      <div className={`fixed inset-0 z-20 transition-opacity bg-neutral-100 opacity-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-red-900 ${sidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center">
          <img src={logoSidebar} alt="Logo" className="w-auto h-30" />
        </div>

        {/* Navigation */}
        <nav className="mt-1">
          <Link to="/dashboard" className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800">
            <HomeIcon className="w-6 h-6 mr-3" />
            Overview
          </Link>

          <Link to="/inventory" className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800">
            <ClipboardDocumentListIcon className="w-6 h-6 mr-3" />
            Inventory
          </Link>

          <Link to="/patients" className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800">
            <UserGroupIcon className="w-6 h-6 mr-3" />
            Patients
          </Link>

          <Link to="/analytics" className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800">
            <ChartBarIcon className="w-6 h-6 mr-3" />
            Analytics
          </Link>

          <Link to="/settings" className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800">
            <Cog8ToothIcon className="w-6 h-6 mr-3" />
            Settings
          </Link>

          <a onClick={() => { doSignOut().then(() => { navigate('/signin') }) }} className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800 cursor-pointer">
            <PowerIcon className="w-6 h-6 mr-3" />
            Logout
          </a>
        </nav>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="flex justify-between items-center p-4 bg-neutral-600">
          <button className="lg:hidden text-white" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl text-white">{currentTitle}</h1>
          <div className="flex items-center space-x-2">
            <span className="text-white">Admin</span> 
            <UserIcon className="w-6 h-6 text-white" /> 
          </div>
        </header>

        {/* Pages Area */}
        <div className="flex-grow p-4 bg-neutral-100">
          <Outlet />  
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
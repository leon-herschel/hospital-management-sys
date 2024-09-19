import { useState } from 'react'
import logoSidebar from '../../assets/logoHeader.png'
import { useNavigate } from 'react-router-dom'
import { doSignOut } from '../../firebase/auth'
import { HomeIcon, UserIcon, Cog6ToothIcon, ChartBarIcon, PowerIcon } from '@heroicons/react/16/solid';

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate()

  return (
    <div className="flex h-screen">
      {/* Sidebar Toggle */}
      <div className={`fixed inset-0 z-20 transition-opacity bg-black opacity-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-red-900 ${sidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <img src={logoSidebar} alt="Logo" className="w-auto h-30" />
              </div>
            </div>
          </div>
        </div>

          {/* Navigation */}
          <nav className="mt-6">
          <a className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800" href="/">
            <HomeIcon className="w-6 h-6 mr-3 " />
            Overview
          </a>

          <a className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800" href="/profile">
            <UserIcon className="w-6 h-6 mr-3" />
            Inventory
          </a>

          <a className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800" href="/settings">
            <Cog6ToothIcon className="w-6 h-6 mr-3" />
            Patients
          </a>

          <a className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800" href="/settings">
            <ChartBarIcon className="w-6 h-6 mr-3" />
            Analytics
          </a>

          <a onClick={() => { doSignOut().then(() => { navigate('/login') }) }} className="flex items-center px-4 py-2 mt-2 text-white opacity-85 hover:opacity-100 hover:bg-red-800" href="#">
            <PowerIcon className="w-6 h-6 mr-3" />
            Logout
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="flex justify-between items-center p-4 bg-gray-600">
          <button className="lg:hidden text-white" onClick={() => setSidebarOpen(true)}>
            
          </button>
          <h1 className="text-2xl text-white">Overview</h1>
        </header>
        
        {/* Main Content Area */}
        <div className="flex-grow p-4 bg-gray-100">
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

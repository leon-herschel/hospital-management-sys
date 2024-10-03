import { useState } from "react";
import logoSidebar from "../../assets/logoHeader.png";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { doSignOut } from "../../firebase/auth";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PowerIcon,
  Bars3Icon,
  Cog8ToothIcon,
  UserGroupIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/16/solid";
import { Outlet } from "react-router-dom";
import { useAccessControl } from "../roles/accessControl";
import { useAuth } from "../../context/authContext/authContext";

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const roleData = useAccessControl();

  // Titles based on route paths
  const titles = {
    "/dashboard": "Overview",
    "/patients": "Patient Management System",
    "/inventory": "Inventory Management System",
    "/settings": "Settings",
    "/analytics": "Analytics",
    "/billing": "Billing List",
    "/inventory-history": "Inventory History",
    "/stockTransfer": "Stock Transfer",


  };

  let currentTitle = "Overview";

  if (location.pathname.startsWith("/patients")) {
    currentTitle = "Patient Management System";
  } else if (titles[location.pathname]) {
    currentTitle = titles[location.pathname];
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen">
      {/* Sidebar Toggle */}
      <div
        className={`fixed inset-0 z-20 transition-opacity bg-neutral-100 opacity-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-slate-900 ${
          sidebarOpen ? "translate-x-0 ease-out" : "-translate-x-full ease-in"
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-center">
          <img src={logoSidebar} alt="Southwestern University Medical Center" className="p-3 pb-1 text-white text-center text-lg" />
        </div>

        {/* Navigation */}
        <nav className="mt-1">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-2 mt-2 ${
              isActive("/dashboard")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <HomeIcon className="w-6 h-6 mr-3" />
            Overview
          </Link>

          {roleData?.accessInventory && (
            <Link
              to="/inventory"
              className={`flex items-center px-4 py-2 mt-2 ${
                isActive("/inventory")
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-white"
              } hover:bg-slate-800`}
            >
              <ClipboardDocumentListIcon className="w-6 h-6 mr-3" />
              Inventory
            </Link>
          )}

          {roleData?.accessInventoryHistory && (
            <Link
              to="/inventory-history"
              className={`flex items-center px-4 py-2 mt-2 ${
                isActive("/inventory-history")
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-white"
              } hover:bg-slate-800`}
            >
              <ArchiveBoxIcon className="w-6 h-6 mr-3" />
              History
            </Link>
          )}

          {roleData?.accessPatients && (
            <Link
              to="/patients"
              className={`flex items-center px-4 py-2 mt-2 ${
                isActive("/patients")
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-white"
              } hover:bg-slate-800`}
            >
              <UserGroupIcon className="w-6 h-6 mr-3" />
              Patients
            </Link>
          )}

          <Link
            to="/billing"
            className={`flex items-center px-4 py-2 mt-2 ${
              isActive("/billing")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <CreditCardIcon className="w-6 h-6 mr-3" />
            Billing
          </Link>

          <Link
            to="/stockTransfer"
            className={`flex items-center px-4 py-2 mt-2 ${
              isActive("/stockTransfer")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <CreditCardIcon className="w-6 h-6 mr-3" />
            Stock Transfer
          </Link>

          <Link
            to="/analytics"
            className={`flex items-center px-4 py-2 mt-2 ${
              isActive("/analytics")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <ChartBarIcon className="w-6 h-6 mr-3" />
            Analytics
          </Link>

          <Link
            to="/settings"
            className={`flex items-center px-4 py-2 mt-2 ${
              isActive("/settings")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <Cog8ToothIcon className="w-6 h-6 mr-3" />
            Settings
          </Link>

          <a
            onClick={() => {
              doSignOut().then(() => {
                navigate("/signin");
              });
            }}
            className="flex items-center px-4 py-2 mt-2 text-white hover:bg-slate-800 cursor-pointer"
          >
            <PowerIcon className="w-6 h-6 mr-3" />
            Logout
          </a>
        </nav>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex justify-between items-center p-4 bg-white drop-shadow-sm">
          <button
            className="lg:hidden text-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {currentTitle}
          </h1>
          <div className="flex items-center space-x-2">
            <UserIcon className="w-6 h-6 text-gray-800" />
            <span className="text-gray-800 font-semibold">{role}</span>
          </div>
        </header>

        {/* Pages Area*/}
        <div className="flex-grow overflow-y-auto pt-8 px-6 bg-slate-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

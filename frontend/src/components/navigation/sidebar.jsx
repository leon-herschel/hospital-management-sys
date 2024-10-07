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
  ChevronDownIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/16/solid";
import { Outlet } from "react-router-dom";
import { useAccessControl } from "../roles/accessControl";
import { useAuth } from "../../context/authContext/authContext";
import LogoutConfirmationModal from "./LogoutConfirmationModal";

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false); 
  const [departmentsDropdownOpen, setDepartmentsDropdownOpen] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const roleData = useAccessControl();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    doSignOut().then(() => {
      navigate("/signin");
    });
  };

  const closeModal = () => {
    setIsLogoutModalOpen(false);
  };

  const toggleInventoryDropdown = () => {
    setInventoryDropdownOpen(!inventoryDropdownOpen);
  };

  const toggleDepartmentsDropdown = () => {
    setDepartmentsDropdownOpen(!departmentsDropdownOpen);
  };

  // Titles based on route paths
  const titles = {
    "/dashboard": "Overview",
    "/patients": "Patient Management",
    "/inventory": "Inventory Management",
    "/settings": "Admin Settings",
    "/analytics": "Analytics",
    "/billing": "Billing List",
    "/inventory-history": "Inventory History",
    "/stockTransfer": "CSR Department",
    "/requestStock": "ICU Department",
    "/med": "PHARMACY Department",

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
          <img
            src={logoSidebar}
            alt="Southwestern University Medical Center"
            className="p-3 pb-1 text-white text-center text-lg"
          />
        </div>

        {/* Navigation */}
        <nav className="mt-1">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
              isActive("/dashboard")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <HomeIcon className="w-6 h-6 mr-3" />
            Overview
          </Link>

          {roleData?.accessInventory && (
            <>
            {/* Inventory Dropdown */}
              <div
                className="flex items-center px-4 py-2 mt-2 mx-3 rounded-md text-white cursor-pointer hover:bg-slate-800"
                onClick={toggleInventoryDropdown}
              >
              <ClipboardDocumentListIcon className="w-6 h-6 mr-3" />
              <span>Inventory</span>
              <ChevronDownIcon
                className={`w-5 h-5 ml-auto transform transition-transform duration-200 ${
                  inventoryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            <div
              className={`ml-8 overflow-hidden transition-all duration-300 ease-in-out ${
                inventoryDropdownOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
                <Link
                  to="/inventory"
                  className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                    isActive("/inventory")
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-white"
                  } hover:bg-slate-800`}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-3" />
                  Inventory
                </Link>

                {roleData?.accessInventoryHistory && (
                  <Link
                    to="/inventory-history"
                    className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                      isActive("/inventory-history")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-white"
                    } hover:bg-slate-800`}
                  >
                    <ArchiveBoxIcon className="w-5 h-5 mr-3" />
                    History
                  </Link>
                )}
              </div>
            </>
            )}

          {roleData?.accessPatients && (
            <Link
              to="/patients"
              className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
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
            className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
              isActive("/billing")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <CreditCardIcon className="w-6 h-6 mr-3" />
            Billing
          </Link>

          {/* Departments Dropdown */}
          <div
              className="flex items-center px-4 py-2 mt-2 mx-3 rounded-md text-white cursor-pointer hover:bg-slate-800"
              onClick={toggleDepartmentsDropdown}
            >
              <BuildingOffice2Icon className="w-6 h-6 mr-3" />
              <span>Departments</span>
              <ChevronDownIcon
                className={`w-5 h-5 ml-auto transform transition-transform duration-200 ${
                  departmentsDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            <div
              className={`ml-8 overflow-hidden transition-all duration-300 ease-in-out ${
                departmentsDropdownOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <Link
                to="/stockTransfer"
                className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                  isActive("/stockTransfer")
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-white"
                } hover:bg-slate-800`}
              >
                CSR POV
              </Link>

              <Link
                to="/requestStock"
                className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                  isActive("/requestStock")
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-white"
                } hover:bg-slate-800`}
              >
                ICU POV
              </Link>
              
              <Link
                to="/med"
                className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                  isActive("/med")
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-white"
                } hover:bg-slate-800`}
              >
                PHARMACY POV
              </Link>
            </div>


          <Link
            to="/analytics"
            className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
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
            className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
              isActive("/settings")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <Cog8ToothIcon className="w-6 h-6 mr-3" />
            Settings
          </Link>

          <Link
            to="/InventoryHistory"
            className={`flex items-center px-4 py-2 mt-2 ${
              isActive("/InventoryHistory")
                ? "bg-red-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-red-800`}
          >
            <ChartBarIcon className="w-6 h-6 mr-3" />
            History
          </Link>
          <a
          onClick={handleLogout}
          className="flex items-center px-4 py-2 mt-2 mx-3 rounded-md text-white hover:bg-slate-800 cursor-pointer"
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
          <LogoutConfirmationModal
            isOpen={isLogoutModalOpen}
            onClose={closeModal}
            onConfirm={confirmLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

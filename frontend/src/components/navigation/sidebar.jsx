import { useState } from "react";
import logoSidebar from "../../assets/logoHeader.png";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { doSignOut } from "../../firebase/auth";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PowerIcon,
  Bars3Icon,
  Cog8ToothIcon,
  UserGroupIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
  CubeIcon,
  ClipboardDocumentIcon,
  ArchiveBoxArrowDownIcon,
  ArrowPathRoundedSquareIcon,
  PaperAirplaneIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/16/solid";
import { Outlet } from "react-router-dom";
import { useAccessControl } from "../roles/accessControl";
import LogoutConfirmationModal from "./LogoutConfirmationModal";
import UserProfileDropdown from "./UserProfile";
import { useAuth } from "../../context/authContext/authContext";

const Sidebar = () => {
  const { department } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false);
  const [historyDropdownOpen, setHistoryDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useAccessControl();
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

  const toggleHistoryDropdown = () => {
    setHistoryDropdownOpen(!historyDropdownOpen);
  };

  // Titles based on route paths
  const titles = {
    "/dashboard": "Overview",
    "/patients": "Patient Management",
    "/booking": "Appointments",
    "/PatientBooking": "Booking",
    "/inventory": "Inventory Management",
    "/settings": "Admin Settings",
    "/analytics": "Analytics",
    "/billing": "Billing List",
    "/inventory-history": "Inventory History",
    "/OverAllInventory": "Overall Inventory",
    "/stockTransfer": "CSR Department",
    "/requestStock": "ICU Department",
    "/med": "Pharmacy Department",
    "/ViewMedReq": "View Medicine Request",
    "/ViewRequest": "View Supply Request",
    "/Transfer": "Transfer Supply",
    "/transferMed": "Transfer Medicine",
    "/requestS": "Request Stock",
    "/PharmacyTransferHistory": "Transfer History",
    "/CsrTransferHistory": "Transfer History",
    "/UsageHistory": "Usage History",
    "/PaidSection": "PaidSection",
    "/StockInHistory": "Stock In History",
  };

  let currentTitle = "Overview";

  if (titles[location.pathname]) {
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

          {permissions?.accessInventory && (
            <>
              {/* Inventory Dropdown */}
              <div
                className="flex items-center px-4 py-2 mt-2 mx-3 rounded-md text-white cursor-pointer hover:bg-slate-800"
                onClick={toggleInventoryDropdown}
              >
                <ClipboardDocumentIcon className="w-6 h-6 mr-3" />
                <span>Inventory</span>
                <ChevronDownIcon
                  className={`w-5 h-5 ml-auto transform transition-transform duration-200 ${
                    inventoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <div
                className={`ml-2 overflow-hidden transition-all duration-300 ease-in-out ${
                  inventoryDropdownOpen
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
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

                {/* Adding Overall Inventory */}
                {permissions?.accessOverallInventory && (
                  <Link
                    to="/OverAllInventory"
                    className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                      isActive("/OverAllInventory")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-white"
                    } hover:bg-slate-800`}
                  >
                    <CubeIcon className="w-5 h-5 mr-3" />
                    Overall Inventory
                  </Link>
                )}
              </div>
            </>
          )}

          {(department === "CSR" || department === "Admin") && (
            <Link
              to="Transfer"
              className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                isActive("/Transfer")
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-white"
              } hover:bg-slate-800`}
            >
              <ArrowPathRoundedSquareIcon className="w-5 h-5 mr-3" />
              Transfer Supply
            </Link>
          )}

          {(department === "Pharmacy" || department === "Admin") && (
            <Link
              to="transferMed"
              className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                isActive("/transferMed")
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-white"
              } hover:bg-slate-800`}
            >
              <ArrowPathRoundedSquareIcon className="w-5 h-5 mr-3" />
              Transfer Medicine
            </Link>
          )}

          {(department === "CSR" || department === "Admin") && (
            <Link
              to="ViewRequest"
              className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                isActive("/ViewRequest")
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-white"
              } hover:bg-slate-800`}
            >
              <PaperAirplaneIcon className="w-5 h-5 mr-3" />
              Pending Supply Request
            </Link>
          )}

          {(department === "Pharmacy" || department === "Admin") && (
            <Link
              to="ViewMedReq"
              className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                isActive("/ViewMedReq")
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-white"
              } hover:bg-slate-800`}
            >
              <PaperAirplaneIcon className="w-5 h-5 mr-3" />
              Pending Medicine Request
            </Link>
          )}

          <Link
            to="requestS"
            className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
              isActive("/requestS")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5 mr-3" />
            Request Stock
          </Link>

          {permissions?.accessInventoryHistory && (
            <>
              <div
                className="flex items-center px-4 py-2 mt-2 mx-3 rounded-md text-white cursor-pointer hover:bg-slate-800"
                onClick={toggleHistoryDropdown}
              >
                <ArchiveBoxIcon className="w-5 h-5 mr-3" />
                <span>History</span>
                <ChevronDownIcon
                  className={`w-5 h-5 ml-auto transform transition-transform duration-200 ${
                    historyDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <div
                className={`ml-2 overflow-hidden transition-all duration-300 ease-in-out ${
                  historyDropdownOpen
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="overflow-y-auto max-h-40">
                  {department !== "CSR" && department !== "Pharmacy" && (
                    <Link
                      to="/UsageHistory"
                      className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                        isActive("/UsageHistory")
                          ? "bg-slate-800 text-white shadow-sm"
                          : "text-white"
                      } hover:bg-slate-800`}
                    >
                      <ArchiveBoxArrowDownIcon className="w-5 h-5 mr-3" />
                      Usage History
                    </Link>
                  )}

                  <Link
                    to="/StockInHistory"
                    className={`flex text-sm items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                      isActive("/StockInHistory")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-white"
                    } hover:bg-slate-800`}
                  >
                    <ArchiveBoxArrowDownIcon className="w-5 h-5 mr-3" />
                    Stock In History
                  </Link>

                  <Link
                    to="PharmacyTransferHistory"
                    className={`flex text-sm items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                      isActive("/PharmacyTransferHistory")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-white"
                    } hover:bg-slate-800`}
                  >
                    <ArchiveBoxArrowDownIcon className="w-5 h-5 mr-3" />
                    Medicine Transfer History
                  </Link>

                  <Link
                    to="CsrTransferHistory"
                    className={`flex text-sm items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                      isActive("/CsrTransferHistory")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-white"
                    } hover:bg-slate-800`}
                  >
                    <ArchiveBoxArrowDownIcon className="w-5 h-5 mr-3" />
                    Supply Transfer History
                  </Link>
                </div>
              </div>
            </>
          )}

          {permissions?.accessPatients && (
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

            <>
              {/* Inventory Dropdown */}
              <div
                className="flex items-center px-4 py-2 mt-2 mx-3 rounded-md text-white cursor-pointer hover:bg-slate-800"
                onClick={toggleInventoryDropdown}
              >
                <ClipboardDocumentIcon className="w-6 h-6 mr-3" />
                <span>Appointments</span>
                <ChevronDownIcon
                  className={`w-5 h-5 ml-auto transform transition-transform duration-200 ${
                    inventoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <div
                className={`ml-2 overflow-hidden transition-all duration-300 ease-in-out ${
                  inventoryDropdownOpen
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <Link
                  to="/booking"
                  className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                    isActive("/booking")
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-white"
                  } hover:bg-slate-800`}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-3" />
                  Appointments
                </Link>

                  <Link
                    to="/PatientBooking"
                    className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
                      isActive("/PatientBooking")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-white"
                    } hover:bg-slate-800`}
                  >
                    <CubeIcon className="w-5 h-5 mr-3" />
                    Booking
                  </Link>
              </div>
            </>

          {(department === "Billing" || department === "Admin") && (
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
          )}
          
          {(department === "Billing" || department === "Admin") && (
          <Link
            to="/PaidSection"
            className={`flex items-center px-4 py-2 mt-2 mx-3 rounded-md ${
              isActive("/PaidSection")
                ? "bg-slate-800 text-white shadow-sm"
                : "text-white"
            } hover:bg-slate-800`}
          >
            <CreditCardIcon className="w-6 h-6 mr-3" />
            Billing Paid Section
          </Link>
          )}

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

          {permissions?.accessSettings && (
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
          )}

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
        <header className="flex justify-between items-center p-4 bg-white drop-shadow-sm z-50">
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
            <UserProfileDropdown onLogout={handleLogout} />
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

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const AddDepartmentModal = ({ showModal, setShowModal, onAddDepartment }) => {
  const [departmentName, setDepartmentName] = useState("");
  const [accessInventory, setAccessInventory] = useState(false);
  const [accessOverallInventory, setAccessOverallInventory] = useState(false);
  const [accessInventoryHistory, setAccessInventoryHistory] = useState(false);
  const [accessPatients, setAccessPatients] = useState(false);
  const [accessSettings, setAccessSettings] = useState(false);
  const [accessBilling, setAccessBilling] = useState(false);
  const [accessLaboratory, setAccessLaboratory] = useState(false);
  const [accessAnalytics, setAccessAnalytics] = useState(false);
  const [accessMedicalCertificate, setAccessMedicalCertificate] = useState(false);
  const [accessInventoryTransactions, setAccessInventoryTransactions] = useState(false);
  
  // Mobile Features permissions
  const [accessDoctorScreen, setAccessDoctorScreen] = useState(false);
  const [accessLabScreen, setAccessLabScreen] = useState(false);
  const [accessAdminScreen, setAccessAdminScreen] = useState(false);
  const [accessClinicStaffScreen, setAccessClinicStaffScreen] = useState(false);
  const [accessNurseScreen, setAccessNurseScreen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newDepartment = {
      [departmentName]: {
        permissions: {
          accessInventory,
          accessOverallInventory,
          accessInventoryHistory,
          accessPatients,
          accessSettings,
          accessBilling,
          accessLaboratory,
          accessAnalytics,
          accessMedicalCertificate,
          accessInventoryTransactions,
          // Mobile Features permissions
          accessDoctorScreen,
          accessLabScreen,
          accessAdminScreen,
          accessClinicStaffScreen,
          accessNurseScreen,
        },
      },
    };

    onAddDepartment(newDepartment);
    setShowModal(false);
    
    // Reset form
    setDepartmentName("");
    setAccessInventory(false);
    setAccessOverallInventory(false);
    setAccessInventoryHistory(false);
    setAccessPatients(false);
    setAccessSettings(false);
    setAccessBilling(false);
    setAccessLaboratory(false);
    setAccessAnalytics(false);
    setAccessMedicalCertificate(false);
    setAccessInventoryTransactions(false);
    setAccessDoctorScreen(false);
    setAccessLabScreen(false);
    setAccessAdminScreen(false);
    setAccessClinicStaffScreen(false);
    setAccessNurseScreen(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-lg relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Department</h2>

        <form onSubmit={handleSubmit} className="max-h-[500px] overflow-y-auto">
          <div className="mb-4">
            <label className="block text-gray-700">Department Name</label>
            <input
              type="text"
              placeholder="Department Name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Web Application Permissions */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Web Application Permissions</h3>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessInventory}
                onChange={() => setAccessInventory(!accessInventory)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Inventory</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessOverallInventory}
                onChange={() => setAccessOverallInventory(!accessOverallInventory)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Overall Inventory</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessInventoryHistory}
                onChange={() => setAccessInventoryHistory(!accessInventoryHistory)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Inventory History</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessPatients}
                onChange={() => setAccessPatients(!accessPatients)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Patients</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessBilling}
                onChange={() => setAccessBilling(!accessBilling)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Billing</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessLaboratory}
                onChange={() => setAccessLaboratory(!accessLaboratory)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Laboratory</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessAnalytics}
                onChange={() => setAccessAnalytics(!accessAnalytics)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Analytics</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessMedicalCertificate}
                onChange={() => setAccessMedicalCertificate(!accessMedicalCertificate)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Medical Certificate</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessInventoryTransactions}
                onChange={() => setAccessInventoryTransactions(!accessInventoryTransactions)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Inventory Transactions</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessSettings}
                onChange={() => setAccessSettings(!accessSettings)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Settings</span>
            </label>
          </div>

          {/* Mobile Features Permissions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow-md border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Mobile Features Permissions</h3>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessDoctorScreen}
                onChange={() => setAccessDoctorScreen(!accessDoctorScreen)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Doctor Screen</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessLabScreen}
                onChange={() => setAccessLabScreen(!accessLabScreen)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Lab Screen</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessAdminScreen}
                onChange={() => setAccessAdminScreen(!accessAdminScreen)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Admin Screen</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessClinicStaffScreen}
                onChange={() => setAccessClinicStaffScreen(!accessClinicStaffScreen)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Clinic Staff Screen</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessNurseScreen}
                onChange={() => setAccessNurseScreen(!accessNurseScreen)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Nurse Screen</span>
            </label>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartmentModal;
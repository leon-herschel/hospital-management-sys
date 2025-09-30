import { useState } from 'react';
import RolesTable from './Roles/RolesTable';
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAccessControl } from "../../components/roles/accessControl";
import DepartmentsTable from './Departments/DepartmentsTable';
import ClinicsTable from './Clinics/ClinicTable';
import DoctorsTable from './Doctors/DoctorsTable';
import SuppliersTable from './Suppliers/SuppliersTable';

const Settings = () => {
  const [tableView, setTableView] = useState('Role Management');
  const permissions = useAccessControl();
  
  // Since the permissions object contains accessClinicManagement,
  // and this is likely only granted to superadmin users,
  // we can use this permission directly
  const shouldShowClinicManagement = permissions?.accessClinicManagement === true;

  const handleClick = (view) => {
    setTableView(view);
  };

  if (!permissions?.accessSettings) {
    return <AccessDenied />;
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-4 flex justify-start items-center flex-wrap gap-2">
        {shouldShowClinicManagement && (
          <button
            onClick={() => handleClick("Clinic Management")}
            className={`px-6 py-2 rounded-md transition duration-200 ${
              tableView === "Clinic Management"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-200 text-gray-900"
            }`}
          >
            Clinic Management
          </button>
        )}
        <button
          onClick={() => handleClick("Role Management")}
          className={`px-6 py-2 rounded-md transition duration-200 ${
            tableView === "Role Management"
              ? "bg-slate-900 text-white font-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Role Management
        </button>
        <button
          onClick={() => handleClick("Department Management")}
          className={`px-6 py-2 rounded-md transition duration-200 ${
            tableView === "Department Management"
              ? "bg-slate-900 text-white font-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Department Management
        </button>
        
        <button
          onClick={() => handleClick("Doctor Management")}
          className={`px-6 py-2 rounded-md transition duration-200 ${
            tableView === "Doctor Management"
              ? "bg-slate-900 text-white font-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Doctor Management
        </button>
      </div>

      {tableView === 'Role Management' && <RolesTable />}
      {tableView === 'Department Management' && <DepartmentsTable />}
      {shouldShowClinicManagement && tableView === 'Clinic Management' && <ClinicsTable />}
      {tableView === 'Doctor Management' && <DoctorsTable />}
    </div>
  );
};

export default Settings;
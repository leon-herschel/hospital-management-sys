import { useState } from 'react';
import UsersTable from './Users/UsersTable';
import RolesTable from './Roles/RolesTable';
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAccessControl } from "../../components/roles/accessControl";
import DepartmentsTable from './Departments/DepartmentsTable';

const Settings = () => {
  const [tableView, setTableView] = useState('User Management');
  const permissions = useAccessControl();

  const handleClick = (view) => {
    setTableView(view);
  };

  if (!permissions?.accessSettings) {
    return <AccessDenied />;
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-4 flex justify-start items-center">
      <button
          onClick={() => handleClick("User Management")}
          className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
            tableView === "User Management"
              ? "bg-slate-900 text-white text-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => handleClick("Role Management")}
          className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
            tableView === "Role Management"
              ? "bg-slate-900 text-white text-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Role Management
        </button>
        <button
          onClick={() => handleClick("Department Management")}
          className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
            tableView === "Department Management"
              ? "bg-slate-900 text-white text-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Department Management
        </button>
      </div>
      
      {tableView === 'User Management' && <UsersTable />}
      {tableView === 'Role Management' && <RolesTable />}
      {tableView === 'Department Management' && <DepartmentsTable />}
    </div>
  );
};

export default Settings;

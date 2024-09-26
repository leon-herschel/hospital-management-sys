import { useState } from 'react';
import UsersTable from './Users/UsersTable';
import RolesTable from './Roles/RolesTable';

const Settings = () => {
  const [tableView, setTableView] = useState('User Management');

  const handleTableSwitch = (e) => {
    setTableView(e.target.value);
  };

  return (
    <div className="p-6">
      {/* Dropdown for switching tables */}
      <div className="mb-4 flex justify-start items-center">
        <select
          value={tableView}
          onChange={handleTableSwitch}
          className="border px-4 py-2 rounded-lg mr-4"
        >
          <option value="User Management">User Management</option>
          <option value="Role Management">Role Management</option>
        </select>
      </div>

      {/* Render the appropriate table */}
      {tableView === 'User Management' && <UsersTable />}
      {tableView === 'Role Management' && <RolesTable />}
    </div>
  );
};

export default Settings;

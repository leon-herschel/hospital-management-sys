import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../../firebase/firebase';

const RolesTable = () => {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      const rolesRef = ref(database, 'roles');
      const snapshot = await get(rolesRef);
      if (snapshot.exists()) {
        const rolesList = [];
        snapshot.forEach((childSnapshot) => {
          rolesList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setRoles(rolesList);
      }
    };

    fetchRoles();
  }, []);

  return (
    <div className="relative overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-maroon-600">Role Management</h2>

      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">Role</th>
            <th scope="col" className="px-6 py-3">Description</th>
            <th scope="col" className="px-6 py-3">Access Inventory</th>
            <th scope="col" className="px-6 py-3">Access Inventory History</th>
            <th scope="col" className="px-6 py-3">Access Patients</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                {role.id}
              </th>
              <td className="px-6 py-4">{role.description}</td>
              <td className="px-6 py-4">{role.accessInventory ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4">{role.accessInventoryHistory ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4">{role.accessPatients ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RolesTable;

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

      <table className="w-full text-md text-gray-800 text-center border border-stone-200">
          <thead className="text-sm uppercase bg-stone-200">
          <tr>
            <th scope="col" className="px-6 py-3">Role</th>
            <th scope="col" className="px-6 py-3">Description</th>
            <th scope="col" className="px-6 py-3">Access Inventory</th>
            <th scope="col" className="px-6 py-3">Access Inventory History</th>
            <th scope="col" className="px-6 py-3">Access Patients</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="bg-white border-b hover:bg-stone-100">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {role.id}
              </th>
              <td className="px-6 py-4">{role.description}</td>
              <td className="px-6 py-4">{role.accessInventory ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4">{role.accessInventoryHistory ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4">{role.accessPatients ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4 flex justify-center space-x-4">
                  <button
                    className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-md"
                  >
                    Edit
                  </button>
                  <button
                    className="ml-4 bg-red-600 text-white px-6 py-2 rounded-md"
                  >
                    Delete
                  </button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RolesTable;

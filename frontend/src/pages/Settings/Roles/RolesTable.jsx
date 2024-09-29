import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import AddRoleModal from './AddRoleModal';

const RolesTable = () => {
  const [roles, setRoles] = useState([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

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

  const handleAddRole = (newRole) => {
    const roleId = Object.keys(newRole)[0]; 
    const rolesRef = ref(database, `roles/${roleId}`); 

    set(rolesRef, newRole[roleId]) 
      .then(() => {
        setRoles((prevRoles) => [
          ...prevRoles,
          { id: roleId, ...newRole[roleId] }, 
        ]);
        setShowAddRoleModal(false);
      })
      .catch((error) => {
        console.error('Error adding role:', error);
      });
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4 text-center">Role Management</h2>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search"
          className="border border-stone-300 px-4 py-2 rounded-lg"
        />
        <button
          className="ml-4 bg-green-600 text-white px-6 py-2 rounded-md"
          onClick={() => setShowAddRoleModal(true)}
        >
          Add Role
        </button>
      </div>
      <div className="relative overflow-x-auto shadow-sm">
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
                  <button className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-md">
                    Edit
                  </button>
                  <button className="ml-4 bg-red-600 text-white px-6 py-2 rounded-md">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <AddRoleModal
          showModal={showAddRoleModal}
          setShowModal={setShowAddRoleModal}
          onAddRole={handleAddRole}
        />
      </div>
    </div>
  );
};

export default RolesTable;

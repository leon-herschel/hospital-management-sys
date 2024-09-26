import { useState } from 'react';
import { database } from '../../../firebase/firebase';
import { ref, set } from 'firebase/database';

const AddRoleModal = ({ isOpen, onClose }) => {
  const [rolename, setRolename] = useState('');
  const [description, setDescription] = useState('');

  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      // Create a reference for the new role using rolename as the key
      const roleRef = ref(database, 'roles/' + rolename);
      
      // Add the new role to the Realtime Database
      await set(roleRef, {
        rolename,
        description,
      });

      alert('Role added successfully');

      // Clear input fields
      setRolename('');
      setDescription('');
      
      // Close the modal after adding the role
      onClose();
    } catch (error) {
      alert('Error adding role: ' + error.message);
    }
  };

  if (!isOpen) return null; // If modal is not open, return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-2xl font-bold mb-4">Add New Role</h2>
        <form onSubmit={handleAddRole}>
          <div className="mb-4">
            <label className="block text-gray-700">Role Name:</label>
            <input
              type="text"
              value={rolename}
              onChange={(e) => setRolename(e.target.value)}
              className="border rounded w-full py-2 px-3"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Description:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded w-full py-2 px-3"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Add Role
            </button>
            <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Role = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={openModal} className="bg-blue-500 text-white px-4 py-2 rounded">
        Add Role
      </button>

      {/* Modal */}
      <AddRoleModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default Role;

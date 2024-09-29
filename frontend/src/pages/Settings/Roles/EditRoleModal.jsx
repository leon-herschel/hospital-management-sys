import { useState, useEffect } from 'react';
import { XMarkIcon } from "@heroicons/react/24/solid";

const EditRoleModal = ({ showModal, setShowModal, role, onEditRole }) => {
  const [roleData, setRoleData] = useState({
    description: '',
    accessInventory: false,
    accessInventoryHistory: false,
    accessPatients: false,
  });

  useEffect(() => {
    if (role) {
      setRoleData({ ...role });
    }
  }, [role]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setRoleData({
      ...roleData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onEditRole(role.id, roleData);
    setShowModal(false);
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

        <h2 className="text-2xl font-bold mb-6">Edit Role</h2>

        <form onSubmit={handleSubmit} className="max-h-[500px] overflow-y-auto">
          <div className="mb-4">
            <label className="block text-gray-700">Description</label>
            <input
              type="text"
              name="description"
              value={roleData.description}
              onChange={handleChange}
              placeholder="Role Description"
              required
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Access Permissions</h3>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                name="accessInventory"
                checked={roleData.accessInventory}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Inventory</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                name="accessInventoryHistory"
                checked={roleData.accessInventoryHistory}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Inventory History</span>
            </label>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                name="accessPatients"
                checked={roleData.accessPatients}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Patients</span>
            </label>
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoleModal;

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const AddRoleModal = ({ showModal, setShowModal, onAddRole }) => {
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [accessInventory, setAccessInventory] = useState(false);
  const [accessInventoryHistory, setAccessInventoryHistory] = useState(false);
  const [accessPatients, setAccessPatients] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newRole = {
      [role]: {
        accessInventory,
        accessInventoryHistory,
        accessPatients,
        description,
      },
    };
    onAddRole(newRole);
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

        <h2 className="text-2xl font-bold mb-6">Add Role</h2>

        <form onSubmit={handleSubmit} className="max-h-[500px] overflow-y-auto">
          <div className="mb-4">
            <label className="block text-gray-700">Role</label>
            <input
              type="text"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Description</label>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Access Permissions</h3>
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
                checked={accessInventoryHistory}
                onChange={() =>
                  setAccessInventoryHistory(!accessInventoryHistory)
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">
                Access Inventory History
              </span>
            </label>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={accessPatients}
                onChange={() => setAccessPatients(!accessPatients)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Access Patients</span>
            </label>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoleModal;

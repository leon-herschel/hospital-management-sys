import { XMarkIcon } from '@heroicons/react/24/solid'; 

const EditUserModal = ({ isOpen, setIsOpen, userData, handleEditSave, setEditedData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit User</h2>
          <button onClick={() => setIsOpen(false)}>
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <form onSubmit={() => handleEditSave(userData.id)}>
          <div className="mb-4">
            <label className="block text-gray-700">Username:</label>
            <input
              type="text"
              value={userData.username}
              onChange={(e) => setEditedData({ ...userData, username: e.target.value })}
              className="border rounded w-full py-2 px-3"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Role:</label>
            <select
              value={userData.role}
              onChange={(e) => setEditedData({ ...userData, role: e.target.value })}
              className="border rounded w-full py-2 px-3"
            >
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Inventory Manager">Inventory Manager</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Status:</label>
            <select
              value={userData.status}
              onChange={(e) => setEditedData({ ...userData, status: e.target.value })}
              className="border rounded w-full py-2 px-3"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-4 bg-gray-300 text-black px-4 py-2 rounded"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

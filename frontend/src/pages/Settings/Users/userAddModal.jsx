import { useState } from "react";
import { ref, set } from "firebase/database";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { database } from "../../../firebase/firebase";

const UserAddRoleModal = ({ showModal, setShowModal, onAddRole }) => {
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canView: true,
  });
  const [error, setError] = useState("");

  const handleCheckboxChange = (permissionKey) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionKey]: !prev[permissionKey],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roleName.trim()) {
      setError("Role name is required.");
      return;
    }

    const roleData = {
      name: roleName,
      permissions,
    };

    try {
      await set(ref(database, `roles/${roleName}`), roleData);
      onAddRole({ [roleName]: roleData }); // notify parent
      setShowModal(false);
      setRoleName("");
      setPermissions({ canAdd: false, canEdit: false, canDelete: false, canView: true });
      setError("");
    } catch (err) {
      console.error("Error saving role:", err);
      setError("Failed to save role.");
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">Add New Role</h2>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-medium">Role Name</label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="w-full p-2 border rounded-md mb-4"
            placeholder="Enter role name"
            required
          />

          <label className="block mb-2 font-medium">Permissions</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.keys(permissions).map((key) => (
              <label key={key} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={() => handleCheckboxChange(key)}
                  className="mr-2"
                />
                {key}
              </label>
            ))}
          </div>

          {error && <div className="text-red-500 mb-3">{error}</div>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserAddRoleModal;

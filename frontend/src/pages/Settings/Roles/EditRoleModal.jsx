import { useState, useEffect } from 'react';
import { XMarkIcon } from "@heroicons/react/24/solid";

const EditRoleModal = ({ showModal, setShowModal, role, onEditRole }) => {
  const [roleName, setRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canView: false
  });

  useEffect(() => {
    if (role) {
      setRoleName(role.name || '');
      setPermissions({
        canAdd: role.permissions?.canAdd || false,
        canEdit: role.permissions?.canEdit || false,
        canDelete: role.permissions?.canDelete || false,
        canView: role.permissions?.canView || false
      });
    }
  }, [role]);

  const handleSave = async () => {
    setIsLoading(true); 
    try {
      await onEditRole(role.id, { name: roleName, permissions });
      setShowModal(false);
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  const permissionLabels = {
    canAdd: "Can Add",
    canEdit: "Can Edit",
    canDelete: "Can Delete",
    canView: "Can View"
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

        <h2 className="text-2xl font-bold mb-4">Edit Role</h2>

        <div className="mb-4">
          <label className="block text-gray-700">Role Name</label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full mt-2"
            disabled={role.id === 'admin'}
          />
        </div>

        {/* Permissions Card */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Access Permissions</h3>
          {Object.keys(permissions).map((key) => (
            <div key={key}>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={() =>
                    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={role.id === 'admin'}
                />
                <span className="ml-2 text-gray-700 capitalize">{permissionLabels[key]}</span>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleSave}
            disabled={isLoading} 
          >
            {isLoading ? 'Updating Role...' : 'Update Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;

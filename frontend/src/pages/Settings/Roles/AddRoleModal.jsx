import { useState } from 'react';
import { XMarkIcon } from "@heroicons/react/24/solid";

const UserAddRoleModal = ({ showModal, setShowModal, onAddRole, existingRoles = [] }) => {
  const [roleName, setRoleName] = useState(''); 
  const [canAdd, setCanAdd] = useState(false); 
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false); 
  const [canView, setCanView] = useState(false);
  const [error, setError] = useState('');

  const handleRoleNameChange = (e) => {
    const value = e.target.value.toLowerCase();
    setRoleName(value);
    
    // Check for duplicates
    if (value && existingRoles.includes(value)) {
      setError('A role with this name already exists');
    } else {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Final validation
    if (existingRoles.includes(roleName.toLowerCase())) {
      setError('A role with this name already exists');
      return;
    }

    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }

    const updatedPermissions = {
      canAdd: canAdd,
      canEdit: canEdit,
      canDelete: canDelete,
      canView: canView,
    };

    const newRole = {
      [roleName]: { 
        name: roleName, 
        permissions: updatedPermissions 
      }
    };

    // Call the parent's onAddRole function which will handle database saving
    // and return the new role data
    onAddRole(newRole, roleName);

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setRoleName(''); 
    setCanAdd(false); 
    setCanEdit(false);
    setCanDelete(false); 
    setCanView(false);
    setError('');
    setShowModal(false);
  };

  const handleClose = () => {
    resetForm();
  };

  if (!showModal) return null;

  const isFormValid = roleName.trim() && !error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-lg relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Role</h2> 

        <div className="max-h-[500px] overflow-y-auto">
          <div className="mb-4">
            <label className="block text-gray-700">Role Name</label> 
            <input
              type="text"
              placeholder="Role Name (will be converted to lowercase)"
              value={roleName}
              onChange={handleRoleNameChange}
              required
              className={`block w-full mt-2 p-2 border rounded-md ${
                error ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {roleName && !error && (
              <p className="mt-1 text-sm text-gray-500">
                Role will be created as: "{roleName}"
              </p>
            )}
          </div>

          <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Access Permissions</h3>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={canAdd}
                onChange={() => setCanAdd(!canAdd)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Can Add</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={canEdit}
                onChange={() => setCanEdit(!canEdit)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Can Edit</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={canDelete}
                onChange={() => setCanDelete(!canDelete)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Can Delete</span>
            </label>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={canView}
                onChange={() => setCanView(!canView)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Can View</span>
            </label>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`px-4 py-2 rounded-md text-white ${
                isFormValid
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Create Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAddRoleModal;
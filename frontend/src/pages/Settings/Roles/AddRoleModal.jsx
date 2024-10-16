import { useState } from 'react';
import { XMarkIcon } from "@heroicons/react/24/solid";

const AddRoleModal = ({ showModal, setShowModal, onAddRole }) => {
  const [roleName, setRoleName] = useState(''); 
  const [canAdd, setCanAdd] = useState(false); 
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false); 
  const [canView, setCanView] = useState(false); 

    const handleSubmit = (e) => {
        e.preventDefault();

        const updatedPermissions = {
            canAdd: canAdd,
            canEdit: canEdit,
            canDelete: canDelete,
            canView: canView,
        };

        const newRole = {
            [roleName.toLowerCase()]: { 
                name: roleName, 
                permissions: updatedPermissions 
            }
        };

        onAddRole(newRole);

        setRoleName(''); 
        setCanAdd(false); 
        setCanEdit(false);
        setCanDelete(false); 
        setCanView(false); 
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
            <label className="block text-gray-700">Role Name</label> 
            <input
              type="text"
              placeholder="Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
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
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoleModal;

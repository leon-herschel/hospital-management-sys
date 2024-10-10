import { useState, useEffect } from 'react';
import { XMarkIcon } from "@heroicons/react/24/solid";

const EditDepartmentModal = ({ showModal, setShowModal, department, onEditDepartment }) => {
  const [departmentName, setDepartmentName] = useState('');
  const [permissions, setPermissions] = useState({
    accessInventory: false,
    accessInventoryHistory: false,
    accessPatients: false,
    accessSettings: false,
  });
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    if (department) {
      setDepartmentName(department.id || '');
      setPermissions({
        accessInventory: department.permissions.accessInventory || false,
        accessInventoryHistory: department.permissions.accessInventoryHistory || false,
        accessPatients: department.permissions.accessPatients || false,
        accessSettings: department.permissions.accessSettings || false,
      });
    }
  }, [department]);

  const handleChange = (e) => {
    const { name, type, checked } = e.target;

    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [name]: type === 'checkbox' ? checked : prevPermissions[name],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); 

    try {
      await onEditDepartment(department.id, { permissions });
      setShowModal(false); 
    } catch (error) {
      console.error("Failed to update department:", error);
    } finally {
      setIsLoading(false); 
    }
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

        <h2 className="text-2xl font-bold mb-6">Edit Department</h2>

        <form onSubmit={handleSubmit} className="max-h-[500px] overflow-y-auto">
          <div className="mb-4">
            <label className="block text-gray-700">Department Name</label>
            <input
              type="text"
              value={department.id}
              disabled
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Permissions Card */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Access Permissions</h3>
            {Object.keys(permissions).map((permission) => (
              <label key={permission} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name={permission}
                  checked={permissions[permission]}
                  onChange={handleChange}
                  disabled={department.id === 'Admin'}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700 capitalize">
                  {permission.replace(/access/g, '').replace(/([A-Z])/g, ' $1')}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`} 
              disabled={isLoading} 
            >
              {isLoading ? 'Updating Department...' : 'Update Department'} {/* Show loading text */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartmentModal;

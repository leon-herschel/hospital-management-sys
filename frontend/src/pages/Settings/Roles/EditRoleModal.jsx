import { useState, useEffect } from 'react';
import { XMarkIcon } from "@heroicons/react/24/solid";

const EditRoleModal = ({ showModal, setShowModal, role, onEditRole }) => {
    const [roleName, setRoleName] = useState('');
    const [canAddInventory, setCanAddInventory] = useState(false);
    const [canEditInventoryHistory, setCanEditInventoryHistory] = useState(false);
    const [canDeletePatients, setCanDeletePatients] = useState(false);
    const [canViewSettings, setCanViewSettings] = useState(false);

    useEffect(() => {
        if (role) {
            setRoleName(role.name);
            setCanAddInventory(role.permissions.canAddInventory);
            setCanEditInventoryHistory(role.permissions.canEditInventoryHistory);
            setCanDeletePatients(role.permissions.canDeletePatients);
            setCanViewSettings(role.permissions.canViewSettings);
        }
    }, [role]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const updatedRole = {
            [roleName]: {
                name: roleName.charAt(0).toUpperCase() + roleName.slice(1), // Capitalize first letter
                permissions: {
                    canAddInventory,
                    canEditInventoryHistory,
                    canDeletePatients,
                    canViewSettings,
                },
            },
        };

        console.log("Updated Role: ", updatedRole); // For debugging
        onEditRole(roleName, updatedRole); // Ensure onEditRole is correctly implemented in parent
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setRoleName('');
        setCanAddInventory(false);
        setCanEditInventoryHistory(false);
        setCanDeletePatients(false);
        setCanViewSettings(false);
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-lg relative">
                <button
                    onClick={() => setShowModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                    aria-label="Close modal"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <h2 className="text-2xl font-bold mb-6">Edit Role</h2>

                <form onSubmit={handleSubmit} className="max-h-[500px] overflow-y-auto">
                    <div className="mb-4">
                        <label htmlFor="role" className="block text-gray-700">Role</label>
                        <input
                            id="role"
                            type="text"
                            placeholder="Role"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            required
                            className="block w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                        />
                    </div>

                    <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Access Permissions</h3>
                        <label className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                checked={canAddInventory}
                                onChange={() => setCanAddInventory(!canAddInventory)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Can Add Inventory</span>
                        </label>
                        <label className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                checked={canEditInventoryHistory}
                                onChange={() => setCanEditInventoryHistory(!canEditInventoryHistory)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Can Edit Inventory History</span>
                        </label>
                        <label className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                checked={canDeletePatients}
                                onChange={() => setCanDeletePatients(!canDeletePatients)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Can Delete Patients</span>
                        </label>
                        <label className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                checked={canViewSettings}
                                onChange={() => setCanViewSettings(!canViewSettings)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Can View Settings</span>
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

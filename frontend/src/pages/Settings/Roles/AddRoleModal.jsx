import { useState } from 'react';

const AddRoleModal = ({ showModal, setShowModal, onAddRole }) => {
  const [role, setRole] = useState(''); 
  const [description, setDescription] = useState(''); 
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

  return (
    showModal && (
      <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-bold mb-4">Add Role</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="border border-gray-300 px-4 py-2 rounded mb-2 w-full"
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="border border-gray-300 px-4 py-2 rounded mb-2 w-full"
            />
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessInventory}
                onChange={() => setAccessInventory(!accessInventory)}
              />
              <span className="ml-2">Access Inventory</span>
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={accessInventoryHistory}
                onChange={() => setAccessInventoryHistory(!accessInventoryHistory)}
              />
              <span className="ml-2">Access Inventory History</span>
            </label>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={accessPatients}
                onChange={() => setAccessPatients(!accessPatients)}
              />
              <span className="ml-2">Access Patients</span>
            </label>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded mr-2">
              Add Role
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded">
              Cancel
            </button>
          </form>
        </div>
      </div>
    )
  );
};

export default AddRoleModal;

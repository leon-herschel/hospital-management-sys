import { useState, useEffect } from 'react';
import { ref, get, remove, update } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editedData, setEditedData] = useState({ name: '', email: '', department: '', role: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const usersList = [];
        snapshot.forEach((childSnapshot) => {
          usersList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setUsers(usersList);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (user) => {
    try {
      const userRef = ref(database, `users/${user.id}`);
      await remove(userRef);
      setUsers(users.filter((u) => u.id !== user.id));
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    }
  };

  const handleEditClick = (user) => {
    setEditUser(user);
    setEditedData(user);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (userId) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, editedData);
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...editedData } : u)));
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-4 text-center">User Management</h2>

      {/* Search and Add Account Button */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-stone-300 px-4 py-2 rounded-lg"
        />
        <button
          className="ml-4 bg-green-600 text-white px-6 py-2 rounded-md"
          onClick={() => setShowAddUserModal(true)}
        >
          Add Account
        </button>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto shadow-sm">
        <table className="w-full text-md text-gray-800 text-center border border-stone-200">
          <thead className="text-sm uppercase bg-stone-200">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Department</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="bg-white border-b hover:bg-stone-100">
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.department}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4 flex justify-center space-x-4">
                  <button
                    className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-md"
                    onClick={() => handleEditClick(user)}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-4 bg-red-600 text-white px-6 py-2 rounded-md"
                    onClick={() => handleDeleteUser(user)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <EditUserModal
        isOpen={isEditModalOpen}
        setIsOpen={setIsEditModalOpen}
        userData={editedData}
        setEditedData={setEditedData}
        handleEditSave={handleEditSave}
      />
      {showAddUserModal && (
        <AddUserModal showModal={showAddUserModal} setShowModal={setShowAddUserModal} />
      )}
    </div>
  );
};

export default UsersTable;

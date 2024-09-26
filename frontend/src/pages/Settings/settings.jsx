import { useState, useEffect } from 'react';
import { ref, get, remove, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import EditUserModal from './EditUserModal'; 
import AddUserModal from './AddUserModal'; 

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editedData, setEditedData] = useState({ name: '', email: '', department: '', role: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

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

  // Delete user
  const handleDeleteUser = async (user) => {
    try {
      const userRef = ref(database, `users/${user.id}`);
      await remove(userRef);
      setUsers(users.filter((u) => u.id !== user.id));
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    }
  };

  // Edit user
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
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">User Management</h2>

      <div className="mb-4 flex justify-between">
        <input
          type="text"
          placeholder="Search by Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        />
        <div>
          <button
            className="border-r-2 px-2 py-2"
            onClick={() => setShowAddUserModal(true)}
          >
            <PlusIcon className="h-8 w-8 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Department</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td className="py-2 text-center border-b border-r">{user.name}</td>
              <td className="py-2 text-center border-b border-r">{user.email}</td>
              <td className="py-2 text-center border-b border-r">{user.department}</td>
              <td className="py-2 text-center border-b border-r">{user.role}</td>
              <td className="border-b py-2 px-20 text-center">
                <button
                  className="text-blue-500 p-2 border-r-2 border-gray-300"
                  onClick={() => handleEditClick(user)}
                >
                  <PencilIcon className="h-6 w-6" />
                </button>
                <button
                  className="text-red-500 p-2"
                  onClick={() => handleDeleteUser(user)}
                >
                  <TrashIcon className="h-6 w-6" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        setIsOpen={setIsEditModalOpen}
        userData={editedData}
        setEditedData={setEditedData}
        handleEditSave={handleEditSave}
      />

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal showModal={showAddUserModal} setShowModal={setShowAddUserModal} />
      )}
    </div>
  );
};

export default Users;

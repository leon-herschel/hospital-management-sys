import React, { useState, useEffect } from 'react';
import { ref, push, set, get, child, remove, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import editImage from "../../assets/editImage.jpg";
import deleteImage from '../../assets/deleteImage.jpg';
import addImage from '../../assets/add.jpg';
import roleImage from '../../assets/role.jpg';
import { useNavigate } from 'react-router-dom';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editedData, setEditedData] = useState({ username: '', role: '', status: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: '', role: '', status: '' });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users from Firebase Realtime Database
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
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete user from Firebase Realtime Database
  const handleDeleteUser = async (user) => {
    try {
      const userRef = ref(database, `users/${user.id}`);
      await remove(userRef);
      setUsers(users.filter((u) => u.id !== user.id));
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    }
  };

  // Open edit modal and set user data for editing
  const handleEditClick = (user) => {
    setEditUser(user.id);
    setEditedData(user);
    setIsEditModalOpen(true);
  };

  // Save edited user data to Firebase Realtime Database
  const handleEditSave = async (userId) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, editedData);
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...editedData } : u)));
      setIsEditModalOpen(false);
      setEditUser(null);
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  };

  // Add new user to Firebase Realtime Database
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.role || !newUserData.status) {
      alert('Please fill in all the fields');
      return;
    }
    try {
      const usersRef = ref(database, 'users');
      const newUserRef = push(usersRef);
      await set(newUserRef, newUserData);
      setUsers([...users, { id: newUserRef.key, ...newUserData }]);
      setIsAddModalOpen(false);
      setNewUserData({ username: '', role: '', status: '' });
    } catch (error) {
      alert('Error adding user: ' + error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">User Management</h2>

      <div className="mb-4 flex justify-between">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        />
        <div>
          <button
            className="border-r-2 px-2 py-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <img src={addImage} alt="Add" className="inline-table w-8 h-8" />
          </button>
          <button
            className="px-4 py-2 rounded"
            onClick={() => navigate('/roles')}
          >
            <img src={roleImage} alt="Roles" className="inline-table w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Username</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
        {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td className="py-2 text-center border-b border-r">{user.username}</td>
              <td className="py-2 text-center border-b border-r">{user.role}</td>
              <td className="py-2 text-center border-b border-r">
                <span className={user.status === 'Active' ? 'text-green-500' : 'text-red-500'}>
                  {user.status}
                </span>
              </td>
              <td className="border-b py-2 px-20 text-center">
                <button
                  className="text-blue-500 p-2 border-r-2 border-gray-300"
                  onClick={() => handleEditClick(user)}
                >
                  <img src={editImage} alt="Edit" className="inline-block w-6 h-6" />
                </button>
                <button
                  className="text-red-500 p-2"
                  onClick={() => handleDeleteUser(user)}
                >
                  <img src={deleteImage} alt="Delete" className="inline-block w-6 h-6" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-gray-700">Username:</label>
                <input
                  type="text"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="border rounded w-full py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Role:</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="border rounded w-full py-2 px-3"
                >
                  <option value="">Select Role</option>
                  <option value="Admin">Admin</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Status:</label>
                <select
                  value={newUserData.status}
                  onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value })}
                  className="border rounded w-full py-2 px-3"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-4 bg-gray-300 text-black px-4 py-2 rounded"
                  onClick={() => setIsAddModalOpen(false)}
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
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <form onSubmit={() => handleEditSave(editUser)}>
              <div className="mb-4">
                <label className="block text-gray-700">Username:</label>
                <input
                  type="text"
                  value={editedData.username}
                  onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                  className="border rounded w-full py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Role:</label>
                <select
                  value={editedData.role}
                  onChange={(e) => setEditedData({ ...editedData, role: e.target.value })}
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
                  value={editedData.status}
                  onChange={(e) => setEditedData({ ...editedData, status: e.target.value })}
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
                  onClick={() => setIsEditModalOpen(false)}
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
      )}
    </div>
  );
};

export default Users;

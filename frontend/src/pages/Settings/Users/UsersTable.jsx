import { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [editedData, setEditedData] = useState({ email: '', department: '', role: '' });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersList = [];
      snapshot.forEach((childSnapshot) => {
        usersList.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      setUsers(usersList);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        const userRef = ref(database, `users/${userToDelete.id}`);
        await remove(userRef);
        setUserToDelete(null); 
        setShowDeleteConfirm(false); 
      } catch (error) {
        console.error('Error deleting user: ', error.message);
      }
    }
  };

  const handleEditClick = (user) => {
    setSelectedUserId(user.id);
    setEditedData(user);
    setShowEditModal(true);
  };

  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="w-full">
      {/* Search and Add Account Button */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-slate-300 px-4 py-2 rounded-lg"
        />
        <button
          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          onClick={() => setShowAddUserModal(true)}
        >
          Add Account
        </button>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
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
              <tr key={user.id} className="bg-white border-b hover:bg-slate-100">
                <td className="px-6 py-4">{`${user.firstName} ${user.lastName}`}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.department}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4 flex justify-center space-x-4">
                  <button
                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={() => handleEditClick(user)}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                    onClick={() => confirmDeleteUser(user)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <EditUserModal 
        showModal={showEditModal} 
        setShowModal={setShowEditModal} 
        userId={selectedUserId} 
        onClose={() => setShowEditModal(false)}
      />

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          showModal={showAddUserModal}
          setShowModal={setShowAddUserModal}
          onUserAdded={() => {/* leave blank sa*/}}
        />
      )}

      {/* Confirmation Modal for Deleting User */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this user? Note: Delete function is not complete yet and will not delete a user from Firebase Authentication.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;

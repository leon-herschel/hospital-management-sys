import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import { database } from "../../firebase/firebase";

const AddUserModal = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username || !role || !status) {
      alert("Please fill in all the required fields");
      return;
    }

    try {
      const usersRef = ref(database, "users");
      const newUserRef = push(usersRef);

      await set(newUserRef, {
        username,
        role,
        status,
      });

      alert("User added successfully");
      // Clear input fields
      setUsername("");
      setRole("");
      setStatus("");
      onClose(); // Close the modal after adding the user
    } catch (error) {
      alert("Error adding user: " + error.message);
    }
  };

  if (!isOpen) return null; // If modal is not open, return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-2xl font-bold mb-4">Add New User</h2>
        <form onSubmit={handleAddUser}>
          <div className="mb-4">
            <label className="block text-gray-700">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border rounded w-full py-2 px-3"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded w-full py-2 px-3"
            >
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add User
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;

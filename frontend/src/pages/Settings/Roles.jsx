import React, { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, set, update, remove, onValue } from "firebase/database";
import editImage from "../../assets/editImage.jpg";
import deleteImage from "../../assets/deleteImage.jpg";
import addImage from "../../assets/add.jpg";
import roleImage from "../../assets/role.jpg";
import { useNavigate } from "react-router-dom";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();
  const [editRole, setEditRole] = useState(null);
  const [editedData, setEditedData] = useState({
    rolename: "",
    description: "",
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    rolename: "",
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch roles from Firebase Realtime Database
  useEffect(() => {
    const rolesRef = ref(database, "roles");

    // Listen for changes in the roles data
    onValue(rolesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roleList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setRoles(roleList);
      } else {
        setRoles([]); // No roles available
      }
    });
  }, []);

  const filteredroles = roles.filter((roles) =>
    roles.rolename.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteRole = async (role) => {
    try {
      const roleRef = ref(database, `roles/${role.id}`);
      await remove(roleRef);
      setRoles(roles.filter((r) => r.id !== role.id));
    } catch (error) {
      alert("Error deleting role: " + error.message);
    }
  };

  const handleEditClick = (role) => {
    setEditRole(role.id);
    setEditedData(role);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (roleId) => {
    try {
      const roleRef = ref(database, `roles/${roleId}`);
      await update(roleRef, editedData);
      setRoles(
        roles.map((r) => (r.id === roleId ? { ...r, ...editedData } : r)),
      );
      setIsEditModalOpen(false);
      setEditRole(null);
    } catch (error) {
      alert("Error updating role: " + error.message);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      const newRoleRef = ref(database, `roles/${newRoleData.rolename}`);
      await set(newRoleRef, newRoleData);
      setRoles([...roles, { id: newRoleData.rolename, ...newRoleData }]);
      setIsAddModalOpen(false);
      setNewRoleData({ rolename: "", description: "" });
    } catch (error) {
      alert("Error adding role: " + error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Role Management</h2>

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
            onClick={() => navigate("/settings")}
          >
            <img
              src={roleImage}
              alt="Settings"
              className="inline-table w-8 h-8"
            />
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Role Name</th>
            <th className="py-2 px-4 border-b">Description</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredroles.map((role) => (
            <tr key={role.id}>
              <td className="py-2 text-center border-b border-r">
                {role.rolename}
              </td>
              <td className="py-2 text-center border-b border-r">
                {role.description}
              </td>
              <td className="border-b py-2 px-20 text-center">
                <button
                  className="text-blue-500 p-2 border-r-2 border-gray-300"
                  onClick={() => handleEditClick(role)}
                >
                  <img
                    src={editImage}
                    alt="Edit"
                    className="inline-block w-6 h-6"
                  />
                </button>
                <button
                  className="text-red p-2"
                  onClick={() => handleDeleteRole(role)}
                >
                  <img
                    src={deleteImage}
                    alt="Delete"
                    className="inline-block w-6 h-6"
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Role Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl font-bold mb-4">Add New Role</h2>
            <form onSubmit={handleAddRole}>
              <div className="mb-4">
                <label className="block text-gray-700">Role Name:</label>
                <input
                  type="text"
                  value={newRoleData.rolename}
                  onChange={(e) =>
                    setNewRoleData({ ...newRoleData, rolename: e.target.value })
                  }
                  className="border rounded w-full py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Description:</label>
                <input
                  type="text"
                  value={newRoleData.description}
                  onChange={(e) =>
                    setNewRoleData({
                      ...newRoleData,
                      description: e.target.value,
                    })
                  }
                  className="border rounded w-full py-2 px-3"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-4 bg-gray-300 text-black px-4 py-2 rounded"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl font-bold mb-4">Edit Role</h2>
            <form onSubmit={() => handleEditSave(editRole)}>
              <div className="mb-4">
                <label className="block text-gray-700">Role Name:</label>
                <input
                  type="text"
                  value={editedData.rolename}
                  onChange={(e) =>
                    setEditedData({ ...editedData, rolename: e.target.value })
                  }
                  className="border rounded w-full py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Description:</label>
                <input
                  type="text"
                  value={editedData.description}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      description: e.target.value,
                    })
                  }
                  className="border rounded w-full py-2 px-3"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-4 bg-gray-300 text-black px-4 py-2 rounded"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
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

export default Roles;

import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import { Shield, Search, Plus, Edit, Trash2, Eye, UserCheck } from 'lucide-react';
import AddRoleModal from './AddRoleModal';
import EditRoleModal from './EditRoleModal';

const RolesTable = () => {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      const rolesRef = ref(database, 'roles');
      const snapshot = await get(rolesRef);
      if (snapshot.exists()) {
        const rolesList = [];
        snapshot.forEach((childSnapshot) => {
          rolesList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setRoles(rolesList);
        setFilteredRoles(rolesList); 
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    setFilteredRoles(
      roles.filter(role =>
        role.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, roles]);

  const handleAddRole = async (newRole) => {
    const roleName = Object.keys(newRole)[0]; 
    const roleData = newRole[roleName]; 

    setRoles((prevRoles) => [
        ...prevRoles,
        { id: roleName, ...roleData } 
    ]);

    const roleRef = ref(database, `roles/${roleName}`); 
    try {
        await set(roleRef, roleData); 
    } catch (error) {
        console.error('Error adding role to database:', error);
    }
  };

  const handleEditRole = (roleId, updatedRole) => {
    const roleRef = ref(database, `roles/${roleId}`);
  
    const roleData = {
      name: updatedRole.name,
      permissions: {
        canAdd: updatedRole.permissions.canAdd,
        canEdit: updatedRole.permissions.canEdit,
        canDelete: updatedRole.permissions.canDelete,
        canView: updatedRole.permissions.canView
      }
    };
  
    set(roleRef, roleData)
      .then(() => {
        setRoles((prevRoles) =>
          prevRoles.map((role) => (role.id === roleId ? { id: roleId, ...roleData } : role))
        );
        setFilteredRoles((prevFiltered) =>
          prevFiltered.map((role) => (role.id === roleId ? { id: roleId, ...roleData } : role))
        );
        setShowEditRoleModal(false); 
      })
      .catch((error) => {
        console.error('Error updating role:', error);
      });
  };

  const handleDeleteRole = async () => {
    if (roleToDelete) {
      try {
        const roleRef = ref(database, `roles/${roleToDelete.id}`);
        await remove(roleRef);
        setRoles((prevRoles) => prevRoles.filter(role => role.id !== roleToDelete.id));
        setFilteredRoles((prevFiltered) => prevFiltered.filter(role => role.id !== roleToDelete.id));
        setRoleToDelete(null);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Error deleting role:', error.message);
      }
    }
  };

  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const getPermissionIcon = (permissionType) => {
    const icons = {
      canAdd: <Plus size={14} />,
      canEdit: <Edit size={14} />,
      canDelete: <Trash2 size={14} />,
      canView: <Eye size={14} />
    };
    return icons[permissionType] || <Shield size={14} />;
  };

  const getRoleStats = () => {
    const totalRoles = roles.length;
    const adminRoles = roles.filter(role => role.id === 'admin').length;
    const customRoles = totalRoles - adminRoles;
    
    return {
      total: totalRoles,
      admin: adminRoles,
      custom: customRoles
    };
  };

  const stats = getRoleStats();

  return (
    <div className="w-full bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield size={24} />
              <span>Roles Management</span>
            </h2>
            <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
          </div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
            onClick={() => setShowAddRoleModal(true)}
          >
            <Shield size={20} />
            <span>Add Role</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-sm font-semibold text-blue-800">Total Roles</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-600">System roles</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <h3 className="text-sm font-semibold text-purple-800">Admin Roles</h3>
            <p className="text-2xl font-bold text-purple-900">{stats.admin}</p>
            <p className="text-xs text-purple-600">Administrative access</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h3 className="text-sm font-semibold text-green-800">Custom Roles</h3>
            <p className="text-2xl font-bold text-green-900">{stats.custom}</p>
            <p className="text-xs text-green-600">User-defined roles</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Roles Table */}
        <div className="relative overflow-x-auto rounded-md shadow-sm">
          <table className="w-full text-sm text-gray-900 text-center border border-gray-200">
            <thead className="text-sm bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3">Can Add</th>
                <th className="px-4 py-3">Can Edit</th>
                <th className="px-4 py-3">Can Delete</th>
                <th className="px-4 py-3">Can View</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        role.id === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        <Shield size={20} className={
                          role.id === 'admin' ? 'text-purple-600' : 'text-blue-600'
                        } />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{role.name}</span>
                          {role.id === 'admin' && (
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                              SYSTEM
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Role ID: {role.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('canAdd')}
                      <span className={`text-sm font-medium ${
                        role.permissions?.canAdd ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {role.permissions?.canAdd ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('canEdit')}
                      <span className={`text-sm font-medium ${
                        role.permissions?.canEdit ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {role.permissions?.canEdit ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('canDelete')}
                      <span className={`text-sm font-medium ${
                        role.permissions?.canDelete ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {role.permissions?.canDelete ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('canView')}
                      <span className={`text-sm font-medium ${
                        role.permissions?.canView ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {role.permissions?.canView ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <button
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${
                          role.id === 'admin' 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        disabled={role.id === 'admin'}
                        onClick={() => {
                          setSelectedRole(role);
                          setShowEditRoleModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${
                          role.id === 'admin'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        disabled={role.id === 'admin'}
                        onClick={() => confirmDeleteRole(role)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Shield size={32} className="text-gray-300" />
                      <span>No roles found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddRoleModal
        showModal={showAddRoleModal}
        setShowModal={setShowAddRoleModal}
        onAddRole={handleAddRole}
      />
      
      <EditRoleModal
        showModal={showEditRoleModal}
        setShowModal={setShowEditRoleModal}
        role={selectedRole}
        onEditRole={handleEditRole}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">Delete Role</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the role{" "}
                <span className="font-semibold">{roleToDelete?.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteRole}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesTable;
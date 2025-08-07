import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import { Building2, Search, Shield, Eye, History, Users, CreditCard, Settings } from 'lucide-react';
import AddDepartmentModal from './AddDepartmentModal';
import EditDepartmentModal from './EditDepartmentModal';

const DepartmentsTable = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      const departmentsRef = ref(database, 'departments');
      const snapshot = await get(departmentsRef);
      if (snapshot.exists()) {
        const departmentsList = [];
        snapshot.forEach((childSnapshot) => {
          departmentsList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setDepartments(departmentsList);
        setFilteredDepartments(departmentsList);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    setFilteredDepartments(
      departments.filter(department =>
        department.id.toLowerCase().includes(searchTerm.toLowerCase()) 
      )
    );
  }, [searchTerm, departments]);

  const handleAddDepartment = (newDepartment) => {
    const departmentId = Object.keys(newDepartment)[0];
    const departmentsRef = ref(database, `departments/${departmentId}`);

    set(departmentsRef, newDepartment[departmentId])
      .then(() => {
        setDepartments((prevDepartments) => [
          ...prevDepartments,
          { id: departmentId, ...newDepartment[departmentId] },
        ]);
        setFilteredDepartments((prevFiltered) => [
          ...prevFiltered,
          { id: departmentId, ...newDepartment[departmentId] },
        ]);
        setShowAddDepartmentModal(false);
      })
      .catch((error) => {
        console.error('Error adding department:', error);
      });
  };

  const handleEditDepartment = (departmentId, updatedDepartment) => {
    const departmentRef = ref(database, `departments/${departmentId}`);
  
    get(departmentRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const currentDepartment = snapshot.val();
 
          const mergedDepartment = {
            ...currentDepartment,
            ...updatedDepartment,
          };
  
          return set(departmentRef, mergedDepartment);
        } else {
          throw new Error('Department does not exist.');
        }
      })
      .then(() => {
        setDepartments((prevDepartments) =>
          prevDepartments.map((department) =>
            department.id === departmentId ? { id: departmentId, ...updatedDepartment } : department
          )
        );
        setFilteredDepartments((prevFiltered) =>
          prevFiltered.map((department) =>
            department.id === departmentId ? { id: departmentId, ...updatedDepartment } : department
          )
        );
        setShowEditDepartmentModal(false);
      })
      .catch((error) => {
        console.error('Error updating department:', error);
      });
  };

  const handleDeleteDepartment = async () => {
    if (departmentToDelete) {
      try {
        const departmentRef = ref(database, `departments/${departmentToDelete.id}`);
        await remove(departmentRef);
        setDepartments((prevDepartments) => prevDepartments.filter(department => department.id !== departmentToDelete.id));
        setFilteredDepartments((prevFiltered) => prevFiltered.filter(department => department.id !== departmentToDelete.id));
        setDepartmentToDelete(null);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Error deleting department:', error.message);
      }
    }
  };

  const confirmDeleteDepartment = (department) => {
    setDepartmentToDelete(department);
    setShowDeleteConfirm(true);
  };

  const getPermissionIcon = (permissionType) => {
    const icons = {
      accessInventory: <Shield size={14} />,
      accessOverallInventory: <Eye size={14} />,
      accessInventoryHistory: <History size={14} />,
      accessPatients: <Users size={14} />,
      accessBilling: <CreditCard size={14} />,
      accessSettings: <Settings size={14} />,
      accessLaboratory: <Settings size={14} />
    };
    return icons[permissionType] || <Shield size={14} />;
  };

  const getPermissionStats = () => {
    const totalDepts = departments.length;
    const adminDepts = departments.filter(dept => dept.id === 'Admin').length;
    const customDepts = totalDepts - adminDepts;
    
    return {
      total: totalDepts,
      admin: adminDepts,
      custom: customDepts
    };
  };

  const stats = getPermissionStats();

  return (
    <div className="w-full bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Building2 size={24} />
              <span>Departments Management</span>
            </h2>
            <p className="text-gray-600 mt-1">Manage departments and their access permissions</p>
          </div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
            onClick={() => setShowAddDepartmentModal(true)}
          >
            <Building2 size={20} />
            <span>Add Department</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-sm font-semibold text-blue-800">Total Departments</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-600">Active departments</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <h3 className="text-sm font-semibold text-purple-800">Admin Departments</h3>
            <p className="text-2xl font-bold text-purple-900">{stats.admin}</p>
            <p className="text-xs text-purple-600">System administrators</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h3 className="text-sm font-semibold text-green-800">Custom Departments</h3>
            <p className="text-2xl font-bold text-green-900">{stats.custom}</p>
            <p className="text-xs text-green-600">User-defined departments</p>
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
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Departments Table */}
        <div className="relative overflow-x-auto rounded-md shadow-sm">
          <table className="w-full text-sm text-gray-900 text-center border border-gray-200">
            <thead className="text-sm bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3">Inventory</th>
                <th className="px-4 py-3">Overall Inventory</th>
                <th className="px-4 py-3">Inventory History</th>
                <th className="px-4 py-3">Patients</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Laboratory</th>
                <th className="px-4 py-3">Settings</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((department) => (
                <tr key={department.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        department.id === 'Admin' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        <Building2 size={20} className={
                          department.id === 'Admin' ? 'text-purple-600' : 'text-blue-600'
                        } />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{department.id}</span>
                          {department.id === 'Admin' && (
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                              SYSTEM
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {department.id === 'Admin' ? 'System Administrator' : 'Custom Department'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('accessInventory')}
                      <span className={`text-sm font-medium ${
                        department.permissions?.accessInventory ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {department.permissions?.accessInventory ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('accessOverallInventory')}
                      <span className={`text-sm font-medium ${
                        department.permissions?.accessOverallInventory ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {department.permissions?.accessOverallInventory ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('accessInventoryHistory')}
                      <span className={`text-sm font-medium ${
                        department.permissions?.accessInventoryHistory ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {department.permissions?.accessInventoryHistory ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('accessPatients')}
                      <span className={`text-sm font-medium ${
                        department.permissions?.accessPatients ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {department.permissions?.accessPatients ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('accessBilling')}
                      <span className={`text-sm font-medium ${
                        department.permissions?.accessBilling ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {department.permissions?.accessBilling ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('accessLaboratory')}
                      <span className={`text-sm font-medium ${
                        department.permissions?.accessLaboratory ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {department.permissions?.accessLaboratory ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getPermissionIcon('accessSettings')}
                      <span className={`text-sm font-medium ${
                        department.permissions?.accessSettings ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {department.permissions?.accessSettings ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <button
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${
                          department.id === 'Admin' 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        disabled={department.id === 'Admin'}
                        onClick={() => {
                          setSelectedDepartment(department);
                          setShowEditDepartmentModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${
                          department.id === 'Admin'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        onClick={() => confirmDeleteDepartment(department)}
                        disabled={department.id === 'Admin'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Building2 size={32} className="text-gray-300" />
                      <span>No departments found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddDepartmentModal
        showModal={showAddDepartmentModal}
        setShowModal={setShowAddDepartmentModal}
        onAddDepartment={handleAddDepartment}
      />

      <EditDepartmentModal
        showModal={showEditDepartmentModal}
        setShowModal={setShowEditDepartmentModal}
        department={selectedDepartment}
        onEditDepartment={handleEditDepartment}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Building2 size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">Delete Department</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the department{" "}
                <span className="font-semibold">{departmentToDelete?.id}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteDepartment}
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

export default DepartmentsTable;
import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';
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

  return (
    <div className="w-full">
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
          onClick={() => setShowAddDepartmentModal(true)}
        >
          Add Department
        </button>
      </div>
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th scope="col" className="px-6 py-3">Department</th>
              <th scope="col" className="px-6 py-3">Access Inventory</th>
              <th scope="col" className="px-6 py-3">Access Overall Inventory</th>
              <th scope="col" className="px-6 py-3">Access Inventory History</th>
              <th scope="col" className="px-6 py-3">Access Patients</th>
              <th scope="col" className="px-6 py-3">Access Billing</th>
              <th scope="col" className="px-6 py-3">Access Settings</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.map((department) => (
              <tr key={department.id} className="bg-white border-b hover:bg-slate-100">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {department.id}
                </th>
                <td className="px-6 py-4">
                  <span className={department.permissions?.accessInventory ? 'text-green-600' : 'text-red-600'}>
                    {department.permissions?.accessInventory ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={department.permissions?.accessOverallInventory ? 'text-green-600' : 'text-red-600'}>
                    {department.permissions?.accessOverallInventory ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={department.permissions?.accessInventoryHistory ? 'text-green-600' : 'text-red-600'}>
                    {department.permissions?.accessInventoryHistory ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={department.permissions?.accessPatients ? 'text-green-600' : 'text-red-600'}>
                    {department.permissions?.accessPatients ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={department.permissions?.accessBilling ? 'text-green-600' : 'text-red-600'}>
                    {department.permissions?.accessBilling ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={department.permissions?.accessSettings ? 'text-green-600' : 'text-red-600'}>
                    {department.permissions?.accessSettings ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center space-x-4">
                  <button
                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    disabled={department.id === 'Admin'}
                    onClick={() => {
                      setSelectedDepartment(department);
                      setShowEditDepartmentModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                    onClick={() => confirmDeleteDepartment(department)}
                    disabled={department.id === 'Admin'}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg text-center">
              <h2 className="text-xl font-bold mb-4">Delete Department</h2>
              <p>Are you sure you want to delete the department <b>{departmentToDelete?.id}</b>?</p>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={handleDeleteDepartment}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentsTable;
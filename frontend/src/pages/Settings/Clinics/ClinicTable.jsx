import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import { Building, Search, MapPin, Phone, Mail, Activity, CheckCircle, XCircle } from 'lucide-react';
import AddClinicModal from './AddClinicModal';

const ClinicsTable = () => {
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      const clinicsRef = ref(database, 'clinics');
      const snapshot = await get(clinicsRef);
      if (snapshot.exists()) {
        const clinicsList = [];
        snapshot.forEach((childSnapshot) => {
          clinicsList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setClinics(clinicsList);
        setFilteredClinics(clinicsList);
      }
    };
    fetchClinics();
  }, []);

  useEffect(() => {
    setFilteredClinics(
      clinics.filter(clinic =>
        clinic.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, clinics]);

  const handleAddClinic = (newClinic) => {
    const clinicId = Object.keys(newClinic)[0];
    const clinicsRef = ref(database, `clinics/${clinicId}`);

    set(clinicsRef, newClinic[clinicId])
      .then(() => {
        const newEntry = { id: clinicId, ...newClinic[clinicId] };
        setClinics(prev => [...prev, newEntry]);
        setFilteredClinics(prev => [...prev, newEntry]);
        setShowAddClinicModal(false);
      })
      .catch((error) => console.error('Error adding clinic:', error));
  };

  const confirmDeleteClinic = (clinic) => {
    setClinicToDelete(clinic);
    setShowDeleteConfirm(true);
  };

  const handleDeleteClinic = async () => {
    if (clinicToDelete) {
      try {
        const clinicRef = ref(database, `clinics/${clinicToDelete.id}`);
        await remove(clinicRef);
        setClinics(prev => prev.filter(c => c.id !== clinicToDelete.id));
        setFilteredClinics(prev => prev.filter(c => c.id !== clinicToDelete.id));
        setClinicToDelete(null);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Error deleting clinic:', error.message);
      }
    }
  };

  const getClinicStats = () => {
    const totalClinics = clinics.length;
    const activeClinics = clinics.filter(clinic => clinic.isActive).length;
    const inactiveClinics = totalClinics - activeClinics;
    
    return {
      total: totalClinics,
      active: activeClinics,
      inactive: inactiveClinics
    };
  };

  const stats = getClinicStats();

  return (
    <div className="w-full bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Building size={24} />
              <span>Clinics Management</span>
            </h2>
            <p className="text-gray-600 mt-1">Manage clinic locations and information</p>
          </div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
            onClick={() => setShowAddClinicModal(true)}
          >
            <Building size={20} />
            <span>Add Clinic</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-sm font-semibold text-blue-800">Total Clinics</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-600">All clinic locations</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h3 className="text-sm font-semibold text-green-800">Active Clinics</h3>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            <p className="text-xs text-green-600">Currently operational</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
            <h3 className="text-sm font-semibold text-red-800">Inactive Clinics</h3>
            <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
            <p className="text-xs text-red-600">Temporarily closed</p>
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
              placeholder="Search clinics by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clinics Table */}
        <div className="relative overflow-x-auto rounded-md shadow-sm">
          <table className="w-full text-sm text-gray-900 text-center border border-gray-200">
            <thead className="text-sm bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Clinic Info</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClinics.map((clinic) => (
                <tr key={clinic.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        clinic.isActive ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Building size={20} className={
                          clinic.isActive ? 'text-green-600' : 'text-gray-600'
                        } />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{clinic.name}</div>
                        <div className="text-xs text-gray-500">
                          Clinic ID: {clinic.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-sm">{clinic.addressLine || 'No address'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      <Phone size={12} className="text-gray-400" />
                      <span className="text-sm">{clinic.contactNumber || 'No contact'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {clinic.type || 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {clinic.isActive ? (
                        <>
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-sm font-medium text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="text-red-500" />
                          <span className="text-sm font-medium text-red-600">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs transition-colors"
                        onClick={() => alert("Edit functionality is under construction.")}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs transition-colors"
                        onClick={() => confirmDeleteClinic(clinic)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClinics.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Building size={32} className="text-gray-300" />
                      <span>No clinics found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddClinicModal
        showModal={showAddClinicModal}
        setShowModal={setShowAddClinicModal}
        onAddClinic={handleAddClinic}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Building size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">Delete Clinic</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete clinic{" "}
                <span className="font-semibold">{clinicToDelete?.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteClinic}
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

export default ClinicsTable;
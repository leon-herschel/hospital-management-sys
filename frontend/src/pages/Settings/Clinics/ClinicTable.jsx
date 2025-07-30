import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';
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
          onClick={() => setShowAddClinicModal(true)}
        >
          Add Clinic
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Clinic Name</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClinics.map((clinic) => (
              <tr key={clinic.id} className="bg-white border-b hover:bg-slate-100">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{clinic.name}</td>
                <td className="px-6 py-4">{clinic.addressLine}</td>
                <td className="px-6 py-4">{clinic.contactNumber}</td>
                <td className="px-6 py-4">{clinic.type}</td>
                <td className="px-6 py-4">
                  <span className={clinic.isActive ? 'text-green-600' : 'text-red-600'}>
                    {clinic.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center">
                  <button
                    className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                    onClick={() => confirmDeleteClinic(clinic)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <AddClinicModal
          showModal={showAddClinicModal}
          setShowModal={setShowAddClinicModal}
          onAddClinic={handleAddClinic}
        />

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg text-center">
              <h2 className="text-xl font-bold mb-4">Delete Clinic</h2>
              <p>Are you sure you want to delete clinic <b>{clinicToDelete?.name}</b>?</p>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={handleDeleteClinic}
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

export default ClinicsTable;

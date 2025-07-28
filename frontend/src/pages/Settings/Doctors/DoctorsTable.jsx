import { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import AddDoctorsModal from './AddDoctorsModal';

const DoctorsTable = () => {
  const [doctors, setDoctors] = useState([]);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      const doctorsRef = ref(database, 'doctors');
      const snapshot = await get(doctorsRef);
      if (snapshot.exists()) {
        const doctorsList = [];
        snapshot.forEach((childSnapshot) => {
          doctorsList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setDoctors(doctorsList);
      }
    };

    fetchDoctors();
  }, []);

  const confirmDeleteDoctor = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteConfirm(true);
  };

  const handleDeleteDoctor = async () => {
    if (doctorToDelete) {
      try {
        const docRef = ref(database, `doctors/${doctorToDelete.id}`);
        await remove(docRef);
        setDoctors((prev) => prev.filter((doc) => doc.id !== doctorToDelete.id));
        setShowDeleteConfirm(false);
        setDoctorToDelete(null);
      } catch (error) {
        console.error('Error deleting doctor:', error);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Doctors</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          onClick={() => setShowAddDoctorModal(true)}
        >
          Add Doctor
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center border border-slate-200">
          <thead className="bg-slate-200 text-gray-700">
            <tr>
              <th className="px-4 py-2">Full Name</th>
              <th className="px-4 py-2">Specialty</th>
              <th className="px-4 py-2">Generalist</th>
              <th className="px-4 py-2">Specialist</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Affiliated Clinics</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id} className="border-t hover:bg-slate-100">
                <td className="px-4 py-2">{doc.fullName}</td>
                <td className="px-4 py-2">{doc.specialty}</td>
                <td className="px-4 py-2">{doc.isGeneralist ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2">{doc.isSpecialist ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2">{doc.contactNumber}</td>
                <td className="px-4 py-2">
                  <ul className="list-disc list-inside text-left">
                    {(doc.clinicAffiliations || []).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-2 flex justify-center space-x-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    onClick={() => {
                      // Open Edit Modal (not implemented yet)
                      alert('Edit functionality is under construction.');
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                    onClick={() => confirmDeleteDoctor(doc)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddDoctorsModal showModal={showAddDoctorModal} setShowModal={setShowAddDoctorModal} />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">Delete Doctor</h2>
            <p>Are you sure you want to delete <b>{doctorToDelete?.fullName}</b>?</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={handleDeleteDoctor}
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
  );
};

export default DoctorsTable;

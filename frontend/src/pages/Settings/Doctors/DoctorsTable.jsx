import { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import AddDoctorsModal from './AddDoctorsModal';
import ProfessionalFeeModal from './ProfessionalFeeModal';

const DoctorsTable = () => {
  const [doctors, setDoctors] = useState([]);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);

  useEffect(() => {
    const doctorsRef = ref(database, 'doctors');
    const unsubscribe = onValue(doctorsRef, (snapshot) => {
      const doctorsList = [];
      snapshot.forEach((childSnapshot) => {
        doctorsList.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      setDoctors(doctorsList);
    });

    return () => unsubscribe(); // Cleanup listener
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
        setShowDeleteConfirm(false);
        setDoctorToDelete(null);
      } catch (error) {
        console.error('Error deleting doctor:', error);
      }
    }
  };

  const openFeeModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowFeeModal(true);
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

      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Full Name</th>
              <th className="px-6 py-3">Specialty</th>
              <th className="px-6 py-3">Generalist</th>
              <th className="px-6 py-3">Specialist</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Affiliated Clinics</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id} className="bg-white border-b hover:bg-slate-100">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{doc.fullName}</td>
                <td className="px-6 py-4">{doc.specialty}</td>
                <td className="px-6 py-4 text-green-600">{doc.isGeneralist ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 text-green-600">{doc.isSpecialist ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4">{doc.contactNumber}</td>
                <td className="px-6 py-4 text-left">
                  <ul className="list-disc list-inside">
                    {(doc.clinicAffiliations || []).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4 flex flex-col space-y-2 items-center">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md"
                    onClick={() => alert("Edit functionality is under construction.")}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md"
                    onClick={() => openFeeModal(doc)}
                  >
                    Set Professional Fee
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md"
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

      {showFeeModal && selectedDoctor && (
        <ProfessionalFeeModal
          doctor={selectedDoctor}
          onClose={() => setShowFeeModal(false)}
        />
      )}

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

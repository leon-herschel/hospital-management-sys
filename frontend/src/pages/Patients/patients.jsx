import { ref, onValue, remove, update } from "firebase/database";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { database } from "../../firebase/firebase";
import DeleteConfirmationModal from "./DeleteConfirmationModalPatient";

import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useNavigate } from "react-router-dom";
import AddPatient from "./AddPatient";
import EditPatientModal from "./EditPatientModal"; // Import your EditPatientModal

function Patient() {
  const [patientList, setPatientList] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const roleData = useAccessControl();
  const navigate = useNavigate();

  const patientCollection = ref(database, "patient");

  const toggleModal = () => {
    setModal(!modal);
  };

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const toggleDeleteModal = () => {
    setDeleteModal(!deleteModal);
  };

  useEffect(() => {
    const unsubscribe = onValue(patientCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const patientData = Object.keys(data).map((key) => {
          const patient = {
            ...data[key],
            id: key,
          };

          if (patient.dateTime) {
            patient.dateTime = new Date(patient.dateTime).toLocaleString();
          }

          return patient;
        });

        patientData.sort((a, b) => a.name.localeCompare(b.name));
        setPatientList(patientData);
      } else {
        setPatientList([]);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [patientCollection]);

  const handleDeleteConfirmation = (patient) => {
    setCurrentPatient(patient);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    if (currentPatient) {
      await remove(ref(database, `patient/${currentPatient.id}`));
      toggleDeleteModal();
    }
  };

  const handleEdit = (patient) => {
    setCurrentPatient(patient);
    toggleEditModal();
  };

  const handleUpdate = async (updatedPatient) => {
    await update(ref(database, `patient/${currentPatient.id}`), updatedPatient);
    toggleEditModal();
  };

  // Ensure the navigate function uses the correct path
  const handleViewClick = (id) => {
    navigate(`/patients/${id}`); // Use /patients/:id to match the route
  };

  const filteredPatients = patientList.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!roleData?.accessPatients) {
    return <AccessDenied />;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by name"
          className="border border-slate-300 px-4 py-2 rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={toggleModal}
          className="ml-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
        >
          Add Patient
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Date of Birth</th>
              <th className="px-6 py-3">Age</th>
              <th className="px-6 py-3">Gender</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Type of Room</th>
              <th className="px-6 py-3">QR Code</th>
              <th className="px-6 py-3">Date and Time Created</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="bg-white border-b hover:bg-slate-100"
                >
                  <td className="px-6 py-3">{patient.name}</td>
                  <td className="px-6 py-3">{patient.birth}</td>
                  <td className="px-6 py-3">{patient.age}</td>
                  <td className="px-6 py-3">{patient.gender}</td>
                  <td className="px-6 py-3">{patient.status}</td>
                  <td className="px-6 py-3">{patient.contact}</td>
                  <td className="px-6 py-3">{patient.roomType}</td>
                  <td className="px-6 py-3">
                    <QRCode
                      size={50}
                      bgColor="white"
                      fgColor="black"
                      value={patient.id}
                    />
                  </td>
                  <td className="px-6 py-3">{patient.dateTime}</td>
                  <td className="flex flex-col px-6 py-3 space-y-2 justify-center">
                    <button
                      onClick={() => handleViewClick(patient.id)} // Redirect to the view page
                      className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(patient)}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmation(patient)}
                      className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-6 py-3">
                  No Patients
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && <AddPatient isOpen={modal} toggleModal={toggleModal} />}

      <DeleteConfirmationModal
        isOpen={deleteModal}
        toggleModal={toggleDeleteModal}
        onConfirm={handleDelete}
      />

      <EditPatientModal
        isOpen={editModal}
        toggleModal={toggleEditModal}
        currentPatient={currentPatient}
        handleUpdate={handleUpdate} // Pass the update handler
      />
    </div>
  );
}

export default Patient;

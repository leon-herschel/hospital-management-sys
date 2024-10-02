import { ref, onValue, remove, update } from "firebase/database";
import { useState, useEffect } from "react";
import AddPatient from "./AddPatient";
import QRCode from "react-qr-code";
import { database } from "../../firebase/firebase";
import View from "./ViewPatient";
import DeleteConfirmationModal from "./DeleteConfirmationModalPatient"; 
import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";

function Patient() {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false); 
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const roleData = useAccessControl(); 
  
  const patientCollection = ref(database, "patient");

  const toggleModal = () => {
    setModal(!modal);
  };

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const toggleViewModal = () => {
    setViewModal(!viewModal);
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

          // Format the dateTime to a human-readable format if it's available
          if (patient.dateTime) {
            patient.dateTime = new Date(patient.dateTime).toLocaleString();
          }

          return patient;
        });
        setPatientList(patientData);
      } else {
        setPatientList([]);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [patientCollection]);

  // Trigger the delete confirmation modal
  const handleDeleteConfirmation = (patient) => {
    setCurrentPatient(patient);
    toggleDeleteModal(); // Open the delete confirmation modal
  };

  const handleDelete = async () => {
    if (currentPatient) {
      await remove(ref(database, `patient/${currentPatient.id}`));
      toggleDeleteModal(); // Close the delete modal after deletion
    }
  };

  const handleEdit = (patient) => {
    setCurrentPatient(patient);
    toggleEditModal();
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const { name, birth, age, gender, status, contact, roomType } =
      event.target.elements;

    const updatedPatient = {
      name: name.value,
      birth: birth.value,
      age: age.value,
      gender: gender.value,
      status: status.value,
      contact: contact.value,
      roomType: roomType.value,
    };

    await update(ref(database, `patient/${currentPatient.id}`), updatedPatient);
    toggleEditModal();
  };

  const handleViewClick = (id) => {
    setSelectedPatientId(id);
    toggleViewModal();
  };

  const filteredPatients = patientList.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!roleData?.accessPatients) {
    return (
      <AccessDenied />
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by name"
          className="border border-stone-300 px-4 py-2 rounded-md"
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

      <div className="relative overflow-x-auto shadow-sm">
        <table className="w-full text-md text-gray-800 text-center border border-stone-200">
          <thead className="text-sm uppercase bg-stone-200">
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
                  className="bg-white border-b hover:bg-stone-100"
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
                      onClick={() => handleViewClick(patient.id)}
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
                      onClick={() => handleDeleteConfirmation(patient)} // Trigger delete confirmation
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

      {viewModal && (
        <View
          isOpen={viewModal}
          toggleModal={toggleViewModal}
          patientId={selectedPatientId}
        />
      )}
      {modal && <AddPatient isOpen={modal} toggleModal={toggleModal} />}

      {/* Use the DeleteConfirmationModal component */}
      <DeleteConfirmationModal
        isOpen={deleteModal}
        toggleModal={toggleDeleteModal}
        onConfirm={handleDelete} // Pass the delete action
      />

      {editModal && currentPatient && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
            <form onSubmit={handleUpdate}>
              <h2 className="text-2xl font-bold mb-6 text-center">
                Edit Patient
              </h2>

              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentPatient.name}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="birth" className="block text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="birth"
                  name="birth"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentPatient.birth}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="age" className="block text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentPatient.age}
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentPatient.gender}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <br></br>

              <div className="mb-4">
                <label htmlFor="contact" className="block text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="number"
                  id="contact"
                  name="contact"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentPatient.contact}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="status" className="block text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentPatient.status}
                >
                  <option value="" disabled>
                    Select Status
                  </option>
                  <option value="Inpatient">Inpatient</option>
                  <option value="Outpatient">Outpatient</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="roomType" className="block text-gray-700 mb-2">
                  Type of Room
                </label>
                <select
                  id="roomType"
                  name="roomType"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentPatient.roomType}
                >
                  <option value="" disabled>
                    Select Room
                  </option>
                  <option value="Private">Private</option>
                  <option value="Public">Public</option>
                </select>
              </div>
              <div className="flex justify-between space-x-4">
                <div className="w-full">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    Update
                  </button>
                </div>

                <div className="w-full">
                  <button
                    type="button"
                    onClick={toggleEditModal}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patient;

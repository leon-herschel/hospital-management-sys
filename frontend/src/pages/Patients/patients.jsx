import { ref, onValue, remove, update } from "firebase/database";
import { useState, useEffect } from "react";
import AddPatient from "./AddPatient";
import QRCode from "react-qr-code";
import { database } from "../../firebase/firebase";
import View from "./ViewPatient";

function Patient() {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    const unsubscribe = onValue(patientCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const patientData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
        }));
        setPatientList(patientData);
      } else {
        setPatientList([]);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [patientCollection]);

  const handleDelete = async (id) => {
    await remove(ref(database, `patient/${id}`));
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

  return (
    <div className="w-full">
      <div className="flex justify-center text-xl font-bold mb-4">
        <h2>PATIENT MANAGEMENT SYSTEM</h2>
      </div>
      <div className="flex justify-between items-center my-4">
        <input
          type="text"
          placeholder="Search by name"
          className="border px-4 py-2 rounded-lg w-full max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={toggleModal}
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Add Patient
        </button>
      </div>

      <div>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Date of Birth
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Age
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Gender
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Status
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Contact
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Type of Room
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                QR Code
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.birth}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.age}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.gender}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.status}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.contact}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.roomType}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <QRCode
                      size={50}
                      bgColor="white"
                      fgColor="black"
                      value={patient.id}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => handleViewClick(patient.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition duration-200 mr-2"
                    >
                      VIEW
                    </button>
                    <button
                      onClick={() => handleEdit(patient)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition duration-200 mr-2"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(patient.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-200"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="border border-gray-300 px-4 py-2 text-center"
                >
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

      {editModal && currentPatient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
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
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
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

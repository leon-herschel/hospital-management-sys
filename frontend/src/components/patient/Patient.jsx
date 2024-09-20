import { ref, onValue, remove } from "firebase/database";
import { useState, useEffect } from "react";
import AddPatient from "../components/addPatient";
import QRCode from "react-qr-code";

function Patient() {
  const [patientList, setPatientList] = useState([]);
  const [modal, setModal] = useState(false);
  const patientCollection = ref(database, "patient");

  const toggleModal = () => {
    setModal(!modal);
  };

  if (modal) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

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

  return (
    <div>
      <h2>Patient Management System</h2>
      <div>
        <button onClick={toggleModal}>Add Patient</button>
      </div>

      <div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Type of Room</th>
              <th>QR Code</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {patientList.length > 0 ? (
              patientList.map((patient) => (
                <tr key={patient.id}>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {patient.birth}
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
                      value={`Name: ${patient.name}\nDate of Birth: ${patient.birth}\nContact: ${patient.contact}\nStatus: ${patient.status}\nRoom Type: ${patient.roomType}`}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button>EDIT</button> |{" "}
                    <button onClick={() => handleDelete(patient.id)}>
                      DELETE
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="border border-gray-300 px-4 py-2 text-center"
                >
                  No Patients
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddPatient isOpen={modal} toggleModal={toggleModal} />
    </div>
  );
}

export default Patient;

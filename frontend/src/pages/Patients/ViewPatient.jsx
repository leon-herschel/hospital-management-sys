import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue, push, set } from "firebase/database";

function ViewPatient({ isOpen, toggleModal, patientId }) {
  const [patient, setPatient] = useState(null);
  const [addPrescription, setAddPrescription] = useState(false);
  const [prescriptionName, setPrescriptionName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instruction, setInstruction] = useState("");
  const [prescriptionList, setPrescriptionList] = useState([]);

  useEffect(() => {
    if (patientId) {
      const patientRef = ref(database, `patient/${patientId}`);
      const unsubscribe = onValue(patientRef, (snapshot) => {
        const data = snapshot.val();
        setPatient(data || null);
        if (data && data.prescriptions) {
          setPrescriptionList(
            Object.keys(data.prescriptions).map((key) => ({
              id: key,
              ...data.prescriptions[key],
            }))
          );
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [patientId]);

  const handleAddPrescriptionClick = () => {
    setAddPrescription((prev) => !prev);
  };

  const handleSubmit = () => {
    if (!patientId) return;

    const prescriptionRef = ref(database, `patient/${patientId}/prescriptions`);
    const newPrescriptionRef = push(prescriptionRef);

    const patientPrescription = {
      prescriptionName: prescriptionName,
      dosage: dosage,
      instruction: instruction,
    };

    set(newPrescriptionRef, patientPrescription)
      .then(() => {
        alert("Patient's prescription has been added successfully");
        setPrescriptionName("");
        setDosage("");
        setInstruction("");
      })
      .catch((error) => {
        alert("Error in adding prescription: ", error);
      });
  };

  if (!patient) return null;

  return (
    <div className="w-full h-100vh fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-2xl font-bold mb-6">View Patient</h2>
        <h3 className="text-2xl font-bold mb-6">Personal Information:</h3>
        <div>
          <div>Name: {patient.name}</div>
          <div>Date of Birth: {patient.birth}</div>
          <div>Contact Info: {patient.contact}</div>
          <br></br>

          <div>
            <span className="text-2xl font-bold mb-6">Diagnosis:</span>
            <br></br>
            {patient.diagnosis || "No diagnosis yet"}
          </div>

          <div>
            <span className="text-2xl font-bold mb-6">Medicine/s used:</span>
            <br></br>
            {patient.medUse || "No medicine used yet"}
          </div>
        </div>

        <div>
          <button onClick={handleAddPrescriptionClick} className="mb-4">
            {addPrescription ? "Hide Prescription Form" : "Add Prescription"}
          </button>
        </div>
        {!addPrescription ? (
          <div>
            {prescriptionList.map((prescription) => (
              <div key={prescription.id}>
                <div>
                  <span className="text-2xl font-bold mb-6">
                    Prescription Name:
                  </span>
                  <span>{prescription.prescriptionName}</span>
                </div>
                <div>
                  <span className="text-2xl font-bold mb-6">Dosage:</span>
                  <span>{prescription.dosage}</span>
                </div>
                <div>
                  <span className="text-2xl font-bold mb-6">Instruction:</span>
                  <span>{prescription.instruction}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-2">
              <label className="block mb-1">Prescription Name:</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded"
                onChange={(e) => setPrescriptionName(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="block mb-1">Dosage:</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded"
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="block mb-1">Instruction:</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded"
                onChange={(e) => setInstruction(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
            >
              Save Prescription
            </button>
          </div>
        )}

        <button onClick={toggleModal} className="mt-4">
          Close
        </button>
      </div>
    </div>
  );
}

export default ViewPatient;

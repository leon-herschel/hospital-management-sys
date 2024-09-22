import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";

function ViewPatient({ isOpen, toggleModal, patientId }) {
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    if (patientId) {
      const patientRef = ref(database, `patient/${patientId}`);
      const unsubscribe = onValue(patientRef, (snapshot) => {
        const data = snapshot.val();
        setPatient(data || null);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [patientId]);

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
            {patient.diagnos ? patient.diagnosis : "No diagnosis yet"}
          </div>

          <div>
            <span className="text-2xl font-bold mb-6">Medicine/s used:</span>
            <br></br>
            {patient.medUse ? patient.medUse : "No medicine used yet"}
          </div>
        </div>
        <button onClick={toggleModal}>Close</button>
      </div>
    </div>
  );
}

export default ViewPatient;

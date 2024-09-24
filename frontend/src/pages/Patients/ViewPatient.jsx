import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue, push, set, remove } from "firebase/database";

function ViewPatient({ isOpen, toggleModal, patientId }) {
  const [patient, setPatient] = useState(null);
  const [addPrescription, setAddPrescription] = useState(false);
  const [prescriptionName, setPrescriptionName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instruction, setInstruction] = useState("");
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [showRemovalConfirmation, setShowRemovalConfirmation] = useState(false);
  const [removalConfirmationId, setRemovalConfirmationId] = useState(null);
  const [errors, setErrors] = useState({
    prescriptionName: "",
    dosage: "",
    instruction: "",
  });

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

  const rendersuppliesUsed = () => {
    if (!patient.suppliesUsed) {
      return <div>No supplies used yet.</div>;
    }

    return Object.entries(patient.suppliesUsed).map(([key, supp]) => (
      <div key={key} className="border border-gray-300 p-4 mb-4 rounded">
        <div className="flex justify-between">
          <span className="font-bold">Supply Name:</span>
          <span>{supp.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Quantity:</span>
          <span>{supp.quantity}</span>
        </div>
      </div>
    ));
  };

  const renderMedUse = () => {
    if (!patient.medUse) {
      return <div>No medicine used yet.</div>;
    }

    return Object.entries(patient.medUse).map(([key, med]) => (
      <div key={key} className="border border-gray-300 p-4 mb-4 rounded">
        <div className="flex justify-between">
          <span className="font-bold">Medicine Name:</span>
          <span>{med.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Quantity:</span>
          <span>{med.quantity}</span>
        </div>
      </div>
    ));
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({ prescriptionName: "", dosage: "", instruction: "" });

    const newErrors = {};
    if (!prescriptionName)
      newErrors.prescriptionName = "Prescription Name is required.";
    if (!dosage) newErrors.dosage = "Dosage is required.";
    if (!instruction) newErrors.instruction = "Instruction is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const prescriptionRef = ref(database, `patient/${patientId}/prescriptions`);
    const newPrescriptionRef = push(prescriptionRef);

    const patientPrescription = {
      prescriptionName,
      dosage,
      instruction,
      createdAt: new Date().toISOString(),
    };

    try {
      await set(newPrescriptionRef, patientPrescription);
      setPrescriptionName("");
      setDosage("");
      setInstruction("");

      const updatedPrescriptions = await new Promise((resolve, reject) => {
        onValue(prescriptionRef, (snapshot) => {
          const prescriptions = snapshot.val() || {};
          const prescriptionsArray = Object.keys(prescriptions).map((key) => ({
            id: key,
            ...prescriptions[key],
          }));
          resolve(prescriptionsArray);
        });
      });

      setPrescriptionList(updatedPrescriptions);
      setConfirmationMessage("Prescription added successfully.");
      setShowConfirmation(true);
    } catch (error) {
      alert("Error in adding prescription: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePrescriptionClick = (id) => {
    setRemovalConfirmationId(id);
    setShowRemovalConfirmation(true);
  };

  const confirmRemovePrescription = async () => {
    const prescriptionRef = ref(
      database,
      `patient/${patientId}/prescriptions/${removalConfirmationId}`
    );
    try {
      await remove(prescriptionRef);
      setPrescriptionList((prev) =>
        prev.filter((prescription) => prescription.id !== removalConfirmationId)
      );
      setShowRemovalConfirmation(false);
      setRemovalConfirmationId(null);
      setConfirmationMessage("Prescription removed successfully.");
      setShowConfirmation(true); // Show success message
    } catch (error) {
      alert("Error in removing prescription: ", error);
    }
  };

  const renderRemovalConfirmationModal = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-60">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-xs p-6">
          <h2 className="text-lg font-bold mb-4">Remove Prescription</h2>
          <p>Are you sure you want to remove this prescription?</p>
          <div className="flex justify-between mt-4">
            <button
              onClick={confirmRemovePrescription}
              className="bg-red-500 text-white py-2 px-4 rounded"
            >
              Yes
            </button>
            <button
              onClick={() => setShowRemovalConfirmation(false)}
              className="bg-gray-500 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPrescriptions = () => {
    return prescriptionList.map((prescription) => (
      <div
        key={prescription.id}
        className="border border-gray-300 p-4 mb-4 rounded"
      >
        <div className="flex justify-between">
          <span className="font-bold">Prescription Name:</span>
          <span>{prescription.prescriptionName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Dosage:</span>
          <span>{prescription.dosage}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Instruction:</span>
          <span>{prescription.instruction}</span>
        </div>
        <button
          onClick={() => handleRemovePrescriptionClick(prescription.id)}
          className="mt-2 bg-red-500 text-white py-1 px-2 rounded"
        >
          Remove
        </button>
      </div>
    ));
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
  };

  if (!patient) return null;

  return (
    <div className="w-full h-100vh fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative overflow-y-auto max-h-[80vh]">
        <h2 className="text-2xl font-bold mb-6">View Patient</h2>
        <h3 className="text-2xl font-bold mb-6">Personal Information:</h3>
        <div>
          <div>Name: {patient.name}</div>
          <div>Date of Birth: {patient.birth}</div>
          <div>Contact Info: {patient.contact}</div>
          <br />
          <div>
            <span className="text-2xl font-bold mb-6">Diagnosis:</span>
            <br />
            {patient.diagnosis || "No diagnosis yet"}
          </div>
          <div>
            <span className="text-2xl font-bold mb-6">Medicine/s used:</span>
            <br />
            {renderMedUse()}
          </div>
          <div>
            <span className="text-2xl font-bold mb-6">Supplies used:</span>
            <br />
            {rendersuppliesUsed()}
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleAddPrescriptionClick}
            className="mb-4 bg-blue-500 text-white py-2 px-4 rounded"
          >
            {addPrescription ? "Hide Prescription Form" : "Add Prescription"}
          </button>
        </div>

        {!addPrescription ? (
          <div>{renderPrescriptions()}</div>
        ) : (
          <div className="mt-4">
            <div className="mb-2">
              <label className="block mb-1">Prescription Name:</label>
              <input
                type="text"
                className={`w-full border ${
                  errors.prescriptionName ? "border-red-500" : "border-gray-300"
                } p-2 rounded`}
                value={prescriptionName}
                onChange={(e) => setPrescriptionName(e.target.value)}
              />
              {errors.prescriptionName && (
                <span className="text-red-500 text-sm">
                  {errors.prescriptionName}
                </span>
              )}
            </div>

            <div className="mb-2">
              <label className="block mb-1">Dosage:</label>
              <input
                type="text"
                className={`w-full border ${
                  errors.dosage ? "border-red-500" : "border-gray-300"
                } p-2 rounded`}
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
              {errors.dosage && (
                <span className="text-red-500 text-sm">{errors.dosage}</span>
              )}
            </div>

            <div className="mb-2">
              <label className="block mb-1">Instruction:</label>
              <input
                type="text"
                className={`w-full border ${
                  errors.instruction ? "border-red-500" : "border-gray-300"
                } p-2 rounded`}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              {errors.instruction && (
                <span className="text-red-500 text-sm">
                  {errors.instruction}
                </span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Prescription"}
            </button>
          </div>
        )}

        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xs p-6">
              <h2 className="text-lg font-bold mb-4">Success</h2>
              <p>{confirmationMessage}</p>
              <button
                onClick={handleConfirmationClose}
                className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showRemovalConfirmation && renderRemovalConfirmationModal()}

        <button
          onClick={toggleModal}
          className="absolute top-3 right-3 text-gray-600 text-xl p-2"
        >
          X
        </button>
      </div>
    </div>
  );
}

export default ViewPatient;

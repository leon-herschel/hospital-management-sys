import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import DeleteConfirmationModal from "./DeleteConfirmationModalPrescription"; // Import the modal
import { generatePDF } from "./GeneratePDF";
function ViewPatient() {
  const { id } = useParams(); // Use 'id' as specified in the route "/patients/:id"
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const [patient, setPatient] = useState(null);
  const [addPrescription, setAddPrescription] = useState(false);
  const [prescriptionName, setPrescriptionName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instruction, setInstruction] = useState("");
  const [editingId, setEditingId] = useState(null); // To track the prescription being edited
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [errors, setErrors] = useState({
    prescriptionName: "",
    dosage: "",
    instruction: "",
  });

  const [removeModalOpen, setRemoveModalOpen] = useState(false); // State to control modal visibility
  const [prescriptionToRemove, setPrescriptionToRemove] = useState(null); // State to store the prescription to remove

  // Fetch patient data when the component loads
  const handleGeneratePDF = () => {
    setTimeout(() => {
      if (patient) {
      generatePDF(patient);
      }
  }, 100);
  };

  // Fetch patient data and prescriptions when the component loads
  useEffect(() => {
    if (id) {
      const patientRef = ref(database, `patient/${id}`);
      const unsubscribe = onValue(patientRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPatient(data);
          setPrescriptionList(
            data.prescriptions
              ? Object.keys(data.prescriptions).map((key) => ({
                  id: key,
                  ...data.prescriptions[key],
                }))
              : []
          );
        } else {
          setPatient(null); // If no patient data, handle it
        }
        setLoading(false); // Update loading state after fetching data
      });

      return () => {
        unsubscribe(); // Clean up the listener
      };
    }
  }, [id]);


  const handleAddPrescriptionClick = () => {
    setAddPrescription(true);
  };

  const handleCancelPrescriptionClick = () => {
    setAddPrescription(false);
    setPrescriptionName("");
    setDosage("");
    setInstruction("");
    setEditingId(null); // Reset the editing mode
  };

  const handleSubmit = async () => {
    setErrors({ prescriptionName: "", dosage: "", instruction: "" });

    const newErrors = {};
    if (!prescriptionName) newErrors.prescriptionName = "Prescription Name is required.";
    if (!dosage) newErrors.dosage = "Dosage is required.";
    if (!instruction) newErrors.instruction = "Instruction is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const prescriptionRef = ref(database, `patient/${id}/prescriptions`);

    const patientPrescription = {
      prescriptionName,
      dosage,
      instruction,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        // If editing, update the existing prescription
        const updateRef = ref(database, `patient/${id}/prescriptions/${editingId}`);
        await update(updateRef, patientPrescription);
        setConfirmationMessage("Prescription updated successfully.");
      } else {
        // If adding a new prescription
        const newPrescriptionRef = push(prescriptionRef);
        await set(newPrescriptionRef, patientPrescription);
        setConfirmationMessage("Prescription added successfully.");
      }

      // Clear form fields and reset editing mode
      setPrescriptionName("");
      setDosage("");
      setInstruction("");
      setAddPrescription(false);
      setEditingId(null);

      // Fetch updated list of prescriptions
      const updatedPrescriptions = await new Promise((resolve) => {
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
      setShowConfirmation(true);
    } catch (error) {
      alert("Error in processing prescription: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePrescriptionClick = (prescriptionId) => {
    // Set the prescription to remove and open the modal
    setPrescriptionToRemove(prescriptionId);
    setRemoveModalOpen(true);
  };

  const confirmRemovePrescription = async () => {
    const prescriptionRef = ref(database, `patient/${id}/prescriptions/${prescriptionToRemove}`);
    try {
      await remove(prescriptionRef);
      setPrescriptionList((prev) => prev.filter((prescription) => prescription.id !== prescriptionToRemove));
      setConfirmationMessage("Prescription removed successfully.");
      setShowConfirmation(true);
    } catch (error) {
      alert("Error removing prescription: ", error);
    } finally {
      // Close the modal
      setRemoveModalOpen(false);
    }
  };

  const handleEditPrescriptionClick = (prescription) => {
    setPrescriptionName(prescription.prescriptionName);
    setDosage(prescription.dosage);
    setInstruction(prescription.instruction);
    setEditingId(prescription.id); // Track the prescription being edited
    setAddPrescription(true); // Show the form in edit mode
  };

  // Render the list of prescriptions
  const renderPrescriptions = () => {
    return prescriptionList.map((prescription) => (
      <div key={prescription.id} className="border border-gray-300 p-4 mb-4 rounded">
        <div>
          <span className="font-bold">Prescription Name:</span> {prescription.prescriptionName}
        </div>
        <div>
          <span className="font-bold">Dosage:</span> {prescription.dosage}
        </div>
        <div>
          <span className="font-bold">Instruction:</span> {prescription.instruction}
        </div>
        <div>
          <span className="font-bold">Timestamp:</span>{" "}
          {prescription.createdAt}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => handleEditPrescriptionClick(prescription)}
            className="bg-yellow-500 text-white py-1 px-2 rounded"
          >
            Edit
          </button>
          <button
            onClick={() => handleRemovePrescriptionClick(prescription.id)}
            className="bg-red-500 text-white py-1 px-2 rounded"
          >
            Remove
          </button>
        </div>
      </div>
    ));
  };

  
const renderMedUse = () => {
  if (!patient || !patient.medUse) {
    return <div>No medicines used yet.</div>;
  }

  return Object.entries(patient.medUse).map(([key, med]) => (
    <div key={key} className="border border-gray-300 p-4 mb-4 rounded">
      <div className="">
        <span className="font-bold">Medicine Name:</span>
        <span className="ml-2">{med.name}</span>
      </div>
      <div className="">
        <span className="font-bold">Quantity:</span>
        <span className="ml-2">{med.quantity}</span>
      </div>
    </div>
  ));
};

// Render supplies used by the patient
const renderSuppliesUsed = () => {
  if (!patient || !patient.suppliesUsed) {
    return <div>No supplies used yet.</div>;
  }

  return Object.entries(patient.suppliesUsed).map(([key, supp]) => (
    <div key={key} className="border border-gray-300 p-4 mb-4 rounded">
      <div className="">
        <span className="font-bold">Supply Name:</span>
        <span className="ml-2">{supp.name}</span>
      </div>
      <div className="">
        <span className="font-bold">Quantity:</span>
        <span className="ml-2">{supp.quantity}</span>
      </div>
    </div>
  ));
};


  // Show a loading state until data is fetched
  if (loading) return <div>Loading...</div>;

  if (!patient) return <div>Patient not found</div>;

  return (
    <div className="container mx-auto p-6">
      {/* Back Button */}
      <button
        className="mb-4 bg-gray-500 text-white py-2 px-4 rounded"
        onClick={() => navigate("/patients")} // Navigate back to the patients list
      >
        Back to Patients List
      </button>

      <h1 className="text-2xl font-bold mb-4">Patient Details</h1>
      <div className="mb-4">
        <strong>Name:</strong> {patient.firstName}
      </div>
      <div className="mb-4">
        <strong>Last Name:</strong> {patient.lastName}
      </div>
      <div className="mb-4">
        <strong>Date of Birth:</strong> {patient.birth}
      </div>
      <div className="mb-4">
        <strong>Contact:</strong> {patient.contact}
      </div>
      <div className="mb-4">
        <strong>Status:</strong> {patient.status}
      </div>
      {patient.diagnosis && (
        <div className="mb-4">
          <strong>Diagnosis:</strong> {patient.diagnosis}
        </div>
      )}
      <div className="mb-4">
  {patient.status === "Inpatient" ? (
    <>
      <strong>Room Type:</strong> {patient.roomType}
    </>
  ) : null}
</div>

      {/* Render supplies used */}
      <div className="mb-4">
        <strong>Supplies Used:</strong>
        {renderSuppliesUsed()}
      </div>

      {/* Render medicines used */}
      <div className="mb-4">
        <strong>Medicines Used:</strong>
        {renderMedUse()}
      </div>

      {/* Render prescriptions only if the patient is Outpatient */}
      {patient.status === "Outpatient" && prescriptionList.length > 0 && (
        <div className="mb-4">
          <strong>Prescriptions:</strong>
          {renderPrescriptions()}
        </div>
      )}

      {addPrescription && patient.status === "Outpatient" ? (
        <div className="mt-4">
          <div className="mb-2">
            <label className="block mb-1">Prescription Name:</label>
            <input
              type="text"
              className={`w-full border ${errors.prescriptionName ? "border-red-500" : "border-gray-300"} p-2 rounded`}
              value={prescriptionName}
              onChange={(e) => setPrescriptionName(e.target.value)}
            />
            {errors.prescriptionName && (
              <span className="text-red-500 text-sm">{errors.prescriptionName}</span>
            )}
          </div>

          <div className="mb-2">
            <label className="block mb-1">Dosage:</label>
            <input
              type="text"
              className={`w-full border ${errors.dosage ? "border-red-500" : "border-gray-300"} p-2 rounded`}
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
            {errors.dosage && <span className="text-red-500 text-sm">{errors.dosage}</span>}
          </div>

          <div className="mb-2">
            <label className="block mb-1">Instruction:</label>
            <input
              type="text"
              className={`w-full border ${errors.instruction ? "border-red-500" : "border-gray-300"} p-2 rounded`}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
            {errors.instruction && <span className="text-red-500 text-sm">{errors.instruction}</span>}
          </div>
          

          <div className="flex justify-between mt-4">
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white py-2 px-4 rounded"
              disabled={loading}
            >
              {editingId ? "Update Prescription" : "Add Prescription"}
            </button>
            <button
              onClick={handleCancelPrescriptionClick}
              className="bg-gray-500 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        patient.status === "Outpatient" && (
          <button
            onClick={handleAddPrescriptionClick}
            className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
          >
            Add Prescription
          </button>
        )
      )}

      <button className="bg-gray-500 text-white py-2 px-4 rounded" onClick={handleGeneratePDF}> Generate PDF</button>
      {/* Confirmation Modal for Removing Prescriptions */}
      <DeleteConfirmationModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={confirmRemovePrescription}
        message="Are you sure you want to remove this prescription?"
      />
    </div>
  );
}

export default ViewPatient;

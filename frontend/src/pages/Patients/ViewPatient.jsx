import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import DeleteConfirmationModal from "./DeleteConfirmationModalPrescription";
import { generatePDF } from "./GeneratePDF";
import MedicineTable from "./MedicineTable"; // Import MedicineTable
import SupplyTable from "./SupplyTable"; // Import SupplyTable

function ViewPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("supplies"); // State for active tab
  const [addPrescription, setAddPrescription] = useState(false);
  const [prescriptionName, setPrescriptionName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instruction, setInstruction] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [errors, setErrors] = useState({
    prescriptionName: "",
    dosage: "",
    instruction: "",
  });

  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [prescriptionToRemove, setPrescriptionToRemove] = useState(null);

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
          setPatient(null);
        }
        setLoading(false);
      });

      return () => {
        unsubscribe();
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
    setEditingId(null);
  };

  const handleSubmit = async () => {
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
    const prescriptionRef = ref(database, `patient/${id}/prescriptions`);

    const patientPrescription = {
      prescriptionName,
      dosage,
      instruction,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const updateRef = ref(
          database,
          `patient/${id}/prescriptions/${editingId}`
        );
        await update(updateRef, patientPrescription);
        setConfirmationMessage("Prescription updated successfully.");
      } else {
        const newPrescriptionRef = push(prescriptionRef);
        await set(newPrescriptionRef, patientPrescription);
        setConfirmationMessage("Prescription added successfully.");
      }

      setPrescriptionName("");
      setDosage("");
      setInstruction("");
      setAddPrescription(false);
      setEditingId(null);

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
    setPrescriptionToRemove(prescriptionId);
    setRemoveModalOpen(true);
  };

  const confirmRemovePrescription = async () => {
    const prescriptionRef = ref(
      database,
      `patient/${id}/prescriptions/${prescriptionToRemove}`
    );
    try {
      await remove(prescriptionRef);
      setPrescriptionList((prev) =>
        prev.filter((prescription) => prescription.id !== prescriptionToRemove)
      );
      setConfirmationMessage("Prescription removed successfully.");
      setShowConfirmation(true);
    } catch (error) {
      alert("Error removing prescription: ", error);
    } finally {
      setRemoveModalOpen(false);
    }
  };

  const handleEditPrescriptionClick = (prescription) => {
    setPrescriptionName(prescription.prescriptionName);
    setDosage(prescription.dosage);
    setInstruction(prescription.instruction);
    setEditingId(prescription.id);
    setAddPrescription(true);
  };

  if (loading) return <div>Loading...</div>;
  if (!patient) return <div>Patient not found</div>;

  const medicines = patient.medUse ? Object.values(patient.medUse) : [];
  const supplies = patient.suppliesUsed ? Object.values(patient.suppliesUsed) : [];

  return (
    <div className="container mx-auto p-6">
      <button
        className="mb-4 bg-gray-500 text-white py-2 px-4 rounded"
        onClick={() => navigate("/patients")}
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

      {/* Tabs for Supplies Used and Medicines Used */}
      <div className="mb-4">
        <div className="flex">
          <button
            className={`py-2 px-4 ${
              activeTab === "supplies"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-tl rounded-tr`}
            onClick={() => setActiveTab("supplies")}
          >
            Supplies Used
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === "medicines"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-tl rounded-tr`}
            onClick={() => setActiveTab("medicines")}
          >
            Medicines Used
          </button>
        </div>

        <div className="border-t border-gray-300 p-4">
          {activeTab === "supplies" ? (
            supplies.length > 0 ? (
              <SupplyTable supplies={supplies} />
            ) : (
              <div>No supplies used yet.</div>
            )
          ) : medicines.length > 0 ? (
            <MedicineTable medicines={medicines} />
          ) : (
            <div>No medicines used yet.</div>
          )}
        </div>
      </div>

      {patient.status === "Outpatient" && prescriptionList.length > 0 && (
        <div className="mb-4">
          <strong>Prescriptions:</strong>
          {prescriptionList.map((prescription) => (
            <div
              key={prescription.id}
              className="border border-gray-300 p-4 mb-4 rounded"
            >
              <div>
                <span className="font-bold">Prescription Name:</span>{" "}
                {prescription.prescriptionName}
              </div>
              <div>
                <span className="font-bold">Dosage:</span> {prescription.dosage}
              </div>
              <div>
                <span className="font-bold">Instruction:</span>{" "}
                {prescription.instruction}
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
          ))}
        </div>
      )}

      {addPrescription && patient.status === "Outpatient" ? (
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
              <span className="text-red-500 text-sm">{errors.instruction}</span>
            )}
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

      <button
        className="bg-gray-500 text-white py-2 px-4 rounded"
        onClick={() => generatePDF(patient)}
      >
        Generate PDF
      </button>

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

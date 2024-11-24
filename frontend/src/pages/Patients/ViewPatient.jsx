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
    <div className="container mx-auto p-1">
      <button
        className="mb-4 bg-gray-500 text-white py-2 px-4 rounded"
        onClick={() => navigate("/patients")}
      >
        Back to Patients List
      </button>
      <div className="md:flex no-wrap md:-mx-2">
        {/* Left Side */}
        <div className="w-full md:w-3/12 md:mx-2">
          <div className="bg-white p-4 border-t-4 border-green-400">
            <div className="image overflow-hidden">
            </div>
            <h1 className="text-gray-900 font-bold text-xl leading-8 my-1">{patient.firstName} {patient.lastName}</h1>
            <h3 className="text-gray-600 font-lg text-semibold leading-6">Patient</h3>
            <ul className="bg-gray-100 text-gray-600 hover:text-gray-700 hover:shadow py-2 px-3 mt-3 divide-y rounded shadow-sm">
              <li className="flex items-center py-3">
                <span>Status</span>
                <span className="ml-auto">
                  <span className={`py-1 px-2 rounded text-white text-sm ${patient.status === 'Inpatient' ? 'bg-green-500' : 'bg-blue-500'}`}>
                    {patient.status}
                  </span>
                </span>
              </li>
              <li className="flex items-center py-3">
                <span>Admission Date</span>
                <span className="ml-auto">{patient.dateTime}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-9/12 md:mx-2">
          <div className="bg-white p-3 shadow-sm rounded-sm">
            <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8">
              <span className="text-green-500">
                <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <span className="tracking-wide">About</span>
            </div>
            <div className="text-gray-700">
              <div className="grid md:grid-cols-2">
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2 font-semibold">First Name</div>
                  <div className="px-4 py-2">{patient.firstName}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2 font-semibold">Last Name</div>
                  <div className="px-4 py-2">{patient.lastName}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2 font-semibold">Gender</div>
                  <div className="px-4 py-2">{patient.gender}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2 font-semibold">Contact No.</div>
                  <div className="px-4 py-2">{patient.contact}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2 font-semibold">Date of Birth</div>
                  <div className="px-4 py-2">{patient.birth}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2 font-semibold">Type of Room</div>
                  <div className="px-4 py-2">{patient.roomType}</div>
                </div>
              </div>
            </div>
            <button className="block w-full text-blue-800 text-sm font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:shadow-outline focus:bg-gray-100 hover:shadow-xs p-3 my-4">
              Show Full Information
            </button>
          </div>
        </div>
      </div>

      {/* Supplies and Medicines */}
      <div className="mt-4">
        <div className="flex">
          <button
            className={`py-2 px-4 ${
              activeTab === "supplies" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            } rounded-tl rounded-tr`}
            onClick={() => setActiveTab("supplies")}
          >
            Supplies Used
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === "medicines" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
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

      <button
        className="bg-gray-500 text-white py-2 px-4 rounded"
        onClick={() => generatePDF(patient)}
      >
        Generate PDF
      </button>
    </div>

  );
}

export default ViewPatient;

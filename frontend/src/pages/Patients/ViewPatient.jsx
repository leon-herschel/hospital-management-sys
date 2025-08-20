import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, push, set, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";

// Components
import PatientSidebar from "./PatientSidebar";
import PatientOverviewTab from "./PatientOverview";
import PatientItemUsageTab from "./PatientItemUsageTab";
import PatientLabTestsTab from "./PatientLabTestTab";
import PatientMedicalConditionsTab from "./PatientMedicalConditionsTab";
import DeleteConfirmationModal from "./DeleteConfirmationModalPrescription";
import LabResultsModal from "./labResultModal";

// Hooks and utilities
import { usePatientData } from "./UsePatientData";
import { formatTimestamp, getStatusBadge, getTestName, getUserName } from "./PatientUtils";
import { generatePatientHistoryPDF } from "./generatePatientHistoryPDF";

// Icons
import {
  ArrowLeft,
  Plus,
  Download,
  Activity,
  Package,
  TestTube,
  FileText,
} from "lucide-react";

function ViewPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Use custom hook for data management - ADD patientMedicalHistory to destructuring
  const {
    patient,
    loading,
    inventoryItems,
    labTests,
    prescriptionList,
    medicalServices,
    users,
    patientMedicalHistory, // <-- ADD THIS LINE
    filteredItems,
    filteredLabTests,
    filteredMedicalConditions,
    searchQuery,
    setSearchQuery,
    labSearchQuery,
    setLabSearchQuery,
    medicalConditionsSearchQuery,
    setMedicalConditionsSearchQuery,
    selectedStatus,
    setSelectedStatus,
    dateRange,
    setDateRange,
    formatMedicalConditions
  } = usePatientData(id);
  
  // UI states
  const [activeTab, setActiveTab] = useState("overview");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLabExpanded, setIsLabExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showLabModal, setShowLabModal] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Prescription form states
  const [addPrescription, setAddPrescription] = useState(false);
  const [prescriptionName, setPrescriptionName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instruction, setInstruction] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [prescriptionToRemove, setPrescriptionToRemove] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [errors, setErrors] = useState({
    prescriptionName: "",
    dosage: "",
    instruction: "",
  });

  // Prescription handlers
  const handleAddPrescriptionClick = () => setAddPrescription(true);

  const handleCancelPrescriptionClick = () => {
    setAddPrescription(false);
    setPrescriptionName("");
    setDosage("");
    setInstruction("");
    setEditingId(null);
    setErrors({});
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

    const prescriptionRef = ref(database, `patients/${id}/prescriptions`);
    const patientPrescription = {
      prescriptionName,
      dosage,
      instruction,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const updateRef = ref(database, `patients/${id}/prescriptions/${editingId}`);
        await update(updateRef, patientPrescription);
        setConfirmationMessage("Prescription updated successfully.");
      } else {
        const newPrescriptionRef = push(prescriptionRef);
        await set(newPrescriptionRef, patientPrescription);
        setConfirmationMessage("Prescription added successfully.");
      }

      handleCancelPrescriptionClick();
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error in processing prescription: ", error);
    }
  };

  const handleRemovePrescriptionClick = (prescriptionId) => {
    setPrescriptionToRemove(prescriptionId);
    setRemoveModalOpen(true);
  };

  const confirmRemovePrescription = async () => {
    const prescriptionRef = ref(database, `patients/${id}/prescriptions/${prescriptionToRemove}`);
    try {
      await remove(prescriptionRef);
      setConfirmationMessage("Prescription removed successfully.");
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error removing prescription: ", error);
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

  const handleSaveLabResult = (labData) => {
    console.log("Saving lab result:", labData);
    // Upload to Firebase Storage & save reference under patient
  };

  // Helper functions for components
  const getTestNameWithServices = (serviceId, fallbackName) => 
    getTestName(serviceId, fallbackName, medicalServices);
  
  const getUserNameWithUsers = (userId, fallbackName) => 
    getUserName(userId, fallbackName, users);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">😷</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600 mb-4">The requested patient record could not be found.</p>
          <button
            onClick={() => navigate("/patients")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: Activity },
    { id: "itemUsage", name: "Item Usage", icon: Package },
    { id: "labTests", name: "Lab Tests", icon: TestTube },
    { id: "medicalConditions", name: "Medical History", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/patients")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Patients</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLabModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lab Result</span>
              </button>
              <button
                onClick={() => generatePatientHistoryPDF(patient, inventoryItems, labTests, users, medicalServices)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Patient Info Sidebar */}
          <div className="lg:col-span-1">
            <PatientSidebar patient={patient} id={id} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <PatientOverviewTab
                    inventoryItems={inventoryItems}
                    labTests={labTests}
                    prescriptionList={prescriptionList}
                    formatTimestamp={formatTimestamp}
                    getTestName={getTestNameWithServices}
                    medicalServices={medicalServices}
                  />
                )}

                {activeTab === "itemUsage" && (
                  <PatientItemUsageTab
                    filteredItems={filteredItems}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    formatTimestamp={formatTimestamp}
                    inventoryItems={inventoryItems}
                  />
                )}

                {activeTab === "labTests" && (
                  <PatientLabTestsTab
                    filteredLabTests={filteredLabTests}
                    labSearchQuery={labSearchQuery}
                    setLabSearchQuery={setLabSearchQuery}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    isLabExpanded={isLabExpanded}
                    setIsLabExpanded={setIsLabExpanded}
                    getTestName={getTestNameWithServices}
                    getUserName={getUserNameWithUsers}
                    getStatusBadge={getStatusBadge}
                    formatTimestamp={formatTimestamp}
                    labTests={labTests}
                  />
                )}

                {activeTab === "medicalConditions" && (
                  <PatientMedicalConditionsTab
                    // Now patientMedicalHistory is properly defined
                    patientMedicalHistory={patientMedicalHistory}
                    patientId={id}
                    
                    // Keep your existing props for backward compatibility
                    filteredMedicalConditions={filteredMedicalConditions}
                    medicalConditionsSearchQuery={medicalConditionsSearchQuery}
                    setMedicalConditionsSearchQuery={setMedicalConditionsSearchQuery}
                    formatMedicalConditions={formatMedicalConditions}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LabResultsModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        onSave={handleSaveLabResult}
      />

      <DeleteConfirmationModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={confirmRemovePrescription}
        title="Remove Prescription"
        message="Are you sure you want to remove this prescription? This action cannot be undone."
      />

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Success</h3>
            </div>
            <p className="text-gray-600 mb-6">{confirmationMessage}</p>
            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewPatient;
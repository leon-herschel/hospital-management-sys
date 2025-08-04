import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import DeleteConfirmationModal from "./DeleteConfirmationModalPrescription";
import { generatePDF } from "./GeneratePDF";
import { generatePatientHistoryPDF } from "./generatePatientHistoryPDF";
import MedicineTable from "./MedicineTable"; // Import MedicineTable
import SupplyTable from "./SupplyTable"; // Import SupplyTable
import LabResultsModal from "./labResultModal";
import ItemUsageTable from "./ItemUsagetable";

function ViewPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("itemUsage"); // State for active tab
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
  const [showLabModal, setShowLabModal] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]); // State for inventory items
  const [labTests, setLabTests] = useState([]); // New state for lab tests
  const [medicalServices, setMedicalServices] = useState({}); // New state for medical services
  const [users, setUsers] = useState({}); // New state for users data
  const [searchQuery, setSearchQuery] = useState('');
  const [labSearchQuery, setLabSearchQuery] = useState(''); // New search for lab tests
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLabExpanded, setIsLabExpanded] = useState(false); // New expand state for lab tests

  // Fetch patient data, inventory transactions, lab tests, and users when the component loads
  useEffect(() => {
    if (id) {
      const fetchPatientData = async () => {
        const patientRef = ref(database, `patients/${id}`);
        const inventoryTransactionsRef = ref(database, "inventoryTransactions");
        const medicalServicesRef = ref(database, "medicalServicesTransactions");
        const medicalServicesDataRef = ref(database, "medicalServices/laboratoryTests");
        const usersRef = ref(database, "users"); // Add users reference

        // Get patient info
        onValue(patientRef, (snapshot) => {
          setPatient(snapshot.val() || null);
          setLoading(false);
        });

        // Get users data for mapping user IDs to names
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val() || {};
          setUsers(data);
        });

        // Get medical services data for mapping service IDs to names
        onValue(medicalServicesDataRef, (snapshot) => {
          const data = snapshot.val() || {};
          setMedicalServices(data);
        });

        // Get inventory transactions for this patient
        onValue(inventoryTransactionsRef, (snapshot) => {
          const data = snapshot.val() || {};
          const patientTransactions = Object.entries(data)
            .filter(([_, transaction]) => {
              // Filter transactions that are related to this patient
              return transaction.relatedPatientId?.trim() === id?.trim() && 
                     transaction.transactionType === "usage";
            })
            .map(([key, transaction]) => ({
              id: key,
              itemName: transaction.itemName || "Unknown Item",
              quantity: Math.abs(transaction.quantityChanged) || 0, // Make quantity positive for display
              processedByUserFirstName: transaction.processedByUserFirstName || "Unknown",
              processedByUserLastName: transaction.processedByUserLastName || "",
              timestamp: transaction.timestamp || "Unknown",
              reason: transaction.reason || "",
              sourceDepartment: transaction.sourceDepartment || "",
              transactionType: transaction.transactionType || ""
            }))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by newest first

          setInventoryItems(patientTransactions);
        });

        // Get lab tests for this patient
        onValue(medicalServicesRef, (snapshot) => {
          const data = snapshot.val() || {};
          const patientLabTests = Object.entries(data)
            .filter(([_, transaction]) => {
              // Filter lab test transactions for this patient
              return transaction.patientId?.trim() === id?.trim() && 
                     transaction.serviceCategory === "laboratoryTests";
            })
            .map(([key, transaction]) => ({
              id: key,
              serviceId: transaction.serviceId || "", // Keep serviceId for mapping
              serviceName: transaction.serviceName || "Unknown Test",
              patientNotes: transaction.patientNotes || "",
              requestedBy: transaction.requestedBy || "", // This should be the user ID
              requestedByName: transaction.requestedByName || "Unknown", // Keep existing fallback
              department: transaction.department || "",
              status: transaction.status || "pending",
              resultStatus: transaction.resultStatus || "pending",
              sampleStatus: transaction.sampleStatus || "pending",
              urgentFlag: transaction.urgentFlag || false,
              createdAt: transaction.createdAt || "Unknown",
              updatedAt: transaction.updatedAt || "Unknown",
              transactionType: transaction.transactionType || ""
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

          setLabTests(patientLabTests);
        });
      };

      fetchPatientData();
    }
  }, [id]);

  // Function to get test name from serviceId
  const getTestName = (serviceId, fallbackName) => {
    if (medicalServices[serviceId]) {
      return medicalServices[serviceId].name;
    }
    return fallbackName || "Unknown Test";
  };

  // Function to get user name from user ID
  const getUserName = (userId, fallbackName) => {
    if (userId && users[userId]) {
      const user = users[userId];
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      return `${firstName} ${lastName}`.trim() || fallbackName || "Unknown User";
    }
    return fallbackName || "Unknown User";
  };

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
    const prescriptionRef = ref(database, `patients/${id}/prescriptions`);

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
          `patients/${id}/prescriptions/${editingId}`
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

  const handleSaveLabResult = (labData) => {
    console.log("Saving lab result:", labData);
    // Later: Upload to Firebase Storage & save reference under patient
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) return <div>Loading...</div>;
  if (!patient) return <div>Patient not found</div>;

  // Filter items based on search query
  const filteredItems = inventoryItems.filter(item => {
    const itemName = item.itemName || '';
    const processedBy = `${item.processedByUserFirstName} ${item.processedByUserLastName}`.trim();
    
    return itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           processedBy.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter lab tests based on search query
  const filteredLabTests = labTests.filter(test => {
    const testName = getTestName(test.serviceId, test.serviceName);
    const requestedBy = getUserName(test.requestedBy, test.requestedByName);
    const department = test.department || '';
    
    return testName.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
           requestedBy.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
           department.toLowerCase().includes(labSearchQuery.toLowerCase());
  });

  const itemsToShow = isExpanded ? filteredItems : filteredItems.slice(0, 10);
  const labTestsToShow = isLabExpanded ? filteredLabTests : filteredLabTests.slice(0, 10);

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
            <div className="image overflow-hidden"></div>
            <h1 className="text-gray-900 font-bold text-xl leading-8 my-1">
              {patient.firstName} {patient.lastName}
            </h1>
            <h3 className="text-gray-600 font-lg text-semibold leading-6">
              Patient
            </h3>
            <ul className="bg-gray-100 text-gray-600 hover:text-gray-700 hover:shadow py-2 px-3 mt-3 divide-y rounded shadow-sm">
              <li className="flex items-center py-3">
                <span>Blood Type:</span>
                <span className="ml-auto">
                  {patient.bloodType}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-9/12 md:mx-2">
          <div className="bg-white p-3 shadow-sm rounded-sm">
            <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8">
              <span className="text-green-500">
                <svg
                  className="h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
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
                  <div className="px-4 py-2">{patient.contactNumber}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2 font-semibold">Date of Birth</div>
                  <div className="px-4 py-2">{patient.dateOfBirth}</div>
                </div>
              </div>
            </div>
            <button className="block w-full text-blue-800 text-sm font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:shadow-outline focus:bg-gray-100 hover:shadow-xs p-3 my-4">
              Show Full Information
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 mb-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => setShowLabModal(true)}
        >
          Add Laboratory Result
        </button>
      </div>

      <LabResultsModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        onSave={handleSaveLabResult}
      />

      {/* Tab Navigation */}
      <div className="mt-8 bg-white shadow-sm rounded-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("itemUsage")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "itemUsage"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Item Usage History
            </button>
            <button
              onClick={() => setActiveTab("labTests")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "labTests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Laboratory Tests History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "itemUsage" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Item Usage History</h2>
              
              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  className="border px-4 py-2 rounded w-full"
                  placeholder="Search by item name or processed by..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Items Table */}
              {filteredItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {inventoryItems.length === 0 ? "No item usage history found." : "No matching items found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity Used
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processed By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemsToShow.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.processedByUserFirstName} {item.processedByUserLastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimestamp(item.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.sourceDepartment}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Show More/Less Button */}
              {filteredItems.length > 10 && (
                <div className="mt-4 text-center">
                  <button
                    className="text-blue-600 hover:text-blue-800 underline"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Show Less" : `Show All (${filteredItems.length} items)`}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "labTests" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Laboratory Tests History</h2>
              
              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  className="border px-4 py-2 rounded w-full"
                  placeholder="Search by test name, requested by, or department..."
                  value={labSearchQuery}
                  onChange={(e) => setLabSearchQuery(e.target.value)}
                />
              </div>

              {/* Lab Tests Table */}
              {filteredLabTests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {labTests.length === 0 ? "No laboratory test history found." : "No matching tests found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Test Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sample Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Urgent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {labTestsToShow.map((test) => (
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getTestName(test.serviceId, test.serviceName)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(test.status)}`}>
                              {test.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(test.resultStatus)}`}>
                              {test.resultStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(test.sampleStatus)}`}>
                              {test.sampleStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getUserName(test.requestedBy, test.requestedByName)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {test.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimestamp(test.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {test.urgentFlag ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Urgent
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {test.patientNotes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Show More/Less Button */}
              {filteredLabTests.length > 10 && (
                <div className="mt-4 text-center">
                  <button
                    className="text-blue-600 hover:text-blue-800 underline"
                    onClick={() => setIsLabExpanded(!isLabExpanded)}
                  >
                    {isLabExpanded ? "Show Less" : `Show All (${filteredLabTests.length} tests)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          onClick={() => generatePatientHistoryPDF(patient, inventoryItems, labTests, users, medicalServices)}
        >
          Generate PDF Report
        </button>
      </div>
    </div>
  );
}

export default ViewPatient;
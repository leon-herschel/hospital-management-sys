import { useState, useEffect, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { formatMedicalConditions, getTestName, getUserName } from "./PatientUtils";

export const usePatientData = (id) => {
  // Core state
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [inventoryItems, setInventoryItems] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [medicalServices, setMedicalServices] = useState({});
  const [users, setUsers] = useState({});
  const [patientMedicalHistory, setPatientMedicalHistory] = useState({});
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [labSearchQuery, setLabSearchQuery] = useState("");
  const [medicalConditionsSearchQuery, setMedicalConditionsSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    const patientRef = ref(database, `patients/${id}`);
    const inventoryTransactionsRef = ref(database, "inventoryTransactions");
    const medicalServicesRef = ref(database, "medicalServicesTransactions");
    const medicalServicesDataRef = ref(database, "medicalServices/laboratoryTests");
    const usersRef = ref(database, "users");
    const prescriptionsRef = ref(database, `patients/${id}/prescriptions`);
    const medicalHistoryRef = ref(database, 'patientMedicalHistory');

    // Get patient info
    onValue(patientRef, (snapshot) => {
      setPatient(snapshot.val() || null);
      setLoading(false);
    });

    // Get users data
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUsers(data);
    });

    // Get medical services data
    onValue(medicalServicesDataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMedicalServices(data);
    });

    // Get prescriptions
    onValue(prescriptionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const prescriptionsArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setPrescriptionList(prescriptionsArray);
    });

    // Get medical history
    onValue(medicalHistoryRef, (snapshot) => {
      const data = snapshot.val();
      setPatientMedicalHistory(data || {});
    });

    // Get inventory transactions
    onValue(inventoryTransactionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const patientTransactions = Object.entries(data)
        .filter(([_, transaction]) => {
          return (
            transaction.relatedPatientId?.trim() === id?.trim() &&
            transaction.transactionType === "usage"
          );
        })
        .map(([key, transaction]) => ({
          id: key,
          itemName: transaction.itemName || "Unknown Item",
          quantity: Math.abs(transaction.quantityChanged) || 0,
          processedByUserFirstName: transaction.processedByUserFirstName || "Unknown",
          processedByUserLastName: transaction.processedByUserLastName || "",
          timestamp: transaction.timestamp || "Unknown",
          reason: transaction.reason || "",
          sourceDepartment: transaction.sourceDepartment || "",
          transactionType: transaction.transactionType || "",
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setInventoryItems(patientTransactions);
    });

    // Get lab tests
    onValue(medicalServicesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const patientLabTests = Object.entries(data)
        .filter(([_, transaction]) => {
          return (
            transaction.patientId?.trim() === id?.trim() &&
            transaction.serviceCategory === "laboratoryTests"
          );
        })
        .map(([key, transaction]) => ({
          id: key,
          serviceId: transaction.serviceId || "",
          serviceName: transaction.serviceName || "Unknown Test",
          patientNotes: transaction.patientNotes || "",
          requestedBy: transaction.requestedBy || "",
          requestedByName: transaction.requestedByName || "Unknown",
          department: transaction.department || "",
          status: transaction.status || "pending",
          resultStatus: transaction.resultStatus || "pending",
          sampleStatus: transaction.sampleStatus || "pending",
          urgentFlag: transaction.urgentFlag || false,
          createdAt: transaction.createdAt || "Unknown",
          updatedAt: transaction.updatedAt || "Unknown",
          transactionType: transaction.transactionType || "",
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setLabTests(patientLabTests);
    });
  };

  // Filtered data with memoization
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const itemName = item.itemName || "";
      const processedBy = `${item.processedByUserFirstName} ${item.processedByUserLastName}`.trim();
      const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          processedBy.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (dateRange !== "all") {
        const itemDate = new Date(item.timestamp);
        const now = new Date();
        const daysAgo = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        return matchesSearch && itemDate >= cutoffDate;
      }
      
      return matchesSearch;
    });
  }, [inventoryItems, searchQuery, dateRange]);

  const filteredLabTests = useMemo(() => {
    return labTests.filter((test) => {
      const testName = getTestName(test.serviceId, test.serviceName, medicalServices);
      const requestedBy = getUserName(test.requestedBy, test.requestedByName, users);
      const department = test.department || "";
      
      const matchesSearch = testName.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
                          requestedBy.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
                          department.toLowerCase().includes(labSearchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === "all" || test.status === selectedStatus;
      
      if (dateRange !== "all") {
        const testDate = new Date(test.createdAt);
        const now = new Date();
        const daysAgo = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        return matchesSearch && matchesStatus && testDate >= cutoffDate;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [labTests, labSearchQuery, selectedStatus, dateRange, medicalServices, users]);

  const filteredMedicalConditions = useMemo(() => {
    const medicalConditionsList = formatMedicalConditions(patient?.medicalConditions);
    return medicalConditionsList.filter((condition) => {
      return condition.condition.toLowerCase().includes(medicalConditionsSearchQuery.toLowerCase()) ||
             condition.description.toLowerCase().includes(medicalConditionsSearchQuery.toLowerCase());
    });
  }, [patient?.medicalConditions, medicalConditionsSearchQuery]);

  return {
    // Data
    patient,
    loading,
    inventoryItems,
    labTests,
    prescriptionList,
    medicalServices,
    users,
    patientMedicalHistory,
    
    // Filtered data
    filteredItems,
    filteredLabTests,
    filteredMedicalConditions,
    
    // Search states
    searchQuery,
    setSearchQuery,
    labSearchQuery,
    setLabSearchQuery,
    medicalConditionsSearchQuery,
    setMedicalConditionsSearchQuery,
    
    // Filter states
    selectedStatus,
    setSelectedStatus,
    dateRange,
    setDateRange,
    
    // Helper functions
    formatMedicalConditions: () => formatMedicalConditions(patient?.medicalConditions)
  };
};
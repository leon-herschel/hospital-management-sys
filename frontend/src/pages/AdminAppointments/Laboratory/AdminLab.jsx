import { useEffect, useState } from "react";
import {
  ref,
  onValue,
  update,
  remove,
  push,
  get,
  query,
  orderByChild,
  equalTo,
  set,
} from "firebase/database";
import { database } from "../../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import DeleteAppointmentModal from "./DeleteAppointmentModal";
import AddMedicalServices from "./AddMedicalServicesModal";
import ViewAppointmentModal from "./ViewAppointmentModal";

// Simple toast implementation (replace with your preferred toast library)
const toast = {
  success: (message) => {
    console.log("SUCCESS:", message);
    alert(`✅ ${message}`);
  },
  error: (message) => {
    console.log("ERROR:", message);
    alert(`❌ ${message}`);
  },
  info: (message) => {
    console.log("INFO:", message);
    alert(`ℹ️ ${message}`);
  },
};

function AdminLabAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [errors, setErrors] = useState({});
  const [filterTest, setFilterTest] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All"); // New status filter
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    const refApp = ref(database, `appointments/laboratory`);
    onValue(refApp, (snap) => {
      const data = snap.val();
      if (data) setAppointments(data);
    });

    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const openModal = (type, id) => {
    setModalType(type);
    setCurrentId(id);
    setModalOpen(true);
    if (type === "view") setEditForm({ ...appointments[id] });
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setCurrentId(null);
    setEditForm({});
    setErrors({});
  };

  const confirmDelete = () => {
    remove(ref(database, `appointments/laboratory/${currentId}`));
    closeModal();
  };

  // Handle status update - FIXED VERSION
  const handleStatusUpdate = async (labId, newStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [labId]: true }));

    try {
      const labRef = ref(database, `appointments/laboratory/${labId}`);

      // Step 1: Update status in appointments
      await update(labRef, {
        status: newStatus,
        ...(newStatus === "Confirmed" && {
          confirmedAt: new Date().toISOString(),
        }),
      });

      // Step 2: If Confirmed, push to patients (after checking for duplicates)
      if (newStatus === "Confirmed") {
        const snapshot = await get(labRef);
        const appointmentData = snapshot.val();

        if (!appointmentData) {
          console.error("No appointment data found for labId:", labId);
          toast.error("No appointment data found.");
          return;
        }

        const { email } = appointmentData;

        if (!email) {
          toast.error("No email found in appointment data.");
          return;
        }

        // Simplified duplicate check - just check if labId already exists in patients
        const patientRef = ref(database, `patients/${labId}`);
        const patientSnapshot = await get(patientRef);

        if (patientSnapshot.exists()) {
          toast.info("Appointment already exists in patients list.");
          return;
        }

        const dataToPush = { ...appointmentData, labId };
        await set(ref(database, `patients/${labId}`), dataToPush);

        toast.success("Status confirmed and patient added successfully.");
      } else {
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Error updating status or pushing to patients:", error);
      toast.error("Failed to update status or push to patients.");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [labId]: false }));
    }
  };

  // Get all unique test types
  const testTypes = [
    ...new Set(
      Object.values(appointments)
        .map((a) => a.labTestName)
        .filter(Boolean)
    ),
  ];

  // Filter appointments by search, test type, and status
  const filteredAppointments = Object.entries(appointments).filter(
    ([_, app]) => {
      const matchesTest =
        filterTest === "All" || app.labTestName === filterTest;
      const matchesStatus =
        filterStatus === "All" || (app.status || "Pending") === filterStatus;
      const matchesSearch =
        !searchTerm ||
        app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.labTestName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTest && matchesStatus && matchesSearch;
    }
  );

  // Get status counts for ALL appointments (not filtered)
  const allStatusCounts = Object.values(appointments).reduce(
    (acc, app) => {
      const status = app.status || "Pending";
      acc.total++;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { total: 0, Completed: 0, Confirmed: 0, Pending: 0, Cancelled: 0 }
  );

  // Get test type counts
  const testTypeCounts = testTypes.reduce((acc, testType) => {
    acc[testType] = Object.values(appointments).filter(
      (app) => app.labTestName === testType
    ).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <span className="text-2xl">🧪</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Laboratory Bookings
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage and track patient appointments by test type
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setModalType("AddMedicalService");
                setModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Booking
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview Cards - Now Clickable */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setFilterStatus("All")}
            className={`bg-white rounded-xl shadow-sm border p-6 text-center transition-all hover:shadow-md ${
              filterStatus === "All"
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {allStatusCounts.total}
            </div>
            <div className="text-sm text-gray-500">Total</div>
          </button>

          <button
            onClick={() => setFilterStatus("Completed")}
            className={`bg-white rounded-xl shadow-sm border p-6 text-center transition-all hover:shadow-md ${
              filterStatus === "Completed"
                ? "ring-2 ring-green-500 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {allStatusCounts.Completed}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </button>

          <button
            onClick={() => setFilterStatus("Confirmed")}
            className={`bg-white rounded-xl shadow-sm border p-6 text-center transition-all hover:shadow-md ${
              filterStatus === "Confirmed"
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {allStatusCounts.Confirmed}
            </div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </button>

          <button
            onClick={() => setFilterStatus("Pending")}
            className={`bg-white rounded-xl shadow-sm border p-6 text-center transition-all hover:shadow-md ${
              filterStatus === "Pending"
                ? "ring-2 ring-yellow-500 bg-yellow-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mx-auto mb-3">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {allStatusCounts.Pending}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </button>

          <button
            onClick={() => setFilterStatus("Cancelled")}
            className={`bg-white rounded-xl shadow-sm border p-6 text-center transition-all hover:shadow-md ${
              filterStatus === "Cancelled"
                ? "ring-2 ring-red-500 bg-red-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mx-auto mb-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {allStatusCounts.Cancelled}
            </div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </button>
        </div>

        {/* Active Filters Display */}
        {(filterStatus !== "All" || filterTest !== "All" || searchTerm) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  Active Filters:
                </span>
                <div className="flex space-x-2">
                  {filterStatus !== "All" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Status: {filterStatus}
                    </span>
                  )}
                  {filterTest !== "All" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Test: {filterTest}
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setFilterStatus("All");
                  setFilterTest("All");
                  setSearchTerm("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Filter by Test Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Filter by Test Type
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterTest("All")}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTest === "All"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Tests
              <span className="ml-2 text-xs bg-white bg-opacity-20 text-current px-2 py-1 rounded-full">
                {allStatusCounts.total}
              </span>
            </button>
            {testTypes.map((testType) => (
              <button
                key={testType}
                onClick={() => setFilterTest(testType)}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterTest === testType
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {testType}
                <span className="ml-2 text-xs bg-white bg-opacity-20 text-current px-2 py-1 rounded-full">
                  {testTypeCounts[testType]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by patient name, email, or test type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredAppointments.length}
            </span>
            {filteredAppointments.length === 1
              ? " appointment"
              : " appointments"}
            {filterStatus !== "All" && (
              <span>
                {" "}
                with status "
                <span className="font-semibold">{filterStatus}</span>"
              </span>
            )}
            {filterTest !== "All" && (
              <span>
                {" "}
                for "<span className="font-semibold">{filterTest}</span>"
              </span>
            )}
            {searchTerm && (
              <span>
                {" "}
                matching "<span className="font-semibold">{searchTerm}</span>"
              </span>
            )}
          </p>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-8 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Patient</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Contact</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                <span>Test Type</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Complaints</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Doctor</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Schedule</span>
              </div>
              <div className="text-center">Status</div>
              <div className="text-center">Actions</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredAppointments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    No appointments found
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                  {(filterStatus !== "All" ||
                    filterTest !== "All" ||
                    searchTerm) && (
                    <button
                      onClick={() => {
                        setFilterStatus("All");
                        setFilterTest("All");
                        setSearchTerm("");
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredAppointments.map(([id, app]) => (
                <div
                  key={id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-8 gap-4 items-center">
                    {/* Patient */}
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-semibold text-sm">
                          {app.patientName?.charAt(0)?.toUpperCase() || "P"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {app.patientName || "Unknown Patient"}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {app.contactNumber || "No phone"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {app.email || "No email"}
                      </p>
                    </div>

                    {/* Test Type */}
                    <div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {app.labTestName || "General Test"}
                      </span>
                    </div>

                    {/* Complaints */}
                    <div className="min-w-0">
                      <p
                        className="text-sm text-gray-900 truncate"
                        title={app.patientComplaint || "No complaints"}
                      >
                        {app.patientComplaint || "No complaints"}
                      </p>
                    </div>

                    {/* Doctor */}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {app.referDoctor ? `Dr. ${app.referDoctor}` : "Walk-in"}
                      </p>
                    </div>

                    {/* Schedule */}
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {app.slotNumber
                          ? `Slot ${app.slotNumber}`
                          : "Not scheduled"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {app.estimatedTime || "No time set"}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      <div className="relative">
                        <select
                          value={app.status || "Pending"}
                          onChange={(e) =>
                            handleStatusUpdate(id, e.target.value)
                          }
                          disabled={updatingStatus[id]}
                          className={`
                            text-xs font-medium px-3 py-2 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer min-w-[90px] text-center shadow-sm
                            ${
                              app.status === "Confirmed"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : ""
                            }
                            ${
                              app.status === "Completed"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : ""
                            }
                            ${
                              app.status === "Cancelled"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : ""
                            }
                            ${
                              !app.status || app.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : ""
                            }
                          `}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                          {updatingStatus[id] ? (
                            <svg
                              className="animate-spin h-3 w-3 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <svg
                              className="h-3 w-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => openModal("view", id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors shadow-sm"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => openModal("delete", id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors shadow-sm"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewAppointmentModal
        open={modalOpen && modalType === "view"}
        onClose={closeModal}
        form={editForm}
        appointmentId={currentId}
      />

      <DeleteAppointmentModal
        open={modalOpen && modalType === "delete"}
        onClose={closeModal}
        onConfirm={confirmDelete}
      />

      <AddMedicalServices
        open={modalOpen && modalType === "AddMedicalService"}
        onClose={closeModal}
      />
    </div>
  );
}

export default AdminLabAppointments;

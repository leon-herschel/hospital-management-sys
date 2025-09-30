import { useState, useEffect } from "react";
import { ref, onValue, remove, update, get } from "firebase/database";
import { database } from "../../../firebase/firebase";
import DeleteConfirmationModal from "./DeleteConfirmationModalBooking";
import ViewBookingModal from "./ViewBookingModal";
import AddBooking from "./AddBooking";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Trash2,
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  User,
  Phone,
  MapPin,
  ClipboardList,
  UserCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Grid3x3,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Settings,
  MoreVertical,
  Edit,
} from "lucide-react";

function AdminConsult() {
  const navigate = useNavigate();
  const [bookingList, setBookingList] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All"); // New status filter
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [patientsMap, setPatientsMap] = useState({});
  const [doctorsMap, setDoctorsMap] = useState({});
  const [viewMode, setViewMode] = useState("comfortable"); // compact, comfortable, spacious

  // Pagination states - Optimized to 15 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Date filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // Fetch patients
    const patientsRef = ref(database, "patients");
    const unsubscribePatients = onValue(patientsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setPatientsMap(data);
    });

    // Fetch doctors
    const doctorsRef = ref(database, "doctors");
    const unsubscribeDoctors = onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setDoctorsMap(data);
    });

    // Fetch consultation types
    const typesRef = ref(database, "medicalServices/consultationTypes");
    const typesUnsubscribe = onValue(typesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const types = Object.values(data).map((service) => service.name);
        setConsultationTypes(["All", ...types]);
      } else {
        setConsultationTypes(["All"]);
      }
    });

    return () => {
      unsubscribePatients();
      unsubscribeDoctors();
      typesUnsubscribe();
    };
  }, []);

  // Separate useEffect for bookings to ensure patients and doctors are loaded first
  useEffect(() => {
    if (
      Object.keys(patientsMap).length === 0 &&
      Object.keys(doctorsMap).length === 0
    ) {
      return; // Wait for patients and doctors to load
    }

    // Fetch bookings
    const bookingRef = ref(database, "appointments");
    const bookingsUnsubscribe = onValue(bookingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookings = Object.keys(data).map((key) => {
          const booking = data[key];

          // Map patient data using patientId
          const patientData = patientsMap[booking.patientId] || {};

          // Map doctor data using doctorId
          const doctorData = doctorsMap[booking.doctorId] || {};

          return {
            id: key,
            ...booking,
            patient: patientData, // Patient info mapped from patientId
            doctor: doctorData, // Doctor info mapped from doctorId
          };
        });

        // Sort by patient first name
        bookings.sort((a, b) =>
          (a.patient.firstName || "").localeCompare(b.patient.firstName || "")
        );
        setBookingList(bookings);
      } else {
        setBookingList([]);
      }
      setLoading(false);
    });

    return () => {
      bookingsUnsubscribe();
    };
  }, [patientsMap, doctorsMap]);

  const toggleModal = () => setModal(!modal);
  const toggleViewModal = () => setViewModal(!viewModal);
  const toggleDeleteModal = () => setDeleteModal(!deleteModal);

  const handleDeleteConfirmation = (booking) => {
    setCurrentBooking(booking);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    if (currentBooking) {
      await remove(ref(database, `appointments/${currentBooking.id}`));
      toggleDeleteModal();
    }
  };

  const handleView = (booking) => {
    setCurrentBooking(booking);
    toggleViewModal();
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [bookingId]: true }));
    try {
      // Update appointment status
      await update(ref(database, `appointments/${bookingId}`), {
        status: newStatus,
        ...(newStatus === "Confirmed" && {
          confirmedAt: new Date().toISOString(),
        }),
      });

      if (newStatus === "Confirmed") {
        const appointmentRef = ref(database, `appointments/${bookingId}`);
        const snapshot = await get(appointmentRef);
        const appointmentData = snapshot.val();

        if (!appointmentData) throw new Error("Appointment not found");
        if (!appointmentData.patientId)
          throw new Error("patientId missing in appointment");

        const patientRef = ref(
          database,
          `patients/${appointmentData.patientId}`
        );
        const patientSnap = await get(patientRef);
        if (!patientSnap.exists()) throw new Error("Patient not found");

        // Example: Append appointmentId to patient's confirmedAppointments list
        const patientData = patientSnap.val();
        const updatedAppointments = [
          ...(patientData.confirmedAppointments || []),
          bookingId,
        ];

        await update(patientRef, {
          confirmedAppointments: updatedAppointments,
        });

        console.log(
          `Status updated and linked to patient ${appointmentData.patientId}`
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.message || "Failed to update status");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const filteredBookings = bookingList.filter((booking) => {
    const name = `${booking.patient?.firstName || ""} ${
      booking.patient?.lastName || ""
    }`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || booking.type === selectedType;

    // Status filtering - normalize status values
    const bookingStatus = booking.status || "pending";
    const matchesStatus =
      selectedStatus === "All" || bookingStatus === selectedStatus;

    // Date filtering
    let matchesDate = true;
    if (startDate || endDate) {
      const appointmentDate = new Date(booking.appointmentDate);
      if (startDate) {
        matchesDate = matchesDate && appointmentDate >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && appointmentDate <= new Date(endDate);
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedStatus, startDate, endDate]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const getStats = () => {
    // Get all bookings first, then apply type filter if needed
    const typeFilteredBookings =
      selectedType === "All"
        ? bookingList
        : bookingList.filter((b) => b.type === selectedType);

    return {
      total: typeFilteredBookings.length,
      completed: typeFilteredBookings.filter((b) => b.status === "completed")
        .length,
      pending: typeFilteredBookings.filter(
        (b) => !b.status || b.status === "pending"
      ).length,
      confirmed: typeFilteredBookings.filter((b) => b.status === "confirmed")
        .length,
      cancelled: typeFilteredBookings.filter((b) => b.status === "cancelled")
        .length,
    };
  };

  const stats = getStats();

  // Handle status filter clicks
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle,
          class: "bg-emerald-50 text-emerald-700 border-emerald-200",
          color: "text-emerald-600",
        };
      case "confirmed":
        return {
          icon: CheckCircle,
          class: "bg-blue-50 text-blue-700 border-blue-200",
          color: "text-blue-600",
        };
      case "cancelled":
        return {
          icon: AlertTriangle,
          class: "bg-red-50 text-red-700 border-red-200",
          color: "text-red-600",
        };
      default:
        return {
          icon: Clock,
          class: "bg-amber-50 text-amber-700 border-amber-200",
          color: "text-amber-600",
        };
    }
  };

  // Get row height based on view mode
  const getRowHeight = () => {
    switch (viewMode) {
      case "compact":
        return "py-3";
      case "spacious":
        return "py-6";
      default:
        return "py-4";
    }
  };

  // Pagination component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, "...");
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push("...", totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="bg-white px-6 py-4 border-t border-gray-200 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredBookings.length)} of{" "}
              {filteredBookings.length} results
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setCurrentPage(1);
                // You could implement dynamic items per page here
              }}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={20}>20 per page</option>
              <option value={25}>25 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNumber, index) => (
                <button
                  key={index}
                  onClick={() =>
                    typeof pageNumber === "number" &&
                    handlePageChange(pageNumber)
                  }
                  disabled={pageNumber === "..."}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pageNumber === currentPage
                      ? "bg-blue-600 text-white"
                      : pageNumber === "..."
                      ? "text-gray-400 cursor-default"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section - Optimized */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Consultation Bookings
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage and track patient appointments
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Dashboard - Interactive and Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {/* Total Appointments Card */}
            <button
              onClick={() => handleStatusFilter("All")}
              className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left w-full ${
                selectedStatus === "All"
                  ? "ring-4 ring-blue-200 bg-blue-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Appointments
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">All bookings</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              {selectedStatus === "All" && (
                <div className="mt-3 text-xs text-blue-600 font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Currently selected
                </div>
              )}
            </button>

            {/* Completed Appointments Card */}
            <button
              onClick={() => handleStatusFilter("completed")}
              className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left w-full ${
                selectedStatus === "completed"
                  ? "ring-4 ring-emerald-200 bg-emerald-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    {stats.completed}
                  </p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              {selectedStatus === "completed" && (
                <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  Currently filtered
                </div>
              )}
            </button>

            {/* Confirmed Appointments Card */}
            <button
              onClick={() => handleStatusFilter("confirmed")}
              className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left w-full ${
                selectedStatus === "confirmed"
                  ? "ring-4 ring-blue-200 bg-blue-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {stats.confirmed}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              {selectedStatus === "confirmed" && (
                <div className="mt-3 text-xs text-blue-600 font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Currently filtered
                </div>
              )}
            </button>

            {/* Pending Appointments Card */}
            <button
              onClick={() => handleStatusFilter("pending")}
              className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left w-full ${
                selectedStatus === "pending"
                  ? "ring-4 ring-amber-200 bg-amber-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">
                    {stats.pending}
                  </p>
                </div>
                <div className="bg-amber-100 p-3 rounded-2xl">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              {selectedStatus === "pending" && (
                <div className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  Currently filtered
                </div>
              )}
            </button>
          </div>

          {/* Consultation Type Tabs - Enhanced */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              {/*
               <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Filter by Consultation Type
                </h3>
              </div>
              */}

              {/* View Mode Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <div className="flex rounded-lg bg-gray-100 p-1">
                  {["compact", "comfortable", "spacious"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        viewMode === mode
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/*
            <div className="flex flex-wrap gap-2">
              {consultationTypes.map((type) => {
                // Map UI label to database value
                const typeMap = {
                  All: "All",
                  "General Consultation": "general_consultation",
                  "Follow-up Consultation": "follow_up_consultation",
                  "Specialist Consultation": "specialist_consultation",
                  // add more if needed
                };

                const count =
                  type === "All"
                    ? bookingList.length
                    : bookingList.filter((b) => b.type === typeMap[type])
                        .length;

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedType === type
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {type}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        selectedType === type
                          ? "bg-white/20 text-white"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div> */}
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="h-5 w-5" />
                  <span className="font-medium">Date Range:</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-colors"
                  />
                  <span className="text-gray-400 font-medium">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-colors"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={clearDateFilters}
                      className="px-4 py-3 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Results Summary */}
            <div className="mt-6 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {currentBookings.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredBookings.length}
                  </span>{" "}
                  results
                </span>
                {(selectedType !== "All" ||
                  selectedStatus !== "All" ||
                  startDate ||
                  endDate) && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600 font-medium">
                      Filtered view
                    </span>
                    {selectedStatus !== "All" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Status: {selectedStatus}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {(selectedStatus !== "All" || selectedType !== "All") && (
                  <button
                    onClick={() => {
                      setSelectedStatus("All");
                      setSelectedType("All");
                    }}
                    className="text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1 rounded-lg text-xs transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
                <span className="text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table Section - Optimized Layout */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {/* Priority Column 1: Patient (40%) */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-2/5">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient
                    </div>
                  </th>

                  {/* Priority Column 2: Schedule (25%) */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Schedule
                    </div>
                  </th>

                  {/* Priority Column 3: Status (15%) */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                    Status
                  </th>

                  {/* Priority Column 4: Type (10%) */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Type
                  </th>

                  {/* Priority Column 5: Actions (10%) */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentBookings.length > 0 ? (
                  currentBookings.map((booking, index) => {
                    const statusConfig = getStatusConfig(booking.status);
                    const StatusIcon = statusConfig.icon;
                    const patientName = `${booking.patient?.firstName || ""} ${
                      booking.patient?.lastName || ""
                    }`.trim();

                    return (
                      <tr
                        key={booking.id}
                        className={`hover:bg-blue-50 transition-all duration-200 cursor-pointer ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                        onClick={() => handleView(booking)}
                      >
                        {/* Patient Column - Enhanced */}
                        <td className={`px-6 ${getRowHeight()}`}>
                          <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {(
                                booking.patient?.firstName?.charAt(0) || "P"
                              ).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-base font-semibold text-gray-900">
                                {patientName || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {booking.patient?.contactNumber ||
                                    booking.patient?.phone ||
                                    "N/A"}
                                </span>
                                {booking.patient?.complaints?.filter(Boolean)
                                  .length > 0 && (
                                  <span className="flex items-center gap-1 text-orange-600">
                                    <ClipboardList className="h-3 w-3" />
                                    {
                                      booking.patient.complaints.filter(Boolean)
                                        .length
                                    }{" "}
                                    complaint
                                    {booking.patient.complaints.filter(Boolean)
                                      .length > 1
                                      ? "s"
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Schedule Column */}
                        <td className={`px-6 ${getRowHeight()}`}>
                          <div>
                            <div className="text-base font-semibold text-gray-900">
                              {booking.appointmentDate
                                ? new Date(
                                    booking.appointmentDate
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {booking.appointmentTime || "Time not set"}
                            </div>
                            {booking.doctor?.fullName && (
                              <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                <UserCircle className="h-3 w-3" />
                                {booking.doctor.fullName}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td
                          className={`px-6 ${getRowHeight()}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative">
                            <select
                              value={booking.status || "pending"}
                              onChange={(e) =>
                                handleStatusUpdate(booking.id, e.target.value)
                              }
                              disabled={updatingStatus[booking.id]}
                              className={`inline-flex items-center gap-2 px-3 py-2 pr-8 rounded-xl text-sm font-medium border appearance-none cursor-pointer transition-all duration-200 ${
                                statusConfig.class
                              } ${
                                updatingStatus[booking.id]
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:shadow-md"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updatingStatus[booking.id] && (
                              <RotateCw className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </td>

                        {/* Type Column */}
                        <td className={`px-6 ${getRowHeight()}`}>
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-purple-100 text-purple-800">
                            {booking.type || "General"}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td
                          className={`px-6 ${getRowHeight()}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(booking)}
                              className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteConfirmation(booking)}
                              className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No appointments found
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                          {searchQuery ||
                          selectedType !== "All" ||
                          startDate ||
                          endDate
                            ? "Try adjusting your filters to see more results."
                            : "Create your first appointment to get started."}
                        </p>
                        {!searchQuery &&
                          selectedType === "All" &&
                          !startDate &&
                          !endDate && (
                            <button
                              onClick={toggleModal}
                              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              Add New Appointment
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationComponent />
        </div>
      </div>

      {/* Modals */}
      <AddBooking modal={modal} toggleModal={toggleModal} />
      <ViewBookingModal
        isOpen={viewModal}
        toggleModal={toggleViewModal}
        currentBooking={currentBooking}
      />
      <DeleteConfirmationModal
        isOpen={deleteModal}
        toggleModal={toggleDeleteModal}
        onConfirm={handleDelete}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
      />
    </div>
  );
}

export default AdminConsult;

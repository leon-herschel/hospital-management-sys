import React, { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { update, ref, get, set } from "firebase/database";
import { database } from "../../../firebase/firebase";
import {
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

function ViewBookingModal({ isOpen, toggleModal, currentBooking }) {
  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    address: "",
    complaints: [],
    doctor: "",
    date: "",
    time: "",
    status: "Pending",
    type: "",
    clinicName: "",
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (currentBooking) {
      const {
        patient,
        doctor,
        appointmentDate,
        appointmentTime,
        clinicName,
        type,
        status,
      } = currentBooking;
      setBookingData({
        name: `${patient?.patientFirstName || ""} ${
          patient?.patientLastName || ""
        }`.trim(),
        phone: patient?.phone || "",
        address: patient?.address || "",
        complaints: patient?.complaints?.filter(Boolean) || [],
        doctor: doctor || "",
        date: appointmentDate || "",
        time: appointmentTime || "",
        status: status || "Pending",
        type: type || "General",
        clinicName: clinicName || "",
      });
    }
  }, [currentBooking]);

  const getStatusConfig = (status) => {
    switch (status) {
      case "Completed":
        return {
          icon: CheckCircleIcon,
          class: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "Confirmed":
        return {
          icon: CheckCircleIcon,
          class: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "Cancelled":
        return {
          icon: ExclamationTriangleIcon,
          class: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return {
          icon: ClockIcon,
          class: "bg-amber-50 text-amber-700 border-amber-200",
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    } catch {
      return dateString;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    if (!currentBooking?.id) return;

    setUpdatingStatus(true);

    try {
      // 1. Update the appointment status
      await update(ref(database, `appointments/${currentBooking.id}`), {
        status: newStatus,
        ...(newStatus === "Confirmed" && {
          confirmedAt: new Date().toISOString(),
        }),
      });

      // 2. Only push to patients node if status is "Confirmed"
      if (newStatus === "Confirmed") {
        // Get the full appointment data
        const appointmentRef = ref(
          database,
          `appointments/${currentBooking.id}`
        );
        const snapshot = await get(appointmentRef);
        const appointmentData = snapshot.val();

        // Check if appointment data exists
        if (!appointmentData) {
          console.error(
            "No appointment data found for bookingId:",
            currentBooking.id
          );
          alert("No appointment data found.");
          return;
        }

        // Check if patient data exists
        if (!appointmentData.patient) {
          console.error("No patient information found in appointment data");
          alert("No patient information found.");
          return;
        }

        console.log("Appointment data to push:", appointmentData);

        // 3. Set the appointment data directly under bookingId in patients node
        await set(
          ref(database, `patients/${currentBooking.id}`),
          appointmentData
        );

        console.log(
          `Status updated to ${newStatus} and appointment data pushed to patients for booking ${currentBooking.id}`
        );
      } else {
        console.log(
          `Status updated to ${newStatus} for booking ${currentBooking.id}`
        );
      }

      // Update local state
      setBookingData((prev) => ({ ...prev, status: newStatus }));

      // Show success message
      alert(`Status successfully updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status or pushing to patients:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen || !currentBooking) return null;

  const statusConfig = getStatusConfig(bookingData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-11/12 sm:w-2/3 md:w-1/2 lg:w-2/5 max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-6 text-white relative">
          <button
            onClick={toggleModal}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Appointment Details</h2>
              <p className="text-blue-100 text-sm">
                View and manage patient information
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
              Patient Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Full Name
                </label>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {bookingData.name || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4" />
                  Phone Number
                </label>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {bookingData.phone || "N/A"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                Address
              </label>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                {bookingData.address || "N/A"}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
              Medical Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Patient Complaints
              </label>
              {bookingData.complaints.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <ul className="space-y-2">
                    {bookingData.complaints.map((complaint, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-800"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{complaint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-500 italic">
                  No complaints recorded
                </div>
              )}
            </div>
          </div>

          {/* Appointment Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
              Appointment Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <UserCircleIcon className="h-4 w-4" />
                  Assigned Doctor
                </label>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {bookingData.doctor || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Consultation Type
                </label>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {bookingData.type}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Appointment Date
                </label>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {formatDate(bookingData.date)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  Appointment Time
                </label>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {bookingData.time || "N/A"}
                </div>
              </div>

              {bookingData.clinicName && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Clinic Name
                  </label>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                    {bookingData.clinicName}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Status Management
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Current Status
                </label>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusConfig.class}`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {bookingData.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Update Status
                </label>
                <div className="relative">
                  <select
                    value={bookingData.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updatingStatus}
                    className={`w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer ${
                      updatingStatus
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : "bg-white hover:border-gray-300"
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {updatingStatus && (
                    <ArrowPathIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
                  )}
                </div>

                {updatingStatus && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Updating status...
                  </p>
                )}

                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">Status Update Info:</p>
                      <ul className="space-y-1 text-blue-600">
                        <li>
                          • <strong>Confirmed:</strong> Patient data will be
                          moved to patients database
                        </li>
                        <li>
                          • <strong>Completed:</strong> Marks appointment as
                          finished
                        </li>
                        <li>
                          • <strong>Cancelled:</strong> Cancels the appointment
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 rounded-b-2xl px-6 py-4">
          <button
            onClick={toggleModal}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewBookingModal;

import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ref, update, get, set } from "firebase/database";
import { database } from "../../../firebase/firebase";

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

function ViewAppointmentModal({ open, onClose, form, appointmentId }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(form?.status || "Pending");

  // Update currentStatus when form changes
  React.useEffect(() => {
    setCurrentStatus(form?.status || "Pending");
  }, [form?.status]);

  const getStatusBadge = (status) => {
    const statusStyles = {
      Confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      Completed: "bg-green-100 text-green-800 border-green-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    const defaultStatus = status || "Pending";
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
          statusStyles[defaultStatus] || statusStyles.Pending
        }`}
      >
        {defaultStatus}
      </span>
    );
  };

  // Handle status update - same logic as in AdminLabAppointments
  const handleStatusUpdate = async (newStatus) => {
    if (!appointmentId) {
      toast.error("No appointment ID provided");
      return;
    }

    setUpdatingStatus(true);

    try {
      const labRef = ref(database, `appointments/laboratory/${appointmentId}`);

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
          console.error("No appointment data found for labId:", appointmentId);
          toast.error("No appointment data found.");
          return;
        }

        const { email } = appointmentData;

        if (!email) {
          toast.error("No email found in appointment data.");
          return;
        }

        // Simplified duplicate check - just check if labId already exists in patients
        const patientRef = ref(database, `patients/${appointmentId}`);
        const patientSnapshot = await get(patientRef);

        if (patientSnapshot.exists()) {
          toast.info("Appointment already exists in patients list.");
          setCurrentStatus(newStatus);
          return;
        }

        const dataToPush = { ...appointmentData, labId: appointmentId };
        await set(ref(database, `patients/${appointmentId}`), dataToPush);

        toast.success("Status confirmed and patient added successfully.");
      } else {
        toast.success(`Status updated to ${newStatus}`);
      }

      // Update local state
      setCurrentStatus(newStatus);
    } catch (error) {
      console.error("Error updating status or pushing to patients:", error);
      toast.error("Failed to update status or push to patients.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white px-8 pt-6 pb-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <span className="text-2xl">🧪</span>
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-semibold text-gray-900"
                      >
                        Laboratory Appointment Details
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        #{form.slotNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(currentStatus)}
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
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
                  </div>
                </div>

                {/* Content */}
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                        👤 Patient Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Patient Name
                          </label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">
                            {form.patientName || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Email Address
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {form.email || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Contact Number
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {form.contactNumber || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                        📅 Appointment Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Lab Test Name
                          </label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">
                            {form.labTestName || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Appointment Date
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {form.createdAt?.date || "Not scheduled"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Appointment Time
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {form.createdAt?.time || "Not scheduled"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Estimated Duration
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {form.estimatedTime || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Update Section */}
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                      🔄 Update Status
                    </h4>
                    <div className="flex items-center space-x-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Current Status
                      </label>
                      <div className="relative">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusUpdate(e.target.value)}
                          disabled={updatingStatus}
                          className={`
                            text-sm font-medium px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer min-w-[120px] shadow-sm pr-8
                            ${
                              currentStatus === "Confirmed"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : ""
                            }
                            ${
                              currentStatus === "Completed"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : ""
                            }
                            ${
                              currentStatus === "Cancelled"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : ""
                            }
                            ${
                              currentStatus === "Pending"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : ""
                            }
                          `}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          {updatingStatus ? (
                            <svg
                              className="animate-spin h-4 w-4 text-gray-400"
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
                              className="h-4 w-4 text-gray-400"
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
                      {updatingStatus && (
                        <span className="text-sm text-gray-500">
                          Updating...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                      📝 Additional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Patient Complaint
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {form.patientComplaint || "No complaints reported"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Referring Doctor
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {form.referDoctor
                            ? `Dr. ${form.referDoctor}`
                            : "Walk-in"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Notes
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {form.notes || "No additional notes"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default ViewAppointmentModal;

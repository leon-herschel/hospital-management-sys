import { useState, useEffect } from "react";
import React from "react";
import { ref, onValue, update, get } from "firebase/database";
import { database } from "../../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import {
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  FileText,
  Clock,
  ArrowLeft,
  Calendar,
  Microscope,
  Phone,
  DollarSign,
  Search,
  UserCheck,
} from "lucide-react";

function RequestLabTest() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    selectedTransactionId: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  const [state, setState] = useState({
    transactions: [],
    filteredTransactions: [],
    searchTerm: "",
    selectedTransaction: null,
    existingSchedules: [],
    submitting: false,
    loading: false,
    currentDoctor: null,
    currentClinic: null,
    calendarDate: new Date(),
    errors: {
      selectedTransactionId: true,
      scheduledDate: true,
      scheduledTime: true,
    },
    showSuccessModal: false,
    showErrorModal: false,
    errorMessage: "",
  });

  // Helper function to get doctor's full name
  const getDoctorFullName = (doctorData) => {
    if (!doctorData) return "Doctor";

    if (doctorData.fullName) return doctorData.fullName;
    if (doctorData.name) return doctorData.name;

    const firstName = doctorData.firstName || "";
    const lastName = doctorData.lastName || "";
    const constructedName = `${firstName} ${lastName}`.trim();

    return constructedName || "Doctor";
  };

  // Fetch user data
  const fetchUserData = async (user) => {
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        console.error("No user data found");
        navigate("/login");
        return;
      }

      const userData = userSnapshot.val();
      setState((prev) => ({
        ...prev,
        currentDoctor: userData,
      }));
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      navigate("/login");
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch medical services transactions
  useEffect(() => {
    const transactionsRef = ref(database, "medicalServicesTransactions");
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsArray = Object.entries(data).map(([key, value]) => ({
          ...value,
          transactionId: key,
        }));

        // Filter for lab test transactions that don't have scheduling yet
        const labTestTransactions = transactionsArray.filter(
          (transaction) =>
            transaction.serviceCategory === "laboratoryTests" &&
            !transaction.labTestSched
        );

        setState((prev) => ({
          ...prev,
          transactions: labTestTransactions,
          filteredTransactions: labTestTransactions,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch existing schedules to prevent double booking
  useEffect(() => {
    const transactionsRef = ref(database, "medicalServicesTransactions");
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const schedules = Object.values(data)
          .filter((transaction) => transaction.labTestSched)
          .map((transaction) => transaction.labTestSched);

        setState((prev) => ({
          ...prev,
          existingSchedules: schedules,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter transactions based on search term
  useEffect(() => {
    if (state.searchTerm.trim() === "") {
      setState((prev) => ({
        ...prev,
        filteredTransactions: prev.transactions,
      }));
    } else {
      const filtered = state.transactions.filter(
        (transaction) =>
          transaction.patientName
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()) ||
          transaction.serviceDescription
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()) ||
          transaction.clinicName
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase())
      );
      setState((prev) => ({ ...prev, filteredTransactions: filtered }));
    }
  }, [state.searchTerm, state.transactions]);

  // Check if a date/time slot is already taken
  const isScheduleConflict = (date, time) => {
    return state.existingSchedules.some(
      (schedule) => schedule.date === date && schedule.time === time
    );
  };

  // Generate time slots (every 10 minutes from 8 AM to 5 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      // 8 AM to 4:50 PM (last slot before 5 PM)
      for (let minute = 0; minute < 60; minute += 10) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const displayTime = new Date(
          `1970-01-01T${timeString}:00`
        ).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        slots.push({ value: displayTime, display: displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Generate calendar days for the current month view
  const generateCalendarDays = () => {
    const currentDate = state.calendarDate || new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);

      const isCurrentMonth = currentDay.getMonth() === month;
      const dayDate = new Date(currentDay);
      dayDate.setHours(0, 0, 0, 0);

      if (isCurrentMonth) {
        days.push({
          date: currentDay.getDate(),
          dateString: currentDay.toISOString().split("T")[0],
          isToday: dayDate.getTime() === today.getTime(),
          isPast: dayDate < today,
        });
      } else {
        days.push({ date: null });
      }
    }

    return days;
  };

  const validateField = (name, value) => {
    const required = [
      "selectedTransactionId",
      "scheduledDate",
      "scheduledTime",
    ];

    if (required.includes(name)) {
      return value?.trim() ? null : true;
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setForm((prev) => ({ ...prev, [name]: value }));
    setState((prev) => ({ ...prev, errors: { ...prev.errors, [name]: err } }));

    if (name === "selectedTransactionId") {
      const selectedTransaction = state.transactions.find(
        (t) => t.transactionId === value
      );
      setState((prev) => ({
        ...prev,
        selectedTransaction,
      }));
    }
  };

  const handleTransactionSelect = (transaction) => {
    setState((prev) => ({
      ...prev,
      selectedTransaction: transaction,
      searchTerm: "",
    }));

    setForm((prev) => ({
      ...prev,
      selectedTransactionId: transaction.transactionId,
    }));

    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        selectedTransactionId: validateField(
          "selectedTransactionId",
          transaction.transactionId
        ),
      },
    }));
  };

  const validate = () => {
    const errs = {};

    // Validate required fields
    const requiredFields = [
      "selectedTransactionId",
      "scheduledDate",
      "scheduledTime",
    ];
    requiredFields.forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) errs[field] = true;
    });

    // Check for schedule conflicts
    if (form.scheduledDate && form.scheduledTime) {
      if (isScheduleConflict(form.scheduledDate, form.scheduledTime)) {
        errs.scheduleConflict = true;
      }
    }

    return errs;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setState((prev) => ({ ...prev, errors: validationErrors }));
    if (Object.keys(validationErrors).length > 0) return;

    setState((prev) => ({ ...prev, submitting: true, loading: true }));

    try {
      const transactionRef = ref(
        database,
        `medicalServicesTransactions/${form.selectedTransactionId}`
      );

      const labTestSched = {
        date: form.scheduledDate,
        time: form.scheduledTime,
      };

      await update(transactionRef, { labTestSched });

      // Reset form
      setForm({
        selectedTransactionId: "",
        scheduledDate: "",
        scheduledTime: "",
      });

      setState((prev) => ({
        ...prev,
        selectedTransaction: null,
        searchTerm: "",
        errors: {
          selectedTransactionId: true,
          scheduledDate: true,
          scheduledTime: true,
        },
        submitting: false,
        loading: false,
        showSuccessModal: true,
      }));
    } catch (error) {
      console.error("Submit error:", error);
      setState((prev) => ({
        ...prev,
        submitting: false,
        loading: false,
        showErrorModal: true,
        errorMessage: error.message,
      }));
    }
  };

  const closeSuccessModal = () => {
    setState((prev) => ({ ...prev, showSuccessModal: false }));
  };

  const closeErrorModal = () => {
    setState((prev) => ({ ...prev, showErrorModal: false, errorMessage: "" }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans relative">
      {state.loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">
              Scheduling Lab Test...
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Please wait while we update the schedule
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            <h1 className="text-3xl font-bold">Schedule Lab Tests</h1>
          </div>
          <p className="text-center text-blue-100 mt-2">
            Schedule lab tests for patients with no existing schedule
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        {/* Transaction Selection - Left Column */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Microscope className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Select Patients</h2>
          </div>

          {/* Transaction Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={state.searchTerm}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              placeholder="Search by patient name, test, or clinic..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Transaction List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-4">
            {state.filteredTransactions.length > 0 ? (
              state.filteredTransactions.map((transaction) => (
                <div
                  key={transaction.transactionId}
                  onClick={() => handleTransactionSelect(transaction)}
                  className={`p-4 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    state.selectedTransaction?.transactionId ===
                    transaction.transactionId
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {transaction.patientName}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Microscope className="w-4 h-4 text-blue-600" />
                      <span>{transaction.serviceDescription}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span>{transaction.clinicName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>
                        Created:{" "}
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {state.searchTerm
                  ? "No transactions found matching your search"
                  : "No pending lab test transactions available"}
              </div>
            )}
          </div>

          {state.errors.selectedTransactionId && (
            <p className="text-red-500 text-sm mt-2">
              Please select a transaction
            </p>
          )}
        </div>

        {/* Date and Time Scheduling - Right Column */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Schedule Date & Time
            </h2>
          </div>

          {state.selectedTransaction ? (
            <div className="space-y-6">
              {/* Selected Transaction Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Selected Transaction
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Patient:</strong>{" "}
                    {state.selectedTransaction.patientName}
                  </p>
                  <p>
                    <strong>Test:</strong>{" "}
                    {state.selectedTransaction.serviceDescription}
                  </p>
                  <p>
                    <strong>Clinic:</strong>{" "}
                    {state.selectedTransaction.clinicName}
                  </p>
                </div>
              </div>

              {/* Custom Calendar */}
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Select Date & Time
                  </h3>
                </div>

                {/* Calendar Component */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        const currentDate = state.calendarDate || new Date();
                        const newDate = new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        );
                        setState((prev) => ({
                          ...prev,
                          calendarDate: newDate,
                        }));
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
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
                    </button>

                    <div className="bg-purple-100 px-4 py-2 rounded-lg">
                      <span className="font-semibold text-purple-800">
                        {(state.calendarDate || new Date())
                          .toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })
                          .toUpperCase()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const currentDate = state.calendarDate || new Date();
                        const newDate = new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        );
                        setState((prev) => ({
                          ...prev,
                          calendarDate: newDate,
                        }));
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Days of Week */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                      <div
                        key={index}
                        className="text-center py-2 text-sm font-semibold text-gray-600"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, index) => {
                      if (!day.date) {
                        return <div key={index} className="p-3"></div>;
                      }

                      const isToday = day.isToday;
                      const isSelected = form.scheduledDate === day.dateString;
                      const isPast = day.isPast;
                      const hasConflict = state.existingSchedules.some(
                        (schedule) => schedule.date === day.dateString
                      );

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (!isPast) {
                              handleChange({
                                target: {
                                  name: "scheduledDate",
                                  value: day.dateString,
                                },
                              });
                            }
                          }}
                          disabled={isPast}
                          className={`
                            p-3 text-sm font-medium rounded-lg transition-all
                            ${
                              isPast
                                ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                : isSelected
                                ? "bg-blue-500 text-white shadow-md"
                                : hasConflict
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }
                            ${
                              isToday && !isSelected
                                ? "ring-2 ring-blue-300"
                                : ""
                            }
                          `}
                        >
                          {day.date}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center space-x-4 mt-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-100 rounded"></div>
                      <span className="text-gray-600">Unavailable</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-gray-600">Selected</span>
                    </div>
                  </div>
                </div>

                {state.errors.scheduledDate && !form.scheduledDate && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-600 text-sm text-center">
                      Please select a date
                    </p>
                  </div>
                )}
              </div>

              {/* Time Picker */}
              <div className="relative">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Available Time Slots
                </h4>

                {form.scheduledDate ? (
                  <>
                    {/* Time Slots Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 max-h-80 overflow-y-auto">
                      {timeSlots.map((slot) => {
                        const isConflict = isScheduleConflict(
                          form.scheduledDate,
                          slot.value
                        );
                        const isSelected = form.scheduledTime === slot.value;

                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => {
                              if (!isConflict) {
                                handleChange({
                                  target: {
                                    name: "scheduledTime",
                                    value: slot.value,
                                  },
                                });
                              }
                            }}
                            disabled={isConflict || state.submitting}
                            className={`
                              relative rounded-xl p-4 text-center transition-all transform hover:scale-105 disabled:hover:scale-100
                              ${
                                isConflict
                                  ? "bg-gradient-to-r from-red-400 to-red-500 text-white cursor-not-allowed opacity-75"
                                  : isSelected
                                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                                  : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 shadow-md"
                              }
                            `}
                          >
                            <div className="font-bold text-lg">
                              {slot.display}
                            </div>
                            <div className="text-xs opacity-90 mt-1">
                              10 min
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
                        <span className="text-gray-600">Available</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded"></div>
                        <span className="text-gray-600">Booked</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
                        <span className="text-gray-600">Selected</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Please select a date first</p>
                    <p className="text-sm mt-1">
                      Available time slots will appear here
                    </p>
                  </div>
                )}

                {state.errors.scheduledTime && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    Please select a time slot
                  </p>
                )}
                {state.errors.scheduleConflict && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    This time slot is already booked. Please select a different
                    time.
                  </p>
                )}
              </div>

              {/* Schedule Preview */}
              {form.scheduledDate && form.scheduledTime && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Schedule Preview
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(form.scheduledDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong> {form.scheduledTime}
                    </p>
                    <p>
                      <strong>Patient:</strong>{" "}
                      {state.selectedTransaction.patientName}
                    </p>
                    <p>
                      <strong>Test:</strong>{" "}
                      {state.selectedTransaction.serviceDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                Please select a transaction first
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Date and time selection will be available after selecting a
                transaction
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center max-w-7xl mx-auto px-6 pb-10">
        <button
          onClick={handleSubmit}
          disabled={state.submitting || Object.keys(validate()).length > 0}
          className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all transform ${
            state.submitting || Object.keys(validate()).length > 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95"
          }`}
        >
          {state.submitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Scheduling...</span>
            </div>
          ) : (
            "Schedule Lab Test"
          )}
        </button>
      </div>

      {/* Success Modal */}
      {state.showSuccessModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600 mb-4">
                Lab test has been scheduled successfully.
              </p>
              <div className="text-sm mb-6 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
                <div className="flex items-center justify-center">
                  <span className="mr-2">🧪</span>
                  <span>The patient will be notified about the schedule.</span>
                </div>
              </div>
              <button
                onClick={closeSuccessModal}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {state.showErrorModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error!</h2>
              <p className="text-gray-600 mb-4">
                An error occurred while scheduling the lab test.
              </p>
              <div className="text-sm mb-6 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <div className="flex items-center justify-center">
                  <span className="mr-2">⚠️</span>
                  <span>{state.errorMessage}</span>
                </div>
              </div>
              <button
                onClick={closeErrorModal}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestLabTest;

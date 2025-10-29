import { useState, useEffect, useMemo } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { database } from "../../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import {
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  Calendar,
  Microscope,
  Search,
  Flag,
} from "lucide-react";

// ============= UTILITY FUNCTIONS =============
const formatDate = (date) => new Date(date).toLocaleDateString();

const generateCalendarDays = (calendarDate) => {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clinicClosing = new Date();
  clinicClosing.setHours(17, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    const isCurrentMonth = currentDay.getMonth() === month;

    const dayDate = new Date(currentDay);
    dayDate.setHours(0, 0, 0, 0);

    const isToday = dayDate.getTime() === today.getTime();
    const isPast = dayDate < today;
    const afterClinicHours = isToday && now > clinicClosing;

    const disabled = isPast || afterClinicHours;

    if (isCurrentMonth) {
      days.push({
        date: currentDay.getDate(),
        dateString: currentDay.toISOString().split("T")[0],
        isToday,
        isPast,
        disabled,
      });
    } else {
      days.push({
        date: null,
        dateString: currentDay.toISOString().split("T")[0],
        disabled: disabled,
      });
    }
  }

  return days;
};

const generateTimeSlots = (selectedDate) => {
  const slots = [];
  const now = new Date();
  const selected = new Date(selectedDate);
  const isToday = selected.toDateString() === new Date().toDateString();

  for (let hour = 8; hour < 17; hour++) {
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

      const fullDateTime = new Date(`${selectedDate}T${timeString}:00`);
      const isPastTime = isToday && fullDateTime < now;

      slots.push({
        value: displayTime,
        display: displayTime,
        disabled: isPastTime, // new flag for past times
      });
    }
  }

  return slots;
};

// ============= CUSTOM HOOKS =============
const useAuth = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const userSnapshot = await get(
          ref(database, `users/${currentUser.uid}`)
        );
        if (!userSnapshot.exists()) {
          navigate("/login");
          return;
        }
        setUser(userSnapshot.val());
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    });

    return unsubscribe;
  }, [navigate]);

  return user;
};

const useReferenceData = () => {
  const [clinics, setClinics] = useState({});
  const [medicalServices, setMedicalServices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clinicsRef = ref(database, "clinics");
    const servicesRef = ref(database, "medicalServices");

    const unsubscribeClinics = onValue(clinicsRef, (snapshot) => {
      setClinics(snapshot.val() || {});
    });

    const unsubscribeServices = onValue(servicesRef, (snapshot) => {
      setMedicalServices(snapshot.val() || {});
      setLoading(false);
    });

    return () => {
      unsubscribeClinics();
      unsubscribeServices();
    };
  }, []);

  return { clinics, medicalServices, loading };
};

const useTransactions = (clinics, medicalServices) => {
  const [transactions, setTransactions] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    if (
      Object.keys(clinics).length === 0 ||
      Object.keys(medicalServices).length === 0
    ) {
      return;
    }

    const transactionsRef = ref(database, "medicalServicesTransactions");

    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setTransactions([]);
        setSchedules([]);
        return;
      }

      const enrichedTransactions = [];
      const existingSchedules = [];

      Object.entries(data).forEach(([transactionId, transaction]) => {
        // Collect schedules
        if (transaction.labTestSched) {
          existingSchedules.push(transaction.labTestSched);
        }

        // Filter for lab tests without schedules
        if (
          transaction.serviceCategory === "laboratoryTests" &&
          !transaction.labTestSched
        ) {
          // Join clinic data
          const clinicName =
            clinics[transaction.clinicId]?.name || "Unknown Clinic";

          // Join medical service data
          const serviceCategory = transaction.serviceCategory;
          const testName =
            medicalServices[serviceCategory]?.[transaction.serviceId]?.name ||
            medicalServices[serviceCategory]?.[transaction.serviceId]
              ?.description ||
            "Unknown Test";

          enrichedTransactions.push({
            ...transaction,
            transactionId,
            clinicName,
            testName,
          });
        }
      });

      setTransactions(enrichedTransactions);
      setSchedules(existingSchedules);
    });

    return unsubscribe;
  }, [clinics, medicalServices]);

  return { transactions, schedules };
};

// ============= MAIN COMPONENT =============
function RequestLabTest() {
  const navigate = useNavigate();
  const currentUser = useAuth();
  const { clinics, medicalServices, loading: refsLoading } = useReferenceData();
  const { transactions, schedules } = useTransactions(clinics, medicalServices);

  const [form, setForm] = useState({
    selectedTransactionId: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  const [state, setState] = useState({
    searchTerm: "",
    selectedTransaction: null,
    calendarDate: new Date(),
    submitting: false,
    showSuccessModal: false,
    showErrorModal: false,
    errorMessage: "",
  });

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!state.searchTerm.trim()) return transactions;

    const searchLower = state.searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        t.patientName?.toLowerCase().includes(searchLower) ||
        t.testName?.toLowerCase().includes(searchLower) ||
        t.clinicName?.toLowerCase().includes(searchLower)
    );
  }, [transactions, state.searchTerm]);

  // Check if a time slot is booked
  const isScheduleConflict = (date, time) => {
    return schedules.some((s) => s.date === date && s.time === time);
  };

  // Validation
  const errors = useMemo(() => {
    const errs = {};
    if (!form.selectedTransactionId) errs.selectedTransactionId = true;
    if (!form.scheduledDate) errs.scheduledDate = true;
    if (!form.scheduledTime) errs.scheduledTime = true;
    if (form.scheduledDate && form.scheduledTime) {
      if (isScheduleConflict(form.scheduledDate, form.scheduledTime)) {
        errs.scheduleConflict = true;
      }
    }
    return errs;
  }, [form, schedules]);

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
  };

  const handleDateChange = (dateString) => {
    setForm((prev) => ({
      ...prev,
      scheduledDate: dateString,
      scheduledTime: "",
    }));
  };

  const handleTimeChange = (time) => {
    setForm((prev) => ({ ...prev, scheduledTime: time }));
  };

  const handleSubmit = async () => {
    if (Object.keys(errors).length > 0) return;

    setState((prev) => ({ ...prev, submitting: true }));

    try {
      const transactionRef = ref(
        database,
        `medicalServicesTransactions/${form.selectedTransactionId}`
      );

      await update(transactionRef, {
        labTestSched: {
          date: form.scheduledDate,
          time: form.scheduledTime,
        },
      });

      setForm({
        selectedTransactionId: "",
        scheduledDate: "",
        scheduledTime: "",
      });

      setState((prev) => ({
        ...prev,
        selectedTransaction: null,
        searchTerm: "",
        submitting: false,
        showSuccessModal: true,
      }));
    } catch (error) {
      console.error("Submit error:", error);
      setState((prev) => ({
        ...prev,
        submitting: false,
        showErrorModal: true,
        errorMessage: error.message,
      }));
    }
  };

  const timeSlots = generateTimeSlots();
  const calendarDays = generateCalendarDays(state.calendarDate);

  if (refsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Loading Overlay */}
      {state.submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">
              Scheduling Lab Test...
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-center">Schedule Lab Tests</h1>
          <p className="text-center text-blue-100 mt-2">
            Schedule lab tests for patients with no existing schedule
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        {/* Transaction Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Microscope className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Select Patient</h2>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={state.searchTerm}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              placeholder="Search by patient, test, or clinic..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Transaction List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
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
                  <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    {transaction.patientName}
                    {transaction.urgentFlag && (
                      <div className="flex items-center gap-1 text-red-600">
                        <Flag className="w-4 h-4 fill-red-600" />
                        <span className="text-sm font-medium">(Urgent)</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Microscope className="w-4 h-4 text-blue-600" />
                      <span>{transaction.testName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span>{transaction.clinicName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>Created: {formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {state.searchTerm
                  ? "No transactions found"
                  : "No pending lab tests"}
              </div>
            )}
          </div>

          {errors.selectedTransactionId && (
            <p className="text-red-500 text-sm mt-2">
              Please select a transaction
            </p>
          )}
        </div>

        {/* Scheduling Panel */}
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
              {/* Transaction Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Selected Transaction
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <strong>Patient:</strong>{" "}
                    {state.selectedTransaction.patientName}
                    {state.selectedTransaction.urgentFlag && (
                      <Flag className="w-3 h-3 text-red-600 fill-red-600" />
                    )}
                  </p>
                  <p>
                    <strong>Test:</strong> {state.selectedTransaction.testName}
                  </p>
                  <p>
                    <strong>Clinic:</strong>{" "}
                    {state.selectedTransaction.clinicName}
                  </p>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        calendarDate: new Date(
                          prev.calendarDate.getFullYear(),
                          prev.calendarDate.getMonth() - 1,
                          1
                        ),
                      }))
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ←
                  </button>
                  <div className="bg-purple-100 px-4 py-2 rounded-lg">
                    <span className="font-semibold text-purple-800">
                      {state.calendarDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        calendarDate: new Date(
                          prev.calendarDate.getFullYear(),
                          prev.calendarDate.getMonth() + 1,
                          1
                        ),
                      }))
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div
                      key={i}
                      className="text-center py-2 text-sm font-semibold text-gray-600"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (!day.date)
                      return <div key={index} className="p-3"></div>;

                    const isSelected = form.scheduledDate === day.dateString;
                    const hasConflict = schedules.some(
                      (s) => s.date === day.dateString
                    );

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          !day.disabled && handleDateChange(day.dateString)
                        }
                        disabled={day.disabled}
                        className={`p-3 text-sm font-medium rounded-lg transition-all ${
                          day.disabled
                            ? "text-gray-300 cursor-not-allowed bg-gray-50"
                            : isSelected
                            ? "bg-blue-500 text-white shadow-md"
                            : hasConflict
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {day.date}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-center space-x-4 mt-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-100 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-100 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                </div>
              </div>

              {errors.scheduledDate && !form.scheduledDate && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm text-center">
                    Please select a date
                  </p>
                </div>
              )}

              {/* Time Slots */}
              {form.scheduledDate ? (
                <>
                  <h4 className="text-lg font-semibold text-gray-800">
                    Available Time Slots
                  </h4>
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
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
                          onClick={() =>
                            !isConflict &&
                            !slot.disabled &&
                            handleTimeChange(slot.value)
                          }
                          disabled={isConflict || slot.disabled}
                          className={`rounded-xl p-4 text-center transition-all ${
                            isConflict || slot.disabled
                              ? "bg-gradient-to-r from-gray-300 to-gray-400 text-white cursor-not-allowed opacity-75"
                              : isSelected
                              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                              : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600"
                          }`}
                        >
                          <div className="font-bold text-lg">
                            {slot.display}
                          </div>
                          <div className="text-xs opacity-90 mt-1">10 min</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Please select a date first</p>
                </div>
              )}

              {errors.scheduledTime && (
                <p className="text-red-500 text-sm text-center">
                  Please select a time slot
                </p>
              )}
              {errors.scheduleConflict && (
                <p className="text-red-500 text-sm text-center">
                  This time slot is already booked
                </p>
              )}

              {/* Preview */}
              {form.scheduledDate && form.scheduledTime && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Schedule Preview
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Date:</strong> {formatDate(form.scheduledDate)}
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
                      {state.selectedTransaction.testName}
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
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center max-w-7xl mx-auto px-6 pb-10">
        <button
          onClick={handleSubmit}
          disabled={state.submitting || Object.keys(errors).length > 0}
          className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all ${
            state.submitting || Object.keys(errors).length > 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          }`}
        >
          {state.submitting ? "Scheduling..." : "Schedule Lab Test"}
        </button>
      </div>

      {/* Success Modal */}
      {state.showSuccessModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-6">
              Lab test scheduled successfully.
            </p>
            <button
              onClick={() =>
                setState((prev) => ({ ...prev, showSuccessModal: false }))
              }
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {state.showErrorModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error!</h2>
            <p className="text-gray-600 mb-4">{state.errorMessage}</p>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  showErrorModal: false,
                  errorMessage: "",
                }))
              }
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-pink-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestLabTest;

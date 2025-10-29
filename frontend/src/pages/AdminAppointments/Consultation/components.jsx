// AdminAppointments - Consultation/components.jsx (ENHANCED VERSION)
import React from "react";
import { useState } from "react";
import {
  UserCheck,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  DollarSign,
  FileText,
  User,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarCheck,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";
import { getDoctorFullName } from "./utils";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  monthNames,
  timeToMinutes,
} from "./utils";

// ===== AppointmentHeader Component (unchanged) =====
export function AppointmentHeader() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-center flex-1">
            Book Specialist Appointment
          </h1>
          <div className="w-40"></div>
        </div>
        <p className="text-center text-blue-100 mt-2">
          Schedule appointments with medical specialists
        </p>
      </div>
    </div>
  );
}

// ===== LoadingOverlay Component (unchanged) =====
export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg font-semibold text-gray-700">
          Booking Specialist Appointment...
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Please wait while we process the appointment
        </div>
      </div>
    </div>
  );
}

// ===== NEW: AppointmentStatsCard Component =====
export function AppointmentStatsCard({ appointmentsWithPatients }) {
  if (!appointmentsWithPatients || appointmentsWithPatients.length === 0) {
    return null;
  }

  const today = new Date().toLocaleDateString("en-CA");
  const todaysAppointments = appointmentsWithPatients.filter(
    (appointment) => appointment.appointmentDate === today
  );

  const pendingAppointments = appointmentsWithPatients.filter(
    (appointment) => appointment.status === "pending"
  );

  const completedAppointments = appointmentsWithPatients.filter(
    (appointment) => appointment.status === "completed"
  );

  const stats = [
    {
      icon: Users,
      label: "Total Patients",
      value: appointmentsWithPatients.length,
      color: "blue",
    },
    {
      icon: Calendar,
      label: "Today's Appointments",
      value: todaysAppointments.length,
      color: "green",
    },
    {
      icon: Activity,
      label: "Pending",
      value: pendingAppointments.length,
      color: "orange",
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: completedAppointments.length,
      color: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
              >
                <IconComponent className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold text-${stat.color}-600`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== DoctorInfoCard Component (unchanged) =====
export function DoctorInfoCard({
  currentDoctor,
  currentClinic,
  selectedGeneralist,
  specialists,
  selectedSpecialist,
  onSpecialistChange,
  form,
  setForm,
  errors,
  setErrors,
  submitting,
}) {
  const handleSpecialistSelect = (e) => {
    const value = e.target.value;
    const specialist = specialists.find((s) => s.fullName === value);

    // Update form state
    setForm((prev) => ({
      ...prev,
      specialistName: value,
      specialistId: specialist?.id || "",
      // Reset date/time when specialist changes
      selectedDate: "",
      selectedTimeSlot: "",
    }));

    // Clear validation errors when specialist is selected
    if (value && setErrors) {
      setErrors((prev) => ({
        ...prev,
        specialistName: null, // Clear the error
      }));
    }

    // Call the parent handler
    onSpecialistChange(specialist);
  };

  const handleNotesChange = (e) => {
    setForm((prev) => ({ ...prev, notes: e.target.value }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <UserCheck className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          Generalist & Specialist Info
        </h2>
      </div>

      {currentDoctor && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">Referring Staff</h3>
          <p>
            <strong>Name:</strong> {getDoctorFullName(currentDoctor)}
          </p>
          {currentDoctor.specialty && (
            <p>
              <strong>Specialty:</strong> {currentDoctor.specialty}
            </p>
          )}
        </div>
      )}

      {/* Generalist Doctor Info - NEW */}
      {selectedGeneralist && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
          <h3 className="font-semibold text-purple-800 mb-2">
            Patient's Generalist
          </h3>
          <p>
            <strong>Name:</strong> Dr. {selectedGeneralist.fullName}
          </p>
          {selectedGeneralist.specialty && (
            <p>
              <strong>Specialty:</strong> {selectedGeneralist.specialty}
            </p>
          )}
        </div>
      )}

      {currentClinic && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Referring Clinic
          </h3>
          <p>
            <strong>Name:</strong> {currentClinic.name}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {currentClinic.addressLine || currentClinic.address}
          </p>
          <p>
            <strong>Type:</strong> {currentClinic.type}
          </p>
        </div>
      )}

      {/* Specialist Selection */}
      <div className="relative mb-4">
        <Stethoscope className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <select
          value={form.specialistName || ""}
          onChange={handleSpecialistSelect}
          className={`w-full pl-10 pr-10 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
            errors.specialistName
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          }`}
          disabled={submitting}
        >
          <option value="">-- Select Specialist --</option>
          {specialists.map((specialist) => (
            <option key={specialist.id} value={specialist.fullName}>
              Dr. {specialist.fullName} - {specialist.specialty}
            </option>
          ))}
        </select>
        {errors.specialistName ? (
          <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
        ) : form.specialistName ? (
          <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-600" />
        ) : null}
        {errors.specialistName && (
          <p className="text-red-500 text-sm mt-1">Specialist is required</p>
        )}
      </div>

      {selectedSpecialist?.specialty && (
        <div className="text-gray-600 text-sm mt-2 bg-gray-50 rounded p-2 border border-gray-200 mb-4">
          <strong>Specialty:</strong> {selectedSpecialist.specialty}
        </div>
      )}

      {selectedSpecialist?.consultationFee && (
        <div className="flex items-center space-x-2 bg-green-50 rounded-lg p-3 border border-green-200 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Consultation Fee
            </p>
            <p className="text-lg font-bold text-green-700">
              ₱
              {typeof selectedSpecialist.consultationFee === "number"
                ? selectedSpecialist.consultationFee.toLocaleString()
                : selectedSpecialist.consultationFee}
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="relative">
        <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <textarea
          value={form.notes || ""}
          onChange={handleNotesChange}
          placeholder="Additional Notes (optional)"
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors resize-none"
          disabled={submitting}
          rows="3"
        />
      </div>
    </div>
  );
}

// ===== ENHANCED PatientSelectionCard Component =====
export function PatientSelectionCard({
  patients,
  filteredPatients,
  selectedPatient,
  selectedPatientAppointment,
  searchTerm,
  onSearchChange,
  onPatientSelect,
  setForm,
  setErrors,
  errors,
  appointmentsWithPatients = [], // NEW: enhanced appointments data
  loading = false,
}) {
  const handlePatientClick = (patient) => {
    // Update form with patient data
    setForm((prev) => ({
      ...prev,
      patientName: patient.fullName,
      userId: patient.id,
      email: patient.email || "",
      contactNumber: patient.contactNumber || "",
      dateOfBirth: patient.dateOfBirth || "",
      bloodType: patient.bloodType || "",
    }));

    // Clear validation error
    if (setErrors) {
      setErrors((prev) => ({
        ...prev,
        patientName: null, // Clear the error
      }));
    }

    // Call the parent handler
    onPatientSelect(patient);
  };

  // NEW: Get enhanced appointment data for selected patient
  const getPatientAppointmentDetails = (patientId) => {
    return appointmentsWithPatients.find((apt) => apt.patientId === patientId);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <User className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Select Patient</h2>
      </div>

      {/* Patient Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patients with appointments..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* NEW: Enhanced info message with stats */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
        <p className="text-sm text-blue-700">
          <CalendarCheck className="w-4 h-4 inline mr-2" />
          Showing patients with appointments ({filteredPatients.length} found)
          {appointmentsWithPatients.length > 0 && (
            <span className="ml-2 text-xs">
              • {appointmentsWithPatients.length} total appointments
            </span>
          )}
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Loading patients...</span>
        </div>
      )}

      {/* Patient List */}
      {!loading && (
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg mb-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => {
              // NEW: Get enhanced appointment details
              const enhancedAppointment = getPatientAppointmentDetails(
                patient.id
              );

              return (
                <div
                  key={patient.id}
                  onClick={() => handlePatientClick(patient)}
                  className={`p-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedPatient?.id === patient.id
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-semibold text-gray-800">
                    {patient.fullName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {patient.email && <div>Email: {patient.email}</div>}
                    {patient.contactNumber && (
                      <div>Phone: {patient.contactNumber}</div>
                    )}
                    {patient.bloodType && (
                      <div>Blood Type: {patient.bloodType}</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchTerm
                ? "No patients found matching your search"
                : "No patients with appointments found"}
            </div>
          )}
        </div>
      )}

      {/* Selected Patient Details */}
      {selectedPatient && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
          <h3 className="font-semibold text-purple-800 mb-2">
            Selected Patient
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Name:</strong> {selectedPatient.fullName}
            </p>
            {selectedPatient.email && (
              <p>
                <strong>Email:</strong> {selectedPatient.email}
              </p>
            )}
            {selectedPatient.contactNumber && (
              <p>
                <strong>Phone:</strong> {selectedPatient.contactNumber}
              </p>
            )}
            {selectedPatient.dateOfBirth && (
              <p>
                <strong>DOB:</strong> {selectedPatient.dateOfBirth}
              </p>
            )}
            {selectedPatient.bloodType && (
              <p>
                <strong>Blood Type:</strong> {selectedPatient.bloodType}
              </p>
            )}
          </div>
        </div>
      )}

      {errors.patientName && (
        <p className="text-red-500 text-sm mt-2">Please select a patient</p>
      )}
    </div>
  );
}

// ===== CalendarCard Component
export function CalendarCard({
  form,
  calendarDate,
  onCalendarDateChange,
  availableTimeSlots,
  bookedAppointments,
  isDateAvailable,
  onDateSelect,
  onTimeSlotSelect,
  errors,
}) {
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];

    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth(),
        day
      );
      const dateStr = formatDate(date);
      const isAvailable = isDateAvailable(date);
      const isSelected = form.selectedDate === dateStr;
      const isToday = dateStr === formatDate(new Date());

      const isPast = date < todayAtMidnight;

      days.push(
        <div
          key={day}
          onClick={() => isAvailable && !isPast && onDateSelect(date)}
          className={`p-2 text-center cursor-pointer border rounded-lg transition-all ${
            isPast
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isSelected
              ? "bg-blue-600 text-white border-blue-600"
              : isAvailable
              ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          } `}
        >
          {day}{" "}
        </div>
      );
    }

    return days;
  };

  const renderTimeSlots = () => {
    const now = new Date();
    const selectedDateStr = form.selectedDate;
    const todayStr = formatDate(now);
    const isToday = selectedDateStr === todayStr;
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    return availableTimeSlots.map((slot) => {
      const isBooked = bookedAppointments.includes(slot.time);
      const isSelected = form.selectedTimeSlot === slot.time;
      const slotTimeMinutes = timeToMinutes(slot.time);
      const isPastTime = isToday && slotTimeMinutes < currentTimeMinutes;
      const isDisabled = isBooked || isPastTime;

      return (
        <div
          key={slot.id}
          onClick={() => !isDisabled && onTimeSlotSelect(slot)}
          className={`rounded-lg p-3 text-center cursor-pointer transition-all transform shadow-sm min-h-[60px] flex flex-col justify-center ${
            isDisabled
              ? isPastTime
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-red-400 text-white cursor-not-allowed opacity-75"
              : isSelected
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
              : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 hover:scale-105" // Active style
          }`}
        >
          <div className="font-semibold text-sm">{slot.display}</div>{" "}
          {slot.duration && (
            <div className="text-xs opacity-80">{slot.duration} min</div>
          )}{" "}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Select Date & Time</h2>
      </div>

      {form.specialistName ? (
        <>
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() =>
                onCalendarDateChange(
                  new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() - 1,
                    1
                  )
                )
              }
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-lg">
              <span className="font-semibold text-gray-700">
                {monthNames[calendarDate.getMonth()]}{" "}
                {calendarDate.getFullYear()}
              </span>
            </div>
            <button
              onClick={() =>
                onCalendarDateChange(
                  new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() + 1,
                    1
                  )
                )
              }
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-600 p-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 mb-4">{renderCalendar()}</div>

          {/* Legend */}
          <div className="flex justify-center space-x-4 text-xs mb-4">
            {[
              { color: "bg-green-100 border-green-300", label: "Available" },
              { color: "bg-gray-50", label: "Unavailable" },
              { color: "bg-blue-600", label: "Selected" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded border ${color}`}></div>
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          {errors.selectedDate && (
            <p className="text-red-500 text-sm mb-4 text-center p-2 bg-red-50 rounded-lg">
              Please select a date
            </p>
          )}

          {/* Time Slots */}
          {form.selectedDate && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                Available Time Slots
              </h3>
              {availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {renderTimeSlots()}
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No time slots available for this date
                  </p>
                </div>
              )}

              {availableTimeSlots.length > 0 && (
                <div className="flex justify-center space-x-4 text-xs">
                  {[
                    { color: "from-green-400 to-blue-500", label: "Available" },
                    { color: "bg-red-400", label: "Booked" },
                    { color: "from-blue-600 to-purple-600", label: "Selected" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center space-x-1">
                      <div
                        className={`w-3 h-3 rounded ${
                          color.includes("from")
                            ? `bg-gradient-to-r ${color}`
                            : color
                        }`}
                      ></div>
                      <span className="text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {errors.selectedTimeSlot && (
                <p className="text-red-500 text-sm mt-2 text-center p-2 bg-red-50 rounded-lg">
                  Please select a time slot
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Please select a specialist first
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Calendar will be available after selecting a specialist
          </p>
        </div>
      )}
    </div>
  );
}

// ===== ENHANCED AppointmentSummary Component =====
export function AppointmentSummary({
  form,
  selectedPatient,
  selectedPatientAppointment,
  selectedSpecialist,
  currentDoctor,
  currentClinic,
  appointmentsWithPatients = [], // NEW: enhanced appointments data
}) {
  // NEW: Get additional context from enhanced data
  const getRelatedAppointments = () => {
    if (!selectedPatient) return [];
    return appointmentsWithPatients.filter(
      (apt) => apt.patientId === selectedPatient.id
    );
  };

  const relatedAppointments = getRelatedAppointments();

  const summaryItems = [
    form.selectedDate &&
      form.selectedTimeSlot && {
        title: "Specialist Appointment Time",
        content: (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">
                {form.selectedDate}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">
                {form.selectedTimeSlot}
              </span>
            </div>
          </div>
        ),
        isSpecial: true,
      },
    currentDoctor && {
      title: "Referring Staff",
      content: (
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {getDoctorFullName(currentDoctor)}
          </p>
          {currentDoctor.specialty && (
            <p>
              <strong>Specialty:</strong> {currentDoctor.specialty}
            </p>
          )}
          <p>
            <strong>Clinic:</strong> {currentClinic?.name || "Unknown"}
          </p>
        </div>
      ),
      isSpecial: true,
    },
    selectedPatient && {
      title: "Patient Details",
      content: (
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {selectedPatient.fullName}
          </p>
          {selectedPatient.email && (
            <p>
              <strong>Email:</strong> {selectedPatient.email}
            </p>
          )}
          {selectedPatient.contactNumber && (
            <p>
              <strong>Phone:</strong> {selectedPatient.contactNumber}
            </p>
          )}
          {selectedPatient.dateOfBirth && (
            <p>
              <strong>DOB:</strong> {selectedPatient.dateOfBirth}
            </p>
          )}
          {selectedPatient.bloodType && (
            <p>
              <strong>Blood Type:</strong> {selectedPatient.bloodType}
            </p>
          )}

          {/* NEW: Show related appointments count */}
          {relatedAppointments.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-blue-600 font-medium">
                📅 This patient has {relatedAppointments.length} total
                appointments with you
              </p>
            </div>
          )}
        </div>
      ),
      isSpecial: true,
    },
    selectedSpecialist && {
      title: "Specialist Details",
      content: (
        <div className="space-y-2">
          <p>
            <strong>Doctor:</strong> Dr. {selectedSpecialist.fullName}
          </p>
          <p>
            <strong>Specialty:</strong> {selectedSpecialist.specialty}
          </p>
          {selectedSpecialist.consultationFee && (
            <div className="flex items-center space-x-2 bg-green-50 rounded-lg p-2 border border-green-200">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                Fee: ₱
                {typeof selectedSpecialist.consultationFee === "number"
                  ? selectedSpecialist.consultationFee.toLocaleString()
                  : selectedSpecialist.consultationFee}
              </span>
            </div>
          )}
        </div>
      ),
      isSpecial: true,
    },
    form.notes && {
      title: "Additional Notes",
      content: form.notes,
      isSmall: true,
    },
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-8 pb-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            Appointment Summary
          </h2>
        </div>

        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center text-3xl mx-auto shadow-lg">
            🩺
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryItems.map((item, idx) => (
            <div
              key={idx}
              className={`${
                item.isSpecial ? "" : "bg-gray-50 rounded-lg p-4"
              } ${item.isSmall ? "md:col-span-1" : ""}`}
            >
              {!item.isSpecial && (
                <h3 className="font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
              )}
              {item.isSpecial ? (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  {item.content}
                </div>
              ) : (
                <>
                  <p
                    className={`text-gray-600 ${item.isSmall ? "text-sm" : ""}`}
                  >
                    {item.content}
                  </p>
                  {item.extra && (
                    <p className="text-gray-500 text-sm">{item.extra}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/*
        {selectedPatientAppointment?.relatedReferralId && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p className="font-semibold">Warning: Existing Referral</p>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This patient already has a referral with (Dr:{" "}
              {selectedPatientAppointment.relatedReferralId}). Creating a new
              referral will update the existing one.
            </p>
          </div>
        )}
              */}
      </div>
    </div>
  );
}

// ===== SubmitButton Component (unchanged) =====

export function SubmitButton({
  onSubmit,
  submitting,
  hasErrors,
  showSuccessModal,
  setShowSuccessModal,
}) {
  const handleSubmit = async () => {
    await onSubmit();
    setShowSuccessModal(true);
  };

  return (
    <>
      <div className="flex justify-center max-w-7xl mx-auto px-6 pb-10">
        <button
          onClick={handleSubmit}
          disabled={submitting || hasErrors}
          className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all transform ${
            submitting || hasErrors
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95"
          }`}
        >
          {submitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Booking Appointment...</span>
            </div>
          ) : (
            "Book Specialist Appointment"
          )}
        </button>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-6">
              Specialist appointment booked successfully.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

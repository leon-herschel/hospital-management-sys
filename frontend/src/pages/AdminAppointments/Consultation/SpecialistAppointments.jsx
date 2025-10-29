// AdminAppointments - Consultation/SpecialistAppointments.jsx (ENHANCED VERSION)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase/firebase";

// Import custom hooks, components, and utilities
import {
  useSpecialistData,
  usePatientData,
  useAppointmentForm,
  useCalendarLogic,
} from "./hooks";
import {
  AppointmentHeader,
  DoctorInfoCard,
  PatientSelectionCard,
  CalendarCard,
  AppointmentSummary,
  SubmitButton,
  LoadingOverlay,
  AppointmentStatsCard, // NEW: Optional stats component
} from "./components";
import { fetchUserData, handleAppointmentSubmit } from "./utils";

function SpecialistAppointments() {
  const navigate = useNavigate();

  // Local state
  const [state, setState] = useState({
    currentDoctor: null,
    currentClinic: null,
    currentDoctorId: null,
    submitting: false,
    loading: false,
    showSuccessModal: false,
  });

  // Custom hooks for data management
  const { specialists, selectedSpecialist, setSelectedSpecialist } =
    useSpecialistData();

  // ENHANCED: Now includes appointmentsWithPatients and helper functions
  const {
    patients,
    appointmentsWithPatients, // NEW: appointments with patient data attached
    selectedPatient,
    selectedGeneralist,
    selectedPatientAppointment,
    searchTerm,
    setSearchTerm,
    filteredPatients,
    handlePatientSelect,
    loading: patientsLoading,
    // NEW: Helper functions
    getAppointmentByPatientId,
    getPatientByAppointmentId,
    getTodaysAppointments,
    getUpcomingAppointments,
  } = usePatientData(state.currentDoctorId, state.currentClinicId);

  const { form, setForm, errors, setErrors, validate } = useAppointmentForm();
  const {
    calendarDate,
    setCalendarDate,
    availableTimeSlots,
    bookedAppointments,
    isDateAvailable,
    handleDateSelect,
    handleTimeSlotSelect,
  } = useCalendarLogic(selectedSpecialist, form);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await fetchUserData(user, navigate);
        if (userData) {
          setState((prev) => ({
            ...prev,
            currentDoctor: userData.doctor,
            currentClinic: userData.clinic,
            currentDoctorId: user.uid,
            currentClinicId: userData.clinicId, // Set the current doctor's ID
          }));

          // Update form with doctor/clinic data
          setForm((prev) => ({
            ...prev,
            referDoctor: userData.doctorName,
            userId: user.uid,
            clinic: userData.clinicName,
            clinicId: userData.clinicId,
            addressLine: userData.addressLine,
            type: userData.type,
          }));
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate, setForm]);

  // NEW: Log enhanced data for debugging
  useEffect(() => {
    if (appointmentsWithPatients.length > 0) {
      console.log(
        "Enhanced appointments with patients:",
        appointmentsWithPatients
      );
      console.log("Today's appointments:", getTodaysAppointments());
      console.log("Upcoming appointments:", getUpcomingAppointments());
    }
  }, [
    appointmentsWithPatients,
    getTodaysAppointments,
    getUpcomingAppointments,
  ]);

  const handleSpecialistChange = (specialist) => {
    setSelectedSpecialist(specialist);
    setForm((prev) => ({
      ...prev,
      specialistId: specialist?.id || "",
      specialistName: specialist?.fullName || "",
      selectedDate: "",
      selectedTimeSlot: "",
    }));

    // Clear specialist error when selected, but set date/time errors since they were reset
    setErrors((prev) => ({
      ...prev,
      specialistName: specialist ? null : true, // Clear error if specialist selected
      selectedDate: true,
      selectedTimeSlot: true,
    }));
  };

  // Enhanced patient select handler
  const handlePatientSelectWithValidation = (patient) => {
    // Update form state with patient data
    if (patient) {
      // NEW: Get the patient's appointment data using helper function
      const patientAppointment = getAppointmentByPatientId(patient.id);

      setForm((prev) => ({
        ...prev,
        patientName: patient.fullName,
        userId: patient.id,
        email: patient.email || "",
        contactNumber: patient.contactNumber || "",
        dateOfBirth: patient.dateOfBirth || "",
        bloodType: patient.bloodType || "",
      }));

      // Clear patient validation error
      setErrors((prev) => ({
        ...prev,
        patientName: null, // Clear the error
      }));

      // Log the enhanced appointment data
      console.log(
        "Selected patient's appointment (enhanced):",
        patientAppointment
      );
    } else {
      // Reset patient data if null
      setForm((prev) => ({
        ...prev,
        patientName: "",
        userId: "",
        email: "",
        contactNumber: "",
        dateOfBirth: "",
        bloodType: "",
      }));

      // Set patient validation error
      setErrors((prev) => ({
        ...prev,
        patientName: true,
      }));
    }

    // Call original handler
    handlePatientSelect(patient);
  };

  const onDateSelect = (date) => {
    handleDateSelect(date)(setForm, setErrors);
  };

  const onTimeSlotSelect = (timeSlot) => {
    handleTimeSlotSelect(timeSlot)(setForm, setErrors);
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      console.log("Validation errors:", validationErrors);
      return;
    }

    if (!selectedPatientAppointment) {
      alert(
        "❌ No appointment found for the selected patient with this doctor"
      );
      return;
    }

    setState((prev) => ({ ...prev, submitting: true, loading: true }));

    try {
      await handleAppointmentSubmit({
        form,
        selectedSpecialist,
        selectedPatient,
        selectedPatientAppointment: {
          ...selectedPatientAppointment,
          generalistDoctor: selectedGeneralist,
        },
        currentDoctor: state.currentDoctor,
        currentClinic: state.currentClinic,
        availableTimeSlots,
      });

      setState((prev) => ({
        ...prev,
        submitting: false,
        loading: false,
        showSuccessModal: true,
      }));

      setTimeout(() => {
        setState((prev) => ({ ...prev, showSuccessModal: false }));

        // Reset form and clear errors
        setForm((prev) => ({
          ...prev,
          specialistId: "",
          specialistName: "",
          patientName: "",
          email: "",
          contactNumber: "",
          dateOfBirth: "",
          bloodType: "",
          selectedDate: "",
          selectedTimeSlot: "",
          notes: "",
        }));

        // Reset validation errors to initial state
        setErrors({
          patientName: true,
          specialistName: true,
          selectedDate: true,
          selectedTimeSlot: true,
        });

        setSelectedSpecialist(null);
        handlePatientSelectWithValidation(null);

        navigate("/SpecialistAppointments");
      }, 2000);
    } catch (error) {
      console.error("Submit error:", error);
      alert("❌ " + error.message);
      setState((prev) => ({ ...prev, submitting: false, loading: false }));
    }
  };

  // NEW: Calculate stats for display
  const todaysAppointments = getTodaysAppointments();
  const upcomingAppointments = getUpcomingAppointments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans relative">
      {state.loading && <LoadingOverlay />}

      <AppointmentHeader />

      {/* NEW: Optional stats section */}
      {appointmentsWithPatients.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-700 text-sm">
                Total Appointments
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {appointmentsWithPatients.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-700 text-sm">
                Today's Appointments
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {todaysAppointments.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-700 text-sm">
                Upcoming (7 days)
              </h3>
              <p className="text-2xl font-bold text-orange-600">
                {upcomingAppointments.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
        <DoctorInfoCard
          currentDoctor={state.currentDoctor}
          currentClinic={state.currentClinic}
          selectedGeneralist={selectedGeneralist}
          specialists={specialists}
          selectedSpecialist={selectedSpecialist}
          onSpecialistChange={handleSpecialistChange}
          form={form}
          setForm={setForm}
          errors={errors}
          setErrors={setErrors}
          submitting={state.submitting}
        />

        <PatientSelectionCard
          patients={patients}
          filteredPatients={filteredPatients}
          selectedPatient={selectedPatient}
          selectedPatientAppointment={selectedPatientAppointment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onPatientSelect={handlePatientSelectWithValidation}
          setForm={setForm}
          setErrors={setErrors}
          errors={errors}
          appointmentsWithPatients={appointmentsWithPatients}
          loading={patientsLoading}
        />

        <CalendarCard
          form={form}
          calendarDate={calendarDate}
          onCalendarDateChange={setCalendarDate}
          availableTimeSlots={availableTimeSlots}
          bookedAppointments={bookedAppointments}
          isDateAvailable={isDateAvailable}
          onDateSelect={onDateSelect}
          onTimeSlotSelect={onTimeSlotSelect}
          errors={errors}
        />
      </div>

      <AppointmentSummary
        form={form}
        selectedPatient={selectedPatient}
        selectedPatientAppointment={selectedPatientAppointment}
        selectedSpecialist={selectedSpecialist}
        currentDoctor={state.currentDoctor}
        currentClinic={state.currentClinic}
        appointmentsWithPatients={appointmentsWithPatients}
      />

      <SubmitButton
        onSubmit={handleSubmit}
        submitting={state.submitting}
        hasErrors={Object.keys(validate()).length > 0}
        showSuccessModal={state.showSuccessModal}
        setShowSuccessModal={(value) =>
          setState((prev) => ({ ...prev, showSuccessModal: value }))
        }
      />
    </div>
  );
}

export default SpecialistAppointments;

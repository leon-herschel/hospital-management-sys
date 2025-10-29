// AdminAppointments - Consultation/hooks.js (FIXED VERSION)
import { useState, useEffect } from "react";
import { onValue, ref, get } from "firebase/database";
import { database } from "../../../firebase/firebase";
import {
  getDoctorFullName,
  formatDate,
  timeToMinutes,
  getCurrentDateTime,
} from "./utils";

// ===== useSpecialistData Hook =====
export function useSpecialistData() {
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [specialistSchedules, setSpecialistSchedules] = useState({});

  // Fetch specialists (doctors excluding generalists)
  useEffect(() => {
    const unsubscribe = onValue(ref(database, "doctors"), (snap) => {
      const data = snap.val();
      if (data) {
        const specialistsWithKeys = Object.entries(data)
          .map(([key, value]) => ({
            ...value,
            id: key,
            fullName: getDoctorFullName(value),
          }))
          .filter(
            (doctor) =>
              doctor.specialty &&
              doctor.specialty.toLowerCase() !== "generalist"
          );

        setSpecialists(specialistsWithKeys);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch specialist schedules
  useEffect(() => {
    const unsubscribe = onValue(
      ref(database, "specialistSchedules"),
      (snap) => {
        const data = snap.val();
        if (data) {
          const groupedSchedules = {};
          Object.entries(data).forEach(([specialistId, schedules]) => {
            if (schedules && typeof schedules === "object") {
              groupedSchedules[specialistId] = schedules;
            }
          });

          setSpecialistSchedules(groupedSchedules);
          console.log("Loaded specialist schedules:", groupedSchedules);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    specialists,
    selectedSpecialist,
    setSelectedSpecialist,
    specialistSchedules,
  };
}

// ===== ENHANCED usePatientData Hook =====
export function usePatientData(currentDoctorId, currentClinicId) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsWithPatients, setAppointmentsWithPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientAppointment, setSelectedPatientAppointment] =
    useState(null);
  const [selectedGeneralist, setSelectedGeneralist] = useState(null); // ADD THIS
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // ADD THIS FUNCTION
  const fetchGeneralistInfo = async (doctorId) => {
    try {
      const doctorRef = ref(database, `doctors/${doctorId}`);
      const snapshot = await get(doctorRef);
      if (snapshot.exists()) {
        const doctorData = snapshot.val();
        setSelectedGeneralist({
          ...doctorData,
          id: doctorId,
          fullName: getDoctorFullName(doctorData),
        });
        console.log("Fetched generalist:", doctorData);
      } else {
        console.log("No generalist found for ID:", doctorId);
        setSelectedGeneralist(null);
      }
    } catch (error) {
      console.error("Error fetching generalist:", error);
      setSelectedGeneralist(null);
    }
  };

  // Fetch appointments data first
  useEffect(() => {
    const unsubscribe = onValue(ref(database, "appointments"), (snap) => {
      const data = snap.val();
      if (data) {
        const appointmentsWithKeys = Object.entries(data).map(
          ([key, value]) => ({
            ...value,
            id: key,
          })
        );
        setAppointments(appointmentsWithKeys);
      } else {
        setAppointments([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch patients data
  useEffect(() => {
    const unsubscribe = onValue(ref(database, "patients"), (snap) => {
      const data = snap.val();
      if (data) {
        const patientsWithKeys = Object.entries(data).map(([key, value]) => ({
          ...value,
          id: key,
          fullName: `${value.firstName || ""} ${value.lastName || ""}`.trim(),
        }));
        setPatients(patientsWithKeys);
      } else {
        setPatients([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // NEW: Map appointments to patients and filter by clinic
  useEffect(() => {
    if (patients.length > 0 && appointments.length > 0 && currentClinicId) {
      // Create patient map for O(1) lookup
      const patientMap = {};
      patients.forEach((patient) => {
        patientMap[patient.id] = patient;
      });

      // Filter appointments by clinic
      const clinicAppointments = appointments.filter(
        (appointment) => appointment.clinicId === currentClinicId
      );

      // Get unique patient IDs from clinic appointments
      const patientIdsInClinic = new Set(
        clinicAppointments.map((appointment) => appointment.patientId)
      );

      // Filter patients who have appointments in this clinic
      const clinicPatients = patients.filter((patient) =>
        patientIdsInClinic.has(patient.id)
      );

      // Map ALL appointments with patient data (for the enhanced features)
      const appointmentsWithPatientData = appointments.map((appointment) => {
        const patient = patientMap[appointment.patientId];
        return {
          ...appointment,
          patient: patient || null,
        };
      });

      setAppointmentsWithPatients(appointmentsWithPatientData);
      setFilteredPatients(clinicPatients);

      console.log("Patients filtered by clinic:", {
        currentClinicId,
        totalPatients: patients.length,
        clinicAppointments: clinicAppointments.length,
        clinicPatients: clinicPatients.length,
      });
    } else if (currentClinicId) {
      setAppointmentsWithPatients([]);
      setFilteredPatients([]);
    }
  }, [patients, appointments, currentClinicId]);

  // Filter patients based on search term
  useEffect(() => {
    if (!currentClinicId) {
      setFilteredPatients([]);
      return;
    }

    // Get patient IDs who have appointments in this clinic
    const patientIdsInClinic = new Set(
      appointments
        .filter((appointment) => appointment.clinicId === currentClinicId)
        .map((appointment) => appointment.patientId)
    );

    // Filter patients by clinic
    const patientsInClinic = patients.filter((patient) =>
      patientIdsInClinic.has(patient.id)
    );

    if (searchTerm.trim() === "") {
      setFilteredPatients(patientsInClinic);
    } else {
      // Further filter by search term
      const filtered = patientsInClinic.filter(
        (patient) =>
          patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (patient.email &&
            patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (patient.contactNumber && patient.contactNumber.includes(searchTerm))
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients, appointments, currentClinicId]);

  // FIXED: Handle null patient properly
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm("");

    if (!patient || !patient.id) {
      setSelectedPatientAppointment(null);
      setSelectedGeneralist(null); // ADD THIS
      console.log("Patient cleared or invalid");
      return;
    }

    // Find ANY appointment for this patient in the clinic
    const patientAppointment = appointments.find(
      (appointment) =>
        appointment.patientId === patient.id &&
        appointment.clinicId === currentClinicId
    );

    setSelectedPatientAppointment(patientAppointment);
    console.log("Selected patient appointment:", patientAppointment);

    // Fetch generalist doctor info if appointment exists
    if (patientAppointment?.doctorId) {
      console.log("Fetching generalist with ID:", patientAppointment.doctorId);
      fetchGeneralistInfo(patientAppointment.doctorId);
    } else {
      console.log("No appointment found or no doctorId");
      setSelectedGeneralist(null);
    }
  };

  // Helper functions for working with mapped data
  const getAppointmentByPatientId = (patientId) => {
    if (!patientId) return null;
    return appointmentsWithPatients.find(
      (appointment) => appointment.patientId === patientId
    );
  };

  const getPatientByAppointmentId = (appointmentId) => {
    if (!appointmentId) return null;
    const appointment = appointmentsWithPatients.find(
      (appointment) => appointment.id === appointmentId
    );
    return appointment?.patient || null;
  };

  const getTodaysAppointments = () => {
    const today = new Date().toLocaleDateString("en-CA");
    return appointmentsWithPatients.filter(
      (appointment) => appointment.appointmentDate === today
    );
  };

  const getUpcomingAppointments = (days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return appointmentsWithPatients.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= today && appointmentDate <= futureDate;
    });
  };

  return {
    // Original returns
    patients,
    selectedPatient,
    selectedPatientAppointment,
    selectedGeneralist,
    searchTerm,
    setSearchTerm,
    filteredPatients,
    handlePatientSelect,
    loading,

    // Enhanced returns
    appointments,
    appointmentsWithPatients,

    // Helper functions
    getAppointmentByPatientId,
    getPatientByAppointmentId,
    getTodaysAppointments,
    getUpcomingAppointments,
  };
}

// ===== useAppointmentForm Hook (unchanged) =====
export function useAppointmentForm() {
  const [form, setForm] = useState({
    specialistId: "",
    specialistName: "",
    patientName: "",
    email: "",
    contactNumber: "",
    dateOfBirth: "",
    bloodType: "",
    referDoctor: "",
    userId: "",
    selectedDate: "",
    selectedTimeSlot: "",
    notes: "",
    clinic: "",
    clinicId: "",
    addressLine: "",
    type: "",
    createdAt: getCurrentDateTime(),
  });

  const [errors, setErrors] = useState({
    patientName: true,
    specialistName: true,
    selectedDate: true,
    selectedTimeSlot: true,
  });

  const validateField = (name, value) => {
    const required = [
      "patientName",
      "specialistName",
      "selectedDate",
      "selectedTimeSlot",
    ];

    if (required.includes(name)) {
      // Check if value exists and is not empty after trimming
      if (!value || (typeof value === "string" && !value.trim())) {
        return true; // Has error
      }
      return null; // No error
    }

    return null;
  };

  const validate = () => {
    const errs = {};
    const requiredFields = [
      "patientName",
      "specialistName",
      "selectedDate",
      "selectedTimeSlot",
    ];

    requiredFields.forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) {
        errs[field] = true;
      }
    });

    return errs;
  };

  // Real-time validation when form changes
  const updateFormWithValidation = (updates) => {
    setForm((prev) => {
      const newForm = { ...prev, ...updates };

      // Update errors for changed fields
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        Object.keys(updates).forEach((field) => {
          const error = validateField(field, newForm[field]);
          if (error !== null) {
            newErrors[field] = error;
          }
        });
        return newErrors;
      });

      return newForm;
    });
  };

  return {
    form,
    setForm,
    errors,
    setErrors,
    validate,
    validateField,
    updateFormWithValidation,
  };
}

// ===== useCalendarLogic Hook (FIXED for dayOfWeek array structure) =====
export function useCalendarLogic(selectedSpecialist, form) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [specialistSchedules, setSpecialistSchedules] = useState({});
  const [appointments, setAppointments] = useState([]);

  // Fetch specialist schedules
  useEffect(() => {
    const unsubscribe = onValue(
      ref(database, "specialistSchedules"),
      (snap) => {
        const data = snap.val();
        if (data) {
          const groupedSchedules = {};
          Object.entries(data).forEach(([specialistId, schedules]) => {
            if (schedules && typeof schedules === "object") {
              groupedSchedules[specialistId] = schedules;
            }
          });
          setSpecialistSchedules(groupedSchedules);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch appointments - filtered by specialist and date
  useEffect(() => {
    const unsubscribe = onValue(ref(database, "referrals"), (snap) => {
      const data = snap.val();
      if (data) {
        const all = Object.values(data);
        const dateAppointments = all.filter((appointment) => {
          return (
            appointment.appointmentDate === form.selectedDate &&
            appointment.assignedSpecialistId === form.specialistId
          );
        });

        setAppointments(dateAppointments);
        setBookedAppointments(
          dateAppointments.map((appointment) => appointment.appointmentTime)
        );
      } else {
        setAppointments([]);
        setBookedAppointments([]);
      }
    });

    return () => unsubscribe();
  }, [form.selectedDate, form.specialistId]);

  // Check if a date is available based on specialist schedules
  const isDateAvailable = (date) => {
    if (!selectedSpecialist?.id) return false;

    const specialistId = selectedSpecialist.id;
    const schedules = specialistSchedules[specialistId];
    if (!schedules) return false;

    const dayOfWeek = date.getDay();

    for (const scheduleId in schedules) {
      const schedule = schedules[scheduleId];
      if (!schedule.isActive) continue;

      const validFrom = new Date(schedule.validFrom);
      const validTo = schedule.validTo
        ? new Date(schedule.validTo)
        : new Date("2099-12-31");

      if (date < validFrom || date > validTo) continue;

      if (schedule.recurrence?.type === "weekly") {
        const allowedDays = schedule.recurrence.dayOfWeek || {};

        // FIXED: Handle array-style dayOfWeek structure
        // Convert object values to array and check if current dayOfWeek is included
        const allowedDayValues = Object.values(allowedDays);
        if (allowedDayValues.includes(dayOfWeek)) {
          return true;
        }
      }
    }

    return false;
  };

  // Get available time slots for a specific date
  const getAvailableTimeSlotsForDate = (date) => {
    if (!selectedSpecialist?.id) return [];

    const specialistId = selectedSpecialist.id;
    const schedules = specialistSchedules[specialistId];
    if (!schedules) return [];

    const dayOfWeek = date.getDay();
    let allTimeSlots = [];

    for (const scheduleId in schedules) {
      const schedule = schedules[scheduleId];
      if (!schedule.isActive) continue;

      const validFrom = new Date(schedule.validFrom);
      const validTo = schedule.validTo
        ? new Date(schedule.validTo)
        : new Date("2099-12-31");

      if (date < validFrom || date > validTo) continue;

      if (schedule.recurrence?.type === "weekly") {
        const allowedDays = schedule.recurrence.dayOfWeek || {};

        // FIXED: Handle array-style dayOfWeek structure
        // Convert object values to array and check if current dayOfWeek is included
        const allowedDayValues = Object.values(allowedDays);
        if (allowedDayValues.includes(dayOfWeek) && schedule.slotTemplate) {
          const slots = Object.entries(schedule.slotTemplate).map(
            ([time, config], index) => ({
              id: `${scheduleId}-${index}`,
              time: time,
              display: time,
              startTime: time,
              duration: config.durationMinutes || 30,
              status: config.defaultStatus || "available",
              scheduleId: scheduleId,
            })
          );
          allTimeSlots.push(...slots);
        }
      }
    }

    allTimeSlots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    const uniqueSlots = [];
    const seenTimes = new Set();

    for (const slot of allTimeSlots) {
      if (!seenTimes.has(slot.time)) {
        seenTimes.add(slot.time);
        uniqueSlots.push(slot);
      }
    }

    return uniqueSlots;
  };

  // Update available time slots when date or specialist changes
  useEffect(() => {
    if (form.selectedDate && selectedSpecialist) {
      const date = new Date(form.selectedDate);
      const timeSlots = getAvailableTimeSlotsForDate(date);
      setAvailableTimeSlots(timeSlots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [form.selectedDate, selectedSpecialist, specialistSchedules]);

  const handleDateSelect = (date) => {
    return (setForm, setErrors) => {
      if (isDateAvailable(date)) {
        const dateStr = formatDate(date);
        setForm((prev) => ({
          ...prev,
          selectedDate: dateStr,
          selectedTimeSlot: "", // Reset time slot when date changes
        }));

        // Clear date error, but set time slot error since it was reset
        if (setErrors) {
          setErrors((prev) => ({
            ...prev,
            selectedDate: null, // Clear date error
            selectedTimeSlot: true, // Set time slot error since it was reset
          }));
        }
      }
    };
  };

  const handleTimeSlotSelect = (timeSlot) => {
    return (setForm, setErrors) => {
      if (!bookedAppointments.includes(timeSlot.time)) {
        setForm((prev) => ({
          ...prev,
          selectedTimeSlot: timeSlot.time,
        }));

        // Clear time slot error
        if (setErrors) {
          setErrors((prev) => ({
            ...prev,
            selectedTimeSlot: null, // Clear the error
          }));
        }
      }
    };
  };

  return {
    calendarDate,
    setCalendarDate,
    availableTimeSlots,
    bookedAppointments,
    appointments,
    specialistSchedules,
    isDateAvailable,
    handleDateSelect,
    handleTimeSlotSelect,
  };
}

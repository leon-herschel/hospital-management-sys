// AdminAppointments - Consultation/utils.js (ENHANCED VERSION)
import { ref, get, push, set, update } from "firebase/database";
import { database } from "../../../firebase/firebase";

// ===== USER UTILITIES =====
export const getDoctorFullName = (doctorData) => {
  if (!doctorData) return "Doctor";
  if (doctorData.fullName) return doctorData.fullName;
  if (doctorData.name) return doctorData.name;

  const firstName = doctorData.firstName || "";
  const lastName = doctorData.lastName || "";
  const constructedName = `${firstName} ${lastName}`.trim();

  return constructedName || "Doctor";
};

export const fetchUserData = async (user) => {
  try {
    if (!user?.uid) {
      throw new Error("Invalid user object provided");
    }

    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      throw new Error("User data not found in database");
    }

    // Attach UID to doctor object
    const userData = { ...userSnapshot.val(), uid: user.uid };

    if (!userData.clinicAffiliation) {
      throw new Error("Doctor does not have a clinic affiliation");
    }

    const clinicId = userData.clinicAffiliation;
    const clinicRef = ref(database, `clinics/${clinicId}`);
    const clinicSnapshot = await get(clinicRef);
    if (!clinicSnapshot.exists()) {
      throw new Error("Clinic data not found");
    }

    const clinicData = clinicSnapshot.val();
    const doctorFullName = `${userData.firstName || ""} ${
      userData.lastName || ""
    }`.trim();

    return {
      doctor: userData, // now includes uid
      clinic: clinicData,
      doctorName: doctorFullName,
      clinicName: clinicData.name || "Unknown Clinic",
      clinicId,
      addressLine: clinicData.addressLine || clinicData.address || "",
      type: clinicData.type || "",
    };
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    throw error;
  }
};

// ===== DATE UTILITIES =====
export const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-CA"), // outputs "YYYY-MM-DD" in local time
    time: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const formatDate = (date) => {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
};

export const getDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

// Convert time string to minutes for easier comparison
export const timeToMinutes = (timeStr) => {
  const [time, meridiem] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Convert minutes back to time string
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const meridiem = hours < 12 ? "AM" : "PM";

  return `${hour12.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")} ${meridiem}`;
};

export const monthNames = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

// ===== NEW: APPOINTMENT-PATIENT MAPPING UTILITIES =====

/**
 * Maps appointments to patients data
 * @param {Array} appointments - Array of appointments
 * @param {Array} patients - Array of patients
 * @returns {Array} Array of appointments with patient data attached
 */
export const mapAppointmentsToPatients = (appointments, patients) => {
  if (!appointments || !patients) return [];

  // Create patient lookup map for O(1) access
  const patientMap = {};

  if (Array.isArray(patients)) {
    patients.forEach((patient) => {
      patientMap[patient.id] = patient;
    });
  } else if (typeof patients === "object") {
    // If patients is an object from Firebase
    Object.entries(patients).forEach(([key, value]) => {
      patientMap[key] = { ...value, id: key };
    });
  }

  // Map appointments to patients
  return appointments.map((appointment) => {
    const patient = patientMap[appointment.patientId];
    return {
      ...appointment,
      patient: patient
        ? {
            ...patient,
            fullName: `${patient.firstName || ""} ${
              patient.lastName || ""
            }`.trim(),
          }
        : null,
    };
  });
};

/**
 * Filters appointments by doctor ID and maps to patients
 * @param {Array} appointments - Array of appointments
 * @param {Array} patients - Array of patients
 * @param {string} doctorId - Doctor ID to filter by
 * @returns {Array} Filtered and mapped appointments
 */
export const getDoctorAppointmentsWithPatients = (
  appointments,
  patients,
  doctorId
) => {
  if (!appointments || !patients || !doctorId) return [];

  const doctorAppointments = appointments.filter(
    (apt) => apt.doctorId === doctorId
  );
  return mapAppointmentsToPatients(doctorAppointments, patients);
};

/**
 * Gets patients who have appointments with a specific doctor
 * @param {Array} appointments - Array of appointments
 * @param {Array} patients - Array of patients
 * @param {string} doctorId - Doctor ID to filter by
 * @returns {Array} Patients with appointments for this doctor
 */
export const getPatientsWithDoctorAppointments = (
  appointments,
  patients,
  doctorId
) => {
  if (!appointments || !patients || !doctorId) return [];

  const patientIdsWithDoctor = new Set(
    appointments
      .filter((appointment) => appointment.doctorId === doctorId)
      .map((appointment) => appointment.patientId)
  );

  return patients.filter((patient) => patientIdsWithDoctor.has(patient.id));
};

/**
 * Gets appointments for today
 * @param {Array} appointmentsWithPatients - Array of appointments with patient data
 * @returns {Array} Today's appointments
 */
export const getTodaysAppointments = (appointmentsWithPatients) => {
  const today = new Date().toLocaleDateString("en-CA");
  return appointmentsWithPatients.filter(
    (appointment) => appointment.appointmentDate === today
  );
};

/**
 * Gets upcoming appointments within specified days
 * @param {Array} appointmentsWithPatients - Array of appointments with patient data
 * @param {number} days - Number of days ahead to look
 * @returns {Array} Upcoming appointments
 */
export const getUpcomingAppointments = (appointmentsWithPatients, days = 7) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return appointmentsWithPatients.filter((appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    return appointmentDate >= today && appointmentDate <= futureDate;
  });
};

/**
 * Gets appointment statistics
 * @param {Array} appointmentsWithPatients - Array of appointments with patient data
 * @returns {Object} Statistics object
 */
export const getAppointmentStatistics = (appointmentsWithPatients) => {
  if (!appointmentsWithPatients || appointmentsWithPatients.length === 0) {
    return {
      total: 0,
      today: 0,
      upcoming: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      uniquePatients: 0,
    };
  }

  const today = new Date().toLocaleDateString("en-CA");
  const uniquePatientIds = new Set();

  const stats = {
    total: appointmentsWithPatients.length,
    today: 0,
    upcoming: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    uniquePatients: 0,
  };

  appointmentsWithPatients.forEach((appointment) => {
    // Count unique patients
    if (appointment.patientId) {
      uniquePatientIds.add(appointment.patientId);
    }

    // Count by date
    if (appointment.appointmentDate === today) {
      stats.today++;
    }

    const appointmentDate = new Date(appointment.appointmentDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    if (appointmentDate >= tomorrow && appointmentDate <= weekFromNow) {
      stats.upcoming++;
    }

    // Count by status
    switch (appointment.status?.toLowerCase()) {
      case "pending":
        stats.pending++;
        break;
      case "confirmed":
        stats.confirmed++;
        break;
      case "completed":
        stats.completed++;
        break;
    }
  });

  stats.uniquePatients = uniquePatientIds.size;
  return stats;
};

/**
 * Searches appointments and patients by term
 * @param {Array} appointmentsWithPatients - Array of appointments with patient data
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered appointments
 */
export const searchAppointmentsWithPatients = (
  appointmentsWithPatients,
  searchTerm
) => {
  if (!searchTerm.trim()) return appointmentsWithPatients;

  const term = searchTerm.toLowerCase();

  return appointmentsWithPatients.filter((appointment) => {
    const patient = appointment.patient;
    if (!patient) return false;

    return (
      patient.fullName?.toLowerCase().includes(term) ||
      patient.firstName?.toLowerCase().includes(term) ||
      patient.lastName?.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term) ||
      patient.contactNumber?.includes(searchTerm) ||
      appointment.appointmentPurpose?.toLowerCase().includes(term) ||
      appointment.status?.toLowerCase().includes(term)
    );
  });
};

// ===== APPOINTMENT UTILITIES (ENHANCED) =====

// Get specialist's practice location from their schedule
export const getSpecialistPracticeLocation = (
  specialistSchedules,
  specialistId,
  selectedTimeSlot
) => {
  console.log("Getting practice location for:", {
    specialistId,
    selectedTimeSlot,
    specialistSchedules,
  });

  const schedules = specialistSchedules[specialistId];

  if (!schedules) {
    console.log("No schedules found for specialist:", specialistId);
    return { clinicId: "", roomOrUnit: "TBD" };
  }

  console.log("Found schedules:", schedules);

  // Find the schedule that contains the selected time slot
  for (const scheduleId in schedules) {
    const schedule = schedules[scheduleId];
    console.log(`Checking schedule ${scheduleId}:`, schedule);

    if (!schedule.isActive) {
      console.log(`Schedule ${scheduleId} is not active`);
      continue;
    }

    if (schedule.slotTemplate && schedule.slotTemplate[selectedTimeSlot]) {
      console.log(`Found time slot in schedule ${scheduleId}`);
      const location = {
        clinicId: schedule.practiceLocation?.clinicId || "",
        roomOrUnit: schedule.practiceLocation?.roomOrUnit || "TBD",
      };
      console.log("Returning location from specific slot:", location);
      return location;
    }
  }

  // Fallback: return the first active schedule's practice location
  for (const scheduleId in schedules) {
    const schedule = schedules[scheduleId];
    if (schedule.isActive && schedule.practiceLocation) {
      const location = {
        clinicId: schedule.practiceLocation.clinicId || "",
        roomOrUnit: schedule.practiceLocation.roomOrUnit || "TBD",
      };
      console.log("Returning location from fallback:", location);
      return location;
    }
  }

  console.log("No practice location found, returning default");
  return { clinicId: "", roomOrUnit: "TBD" };
};

// Fetch specialist schedules from database
const fetchSpecialistSchedules = async (specialistId) => {
  try {
    const schedulesRef = ref(database, `specialistSchedules/${specialistId}`);
    const snapshot = await get(schedulesRef);

    if (snapshot.exists()) {
      const schedules = snapshot.val();
      console.log(`Fetched schedules for ${specialistId}:`, schedules);
      return schedules;
    } else {
      console.log(`No schedules found for specialist ${specialistId}`);
      return {};
    }
  } catch (error) {
    console.error("Error fetching specialist schedules:", error);
    return {};
  }
};

// ENHANCED: handleAppointmentSubmit with better logging and validation
export const handleAppointmentSubmit = async ({
  form,
  selectedSpecialist,
  selectedPatient,
  selectedPatientAppointment,
  currentDoctor,
  currentClinic,
  availableTimeSlots,
}) => {
  console.log("Starting appointment submission with data:", {
    form,
    selectedSpecialist,
    selectedPatient,
    selectedPatientAppointment,
    currentDoctor,
    currentClinic,
    availableTimeSlots,
  });

  if (!selectedPatientAppointment) {
    throw new Error(
      "No appointment found for the selected patient with this doctor"
    );
  }

  if (!selectedSpecialist) {
    throw new Error("No specialist selected");
  }

  if (!selectedPatient) {
    throw new Error("No patient selected");
  }

  const selectedTimeSlot = availableTimeSlots.find(
    (slot) => slot.time === form.selectedTimeSlot
  );

  const description = selectedSpecialist?.specialty || "No specialty provided";

  // Parse patient name
  const nameParts = form.patientName.trim().split(" ");
  const patientFirstName = nameParts[0] || "";
  const patientLastName =
    nameParts.length > 2 ? nameParts.slice(2).join(" ") : nameParts[1] || "";
  const patientMiddleName = nameParts.length > 2 ? nameParts[1] : "";

  // Get referring doctor information
  const referringDoctorName = getDoctorFullName(currentDoctor);
  const referringDoctorParts = referringDoctorName.split(" ");
  const referringFirstName = referringDoctorParts[0] || "";
  const referringLastName =
    referringDoctorParts.length > 1
      ? referringDoctorParts.slice(1).join(" ")
      : "";

  // Referring clinic info
  const referringClinicName = form.clinic || "Unknown Clinic";
  const referringClinicId = form.clinicId || "";

  // Parse specialist name
  const specialistNameParts = (selectedSpecialist?.fullName || "").split(" ");
  const specialistFirstName = specialistNameParts[0] || "";
  const specialistLastName =
    specialistNameParts.length > 2
      ? specialistNameParts.slice(2).join(" ")
      : specialistNameParts[1] || "";
  const specialistMiddleName =
    specialistNameParts.length > 2 ? specialistNameParts[1] : "";

  // Fetch specialist schedules to get practice location
  const specialistSchedules = await fetchSpecialistSchedules(form.specialistId);
  const schedulesObject = { [form.specialistId]: specialistSchedules };
  const specialistPracticeLocation = getSpecialistPracticeLocation(
    schedulesObject,
    form.specialistId,
    form.selectedTimeSlot
  );

  // Generate unique ID for referral
  const referralRef = push(ref(database, "referrals"));
  const clinicAppointmentId = selectedPatientAppointment.id;

  const specialistAvailabilityPath = `specialistDailyAvailability/${
    form.specialistId
  }/${
    selectedTimeSlot?.scheduleId ||
    `sched_${form.specialistId}_${form.selectedDate}`
  }/${form.selectedDate}/${form.selectedTimeSlot}`;

  const availabilityData = {
    bookedAt: new Date().toISOString(),
    isBooked: true,
    patientId: selectedPatient?.id || "",
    referralId: referralRef.key,
    status: "pending",
  };

  // Prepare referral data with clinicAppointmentId
  const referralData = {
    appointmentDate: form.selectedDate,
    appointmentTime: form.selectedTimeSlot,
    assignedSpecialistFirstName: specialistFirstName,
    assignedSpecialistId: form.specialistId,
    assignedSpecialistLastName: specialistLastName,
    assignedSpecialistMiddleName: specialistMiddleName,
    clinicAppointmentId: clinicAppointmentId,
    generalistNotes:
      form.notes || "Specialist appointment scheduled through doctor panel",
    initialReasonForReferral: `${description} Consultation`,
    lastUpdated: new Date().toISOString(),
    patientArrivalConfirmed: false,
    patientFirstName: patientFirstName,
    patientMiddleName: patientMiddleName,
    patientId: selectedPatient?.id || "",
    patientLastName: patientLastName,
    practiceLocation: specialistPracticeLocation,
    referralTimestamp: new Date().toISOString(),
    referringClinicId: referringClinicId,
    referringClinicName: referringClinicName,
    referringGeneralistFirstName: referringFirstName,
    referringGeneralistId: currentDoctor.uid, // <-- FIXED: pull from currentDoctor
    referringGeneralistLastName: referringLastName,
    sourceSystem: "UniHealth_Doctor_Panel",
    specialistScheduleId:
      selectedTimeSlot?.scheduleId ||
      `sched_${form.specialistId}_${form.selectedDate}`,
    status: "pending",
  };

  const appointmentUpdateData = {
    relatedReferralId: referralRef.key,
    lastUpdated: new Date().toISOString(),
  };

  try {
    await Promise.all([
      set(ref(database, `referrals/${referralRef.key}`), referralData),
      update(
        ref(database, `appointments/${clinicAppointmentId}`),
        appointmentUpdateData
      ),
      set(ref(database, specialistAvailabilityPath), availabilityData),
    ]);

    return {
      success: true,
      referralId: referralRef.key,
      appointmentId: clinicAppointmentId,
      specialistId: form.specialistId,
      patientId: selectedPatient.id,
      appointmentDate: form.selectedDate,
      appointmentTime: form.selectedTimeSlot,
    };
  } catch (error) {
    console.error("Error saving appointment data:", error);
    throw new Error(`Failed to save appointment: ${error.message}`);
  }
};

// ===== NEW: ENHANCED DEBUGGING UTILITIES =====

/**
 * Logs detailed appointment-patient mapping information for debugging
 * @param {Array} appointments - Raw appointments
 * @param {Array} patients - Raw patients
 * @param {Array} appointmentsWithPatients - Mapped appointments
 * @param {string} doctorId - Current doctor ID
 */
export const debugAppointmentPatientMapping = (
  appointments,
  patients,
  appointmentsWithPatients,
  doctorId
) => {
  console.group("🔍 Appointment-Patient Mapping Debug");

  console.log("Raw Data:", {
    appointments: appointments?.length || 0,
    patients: patients?.length || 0,
    doctorId,
  });

  console.log("Mapped Data:", {
    appointmentsWithPatients: appointmentsWithPatients?.length || 0,
    withPatientData:
      appointmentsWithPatients?.filter((apt) => apt.patient !== null).length ||
      0,
    withoutPatientData:
      appointmentsWithPatients?.filter((apt) => apt.patient === null).length ||
      0,
  });

  if (appointmentsWithPatients?.length > 0) {
    console.log("Sample Mapped Appointment:", appointmentsWithPatients[0]);

    const stats = getAppointmentStatistics(appointmentsWithPatients);
    console.log("Statistics:", stats);

    const todaysAppointments = getTodaysAppointments(appointmentsWithPatients);
    console.log("Today's Appointments:", todaysAppointments);
  }

  // Check for missing patient data
  const missingPatients =
    appointmentsWithPatients?.filter((apt) => apt.patientId && !apt.patient) ||
    [];

  if (missingPatients.length > 0) {
    console.warn("⚠️ Appointments with missing patient data:", missingPatients);
  }

  console.groupEnd();
};

/**
 * Validates appointment-patient mapping data integrity
 * @param {Array} appointmentsWithPatients - Mapped appointments
 * @returns {Object} Validation result
 */
export const validateAppointmentPatientMapping = (appointmentsWithPatients) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      total: appointmentsWithPatients?.length || 0,
      withPatientData: 0,
      withoutPatientData: 0,
      duplicatePatients: 0,
    },
  };

  if (!appointmentsWithPatients || !Array.isArray(appointmentsWithPatients)) {
    validation.isValid = false;
    validation.errors.push("appointmentsWithPatients is not a valid array");
    return validation;
  }

  const patientIds = new Set();
  const duplicatePatientIds = new Set();

  appointmentsWithPatients.forEach((appointment, index) => {
    // Check if appointment has required fields
    if (!appointment.id) {
      validation.errors.push(`Appointment at index ${index} missing ID`);
      validation.isValid = false;
    }

    if (!appointment.patientId) {
      validation.warnings.push(
        `Appointment ${appointment.id} missing patientId`
      );
    } else {
      // Check for patient data
      if (appointment.patient) {
        validation.stats.withPatientData++;

        // Check for duplicate patients
        if (patientIds.has(appointment.patientId)) {
          duplicatePatientIds.add(appointment.patientId);
        } else {
          patientIds.add(appointment.patientId);
        }
      } else {
        validation.stats.withoutPatientData++;
        validation.warnings.push(
          `Appointment ${appointment.id} has patientId ${appointment.patientId} but no patient data`
        );
      }
    }

    // Validate patient data structure if present
    if (appointment.patient) {
      if (!appointment.patient.fullName && !appointment.patient.firstName) {
        validation.warnings.push(
          `Patient data for appointment ${appointment.id} missing name information`
        );
      }
    }
  });

  validation.stats.duplicatePatients = duplicatePatientIds.size;

  if (duplicatePatientIds.size > 0) {
    validation.warnings.push(
      `Found ${
        duplicatePatientIds.size
      } patients with multiple appointments: ${Array.from(
        duplicatePatientIds
      ).join(", ")}`
    );
  }

  return validation;
};

import { useState, useEffect, useRef } from "react";
import React from "react";
import { ref, push, set, onValue, get } from "firebase/database";
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  Phone,
  DollarSign,
  Search,
  UserCheck,
  Stethoscope,
} from "lucide-react";

function SpecialistAppointments() {
  const navigate = useNavigate();
  const newRef = push(ref(database, "specialistAppointments"));

  // Helper function to get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString("en-CA"), // outputs "YYYY-MM-DD" in local time
      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

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

  const [state, setState] = useState({
    specialists: [],
    selectedSpecialist: null,
    selectedDescription: "",
    selectedServiceFee: null,
    selectedPatient: null,
    patients: [],
    filteredPatients: [],
    searchTerm: "",
    bookedAppointments: [],
    appointments: [],
    submitting: false,
    loading: false,
    currentDoctor: null,
    currentClinic: null,
    availableTimeSlots: [],
    calendarDate: new Date(),
    errors: {
      patientName: true,
      specialistName: true,
      selectedDate: true,
      selectedTimeSlot: true,
    },
  });

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
  };

  const isDateAvailable = (date) => {
    if (!state.selectedSpecialist?.availability) return false;

    const dateStr = formatDate(date);
    const dayName = date
      .toLocaleDateString("en-US", { weekday: "monday" })
      .toLowerCase();

    // Check if date is in specific dates
    const specificDates = state.selectedSpecialist.availability.specificDates;
    if (specificDates && specificDates[dateStr]) {
      return true;
    }

    // Check weekly schedule
    const weeklySchedule = state.selectedSpecialist.availability.weeklySchedule;
    if (
      weeklySchedule &&
      weeklySchedule[dayName] &&
      weeklySchedule[dayName].enabled
    ) {
      return true;
    }

    return false;
  };

  const getAvailableTimeSlotsForDate = (date) => {
    if (!state.selectedSpecialist?.availability) return [];

    const dateStr = formatDate(date);
    const dayName = date
      .toLocaleDateString("en-US", { weekday: "monday" })
      .toLowerCase();

    let timeSlots = [];

    // Check specific dates first
    const specificDates = state.selectedSpecialist.availability.specificDates;
    if (
      specificDates &&
      specificDates[dateStr] &&
      specificDates[dateStr].timeSlots
    ) {
      timeSlots = specificDates[dateStr].timeSlots;
    } else {
      // Check weekly schedule
      const weeklySchedule =
        state.selectedSpecialist.availability.weeklySchedule;
      if (
        weeklySchedule &&
        weeklySchedule[dayName] &&
        weeklySchedule[dayName].enabled &&
        weeklySchedule[dayName].timeSlots
      ) {
        timeSlots = weeklySchedule[dayName].timeSlots;
      }
    }

    // Generate time slots based on start and end times
    const slots = [];
    timeSlots.forEach((slot, index) => {
      const startTime = slot.startTime;
      const endTime = slot.endTime;

      // Generate hourly slots between start and end time
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);

      while (start < end) {
        const timeStr = start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        slots.push({
          id: `${index}-${slots.length}`,
          time: timeStr,
          startTime: start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          display: timeStr,
        });
        start.setHours(start.getHours() + 1); // Add 1 hour
      }
    });

    return slots;
  };

  // Fetch user data using async/await
  const fetchUserData = async (user) => {
    try {
      // Try doctors collection first
      const doctorRef = ref(database, `doctors/${user.uid}`);
      const doctorSnapshot = await get(doctorRef);

      if (doctorSnapshot.exists()) {
        const doctorData = doctorSnapshot.val();
        setState((prev) => ({ ...prev, currentDoctor: doctorData }));

        // Get doctor name with multiple fallbacks
        const doctorName =
          doctorData.fullName ||
          doctorData.name ||
          `${doctorData.firstName || ""} ${doctorData.lastName || ""}`.trim() ||
          "Doctor";

        // Set doctor information in form
        setForm((prev) => ({
          ...prev,
          referDoctor: doctorName,
          userId: user.uid,
        }));

        // Fetch clinic data if doctor has clinic affiliation
        if (doctorData.clinic) {
          await fetchClinicData(doctorData.clinic);
        }
      } else {
        // Fallback to users collection
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          if (userData.role === "doctor") {
            // Set user data as doctor data
            setState((prev) => ({ ...prev, currentDoctor: userData }));

            // Get user name with multiple fallbacks
            const userName =
              userData.fullName ||
              userData.name ||
              `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
              "Doctor";

            setForm((prev) => ({
              ...prev,
              referDoctor: userName,
              userId: user.uid,
            }));

            // Fetch clinic data if user has clinic affiliation
            if (userData.clinicAffiliation) {
              await fetchClinicData(userData.clinicAffiliation);
            }
          } else {
            // User not authorized, redirect
            navigate("/login");
          }
        } else {
          // No user data found, redirect
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      navigate("/login");
    }
  };

  // Fetch clinic data using async/await
  const fetchClinicData = async (clinicId) => {
    try {
      const clinicRef = ref(database, `clinics/${clinicId}`);
      const snapshot = await get(clinicRef);

      if (snapshot.exists()) {
        const clinicData = snapshot.val();
        setState((prev) => ({ ...prev, currentClinic: clinicData }));

        setForm((prev) => ({
          ...prev,
          clinic: clinicData.name || clinicId,
          clinicId: clinicId,
          addressLine: clinicData.addressLine || "",
          type: clinicData.type || "",
        }));
      } else {
        // Fallback if clinic data not found
        setForm((prev) => ({
          ...prev,
          clinic: clinicId,
          clinicId: clinicId,
          addressLine: "",
          type: "",
        }));
      }
    } catch (error) {
      console.error("Error fetching clinic data:", error);
      // Set fallback values
      setForm((prev) => ({
        ...prev,
        clinic: clinicId,
        clinicId: clinicId,
        addressLine: "",
        type: "",
      }));
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        // User not authenticated, redirect to login
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Update form date every minute to handle day changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newDateTime = getCurrentDateTime();
      setForm((prev) => ({
        ...prev,
        createdAt: newDateTime,
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch patients data
  useEffect(() => {
    onValue(ref(database, "patients"), (snap) => {
      const data = snap.val();
      if (data) {
        const patientsWithKeys = Object.entries(data).map(([key, value]) => ({
          ...value,
          id: key,
          fullName: `${value.firstName || ""} ${value.lastName || ""}`.trim(),
        }));
        setState((prev) => ({
          ...prev,
          patients: patientsWithKeys,
          filteredPatients: patientsWithKeys,
        }));
      }
    });
  }, []);

  // Fetch specialists (doctors excluding generalists)
  useEffect(() => {
    onValue(ref(database, "doctors"), (snap) => {
      const data = snap.val();
      if (data) {
        const specialistsWithKeys = Object.entries(data)
          .map(([key, value]) => ({
            ...value,
            id: key,
            fullName:
              `${value.firstName || ""} ${value.lastName || ""}`.trim() ||
              value.fullName ||
              value.name,
          }))
          .filter(
            (doctor) =>
              doctor.specialty &&
              doctor.specialty.toLowerCase() !== "generalist"
          );

        setState((prev) => ({
          ...prev,
          specialists: specialistsWithKeys,
        }));
      }
    });
  }, []);

  // Fetch appointments - filtered by specialist and date
  useEffect(() => {
    onValue(ref(database, `specialistAppointments`), (snap) => {
      const data = snap.val();
      if (data) {
        const all = Object.values(data);

        // Filter appointments for selected date with selected specialist
        const dateAppointments = all.filter((appointment) => {
          return (
            appointment.selectedDate === form.selectedDate &&
            appointment.specialistId === form.specialistId
          );
        });

        console.log(
          `Found ${dateAppointments.length} appointments for ${form.selectedDate}`
        );

        setState((prev) => ({
          ...prev,
          appointments: dateAppointments,
          bookedAppointments: dateAppointments.map(
            (appointment) => appointment.selectedTimeSlot
          ),
        }));
      } else {
        // No appointments data at all
        setState((prev) => ({
          ...prev,
          appointments: [],
          bookedAppointments: [],
        }));
      }
    });
  }, [form.selectedDate, form.specialistId]);

  // Update available time slots when date or specialist changes
  useEffect(() => {
    if (form.selectedDate && state.selectedSpecialist) {
      const date = new Date(form.selectedDate);
      const timeSlots = getAvailableTimeSlotsForDate(date);
      setState((prev) => ({
        ...prev,
        availableTimeSlots: timeSlots,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        availableTimeSlots: [],
      }));
    }
  }, [form.selectedDate, state.selectedSpecialist]);

  // Filter patients based on search term
  useEffect(() => {
    if (state.searchTerm.trim() === "") {
      setState((prev) => ({ ...prev, filteredPatients: prev.patients }));
    } else {
      const filtered = state.patients.filter(
        (patient) =>
          patient.fullName
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()) ||
          (patient.email &&
            patient.email
              .toLowerCase()
              .includes(state.searchTerm.toLowerCase())) ||
          (patient.contactNumber &&
            patient.contactNumber.includes(state.searchTerm))
      );
      setState((prev) => ({ ...prev, filteredPatients: filtered }));
    }
  }, [state.searchTerm, state.patients]);

  const validateField = (name, value) => {
    const required = [
      "patientName",
      "specialistName",
      "selectedDate",
      "selectedTimeSlot",
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

    if (name === "specialistName") {
      const selectedSpecialist = state.specialists.find(
        (specialist) => specialist.fullName === value
      );
      setForm((prev) => ({
        ...prev,
        [name]: value,
        specialistId: selectedSpecialist?.id || "",
        selectedDate: "",
        selectedTimeSlot: "",
      }));
      setState((prev) => ({
        ...prev,
        selectedSpecialist: selectedSpecialist || null,
        errors: {
          ...prev.errors,
          selectedDate: true,
          selectedTimeSlot: true,
        },
        selectedDescription: selectedSpecialist
          ? selectedSpecialist.specialty
          : "",
        selectedServiceFee: selectedSpecialist
          ? selectedSpecialist.consultationFee
          : null,
      }));
    }
  };

  const handlePatientSelect = (patient) => {
    setState((prev) => ({ ...prev, selectedPatient: patient, searchTerm: "" }));

    setForm((prev) => ({
      ...prev,
      patientName: patient.fullName,
      email: patient.email || "",
      contactNumber: patient.contactNumber || patient.phoneNumber || "",
      dateOfBirth: patient.dateOfBirth || "",
      bloodType: patient.bloodType || "",
    }));

    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        patientName: validateField("patientName", patient.fullName),
      },
    }));
  };

  const handleDateSelect = (date) => {
    if (isDateAvailable(date)) {
      const dateStr = formatDate(date);
      setForm((prev) => ({
        ...prev,
        selectedDate: dateStr,
        selectedTimeSlot: "", // Reset time slot when date changes
      }));
      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          selectedDate: null,
          selectedTimeSlot: true, // Reset time slot error
        },
      }));
    }
  };

  const handleTimeSlotSelect = (timeSlot) => {
    if (!state.bookedAppointments.includes(timeSlot.id)) {
      setForm((prev) => ({
        ...prev,
        selectedTimeSlot: timeSlot.id,
      }));
      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          selectedTimeSlot: null,
        },
      }));
    }
  };

  const validate = () => {
    const errs = {};

    // Validate required fields
    const requiredFields = [
      "patientName",
      "specialistName",
      "selectedDate",
      "selectedTimeSlot",
    ];
    requiredFields.forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) errs[field] = true;
    });

    return errs;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setState((prev) => ({ ...prev, errors: validationErrors }));
    if (Object.keys(validationErrors).length > 0) return;

    setState((prev) => ({ ...prev, submitting: true, loading: true }));

    try {
      const selectedTimeSlot = state.availableTimeSlots.find(
        (slot) => slot.id === form.selectedTimeSlot
      );
      const description = state.selectedDescription || "No specialty provided";
      const nameParts = form.patientName.trim().split(" ");
      const firstName =
        nameParts.length === 1
          ? nameParts[0]
          : nameParts.slice(0, -1).join(" ");
      const lastName =
        nameParts.length === 1 ? "" : nameParts[nameParts.length - 1];

      // Ensure all required fields have fallback values
      const doctorName =
        form.referDoctor ||
        state.currentDoctor?.fullName ||
        state.currentDoctor?.name ||
        `${state.currentDoctor?.firstName || ""} ${
          state.currentDoctor?.lastName || ""
        }`.trim() ||
        "Doctor";

      const clinicName =
        form.clinic || state.currentClinic?.name || "Unknown Clinic";

      const dataToPush = {
        ...form,
        referDoctor: doctorName,
        clinic: clinicName,
        appointmentTime: selectedTimeSlot?.time || "",
        description,
        firstName,
        lastName,
        status: "Pending",
        consultationFee: state.selectedServiceFee || 0,
        patientId: state.selectedPatient?.id || "",
        specialistName: form.specialistName || "",
        specialistId: form.specialistId || "",
        selectedDate: form.selectedDate || "",
        selectedTimeSlot: form.selectedTimeSlot || "",
        notes: form.notes || "",
        clinicId: form.clinicId || "",
        addressLine: form.addressLine || "",
        type: form.type || "",
        userId: form.userId || "",
        createdAt: getCurrentDateTime(),
      };

      await set(
        ref(database, `specialistAppointments/${newRef.key}`),
        dataToPush
      );

      alert("✅ Specialist appointment booked successfully!");

      // Reset form but keep doctor and clinic info
      setForm({
        specialistId: "",
        specialistName: "",
        patientName: "",
        email: "",
        contactNumber: "",
        dateOfBirth: "",
        bloodType: "",
        referDoctor: doctorName,
        userId: form.userId,
        selectedDate: "",
        selectedTimeSlot: "",
        notes: "",
        clinic: clinicName,
        clinicId: form.clinicId,
        addressLine: state.currentClinic?.addressLine || "",
        type: state.currentClinic?.type || "",
        createdAt: getCurrentDateTime(),
      });

      setState((prev) => ({
        ...prev,
        selectedServiceFee: null,
        selectedPatient: null,
        selectedSpecialist: null,
        searchTerm: "",
        availableTimeSlots: [],
        errors: {
          patientName: true,
          specialistName: true,
          selectedDate: true,
          selectedTimeSlot: true,
        },
      }));

      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Submit error:", error);
      alert("❌ " + error.message);
    }

    setState((prev) => ({ ...prev, submitting: false, loading: false }));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(state.calendarDate);
    const firstDay = getFirstDayOfMonth(state.calendarDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        state.calendarDate.getFullYear(),
        state.calendarDate.getMonth(),
        day
      );
      const dateStr = formatDate(date);
      const isAvailable = isDateAvailable(date);
      const isSelected = form.selectedDate === dateStr;
      const isToday = dateStr === formatDate(new Date());
      const isPast = date < new Date().setHours(0, 0, 0, 0);

      days.push(
        <div
          key={day}
          onClick={() => isAvailable && !isPast && handleDateSelect(date)}
          className={`p-2 text-center cursor-pointer border rounded-lg transition-all ${
            isPast
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isSelected
              ? "bg-blue-600 text-white border-blue-600"
              : isAvailable
              ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          } ${isToday ? "ring-2 ring-blue-400" : ""}`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const renderTimeSlots = () => {
    return state.availableTimeSlots.map((slot) => {
      const isBooked = state.bookedAppointments.includes(slot.id);
      const isSelected = form.selectedTimeSlot === slot.id;

      return (
        <div
          key={slot.id}
          onClick={() => !isBooked && handleTimeSlotSelect(slot)}
          className={`rounded-lg p-3 text-center cursor-pointer transition-all transform hover:scale-105 shadow-sm min-h-[60px] flex flex-col justify-center ${
            isBooked
              ? "bg-red-400 text-white cursor-not-allowed opacity-75"
              : isSelected
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
              : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600"
          }`}
        >
          <div className="font-semibold text-sm">{slot.display}</div>
        </div>
      );
    });
  };

  const monthNames = [
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans relative">
      {state.loading && (
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
      )}

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

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
        {/* Doctor & Clinic Information - First Column */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Doctor & Clinic Info
            </h2>
          </div>

          {state.currentDoctor && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                Referring Doctor
              </h3>
              <p>
                <strong>Name:</strong> Dr.{" "}
                {state.currentDoctor.lastName || state.currentDoctor.fullName}
              </p>
            </div>
          )}

          {state.currentClinic && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
              <h3 className="font-semibold text-green-800 mb-2">
                Clinic Information
              </h3>
              <p>
                <strong>Name:</strong> {state.currentClinic.name}
              </p>
              <p>
                <strong>Address:</strong> {state.currentClinic.addressLine}
              </p>
              <p>
                <strong>Type:</strong> {state.currentClinic.type}
              </p>
            </div>
          )}

          {/* Specialist Selection */}
          <div className="relative mb-4">
            <Stethoscope className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              name="specialistName"
              value={form.specialistName}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                state.errors.specialistName
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              disabled={state.submitting}
            >
              <option value="">-- Select Specialist --</option>
              {state.specialists.map((specialist) => (
                <option key={specialist.id} value={specialist.fullName}>
                  Dr. {specialist.fullName} - {specialist.specialty}
                </option>
              ))}
            </select>
            {state.errors.specialistName ? (
              <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
            ) : form.specialistName ? (
              <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-600" />
            ) : null}
            {state.errors.specialistName && (
              <p className="text-red-500 text-sm mt-1">
                Specialist is required
              </p>
            )}
          </div>

          {state.selectedDescription && (
            <div className="text-gray-600 text-sm mt-2 bg-gray-50 rounded p-2 border border-gray-200 mb-4">
              <strong>Specialty:</strong> {state.selectedDescription}
            </div>
          )}

          {state.selectedServiceFee && (
            <div className="flex items-center space-x-2 bg-green-50 rounded-lg p-3 border border-green-200 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Consultation Fee
                </p>
                <p className="text-lg font-bold text-green-700">
                  ₱
                  {typeof state.selectedServiceFee === "number"
                    ? state.selectedServiceFee.toLocaleString()
                    : state.selectedServiceFee}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional Notes (optional)"
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              disabled={state.submitting}
              rows="3"
            />
          </div>
        </div>

        {/* Patient Selection - Second Column */}
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
              value={state.searchTerm}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              placeholder="Search patients by name, email, or phone..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Patient List */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg mb-4">
            {state.filteredPatients.length > 0 ? (
              state.filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className={`p-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    state.selectedPatient?.id === patient.id
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
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {state.searchTerm
                  ? "No patients found matching your search"
                  : "No patients available"}
              </div>
            )}
          </div>

          {/* Selected Patient Details */}
          {state.selectedPatient && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">
                Selected Patient
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {state.selectedPatient.fullName}
                </p>
                {state.selectedPatient.email && (
                  <p>
                    <strong>Email:</strong> {state.selectedPatient.email}
                  </p>
                )}
                {state.selectedPatient.contactNumber && (
                  <p>
                    <strong>Phone:</strong>{" "}
                    {state.selectedPatient.contactNumber}
                  </p>
                )}
                {state.selectedPatient.dateOfBirth && (
                  <p>
                    <strong>DOB:</strong> {state.selectedPatient.dateOfBirth}
                  </p>
                )}
                {state.selectedPatient.bloodType && (
                  <p>
                    <strong>Blood Type:</strong>{" "}
                    {state.selectedPatient.bloodType}
                  </p>
                )}
              </div>
            </div>
          )}

          {state.errors.patientName && (
            <p className="text-red-500 text-sm mt-2">Please select a patient</p>
          )}
        </div>

        {/* Calendar - Third Column */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Select Date & Time
            </h2>
          </div>

          {form.specialistName ? (
            <>
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4">
                <button
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
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-gray-700">
                    {monthNames[state.calendarDate.getMonth()]}{" "}
                    {state.calendarDate.getFullYear()}
                  </span>
                </div>
                <button
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
              <div className="grid grid-cols-7 gap-1 mb-4">
                {renderCalendar()}
              </div>

              {/* Legend */}
              <div className="flex justify-center space-x-4 text-xs mb-4">
                {[
                  {
                    color: "bg-green-100 border-green-300",
                    label: "Available",
                  },
                  { color: "bg-gray-50", label: "Unavailable" },
                  { color: "bg-blue-600", label: "Selected" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded border ${color}`}></div>
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>

              {state.errors.selectedDate && (
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
                  {state.availableTimeSlots.length > 0 ? (
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

                  {state.availableTimeSlots.length > 0 && (
                    <div className="flex justify-center space-x-4 text-xs">
                      {[
                        {
                          color: "from-green-400 to-blue-500",
                          label: "Available",
                        },
                        { color: "bg-red-400", label: "Booked" },
                        {
                          color: "from-blue-600 to-purple-600",
                          label: "Selected",
                        },
                      ].map(({ color, label }) => (
                        <div
                          key={label}
                          className="flex items-center space-x-1"
                        >
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

                  {state.errors.selectedTimeSlot && (
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
      </div>

      {/* Appointment Summary - Full Width Below */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              form.selectedDate &&
                form.selectedTimeSlot && {
                  title: "Appointment Time",
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
                          {state.availableTimeSlots.find(
                            (slot) => slot.id === form.selectedTimeSlot
                          )?.display || "Time selected"}
                        </span>
                      </div>
                    </div>
                  ),
                  isSpecial: true,
                },
              {
                title: "Clinic Information",
                content: (
                  <div className="space-y-2">
                    <p>
                      <strong>Name:</strong>{" "}
                      {state.currentClinic?.name || "Not loaded"}
                    </p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {state.currentClinic?.addressLine || "Not provided"}
                    </p>
                    <p>
                      <strong>Type:</strong>{" "}
                      {state.currentClinic?.type || "Not specified"}
                    </p>
                  </div>
                ),
                isSpecial: true,
              },
              state.selectedPatient && {
                title: "Patient Details",
                content: (
                  <div className="space-y-2">
                    <p>
                      <strong>Name:</strong> {state.selectedPatient.fullName}
                    </p>
                    {state.selectedPatient.email && (
                      <p>
                        <strong>Email:</strong> {state.selectedPatient.email}
                      </p>
                    )}
                    {state.selectedPatient.contactNumber && (
                      <p>
                        <strong>Phone:</strong>{" "}
                        {state.selectedPatient.contactNumber}
                      </p>
                    )}
                    {state.selectedPatient.dateOfBirth && (
                      <p>
                        <strong>DOB:</strong>{" "}
                        {state.selectedPatient.dateOfBirth}
                      </p>
                    )}
                    {state.selectedPatient.bloodType && (
                      <p>
                        <strong>Blood Type:</strong>{" "}
                        {state.selectedPatient.bloodType}
                      </p>
                    )}
                  </div>
                ),
                isSpecial: true,
              },
              state.selectedSpecialist && {
                title: "Specialist Details",
                content: (
                  <div className="space-y-2">
                    <p>
                      <strong>Doctor:</strong> Dr.{" "}
                      {state.selectedSpecialist.fullName}
                    </p>
                    <p>
                      <strong>Specialty:</strong>{" "}
                      {state.selectedSpecialist.specialty}
                    </p>
                    {state.selectedServiceFee && (
                      <div className="flex items-center space-x-2 bg-green-50 rounded-lg p-2 border border-green-200">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          Fee: ₱
                          {typeof state.selectedServiceFee === "number"
                            ? state.selectedServiceFee.toLocaleString()
                            : state.selectedServiceFee}
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
            ]
              .filter(Boolean)
              .map((item, idx) => (
                <div
                  key={idx}
                  className={item.isSpecial ? "" : "bg-gray-50 rounded-lg p-4"}
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
                        className={`text-gray-600 ${
                          item.isSmall ? "text-sm" : ""
                        }`}
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
              <span>Booking Appointment...</span>
            </div>
          ) : (
            "Book Specialist Appointment"
          )}
        </button>
      </div>
    </div>
  );
}

export default SpecialistAppointments;

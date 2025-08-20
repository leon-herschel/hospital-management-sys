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
  Microscope,
  Phone,
  Calendar,
  Droplet,
  DollarSign,
  Search,
  UserCheck,
} from "lucide-react";

function RequestLabTest() {
  const navigate = useNavigate();
  const slotRef = useRef(null);
  const newRef = push(ref(database, "clinicLabRequests"));

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
    labTestName: "",
    labTestId: "",
    patientName: "",
    email: "",
    contactNumber: "",
    dateOfBirth: "",
    bloodType: "",
    referDoctor: "",
    userId: "",
    slotNumber: "",
    notes: "",
    clinic: "",
    clinicId: "",
    addressLine: "",
    type: "",
    createdAt: getCurrentDateTime(), // Use function to get current date/time
  });

  const [state, setState] = useState({
    examTypes: [],
    selectedDescription: "",
    selectedServiceFee: null,
    selectedPatient: null,
    patients: [],
    filteredPatients: [],
    searchTerm: "",
    bookedSlots: [],
    appointments: [],
    submitting: false,
    loading: false,
    currentPage: 0,
    currentDoctor: null,
    currentClinic: null,
    errors: {
      patientName: true,
      labTestName: true,
      slotNumber: true,
    },
  });

  // Generate time slots with ranges
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8; // 8:00 AM
    const endHour = 18; // 6:00 PM (last slot starts at 5:00 PM)

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = hour <= 12 ? `${hour}:00AM` : `${hour - 12}:00PM`;
      const endTime =
        hour + 1 <= 12 ? `${hour + 1}:00AM` : `${hour + 1 - 12}:00PM`;

      // Handle 12 PM case
      const displayStartTime = hour === 12 ? "12:00PM" : startTime;
      const displayEndTime = hour + 1 === 12 ? "12:00PM" : endTime;

      // Create 10 slots per hour
      for (let slot = 1; slot <= 10; slot++) {
        const slotNumber = (hour - startHour) * 10 + slot;
        slots.push({
          number: slotNumber,
          display: `Slot ${slotNumber}`,
          timeRange: `${displayStartTime} - ${displayEndTime}`,
          fullDisplay: `Slot ${slotNumber} (${displayStartTime} - ${displayEndTime})`,
        });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Helper function to get doctor's full name
  const getDoctorFullName = (doctorData) => {
    if (!doctorData) return "Doctor";

    // Try different name combinations in order of preference
    if (doctorData.fullName) return doctorData.fullName;
    if (doctorData.name) return doctorData.name;

    // Construct from firstName/lastName
    const firstName = doctorData.firstName || "";
    const lastName = doctorData.lastName || "";
    const constructedName = `${firstName} ${lastName}`.trim();

    return constructedName || "Doctor";
  };

  // Fetch user data using async/await
  const fetchUserData = async (user) => {
    try {
      // Get user data
      const userRef = ref(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        console.error("No user data found");
        navigate("/login");
        return;
      }

      const userData = userSnapshot.val();
      console.log("Current user data:", userData);

      const doctorFullName = getDoctorFullName(userData);
      let clinicId = (userData.clinicAffiliation || "").trim();

      if (!clinicId) {
        console.warn("Doctor has no clinic affiliation");
        setState((prev) => ({
          ...prev,
          currentDoctor: userData,
          currentClinic: null,
        }));
        setForm((prev) => ({
          ...prev,
          referDoctor: doctorFullName,
          userId: user.uid,
          clinic: "No Clinic",
          clinicId: "",
          addressLine: "",
          type: "",
        }));
        return;
      }

      // Fetch clinic data directly from clinics node
      const clinicRef = ref(database, `clinics/${clinicId}`);
      const clinicSnapshot = await get(clinicRef);

      if (!clinicSnapshot.exists()) {
        console.warn(`Clinic data not found for ID: ${clinicId}`);
        setState((prev) => ({
          ...prev,
          currentDoctor: userData,
          currentClinic: null,
        }));
        setForm((prev) => ({
          ...prev,
          referDoctor: doctorFullName,
          userId: user.uid,
          clinic: `Clinic ID: ${clinicId}`,
          clinicId,
          addressLine: "",
          type: "",
        }));
        return;
      }

      const clinicData = clinicSnapshot.val();
      console.log("Clinic data found:", clinicData);

      // Merge user and clinic data into state
      setState((prev) => ({
        ...prev,
        currentDoctor: userData,
        currentClinic: clinicData,
      }));

      // Update form
      setForm((prev) => ({
        ...prev,
        referDoctor: doctorFullName,
        userId: user.uid,
        clinic: clinicData.name || "Unknown Clinic",
        clinicId,
        addressLine: clinicData.addressLine || clinicData.address || "",
        type: clinicData.type || "",
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

  // Fetch exam types
  useEffect(() => {
    ["laboratoryTests", "imagingTests"].forEach((service) => {
      onValue(ref(database, `medicalServices/${service}`), (snap) => {
        const data = snap.val();
        if (data) {
          const items = Object.entries(data).map(([key, e]) => ({
            id: key,
            name: e.name,
            description: e.description,
            serviceFee: e.serviceFee || e.fee || e.price || null,
          }));
          setState((prev) => ({
            ...prev,
            examTypes: [
              ...prev.examTypes.filter(
                (t) => !items.some((i) => i.id === t.id)
              ),
              ...items,
            ],
          }));
        }
      });
    });
  }, []);

  // Fetch appointments - filtered by clinic and test with daily slot reset
  useEffect(() => {
    onValue(ref(database, `clinicLabRequests`), (snap) => {
      const data = snap.val();
      if (data) {
        const all = Object.values(data);

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];

        // Filter appointments for TODAY ONLY with selected test and clinic
        const todaysAppointments = all.filter((appointment) => {
          const appointmentDate = appointment.createdAt?.date;

          // Only include appointments that are:
          // 1. Scheduled for TODAY (not yesterday or any other day)
          // 2. For the same lab test
          // 3. At the same clinic
          return (
            appointmentDate === today &&
            appointment.labTestName === form.labTestName &&
            appointment.clinic === form.clinic
          );
        });

        console.log(
          `Found ${todaysAppointments.length} appointments for today (${today})`
        );

        setState((prev) => ({
          ...prev,
          appointments: todaysAppointments,
          bookedSlots: todaysAppointments.map(
            (appointment) => appointment.slotNumber
          ),
        }));
      } else {
        // No appointments data at all
        setState((prev) => ({
          ...prev,
          appointments: [],
          bookedSlots: [],
        }));
      }
    });
  }, [form.labTestName, form.clinic]); // Removed form.createdAt.date dependency

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
    const required = ["patientName", "labTestName"];

    if (required.includes(name)) {
      return value?.trim() ? null : true;
    }

    if (name === "slotNumber") {
      return value ? null : true;
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setForm((prev) => ({ ...prev, [name]: value }));
    setState((prev) => ({ ...prev, errors: { ...prev.errors, [name]: err } }));

    if (name === "labTestName") {
      setState((prev) => ({ ...prev, currentPage: 0 }));
      const selectedTest = state.examTypes.find((test) => test.name === value);
      setForm((prev) => ({
        ...prev,
        [name]: value,
        labTestId: selectedTest?.id || "",
        slotNumber: "",
      }));
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, slotNumber: true },
        selectedDescription: selectedTest ? selectedTest.description : "",
        selectedServiceFee: selectedTest ? selectedTest.serviceFee : null,
      }));
      setTimeout(
        () => slotRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
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

  const validate = () => {
    const errs = {};

    // Validate required fields
    const requiredFields = ["patientName", "labTestName", "slotNumber"];
    requiredFields.forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) errs[field] = true;
    });

    return errs;
  };

  const getEstimatedTime = (slotNumber) => {
    const slot = timeSlots.find((s) => s.number === parseInt(slotNumber));
    if (slot) {
      return slot.timeRange;
    }

    // Fallback calculation
    const sorted = state.appointments
      .filter((a) => parseInt(a.slotNumber) < parseInt(slotNumber))
      .sort((a, b) => parseInt(a.slotNumber) - parseInt(b.slotNumber));
    const baseTime = new Date();
    baseTime.setHours(8, 0, 0, 0);
    baseTime.setMinutes(baseTime.getMinutes() + sorted.length * 30);
    return baseTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setState((prev) => ({ ...prev, errors: validationErrors }));
    if (Object.keys(validationErrors).length > 0) return;

    setState((prev) => ({ ...prev, submitting: true, loading: true }));

    try {
      const estimatedTime = getEstimatedTime(form.slotNumber);
      const description =
        state.selectedDescription || "No description provided";
      const nameParts = form.patientName.trim().split(" ");
      const firstName =
        nameParts.length === 1
          ? nameParts[0]
          : nameParts.slice(0, -1).join(" ");
      const lastName =
        nameParts.length === 1 ? "" : nameParts[nameParts.length - 1];

      // Ensure all required fields have fallback values
      const doctorName = getDoctorFullName(state.currentDoctor);

      const clinicName =
        form.clinic || state.currentClinic?.name || "Unknown Clinic";

      const dataToPush = {
        ...form,
        referDoctor: doctorName, // Ensure this is never undefined
        clinic: clinicName, // Ensure this is never undefined
        estimatedTime,
        description,
        firstName,
        lastName,
        status: "Pending",
        serviceFee: state.selectedServiceFee || 0,
        patientId: state.selectedPatient?.id || "",
        patientComplaint: [], // Empty array since we're removing this
        emergencyContact: { name: "", phone: "", relation: "" }, // Empty object
        // Ensure all form fields are not undefined
        labTestName: form.labTestName || "",
        labTestId: form.labTestId || "",
        patientName: form.patientName || "",
        email: form.email || "",
        contactNumber: form.contactNumber || "",
        dateOfBirth: form.dateOfBirth || "",
        bloodType: form.bloodType || "",
        slotNumber: form.slotNumber || "",
        notes: form.notes || "",
        clinicId: form.clinicId || "",
        addressLine: form.addressLine || "",
        type: form.type || "",
        userId: form.userId || "",
        createdAt: getCurrentDateTime(), // Ensure it's always current
      };

      await set(ref(database, `clinicLabRequests/${newRef.key}`), dataToPush);

      alert("✅ Lab test request submitted successfully!");

      // Reset form but keep doctor and clinic info
      const doctorFullName = getDoctorFullName(state.currentDoctor);
      setForm({
        labTestName: "",
        labTestId: "",
        patientName: "",
        email: "",
        contactNumber: "",
        dateOfBirth: "",
        bloodType: "",
        referDoctor: doctorFullName,
        userId: form.userId,
        slotNumber: "",
        notes: "",
        clinic: clinicName,
        clinicId: form.clinicId,
        addressLine:
          state.currentClinic?.addressLine ||
          state.currentClinic?.address ||
          "",
        type: state.currentClinic?.type || "",
        createdAt: getCurrentDateTime(),
      });

      setState((prev) => ({
        ...prev,
        selectedServiceFee: null,
        selectedPatient: null,
        searchTerm: "",
        errors: {
          patientName: true,
          labTestName: true,
          slotNumber: true,
        },
      }));

      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Submit error:", error);
      alert("❌ " + error.message);
    }

    setState((prev) => ({ ...prev, submitting: false, loading: false }));
  };

  const renderSlots = () => {
    const slotsPerPage = 20;
    const start = state.currentPage * slotsPerPage;
    const end = start + slotsPerPage;
    const currentSlots = timeSlots.slice(start, end);

    return currentSlots.map((slot) => {
      const isBooked = state.bookedSlots.includes(slot.number.toString());
      const isSelected = form.slotNumber === slot.number.toString();

      return (
        <div
          key={slot.number}
          onClick={() => {
            if (!isBooked) {
              setForm((f) => ({ ...f, slotNumber: slot.number.toString() }));
              setState((prev) => ({
                ...prev,
                errors: { ...prev.errors, slotNumber: null },
              }));
            }
          }}
          className={`rounded-lg p-3 text-center cursor-pointer transition-all transform hover:scale-105 shadow-sm min-h-[80px] flex flex-col justify-center ${
            isBooked
              ? "bg-red-400 text-white cursor-not-allowed opacity-75"
              : isSelected
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
              : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600"
          }`}
        >
          <div className="font-semibold text-sm">{slot.display}</div>
          <div className="text-xs mt-1 opacity-90">{slot.timeRange}</div>
        </div>
      );
    });
  };

  const maxPages = Math.ceil(timeSlots.length / 20);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans relative">
      {state.loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">
              Submitting Lab Test Request...
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Please wait while we process the request
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-center flex-1">
              Request Lab Test
            </h1>
            <div className="w-40"></div>
          </div>
          <p className="text-center text-blue-100 mt-2">
            Request diagnostic tests and lab work for patients
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
                Requesting Doctor
              </h3>
              <p>
                <strong>Name:</strong> Dr.{" "}
                {getDoctorFullName(state.currentDoctor)}
              </p>
              {state.currentDoctor.specialty && (
                <p>
                  <strong>Specialty:</strong> {state.currentDoctor.specialty}
                </p>
              )}
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
                <strong>Address:</strong>{" "}
                {state.currentClinic.addressLine || state.currentClinic.address}
              </p>
              <p>
                <strong>Type:</strong> {state.currentClinic.type}
              </p>
            </div>
          )}

          {/* Lab Test Selection */}
          <div className="relative mb-4">
            <Microscope className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              name="labTestName"
              value={form.labTestName}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                state.errors.labTestName
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              disabled={state.submitting}
            >
              <option value="">-- Select Lab Test --</option>
              {state.examTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            {state.errors.labTestName ? (
              <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
            ) : form.labTestName ? (
              <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-green-600" />
            ) : null}
            {state.errors.labTestName && (
              <p className="text-red-500 text-sm mt-1">Lab test is required</p>
            )}
          </div>

          {state.selectedDescription && (
            <div className="text-gray-600 text-sm mt-2 bg-gray-50 rounded p-2 border border-gray-200 mb-4">
              {state.selectedDescription}
            </div>
          )}

          {state.selectedServiceFee && (
            <div className="flex items-center space-x-2 bg-green-50 rounded-lg p-3 border border-green-200 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Service Fee
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

        {/* Time Slots - Third Column */}
        <div
          ref={slotRef}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Select Time Slot
            </h2>
          </div>

          {form.labTestName ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <button
                  disabled={state.currentPage === 0}
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      currentPage: Math.max(0, prev.currentPage - 1),
                    }))
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-gray-700">
                    Page {state.currentPage + 1} of {maxPages}
                  </span>
                </div>
                <button
                  disabled={state.currentPage >= maxPages - 1}
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 justify-items-center mb-4">
                {renderSlots()}
              </div>

              <div className="flex justify-center space-x-6 text-sm">
                {[
                  { color: "from-green-400 to-blue-500", label: "Available" },
                  { color: "bg-red-400", label: "Booked" },
                  { color: "from-blue-600 to-purple-600", label: "Selected" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded ${
                        color.includes("from")
                          ? `bg-gradient-to-r ${color}`
                          : color
                      }`}
                    ></div>
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>

              {state.errors.slotNumber && (
                <p className="text-red-500 text-sm mt-4 text-center p-3 bg-red-50 rounded-lg">
                  Please select a time slot
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                Please select a lab test first
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Time slots will be available after selecting a test
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Request Summary - Full Width Below */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Microscope className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Request Summary</h2>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center text-3xl mx-auto shadow-lg">
              🧪
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              form.slotNumber && {
                title: "Time Slot",
                content: (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        {timeSlots.find(
                          (s) => s.number === parseInt(form.slotNumber)
                        )?.display || `Slot #${form.slotNumber}`}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Time: {getEstimatedTime(form.slotNumber)}
                    </p>
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
                      {state.currentClinic?.addressLine ||
                        state.currentClinic?.address ||
                        "Not provided"}
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
              form.labTestName && {
                title: "Lab Test Details",
                content: (
                  <div className="space-y-2">
                    <p>
                      <strong>Test:</strong> {form.labTestName}
                    </p>
                    {state.selectedDescription && (
                      <p className="text-sm text-gray-600">
                        {state.selectedDescription}
                      </p>
                    )}
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
              <span>Submitting Request...</span>
            </div>
          ) : (
            "Submit Lab Test Request"
          )}
        </button>
      </div>
    </div>
  );
}

export default RequestLabTest;

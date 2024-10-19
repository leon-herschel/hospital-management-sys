import { useState, useEffect } from "react";
import { ref, push, set, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import "../../App.css";
import { generatePDF } from "./GeneratePDF";
import { getAuth } from "firebase/auth"; // Import auth to get current user

function AddPatient({ isOpen, toggleModal }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("");
  const [roomType, setRoomType] = useState(""); // Automatically set based on user's department
  const [dateTime, setDateTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]); // State to store department list
  const [department, setDepartment] = useState(""); // State for the logged-in user's department

  // Error state variables
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [birthError, setBirthError] = useState(false);
  const [ageError, setAgeError] = useState(false);
  const [genderError, setGenderError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [roomTypeError, setRoomTypeError] = useState(false);
  const [dateTimeError, setDateTimeError] = useState(false);

  const formatDateToLocal = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const currentDateTime = new Date();
    setDateTime(formatDateToLocal(currentDateTime));
  }, []);

  useEffect(() => {
    if (birth) {
      const calculatedAge = calculateAge(new Date(birth));
      setAge(calculatedAge);
    } else {
      setAge("");
    }
  }, [birth]);

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Fetch departments from Firebase
  useEffect(() => {
    const fetchDepartments = async () => {
      const departmentsRef = ref(database, "departments");
      const snapshot = await get(departmentsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const departmentList = Object.keys(data);
        setDepartments(departmentList); // Set department names (ICU, CSR, Pharmacy, etc.)
      }
    };
    fetchDepartments();
  }, []);

  // Fetch logged-in user's department and set roomType
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userDepartmentRef = ref(database, `users/${user.uid}/department`);
      get(userDepartmentRef).then((snapshot) => {
        const departmentData = snapshot.val();
        if (departmentData) {
          setDepartment(departmentData); // Set the user's department
          if (departmentData !== "Admin") {
            setRoomType(departmentData); // Set roomType to user's department
          } else {
            setRoomType("");
          }
        }
      });
    }
  }, []);

  // Function to format the date as "MM/DD/YYYY, HH:mm:ss AM/PM"
  const formatTimestamp = (date) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const handleSubmit = () => {
    // Reset error states
    setFirstNameError(false);
    setLastNameError(false);
    setBirthError(false);
    setAgeError(false);
    setGenderError(false);
    setContactError(false);
    setStatusError(false);
    setRoomTypeError(false);
    setDateTimeError(false);

    let hasError = false;

    // Validate input fields
    if (!firstName) {
      setFirstNameError(true);
      hasError = true;
    }
    if (!lastName) {
      setLastNameError(true);
      hasError = true;
    }
    if (!birth) {
      setBirthError(true);
      hasError = true;
    }
    if (!age) {
      setAgeError(true);
      hasError = true;
    }
    if (!gender) {
      setGenderError(true);
      hasError = true;
    }
    if (!contact || contact.length !== 11) {
      setContactError(true);
      hasError = true;
    }
    if (!status) {
      setStatusError(true);
      hasError = true;
    }
    if (status === "Inpatient" && !roomType) {
      setRoomTypeError(true);
      hasError = true;
    }
    if (!dateTime) {
      setDateTimeError(true);
      hasError = true;
    }

    if (hasError) {
      return; // Stop if there's an error
    }

    setSubmitting(true); // Disable the button and show loading

    const patientRef = ref(database, "patient");
    const newPatientRef = push(patientRef);
    const uniqueKey = newPatientRef.key;

    // Get the current date as a timestamp string
    const timestamp = formatTimestamp(new Date());

    const patientInfo = {
      firstName,
      lastName,
      birth,
      age,
      gender,
      contact,
      status,
      roomType,
      qrData: uniqueKey,
      dateTime: timestamp,  // Use formatted timestamp
    };

    set(newPatientRef, patientInfo)
      .then(() => {
        alert("Patient has been added successfully!");
        generatePDF(patientInfo);

        setSubmitting(false); // Re-enable the button
        toggleModal();
        resetForm();
      })
      .catch((error) => {
        setSubmitting(false); // Re-enable the button
        alert("Error adding patient: ", error);
      });
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setBirth("");
    setAge("");
    setGender("");
    setContact("");
    setStatus("");
    setRoomType(""); // Reset roomType as well
    setDateTime("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative max-h-screen overflow-auto">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
          onClick={toggleModal}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-6">Add New Patient</h2>

        <div className="mb-4">
          <label htmlFor="firstname" className="block text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              firstNameError ? "border-red-500" : "border-gray-300"
            }`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={submitting} // Disable input when submitting
          />
          {firstNameError && (
            <p className="text-red-500 mt-1">First Name is required</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="lastname" className="block text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              lastNameError ? "border-red-500" : "border-gray-300"
            }`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={submitting} // Disable input when submitting
          />
          {lastNameError && (
            <p className="text-red-500 mt-1">Last Name is required</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="birth" className="block text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            id="birth"
            name="birth"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              birthError ? "border-red-500" : "border-gray-300"
            }`}
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            disabled={submitting} // Disable input when submitting
          />
          {birthError && (
            <p className="text-red-500 mt-1">Birth date is required</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="age" className="block text-gray-700 mb-2">
            Age
          </label>
          <input
            type="text"
            id="age"
            name="age"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              ageError ? "border-red-500" : "border-gray-300"
            }`}
            value={age}
            readOnly
          />
          {ageError && <p className="text-red-500 mt-1">Age is required</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="gender" className="block text-gray-700 mb-2">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              genderError ? "border-red-500" : "border-gray-300"
            }`}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            disabled={submitting} // Disable input when submitting
          >
            <option value="" disabled>
              Select Gender
            </option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {genderError && (
            <p className="text-red-500 mt-1">Gender is required</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="contact" className="block text-gray-700 mb-2">
            Contact Number
          </label>
          <input
            type="number"
            id="contact"
            name="contact"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              contactError ? "border-red-500" : "border-gray-300"
            }`}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={submitting} // Disable input when submitting
          />
          {contactError && (
            <p className="text-red-500 mt-1">Contact must be 11 digits</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="block text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              statusError ? "border-red-500" : "border-gray-300"
            }`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting} // Disable input when submitting
          >
            <option value="" disabled>
              Select Status
            </option>
            <option value="Inpatient">Inpatient</option>
            <option value="Outpatient">Outpatient</option>
          </select>
          {statusError && (
            <p className="text-red-500 mt-1">Status is required</p>
          )}
        </div>

        {status === "Inpatient" && (
          <div className="mb-4">
            <label htmlFor="roomType" className="block text-gray-700 mb-2">
              Department
            </label>
            {department === "Admin" ? (
              // Show dropdown for Admin to select room type
              <select
                id="roomType"
                name="roomType"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                  roomTypeError ? "border-red-500" : "border-gray-300"
                }`}
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                disabled={submitting} // Disable input when submitting
              >
                <option value="" disabled>
                  Select Department
                </option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            ) : (
              // Automatically set and make it read-only for non-admin users
              <input
                type="text"
                id="roomType"
                name="roomType"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                  roomTypeError ? "border-red-500" : "border-gray-300"
                }`}
                value={roomType} // Automatically set from user's department
                readOnly // Make this read-only for non-admin users
              />
            )}
            {roomTypeError && (
              <p className="text-red-500 mt-1">
                Department is required for inpatients
              </p>
            )}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="dateTime" className="block text-gray-700 mb-2">
            Date/Time
          </label>
          <input
            type="datetime-local"
            id="dateTime"
            name="dateTime"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              dateTimeError ? "border-red-500" : "border-gray-300"
            }`}
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            disabled={submitting} // Disable input when submitting
          />
          {dateTimeError && (
            <p className="text-red-500 mt-1">Date and time is required</p>
          )}
        </div>

        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          onClick={handleSubmit}
          disabled={submitting} // Disable the button when submitting
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

export default AddPatient;

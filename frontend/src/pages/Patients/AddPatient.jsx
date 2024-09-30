import { useState, useEffect } from "react";
import { ref, push, set } from "firebase/database";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { database } from "../../firebase/firebase";
import "../../App.css";

function AddPatient({ isOpen, toggleModal }) {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("");
  const [roomType, setRoomType] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [submitting, setSubmitting] = useState(false); // Add submitting state

  const [nameError, setNameError] = useState(false);
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

  const generatePDF = async (patientInfo) => {
    const doc = new jsPDF();
    doc.text(`Name: ${patientInfo.name}`, 90, 20);
    const qrCodeDataUrl = await QRCode.toDataURL(patientInfo.qrData, {
      width: 100,
    });
    doc.addImage(qrCodeDataUrl, "PNG", 10, 0, 80, 80);
    doc.output("dataurlnewwindow");
  };

  const handleSubmit = () => {
    setNameError(false);
    setBirthError(false);
    setAgeError(false);
    setGenderError(false);
    setContactError(false);
    setStatusError(false);
    setRoomTypeError(false);
    setDateTimeError(false);

    let hasError = false;

    if (!name) {
      setNameError(true);
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

    const patientInfo = {
      name,
      birth,
      age,
      gender,
      contact,
      status,
      roomType,
      dateTime,
      qrData: uniqueKey,
      dateTime: dateTime,
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
    setName("");
    setBirth("");
    setAge("");
    setGender("");
    setContact("");
    setStatus("");
    setRoomType("");
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
          <label htmlFor="name" className="block text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
              nameError ? "border-red-500" : "border-gray-300"
            }`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting} // Disable input when submitting
          />
          {nameError && <p className="text-red-500 mt-1">Name is required</p>}
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
              Room Type
            </label>
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
                Select Room
              </option>
              <option value="Private">Private</option>
              <option value="Public">Public</option>
            </select>
            {roomTypeError && (
              <p className="text-red-500 mt-1">
                Room type is required for inpatients
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
        <div>
          <label htmlFor="datetime">Date and Time</label>
          <input type="datetime-local" id="datetime" name="datetime" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300" value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}/>
        </div>
        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          onClick={handleSubmit}
          disabled={submitting} // Disable the button when submitting
        >
          {submitting ? "Submitting..." : "Submit"} {/* Show loading text */}
        </button>
      </div>
    </div>
  );
}

export default AddPatient;

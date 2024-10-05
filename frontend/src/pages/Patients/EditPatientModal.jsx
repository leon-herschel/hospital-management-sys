import React, { useState, useEffect } from "react";

function EditPatientModal({
  isOpen,
  toggleModal,
  currentPatient,
  handleUpdate,
}) {
  // Set form state with current patient data or fallback values
  const [formData, setFormData] = useState({
    name: "",
    birth: "",
    age: "",
    gender: "",
    contact: "",
    status: "",
    roomType: "",
  });

  // State for error handling
  const [errors, setErrors] = useState({
    name: false,
    birth: false,
    gender: false,
    contact: false,
    status: false,
    roomType: false,
  });

  // Disable submit button while submitting
  const [submitting, setSubmitting] = useState(false);

  // Populate form data once currentPatient is available
  useEffect(() => {
    if (currentPatient) {
      setFormData({
        name: currentPatient.name || "",
        birth: currentPatient.birth || "",
        age: calculateAge(currentPatient.birth) || "",
        gender: currentPatient.gender || "",
        contact: currentPatient.contact || "",
        status: currentPatient.status || "",
        roomType: currentPatient.roomType || "",
      });
    }
  }, [currentPatient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "birth") {
      const calculatedAge = calculateAge(value);
      setFormData((prevData) => ({
        ...prevData,
        age: calculatedAge,
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Reset errors
    setErrors({
      name: false,
      birth: false,
      gender: false,
      contact: false,
      status: false,
      roomType: false,
    });

    // Validate the fields
    let hasError = false;

    if (!formData.name) {
      setErrors((prev) => ({ ...prev, name: true }));
      hasError = true;
    }
    if (!formData.birth) {
      setErrors((prev) => ({ ...prev, birth: true }));
      hasError = true;
    }
    if (!formData.gender) {
      setErrors((prev) => ({ ...prev, gender: true }));
      hasError = true;
    }
    if (!formData.contact || formData.contact.length !== 11) {
      setErrors((prev) => ({ ...prev, contact: true }));
      hasError = true;
    }
    if (!formData.status) {
      setErrors((prev) => ({ ...prev, status: true }));
      hasError = true;
    }
    if (formData.status === "Inpatient" && !formData.roomType) {
      setErrors((prev) => ({ ...prev, roomType: true }));
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true); // Disable submit button

    handleUpdate({
      ...formData,
    });

    setSubmitting(false); // Re-enable the button after updating
  };

  // Function to calculate age from date of birth
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (!isOpen || !currentPatient) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3 max-h-full overflow-y-auto">
        {/* The content of the modal is now scrollable if it overflows */}
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-center">Edit Patient</h2>

          {/* Display the form fields */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              disabled={submitting}
            />
            {errors.name && (
              <p className="text-red-500 mt-1">Name is required</p>
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
              value={formData.birth}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                errors.birth ? "border-red-500" : "border-gray-300"
              }`}
              disabled={submitting}
            />
            {errors.birth && (
              <p className="text-red-500 mt-1">Date of birth is required</p>
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
              value={formData.age}
              readOnly
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring border-gray-300"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="gender" className="block text-gray-700 mb-2">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
              disabled={submitting}
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {errors.gender && (
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
              value={formData.contact}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                errors.contact ? "border-red-500" : "border-gray-300"
              }`}
              disabled={submitting}
            />
            {errors.contact && (
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
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                errors.status ? "border-red-500" : "border-gray-300"
              }`}
              disabled={submitting}
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
            </select>
            {errors.status && (
              <p className="text-red-500 mt-1">Status is required</p>
            )}
          </div>

          {/* Conditionally display "Type of Room" only if status is "Inpatient" */}
          {formData.status === "Inpatient" && (
            <div className="mb-4">
              <label htmlFor="roomType" className="block text-gray-700 mb-2">
                Type of Room
              </label>
              <select
                id="roomType"
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                  errors.roomType ? "border-red-500" : "border-gray-300"
                }`}
                disabled={submitting}
              >
                <option value="" disabled>
                  Select Room
                </option>
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>
              {errors.roomType && (
                <p className="text-red-500 mt-1">
                  Room type is required for inpatients
                </p>
              )}
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-between space-x-4">
            <div className="w-full">
              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Update"}
              </button>
            </div>

            <div className="w-full">
              <button
                type="button"
                onClick={toggleModal}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPatientModal;

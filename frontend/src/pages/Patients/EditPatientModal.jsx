import React, { useState, useEffect } from "react";

function EditPatientModal({ isOpen, toggleModal, currentPatient, handleUpdate }) {
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

  // Populate form data once currentPatient is available
  useEffect(() => {
    if (currentPatient) {
      setFormData({
        name: currentPatient.name || "",
        birth: currentPatient.birth || "",
        age: currentPatient.age || "",
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleUpdate({
      ...formData,
    });
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="age" className="block text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="" disabled>Select Status</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
            </select>
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="" disabled>Select Room</option>
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-between space-x-4">
            <div className="w-full">
              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Update
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

import { useState, useEffect } from "react";
import { ref, get, push, set } from "firebase/database";
import { database } from "../../../firebase/firebase";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

const AddDoctorsModal = ({ showModal, setShowModal }) => {
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("+63");
  const [clinicAffiliations, setClinicAffiliations] = useState([]);
  const [clinicOptions, setClinicOptions] = useState([]);
  const [clinicSearch, setClinicSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      const clinicsRef = ref(database, "clinics");
      const snapshot = await get(clinicsRef);
      if (snapshot.exists()) {
        const options = [];
        snapshot.forEach((child) => {
          options.push({ id: child.key, name: child.val().name });
        });
        setClinicOptions(options);
      }
    };

    if (showModal) fetchClinics();
  }, [showModal]);

  const handleClinicSelect = (clinicName) => {
    if (!clinicAffiliations.includes(clinicName)) {
      setClinicAffiliations([...clinicAffiliations, clinicName]);
    }
    setClinicSearch("");
  };

  const handleClinicRemove = (name) => {
    setClinicAffiliations(clinicAffiliations.filter((c) => c !== name));
  };

  const isValidPHNumber = (num) => /^\+639\d{9}$/.test(num);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidPHNumber(contactNumber)) {
      alert("Invalid contact number. Must start with +639 and be 13 characters long.");
      return;
    }

    const newDoctor = {
      userId,
      fullName,
      specialty: "Generalist",
      isGeneralist: true,
      isSpecialist: false,
      contactNumber,
      clinicAffiliations,
    };

    try {
      const newDocRef = push(ref(database, "doctors"));
      await set(newDocRef, newDoctor);

      setShowSuccessModal(true); // Show success modal before closing

      setTimeout(() => {
        setShowSuccessModal(false);
        setShowModal(false);
      }, 2000);

      // Reset form
      setUserId("");
      setFullName("");
      setContactNumber("+63");
      setClinicAffiliations([]);
      setClinicSearch("");
    } catch (error) {
      console.error("Error adding doctor:", error);
    }
  };

  const filteredClinics = clinicOptions.filter(
    (clinic) =>
      clinic.name.toLowerCase().includes(clinicSearch.toLowerCase()) &&
      !clinicAffiliations.includes(clinic.name)
  );

  if (!showModal && !showSuccessModal) return null;

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6">Add Doctor</h2>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[500px] overflow-y-auto">
              <div>
                <label className="block text-gray-700">User ID</label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-gray-700">Doctor Type</label>
                <input
                  type="text"
                  readOnly
                  value="Generalist"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={contactNumber}
                  onChange={(e) => {
                    let input = e.target.value;
                    if (!input.startsWith("+63")) {
                      input = "+63" + input.replace(/[^0-9]/g, "");
                    } else {
                      input = "+63" + input.substring(3).replace(/[^0-9]/g, "");
                    }
                    if (input.length > 13) input = input.slice(0, 13);
                    setContactNumber(input);
                  }}
                  maxLength={13}
                  placeholder="+639XXXXXXXXX"
                  className={`w-full mt-1 p-2 border rounded-md ${
                    !isValidPHNumber(contactNumber) && contactNumber.length > 3
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  pattern="^\+639\d{9}$"
                  title="Phone number must start with +639 and have 9 digits after that"
                />
                {!isValidPHNumber(contactNumber) && contactNumber.length > 3 && (
                  <p className="text-red-500 text-sm mt-1">
                    Contact must be +639 followed by 9 digits
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700">Clinic Affiliations</label>
                <input
                  type="text"
                  placeholder="Type to search clinic..."
                  value={clinicSearch}
                  onChange={(e) => setClinicSearch(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                />
                {clinicSearch && filteredClinics.length > 0 && (
                  <ul className="border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto bg-white shadow">
                    {filteredClinics.map((clinic) => (
                      <li
                        key={clinic.id}
                        onClick={() => handleClinicSelect(clinic.name)}
                        className="p-2 hover:bg-slate-100 cursor-pointer"
                      >
                        {clinic.name}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap mt-2 gap-2">
                  {clinicAffiliations.map((name) => (
                    <span
                      key={name}
                      className="bg-slate-200 text-sm px-2 py-1 rounded flex items-center"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => handleClinicRemove(name)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Doctor Added Successfully</h2>
            <p className="text-gray-700">The doctor has been added to the system.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AddDoctorsModal;

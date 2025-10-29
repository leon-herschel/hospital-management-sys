import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { ref, get } from "firebase/database";
import { database } from "../../../firebase/firebase";



const DoctorForm = ({
  prcId,
  setPrcId,
  prcExpiry,
  setPrcExpiry,
  birNumber,
  setBirNumber,
  prcIdFile,
  setPrcIdFile,
  prcIdFileUrl,
  setPrcIdFileUrl,
  selectedDepartment,
  setSelectedDepartment,
  selectedClinic,
  setSelectedClinic,
  departments,
  clinics,
  getFilteredDepartments,
  setShowAddDepartmentModal
}) => {

  const [currentUserRole, setCurrentUserRole] = useState(""); 
  const [expiryError, setExpiryError] = useState("");

   useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const userRef = ref(database, `users/${user.uid}/role`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setCurrentUserRole(snapshot.val());
          } else {
            console.warn("No role found for user");
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <div className="w-2 h-6 bg-indigo-600 rounded-full mr-3"></div>
        Doctor Information
      </h3>

     <div className="space-y-6">
  {/* Department and Clinic Selection */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* ✅ Clinic Affiliation Dropdown */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Clinic Affiliation <span className="text-red-500">*</span>
      </label>
      <select
        value={selectedClinic}
        onChange={(e) => setSelectedClinic(e.target.value)}
        required
        disabled={currentUserRole !== "superadmin"} // 👈 disable for non-superadmins
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
          focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white 
          ${currentUserRole !== "superadmin" ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <option value="" disabled>
          {currentUserRole !== "superadmin"
            ? "You are restricted to your assigned clinic"
            : "Select a clinic"}
        </option>

        {clinics.map((clinic) => (
          <option key={clinic.id} value={clinic.id}>
            {clinic.name}
          </option>
        ))}
      </select>

      {/* Info note for non-superadmins */}
      {currentUserRole !== "superadmin" && (
        <p className="text-xs text-gray-500 italic mt-1">
          Only superadmins can change clinic affiliation.
        </p>
      )}
    </div>


          <div className="space-y-2">
            <label className="flex justify-between items-center text-sm font-medium text-gray-700">
              <span>Select Department <span className="text-red-500">*</span></span>
              <button
                type="button"
                onClick={() => setShowAddDepartmentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded-full transition-colors duration-200"
              >
                + Add Department
              </button>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="" disabled>Select a department</option>
              {getFilteredDepartments().map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor-specific fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              PRC License Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={prcId}
              onChange={(e) => setPrcId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter PRC license number"
            />
          </div>

      <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    PRC License Expiry <span className="text-red-500">*</span>
  </label>
  <input
    type="date"
    value={prcExpiry}
    onChange={(e) => {
      const selectedDate = new Date(e.target.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ignore time for comparison

      if (selectedDate < today) {
        setExpiryError("PRC License Expiry cannot be a past date.");
        setPrcExpiry(""); // Clear invalid input
      } else {
        setExpiryError(""); // Clear error when valid
        setPrcExpiry(e.target.value);
      }
    }}
    required
    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
      expiryError ? "border-red-500" : "border-gray-300"
    }`}
  />
  {expiryError && (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-1">
      {expiryError}
    </p>
  )}
</div>


          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              BIR Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={birNumber}
              onChange={(e) => setBirNumber(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter BIR number"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload PRC ID
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPrcIdFile(e.target.files[0])}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {prcIdFileUrl && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <img
                src={prcIdFileUrl}
                alt="PRC ID Preview"
                className="w-32 h-20 object-cover border rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorForm;
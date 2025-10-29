import { useState } from "react";
import { ref, push, set } from "firebase/database";
import { database } from "../../../firebase/firebase";
import { CheckCircle, AlertCircle, X } from "lucide-react";

function AddMedicalServices({ open, onClose }) {
  const [serviceType, setServiceType] = useState("consultationTypes");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceFee, setserviceFee] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Name is required");
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const serviceRef = ref(database, `medicalServices/${serviceType}`);
      const newServiceRef = push(serviceRef);

      // Only include serviceFee in data if it's not a consultation type
      const data =
        serviceType === "consultationTypes"
          ? { name, description }
          : { name, description, serviceFee };

      await set(newServiceRef, data);

      setName("");
      setDescription("");
      setServiceType("consultationTypes");
      setserviceFee("");
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding service:", error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  if (!open && !showSuccessModal && !showErrorModal) return null;

  // Don't show form if success modal is showing
  const shouldShowForm = open && !showSuccessModal;

  return (
    <>
      {/* Main Form Modal - Hide completely when success modal shows */}
      {shouldShowForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Add Medical Service
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Service Type
                </label>
                <select
                  className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="consultationTypes">Consultation Type</option>
                  <option value="imagingTests">Imaging Test</option>
                  <option value="laboratoryTests">Laboratory Test</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter service name"
                  className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  placeholder="Enter service description"
                  className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  disabled={isSubmitting}
                />
              </div>

              {/* Only show service fee for imaging and laboratory tests, not for consultation types */}
              {serviceType !== "consultationTypes" && (
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Service Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-medium">
                      ₱
                    </span>
                    <input
                      type="number"
                      placeholder="Enter fee"
                      className="w-full border-2 border-gray-300 pl-8 pr-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      value={serviceFee}
                      onChange={(e) => setserviceFee(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Service</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600 mb-4">
                Medical service has been added successfully.
              </p>
              <div className="text-sm mb-6 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
                <div className="flex items-center justify-center">
                  <span className="mr-2">✅</span>
                  <span>The service is now available in the system.</span>
                </div>
              </div>
              <button
                onClick={closeSuccessModal}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error!</h2>
              <p className="text-gray-600 mb-4">
                An error occurred while adding the medical service.
              </p>
              <div className="text-sm mb-6 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <div className="flex items-center justify-center">
                  <span className="mr-2">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
              <button
                onClick={closeErrorModal}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddMedicalServices;

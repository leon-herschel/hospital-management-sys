import { CheckIcon } from "@heroicons/react/24/solid";

const UserAddPatientSuccessModal = ({ 
  isVisible, 
  onClose, 
  patientData, 
  emailStatus 
}) => {
  console.log("Success modal render - isVisible:", isVisible, "patientData:", patientData);
  
  if (!isVisible) return null;

  const handleClose = () => {
    console.log("Success modal close button clicked");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Patient Account Created Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            The patient account has been created and saved to the database. 
            The patient can now log in with their credentials.
          </p>
          
          {/* Account Details Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Account Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {patientData?.firstName} {patientData?.lastName}</p>
              <p><span className="font-medium">Email:</span> {patientData?.email}</p>
              <p><span className="font-medium">Role:</span> Patient</p>
              <p><span className="font-medium">Date Created:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {emailStatus && (
            <div
              className={`text-sm mb-6 p-3 rounded-lg ${
                emailStatus.includes("successfully")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-orange-50 text-orange-700 border border-orange-200"
              }`}
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">📧</span>
                <span>{emailStatus}</span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mb-6 p-2 bg-blue-50 rounded border border-blue-200">
            The patient's medical information has been securely stored and is ready for use during appointments.
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAddPatientSuccessModal;